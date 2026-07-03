// ============================================================
// AI Explorers Academy — "Request a Printed Copy" (MailerLite)
// Vercel Serverless Function.  POST /api/book-request
//
// Collects expressions of interest for limited U.S. print batches of
// "AI Literacy for Children". This is NOT a paid pre-order — no payment.
// Adds the person to the print-interest group; MailerLite upserts by email,
// so no duplicate subscribers are created.
//
// Required Vercel env vars:
//   MAILERLITE_API_KEY   – MailerLite API token (Bearer)
//   ML_GROUP_BOOK_PRINT  – Group ID for the print-interest group
//
// State / Quantity / Purchasing-for are stored as MailerLite subscriber fields
// (keys: state, quantity, purchasing_for). If those custom fields don't exist
// in the account yet, the request still succeeds (falls back to name only) so a
// lead is never lost — create the fields to capture the extra data.
// ============================================================

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  var body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  var name = String(body.name || "").trim();
  var email = String(body.email || "").trim();
  var state = String(body.state || "").trim();
  var quantity = String(body.quantity || "").trim();
  var purchasingFor = String(body.purchasing_for || "").trim();

  if (!name || !email || !state || !purchasingFor) {
    return res.status(400).json({ error: "Name, email, state and purchasing-for are required." });
  }

  var apiKey = process.env.MAILERLITE_API_KEY;
  var groupId = process.env.ML_GROUP_BOOK_PRINT;
  if (!apiKey || !groupId) {
    return res.status(500).json({ error: "Server is not configured yet." });
  }

  var headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": "Bearer " + apiKey,
  };

  function subscribe(fields) {
    return fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        email: email,
        fields: fields,
        groups: [String(groupId)],
        status: "active",
      }),
    });
  }

  try {
    // Full record first; if the custom fields aren't set up yet, retry with just the
    // name so the lead + group membership are always captured.
    var r = await subscribe({ name: name, state: state, quantity: quantity, purchasing_for: purchasingFor });
    if (!r.ok) {
      r = await subscribe({ name: name });
    }
    if (r.ok) {
      return res.status(200).json({ ok: true });
    }
    var detail = await r.text();
    return res.status(502).json({ error: "MailerLite rejected the request.", detail: detail });
  } catch (e) {
    return res.status(502).json({ error: "Could not reach MailerLite." });
  }
};
