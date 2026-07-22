// ============================================================
// AI Explorers Academy — Gated PDF download (Node.js runtime, @vercel/blob)
// Vercel Serverless Function (Node.js).  GET /api/download-guide?token=…
//
// Runs on the Node.js runtime: @vercel/blob depends on undici / node:stream and is NOT
// Edge-compatible. We still avoid the ~4.5 MB buffered-response cap by STREAMING the
// object (Readable.fromWeb(...).pipe(res)) instead of buffering it.
//
// MULTI-PRODUCT: the signed token carries the product key (claims.p). That key selects
// which env var holds the PDF location and which filename is served — so a token issued
// for one product can NEVER download the other product's PDF. An unknown key is refused.
//
// Each product's PDF stays PRIVATE in the connected Blob store and is fetched by STABLE
// PATHNAME via get(). Config holds only a pathname — never a store-specific hostname —
// so re-uploading a PDF to the same pathname can never break the live download again.
// (If a full https:// object URL is configured instead, we defensively reduce it to its
// pathname so a pasted URL still resolves.)
//
// Auth: OIDC arrives on the `x-vercel-oidc-token` request header (process.env is empty
// at runtime), so we pass get()'s oidcToken + storeId explicitly; BLOB_READ_WRITE_TOKEN
// is the fallback (a private store rejects RW-only, so OIDC is tried first).
//
// Preserved: paid-session HMAC token (DOWNLOAD_TOKEN_SECRET) verification, product bind,
// private storage, Content-Disposition filename, chunked streaming (no Content-Length),
// branded HTML failure page (never a JSON body saved as ".pdf"), and safe category-only
// logging (never secrets, emails, tokens, or private URLs).
//
// Env: DOWNLOAD_TOKEN_SECRET, BLOB_STORE_ID, (OIDC via request header),
//      (optional) BLOB_READ_WRITE_TOKEN, plus per-product:
//        GUIDE_PDF_BLOB_PATH                     – AI Parenting Survival Guide (unchanged)
//        FIRST_AI_LITERACY_JOURNEY_PDF_BLOB_URL  – The First AI Literacy Journey
// ============================================================

const { get } = require("@vercel/blob");
const crypto = require("crypto");
const { Readable } = require("node:stream");

// Server-side product registry (never shipped to the browser).
// The token's product key selects exactly one entry — this IS the cross-product guard.
var PRODUCTS = {
  "ai-parenting-survival-guide": {
    name: "AI Parenting Survival Guide",
    pdfEnv: "GUIDE_PDF_BLOB_PATH",
    filename: "AI-Parenting-Survival-Guide.pdf",
  },
  "first-ai-literacy-journey": {
    name: "The First AI Literacy Journey",
    pdfEnv: "FIRST_AI_LITERACY_JOURNEY_PDF_BLOB_URL",
    filename: "The-First-AI-Literacy-Journey.pdf",
  },
};

