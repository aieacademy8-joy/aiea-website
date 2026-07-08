// ============================================================
// AI Explorers Academy — Gated PDF download
// Vercel Serverless Function.  GET /api/download-guide?token=…
//
// Validates the short-lived, HMAC-signed token issued by /api/check-access, then
// streams the AI Parenting Survival Guide PDF from private Vercel Blob storage.
//
// The Blob URL (unguessable) lives ONLY in GUIDE_PDF_BLOB_URL and is fetched
// server-side — it is never sent to the browser, so the PDF has no public URL.
//
// Required Vercel env vars:
//   DOWNLOAD_TOKEN_SECRET   – HMAC secret (must match /api/check-access)
//   GUIDE_PDF_BLOB_URL      – the Vercel Blob URL of the uploaded PDF (server-side only)
//
// No npm dependencies — Node's built-in `crypto` + fetch.
// ============================================================

const crypto = require("crypto");

var EXPECTED_PRODUCT = "ai-parenting-survival-guide";

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  var token = String((req.query && req.query.token) || "");
  var tokenSecret = process.env.DOWNLOAD_TOKEN_SECRET;
  var blobUrl = process.env.GUIDE_PDF_BLOB_URL;
  if (!tokenSecret || !blobUrl) {
    return res.status(500).json({ error: "Fulfillment is not configured yet." });
  }

  var claims;
  try {
    claims = verifyToken(token, tokenSecret);
  } catch (e) {
    return res.status(403).json({
      error: "This download link is invalid or has expired. Reopen your confirmation page to get a fresh link.",
    });
  }
  if (claims.p !== EXPECTED_PRODUCT) {
    return res.status(403).json({ error: "Invalid download link." });
  }

  var pdf;
  try {
    var r = await fetch(blobUrl);
    if (!r.ok) throw new Error("blob fetch " + r.status);
    pdf = Buffer.from(await r.arrayBuffer());
  } catch (e) {
    return res.status(502).json({ error: "The guide is temporarily unavailable. Please try again shortly." });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="AI-Parenting-Survival-Guide.pdf"');
  res.setHeader("Content-Length", String(pdf.length));
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  return res.status(200).send(pdf);
};

function verifyToken(token, secret) {
  if (!token || token.indexOf(".") === -1) throw new Error("bad token");
  var dot = token.indexOf(".");
  var payload = token.slice(0, dot);
  var sig = token.slice(dot + 1);
  var expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  var a = Buffer.from(sig);
  var b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error("bad signature");
  var obj = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (!obj.exp || Math.floor(Date.now() / 1000) > obj.exp) throw new Error("expired");
  return obj;
}
