// ============================================================
// AI Explorers Academy — Free resource request (MailerLite + Postmark)
// Vercel Serverless Function.  POST /api/subscribe
//
// TWO required actions — BOTH must succeed before the API reports success:
//   1) Add/update the visitor in the correct MailerLite audience group (list building).
//      MailerLite upserts by email, so existing subscribers update gracefully (no dupes).
//   2) Email the requested free resource as a secure LINK (never an attachment) via
//      Postmark, and CONFIRM Postmark accepted it before returning success.
//
// This replaces the previous "subscribe-only" design, which reported success as soon as
// the MailerLite subscribe was accepted and relied on an invisible MailerLite group
// automation to deliver the PDF — so the visitor saw "your resource is on its way" even
// when no email was ever sent. Delivery is now performed and verified by the website.
//
// The resource NAME and PDF PATH are chosen SERVER-SIDE from the audience — the browser
// never supplies a URL, so it can't request an arbitrary file. The three PDFs are the
// existing public files under /resources/free/… (same links the site already exposes).
//
// Response contract:
//   success →  200  { "success": true, "emailAccepted": true }
//   failure → non-2xx { "success": false, "error": "<CODE>" }
// Provider error bodies are logged server-side only — never returned to the browser.
//
// Required Vercel env vars:
//   MAILERLITE_API_KEY      – MailerLite API token (Bearer)
//   ML_GROUP_PARENTS        – Group ID "Parents"
//   ML_GROUP_TEACHERS       – Group ID "Teachers"  (Educators page)
//   ML_GROUP_SCHOOLS        – Group ID "School Leaders"
//   POSTMARK_SERVER_TOKEN   – Postmark Server API token (same one the purchase email uses)
//   FULFILLMENT_FROM_EMAIL  – verified Postmark sender
// ============================================================

var ORIGIN = "https://www.aiexplorersacademy.org";
var SUPPORT_EMAIL = "missjoy@aiexplorersacademy.org";

// audience → { groupEnv, name, path }. name + path mirror free-resources.html exactly, so
// each audience receives ITS OWN resource — never a shared or incorrect PDF.
var RESOURCES = {
  parents: {
    groupEnv: "ML_GROUP_PARENTS",
    name: "The AI-Ready Family Scorecard",
    path: "/resources/free/parents/Parent-AI-Scorecard.pdf",
  },
  educators: {
    groupEnv: "ML_GROUP_TEACHERS",
    name: "The AI-Ready Classroom Scorecard",
    path: "/resources/free/teachers/Teacher-AI-Scorecard.pdf",
  },
  schools: {
    groupEnv: "ML_GROUP_SCHOOLS",
    name: "The AI Readiness Scorecard for Schools",
    path: "/resources/free/schools/School-AI-Readiness-Scorecard.pdf",
  },
};

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

  console.log("[resource] request received audience=" + (audience || "none"));

  if (!firstName || !email || !consent) {
    return res.status(400).json({ success: false, error: "MISSING_FIELDS" });
  }
  var cfg = RESOURCES[audience];
  if (!cfg) {
    console.error("[resource] unknown audience");
    return res.status(400).json({ success: false, error: "UNKNOWN_RESOURCE" });
  }
  console.log("[resource] payload validated audience=" + audience);

  var apiKey = process.env.MAILERLITE_API_KEY;
  var groupId = process.env[cfg.groupEnv];
  var postmarkToken = process.env.POSTMARK_SERVER_TOKEN;
  var from = process.env.FULFILLMENT_FROM_EMAIL;
  if (!apiKey || !groupId || !postmarkToken || !from) {
    console.error("[resource] not configured ml=" + !!apiKey + " group=" + !!groupId +
      " postmark=" + !!postmarkToken + " from=" + !!from);
    return res.status(500).json({ success: false, error: "SERVER_NOT_CONFIGURED" });
  }

  // ---- 1) MailerLite subscribe (list building) --------------------------------
  console.log("[resource] mailerlite subscribe started");
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
        groups: [String(groupId)],
        status: "active",
      }),
    });
    if (!mlRes.ok) {
      var mlDetail = await safeBody(mlRes);
      console.error("[resource] mailerlite rejected status=" + mlRes.status + " body=" + mlDetail);
      return res.status(502).json({ success: false, error: "SUBSCRIBE_FAILED" });
    }
    console.log("[resource] mailerlite succeeded status=" + mlRes.status);
  } catch (e) {
    console.error("[resource] mailerlite unreachable: " + (e && e.message));
    return res.status(502).json({ success: false, error: "SUBSCRIBE_FAILED" });
  }

  // ---- 2) Email the resource link via Postmark, and CONFIRM acceptance --------
  console.log("[resource] email started provider=postmark");
  var link = ORIGIN + cfg.path;
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
        Subject: "Your free resource: " + cfg.name,
        HtmlBody: emailHtml(firstName, cfg.name, link),
        TextBody: emailText(firstName, cfg.name, link),
        MessageStream: "outbound",
      }),
    });
    accepted = pmRes.ok;
    if (!pmRes.ok) {
      var pmDetail = "";
      try { var j = await pmRes.json(); pmDetail = (j && (j.Message || j.ErrorCode)) || ""; } catch (e) {}
      console.error("[resource] postmark rejected status=" + pmRes.status + " " + pmDetail);
    } else {
      console.log("[resource] postmark accepted status=" + pmRes.status);
    }
  } catch (e) {
    console.error("[resource] postmark request failed: " + (e && e.message));
  }

  if (!accepted) {
    // MailerLite already succeeded, but delivery is what the visitor was promised.
    // Report failure so the frontend does NOT claim the resource is on its way.
    console.log("[resource] final=EMAIL_DELIVERY_FAILED (subscriber added, email not accepted)");
    return res.status(502).json({ success: false, error: "EMAIL_DELIVERY_FAILED" });
  }

  console.log("[resource] final=success audience=" + audience);
  return res.status(200).json({ success: true, emailAccepted: true });
};

