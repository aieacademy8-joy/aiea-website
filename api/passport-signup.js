// ============================================================
// AI Explorers Academy — AI Explorer Passport signup (MailerLite + Postmark)
// Vercel Serverless Function.  POST /api/passport-signup
//
// Mirrors the working Scorecard architecture (/api/subscribe): MailerLite only STORES and
// ORGANIZES the subscriber; Postmark sends the Passport delivery email IMMEDIATELY. No
// MailerLite automation is used or required.
//
// On success BOTH must succeed (same contract as /api/subscribe):
//   1) Upsert the subscriber in MailerLite and add them to the "AI Explorer Episodes —
//      Passport List" group (+ the matching Parents/Teachers/School Leaders group if an
//      "I am a…" answer was given). MailerLite upserts by email and only ADDS groups, so
//      existing subscribers and their existing groups are preserved.
//   2) Send the branded Passport email via Postmark and CONFIRM Postmark accepted it.
//
// Response contract:
//   success → 200 { "success": true, "emailAccepted": true }
//   failure → non-2xx { "success": false, "error": "<CODE>" }
// Provider error bodies are logged server-side only — never returned to the browser.
//
// SECURITY: the Passport PDF URL lives only here (server-side) and is placed only in the
// delivered email — it is never sent to the page/browser before a successful signup.
//
// Required Vercel env vars (all already used by the Scorecard flow):
//   MAILERLITE_API_KEY, POSTMARK_SERVER_TOKEN, FULFILLMENT_FROM_EMAIL
//   ML_GROUP_PASSPORT    – "AI Explorer Episodes — Passport List" group id
//   PASSPORT_PDF_URL     – public Passport PDF (Vercel Blob PUBLIC store, not the paid store)
// Optional:
//   ML_GROUP_PARENTS / ML_GROUP_TEACHERS / ML_GROUP_SCHOOLS  (audience mapping, if answered)
//
// There are NO hardcoded fallbacks: every required value above must be set in Vercel, or
// the endpoint returns SERVER_NOT_CONFIGURED (same pattern as /api/subscribe).
// ============================================================

var SUPPORT_EMAIL = "missjoy@aiexplorersacademy.org";

// The Episode 1 YouTube URL already present in episodes.html (do not alter).
var EPISODE_1_YOUTUBE_URL = "https://youtu.be/9BvFso0BB1k";

// "I am a…" answer → env var holding the existing group id (reuses the Scorecard mapping).
var AUDIENCE_GROUP_ENV = {
  parents: "ML_GROUP_PARENTS",
  educators: "ML_GROUP_TEACHERS",
  schools: "ML_GROUP_SCHOOLS",
};

