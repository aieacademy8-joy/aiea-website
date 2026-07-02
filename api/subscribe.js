// ============================================================
// AI Explorers Academy — Free Library signup (MailerLite)
// Vercel Serverless Function.  POST /api/subscribe
//
// Adds a subscriber to the correct MailerLite GROUP, which triggers the
// group's automation to email that audience's PDF. The API key and Group
// IDs live in Vercel Environment Variables — never in the repo.
//
// Required Vercel env vars:
//   MAILERLITE_API_KEY   – MailerLite API token (Bearer)
//   ML_GROUP_PARENTS     – Group ID for "Parents"
//   ML_GROUP_TEACHERS    – Group ID for "Teachers"        (Educators page)
//   ML_GROUP_SCHOOLS     – Group ID for "School Leaders"
// ============================================================

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse body (Vercel usually parses JSON automatically; guard just in case)
  var body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  var firstName = String(body.first_name || "").trim();
  var email = String(body.email || "").trim();
  var audience = String(body.audience || "").trim();
  var consent = body.consent === true || body.consent === "true" || body.consent === "on";

  if (!firstName || !email || !consent) {
    return res.status(400).json({ error: "First name, email and consent are required." });
  }

  // Page audience → MailerLite group (Educators page maps to the Teachers group)
  var GROUPS = {
    parents:   process.env.ML_GROUP_PARENTS,
    educators: process.env.ML_GROUP_TEACHERS,
    schools:   process.env.ML_GROUP_SCHOOLS,
  };
  var groupId = GROUPS[audience];
  var apiKey = process.env.MAILERLITE_API_KEY;

  if (!apiKey || !groupId) {
    return res.status(500).json({ error: "Server is not configured yet." });
  }

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
        // Consent is captured via the required checkbox, so activate immediately
        // rather than waiting on double opt-in — this ensures the group automation fires.
        status: "active",
      }),
    });

    if (mlRes.ok) {
      return res.status(200).json({ ok: true });
    }
    var detail = await mlRes.text();
    return res.status(502).json({ error: "MailerLite rejected the request.", detail: detail });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach MailerLite." });
  }
};