// Read a provider error body safely for logs (never throws, bounded length).
async function safeBody(r) {
  try { return String(await r.text()).replace(/\s+/g, " ").slice(0, 200); }
  catch (e) { return "(unreadable)"; }
}

// ---- Branded transactional email (navy/gold, table-based, email-client safe) ----
function emailHtml(firstName, resourceName, link) {
  var href = escapeAttr(link);
  var greeting = firstName ? "Hi " + escapeHtml(firstName) + "," : "Hello,";
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="dark light"><title>Your free resource</title></head>' +
    '<body style="margin:0;padding:0;background:#050B1C;">' +
    '<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">Your free resource from AI Explorers Academy is ready.</span>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050B1C;"><tr><td align="center" style="padding:32px 16px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#07122D;border:1px solid rgba(212,175,79,0.28);border-radius:16px;">' +
    '<tr><td style="padding:34px 40px 6px;text-align:center;font-family:Georgia,\'Times New Roman\',serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#D4AF4F;">AI Explorers Academy</td></tr>' +
    '<tr><td style="padding:6px 40px 0;text-align:center;"><h1 style="margin:0;font-family:Georgia,\'Times New Roman\',serif;font-weight:normal;font-size:28px;line-height:1.15;color:#F5F4EF;">Your free resource is ready.</h1></td></tr>' +
    '<tr><td style="padding:20px 40px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#C9D2E4;">' +
    '<p style="margin:0 0 16px;">' + greeting + '</p>' +
    '<p style="margin:0 0 16px;">Thank you for your interest in AI literacy. Here is your copy of <strong>' + escapeHtml(resourceName) + '</strong>.</p>' +
    '<p style="margin:0;">Use the button below to open and save your PDF.</p></td></tr>' +
    '<tr><td align="center" style="padding:28px 40px 6px;">' +
    '<a href="' + href + '" style="display:inline-block;background:#D4AF4F;color:#2A1E00;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;text-decoration:none;padding:15px 36px;border-radius:999px;">Download the PDF</a></td></tr>' +
    '<tr><td style="padding:14px 40px 0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#8A95AD;">If the button doesn\'t work, copy and paste this link:<br><span style="color:#C9D2E4;word-break:break-all;">' + escapeHtml(link) + '</span></td></tr>' +
    '<tr><td style="padding:16px 40px 0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#8A95AD;">Questions? Contact <a href="mailto:' + SUPPORT_EMAIL + '" style="color:#D4AF4F;text-decoration:none;">' + SUPPORT_EMAIL + '</a>.</td></tr>' +
    '<tr><td style="padding:24px 40px 34px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">' +
    '<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:14px;color:#F5F4EF;">AI Explorers Academy</div>' +
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:1px;color:#8A95AD;margin-top:4px;">Discover • Imagine • Create with AI</div></td></tr>' +
    '</table></td></tr></table></body></html>';
}

function emailText(firstName, resourceName, link) {
  return (firstName ? "Hi " + firstName + ",\n\n" : "Hello,\n\n") +
    "Thank you for your interest in AI literacy. Here is your copy of " + resourceName + ".\n\n" +
    "Download the PDF:\n" + link + "\n\n" +
    "Questions? Contact " + SUPPORT_EMAIL + ".\n\n" +
    "AI Explorers Academy\nDiscover • Imagine • Create with AI\n";
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
