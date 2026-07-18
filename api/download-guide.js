// ============================================================
// AI Explorers Academy — Gated PDF download (Edge streaming via @vercel/blob)
// Vercel EDGE Function.  GET /api/download-guide?token=…
//
// Retrieves the PRIVATE guide by STABLE PATHNAME from the connected Blob store using
// the official @vercel/blob get(). Config holds only a pathname (GUIDE_PDF_BLOB_PATH) —
// never a store-specific hostname or full object URL — so re-uploading the PDF to the
// same pathname can never break the live download again.
//
// Auth: OIDC is delivered to a running function on the `x-vercel-oidc-token` REQUEST
// HEADER (process.env.VERCEL_OIDC_TOKEN is empty at runtime). The SDK's auto-OIDC reads
// process.env, so we pass the header token EXPLICITLY via get()'s oidcToken + storeId
// options; BLOB_READ_WRITE_TOKEN is the fallback (a private store rejects RW-only, so
// OIDC is tried first). No secret/token/URL is ever logged.
//
// Preserved: paid-session HMAC token (DOWNLOAD_TOKEN_SECRET) verification, product
// bind, private storage, Content-Disposition filename, chunked streaming (no
// Content-Length). On ANY failure the customer gets a BRANDED HTML page — never a
// JSON body that a browser would save as ".pdf".
//
// Env: DOWNLOAD_TOKEN_SECRET, GUIDE_PDF_BLOB_PATH, BLOB_STORE_ID,
//      (OIDC via request header), (optional) BLOB_READ_WRITE_TOKEN
// ============================================================

import { get } from "@vercel/blob";

export const config = { runtime: "edge" };

const EXPECTED_PRODUCT = "ai-parenting-survival-guide";
const FILENAME = "AI-Parenting-Survival-Guide.pdf";

export default async function handler(req) {
  if (req.method !== "GET") return errorPage(405, "generic");

  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const tokenSecret = process.env.DOWNLOAD_TOKEN_SECRET;
  const pathname = process.env.GUIDE_PDF_BLOB_PATH;
  if (!tokenSecret || !pathname) {
    console.log("[dl] fail cat=not_configured secret=" + (!!tokenSecret) + " path=" + (!!pathname));
    return errorPage(500, "generic");
  }

  let claims;
  try {
    claims = await verifyToken(token, tokenSecret);
  } catch (e) {
    console.log("[dl] fail cat=token_rejected reason=" + (e && e.message));
    return errorPage(403, "token");
  }
  if (claims.p !== EXPECTED_PRODUCT) {
    console.log("[dl] fail cat=product_mismatch");
    return errorPage(403, "token");
  }

  // Retrieve the private guide by pathname. get()'s explicit `token` option always wins
  // over OIDC, so we set ONE credential per attempt: OIDC (from the request header)
  // first, RW token as fallback, retrying only when the store rejects auth (401/403).
  const oidcToken = req.headers.get("x-vercel-oidc-token") || process.env.VERCEL_OIDC_TOKEN || "";
  const storeId = process.env.BLOB_STORE_ID || "";
  const rwToken = process.env.BLOB_READ_WRITE_TOKEN || "";
  const attempts = [];
  if (oidcToken && storeId) attempts.push({ name: "oidc", opts: { access: "private", oidcToken: oidcToken, storeId: storeId } });
  if (rwToken) attempts.push({ name: "rw", opts: { access: "private", token: rwToken } });
  if (attempts.length === 0) attempts.push({ name: "env", opts: { access: "private" } });

  let result = null;
  let usedAuth = "none";
  let lastStatus = 0;
  for (let i = 0; i < attempts.length; i++) {
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
    console.log("[dl] fail cat=blob_unavailable status=" + lastStatus + " auth=" + usedAuth);
    return errorPage(502, "generic");
  }

  // Stream the private object straight through. Do NOT set Content-Length — chunked
  // transfer avoids the Chrome ERR_CONTENT_LENGTH_MISMATCH abort seen when a forwarded
  // length no longer matched the delivered bytes.
  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": 'attachment; filename="' + FILENAME + '"',
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex",
  });
  console.log("[dl] ok auth=" + usedAuth);
  return new Response(result.stream, { status: 200, headers: headers });
}

// Branded HTML failure page (Content-Type text/html, no attachment) so the browser
// SHOWS it instead of saving a JSON body as "AI-Parenting-Survival-Guide.pdf".
function errorPage(status, kind) {
  const msg = kind === "token"
    ? "Your download link may have expired. Please reopen your confirmation page (from your purchase email) to get a fresh link."
    : "Your purchase is safe — we just hit a temporary issue preparing your file.";
  const html =
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex"><title>Download unavailable — AI Explorers Academy</title></head>' +
    '<body style="margin:0;min-height:100vh;background:#07122D;color:#F5F4EF;display:grid;place-items:center;text-align:center;padding:28px;">' +
    '<div style="max-width:540px;">' +
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#D4AF4F;">AI Explorers Academy</div>' +
    '<h1 style="font-family:Georgia,\'Times New Roman\',serif;font-weight:normal;font-size:30px;line-height:1.2;margin:14px 0 10px;">We couldn’t prepare your download</h1>' +
    '<p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#C9D2E4;margin:0 0 14px;">' + msg + '</p>' +
    '<p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#C9D2E4;margin:0;">Need help? Email <a href="mailto:missjoy@aiexplorersacademy.org" style="color:#D4AF4F;">missjoy@aiexplorersacademy.org</a> and we’ll send your guide right away.</p>' +
    '</div></body></html>';
  return new Response(html, {
    status: status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}

// --- HMAC token verification via Web Crypto (Edge has no Node 'crypto') ---
// Byte-compatible with the base64url HMAC-SHA256 tokens that /api/check-access signs.
async function verifyToken(token, secret) {
  if (!token || token.indexOf(".") === -1) throw new Error("bad token");
  const dot = token.indexOf(".");
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const macBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const expected = base64urlFromBytes(new Uint8Array(macBuf));

  if (!timingSafeEqual(sig, expected)) throw new Error("bad signature");

  const obj = JSON.parse(base64urlToString(payload));
  if (!obj.exp || Math.floor(Date.now() / 1000) > obj.exp) throw new Error("expired");
  return obj;
}

function base64urlFromBytes(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToString(s) {
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// Constant-time compare of two equal-length signature strings.
function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