var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  }

  var body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  var firstName = String(body.first_name || "").trim();
  var email = String(body.email || "").trim();
  var audience = String(body.audience || "").trim();
  var consent = body.consent === true || body.consent === "true" || body.consent === "on";

  console.log("[passport] request received audience=" + (audience || "none"));

  if (!firstName || !EMAIL_RE.test(email) || !consent) {
    return res.status(400).json({ success: false, error: "MISSING_FIELDS" });
  }
  console.log("[passport] payload validated");

  // All delivery config comes from env vars only — no hardcoded fallbacks. Missing any
  // required value → the same safe SERVER_NOT_CONFIGURED response as /api/subscribe.
  var apiKey = process.env.MAILERLITE_API_KEY;
  var postmarkToken = process.env.POSTMARK_SERVER_TOKEN;
  var from = process.env.FULFILLMENT_FROM_EMAIL;
  var passportGroupId = process.env.ML_GROUP_PASSPORT;
  var passportPdfUrl = process.env.PASSPORT_PDF_URL;
  if (!apiKey || !postmarkToken || !from || !passportGroupId || !passportPdfUrl) {
    console.error("[passport] not configured ml=" + !!apiKey + " postmark=" + !!postmarkToken +
      " from=" + !!from + " group=" + !!passportGroupId + " pdf=" + !!passportPdfUrl);
    return res.status(500).json({ success: false, error: "SERVER_NOT_CONFIGURED" });
  }

  // Always the Passport List; add the audience group too if an answer was given and mapped.
  var groups = [String(passportGroupId)];
  if (audience && AUDIENCE_GROUP_ENV[audience]) {
    var audId = process.env[AUDIENCE_GROUP_ENV[audience]];
    if (audId) groups.push(String(audId));
  }

  // ---- 1) MailerLite upsert (store + organize; additive groups) ----------------
  console.log("[passport] mailerlite subscribe started groups=" + groups.length);
  try {
    var mlRes = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": "Bearer " + apiKey,
      },
      body: JSON.stringify({
        email: email,
        fields: { name: firstName },
        groups: groups,   // MailerLite ADDS these groups; it never removes existing ones
        status: "active",
      }),
    });
    if (!mlRes.ok) {
      var mlDetail = await safeBody(mlRes);
      console.error("[passport] mailerlite rejected status=" + mlRes.status + " body=" + mlDetail);
      return res.status(502).json({ success: false, error: "SUBSCRIBE_FAILED" });
    }
    console.log("[passport] mailerlite succeeded status=" + mlRes.status);
  } catch (e) {
    console.error("[passport] mailerlite unreachable: " + (e && e.message));
    return res.status(502).json({ success: false, error: "SUBSCRIBE_FAILED" });
  }

  // ---- 2) Postmark delivery of the Passport, confirmed -------------------------
  console.log("[passport] email started provider=postmark");
  var accepted = false;
  try {
    var pmRes = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "X-Postmark-Server-Token": postmarkToken,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        From: from,
        To: email,
        ReplyTo: SUPPORT_EMAIL,
        Subject: "Your Free AI Explorer Passport Is Here! 🧭",
        HtmlBody: emailHtml(firstName, passportPdfUrl),
        TextBody: emailText(firstName, passportPdfUrl),
        MessageStream: "outbound",
      }),
    });
    accepted = pmRes.ok;
    if (!pmRes.ok) {
      var pmDetail = "";
      try { var j = await pmRes.json(); pmDetail = (j && (j.Message || j.ErrorCode)) || ""; } catch (e) {}
      console.error("[passport] postmark rejected status=" + pmRes.status + " " + pmDetail);
    } else {
      console.log("[passport] postmark accepted status=" + pmRes.status);
    }
  } catch (e) {
    console.error("[passport] postmark request failed: " + (e && e.message));
  }

  if (!accepted) {
    // MailerLite already succeeded, but delivery is what the visitor was promised.
    console.log("[passport] final=EMAIL_DELIVERY_FAILED (subscriber added, email not accepted)");
    return res.status(502).json({ success: false, error: "EMAIL_DELIVERY_FAILED" });
  }

  console.log("[passport] final=success");
  return res.status(200).json({ success: true, emailAccepted: true });
};

// Read a provider error body safely for logs (never throws, bounded length).
async function safeBody(r) {
  try { return String(await r.text()).replace(/\s+/g, " ").slice(0, 200); }
  catch (e) { return "(unreadable)"; }
}

