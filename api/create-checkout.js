// ============================================================
// AI Explorers Academy — Create Stripe Checkout Session
// Vercel Serverless Function.  POST /api/create-checkout
//
// Creates a LIVE Stripe Checkout Session for ONE product: the AI Parenting
// Survival Guide. Returns { url } for the browser to redirect to Stripe's
// hosted checkout. The secret key stays server-side (never returned/logged).
//
// Uses the Stripe REST API via fetch — no npm dependency, no Stripe SDK,
// consistent with the other /api functions.
//
// Required Vercel env var:
//   STRIPE_SECRET_KEY            – LIVE Stripe secret key (sk_live_…), server-side only
// Optional (recommended, to bill the existing LIVE catalog product):
//   STRIPE_PARENTING_PRICE_ID    – the LIVE Price ID (price_…) of the guide.
//                                  If unset, an inline $19 line item is used instead.
// ============================================================

var PRODUCT = "ai-parenting-survival-guide";
var ORIGIN = "https://www.aiexplorersacademy.org";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  var stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: "Checkout is not configured yet." });
  }

  var form = new URLSearchParams();
  form.append("mode", "payment");
  form.append("success_url", ORIGIN + "/thank-you.html?session_id={CHECKOUT_SESSION_ID}");
  form.append("cancel_url", ORIGIN + "/ai-parenting-survival-guide.html");
  form.append("metadata[product]", PRODUCT);
  form.append("payment_intent_data[metadata][product]", PRODUCT);

  var priceId = process.env.STRIPE_PARENTING_PRICE_ID;
  if (priceId) {
    // Preferred: charge the existing LIVE catalog price (no duplicate product created).
    form.append("line_items[0][price]", priceId);
    form.append("line_items[0][quantity]", "1");
  } else {
    // Fallback so checkout works immediately: an inline $19 line item (the price shown
    // on the page). Set STRIPE_PARENTING_PRICE_ID to bill your catalog product instead.
    form.append("line_items[0][price_data][currency]", "usd");
    form.append("line_items[0][price_data][unit_amount]", "1900");
    form.append("line_items[0][price_data][product_data][name]", "AI Parenting Survival Guide");
    form.append("line_items[0][quantity]", "1");
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
      console.error("[stripe] create-checkout failed:", session && session.error && session.error.message);
      return res.status(502).json({ error: "Could not start checkout. Please try again." });
    }
    return res.status(200).json({ url: session.url });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach the payment processor." });
  }
};
