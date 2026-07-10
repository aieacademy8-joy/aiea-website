// ============================================================
// AI Explorers Academy — Stripe webhook + email fulfillment
// Vercel Serverless Function.  POST /api/stripe-webhook
//
// Verifies the Stripe webhook signature, then (for the AI Parenting Survival Guide
// ONLY) emails the buyer a branded "Access Your Guide" link once payment is actually
// successful. The email link reopens the existing thank-you page, which re-verifies
// the paid Stripe session server-side and issues a fresh 6-hour download token — so
// NO Blob URL, PDF URL, or download token is ever placed in the email.
//
// Handles immediate (card) and delayed (ACH/bank) payment methods:
//   • checkout.session.completed              → send only if payment_status === "paid"
//   • checkout.session.async_payment_succeeded → send (delayed method settled)
//   • checkout.session.async_payment_failed    → log only
//
// Idempotency (guards against duplicate emails — not an absolute guarantee):
//   • Resend "Idempotency-Key" per session collapses concurrent/retried deliveries
//     (Resend de-duplicates within a ~24h window).
//   • A marker (guide_email_sent) is written to the PaymentIntent metadata AFTER Resend
//     accepts the email, and checked before sending — so ordinary retries, even days
//     later, don't re-send. Residual edge case: if Resend accepts the email but the
//     metadata write then fails, a retry after the ~24h window could re-send. That
//     metadata-write failure is logged explicitly.
//
// Security:
//   • Signing secret / Stripe key / Resend key stay in server-side env vars only.
//   • Raw body is HMAC-verified (constant-time, 5-min tolerance) before use.
//   • Failure logging never includes tokens, secrets, PDF/Blob URLs, customer PII,
//     or the full session id (the id is itself a download credential → masked).
//
// Required Vercel env vars:
//   STRIPE_WEBHOOK_SECRET    – endpoint signing secret ("whsec_…")
//   STRIPE_SECRET_KEY        – to read/set the PaymentIntent idempotency marker
//   RESEND_API_KEY           – Resend API key (transactional email)
//   FULFILLMENT_FROM_EMAIL   – verified sender, e.g. AI Explorers Academy <missjoy@aiexplorersacademy.org>
//
// No npm dependencies — Node's built-in `crypto` + the Stripe/Resend REST APIs via fetch.
// ============================================================

const crypto = require("crypto");

