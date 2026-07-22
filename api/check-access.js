// ============================================================
// AI Explorers Academy — Post-purchase access check (multi-product)
// Vercel Serverless Function.  GET /api/check-access?session_id=cs_…
//
// Verifies a *paid* Stripe Checkout Session (server-side, using STRIPE_SECRET_KEY),
// identifies WHICH product was purchased from the session metadata, and returns a
// short-lived HMAC download token BOUND TO THAT PRODUCT. No PDF path or URL is ever
// exposed here — only a token that /api/download-guide validates before streaming.
//
// Product identity resolution (in order):
//   metadata.productKey  → metadata.product (legacy)  → DEFAULT_PRODUCT
// The final fallback preserves the original behaviour for older Parenting Guide
// sessions that were created before product metadata existed.
//
// Required Vercel env vars:
//   STRIPE_SECRET_KEY        – Stripe secret key (sk_live_…) to retrieve the session
//   DOWNLOAD_TOKEN_SECRET    – HMAC secret used to sign download tokens
// Optional:
//   STRIPE_PARENTING_PAYMENT_LINK – Payment Link id (plink_…); if set, a Parenting
//                                   Guide session's payment_link must match it
//
// No npm dependencies — Node's built-in `crypto` + the Stripe REST API via fetch.
// ============================================================

const crypto = require("crypto");

// Server-side product registry (never shipped to the browser).
var PRODUCTS = {
  "ai-parenting-survival-guide": { name: "AI Parenting Survival Guide" },
  "first-ai-literacy-journey": { name: "The First AI Literacy Journey" },
};
var DEFAULT_PRODUCT = "ai-parenting-survival-guide"; // legacy sessions without metadata
var TOKEN_TTL_SECONDS = 6 * 3600; // link valid for 6 hours; re-issued whenever the page reloads

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

  // Which product was purchased?
  var md = session.metadata || {};
  var key = String(md.productKey || md.product || DEFAULT_PRODUCT);
  var cfg = PRODUCTS[key];
  if (!cfg) {
    console.log("[access] unknown product on session");
    return res.status(403).json({ error: "This order is for a different product." });
  }

  // Legacy extra scoping for the Parenting Guide only (unchanged behaviour).
  var expectedLink = process.env.STRIPE_PARENTING_PAYMENT_LINK;
  if (key === DEFAULT_PRODUCT && expectedLink && session.payment_link && session.payment_link !== expectedLink) {
    return res.status(403).json({ error: "This order is for a different product." });
  }

  // Token is bound to the product — /api/download-guide will only serve that product's PDF.
  var token = signToken(
    { p: key, sid: session.id, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS },
    tokenSecret
  );

  console.log("[access] ok product=" + key);
  return res.status(200).json({
    ok: true,
    product: key,
    productName: cfg.name,
    download: "/api/download-guide?token=" + encodeURIComponent(token),
    expires_in: TOKEN_TTL_SECONDS,
  });
};

function signToken(obj, secret) {
  var payload = Buffer.from(JSON.stringify(obj)).toString("base64url");
  var sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return payload + "." + sig;
}
