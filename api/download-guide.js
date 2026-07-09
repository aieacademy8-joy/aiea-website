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

  // Fetch the private PDF server-side and stream it back. Public Vercel Blob URLs need no
  // auth; we attach BLOB_READ_WRITE_TOKEN ONLY when the URL is a Vercel Blob host (so the
  // token can never leak to another host), which also covers authenticated-read objects.
  var host = "";
  try { host = new URL(blobUrl).hostname; } catch (e) {}
  var isVercelBlob = /(^|\.)blob\.vercel-storage\.com$/i.test(host);
  var reqHeaders = {};
  var blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (isVercelBlob && blobToken) reqHeaders.Authorization = "Bearer " + blobToken;

  var r;
  try {
    r = await fetch(blobUrl, { headers: reqHeaders, redirect: "follow" });
  } catch (e) {
    console.error("[download-guide] blob fetch threw:", e && e.message);
    return res.status(502).json({ error: "The guide is temporarily unavailable.", detail: "blob_fetch_failed" });
  }
  if (!r.ok) {
    console.error("[download-guide] blob non-ok status:", r.status);
    return res.status(502).json({ error: "The guide is temporarily unavailable.", detail: "blob_http_" + r.status });
  }
  var ctype = (r.headers.get("content-type") || "").toLowerCase();
  if (ctype.indexOf("text/html") !== -1 || ctype.indexOf("application/json") !== -1) {
    // A non-PDF body means GUIDE_PDF_BLOB_URL is not the raw object (e.g. a dashboard URL).
    console.error("[download-guide] unexpected blob content-type:", ctype);
    return res.status(502).json({ error: "The guide is temporarily unavailable.", detail: "blob_content_type_" + (ctype.split(";")[0] || "unknown") });
  }

  var pdf;
  try {
    pdf = Buffer.from(await r.arrayBuffer());
  } catch (e) {
    return res.status(502).json({ error: "The guide is temporarily unavailable.", detail: "blob_read_failed" });
  }
  if (!pdf.length) {
    return res.status(502).json({ error: "The guide is temporarily unavailable.", detail: "blob_empty" });
  }
  console.error("[download-guide] serving pdf bytes:", pdf.length);
  // Vercel Node functions cap the response body (~4.5MB). Flag oversized PDFs clearly so we
  // switch to streaming/edge delivery instead of failing opaquely.
  if (pdf.length > 4400000) {
    return res.status(502).json({ error: "The guide is temporarily unavailable.", detail: "pdf_too_large_" + pdf.length });
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
