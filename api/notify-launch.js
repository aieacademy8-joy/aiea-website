// ============================================================
// AI Explorers Academy — Book/Collection launch notifications (MailerLite)
// Vercel Serverless Function.  POST /api/notify-launch
//
// Subscribes the visitor to a PRODUCT-SPECIFIC launch group so they are notified
// when that title launches. Group IDs come from Vercel Environment Variables —
// never hardcoded. MailerLite upserts by email, so no duplicate subscribers.
//
//   audience "ai-literacy-book"    -> ML_GROUP_AI_LITERACY_BOOK_LAUNCH
//   audience "30-days-adventures"  -> ML_GROUP_30_DAYS_ADVENTURES_LAUNCH
//
// The general Newsletter group is added ONLY when the visitor explicitly opts in
// (newsletter:true) — a launch signup alone never joins the Newsletter.
//
// Required Vercel env vars:
//   MAILERLITE_API_KEY
//   ML_GROUP_AI_LITERACY_BOOK_LAUNCH
//   ML_GROUP_30_DAYS_ADVENTURES_LAUNCH
//   ML_GROUP_NEWSLETTER   (only used when the optional newsletter box is ticked)
// ============================================================

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  var body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  var firstName = String(body.first_name || "").trim();
  var email = String(body.email || "").trim();
  var audience = String(body.audience || "").trim();
  var consent = body.consent === true || body.consent === "true" || body.consent === "on";
  var wantsNewsletter = body.newsletter === true || body.newsletter === "true" || body.newsletter === "on";

  if (!firstName || !email || !consent) {
    return res.status(400).json({ error: "First name, email and consent are required." });
  }

  var LAUNCH_GROUPS = {
    "ai-literacy-book": process.env.ML_GROUP_AI_LITERACY_BOOK_LAUNCH,
    "30-days-adventures": process.env.ML_GROUP_30_DAYS_ADVENTURES_LAUNCH,
  };
  var launchGroup = LAUNCH_GROUPS[audience];
  var apiKey = process.env.MAILERLITE_API_KEY;

  if (!apiKey || !launchGroup) {
    return res.status(500).json({ error: "Server is not configured yet." });
  }

  var groups = [String(launchGroup)];
  // Only join the general Newsletter group if the visitor separately opted in.
  if (wantsNewsletter && process.env.ML_GROUP_NEWSLETTER) {
    groups.push(String(process.env.ML_GROUP_NEWSLETTER));
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
        groups: groups,
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
