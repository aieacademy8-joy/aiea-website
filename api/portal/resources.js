"use strict";
const p = require('../../lib/portal/runtime');
const resources = require('../../lib/portal/resources');
module.exports = async (req, res) => {
  let c;
  try {
    p.method(req,res,'GET'); c = p.config();
    const q = resources.parameters(new URL(req.url,c.origin));
    const auth = await p.authenticate(req,c);
    const result = await resources.read(c,auth,q);
    const asset = q.resource && result.available.find(r => r.id === q.resource);
    const bytes = asset && await resources.download(asset,req);
    // Reconcile native Auth and the exact workspace/version/mission/locale after
    // slow Blob assembly, before headers or private bytes leave the function.
    const current = await p.authenticate(req,c);
    const fresh = await resources.read(c,current,q);
    if (current.exp <= Math.floor(Date.now()/1000)) p.fail(401,'sign_in_required');
    if (fresh.data.resolved_locale !== result.data.resolved_locale ||
        JSON.stringify(fresh.available) !== JSON.stringify(result.available)) p.fail(503,'resource_unavailable');
    if (!asset) return p.json(res,200,{...fresh.data,session_expires_at:current.exp});
    p.headers(res); res.statusCode = 200;
    res.setHeader('Content-Type','application/octet-stream');
    res.setHeader('Content-Disposition','attachment; filename="' + resources.filename(asset) + '"');
    res.setHeader('Content-Length',bytes.length);
    res.end(bytes);
  } catch(e) { if (c && (e.status === 401 || e.code === 'adult_access_required')) p.clear(res,c); p.error(res,e); }
};
