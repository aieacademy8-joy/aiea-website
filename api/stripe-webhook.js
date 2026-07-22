// ============================================================
// AI Explorers Academy — Stripe webhook + email fulfillment
// Vercel Serverless Function.  POST /api/stripe-webhook
//
// Verifies the Stripe webhook signature, then emails the buyer a branded access link
// once payment is actually successful. The product is resolved from the Checkout
// Session metadata (metadata.product / metadata.productKey) against a server-side
// registry, and each product has its own subject and body copy.
//
// The email link reopens the existing thank-you page, which re-verifies the paid
// Stripe session server-side and issues a fresh 6-hour, product-bound download token —
// so NO Blob URL, PDF URL, or download token is ever placed in the email.
//
// An unknown or absent product is skipped without sending (unchanged behaviour), so a
// future product can never accidentally trigger the wrong email.
//
// Handles immediate (card) and delayed (ACH/bank) payment methods:
//   • checkout.session.completed              → send only if payment_status === "paid"
//   • checkout.session.async_payment_succeeded → send (delayed method settled)
//   • checkout.session.async_payment_failed    → log only
//
// Idempotency (guards against duplicate emails — not an absolute guarantee):
//   • Postmark has no idempotency-key header, so de-duplication relies on a marker
//     (guide_email_sent) written to the PaymentIntent metadata AFTER Postmark accepts
//     the email, and checked before sending — so ordinary retries, even days later,
//     don't re-send. Residual edge case: if Postmark accepts the email but the metadata
//     write then fails, a later retry could re-send. That write failure is logged.
//
// Security:
//   • Signing secret / Stripe key / Postmark token stay in server-side env vars only.
//   • Raw body is HMAC-verified (constant-time, 5-min tolerance) before use.
//   • Failure logging never includes tokens, secrets, PDF/Blob URLs, customer PII,
//     or the full session id (the id is itself a download credential → masked).
//
// Required Vercel env vars:
//   STRIPE_WEBHOOK_SECRET    – endpoint signing secret ("whsec_…")
//   STRIPE_SECRET_KEY        – to read/set the PaymentIntent idempotency marker
//   POSTMARK_SERVER_TOKEN    – Postmark Server API Token (transactional email)
//   FULFILLMENT_FROM_EMAIL   – verified sender, e.g. AI Explorers Academy <notifications@send.aiexplorersacademy.org>
//
// No npm dependencies — Node's built-in `crypto` + the Stripe/Postmark REST APIs via fetch.
// ============================================================

const crypto = require("crypto");

var ORIGIN = "https://www.aiexplorersacademy.org";
var SUPPORT_EMAIL = "missjoy@aiexplorersacademy.org";

// Server-side product registry (never shipped to the browser). Keyed by the product key
// written to Checkout Session metadata by /api/create-checkout. The Parenting Guide copy
// below is byte-identical to the email that is already live — its flow is unchanged.
var PRODUCTS = {
  "ai-parenting-survival-guide": {
    name: "AI Parenting Survival Guide",
    subject: "Your AI Parenting Survival Guide is ready",
    heading: "Your guide is ready.",
    paragraphs: [
      "Thank you for purchasing the AI Parenting Survival Guide.",
      "Use the secure button below to access and download your guide. Your purchase will be verified before a private, time-limited download link is generated.",
    ],
    buttonLabel: "Access Your Guide",
    license: "",
  },
  "first-ai-literacy-journey": {
    name: "The First AI Literacy Journey",
    subject: "Your First AI Literacy Journey Is Ready",
    heading: "Your journey is ready.",
    paragraphs: [
      "Thank you for beginning The First AI Literacy Journey with your family.",
      "Your purchase includes 7 guided family missions designed to help children think, create, question, and grow wisely with AI.",
      "Use the secure button below to access and download your journey. Your purchase will be verified before a private, time-limited download link is generated.",
    ],
    buttonLabel: "Access Your Journey",
    license: "Your purchase is licensed for use within one household.",
  },
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  var secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
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
    var type = event.type;
    // Immediate methods (card): completed with payment_status "paid".
    // Delayed methods (ACH/bank debit): completed arrives "unpaid", then
    // async_payment_succeeded fires once funds settle. Both are success paths.
    if (type === "checkout.session.completed" || type === "checkout.session.async_payment_succeeded") {
      await maybeFulfill(event.data.object || {}, type);
    } else if (type === "checkout.session.async_payment_failed") {
      var s = event.data.object || {};
      console.warn("[fulfillment] async_payment_failed session=" + safeId(s.id) + " product=" + prod(s));
    }
    // Any other event type is ignored.
  } catch (e) {
    // Message only — never log tokens, secrets, PDF/Blob URLs, PII, or full session ids.
    console.error("[fulfillment] handler error:", e && e.message);
  }

  // Acknowledge the verified event so Stripe does not needlessly retry.
  return res.status(200).json({ received: true });
};

