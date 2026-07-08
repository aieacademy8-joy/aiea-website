// ============================================================
// AI Explorers Academy — Post-purchase access check
// Vercel Serverless Function.  GET /api/check-access?session_id=cs_…
//
// Verifies a *paid* Stripe Checkout Session for the AI Parenting Survival Guide
// (server-side, using STRIPE_SECRET_KEY) and returns a short-lived, HMAC-signed
// download link. The PDF URL is never exposed here — only a token that
// /api/download-guide will validate before streaming the file.
//
// Required Vercel env vars:
//   STRIPE_SECRET_KEY        – Stripe secret key (sk_live_…) to retrieve the session
//   DOWNLOAD_TOKEN_SECRET    – HMAC secret used to sign download tokens
// Optional:
//   STRIPE_PARENTING_PAYMENT_LINK – Payment Link id (plink_…); if set, the session's
//                                   payment_link must match (extra product scoping)
//
// No npm dependencies — uses Node's built-in `crypto` + the Stripe REST API via fetch.
// ============================================================

const crypto = require("crypto");

var EXPECTED_PRODUCT = "ai-parenting-survival-guide";
var TOKEN_TTL_SECONDS = 6 * 3600; // link valid for 6 hours; re-issued whenever this page reloads

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  var sessionId = String((req.query && req.query.session_id) || "").trim();
  if (!sessionId || sessionId.indexOf("cs_") !== 0) {
    return res.status(400).json({ error: "Missing or invalid session_id." });
  }

  var stripeKey = process.env.STRIPE_SECRET_KEY;
  var tokenSecret = process.env.DOWNLOAD_TOKEN_SECRET;
  if (!stripeKey || !tokenSecret) {
    return res.status(500).json({ error: "Fulfillment is not configured yet." });
  }

  var session;
  try {
    var r = await fetch(
      "https://api.stripe.com/v1/checkout/sessions/" + encodeURIComponent(sessionId),
      { headers: { Authorization: "Bearer " + stripeKey } }
    );
    if (!r.ok) return res.status(404).json({ error: "Order not found." });
    session = await r.json();
  } catch (e) {
    return res.status(502).json({ error: "Could not verify the order right now." });
  }

  // Must be a completed, paid session.
  var paid = session.payment_status === "paid" || session.status === "complete";
  if (!paid) return res.status(402).json({ error: "Payment not completed for this order." });

  // Product scoping: if metadata.product is present it must match; and if the optional
  // Payment Link id env var is set, the session's payment_link must match it too.
  var product = session.metadata && session.metadata.product;
  if (product && product !== EXPECTED_PRODUCT) {
    return res.status(403).json({ error: "This order is for a different product." });
  }
  var expectedLink = process.env.STRIPE_PARENTING_PAYMENT_LINK;
  if (expectedLink && session.payment_link && session.payment_link !== expectedLink) {
    return res.status(403).json({ error: "This order is for a different product." });
  }

  var token = signToken(
    { p: EXPECTED_PRODUCT, sid: session.id, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS },
    tokenSecret
  );

  return res.status(200).json({
    ok: true,
    product: EXPECTED_PRODUCT,
    download: "/api/download-guide?token=" + encodeURIComponent(token),
    expires_in: TOKEN_TTL_SECONDS,
  });
};

function signToken(obj, secret) {
  var payload = Buffer.from(JSON.stringify(obj)).toString("base64url");
  var sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return payload + "." + sig;
}
