// Bounded A01/A02 regression: actual handlers, native synthetic Auth and Chrome.
// Only logout upstream failure is injected; successful revocation is native.
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.AIEA_PLAYWRIGHT_MODULE);
const credentialsPath = process.env.AIEA_LOCAL_CREDENTIALS;
const c = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));
if (c.API_URL !== 'http://127.0.0.1:54321') throw Error('Disposable loopback stack only');
const directory = path.dirname(credentialsPath);
const fixtures = JSON.parse(await fs.readFile(path.join(directory, 'portal-fixtures.json'), 'utf8'));
const results = [], origin = 'http://localhost:4321';
function check(label, pass) {
  results.push({ label, pass: !!pass }); console.log((pass ? 'PASS ' : 'FAIL ') + label);
  if (!pass) throw Error(label);
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const fault = path.join(directory, 'logout-failure.flag'), hook = path.join(directory, 'logout-fault-hook.mjs');
await fs.writeFile(hook, `import {existsSync} from 'node:fs';
const real=globalThis.fetch;
globalThis.fetch=async(url,options)=>{
 if(new URL(url).pathname==='/auth/v1/logout' && existsSync(${JSON.stringify(fault)})){
  await new Promise(r=>setTimeout(r,400));
  return new Response('{}',{status:503});
 }
 return real(url,options);
};`, { mode: 0o600 });
const adapter = fileURLToPath(new URL('./serve-local.mjs', import.meta.url));
const env = { ...process.env, PORTAL_SUPABASE_URL: c.API_URL,
  PORTAL_SUPABASE_PUBLISHABLE_KEY: c.PUBLISHABLE_KEY, PORTAL_ORIGIN: origin };
delete env.PORTAL_SUPABASE_SECRET_KEY;
const server = spawn(process.execPath, ['--import', hook, adapter], { env, stdio: 'ignore' });
let browser;
async function auth(body, cookie) {
  return fetch(origin + '/api/portal/auth', { method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body) });
}
async function mail(p) { return (await fetch('http://127.0.0.1:54324' + p)).json(); }
async function login(page, n) {
  const email = fixtures[n].email;
  if (!email.endsWith('@example.invalid')) throw Error('Synthetic adults only');
  await page.goto(origin + '/portal/login.html');
  const old = new Set((await mail('/api/v1/messages')).messages.map(m => m.ID));
  await page.getByLabel('Your email address').fill(email);
  await page.getByRole('button', { name: 'Send sign-in code' }).click();
  await page.getByLabel('Six-digit sign-in code').waitFor({ state: 'visible' });
  let code;
  for (let i = 0; i < 100 && !code; i++) {
    const messages = (await mail('/api/v1/messages')).messages;
    const message = messages.find(m => !old.has(m.ID) && m.To.some(r => r.Address === email));
    if (message) { const full = await mail('/api/v1/message/' + message.ID); code = (full.Text + full.HTML).match(/\b\d{6}\b/)?.[0]; }
    if (!code) await sleep(100);
  }
  if (!code) throw Error('Synthetic numeric mail unavailable');
  await page.getByLabel('Six-digit sign-in code').fill(code);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(origin + '/portal');
}
const privateCleared = page => page.evaluate(() =>
  document.getElementById('workspace-name').textContent === '' &&
  document.getElementById('workspace-role').textContent === '' &&
  document.getElementById('entitlements').textContent === '' &&
  document.getElementById('workspace-select').options.length === 0 &&
  document.getElementById('workspace-detail').hidden);