// ---- Branded transactional email (navy/gold, table-based) — same structure, sender,
//      reply-to, footer and deliverability approach as the Scorecard email. ----
function emailHtml(firstName, passportUrl) {
  var passHref = escapeAttr(passportUrl);
  var ytHref = escapeAttr(EPISODE_1_YOUTUBE_URL);
  var greeting = firstName ? "Hi " + escapeHtml(firstName) + "," : "Hi there,";
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="dark light"><title>Your AI Explorer Passport</title></head>' +
    '<body style="margin:0;padding:0;background:#050B1C;">' +
    '<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">Start Season 1, collect episode badges, and grow through every AI adventure.</span>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050B1C;"><tr><td align="center" style="padding:32px 16px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#07122D;border:1px solid rgba(212,175,79,0.28);border-radius:16px;">' +
    '<tr><td style="padding:34px 40px 6px;text-align:center;font-family:Georgia,\'Times New Roman\',serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#D4AF4F;">AI Explorers Academy</td></tr>' +
    '<tr><td style="padding:6px 40px 0;text-align:center;"><h1 style="margin:0;font-family:Georgia,\'Times New Roman\',serif;font-weight:normal;font-size:27px;line-height:1.18;color:#F5F4EF;">Your AI Explorer Passport is here. 🧭</h1></td></tr>' +
    '<tr><td style="padding:20px 40px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#C9D2E4;">' +
    '<p style="margin:0 0 16px;">' + greeting + '</p>' +
    '<p style="margin:0 0 16px;">Welcome to your AI Explorer journey!</p>' +
    '<p style="margin:0;">Your free Season 1 AI Explorer Passport is ready. Your child can use it alongside the AI Explorers Academy episodes, complete each mission, and collect a new badge along the way.</p></td></tr>' +
    '<tr><td align="center" style="padding:28px 40px 6px;">' +
    '<a href="' + passHref + '" style="display:inline-block;background:#D4AF4F;color:#2A1E00;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;text-decoration:none;padding:15px 34px;border-radius:999px;">Download the Season 1 Passport</a></td></tr>' +
    '<tr><td style="padding:12px 40px 0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#8A95AD;">If the button doesn\'t work, copy and paste this link:<br><span style="color:#C9D2E4;word-break:break-all;">' + escapeHtml(passportUrl) + '</span></td></tr>' +
    '<tr><td style="padding:22px 40px 0;"><div style="border-top:1px solid rgba(255,255,255,0.06);"></div></td></tr>' +
    '<tr><td style="padding:18px 40px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#C9D2E4;text-align:center;">' +
    '<a href="' + ytHref + '" style="color:#D4AF4F;font-weight:bold;text-decoration:none;">▶  Watch Episode 1: What Is AI?</a></td></tr>' +
    '<tr><td style="padding:14px 40px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#C9D2E4;">' +
    '<p style="margin:0;">After watching Episode 1, return to the Episodes page to download the Stay Curious badge.</p></td></tr>' +
    '<tr><td style="padding:22px 40px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#C9D2E4;">' +
    '<p style="margin:0;">Stay curious,<br><strong style="color:#F5F4EF;">Miss JOY</strong><br><span style="color:#8A95AD;font-size:13px;">Founder, AI Explorers Academy</span></p></td></tr>' +
    '<tr><td style="padding:18px 40px 0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#8A95AD;">Questions? Contact <a href="mailto:' + SUPPORT_EMAIL + '" style="color:#D4AF4F;text-decoration:none;">' + SUPPORT_EMAIL + '</a>.</td></tr>' +
    '<tr><td style="padding:24px 40px 34px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">' +
    '<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:14px;color:#F5F4EF;">AI Explorers Academy</div>' +
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:1px;color:#8A95AD;margin-top:4px;">Discover • Imagine • Create with AI</div></td></tr>' +
    '</table></td></tr></table></body></html>';
}

function emailText(firstName, passportUrl) {
  return (firstName ? "Hi " + firstName + ",\n\n" : "Hi there,\n\n") +
    "Welcome to your AI Explorer journey!\n\n" +
    "Your free Season 1 AI Explorer Passport is ready. Your child can use it alongside the AI Explorers Academy episodes, complete each mission, and collect a new badge along the way.\n\n" +
    "Download the Season 1 Passport:\n" + passportUrl + "\n\n" +
    "Watch Episode 1: What Is AI?\n" + EPISODE_1_YOUTUBE_URL + "\n\n" +
    "After watching Episode 1, return to the Episodes page to download the Stay Curious badge.\n\n" +
    "Stay curious,\nMiss JOY\nFounder, AI Explorers Academy\n\n" +
    "Questions? Contact " + SUPPORT_EMAIL + ".\n\n" +
    "AI Explorers Academy\nDiscover • Imagine • Create with AI\n";
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
