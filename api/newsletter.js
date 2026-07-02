// ============================================================
// AI Explorers Academy — Community / Newsletter signup (MailerLite)
// Vercel Serverless Function.  POST /api/newsletter
//
// Adds the visitor to the MailerLite "Newsletter" group. MailerLite upserts
// by email, so no duplicate subscribers are ever created.
//
//   • email not found            → create + add to Newsletter        → "subscribed"
//   • found & active/unconfirmed  → add to Newsletter (no duplicate)  → "subscribed"
//   • found & unsubscribed        → auto-restore + add to Newsletter  → "resubscribed"
//   • unsubscribed & restore blocked (anti-spam) → send double opt-in → "reconfirm_required"
//
// The API key and Group ID live in Vercel Environment Variables — never in the repo.
// Required Vercel env vars:
//   MAILERLITE_API_KEY   – MailerLite API token (Bearer)
//   ML_GROUP_NEWSLETTER  – Group ID for "Newsletter"
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
  var consent = body.consent === true || body.consent === "true" || body.consent === "on";

  if (!firstName || !email || !consent) {
    return res.status(400).json({ error: "First name, email and consent are required." });
  }

  var apiKey = process.env.MAILERLITE_API_KEY;
  var groupId = process.env.ML_GROUP_NEWSLETTER;
  if (!apiKey || !groupId) {
    return res.status(500).json({ error: "Server is not configured yet." });
  }

  var BASE = "https://connect.mailerlite.com/api";
  var headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": "Bearer " + apiKey,
  };

  // POST /subscribers upserts by email (no duplicates) and applies groups + status.
  function upsert(status) {
    return fetch(BASE + "/subscribers", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        email: email,
        fields: { name: firstName },
        groups: [String(groupId)],
        status: status,
      }),
    });
  }

  // Returns the subscriber's current status, or null if not found / unreadable.
  function lookupStatus() {
    return fetch(BASE + "/subscribers/" + encodeURIComponent(email), { headers: headers })
      .then(function (r) {
        if (!r.ok) return null; // 404 → not a subscriber yet
        return r.json().then(function (j) { return j && j.data ? j.data.status : null; });
      })
      .catch(function () { return null; });
  }

  try {
    var priorStatus = await lookupStatus();

    if (priorStatus === "unsubscribed") {
      // 1) Attempt automatic restoration — the visitor just gave fresh, explicit consent.
      await upsert("active");
      // 2) Verify it actually persisted; some accounts/regulations block API reactivation.
      var verified = await lookupStatus();
      if (verified === "active") {
        return res.status(200).json({ ok: true, status: "resubscribed" });
      }
      // 3) Compliant fallback: route them through double opt-in so they restore it themselves.
      await upsert("unconfirmed");
      return res.status(200).json({ ok: true, status: "reconfirm_required" });
    }

    // New subscriber, or already active/unconfirmed → ensure active + in the Newsletter group.
    var r = await upsert("active");
    if (r.ok) {
      return res.status(200).json({ ok: true, status: "subscribed" });
    }
    var detail = await r.text();
    return res.status(502).json({ error: "MailerLite rejected the request.", detail: detail });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach MailerLite." });
  }
};
