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
//
// NOTE: TEMPORARY diagnostic logging is enabled below (marked `[dl]`). It logs only
// safe CATEGORIES — never the token, the secret, or the Blob URL. Remove once the
// download is confirmed working.
// ============================================================

export const config = { runtime: "edge" };

const EXPECTED_PRODUCT = "ai-parenting-survival-guide";

export default async function handler(req) {
  console.log("[dl] invoked method=" + req.method);

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405, { Allow: "GET" });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const tokenSecret = process.env.DOWNLOAD_TOKEN_SECRET;
  const blobUrl = process.env.GUIDE_PDF_BLOB_URL;
  if (!tokenSecret || !blobUrl) {
    console.log("[dl] not_configured secret=" + (!!tokenSecret) + " blobUrl=" + (!!blobUrl));
    return jsonResponse({ error: "Fulfillment is not configured yet." }, 500);
  }

  let claims;
  try {
    claims = await verifyToken(token, tokenSecret);
    console.log("[dl] token_ok");
  } catch (e) {
    // e.message is a safe category: "bad token" | "bad signature" | "expired"
    console.log("[dl] token_rejected reason=" + (e && e.message));
    return jsonResponse(
      { error: "This download link is invalid or has expired. Reopen your confirmation page to get a fresh link." },
      403
    );
  }
  if (claims.p !== EXPECTED_PRODUCT) {
    console.log("[dl] product_mismatch");
    return jsonResponse({ error: "Invalid download link." }, 403);
  }

  // Attach the Blob token ONLY for Vercel Blob hosts (never leak it elsewhere).
  // Reading a PRIVATE Vercel Blob (*.private.blob.vercel-storage.com) requires an
  // authenticated request to the Blob host. Per Vercel's "Accessing private blobs
  // without the SDK": on Vercel the short-lived VERCEL_OIDC_TOKEN is PREFERRED (it is
  // scoped to the store connected to this project and rotates automatically); the
  // static BLOB_READ_WRITE_TOKEN is the documented fallback. A bare Bearer of the RW
  // token returned 403, so we try OIDC first, then RW. Tokens are ONLY ever sent to
  // the *.blob.vercel-storage.com host — never leaked elsewhere.
  let host = "";
  try { host = new URL(blobUrl).hostname; } catch (e) {}
  const isVercelBlob = /(^|\.)blob\.vercel-storage\.com$/i.test(host);
  // On Vercel, the OIDC token is delivered to a running FUNCTION on the request
  // header `x-vercel-oidc-token`. process.env.VERCEL_OIDC_TOKEN only holds it during
  // BUILDS / local `vercel env pull` — it is empty at function runtime, which is why
  // the previous run logged oidc=false and fell back to the RW token (403 on a
  // private store). Read the header first; keep env as a secondary source.
  const oidcHeader = req.headers.get("x-vercel-oidc-token") || "";
  const oidcToken = oidcHeader || process.env.VERCEL_OIDC_TOKEN || "";
  const rwToken = process.env.BLOB_READ_WRITE_TOKEN;
  console.log(
    "[dl] blob_auth host=" + host +
    " oidc_hdr=" + (!!oidcHeader) + " oidc_env=" + (!!process.env.VERCEL_OIDC_TOKEN) +
    " rw=" + (!!rwToken) + " store_id=" + (!!process.env.BLOB_STORE_ID)
  );

  // Ordered credential attempts, best first. A non-Blob host gets an unauthenticated read.
  const attempts = [];
  if (isVercelBlob && oidcToken) attempts.push({ name: "oidc", token: oidcToken });
  if (isVercelBlob && rwToken) attempts.push({ name: "rw", token: rwToken });
  if (attempts.length === 0) attempts.push({ name: "none", token: null });

  let upstream = null;
  let usedAuth = "none";
  for (let i = 0; i < attempts.length; i++) {
    const a = attempts[i];
    const h = {};
    if (a.token) h.Authorization = "Bearer " + a.token;
    try {
      upstream = await fetch(blobUrl, { headers: h, redirect: "follow" });
    } catch (e) {
      console.log("[dl] blob_fetch_failed auth=" + a.name);
      return jsonResponse({ error: "The guide is temporarily unavailable.", detail: "blob_fetch_failed" }, 502);
    }
    usedAuth = a.name;
    console.log("[dl] blob_try auth=" + a.name + " status=" + upstream.status);
    // Success or a non-auth error → stop. Only retry when auth was rejected (401/403).
    if (upstream.status !== 401 && upstream.status !== 403) break;
  }

  const ctype = (upstream.headers.get("content-type") || "").toLowerCase();
  const upstreamLen = upstream.headers.get("content-length");
  console.log("[dl] blob_status=" + upstream.status + " auth_used=" + usedAuth + " ctype=" + (ctype || "none") + " content_length=" + (upstreamLen || "none"));

  if (!upstream.ok || !upstream.body) {
    return jsonResponse({ error: "The guide is temporarily unavailable.", detail: "blob_http_" + upstream.status }, 502);
  }
  if (ctype.indexOf("text/html") !== -1 || ctype.indexOf("application/json") !== -1) {
    // A non-PDF body means GUIDE_PDF_BLOB_URL isn't the raw object (e.g. a dashboard URL).
    return jsonResponse(
      { error: "The guide is temporarily unavailable.", detail: "blob_content_type_" + (ctype.split(";")[0] || "unknown") },
      502
    );
  }

  // ---- Stream the Blob body straight to the client ----------------------------
  // IMPORTANT: do NOT forward the upstream Content-Length. Re-streaming through the
  // edge network can change the byte framing (chunked transfer), and a Content-Length
  // that no longer matches the delivered bytes makes Chrome ABORT the download
  // ("Site wasn't available" / ERR_CONTENT_LENGTH_MISMATCH) after the Save dialog.
  // Streaming without Content-Length uses chunked encoding, which downloads cleanly.
  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": 'attachment; filename="AI-Parenting-Survival-Guide.pdf"',
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex",
  });

  // Pass the body through a TransformStream purely to log that streaming actually
  // begins and completes (or throws) — visible in Vercel Runtime Logs. No buffering.
  let started = false;
  let total = 0;
  const monitor = new TransformStream({
    transform(chunk, controller) {
      if (!started) { started = true; console.log("[dl] stream_start"); }
      total += (chunk && chunk.byteLength) ? chunk.byteLength : 0;
      controller.enqueue(chunk);
    },
    flush() {
      console.log("[dl] stream_done bytes=" + total);
    },
  });

  return new Response(upstream.body.pipeThrough(monitor), { status: 200, headers: headers });
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
