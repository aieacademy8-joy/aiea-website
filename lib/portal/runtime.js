"use strict";

// Ordinary-adult runtime only. No service credentials, writes, refresh tokens,
// editable metadata authority, decoded-claim authentication or general proxy.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIMIT = 100;
class PortalError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}
function fail(status, code) { throw new PortalError(status, code); }
function loopback(url) { return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname); }
function config() {
  try {
    const url = new URL(process.env.PORTAL_SUPABASE_URL);
    const origin = new URL(process.env.PORTAL_ORIGIN);
    for (const item of [url, origin]) {
      if (item.username || item.password || item.search || item.hash || item.pathname !== '/' ||
          (item.protocol !== 'https:' && !(item.protocol === 'http:' && loopback(item)))) throw Error();
    }
    const key = process.env.PORTAL_SUPABASE_PUBLISHABLE_KEY || '';
    // Modern publishable keys only: fail closed rather than accepting a service JWT.
    if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) throw Error();
    return { url: url.origin, origin: origin.origin, key, local: origin.protocol === 'http:' && loopback(origin) };
  } catch (_) { fail(503, 'not_configured'); }
}
function headers(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
  res.setHeader('Vary', 'Cookie');
}
function json(res, status, data) {
  headers(res); res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}
function error(res, err) {
  // Never print upstream errors, request bodies, cookies, email, codes or tokens.
  json(res, err instanceof PortalError ? err.status : 503,
    { error: err instanceof PortalError ? err.code : 'temporarily_unavailable' });
}
function method(req, res, expected) {
  if (req.method !== expected) { res.setHeader('Allow', expected); fail(405, 'method_not_allowed'); }
}
function cookieName(c) { return c.local ? 'aiea_portal_local' : '__Host-aiea_portal'; }
function retryName(c) { return c.local ? 'aiea_portal_logout_local' : '__Host-aiea_portal_logout'; }
function sessionCookie(c, token = '', seconds = 0) {
  if (token && (!/^[A-Za-z0-9_.-]+$/.test(token) || token.length > 3800)) fail(503, 'session_unavailable');
  return `${cookieName(c)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0, Math.floor(seconds))}${c.local ? '' : '; Secure'}`;
}
function clear(res, c) { res.setHeader('Set-Cookie', sessionCookie(c)); }
function retryCookie(c, token = '', seconds = 0) {
  return sessionCookie(c, token, seconds).replace(cookieName(c) + '=', retryName(c) + '=');
}
function hasRetry(req, c) {
  return typeof req.headers.cookie === 'string' && req.headers.cookie.split(';').some(s => s.trim().startsWith(retryName(c) + '='));
}
function tokenCookie(req, c, retry = false) {
  const raw = req.headers.cookie || '';
  if (typeof raw !== 'string' || raw.length > 8192) fail(401, 'sign_in_required');
  const name = retry ? retryName(c) : cookieName(c);
  const matches = raw.split(';').map(s => s.trim()).filter(s => s.startsWith(name + '='));
  if (matches.length !== 1) fail(401, 'sign_in_required');
  const token = matches[0].slice(name.length + 1);
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token) || token.length > 3800) fail(401, 'sign_in_required');
  return token;
}
function post(req, c) {
  if (req.headers.origin !== c.origin || req.headers['sec-fetch-site'] === 'cross-site') fail(403, 'origin_rejected');
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) fail(415, 'json_required');
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { fail(400, 'invalid_request'); } }
  if (!body || Array.isArray(body) || typeof body !== 'object' || JSON.stringify(body).length > 2048) fail(400, 'invalid_request');
  return body;
}
function exactKeys(body, keys) {
  if (Object.keys(body).some(k => !keys.includes(k)) || keys.some(k => !Object.hasOwn(body, k))) fail(400, 'invalid_request');
}
function email(value) {
  if (typeof value !== 'string') fail(400, 'invalid_email');
  const result = value.trim().toLowerCase();
  if (result.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(result)) fail(400, 'invalid_email');
  return result;
}
async function upstream(c, path, { token, body, method = 'GET', data = false } = {}) {
  const h = { apikey: c.key, Accept: 'application/json' };
  if (token) h.Authorization = 'Bearer ' + token;
  if (body !== undefined) h['Content-Type'] = 'application/json';
  if (data) h['Accept-Profile'] = 'portal';
  try {
    const response = await fetch(c.url + path, { method, headers: h, redirect: 'error',
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(8000) });
    const text = await response.text();
    if (text.length > 524288) fail(503, 'temporarily_unavailable');
    let value; try { value = text ? JSON.parse(text) : null; } catch (_) { fail(503, 'temporarily_unavailable'); }
    return { status: response.status, value };
  } catch (_) { fail(503, 'temporarily_unavailable'); }
}
function claims(token, c) {
  try {
    const part = token.split('.')[1];
    const claim = JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
    if (!UUID.test(claim.sub) || claim.iss !== c.url + '/auth/v1' || claim.role !== 'authenticated' ||
        !(claim.aud === 'authenticated' || (Array.isArray(claim.aud) && claim.aud.includes('authenticated'))) ||
        claim.is_anonymous !== false || !Number.isSafeInteger(claim.exp) || claim.exp <= Math.floor(Date.now() / 1000) ||
        (claim.nbf !== undefined && (!Number.isSafeInteger(claim.nbf) || claim.nbf > Math.floor(Date.now() / 1000)))) throw Error();
    return claim;
  } catch (_) { fail(401, 'sign_in_required'); }
}
async function rows(c, token, path) {
  const r = await upstream(c, '/rest/v1/' + path, { token, data: true });
  if (r.status !== 200 || !Array.isArray(r.value) || r.value.length > LIMIT) fail(503, 'temporarily_unavailable');
  return r.value;
}
async function authenticate(req, c, suppliedToken) {
  if (hasRetry(req, c)) fail(401, 'signout_required');
  const token = suppliedToken || tokenCookie(req, c);
  const claim = claims(token, c); // Shape/expiry checks are not authentication.
  const user = await upstream(c, '/auth/v1/user', { token });
  if ([401, 403].includes(user.status)) fail(401, 'sign_in_required');
  if (user.status !== 200) fail(503, 'temporarily_unavailable');
  if (!user.value || user.value.id !== claim.sub || user.value.is_anonymous !== false) fail(401, 'sign_in_required');
  const profile = await rows(c, token, `user_profile?select=user_id,status,adult_confirmed_at&user_id=eq.${claim.sub}&limit=2`);
  if (profile.length !== 1 || profile[0].user_id !== claim.sub || profile[0].status !== 'ACTIVE' ||
      !profile[0].adult_confirmed_at || !Number.isFinite(Date.parse(profile[0].adult_confirmed_at))) fail(403, 'adult_access_required');
  return { token, userId: claim.sub, exp: claim.exp };
}
async function context(c, auth, selected) {
  if (selected !== null && !UUID.test(selected)) fail(400, 'invalid_workspace');
  const memberships = await rows(c, auth.token,
    `workspace_membership?select=workspace_id,workspace_kind,role&user_id=eq.${auth.userId}&status=eq.ACTIVE&limit=101`);
  if (memberships.some(m => !UUID.test(m.workspace_id) ||
      !(m.workspace_kind === 'FAMILY' ? m.role === 'OWNER' : m.workspace_kind === 'SCHOOL' && ['OWNER','SCHOOL_ADMIN','TEACHER'].includes(m.role)))) fail(503, 'temporarily_unavailable');
  const ids = [...new Set(memberships.map(m => m.workspace_id))];
  const workspaces = ids.length ? await rows(c, auth.token,
    `workspace?select=id,kind,display_name&status=eq.ACTIVE&id=in.(${ids.join(',')})&order=display_name,id&limit=101`) : [];
  const visible = workspaces.map(w => {
    const m = memberships.find(m => m.workspace_id === w.id && m.workspace_kind === w.kind);
    if (!m || typeof w.display_name !== 'string' || w.display_name.length > 120) fail(503, 'temporarily_unavailable');
    return { id: w.id, kind: w.kind, display_name: w.display_name, role: m.role };
  });
  const id = selected === null && visible.length === 1 ? visible[0].id : selected;
  if (id !== null && !visible.some(w => w.id === id)) fail(403, 'workspace_access_denied');
  const entitlements = id === null ? [] : await rows(c, auth.token,
    `entitlement?select=id,program_version_id,status&workspace_id=eq.${id}&order=id&limit=101`);
  if (entitlements.some(e => !UUID.test(e.id) || !UUID.test(e.program_version_id) || !['ACTIVE','SUSPENDED','REVOKED'].includes(e.status))) fail(503, 'temporarily_unavailable');
  return { workspaces: visible, selected_workspace_id: id,
    entitlements: entitlements.map(e => ({ id: e.id, program_version_id: e.program_version_id, status: e.status })) };
}
module.exports = { PortalError, fail, config, headers, json, error, method, sessionCookie,
  retryCookie, hasRetry, claims, clear, tokenCookie, post, exactKeys, email, upstream, authenticate, context };
