// ============================================================
// AI Explorers Academy — Create Stripe Checkout Session
// Vercel Serverless Function.  POST /api/create-checkout
//
// Supports MULTIPLE products via a small server-side registry. The browser posts
// { "product": "<key>" }; the Price ID is resolved from an environment variable and
// is NEVER sent to or accepted from the client. The secret key stays server-side.
//
// Backward compatibility: the AI Parenting Survival Guide page posts an empty body
// ({}), so a missing/unknown-free `product` falls back to that product — its existing
// checkout keeps working untouched.
//
// Session metadata is written as:
//   product      – legacy key that /api/check-access, /api/download-guide and
//                  /api/stripe-webhook already gate on (do not remove)
//   productKey   – same value, explicit name
//   productName  – human-readable product name
// …and mirrored onto payment_intent_data so it survives on the PaymentIntent.
//
// Uses the Stripe REST API via fetch — no npm dependency, consistent with the other
// /api functions.
//
// Required Vercel env vars:
//   STRIPE_SECRET_KEY                        – LIVE secret key (sk_live_…), server-side only
//   STRIPE_PARENTING_PRICE_ID                – LIVE Price ID for the parenting guide (optional;
//                                              falls back to an inline $19 line item)
//   STRIPE_PRICE_FIRST_AI_LITERACY_JOURNEY   – LIVE Price ID for The First AI Literacy Journey
//                                              (required — no inline fallback, so a
//                                              misconfiguration can never charge a wrong price)
// ============================================================

var ORIGIN = "https://www.aiexplorersacademy.org";
var DEFAULT_PRODUCT = "ai-parenting-survival-guide";

var PRODUCTS = {
  "ai-parenting-survival-guide": {
    name: "AI Parenting Survival Guide",
    priceEnv: "STRIPE_PARENTING_PRICE_ID",
    fallbackAmount: 1900, // legacy inline fallback — keeps the existing flow working
    cancelPath: "/ai-parenting-survival-guide.html",
  },
  "first-ai-literacy-journey": {
    name: "The First AI Literacy Journey",
    priceEnv: "STRIPE_PRICE_FIRST_AI_LITERACY_JOURNEY",
    fallbackAmount: null, // require the configured Price ID
    cancelPath: "/first-ai-literacy-journey.html",
  },
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  var stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: "Checkout is not configured yet." });
  }

  // Resolve the requested product (empty body → the original parenting guide).
  var body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body || "{}"); } catch (e) { body = {}; }
  }
  if (!body || typeof body !== "object") body = {};
  var key = String(body.product || DEFAULT_PRODUCT);
  var cfg = PRODUCTS[key];
  if (!cfg) {
    console.error("[stripe] create-checkout: unknown product key");
    return res.status(400).json({ error: "Unknown product." });
  }

  var form = new URLSearchParams();
  form.append("mode", "payment");
  form.append("success_url", ORIGIN + "/thank-you.html?session_id={CHECKOUT_SESSION_ID}");
  form.append("cancel_url", ORIGIN + cfg.cancelPath);

  // `product` is the key the existing fulfillment chain reads — keep it.
  form.append("metadata[product]", key);
  form.append("metadata[productKey]", key);
  form.append("metadata[productName]", cfg.name);
  form.append("payment_intent_data[metadata][product]", key);
  form.append("payment_intent_data[metadata][productKey]", key);
  form.append("payment_intent_data[metadata][productName]", cfg.name);

  var priceId = process.env[cfg.priceEnv];
  if (priceId) {
    // Preferred: charge the existing LIVE catalog price (no duplicate product created).
    form.append("line_items[0][price]", priceId);
    form.append("line_items[0][quantity]", "1");
  } else if (cfg.fallbackAmount) {
    // Legacy inline fallback (parenting guide only).
    form.append("line_items[0][price_data][currency]", "usd");
    form.append("line_items[0][price_data][unit_amount]", String(cfg.fallbackAmount));
    form.append("line_items[0][price_data][product_data][name]", cfg.name);
    form.append("line_items[0][quantity]", "1");
  } else {
    // No configured price and no fallback — refuse rather than charge a wrong amount.
    console.error("[stripe] create-checkout: missing price env for product=" + key);
    return res.status(500).json({ error: "Checkout is not configured for this product yet." });
  }

  try {
    var r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + stripeKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    var session = await r.json();
    if (!r.ok || !session || !session.url) {
      // Log the Stripe error message server-side only (never the key); generic to client.
      console.error("[stripe] create-checkout failed for product=" + key + ":", session && session.error && session.error.message);
      return res.status(502).json({ error: "Could not start checkout. Please try again." });
    }
    return res.status(200).json({ url: session.url });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach the payment processor." });
  }
};
