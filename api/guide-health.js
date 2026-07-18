// ============================================================
// AI Explorers Academy — Guide Blob health check (Node.js runtime, @vercel/blob)
// Vercel Serverless Function (Node.js).  GET /api/guide-health  (optionally ?key=…)
//
// Node.js runtime because @vercel/blob is not Edge-compatible. Verifies the private
// guide is RETRIEVABLE by its stable pathname using head() — metadata ONLY. It never
// streams the PDF, never returns a private/object URL, and cannot be used to obtain the
// file, so it neither exposes the guide publicly nor bypasses purchase authorization.
//
// Controlled: if HEALTHCHECK_SECRET is set, a matching ?key= is required; otherwise it
// returns only non-sensitive existence metadata. Logs only safe categories.
//
// Env: GUIDE_PDF_BLOB_PATH, BLOB_STORE_ID, (OIDC via request header),
//      (optional) BLOB_READ_WRITE_TOKEN, (optional) HEALTHCHECK_SECRET
// ============================================================

const { head } = require("@vercel/blob");

module.exports = async (req, res) => {
  var secret = process.env.HEALTHCHECK_SECRET;
  var key = (req.query && req.query.key) || "";
  if (secret && key !== secret) return sendJson(res, 401, { ok: false, error: "unauthorized" });

  var pathname = process.env.GUIDE_PDF_BLOB_PATH;
  if (!pathname) {
    console.log("[health] fail cat=not_configured");
    return sendJson(res, 500, { ok: false, category: "not_configured" });
  }

  var oidcToken = (req.headers && req.headers["x-vercel-oidc-token"]) || process.env.VERCEL_OIDC_TOKEN || "";
  var storeId = process.env.BLOB_STORE_ID || "";
  var rwToken = process.env.BLOB_READ_WRITE_TOKEN || "";
  var attempts = [];
  if (oidcToken && storeId) attempts.push({ name: "oidc", opts: { access: "private", oidcToken: oidcToken, storeId: storeId } });
  if (rwToken) attempts.push({ name: "rw", opts: { access: "private", token: rwToken } });
  if (attempts.length === 0) attempts.push({ name: "env", opts: { access: "private" } });

  for (var i = 0; i < attempts.length; i++) {
    try {
      var meta = await head(pathname, attempts[i].opts);
      console.log("[health] ok auth=" + attempts[i].name);
      return sendJson(res, 200, { ok: true, size: meta && meta.size, contentType: meta && meta.contentType, auth: attempts[i].name });
    } catch (e) {
      console.log("[health] miss auth=" + attempts[i].name);
    }
  }
  console.log("[health] fail cat=blob_unavailable");
  return sendJson(res, 502, { ok: false, category: "blob_unavailable" });
};

function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  res.end(JSON.stringify(obj));
}
