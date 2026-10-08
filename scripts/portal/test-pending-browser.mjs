// A04 missing-completion regression using actual Chrome pages and native local
// Auth/context. Fixture codes use existing synthetic adults only. Optional saved
// source override is a negative control served to the receiver, never production.
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
const directory = path.dirname(credentialsPath), origin = 'http://localhost:4321';
const fixtures = JSON.parse(await fs.readFile(path.join(directory, 'portal-fixtures.json'), 'utf8'));
const override = process.env.AIEA_PORTAL_CLIENT_SOURCE;
const savedSource = override ? await fs.readFile(override, 'utf8') : null;
const resultPath = path.join(directory, override ? 'portal-pending-browser-negative-results.json' : 'portal-pending-browser-results.json');
const results = [], sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function check(label, pass) {
  results.push({ label, pass: !!pass }); console.log((pass ? 'PASS ' : 'FAIL ') + label);
  if (!pass) throw Error(label);
}
async function fixtureCode(n) {
  const email = fixtures[n].email;
  if (!email.endsWith('@example.invalid')) throw Error('Existing synthetic adults only');
  const r = await fetch(c.API_URL + '/auth/v1/admin/generate_link', { method: 'POST',
    headers: { apikey: c.SECRET_KEY, Authorization: 'Bearer ' + c.SERVICE_ROLE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', email }) });
  if (r.status !== 200) throw Error('Private synthetic fixture code generation failed');
  const data = await r.json();
  if (!/^\d{6}$/.test(data.email_otp)) throw Error('Synthetic numeric fixture code unavailable');
  return { action: 'verify', email, code: data.email_otp };
}
const cleared = page => page.evaluate(() => document.getElementById('workspace-detail').hidden &&
  document.getElementById('workspace-name').textContent === '' &&
  document.getElementById('workspace-role').textContent === '' &&
  document.getElementById('entitlements').children.length === 0 &&
  document.getElementById('workspace-select').options.length === 0);
const env = { ...process.env, PORTAL_SUPABASE_URL: c.API_URL,
  PORTAL_SUPABASE_PUBLISHABLE_KEY: c.PUBLISHABLE_KEY, PORTAL_ORIGIN: origin };
delete env.PORTAL_SUPABASE_SECRET_KEY;
const adapter = fileURLToPath(new URL('./serve-local.mjs', import.meta.url));
const server = spawn(process.execPath, [adapter], { env, stdio: 'ignore' });
let browser;
async function runSequence(mode) {
  const context = await browser.newContext();
  await context.route('**/*', route => {
    const u = new URL(route.request().url());
    return u.hostname === 'localhost' && u.port === '4321' ? route.continue() : route.abort();
  });
  const initial = await context.request.post(origin + '/api/portal/auth', {
    headers: { Origin: origin }, data: await fixtureCode('2') });
  if (initial.status() !== 200) throw Error('Actual application fixture sign-in failed');
  const a = await context.newPage(), b = await context.newPage();
  if (savedSource) await a.route('**/portal/portal.js', route => route.fulfill({ contentType: 'application/javascript', body: savedSource }));
  await a.clock.install(); await a.clock.pauseAt(new Date());
  await a.goto(origin + '/portal');
  await a.getByRole('heading', { name: 'Synthetic family', exact: true }).waitFor();
  await b.goto(origin + '/portal/login.html');
  await a.bringToFront();
  await a.getByRole('heading', { name: 'Synthetic family', exact: true }).waitFor();
  check('A04 ' + mode + ': Adult A authorized family/owner/status initially visible',
    await a.getByText('Your role: Owner', { exact: true }).isVisible() && await a.locator('#entitlements strong').textContent() === 'ACTIVE');
  await a.evaluate(() => {
    window.receivedSignals = [];
    window.signalObserver = new BroadcastChannel('aiea-portal-session');
    window.signalObserver.onmessage = event => window.receivedSignals.push(event.data);
  });
  let release, requests = 0;
  const gate = new Promise(resolve => { release = resolve; });
  const urls = [];
  await a.route('**/api/portal/context*', async route => {
    requests++; urls.push(route.request().url()); await gate;
    try { await route.continue(); }
    catch (error) { if (!/already handled|Target.*closed/.test(error.message)) throw error; }
  });
  await b.evaluate(() => {
    window.disappearingSender = new BroadcastChannel('aiea-portal-session');
    window.disappearingSender.postMessage('pending');
  });
  await a.waitForFunction(() => document.getElementById('workspace-name').textContent === '' && document.getElementById('workspace-detail').hidden);
  check('A04 ' + mode + ': pending immediately clears all private fields', await cleared(a));
  // Finish real verification in B but deliberately never send completion. Then
  // close B. Only public success JSON crosses JS; Auth credentials stay HttpOnly.
  const code = await fixtureCode('3');
  const status = await b.evaluate(async body => (await fetch('/api/portal/auth', { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).status, code);
  if (status !== 200) throw Error('Actual native Adult B verification failed');
  await b.close();
  check('A04 ' + mode + ': sender disappears with pending and no completion signal',
    await a.evaluate(() => window.receivedSignals.length === 1 && window.receivedSignals[0] === 'pending'));
  if (mode === 'visibility') {
    // Headless visibility delivery is explicit; the native Auth/context stays real.
    await a.evaluate(() => {
      window.hiddenForTest = true;
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.hiddenForTest });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await a.clock.fastForward(10000);
    check('A04 visibility: hidden deadline keeps private state empty without rendering', requests === 0 && await cleared(a));
    await a.evaluate(() => { window.hiddenForTest = false; document.dispatchEvent(new Event('visibilitychange')); });
  } else {
    if (mode === 'focus') await a.evaluate(() => window.dispatchEvent(new Event('focus')));
    await a.clock.fastForward(9999);
    check('A04 ' + mode + ': unresolved pending cannot redisplay cached private state', requests === 0 && await cleared(a));
    await a.clock.fastForward(1);
  }
  for (let i = 0; i < 40 && requests === 0; i++) await sleep(50);
  // This exact assertion fails with the saved pre-A04 client: remotePending
  // stays latched despite focus/visibility and no fresh request ever appears.
  check('A04 ' + mode + ': missing completion recovers through fresh server context', requests > 0);
  check('A04 ' + mode + ': all private fields remain cleared while response is held', await cleared(a));
  check('A04 ' + mode + ': old selected workspace is discarded before authorization', urls.every(url => url === origin + '/api/portal/context'));
  release();
  await a.getByRole('heading', { name: 'Synthetic school A', exact: true }).waitFor();
  await a.unroute('**/api/portal/context*', { behavior: 'wait' });
  check('A04 ' + mode + ': only current Adult B teacher summary renders after authorization',
    await a.getByText('Your role: Teacher', { exact: true }).isVisible() && !(await a.locator('body').textContent()).includes('Synthetic family'));
  check('A04 ' + mode + ': coordination introduces no browser credential storage',
    await a.evaluate(() => document.cookie === '' && localStorage.length === 0 && sessionStorage.length === 0));
  await context.close();
}
try {
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw Error('Exclusive local adapter port required');
    try { if ((await fetch(origin + '/portal/login.html')).ok) break; } catch (_) {}
    await sleep(50);
  }
  browser = await chromium.launch({ headless: true,
    executablePath: process.env.AIEA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--disable-background-networking'] });
  await runSequence('focus');
  await runSequence('timeout');
  await runSequence('visibility');
  console.log('PASS ' + results.length + ' A04 missing-completion browser/native checks');
} finally {
  await fs.writeFile(resultPath, JSON.stringify(results, null, 2));
  if (browser) await browser.close();
  server.kill('SIGTERM');
  await Promise.race([new Promise(resolve => server.once('exit', resolve)), sleep(2000)]);
  if (server.exitCode === null) server.kill('SIGKILL');
}
