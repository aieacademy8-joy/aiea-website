"use strict";
const p = require('../../lib/portal/runtime');
const curriculum = require('../../lib/portal/curriculum');
module.exports = async (req, res) => {
  let c;
  try {
    p.method(req, res, 'GET'); c = p.config();
    const q = curriculum.parameters(new URL(req.url, c.origin));
    const auth = await p.authenticate(req, c);
    const result = await curriculum.read(c, auth, q);
    // RLS alone permits a union of workspaces. Recheck the selected workspace
    // and native Auth at the response boundary, including slow assembly reads.
    const current = await p.authenticate(req, c);
    await curriculum.access(c, current, q.w, result.versions);
    if (current.exp <= Math.floor(Date.now() / 1000)) p.fail(401, 'sign_in_required');
    const data = { ...result.data, session_expires_at: current.exp };
    if (Buffer.byteLength(JSON.stringify(data), 'utf8') > 524288) p.fail(503, 'temporarily_unavailable');
    p.json(res, 200, data);
  } catch (e) { if (c && (e.status === 401 || e.code === 'adult_access_required')) p.clear(res, c); p.error(res, e); }
};
