"use strict";
const p = require('../../lib/portal/runtime');

module.exports = async (req, res) => {
  let c, verifying = false;
  try {
    p.method(req, res, 'POST'); c = p.config();
    const body = p.post(req, c);
    if (body.action !== 'signout' && p.hasRetry(req, c)) p.fail(409, 'signout_required');
    if (body.action === 'request') {
      p.exactKeys(body, ['action', 'email']);
      const result = await p.upstream(c, '/auth/v1/otp', { method: 'POST',
        body: { email: p.email(body.email), create_user: false } });
      if (result.status === 429) { res.setHeader('Retry-After', '60'); p.fail(429, 'try_again_later'); }
      if (result.status !== 200 && !([400,403,422].includes(result.status) &&
          ['otp_disabled','signup_disabled'].includes(result.value && result.value.error_code))) p.fail(503, 'temporarily_unavailable');
      // Same response for an unknown account. Native Auth signup stays disabled.
      return p.json(res, 200, { requested: true });
    }
    if (body.action === 'verify') {
      verifying = true;
      p.exactKeys(body, ['action', 'email', 'code']);
      if (typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) p.fail(400, 'invalid_code');
      const result = await p.upstream(c, '/auth/v1/verify', { method: 'POST',
        body: { email: p.email(body.email), token: body.code, type: 'email' } });
      if (result.status === 429) { res.setHeader('Retry-After', '60'); p.fail(429, 'try_again_later'); }
      if ([400,401,403,422].includes(result.status)) p.fail(401, 'invalid_or_expired_code');
      if (result.status !== 200 || !result.value || typeof result.value.access_token !== 'string') p.fail(503, 'temporarily_unavailable');
      const token = result.value.access_token;
      // Refresh token is deliberately neither stored nor returned.
      const auth = await p.authenticate(req, c, token);
      res.setHeader('Set-Cookie', p.sessionCookie(c, token, auth.exp - Math.floor(Date.now()/1000)));
      return p.json(res, 200, { authenticated: true });
    }
    if (body.action === 'signout') {
      p.exactKeys(body, ['action']);
      let token;
      const pending = p.hasRetry(req, c);
      try { token = p.tokenCookie(req, c, pending); }
      catch (e) { if (e.status !== 401) throw e; if (pending) p.fail(503, 'signout_incomplete'); }
      // Active access is removed. The separate HttpOnly credential can only retry
      // logout until JWT expiry; it is never accepted as a Portal session.
      let seconds = 0;
      if (token) {
        try { seconds = p.claims(token, c).exp - Math.floor(Date.now()/1000); }
        catch (_) { /* Still ask Auth about expired/malformed credentials. */ }
      }
      res.setHeader('Set-Cookie', [p.sessionCookie(c), p.retryCookie(c, token, seconds)]);
      if (token) {
        try {
          const r = await p.upstream(c, '/auth/v1/logout?scope=local', { method: 'POST', token });
          if (![204,401].includes(r.status)) p.fail(503, 'signout_incomplete');
        } catch (_) { p.fail(503, 'signout_incomplete'); }
      }
      res.setHeader('Set-Cookie', [p.sessionCookie(c), p.retryCookie(c)]);
      return p.json(res, 200, { signed_out: true });
    }
    p.fail(400, 'invalid_request');
  } catch (e) {
    // Do not let a rejected verification leave an older application identity active.
    if (c && verifying) p.clear(res, c);
    p.error(res, e);
  }
};