module.exports = async (req, res) => {
  if (req.method !== "GET") return sendErrorPage(res, 405, "generic");

  var token = (req.query && req.query.token) || "";
  var tokenSecret = process.env.DOWNLOAD_TOKEN_SECRET;
  if (!tokenSecret) {
    console.log("[dl] fail cat=not_configured secret=false");
    return sendErrorPage(res, 500, "generic");
  }

  var claims;
  try {
    claims = verifyToken(token, tokenSecret);
  } catch (e) {
    console.log("[dl] fail cat=token_rejected reason=" + (e && e.message));
    return sendErrorPage(res, 403, "token");
  }

  // Product bind: the signed key decides which PDF may be served.
  var cfg = PRODUCTS[claims.p];
  if (!cfg) {
    console.log("[dl] fail cat=product_mismatch");
    return sendErrorPage(res, 403, "token");
  }

  var pathname = toBlobPathname(process.env[cfg.pdfEnv]);
  if (!pathname) {
    console.log("[dl] fail cat=not_configured product=" + claims.p + " path=false");
    return sendErrorPage(res, 500, "generic");
  }

  // Retrieve the private PDF by pathname. get()'s explicit `token` option always wins
  // over OIDC, so we set ONE credential per attempt: OIDC (from the request header)
  // first, RW token fallback, retrying only when the store rejects auth (401/403).
  var oidcToken = (req.headers && req.headers["x-vercel-oidc-token"]) || process.env.VERCEL_OIDC_TOKEN || "";
  var storeId = process.env.BLOB_STORE_ID || "";
  var rwToken = process.env.BLOB_READ_WRITE_TOKEN || "";
  var attempts = [];
  if (oidcToken && storeId) attempts.push({ name: "oidc", opts: { access: "private", oidcToken: oidcToken, storeId: storeId } });
  if (rwToken) attempts.push({ name: "rw", opts: { access: "private", token: rwToken } });
  if (attempts.length === 0) attempts.push({ name: "env", opts: { access: "private" } });

  var result = null, usedAuth = "none", lastStatus = 0;
  for (var i = 0; i < attempts.length; i++) {
    usedAuth = attempts[i].name;
    try {
      result = await get(pathname, attempts[i].opts);
    } catch (e) {
      console.log("[dl] blob_get_error auth=" + usedAuth);
      result = null;
      continue;
    }
    lastStatus = result ? result.statusCode : 0;
    console.log("[dl] blob_get auth=" + usedAuth + " status=" + lastStatus);
    if (result && result.statusCode !== 401 && result.statusCode !== 403) break;
  }

  if (!result || result.statusCode !== 200 || !result.stream) {
    console.log("[dl] fail cat=blob_unavailable product=" + claims.p + " status=" + lastStatus + " auth=" + usedAuth);
    return sendErrorPage(res, 502, "generic");
  }

  // Stream straight through. No Content-Length → chunked transfer, which both avoids
  // the buffered-response cap and the Chrome ERR_CONTENT_LENGTH_MISMATCH abort.
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="' + cfg.filename + '"');
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  console.log("[dl] ok product=" + claims.p + " auth=" + usedAuth);
  var nodeStream = Readable.fromWeb(result.stream);
  nodeStream.on("error", function () { try { res.destroy(); } catch (e) {} });
  nodeStream.pipe(res);
};

// Accept a stable pathname ("folder/File.pdf"). If a full object URL was configured,
// reduce it to its pathname so the SDK lookup still succeeds.
function toBlobPathname(value) {
  var v = String(value || "").trim();
  if (!v) return "";
  if (v.indexOf("http://") === 0 || v.indexOf("https://") === 0) {
    try { v = decodeURIComponent(new URL(v).pathname); } catch (e) { return ""; }
  }
  return v.replace(/^\/+/, "");
}

// Branded HTML failure page (text/html, no attachment) so the browser SHOWS it instead
// of saving a JSON body as a ".pdf". The thank-you link has no download attribute, so
// failures navigate here while success still downloads.
function sendErrorPage(res, status, kind) {
  var msg = kind === "token"
    ? "Your download link may have expired. Please reopen your confirmation page (from your purchase email) to get a fresh link."
    : "Your purchase is safe — we just hit a temporary issue preparing your file.";
  var html =
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex"><title>Download unavailable — AI Explorers Academy</title></head>' +
    '<body style="margin:0;min-height:100vh;background:#07122D;color:#F5F4EF;display:grid;place-items:center;text-align:center;padding:28px;">' +
    '<div style="max-width:540px;">' +
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#D4AF4F;">AI Explorers Academy</div>' +
    '<h1 style="font-family:Georgia,\'Times New Roman\',serif;font-weight:normal;font-size:30px;line-height:1.2;margin:14px 0 10px;">We couldn’t prepare your download</h1>' +
    '<p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#C9D2E4;margin:0 0 14px;">' + msg + '</p>' +
    '<p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#C9D2E4;margin:0;">Need help? Email <a href="mailto:missjoy@aiexplorersacademy.org" style="color:#D4AF4F;">missjoy@aiexplorersacademy.org</a> and we’ll send your file right away.</p>' +
    '</div></body></html>';
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  res.end(html);
}

// HMAC token verification via Node crypto — byte-compatible with the base64url
// HMAC-SHA256 tokens that /api/check-access signs.
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
