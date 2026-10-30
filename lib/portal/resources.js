"use strict";
const crypto = require('node:crypto');
const p = require('./runtime');
const curriculum = require('./curriculum');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Verify the entire published hash before returning any bytes. Stay below the
// serverless buffered response limit; larger resources fail explicitly.
const MAX_BYTES = 4000000;
function valid(value) { if (!value) p.fail(503, 'resource_unavailable'); }
function parameters(url) {
  if (url.searchParams.getAll('resource_id').length > 1) p.fail(400, 'invalid_request');
  const resource = url.searchParams.get('resource_id');
  if (resource !== null && !UUID.test(resource)) p.fail(400, 'invalid_request');
  const copy = new URL(url); copy.searchParams.delete('resource_id');
  const q = curriculum.parameters(copy);
  if (!q.v || !q.m || url.search.length > 600) p.fail(400, 'invalid_request');
  return { ...q, resource: resource && resource.toLowerCase() };
}
async function read(c, auth, q) {
  // Reuse exact-version, published-language and mission resolution. A requested
  // locale gets only its approved program fallback, never a resource translation.
  const lesson = await curriculum.read(c, auth, q);
  const locale = lesson.data.program.resolved_locale;
  const rows = await p.rows(c, auth.token, 'resource_asset?select=id,program_version_id,mission_id,asset_key,locale_code,locale_neutral,blob_path,content_hash' +
    '&program_version_id=eq.' + q.v + '&or=(mission_id.is.null,mission_id.eq.' + q.m + ')&order=asset_key,id&limit=101');
  valid(new Set(rows.map(r => r.id)).size === rows.length);
  rows.forEach(r => valid(UUID.test(r.id) && r.program_version_id === q.v && (r.mission_id === null || r.mission_id === q.m) &&
    typeof r.asset_key === 'string' && r.asset_key.length > 0 && r.asset_key.length <= 200 &&
    (r.locale_neutral === true ? r.locale_code === null : r.locale_neutral === false &&
      typeof r.locale_code === 'string' && r.locale_code.length <= 35 && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(r.locale_code)) &&
    typeof r.blob_path === 'string' && r.blob_path.length > 0 && r.blob_path.length <= 1024 &&
    !/[:\\\x00-\x1f\x7f]/.test(r.blob_path) && !r.blob_path.startsWith('/') &&
    !r.blob_path.split('/').some(part => !part || part === '.' || part === '..') &&
    typeof r.content_hash === 'string' && /^[0-9a-f]{64}$/.test(r.content_hash)));
  const published = rows.filter(r => r.locale_neutral || lesson.data.program.available_locales.includes(r.locale_code));
  const available = published.filter(r => r.locale_neutral || r.locale_code === locale);
  if (q.resource && !available.some(r => r.id === q.resource)) p.fail(404, 'resource_unavailable');
  return { available, data: { workspace_id:q.w, program_version_id:q.v, mission_id:q.m,
    requested_locale:q.locale, resolved_locale:locale,
    other_language_count:published.length - available.length,
    resources:available.map(({id,asset_key,locale_code,locale_neutral}) => ({id,asset_key,locale_code,locale_neutral})) } };
}
async function blob(pathname, req) {
  // Credentials stay server-side. No public URL or client upload path exists.
  const oidcToken = req.headers['x-vercel-oidc-token'] || process.env.VERCEL_OIDC_TOKEN;
  const storeId = process.env.BLOB_STORE_ID, token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!(oidcToken && storeId) && !token) p.fail(503, 'resources_not_configured');
  const options = oidcToken && storeId ? {oidcToken,storeId} : {token};
  const {get} = require('@vercel/blob');
  return get(pathname, {...options, access:'private', abortSignal:AbortSignal.timeout(8000)});
}
async function download(asset, req) {
  const result = await module.exports.blob(asset.blob_path, req);
  valid(result && result.statusCode === 200 && result.stream && result.blob?.pathname === asset.blob_path);
  const reader = result.stream.getReader(), chunks = [];
  let size = 0, timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; reader.cancel().catch(() => {}); }, 8000);
  try {
    if (result.blob.size !== null && result.blob.size !== undefined &&
        (!Number.isSafeInteger(result.blob.size) || result.blob.size < 0 || result.blob.size > MAX_BYTES)) p.fail(413, 'resource_too_large');
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      valid(value instanceof Uint8Array); size += value.byteLength;
      if (size > MAX_BYTES) p.fail(413, 'resource_too_large');
      chunks.push(Buffer.from(value));
    }
    const bytes = Buffer.concat(chunks);
    valid(!timedOut);
    valid(crypto.createHash('sha256').update(bytes).digest('hex') === asset.content_hash);
    return bytes;
  } finally { clearTimeout(timeout); await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
function filename(asset) {
  // Only the public structural key and a bounded extension reach the browser.
  const key = asset.asset_key.replace(/[^A-Za-z0-9_-]/g,'-').slice(0,100) || 'resource';
  const extension = /\.([A-Za-z0-9]{1,10})$/.exec(asset.blob_path)?.[1] || 'bin';
  return key + '.' + extension.toLowerCase();
}
module.exports = { parameters, read, blob, download, filename, MAX_BYTES };
