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
    return res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
  }

  var body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  var firstName = String(body.first_name || "").trim();
  var email = String(body.email || "").trim();
  var audience = String(body.audience || "").trim();
  var consent = body.consent === true || body.consent === "true" || body.consent === "on";
  var wantsNewsletter = body.newsletter === true || body.newsletter === "true" || body.newsletter === "on";

  console.log("[launch] request received audience=" + (audience || "none") + " newsletter=" + wantsNewsletter);

  if (!firstName || !email || !consent) {
    return res.status(400).json({ success: false, error: "MISSING_FIELDS" });
  }

  var LAUNCH_GROUPS = {
    "ai-literacy-book": process.env.ML_GROUP_AI_LITERACY_BOOK_LAUNCH,
    "30-days-adventures": process.env.ML_GROUP_30_DAYS_ADVENTURES_LAUNCH,
  };
  var launchGroup = LAUNCH_GROUPS[audience];
  var apiKey = process.env.MAILERLITE_API_KEY;

  if (!apiKey || !launchGroup) {
    // Distinguish a missing API key from an unset launch group so the Vercel logs point
    // straight at the variable to fix (the group ID is per-product and set separately).
    console.error("[launch] not configured ml=" + !!apiKey + " group[" + audience + "]=" + !!launchGroup);
    return res.status(500).json({ success: false, error: "SERVER_NOT_CONFIGURED" });
  }

  var groups = [String(launchGroup)];
  // Only join the general Newsletter group if the visitor SEPARATELY opted in — a launch
  // signup alone never joins the Newsletter.
  if (wantsNewsletter && process.env.ML_GROUP_NEWSLETTER) {
    groups.push(String(process.env.ML_GROUP_NEWSLETTER));
  }

  console.log("[launch] mailerlite subscribe started audience=" + audience + " groups=" + groups.length);
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
      console.log("[launch] final=success audience=" + audience);
      return res.status(200).json({ success: true });
    }
    // Log the provider reason server-side (e.g. "groups.0 is invalid" → a bad group ID in
    // Vercel); never return the raw provider body to the browser.
    var detail = await safeBody(mlRes);
    console.error("[launch] mailerlite rejected audience=" + audience + " status=" + mlRes.status + " body=" + detail);
    return res.status(502).json({ success: false, error: "SUBSCRIBE_FAILED" });
  } catch (e) {
    console.error("[launch] mailerlite unreachable: " + (e && e.message));
    return res.status(502).json({ success: false, error: "SUBSCRIBE_FAILED" });
  }
};

// Read a provider error body safely for logs (never throws, bounded length).
async function safeBody(r) {
  try { return String(await r.text()).replace(/\s+/g, " ").slice(0, 200); }
  catch (e) { return "(unreadable)"; }
}
