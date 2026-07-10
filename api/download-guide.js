// ============================================================
// AI Explorers Academy — Gated PDF download (Edge streaming)
// Vercel EDGE Function.  GET /api/download-guide?token=…
//
// Runs on the Edge runtime so it can STREAM large files (the guide is ~8.6 MB)
// straight from private Blob to the client — no buffering, no Node serverless
// ~4.5 MB response cap.
//
// Protections are UNCHANGED in behavior:
//   • validates the short-lived HMAC token issued by /api/check-access (which itself
//     verifies a PAID Stripe session) — DOWNLOAD_TOKEN_SECRET. Same base64url
//     HMAC-SHA256 scheme, now via Web Crypto so signatures stay byte-identical.
//   • the private Blob URL lives ONLY in GUIDE_PDF_BLOB_URL, is fetched server-side
//     and streamed through — never sent to the browser; the Blob stays private.
//   • BLOB_READ_WRITE_TOKEN is attached ONLY for *.blob.vercel-storage.com hosts.
//
// Env: DOWNLOAD_TOKEN_SECRET, GUIDE_PDF_BLOB_URL, (optional) BLOB_READ_WRITE_TOKEN
// ============================================================

export const config = { runtime: "edge" };

const EXPECTED_PRODUCT = "ai-parenting-survival-guide";

export default async function handler(req) {
  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405, { Allow: "GET" });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const tokenSecret = process.env.DOWNLOAD_TOKEN_SECRET;
  const blobUrl = process.env.GUIDE_PDF_BLOB_URL;
  if (!tokenSecret || !blobUrl) {
    return jsonResponse({ error: "Fulfillment is not configured yet." }, 500);
  }

  let claims;
  try {
    claims = await verifyToken(token, tokenSecret);
  } catch (e) {
    return jsonResponse(
      { error: "This download link is invalid or has expired. Reopen your confirmation page to get a fresh link." },
      403
    );
  }
  if (claims.p !== EXPECTED_PRODUCT) {
    return jsonResponse({ error: "Invalid download link." }, 403);
  }

  // Attach the Blob token ONLY for Vercel Blob hosts (never leak it elsewhere).
  let host = "";
  try { host = new URL(blobUrl).hostname; } catch (e) {}
  const reqHeaders = {};
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (/(^|\.)blob\.vercel-storage\.com$/i.test(host) && blobToken) {
    reqHeaders.Authorization = "Bearer " + blobToken;
  }

  let upstream;
  try {
    upstream = await fetch(blobUrl, { headers: reqHeaders, redirect: "follow" });
  } catch (e) {
    return jsonResponse({ error: "The guide is temporarily unavailable.", detail: "blob_fetch_failed" }, 502);
  }
  if (!upstream.ok || !upstream.body) {
    return jsonResponse({ error: "The guide is temporarily unavailable.", detail: "blob_http_" + upstream.status }, 502);
  }
  const ctype = (upstream.headers.get("content-type") || "").toLowerCase();
  if (ctype.indexOf("text/html") !== -1 || ctype.indexOf("application/json") !== -1) {
    // A non-PDF body means GUIDE_PDF_BLOB_URL isn't the raw object (e.g. a dashboard URL).
    return jsonResponse(
      { error: "The guide is temporarily unavailable.", detail: "blob_content_type_" + (ctype.split(";")[0] || "unknown") },
      502
    );
  }

  // Stream the Blob body straight to the client — no buffering, no size cap.
  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": 'attachment; filename="AI-Parenting-Survival-Guide.pdf"',
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex",
  });
  const len = upstream.headers.get("content-length");
  if (len) headers.set("Content-Length", len);

  return new Response(upstream.body, { status: 200, headers: headers });
}

function jsonResponse(obj, status, extra) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (extra) for (const k in extra) headers.set(k, extra[k]);
  return new Response(JSON.stringify(obj), { status: status, headers: headers });
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