try {
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw Error('Exclusive local adapter port required');
    try { if ((await fetch(origin + '/portal/login.html')).ok) break; } catch (_) {}
    await sleep(50);
  }
  browser = await chromium.launch({ headless: true,
    executablePath: process.env.AIEA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--disable-background-networking'] });
  const context = await browser.newContext();
  await context.route('**/*', route => {
    const u = new URL(route.request().url());
    return ['localhost', '127.0.0.1'].includes(u.hostname) && ['4321', '54324'].includes(u.port) ? route.continue() : route.abort();
  });
  const page = await context.newPage();
  await login(page, '11');
  await page.getByRole('heading', { name: 'Synthetic family', exact: true }).waitFor();
  const original = (await context.cookies()).find(c => c.name === 'aiea_portal_local');
  const originalHeader = original.name + '=' + original.value;
  check('A01 starts with authenticated native session and visible private summary',
    (await fetch(origin + '/api/portal/context', { headers: { Cookie: originalHeader } })).status === 200);
  await fs.writeFile(fault, 'fail', { mode: 0o600 });
  let response = page.waitForResponse(r => r.url().endsWith('/api/portal/auth') && r.request().postDataJSON().action === 'signout');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  check('A01 private UI clears immediately before failed logout response', await privateCleared(page));
  check('A01 injected upstream failure reports failure rather than success', (await response).status() === 503);
  await page.getByRole('status').filter({ hasText: 'Signout is incomplete' }).waitFor();
  let cookies = await context.cookies();
  check('A01 browser jar retains only HttpOnly bounded retry credential', cookies.length === 1 &&
    cookies[0].name === 'aiea_portal_logout_local' && cookies[0].httpOnly && cookies[0].expires <= original.expires + 1);
  const pendingHeader = cookies[0].name + '=' + cookies[0].value;
  check('A01 pending cookie jar cannot access Portal context', (await context.request.get(origin + '/api/portal/context')).status() === 401);
  check('A01 original access cookie restored beside pending cookie cannot regain access',
    (await fetch(origin + '/api/portal/context', { headers: { Cookie: originalHeader + '; ' + pendingHeader } })).status === 401);
  check('A01 retry credential itself is not accepted as a session cookie',
    (await fetch(origin + '/api/portal/context', { headers: { Cookie: pendingHeader } })).status === 401);
  response = page.waitForResponse(r => r.url().endsWith('/api/portal/auth') && r.request().postDataJSON().action === 'signout');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  check('A01 repeated failed retry remains failure with credential still available', (await response).status() === 503 &&
    (await context.cookies()).some(c => c.name === 'aiea_portal_logout_local'));
  await page.goto(origin + '/portal');
  await page.waitForURL('**/portal/login.html?signout_pending=1');
  check('A01 retry survives reload through truthful login recovery', await page.getByRole('button', { name: 'Retry signout' }).isVisible());
  await fs.unlink(fault);
  await page.getByRole('button', { name: 'Retry signout' }).click();
  await page.waitForURL('**/portal/login.html?signed_out=1');
  check('A01 eventual native revocation succeeds and clears both cookie slots', (await context.cookies()).length === 0);
  check('A01 original token/cookie replay is denied after eventual native revocation',
    (await fetch(origin + '/api/portal/context', { headers: { Cookie: originalHeader } })).status === 401);
  check('A01 no persistent credential storage introduced', await page.evaluate(() => document.cookie === '' && localStorage.length === 0 && sessionStorage.length === 0));

  // Two real pages share browser cookies. Hold A's revalidation response so stale
  // state clearing is independently observed before any replacement may render.
  const a = await context.newPage(), b = await context.newPage();
  await login(a, '12');
  await a.getByRole('heading', { name: 'Synthetic family', exact: true }).waitFor();
  await b.goto(origin + '/portal/login.html');
  await a.bringToFront();
  await a.getByRole('heading', { name: 'Synthetic family', exact: true }).waitFor();
  check('A02 Adult A family name role and entitlement visible in Window A',
    await a.getByText('Your role: Owner', { exact: true }).isVisible() && await a.locator('#entitlements strong').textContent() === 'ACTIVE');
  let release, waiting = false;
  const gate = new Promise(resolve => { release = resolve; });
  await a.route('**/api/portal/context*', async route => {
    waiting = true; await gate;
    try { await route.continue(); }
    catch (error) { if (!/already handled|Target.*closed/.test(error.message)) throw error; }
  });
  await login(b, '13');
  for (let i = 0; i < 100 && !waiting; i++) await sleep(50);
  check('A02 Window A receives session change and requests fresh authorization', waiting);
  check('A02 all stale Adult A private fields clear before revalidation completes', await privateCleared(a));
  release(); await a.bringToFront();
  await a.getByRole('heading', { name: 'Synthetic school A', exact: true }).waitFor();
  await a.unroute('**/api/portal/context*', { behavior: 'wait' });
  check('A02 Window A renders Adult B only after server revalidation',
    await a.getByText('Your role: Teacher', { exact: true }).isVisible() && !(await a.locator('body').textContent()).includes('Synthetic family'));
  await b.getByRole('heading', { name: 'Synthetic school A', exact: true }).waitFor();
  await b.getByRole('button', { name: 'Sign out', exact: true }).click();
  await b.waitForURL('**/portal/login.html?signed_out=1');
  await a.waitForURL('**/portal/login.html*');
  check('A02 cross-window signout removes private state from Window A', await a.locator('#workspace-detail').count() === 0);
  await a.close(); await b.close();

  // Disable only A's BroadcastChannel, then prove the independent focus boundary.
  const focusA = await context.newPage(), focusB = await context.newPage();
  await focusA.addInitScript(() => { window.BroadcastChannel = undefined; });
  await login(focusA, '14');
  await focusA.getByRole('heading', { name: 'Synthetic family', exact: true }).waitFor();
  await focusB.goto(origin + '/portal/login.html');
  await focusA.bringToFront();
  await focusA.getByRole('heading', { name: 'Synthetic family', exact: true }).waitFor();
  await login(focusB, '15');
  let focusRelease, focusWaiting = false;
  const focusGate = new Promise(resolve => { focusRelease = resolve; });
  await focusA.route('**/api/portal/context*', async route => {
    focusWaiting = true; await focusGate;
    try { await route.continue(); }
    catch (error) { if (!/already handled|Target.*closed/.test(error.message)) throw error; }
  });
  await focusA.bringToFront();
  // Headless Chrome can keep both targets focused; deliver the native focus event
  // too, exercising the real listener without substituting any handler or data.
  await focusA.evaluate(() => window.dispatchEvent(new Event('focus')));
  for (let i = 0; i < 100 && !focusWaiting; i++) await sleep(50);
  check('A02 focus restoration requests authorization even without coordination channel', focusWaiting);
  check('A02 focus clears previous adult before held server response can render', await privateCleared(focusA));
  focusRelease();
  await focusA.getByRole('heading', { name: 'Synthetic school A', exact: true }).waitFor();
  await focusA.unroute('**/api/portal/context*', { behavior: 'wait' });
  check('A02 focus revalidation renders only current Adult B teacher summary', await focusA.getByText('Your role: Teacher', { exact: true }).isVisible());
  await focusA.getByRole('button', { name: 'Sign out', exact: true }).click();
  await focusA.waitForURL('**/portal/login.html?signed_out=1');
  await fs.writeFile(path.join(directory, 'portal-audit-browser-results.json'), JSON.stringify(results, null, 2));
  console.log('PASS ' + results.length + ' A01/A02 browser/native sequence checks');
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
  await Promise.race([new Promise(resolve => server.once('exit', resolve)), sleep(2000)]);
  if (server.exitCode === null) server.kill('SIGKILL');
  await fs.rm(fault, { force: true }); await fs.rm(hook, { force: true });
}
