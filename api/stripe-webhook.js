// ============================================================
// AI Explorers Academy — Stripe webhook
// Vercel Serverless Function.  POST /api/stripe-webhook
//
// Receives Stripe events (we subscribe ONLY to `checkout.session.completed`),
// verifies the webhook signature, and processes the completed checkout so
// purchases can be fulfilled (starting with the AI Parenting Survival Guide).
//
// Security:
//   • The Stripe signing secret lives in a Vercel Environment Variable and is
//     NEVER shipped to the browser (this file runs only on the server).
//   • The raw request body is verified with an HMAC-SHA256 signature check using
//     constant-time comparison + a 5-minute timestamp tolerance (Stripe's scheme).
//   • bodyParser is disabled so we can read the exact raw bytes Stripe signed.
//
// Required Vercel env var (add in Project → Settings → Environment Variables):
//   STRIPE_WEBHOOK_SECRET   – the endpoint's signing secret ("whsec_…")
//
// No npm dependencies — uses Node's built-in `crypto`, matching the other
// zero-dependency functions in this /api folder.
// ============================================================

const crypto = require("crypto");

module.exports = async (req, res) => {
  // --- Temporary health check (safe to remove) ---
  // GET returns whether the route is deployed and whether the signing secret is
  // configured. It exposes only a boolean — never the secret value itself.
  if (req.method === "GET") {
    return res.status(200).json({
      status: "ok",
      route: "/api/stripe-webhook",
      deployed: true,
      stripe_webhook_secret_configured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      handles: ["checkout.session.completed"],
      note: "Health check only — Stripe events must be POSTed with a valid signature.",
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  var secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    // Route is live but the signing secret hasn't been added in Vercel yet.
    return res.status(500).json({ error: "Stripe webhook is not configured yet." });
  }

  var rawBody;
  try {
    rawBody = await getRawBody(req);
  } catch (e) {
    return res.status(400).json({ error: "Could not read request body." });
  }

  var event;
  try {
    event = verifyStripeEvent(rawBody, req.headers["stripe-signature"], secret);
  } catch (e) {
    // Return a non-2xx so Stripe marks delivery failed; don't leak internals.
    return res.status(400).send("Webhook signature verification failed.");
  }

  try {
    if (event.type === "checkout.session.completed") {
      var session = event.data.object || {};
      var email =
        (session.customer_details && session.customer_details.email) ||
        session.customer_email ||
        null;

      // --- Fulfillment hook (AI Parenting Survival Guide, then future products) ---
      // Everything needed is on `session`: id, amount_total, currency, metadata, email,
      // payment_status. Wire actual delivery here (e.g. email the download / grant access).
      console.log("[stripe] checkout.session.completed", {
        id: session.id,
        email: email,
        amount_total: session.amount_total,
        currency: session.currency,
        payment_status: session.payment_status,
      });
    }
    // Only checkout.session.completed is subscribed in Stripe; ignore anything else.
  } catch (e) {
    // Log but still acknowledge — a valid, verified event was received.
    console.error("[stripe] handler error", e);
  }

  return res.status(200).json({ received: true });
};

// Disable Vercel's automatic body parsing so the raw signed bytes are preserved.
module.exports.config = { api: { bodyParser: false } };

// ---- helpers ----

async function getRawBody(req) {
  // If a raw body is already provided (some runtimes), use it verbatim.
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body, "utf8");
  var chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk, "utf8") : chunk);
  }
  return Buffer.concat(chunks);
}

function verifyStripeEvent(payloadBuffer, sigHeader, secret) {
  if (!sigHeader) throw new Error("Missing Stripe-Signature header");

  var timestamp = null;
  var signatures = [];
  String(sigHeader).split(",").forEach(function (part) {
    var idx = part.indexOf("=");
    if (idx === -1) return;
    var key = part.slice(0, idx).trim();
    var val = part.slice(idx + 1).trim();
    if (key === "t") timestamp = val;
    else if (key === "v1") signatures.push(val);
  });
  if (!timestamp || signatures.length === 0) {
    throw new Error("Malformed Stripe-Signature header");
  }

  // Replay protection: reject events outside a 5-minute tolerance.
  var nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - parseInt(timestamp, 10)) > 300) {
    throw new Error("Timestamp outside tolerance");
  }

  var signedPayload = timestamp + "." + payloadBuffer.toString("utf8");
  var expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");
  var expectedBuf = Buffer.from(expected, "utf8");

  // Stripe may send multiple v1 signatures during secret rotation — accept any match.
  var matched = signatures.some(function (v1) {
    var candidate = Buffer.from(v1, "utf8");
    return (
      candidate.length === expectedBuf.length &&
      crypto.timingSafeEqual(candidate, expectedBuf)
    );
  });
  if (!matched) throw new Error("Signature verification failed");

  return JSON.parse(payloadBuffer.toString("utf8"));
}