// Disable Vercel's automatic body parsing so the raw signed bytes are preserved.
module.exports.config = { api: { bodyParser: false } };

// ============================================================
// Fulfillment — any product present in the PRODUCTS registry
// ============================================================
async function maybeFulfill(session, eventType) {
  var key = prod(session);
  var cfg = PRODUCTS[key];
  if (!cfg) {
    console.log("[fulfillment] skip (other/no product) session=" + safeId(session.id));
    return;
  }
  // Only deliver once payment is actually collected. Delayed methods land here first
  // as `completed` with payment_status !== "paid"; we wait for the async success event.
  if (session.payment_status !== "paid") {
    console.log("[fulfillment] payment pending, no email yet session=" + safeId(session.id) +
      " status=" + session.payment_status + " via=" + eventType);
    return;
  }

  var email = (session.customer_details && session.customer_details.email) || session.customer_email || null;
  var name = (session.customer_details && session.customer_details.name) || null; // captured per spec; not shown in copy
  if (!email) {
    console.error("[fulfillment] missing customer email session=" + safeId(session.id));
    return;
  }

  var stripeKey = process.env.STRIPE_SECRET_KEY;
  var apiKey = process.env.POSTMARK_SERVER_TOKEN;
  var from = process.env.FULFILLMENT_FROM_EMAIL;
  if (!apiKey || !from) {
    console.error("[fulfillment] email provider not configured (POSTMARK_SERVER_TOKEN / FULFILLMENT_FROM_EMAIL); skipped session=" + safeId(session.id));
    return;
  }

  // ---- Idempotency marker ---------------------------------------------------
  // Record "email sent" on the PaymentIntent metadata (stable, documented Stripe
  // field), set ONLY after Postmark accepts the email, and checked before sending — so
  // ordinary retries (even days later) don't re-send. Postmark has no idempotency-key
  // header, so this marker is the sole dedup guard. Caveat: if the email is accepted
  // but this metadata write fails, a later retry could re-send (that failure is logged).
  var piId = typeof session.payment_intent === "string" ? session.payment_intent : null;
  if (piId && stripeKey) {
    var already = await piAlreadyFulfilled(stripeKey, piId);
    if (already === true) {
      console.log("[fulfillment] already sent (marker present) session=" + safeId(session.id));
      return;
    }
    // already === null → marker read failed; fall through and attempt the send.
  }

  var accessUrl = ORIGIN + "/thank-you.html?session_id=" + encodeURIComponent(session.id);
  var sent = await sendFulfillmentEmail(apiKey, from, email, accessUrl, cfg);

  if (!sent) {
    console.error("[fulfillment] email FAILED product=" + key + " session=" + safeId(session.id) + " via=" + eventType);
    return;
  }
  console.log("[fulfillment] email sent product=" + key + " session=" + safeId(session.id) + " via=" + eventType + " name=" + (name ? "y" : "n"));

  if (piId && stripeKey) {
    var marked = await markPiFulfilled(stripeKey, piId);
    if (!marked) {
      console.error("[fulfillment] could not set idempotency marker session=" + safeId(session.id) + " (a later retry could re-send)");
    }
  }
}

// true = already fulfilled, false = not yet, null = check failed.
async function piAlreadyFulfilled(stripeKey, piId) {
  try {
    var r = await fetch("https://api.stripe.com/v1/payment_intents/" + encodeURIComponent(piId),
      { headers: { Authorization: "Bearer " + stripeKey } });
    if (!r.ok) return null;
    var pi = await r.json();
    return !!(pi && pi.metadata && pi.metadata.guide_email_sent);
  } catch (e) {
    return null;
  }
}