var FULFILL_PRODUCT = "ai-parenting-survival-guide";
var ORIGIN = "https://www.aiexplorersacademy.org";
var SUPPORT_EMAIL = "missjoy@aiexplorersacademy.org";

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
// Fulfillment — AI Parenting Survival Guide ONLY
// ============================================================
async function maybeFulfill(session, eventType) {
  if (prod(session) !== FULFILL_PRODUCT) {
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
  var apiKey = process.env.RESEND_API_KEY;
  var from = process.env.FULFILLMENT_FROM_EMAIL;
  if (!apiKey || !from) {
    console.error("[fulfillment] email provider not configured (RESEND_API_KEY / FULFILLMENT_FROM_EMAIL); skipped session=" + safeId(session.id));
    return;
  }

  // ---- Idempotency marker ---------------------------------------------------
  // Record "email sent" on the PaymentIntent metadata (stable, documented Stripe
  // field), set ONLY after Resend accepts the email, and checked before sending — so
  // ordinary retries (even days later) don't re-send. The per-session Resend
  // Idempotency-Key additionally collapses concurrent deliveries within ~24h. Caveat:
  // if the email is accepted but this metadata write fails, a retry after the ~24h
  // window could re-send (that write failure is logged).
  var piId = typeof session.payment_intent === "string" ? session.payment_intent : null;
  if (piId && stripeKey) {
    var already = await piAlreadyFulfilled(stripeKey, piId);
    if (already === true) {
      console.log("[fulfillment] already sent (marker present) session=" + safeId(session.id));
      return;
    }
    // already === null → marker read failed; fall through (Resend key still dedups).
  }

  var accessUrl = ORIGIN + "/thank-you.html?session_id=" + encodeURIComponent(session.id);
  var sent = await sendGuideEmail(apiKey, from, email, accessUrl, "guide-fulfillment-" + session.id);

  if (!sent) {
    console.error("[fulfillment] guide email FAILED session=" + safeId(session.id) + " via=" + eventType);
    return;
  }
  console.log("[fulfillment] guide email sent session=" + safeId(session.id) + " via=" + eventType + " name=" + (name ? "y" : "n"));

  if (piId && stripeKey) {
    var marked = await markPiFulfilled(stripeKey, piId);
    if (!marked) {
      console.error("[fulfillment] could not set idempotency marker session=" + safeId(session.id) + " (Resend key still guards duplicates)");
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

async function sendGuideEmail(apiKey, from, to, accessUrl, idempotencyKey) {
  try {
    var r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        from: from,
        to: [to],
        reply_to: SUPPORT_EMAIL,
        subject: "Your AI Parenting Survival Guide is ready",
        html: emailHtml(accessUrl),
        text: emailText(accessUrl),
      }),
    });
    if (!r.ok) {
      var detail = "";
      try { var j = await r.json(); detail = (j && (j.message || j.name)) || ""; } catch (e) {}
      console.error("[fulfillment] resend http " + r.status + " " + detail);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[fulfillment] resend request failed:", e && e.message);
    return false;
  }
}

function prod(s) { return (s && s.metadata && s.metadata.product) || "none"; }
function safeId(id) { return id ? (String(id).slice(0, 8) + "…" + String(id).slice(-4)) : "unknown"; }

// ---- Branded transactional email (navy/gold, table-based, email-client safe) ----
function emailHtml(accessUrl) {
  var href = escapeAttr(accessUrl);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="dark light"><title>Your guide is ready</title></head>' +
    '<body style="margin:0;padding:0;background:#050B1C;">' +
    '<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">Access your private AI Explorers Academy download.</span>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050B1C;"><tr><td align="center" style="padding:32px 16px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#07122D;border:1px solid rgba(212,175,79,0.28);border-radius:16px;">' +
    '<tr><td style="padding:34px 40px 6px;text-align:center;font-family:Georgia,\'Times New Roman\',serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#D4AF4F;">AI Explorers Academy</td></tr>' +
    '<tr><td style="padding:6px 40px 0;text-align:center;"><h1 style="margin:0;font-family:Georgia,\'Times New Roman\',serif;font-weight:normal;font-size:30px;line-height:1.15;color:#F5F4EF;">Your guide is ready.</h1></td></tr>' +
    '<tr><td style="padding:20px 40px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#C9D2E4;">' +
    '<p style="margin:0 0 16px;">Thank you for purchasing the AI Parenting Survival Guide.</p>' +
    '<p style="margin:0;">Use the secure button below to access and download your guide. Your purchase will be verified before a private, time-limited download link is generated.</p></td></tr>' +
    '<tr><td align="center" style="padding:28px 40px 6px;">' +
    '<a href="' + href + '" style="display:inline-block;background:#D4AF4F;color:#2A1E00;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;text-decoration:none;padding:15px 36px;border-radius:999px;">Access Your Guide</a></td></tr>' +
    '<tr><td style="padding:16px 40px 0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#8A95AD;">Need help? Contact <a href="mailto:' + SUPPORT_EMAIL + '" style="color:#D4AF4F;text-decoration:none;">' + SUPPORT_EMAIL + '</a>.</td></tr>' +
    '<tr><td style="padding:24px 40px 34px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">' +
    '<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:14px;color:#F5F4EF;">AI Explorers Academy</div>' +
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:1px;color:#8A95AD;margin-top:4px;">Discover • Imagine • Create with AI</div></td></tr>' +
    '</table></td></tr></table></body></html>';
}

function emailText(accessUrl) {
  return 'Your guide is ready.\n\n' +
    'Thank you for purchasing the AI Parenting Survival Guide.\n\n' +
    'Use the secure link below to access and download your guide. Your purchase will be verified before a private, time-limited download link is generated.\n\n' +
    'Access Your Guide:\n' + accessUrl + '\n\n' +
    'Need help? Contact ' + SUPPORT_EMAIL + '.\n\n' +
    'AI Explorers Academy\nDiscover • Imagine • Create with AI\n';
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
