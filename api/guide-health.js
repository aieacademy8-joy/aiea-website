// ============================================================
// AI Explorers Academy — Guide Blob health check
// Vercel EDGE Function.  GET /api/guide-health   (optionally ?key=<HEALTHCHECK_SECRET>)
//
// Verifies the private guide is RETRIEVABLE by its stable pathname, using head() —
// metadata ONLY. It never streams the PDF, never returns a private/object URL, and
// cannot be used to obtain the file, so it neither exposes the guide publicly nor
// bypasses purchase authorization. Returns { ok, size, contentType }.
//
// Controlled: if HEALTHCHECK_SECRET is set, a matching ?key= is required; otherwise it
// returns only non-sensitive existence metadata. Logs only safe categories.
//
// Env: GUIDE_PDF_BLOB_PATH, BLOB_STORE_ID, (OIDC via request header),
//      (optional) BLOB_READ_WRITE_TOKEN, (optional) HEALTHCHECK_SECRET
// ============================================================

import { head } from "@vercel/blob";

export const config = { runtime: "edge" };

export default async function handler(req) {
  const url = new URL(req.url);

  const secret = process.env.HEALTHCHECK_SECRET;
  if (secret && url.searchParams.get("key") !== secret) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const pathname = process.env.GUIDE_PDF_BLOB_PATH;
  if (!pathname) {
    console.log("[health] fail cat=not_configured");
    return json({ ok: false, category: "not_configured" }, 500);
  }

  const oidcToken = req.headers.get("x-vercel-oidc-token") || process.env.VERCEL_OIDC_TOKEN || "";
  const storeId = process.env.BLOB_STORE_ID || "";
  const rwToken = process.env.BLOB_READ_WRITE_TOKEN || "";
  const attempts = [];
  if (oidcToken && storeId) attempts.push({ name: "oidc", opts: { access: "private", oidcToken: oidcToken, storeId: storeId } });
  if (rwToken) attempts.push({ name: "rw", opts: { access: "private", token: rwToken } });
  if (attempts.length === 0) attempts.push({ name: "env", opts: { access: "private" } });

  for (let i = 0; i < attempts.length; i++) {
    try {
      const meta = await head(pathname, attempts[i].opts);
      console.log("[health] ok auth=" + attempts[i].name);
      return json({ ok: true, size: meta && meta.size, contentType: meta && meta.contentType, auth: attempts[i].name }, 200);
    } catch (e) {
      console.log("[health] miss auth=" + attempts[i].name);
    }
  }
  console.log("[health] fail cat=blob_unavailable");
  return json({ ok: false, category: "blob_unavailable" }, 502);
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
