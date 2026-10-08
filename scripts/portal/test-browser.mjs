// Real local browser flow. Credentials/OTP stay in the private test process;
// never print cookies, mail contents or API bodies. No external browsing.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.AIEA_PLAYWRIGHT_MODULE);
const credentialsPath = process.env.AIEA_LOCAL_CREDENTIALS;
const c = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));
if (c.API_URL !== 'http://127.0.0.1:54321') throw Error('Disposable loopback stack only');
const directory = path.dirname(credentialsPath);
const fixtures = JSON.parse(await fs.readFile(path.join(directory, 'portal-fixtures.json'), 'utf8'));
const email = fixtures['8'].email;
if (!email.endsWith('@example.invalid')) throw Error('Synthetic adult only');
const results = [];
function check(label, value) {
  results.push({ label, pass: !!value }); console.log((value ? 'PASS ' : 'FAIL ') + label);
  if (!value) throw Error(label);
}
async function mail(pathname) { const r = await fetch('http://127.0.0.1:54324' + pathname); return r.json(); }
const browser = await chromium.launch({ executablePath: process.env.AIEA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true, args: ['--disable-background-networking'] });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route('**/*', route => {
    const u = new URL(route.request().url());
    return ['localhost','127.0.0.1'].includes(u.hostname) && ['4321','54324'].includes(u.port) ? route.continue() : route.abort();
  });
  const page = await context.newPage(), errors = [], messages = [];
  let verificationBody;
  // Capture the response before the app navigates; reading a departed page's
  // response body is unreliable in Chrome. Forward the real response unchanged.
  await page.route('**/api/portal/auth', async route => {
    const response = await route.fetch();
    if (route.request().postDataJSON().action === 'verify') verificationBody = await response.json();
    await route.fulfill({ response });
  });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => messages.push(msg.text()));
  await page.goto('http://localhost:4321/portal');
  check('browser anonymous Portal entry lands on adult login', page.url() === 'http://localhost:4321/portal/login.html');
  check('login accessible email label and adult account scope', await page.getByLabel('Your email address').count() === 1 && await page.getByText('For existing adult accounts').isVisible());
  await page.screenshot({ path: path.join(directory,'portal-login-desktop.png'), fullPage: true });
  check('desktop login fits viewport', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const old = new Set((await mail('/api/v1/messages')).messages.map(m => m.ID));
  await page.getByLabel('Your email address').fill(email);
  await page.getByRole('button', { name: 'Send sign-in code' }).click();
  await page.getByLabel('Six-digit sign-in code').waitFor({ state: 'visible' });
  check('real UI request opens numeric input and resend cooldown', await page.getByRole('button',{name:/Resend in/}).isDisabled());
  let code;
  for (let i=0;i<50&&!code;i++) {
    const messages = (await mail('/api/v1/messages')).messages;
    const m=messages.find(m=>!old.has(m.ID)&&m.To.some(r=>r.Address===email));
    if(m){const full=await mail('/api/v1/message/'+m.ID);code=(full.Text+' '+full.HTML).match(/\b\d{6}\b/)?.[0];}
    if(!code)await new Promise(r=>setTimeout(r,100));
  }
  if (!code) throw Error('Local numeric code unavailable');
  const verified = page.waitForResponse(r => r.url().endsWith('/api/portal/auth') && r.request().postDataJSON().action === 'verify');
  await page.getByLabel('Six-digit sign-in code').fill(code);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await verified;
  check('browser verification receives status only, no tokens', JSON.stringify(verificationBody) === '{"authenticated":true}');
  await page.waitForURL('http://localhost:4321/portal');
  await page.getByLabel('Select a workspace').waitFor({ state: 'visible' });
  check('multiple existing workspaces require selection', await page.getByRole('status').textContent() === 'Select a workspace to continue.');
  check('unselected workspace displays no detail', await page.locator('#workspace-detail').isHidden());
  await page.getByLabel('Select a workspace').selectOption('10000000-0000-0000-0000-000000000002');
  await page.getByRole('heading',{name:'Synthetic family'}).waitFor();
  check('family selection shows existing owner role and access status', await page.getByText('Your role: Owner',{exact:true}).isVisible() && await page.locator('#entitlements strong').textContent()==='ACTIVE');
  await page.screenshot({path:path.join(directory,'portal-workspace-desktop.png'),fullPage:true});
  await page.getByLabel('Select a workspace').selectOption('10000000-0000-0000-0000-000000000001');
  await page.getByRole('heading',{name:'Synthetic school A'}).waitFor();
  check('school selection shows teacher without learner/admin controls', await page.getByText('Your role: Teacher',{exact:true}).isVisible() && await page.getByText('Synthetic family',{exact:true}).count()===1 && await page.getByRole('button',{name:/create|checkout|upload|learner/i}).count()===0);
  check('private browser storage is empty and cookies inaccessible to JS', await page.evaluate(()=>document.cookie===''&&localStorage.length===0&&sessionStorage.length===0));
  const cookies=await context.cookies();
  check('browser session cookie is HttpOnly, same-site and expiry bounded', cookies.length===1 && cookies[0].httpOnly && cookies[0].sameSite==='Lax' && cookies[0].expires>Date.now()/1000 && cookies[0].expires<Date.now()/1000+3700);
  check('browser URL carries no auth credentials', page.url()==='http://localhost:4321/portal');
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:path.join(directory,'portal-workspace-mobile.png'),fullPage:true});
  check('mobile workspace fits viewport', await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const expiryPage=await context.newPage();
  await expiryPage.clock.install();
  await expiryPage.goto('http://localhost:4321/portal');
  await expiryPage.getByLabel('Select a workspace').waitFor({state:'visible'});
  await expiryPage.clock.fastForward(3700000);
  await expiryPage.waitForURL('**/portal/login.html?expired=1');
  check('client expiry timer clears shell and requests reauthentication', await expiryPage.getByText('Your session has ended. Sign in again to continue.').isVisible());
  await expiryPage.close();
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await page.waitForURL('**/portal/login.html?signed_out=1');
  check('browser signout clears session cookie and private view', (await context.cookies()).length===0 && await page.locator('#workspace-detail').count()===0);
  await page.screenshot({path:path.join(directory,'portal-login-mobile.png'),fullPage:true});
  check('mobile login fits viewport with visible signout feedback', await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth) && await page.getByText('You’re signed out of this Portal session.').isVisible());
  await page.goto('http://localhost:4321/portal');
  check('signed-out browser cannot reopen protected route', page.url().endsWith('/portal/login.html'));
  check('no browser script errors or credential console output', errors.length===0 && messages.every(m=>!m.includes(email)&&!m.includes(code)&&!m.includes('access_token')&&!m.includes('refresh_token')));
  await page.goto('http://localhost:4321/');
  check('existing public home still loads', await page.title() !== '' && await page.locator('h1').count()>0);
  await page.goto('http://localhost:4321/episodes');
  check('existing episodes route still loads', await page.locator('h1').count()>0);
  await fs.writeFile(path.join(directory,'portal-browser-results.json'),JSON.stringify(results,null,2));
  console.log('PASS '+results.length+' real-browser checks; client timer simulation is distinct from native expiry proof');
} finally { await browser.close(); }
