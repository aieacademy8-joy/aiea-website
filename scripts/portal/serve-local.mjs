// Local testing adapter for existing CommonJS Vercel handlers. No provider setup.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const config = JSON.parse(await fs.readFile(path.join(root, 'vercel.json'), 'utf8'));
const routes = new Map([
  ['/portal', require('../../api/portal/index.js')], ['/portal/', require('../../api/portal/index.js')],
  ['/api/portal', require('../../api/portal/index.js')], ['/api/portal/index', require('../../api/portal/index.js')],
  ['/api/portal/auth', require('../../api/portal/auth.js')], ['/api/portal/context', require('../../api/portal/context.js')],
  ['/api/portal/curriculum', require('../../api/portal/curriculum.js')]
]);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const rewrite = config.rewrites.find(item => item.source === url.pathname);
    const handler = routes.get(rewrite ? rewrite.destination : url.pathname);
    if (handler) {
      const chunks = []; let size = 0;
      for await (const chunk of req) {
        size += chunk.length; if (size > 2048) { res.writeHead(413); res.end(); return; }
        chunks.push(chunk);
      }
      if (chunks.length) {
        try { req.body = JSON.parse(Buffer.concat(chunks)); } catch (_) { res.writeHead(400); res.end(); return; }
      }
      await handler(req, res); return;
    }
    // Only explicit public types/locations; never serve env, SQL, reports or tooling.
    let name = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    if (name === '/episodes') name = '/episodes.html';
    if (name === '/ai-family-starter-kit.html') { res.writeHead(308, { Location:'/first-ai-literacy-journey.html' }); res.end(); return; }
    const target = path.resolve(root, '.' + name), type = types[path.extname(name)];
    if (!target.startsWith(root + path.sep) || !type || name.includes('..') ||
        !(/^\/[\w-]+\.html$/.test(name) || /^\/(portal|css|js|assets)\//.test(name))) { res.writeHead(404); res.end(); return; }
    const data = await fs.readFile(target);
    if (name.startsWith('/portal/')) for (const header of config.headers.find(item => item.source === '/portal/:path*').headers) res.setHeader(header.key, header.value);
    res.writeHead(200, { 'Content-Type':type, 'Cache-Control':'no-store' }); res.end(data);
  } catch (_) { res.writeHead(404); res.end(); }
});
server.listen(Number(process.env.PORTAL_LOCAL_PORT || 4321), '127.0.0.1', () => console.log('Local Portal test adapter ready (loopback only)'));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
