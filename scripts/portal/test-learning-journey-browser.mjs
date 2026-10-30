// Real Chrome and production Auth/read/write/resource handlers. The provider,
// curriculum, Blob bytes and RPC records are synthetic and live only in this test.
// This is integration coverage, not native Auth or durable database proof.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {journeyFixture,W,S,L,L2,C,M,R,V} from './journey-fixture.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.AIEA_PLAYWRIGHT_MODULE);
const resources=require('../../lib/portal/resources');
const routes=new Map([
 ['/portal',require('../../api/portal/index')],['/api/portal/auth',require('../../api/portal/auth')],
 ['/api/portal/context',require('../../api/portal/context')],['/api/portal/curriculum',require('../../api/portal/curriculum')],
 ['/api/portal/progress',require('../../api/portal/progress')],['/api/portal/resources',require('../../api/portal/resources')]
]);
test('adult entry, resources, eight FAMILY completions, resume and eight SCHOOL deliveries (synthetic provider)',async()=>{
 const savedFetch=global.fetch,savedBlob=resources.blob,env={...process.env},f=journeyFixture();
 let browser,releaseBlob;
 const errors=[],requests=[];global.fetch=f.fetch;resources.blob=f.blob;
 const server=http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost');requests.push({path:url.pathname,method:req.method});
   const handler=routes.get(url.pathname);
   if(handler){const chunks=[];for await(const chunk of req)chunks.push(chunk);if(chunks.length)req.body=JSON.parse(Buffer.concat(chunks));await handler(req,res);return;}
   if(url.pathname==='/assets/logo.png'){res.setHeader('Content-Type','image/png');res.end(await fs.readFile(new URL('../../assets/logo.png',import.meta.url)));return;}
   if(['/portal/login.html','/portal/portal.css','/portal/portal.js'].includes(url.pathname)){
    res.setHeader('Content-Type',url.pathname.endsWith('.js')?'text/javascript':url.pathname.endsWith('.css')?'text/css':'text/html');
    res.end(await fs.readFile(new URL('../../'+url.pathname.slice(1),import.meta.url)));return;
   }
   res.writeHead(404);res.end();
  }catch(_){res.writeHead(500);res.end();}
 });
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  Object.assign(process.env,{PORTAL_SUPABASE_URL:'http://127.0.0.1:54321',PORTAL_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic',PORTAL_ORIGIN:origin});
  browser=await chromium.launch({executablePath:process.env.AIEA_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-networking']});
  const context=await browser.newContext({viewport:{width:1280,height:1000},acceptDownloads:true});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  async function preview(name){if(process.env.AIEA_PORTAL_SCREENSHOTS){await fs.mkdir(process.env.AIEA_PORTAL_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.AIEA_PORTAL_SCREENSHOTS+'/'+name+'.png',fullPage:true});}}
  await page.clock.install();await page.clock.pauseAt(new Date());
  await page.goto(origin+'/portal');assert.equal(new URL(page.url()).pathname,'/portal/login.html');
  await page.locator('.brand img').evaluate(img=>img.decode());
  assert.equal(await page.locator('.brand img').getAttribute('src'),'/assets/logo.png');
  assert.deepEqual(await page.locator('.brand .c-ai, .brand .c-explore, .brand .c-acad').evaluateAll(elements=>elements.map(el=>getComputedStyle(el).color)),['rgb(59, 166, 255)','rgb(196, 107, 255)','rgb(212, 175, 79)']);
  assert.equal(await page.locator('.footer-motto').innerText(),'Discover · Imagine · Create with AI!');
  assert.equal(await page.locator('.welcome .compass').count(),0);
  await page.keyboard.press('Tab');assert.equal(await page.locator('.brand:focus-visible').count(),1);
  assert.equal(await page.locator('.brand').evaluate(el=>getComputedStyle(el).outlineWidth),'3px');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('#request-code').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
  await page.locator('.welcome h1').click();
  await preview('portal-sign-in-desktop');await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:390,height:844});await page.reload();
  await page.locator('.brand img').evaluate(img=>img.decode());
  assert.equal(await page.locator('.welcome .compass').count(),0);
  assert.equal(await page.getByLabel('Your email address').isVisible(),true);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await preview('portal-sign-in-mobile');
  await page.setViewportSize({width:320,height:800});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.setViewportSize({width:1280,height:1000});await page.reload();
  await page.getByLabel('Your email address').fill('synthetic-adult@example.invalid');
  await page.getByRole('button',{name:'Send sign-in code'}).click();await page.getByLabel('Six-digit sign-in code').fill('123456');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByLabel('Select a workspace').waitFor();
  const cookie=(await context.cookies()).find(c=>c.name==='aiea_portal_local');assert.ok(cookie?.httpOnly);assert.equal(cookie.sameSite,'Lax');
  assert.equal(await page.evaluate(()=>document.cookie),'');
  async function openProgram(workspace){
   await page.getByLabel('Select a workspace').selectOption(workspace);
   await page.getByRole('button',{name:'My Programs',exact:true}).click();
   await page.getByRole('button',{name:'LOCAL TEST DATA — synthetic learning journey',exact:true}).waitFor();
   if(workspace===W&&f.state.writes.length===0)await preview('portal-programs-desktop');
   await page.getByRole('button',{name:'LOCAL TEST DATA — synthetic learning journey',exact:true}).click();
   await page.getByRole('button',{name:'View program progress',exact:true}).click();
  }
  await openProgram(W);await page.getByLabel('Select a learner code').selectOption(L);
  await page.getByText('0 of 8 missions recorded as completed. 0 in progress · 8 not started.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Open next mission',exact:true}).click();
  await page.locator('#mission-instructions').filter({hasText:'Lesson instructions 1'}).waitFor();
  assert.equal(await page.locator('#subject-select').inputValue(),L);assert.equal(await page.locator('#mission-previous').isDisabled(),true);
  await page.getByRole('button',{name:'Learning resources',exact:true}).click();
  const worksheet=page.getByRole('button',{name:'Download Mission worksheet <img>',exact:true});await worksheet.waitFor();
  assert.equal(await page.locator('#resources-list img').count(),0);assert.equal(f.state.writes.length,0);
  const downloadPromise=page.waitForEvent('download');await worksheet.click();const download=await downloadPromise;
  assert.equal(download.suggestedFilename(),'Mission-worksheet--img-.pdf');
  const downloaded=await fs.readFile(await download.path());assert.deepEqual(downloaded,f.bytes);
  await page.locator('#resources-notice').filter({hasText:'Check your browser'}).waitFor();
  await page.getByLabel('Curriculum language').selectOption('es');await page.locator('#mission-instructions[lang="es"]').waitFor();
  assert.equal(await page.locator('#resources-list button').count(),0);
  await page.getByRole('button',{name:'Learning resources',exact:true}).click();await page.getByRole('button',{name:'Download Hoja de actividad',exact:true}).waitFor();
  assert.equal(await worksheet.count(),0);await page.getByLabel('Curriculum language').selectOption('en-US');
  await page.getByRole('button',{name:'Start mission',exact:true}).waitFor();
  if(process.env.AIEA_PORTAL_SCREENSHOTS){await fs.mkdir(process.env.AIEA_PORTAL_SCREENSHOTS,{recursive:true});
   await page.getByRole('button',{name:'Learning resources',exact:true}).click();await worksheet.waitFor();
   await page.screenshot({path:process.env.AIEA_PORTAL_SCREENSHOTS+'/learning-journey-desktop.png',fullPage:true});}
  async function recordMission(sequence,family){
   await page.getByRole('button',{name:'Start mission',exact:true}).click();
   await page.getByRole('button',{name:family?'Mark completed':'Mark delivered',exact:true}).click();
   await page.locator('#progress-summary-text').filter({hasText:sequence+' of 8 missions recorded as '+(family?'completed.':'delivered to this cohort.')}).waitFor();
   assert.equal(await page.locator('#subject-select').inputValue(),family?L:C);
  }
  for(let i=1;i<=3;i++){
   await recordMission(i,true);if(i<3){await page.getByRole('button',{name:'Next Mission',exact:true}).click();await page.getByRole('button',{name:'Start mission',exact:true}).waitFor();}
  }
  await page.reload();await openProgram(W);await page.getByLabel('Select a learner code').selectOption(L);
  await page.getByText('3 of 8 missions recorded as completed. 0 in progress · 5 not started.',{exact:true}).waitFor();
  assert.equal(await page.getByRole('progressbar',{name:'Recorded learner completion'}).getAttribute('value'),'3');
  assert.equal(await page.getByRole('progressbar',{name:'Recorded learner completion'}).getAttribute('max'),'8');
  await preview('portal-progress-desktop');
  assert.equal(f.state.writes.length,6,'reload/navigation never record activity');
  await page.getByRole('button',{name:'Open next mission',exact:true}).click();await page.locator('#curriculum-title').filter({hasText:'Mission 4'}).waitFor();
  for(let i=4;i<=8;i++){
   await recordMission(i,true);if(i<8){await page.getByRole('button',{name:'Next Mission',exact:true}).click();await page.getByRole('button',{name:'Start mission',exact:true}).waitFor();}
  }
  assert.equal(await page.locator('#mission-next').isDisabled(),true);assert.equal(f.state.records.size,8);assert.equal(f.state.writes.length,16);
  await page.getByRole('button',{name:'Mission list',exact:true}).click();
  await page.getByText('All missions have a recorded completion for this learner code.',{exact:true}).waitFor();
  assert.equal(await page.locator('#progress-summary.is-complete').count(),1);await preview('portal-completion-desktop');
  assert.equal(await page.locator('#progress-continue').isVisible(),false);
  await page.getByLabel('Select a learner code').selectOption(L2);
  await page.getByText('0 of 8 missions recorded as completed. 0 in progress · 8 not started.',{exact:true}).waitFor();
  await openProgram(S);await page.getByLabel('Select a cohort').selectOption(C);
  await page.getByRole('button',{name:'Open next mission',exact:true}).click();await page.getByRole('button',{name:'Start mission',exact:true}).waitFor();
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Learning resources',exact:true}).click();await worksheet.waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.setViewportSize({width:320,height:800});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Learning resources',exact:true}).click();await worksheet.waitFor();
  if(process.env.AIEA_PORTAL_SCREENSHOTS)await page.screenshot({path:process.env.AIEA_PORTAL_SCREENSHOTS+'/learning-journey-mobile.png',fullPage:true});
  for(let i=1;i<=8;i++){
   await recordMission(i,false);assert.equal(await page.getByRole('button',{name:'Mark completed',exact:true}).isVisible(),false);
   if(i<8){await page.getByRole('button',{name:'Next Mission',exact:true}).click();await page.getByRole('button',{name:'Start mission',exact:true}).waitFor();}
  }
  await page.getByRole('button',{name:'Mission list',exact:true}).click();
  await page.getByText('All missions have a recorded delivery to this cohort.',{exact:true}).waitFor();
  assert.equal(await page.getByRole('progressbar',{name:'Recorded cohort delivery'}).getAttribute('value'),'8');await preview('portal-delivery-mobile');
  assert.equal(f.state.records.size,16);assert.equal(f.state.writes.filter(w=>w.family).length,16);assert.equal(f.state.writes.filter(w=>!w.family).length,16);
  assert.ok([...f.state.records.values()].filter(r=>r.workspace_id===S).every(r=>r.cohort_id===C&&!Object.hasOwn(r,'learner_ref_id')));
  assert.equal(f.state.requests.filter(r=>r.method==='POST'&&!r.path.startsWith('/auth/')).length,32);
  // An in-flight download cannot restore the private view after page clearing.
  await page.getByRole('button',{name:'1. Mission 1',exact:true}).last().click();await page.getByRole('button',{name:'Learning resources',exact:true}).click();await worksheet.waitFor();
  resources.blob=async path=>{await new Promise(resolve=>{releaseBlob=resolve;});return f.blob(path);};
  await worksheet.click();await page.locator('#resources-notice').filter({hasText:'Preparing your download'}).waitFor();
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await page.locator('#resources-list button').count(),0);
  releaseBlob();resources.blob=f.blob;
  assert.deepEqual(errors,[]);
  assert.ok(requests.filter(r=>r.path==='/api/portal/resources').every(r=>r.method==='GET'));
 }finally{
  releaseBlob?.();await browser?.close();await new Promise(resolve=>server.close(resolve));global.fetch=savedFetch;resources.blob=savedBlob;process.env=env;
 }
});