async function markPiFulfilled(stripeKey, piId) {
  try {
    // Metadata updates MERGE — this preserves the existing product metadata.
    var form = "metadata[guide_email_sent]=" + encodeURIComponent(new Date().toISOString());
    var r = await fetch("https://api.stripe.com/v1/payment_intents/" + encodeURIComponent(piId), {
      method: "POST",
      headers: {
        Authorization: "Bearer " + stripeKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });
    return r.ok;
  } catch (e) {
    return false;
  }
}

async function sendFulfillmentEmail(apiKey, from, to, accessUrl, cfg) {
  try {
    var r = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "X-Postmark-Server-Token": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        From: from,
        To: to,
        ReplyTo: SUPPORT_EMAIL,
        Subject: cfg.subject,
        HtmlBody: emailHtml(accessUrl, cfg),
        TextBody: emailText(accessUrl, cfg),
        MessageStream: "outbound",
      }),
    });
    if (!r.ok) {
      var detail = "";
      try { var j = await r.json(); detail = (j && (j.Message || j.ErrorCode)) || ""; } catch (e) {}
      console.error("[fulfillment] postmark http " + r.status + " " + detail);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[fulfillment] postmark request failed:", e && e.message);
    return false;
  }
}

// productKey preferred, product = legacy key still written by /api/create-checkout.
function prod(s) {
  var m = (s && s.metadata) || {};
  return String(m.productKey || m.product || "none");
}
function safeId(id) { return id ? (String(id).slice(0, 8) + "…" + String(id).slice(-4)) : "unknown"; }

// ---- Branded transactional email (navy/gold, table-based, email-client safe) ----
// Same structure, sender and branding for every product; only the copy varies.
function emailHtml(accessUrl, cfg) {
  var href = escapeAttr(accessUrl);
  var paras = cfg.paragraphs.map(function (p, i) {
    var last = i === cfg.paragraphs.length - 1;
    return '<p style="margin:0' + (last ? "" : " 0 16px") + ';">' + escapeHtml(p) + '</p>';
  }).join("");
  var licenseRow = cfg.license
    ? '<tr><td style="padding:18px 40px 0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#8A95AD;">' + escapeHtml(cfg.license) + '</td></tr>'
    : "";
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="dark light"><title>' + escapeHtml(cfg.heading) + '</title></head>' +
    '<body style="margin:0;padding:0;background:#050B1C;">' +
    '<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">Access your private AI Explorers Academy download.</span>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050B1C;"><tr><td align="center" style="padding:32px 16px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#07122D;border:1px solid rgba(212,175,79,0.28);border-radius:16px;">' +
    '<tr><td style="padding:34px 40px 6px;text-align:center;font-family:Georgia,\'Times New Roman\',serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#D4AF4F;">AI Explorers Academy</td></tr>' +
    '<tr><td style="padding:6px 40px 0;text-align:center;"><h1 style="margin:0;font-family:Georgia,\'Times New Roman\',serif;font-weight:normal;font-size:30px;line-height:1.15;color:#F5F4EF;">' + escapeHtml(cfg.heading) + '</h1></td></tr>' +
    '<tr><td style="padding:20px 40px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#C9D2E4;">' +
    paras + '</td></tr>' +
    '<tr><td align="center" style="padding:28px 40px 6px;">' +
    '<a href="' + href + '" style="display:inline-block;background:#D4AF4F;color:#2A1E00;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;text-decoration:none;padding:15px 36px;border-radius:999px;">' + escapeHtml(cfg.buttonLabel) + '</a></td></tr>' +
    licenseRow +
    '<tr><td style="padding:16px 40px 0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#8A95AD;">Need help? Contact <a href="mailto:' + SUPPORT_EMAIL + '" style="color:#D4AF4F;text-decoration:none;">' + SUPPORT_EMAIL + '</a>.</td></tr>' +
    '<tr><td style="padding:24px 40px 34px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">' +
    '<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:14px;color:#F5F4EF;">AI Explorers Academy</div>' +
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:1px;color:#8A95AD;margin-top:4px;">Discover • Imagine • Create with AI</div></td></tr>' +
    '</table></td></tr></table></body></html>';
}

function emailText(accessUrl, cfg) {
  return cfg.heading + '\n\n' +
    cfg.paragraphs.join('\n\n').replace("secure button below", "secure link below") + '\n\n' +
    cfg.buttonLabel + ':\n' + accessUrl + '\n\n' +
    (cfg.license ? cfg.license + '\n\n' : '') +
    'Need help? Contact ' + SUPPORT_EMAIL + '.\n\n' +
    'AI Explorers Academy\nDiscover • Imagine • Create with AI\n';
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---- helpers (unchanged) ----

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
