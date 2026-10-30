// Genuine local Auth/PostgREST/RPC persistence with explicitly labeled LOCAL TEST
// DATA. No fetch mocks, approved curriculum claim or hosted service access.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {localCredentials} from './native-local.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const credentialsPath=process.env.AIEA_LOCAL_CREDENTIALS;
if(!credentialsPath)throw Error('Supply the private isolated local credential file');
const credentials=JSON.parse(await fs.readFile(credentialsPath,'utf8'));
localCredentials(credentials); // Deny hosted URLs before any network request.
const base=path.dirname(credentialsPath),state=JSON.parse(await fs.readFile(path.join(base,'pilot-state.json'),'utf8'));
const require=createRequire(import.meta.url),{chromium}=require(process.env.AIEA_PLAYWRIGHT_MODULE);
const origin='http://localhost:4321',mail='http://127.0.0.1:54324';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

test('native local adult OTP, eight FAMILY completions, eight SCHOOL deliveries and durable restart/resume (LOCAL TEST DATA)',async()=>{
 let app,browser,lastRequest=0;const errors=[];
 async function startApp(){
  app=spawn(process.execPath,['scripts/portal/native-local.mjs','serve',credentialsPath,path.join(base,'resources')],{cwd:root,env:{...process.env},stdio:['ignore','pipe','pipe']});
  app.stdout.resume();app.stderr.resume();
  for(let attempt=0;attempt<50;attempt++){
   if(app.exitCode!==null)throw Error('Local Portal adapter exited before readiness');
   try{if((await fetch(origin+'/portal/login.html')).status===200)return;}catch{}
   await delay(100);
  }
  throw Error('Local Portal adapter readiness timeout');
 }
 async function stopApp(){if(app&&app.exitCode===null){const stopped=once(app,'exit');app.kill('SIGTERM');await stopped;}app=null;}
 async function data(name,token){
  const response=await fetch(credentials.API_URL+'/rest/v1/'+name,{headers:{apikey:credentials.PUBLISHABLE_KEY,Authorization:'Bearer '+token,'Accept-Profile':'portal'}});
  assert.equal(response.status,200);return response.json();
 }
 async function screenshot(page,name){
  const directory=process.env.AIEA_PORTAL_SCREENSHOTS;
  if(directory){await fs.mkdir(directory,{recursive:true});await page.screenshot({path:path.join(directory,name+'.png'),fullPage:true});}
 }
 try{
  await startApp();
  browser=await chromium.launch({executablePath:process.env.AIEA_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-networking']});
  const context=await browser.newContext({viewport:{width:1280,height:1000},acceptDownloads:true});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  let token;
  async function signIn(){
   // Honor native email throttling rather than weakening local Auth settings.
   const remaining=lastRequest+62000-Date.now();if(remaining>0){console.log('Waiting for the native OTP resend interval before signing in again.');await delay(remaining);}
   await page.goto(origin+'/portal');assert.equal(new URL(page.url()).pathname,'/portal/login.html');
   const messages=await (await fetch(mail+'/api/v1/messages')).json(),oldIds=new Set(messages.messages.map(m=>m.ID));
   await page.getByLabel('Your email address').fill(state.users.adult.email);lastRequest=Date.now();
   await page.getByRole('button',{name:'Send sign-in code'}).click();await page.getByLabel('Six-digit sign-in code').waitFor();
   let code;
   for(let attempt=0;attempt<80&&!code;attempt++){
    const list=await (await fetch(mail+'/api/v1/messages')).json();
    const item=list.messages.find(m=>!oldIds.has(m.ID)&&m.To.some(to=>to.Address===state.users.adult.email));
    if(item){const message=await (await fetch(mail+'/api/v1/message/'+item.ID)).json();const text=message.Text+' '+message.HTML;
     const codes=[...new Set(text.match(/\b\d{6}\b/g)||[])];assert.equal(codes.length,1);assert.ok(!text.includes('/auth/v1/verify?'));code=codes[0];}
    else await delay(100);
   }
   assert.ok(code,'native local SMTP must deliver the exact account OTP');
   await page.getByLabel('Six-digit sign-in code').fill(code);await page.getByRole('button',{name:'Sign in',exact:true}).click();
   await page.getByLabel('Select a workspace').waitFor();
   const cookie=(await context.cookies()).find(c=>c.name==='aiea_portal_local');assert.ok(cookie?.httpOnly);assert.equal(cookie.sameSite,'Lax');
   assert.equal(await page.evaluate(()=>document.cookie),'');token=cookie.value;
   const identity=await fetch(credentials.API_URL+'/auth/v1/user',{headers:{apikey:credentials.PUBLISHABLE_KEY,Authorization:'Bearer '+token}});
   assert.equal(identity.status,200);assert.equal((await identity.json()).id,state.users.adult.id);
   const visible=await data('workspace?select=id',token);assert.deepEqual(visible.map(w=>w.id).sort(),[state.family,state.school].sort());
   console.log('PASS native emailed OTP, HttpOnly session and exact authorized workspaces');
  }
  async function openProgram(school=false){
   await page.getByLabel('Select a workspace').selectOption(school?state.school:state.family);
   await page.getByRole('button',{name:'My Programs',exact:true}).click();
   await page.getByRole('button',{name:'LOCAL TEST DATA — eight-mission technical journey',exact:true}).click();
   await page.getByRole('button',{name:'View program progress',exact:true}).click();
   await page.getByLabel(school?'Select a cohort':'Select a learner code').selectOption(school?state.cohort:state.learner);
  }
  async function openNext(){await page.getByRole('button',{name:'Open next mission',exact:true}).click();await page.getByRole('button',{name:'Start mission',exact:true}).waitFor();}
  async function record(sequence,school=false){
   await page.getByRole('button',{name:'Start mission',exact:true}).click();
   await page.getByRole('button',{name:school?'Mark delivered':'Mark completed',exact:true}).click();
   await page.locator('#progress-summary-text').filter({hasText:sequence+' of 8 missions recorded as '+(school?'delivered to this cohort.':'completed.')}).waitFor();
   const records=await data((school?'cohort_mission_delivery':'mission_progress')+'?select=mission_id,status,actor_user_id',token);
   assert.equal(records.filter(r=>r.status===(school?'DELIVERED':'COMPLETED')).length,sequence);
   assert.ok(records.every(r=>r.actor_user_id===state.users.adult.id));
  }
  async function next(){await page.getByRole('button',{name:'Next Mission',exact:true}).click();await page.getByRole('button',{name:'Start mission',exact:true}).waitFor();}
  await signIn();await openProgram();await openNext();
  assert.equal((await context.request.get(origin+'/api/portal/context?workspace_id='+state.unauthorized_workspace)).status(),403);
  assert.equal((await context.request.get(origin+'/api/portal/curriculum?workspace_id='+state.unauthorized_workspace+'&program_version_id='+state.version)).status(),403);
  assert.equal(await page.locator('#mission-previous').isDisabled(),true);
  await page.locator('#mission-instructions').filter({hasText:'LOCAL TEST DATA. Technical lesson rendering check 1.'}).waitFor();
  assert.deepEqual(await page.getByLabel('Curriculum language').locator('option').evaluateAll(options=>options.map(o=>o.value)),['en-US']);
  await page.getByRole('button',{name:'Learning resources',exact:true}).click();
  const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Download LOCAL TEST resource',exact:true}).click();
  const download=await downloadEvent;assert.deepEqual(await fs.readFile(await download.path()),await fs.readFile(path.join(base,'resources',state.resource_path)));
  console.log('PASS native database lesson/resource metadata and authorized private file download');
  // Reading/downloading did not record progress. Completion cannot skip start.
  assert.equal((await data('mission_progress?select=mission_id',token)).length,0);
  const premature=await context.request.post(origin+'/api/portal/progress',{headers:{Origin:origin},data:{workspace_id:state.family,program_version_id:state.version,mission_id:state.missions[0],subject_id:state.learner,action:'complete'}});
  assert.ok([400,409].includes(premature.status()));assert.equal((await data('mission_progress?select=mission_id',token)).length,0);
  for(let sequence=1;sequence<=3;sequence++){await record(sequence);if(sequence<3)await next();}
  await screenshot(page,'native-family-three-missions');
  const before=await data('mission_progress?select=id,mission_id,status,actor_user_id,updated_at&order=mission_id',token);
  await stopApp();await startApp();await page.reload();await openProgram();
  await page.getByText('3 of 8 missions recorded as completed. 0 in progress · 5 not started.',{exact:true}).waitFor();
  assert.deepEqual(await data('mission_progress?select=id,mission_id,status,actor_user_id,updated_at&order=mission_id',token),before);
  console.log('PASS three genuine saved completions survive an application process restart');
  const oldToken=token;
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByLabel('Your email address').waitFor();
  const denied=await context.request.get(origin+'/api/portal/context');assert.equal(denied.status(),401);
  const loggedOut=await fetch(credentials.API_URL+'/rest/v1/rpc/record_mission_progress',{method:'POST',headers:{apikey:credentials.PUBLISHABLE_KEY,Authorization:'Bearer '+oldToken,'Content-Profile':'portal','Content-Type':'application/json'},body:JSON.stringify({workspace_id:state.family,program_version_id:state.version,mission_id:state.missions[3],learner_ref_id:state.learner,action:'start'})});
  assert.equal(loggedOut.status,403);
  await signIn();await openProgram();
  await page.getByText('3 of 8 missions recorded as completed. 0 in progress · 5 not started.',{exact:true}).waitFor();
  assert.deepEqual(await data('mission_progress?select=id,mission_id,status,actor_user_id,updated_at&order=mission_id',token),before);
  await openNext();await page.locator('#curriculum-title').filter({hasText:'LOCAL TEST Mission 4'}).waitFor();
  console.log('PASS fresh native sign-in resumes saved progress at Mission 4');
  for(let sequence=4;sequence<=8;sequence++){await record(sequence);if(sequence<8)await next();}
  assert.equal(await page.locator('#mission-next').isDisabled(),true);
  await page.getByRole('button',{name:'Mission list',exact:true}).click();
  await page.getByText('All missions have a recorded completion for this learner code.',{exact:true}).waitFor();
  await screenshot(page,'native-family-complete');console.log('PASS eight genuine FAMILY mission completions');
  await openProgram(true);await openNext();await page.setViewportSize({width:390,height:844});
  for(let sequence=1;sequence<=8;sequence++){await record(sequence,true);assert.equal(await page.getByRole('button',{name:'Mark completed',exact:true}).isVisible(),false);if(sequence<8)await next();}
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.getByRole('button',{name:'Mission list',exact:true}).click();
  await page.getByText('All missions have a recorded delivery to this cohort.',{exact:true}).waitFor();
  await screenshot(page,'native-school-delivered');
  assert.equal((await data('mission_progress?select=mission_id',token)).length,8);
  assert.equal((await data('cohort_mission_delivery?select=mission_id',token)).length,8);
  console.log('PASS eight genuine SCHOOL cohort deliveries; FAMILY completion stays separate');
  const allBefore=[await data('mission_progress?select=id,status,updated_at&order=id',token),await data('cohort_mission_delivery?select=id,status,updated_at&order=id',token)];
  await stopApp();await startApp();await page.reload();
  assert.deepEqual([await data('mission_progress?select=id,status,updated_at&order=id',token),await data('cohort_mission_delivery?select=id,status,updated_at&order=id',token)],allBefore);
  await openProgram(true);await page.getByText('All missions have a recorded delivery to this cohort.',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS all sixteen persisted records survive another application restart; no browser errors');
 }finally{await browser?.close();await stopApp();}
});
