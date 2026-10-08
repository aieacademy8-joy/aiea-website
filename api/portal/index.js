"use strict";
const p = require('../../lib/portal/runtime');
const shell = require('../../lib/portal/shell');
module.exports = async (req, res) => {
  let c;
  try {
    p.method(req, res, 'GET'); c = p.config();
    await p.authenticate(req, c);
    p.headers(res); res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(shell);
  } catch (e) {
    if (c && [401,403].includes(e.status)) {
      p.clear(res, c); p.headers(res); res.statusCode = 303;
      res.setHeader('Location', '/portal/login.html' + (e.code === 'signout_required' ? '?signout_pending=1' : '')); res.end();
    } else p.error(res, e);
  }
};
