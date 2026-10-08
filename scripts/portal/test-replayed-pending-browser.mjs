// A05 sustained/replayed-pending regression using actual Chrome and native local
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
const resultPath = path.join(directory, override ? 'portal-replayed-browser-negative-results.json' : 'portal-replayed-browser-results.json');
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
async function runSequence() {
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
  await b.goto(origin + '/portal/login.html'); await a.bringToFront();
  await a.getByRole('heading', { name: 'Synthetic family', exact: true }).waitFor();
  check('A05 begins with Adult A authorized family owner and entitlement summary',
    await a.getByText('Your role: Owner', { exact: true }).isVisible() && await a.locator('#entitlements strong').textContent() === 'ACTIVE');
  await a.evaluate(() => {
    window.receivedSignals = [];
    window.signalObserver = new BroadcastChannel('aiea-portal-session');
    window.signalObserver.onmessage = event => window.receivedSignals.push(event.data);
  });
  await b.evaluate(() => { window.replayingSender = new BroadcastChannel('aiea-portal-session'); });
  let sent = 0;
  async function pending() {
    sent++; await b.evaluate(() => window.replayingSender.postMessage('pending'));
    for (let i = 0; i < 100; i++) {
      if (await a.evaluate(n => window.receivedSignals.length >= n, sent)) return;
      await sleep(10);
    }
    throw Error('Real pending signal delivery failed');
  }
  function gate() { let release; const promise = new Promise(resolve => { release = resolve; }); return { promise, release }; }
  let activeGate = gate();
  const reads = [], failed = [];
  a.on('requestfailed', request => { if (request.url().includes('/api/portal/context')) failed.push(request); });
  await a.route('**/api/portal/context*', async route => {
    const hold = activeGate;
    const read = { url: route.request().url(), status: null }; reads.push(read);
    // Send the actual request to native Auth/Data API now; hold its real response
    // unchanged. Pending messages must not abort or supersede this recovery.
    const response = await route.fetch(); read.status = response.status();
    await hold.promise;
    try { await route.fulfill({ response }); }
    catch (error) { if (!/already handled|Target.*closed/.test(error.message)) throw error; }
  });
  await pending();
  check('A05 first pending clears all private fields', await cleared(a));
  const status = await b.evaluate(async body => (await fetch('/api/portal/auth', { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).status, await fixtureCode('3'));
  if (status !== 200) throw Error('Actual native Adult B verification failed');
  // B never emits revalidate; duplicate/stale pending continues every virtual second.
  for (let second = 1; second <= 40; second++) {
    await a.clock.fastForward(1000); await pending();
    if (second === 9) check('A05 unresolved initial pause keeps cached summary empty', reads.length === 0 && await cleared(a));
    if (second === 10) {
      for (let i = 0; i < 40 && reads.length === 0; i++) await sleep(50);
      check('A05 sustained pending reaches first authoritative recovery boundary', reads.length > 0);
    }
  }
  for (let i = 0; i < 40 && reads[0].status === null; i++) await sleep(50);
  check('A05 forty seconds of pending cannot slide or restart the recovery read', reads.length === 1 && reads[0].status === 200);
  check('A05 continued pending and periodic fallback cannot cancel held authorization', failed.length === 0);
  check('A05 private fields remain empty while actual native response is held', await cleared(a));
  check('A05 recovery discards old selected workspace before server authorization', reads[0].url === origin + '/api/portal/context');
  activeGate.release();
  await a.getByRole('heading', { name: 'Synthetic school A', exact: true }).waitFor();
  check('A05 release renders only currently authorized Adult B teacher summary',
    await a.getByText('Your role: Teacher', { exact: true }).isVisible() && !(await a.locator('body').textContent()).includes('Synthetic family'));
  activeGate = gate(); await pending();
  check('A05 later replay clears private state for another bounded episode', await cleared(a));
  for (let second = 1; second <= 40; second++) {
    await a.clock.fastForward(1000); await pending();
    if (second === 10) {
      for (let i = 0; i < 40 && reads.length < 2; i++) await sleep(50);
      check('A05 stale replays cannot renew the second episode deadline', reads.length === 2);
    }
  }
  for (let i = 0; i < 40 && reads[1].status === null; i++) await sleep(50);
  check('A05 another forty seconds of replay still permits native validation', reads.length === 2 && reads[1].status === 200 && failed.length === 0);
  check('A05 second held response cannot restore private state early', await cleared(a));
  activeGate.release();
  await a.getByRole('heading', { name: 'Synthetic school A', exact: true }).waitFor();
  check('A05 second release renders current authorized teacher role', await a.getByText('Your role: Teacher', { exact: true }).isVisible());
  check('A05 real channel observed sustained pending without completion',
    await a.evaluate(n => window.receivedSignals.length === n && window.receivedSignals.every(x => x === 'pending'), sent));
  check('A05 no persistent browser credential storage introduced',
    await a.evaluate(() => document.cookie === '' && localStorage.length === 0 && sessionStorage.length === 0));
  await a.unroute('**/api/portal/context*', { behavior: 'wait' });
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
  await runSequence();
  console.log('PASS ' + results.length + ' A05 sustained/replayed-pending browser/native checks');
} finally {
  await fs.writeFile(resultPath, JSON.stringify(results, null, 2));
  if (browser) await browser.close();
  server.kill('SIGTERM');
  await Promise.race([new Promise(resolve => server.once('exit', resolve)), sleep(2000)]);
  if (server.exitCode === null) server.kill('SIGKILL');
}
