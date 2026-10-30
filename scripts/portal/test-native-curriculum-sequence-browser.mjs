// Genuine loopback Auth/PostgREST/RPCs. Explicit LOCAL TEST DATA, mission units,
// full-version entitlements: this is not commercial pilot lesson-scope proof.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {localCredentials} from './native-local.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const credentialFile=process.env.AIEA_LOCAL_CREDENTIALS;
if(!credentialFile)throw Error('Supply private isolated local credentials');
const credentials=JSON.parse(await fs.readFile(credentialFile,'utf8'));
localCredentials(credentials); // Validate exact isolated API before all requests.
const base=path.dirname(credentialFile),state=JSON.parse(await fs.readFile(path.join(base,'sequence-state.json'),'utf8'));
assert.ok(state.label.startsWith('LOCAL TEST DATA'));
const require=createRequire(import.meta.url),{chromium}=require(process.env.AIEA_PLAYWRIGHT_MODULE);
const origin='http://localhost:4322',mail='http://127.0.0.1:54324';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

test('native dynamic mission sequences, persisted FAMILY/SCHOOL status, restart/resume and exact-version denial',async()=>{
 let app,browser,token,lastRequest=0;
 const errors=[];
 async function startApp(){
  // Use a second explicit loopback adapter; preserve the founder's open server.
  // Reuse the existing private development resource adapter and real handlers.
  const bootstrap=`import fs from 'node:fs/promises'; import {createRequire} from 'node:module';
   const native=await import(process.argv[1]);
   for(const name of ['BLOB_READ_WRITE_TOKEN','BLOB_STORE_ID','VERCEL_OIDC_TOKEN'])delete process.env[name];
   Object.assign(process.env,native.localCredentials(JSON.parse(await fs.readFile(process.argv[2],'utf8'))),
     {PORTAL_ORIGIN:'http://localhost:4322',PORTAL_LOCAL_PORT:'4322'});
   createRequire(import.meta.url)(process.argv[3]).blob=await native.localResourceStore(process.argv[4]);
   await import(process.argv[5]);`;
  app=spawn(process.execPath,['--input-type=module','-e',bootstrap,new URL('./native-local.mjs',import.meta.url).href,
   credentialFile,path.join(root,'lib/portal/resources.js'),path.join(base,'resources'),new URL('./serve-local.mjs',import.meta.url).href],
   {cwd:root,env:{...process.env},stdio:['ignore','pipe','pipe']});
  app.stdout.resume();app.stderr.resume();
  for(let attempt=0;attempt<60;attempt++){
   if(app.exitCode!==null)throw Error('Isolated Portal adapter exited before readiness');
   try{if((await fetch(origin+'/portal/login.html')).status===200)return;}catch{}
   await delay(100);
  }
  throw Error('Local adapter readiness timeout');
 }
 async function stopApp(){if(app&&app.exitCode===null){const stopped=once(app,'exit');app.kill('SIGTERM');await stopped;}app=null;}
 async function nativeData(query){
  const response=await fetch(credentials.API_URL+'/rest/v1/'+query,{headers:{apikey:credentials.PUBLISHABLE_KEY,Authorization:'Bearer '+token,'Accept-Profile':'portal'}});
  assert.equal(response.status,200);return response.json();
 }
 async function records(){
  const projection='?select=id,mission_id,program_version_id,status,updated_at&order=id';
  return {family:await nativeData('mission_progress'+projection),school:await nativeData('cohort_mission_delivery'+projection)};
 }
 async function preview(page,name){if(process.env.AIEA_PORTAL_SCREENSHOTS){await fs.mkdir(process.env.AIEA_PORTAL_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.AIEA_PORTAL_SCREENSHOTS,name+'.png'),fullPage:true});}}
 try{
  await startApp();
  browser=await chromium.launch({executablePath:process.env.AIEA_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-networking']});
  const context=await browser.newContext({viewport:{width:1280,height:1000},acceptDownloads:true});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  async function signIn(){
   const remaining=lastRequest+62000-Date.now();
   if(remaining>0){console.log('Honor native OTP cooldown before repeat sign-in.');await delay(remaining);}
   await page.goto(origin+'/portal');await page.getByLabel('Your email address').waitFor();
   const old=new Set((await (await fetch(mail+'/api/v1/messages')).json()).messages.map(m=>m.ID));
   await page.getByLabel('Your email address').fill(state.users.adult.email);lastRequest=Date.now();
   await page.getByRole('button',{name:'Send sign-in code'}).click();await page.getByLabel('Six-digit sign-in code').waitFor();
   let code;
   for(let attempt=0;attempt<80&&!code;attempt++){
    const list=await (await fetch(mail+'/api/v1/messages')).json();
    const item=list.messages.find(m=>!old.has(m.ID)&&m.To.some(to=>to.Address===state.users.adult.email));
    if(item){const message=await (await fetch(mail+'/api/v1/message/'+item.ID)).json();const codes=[...new Set((message.Text+' '+message.HTML).match(/\b\d{6}\b/g)||[])];assert.equal(codes.length,1);code=codes[0];}
    else await delay(100);
   }
   assert.ok(code,'genuine local SMTP OTP required');
   await page.getByLabel('Six-digit sign-in code').fill(code);await page.getByRole('button',{name:'Sign in',exact:true}).click();
   await page.locator('#workspace-select').waitFor();
   const cookie=(await context.cookies()).find(c=>c.name==='aiea_portal_local');assert.ok(cookie?.httpOnly);token=cookie.value;
   assert.equal(await page.evaluate(()=>document.cookie),'');
   assert.deepEqual((await nativeData('workspace?select=id')).map(w=>w.id).sort(),[state.family,state.school].sort());
   console.log('PASS native adult email OTP, HttpOnly cookie and authorized workspaces');
  }
  async function openVersion(count,school=false,withProgress=true){
   const version=state.versions.find(v=>v.count===count);
   await page.locator('#workspace-select').selectOption(school?state.school:state.family);
   await page.locator('#workspace-name').filter({hasText:school?'LOCAL TEST DYNAMIC SCHOOL':'LOCAL TEST DYNAMIC FAMILY'}).waitFor();
   await page.locator('#programs-open').click();await page.getByRole('button',{name:version.title,exact:true}).click();
   await page.locator('#curriculum-sequence').filter({hasText:count+' missions available'}).waitFor();
   assert.equal(await page.locator('#curriculum-list li').count(),count);
   if(withProgress){await page.locator('#progress-open').click();await page.locator('#subject-select').selectOption(school?state.cohort:state.learner);await page.locator('#progress-summary-text').filter({hasText:'of '+count+' missions'}).waitFor();}
  }
  async function recordNext(count,school=false){
   await page.locator('#progress-continue').click();await page.locator('#progress-start').waitFor();
   const before=await page.locator('#progress-summary-text').textContent();
   assert.equal(before.includes('of '+count+' missions'),true);
   await page.locator('#progress-start').click();await page.locator('#progress-finish').waitFor();
   await page.locator('#progress-finish').click();
   await page.locator('#progress-finish').waitFor({state:'hidden'});
   await page.locator('#missions-back').click();await page.locator('#progress-summary-text').filter({hasText:'of '+count+' missions'}).waitFor();
  }
  await signIn();
  const v4=state.versions.find(v=>v.count===4),v5=state.versions.find(v=>v.count===5),denied=state.versions.find(v=>!v.authorized);
  await openVersion(4);
  let current=await records();
  // Reruns preserve already-completed test records and never reset progress.
  while(current.family.filter(r=>r.program_version_id===v4.id&&r.status==='COMPLETED').length<2){await recordNext(4);current=await records();}
  const partial=await records();await stopApp();await startApp();await page.reload();await openVersion(4);
  assert.deepEqual(await records(),partial);
  console.log('PASS native saved FAMILY progress survives application restart with unchanged row IDs');
  while(current.family.filter(r=>r.program_version_id===v4.id&&r.status==='COMPLETED').length<4){await recordNext(4);current=await records();}
  assert.equal(await page.locator('#progress-meter').getAttribute('max'),'4');
  await preview(page,'dynamic-family-four-complete');
  await page.setViewportSize({width:390,height:844});await openVersion(5,true);
  current=await records();
  while(current.school.filter(r=>r.program_version_id===v5.id&&r.status==='DELIVERED').length<5){await recordNext(5,true);current=await records();}
  assert.equal(await page.locator('#progress-meter').getAttribute('max'),'5');
  assert.ok((await page.locator('#progress-explanation').textContent()).includes('does not record individual completion'));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await preview(page,'dynamic-school-five-delivered');
  await openVersion(36,false,false);
  await page.locator('#curriculum-list button').first().click();
  await page.locator('#curriculum-sequence').filter({hasText:'Mission 1 · 1 of 36'}).waitFor();
  assert.equal(await page.locator('#mission-previous').isDisabled(),true);
  assert.equal(await page.locator('#mission-previous').evaluate(button=>getComputedStyle(button).backgroundImage),'none');
  await page.locator('#mission-next').click();await page.locator('#curriculum-sequence').filter({hasText:'Mission 2 · 2 of 36'}).waitFor();
  await page.locator('#missions-back').click();await page.locator('#curriculum-list button').nth(35).click();
  await page.locator('#curriculum-sequence').filter({hasText:'Mission 36 · 36 of 36'}).waitFor();
  assert.equal(await page.locator('#mission-next').isDisabled(),true);
  assert.equal(await page.locator('#mission-next').evaluate(button=>getComputedStyle(button).backgroundImage),'none');
  await page.locator('#resources-open').click();await page.locator('#resources-list button').waitFor();
  const pending=page.waitForEvent('download');await page.locator('#resources-list button').click();const download=await pending;
  assert.equal(createHash('sha256').update(await fs.readFile(await download.path())).digest('hex'),state.resource_hash);
  await page.setViewportSize({width:320,height:800});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.setViewportSize({width:1280,height:1000});
  await preview(page,'dynamic-thirty-six-last-mission');
  console.log('PASS 4/5/36-item desktop/mobile sequences, ordinal boundaries, resource hash and SCHOOL delivery semantics');
  for(const endpoint of ['curriculum','resources']){
   const suffix=endpoint==='resources'?'&resource_id='+denied.resource:'';
   const result=await context.request.get(origin+'/api/portal/'+endpoint+'?workspace_id='+state.family+'&program_version_id='+denied.id+'&mission_id='+denied.missions[0]+suffix);
   assert.equal(result.status(),404);assert.ok(!('sequence' in await result.json()));
  }
  for(const table of ['mission','mission_locale','resource_asset'])assert.deepEqual(await nativeData(table+'?select=*&program_version_id=eq.'+denied.id),[]);
  for(const school of [false,true]){
   const body={workspace_id:state[school?'school':'family'],program_version_id:denied.id,mission_id:denied.missions[0],
    [school?'cohort_id':'learner_ref_id']:state[school?'cohort':'learner'],action:'start'};
   const result=await fetch(credentials.API_URL+'/rest/v1/rpc/'+(school?'record_cohort_delivery':'record_mission_progress'),{method:'POST',
    headers:{apikey:credentials.PUBLISHABLE_KEY,Authorization:'Bearer '+token,'Content-Profile':'portal','Content-Type':'application/json'},body:JSON.stringify(body)});
   assert.equal(result.status,403);
  }
  console.log('PASS unentitled content denied by Portal routes, direct PostgREST RLS and both native write RPCs');
  const complete=await records();assert.equal(complete.family.length,4);assert.equal(complete.school.length,5);
  await page.locator('#signout').click();await page.waitForURL('**/portal/login.html?signed_out=1');
  await signIn();await openVersion(4);assert.deepEqual(await records(),complete);
  await stopApp();await startApp();await page.reload();await openVersion(5,true);assert.deepEqual(await records(),complete);
  assert.equal(errors.length,0);
  console.log('PASS all nine saved records retain identities/timestamps after sign-out, email sign-in and application restart; zero browser errors');
 }finally{await browser?.close();await stopApp();}
});
