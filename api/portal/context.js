"use strict";
const p = require('../../lib/portal/runtime');
module.exports = async (req, res) => {
  let c;
  try {
    p.method(req, res, 'GET'); c = p.config();
    const url = new URL(req.url, c.origin);
    if ([...url.searchParams.keys()].some(k => k !== 'workspace_id') || url.searchParams.getAll('workspace_id').length > 1) p.fail(400, 'invalid_request');
    const auth = await p.authenticate(req, c);
    p.json(res, 200, { ...await p.context(c, auth, url.searchParams.get('workspace_id')), session_expires_at: auth.exp });
  } catch (e) { if (c && (e.status === 401 || e.code === 'adult_access_required')) p.clear(res, c); p.error(res, e); }
};
