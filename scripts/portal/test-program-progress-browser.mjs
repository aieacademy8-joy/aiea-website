// Real Chrome, production shell/client/read handlers, synthetic Auth/data only.
// No native Auth proof, database, credentials, hosted calls or mutation fixture.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.AIEA_PLAYWRIGHT_MODULE);
const p=require('../../lib/portal/runtime');
const id=n=>'30000000-0000-0000-0000-'+String(n).padStart(12,'0');
const W=id(1),S=id(2),V=id(3),P=id(4),L=id(5),C=id(6),A=id(7),rule={method:'ADULT_ATTESTATION'};
const missions=[2,5,9].map((sequence,i)=>({id:id(10+i),program_version_id:V,mission_key:'mission-'+sequence,sequence,completion_rules:rule,evidence_expectations:{required:false}}));
const titles=['Explore <img>','Create together','Reflect'];
const routes=new Map([
 ['/portal',require('../../api/portal/index')],['/api/portal/context',require('../../api/portal/context')],
 ['/api/portal/curriculum',require('../../api/portal/curriculum')],['/api/portal/progress',require('../../api/portal/progress')]
]);
test('program progress, mission navigation and curriculum languages in Chrome with synthetic read-only upstream',async()=>{
 const saved={...p},env={...process.env};let browser,workspace=W,subjectRevoked=false,holdStatus,releaseStatus,expired=false;
 let publishedLocales=['en-US','es'],fallback='en-US',active=true,holdCurriculum,releaseCurriculum;
 const requests=[],errors=[];
 const exp=Math.floor(Date.now()/1000)+3600;
 p.authenticate=async()=>{if(expired)p.fail(401,'sign_in_required');return {token:'synthetic',userId:A,exp};};
 p.context=async(c,a,selected)=>{
  const workspaces=[{id:W,kind:'FAMILY',role:'OWNER',display_name:'Family explorers'},{id:S,kind:'SCHOOL',role:'TEACHER',display_name:'School explorers'}];
  return {workspaces,selected_workspace_id:selected,entitlements:selected&&active?[{id:id(30),program_version_id:V,status:'ACTIVE'}]:[]};
 };
 p.rows=async(c,token,query)=>{
  const table=query.split('?')[0],q=new URLSearchParams(query.split('?')[1]);
  if(table==='program_version')return [{id:V,program_id:P,version_key:'Pilot 1',status:'PUBLISHED',fallback_locale:fallback,completion_rules:rule}];
  if(table==='program')return [{id:P,program_key:'explorers'}];
  if(table==='program_version_locale')return publishedLocales.map(locale_code=>({program_version_id:V,locale_code,title:locale_code==='es'?'Programa':'AI Explorers Pilot',description:locale_code==='es'?'Descripción':'Explore, create and reflect together.',guidance:locale_code==='es'?'Guía':'Choose your learner code or cohort to see recorded mission status.',status:'PUBLISHED'}));
  if(table==='mission')return missions.filter(m=>!q.has('id')||q.get('id')==='eq.'+m.id);
  if(table==='mission_locale'){
   if(holdCurriculum){const gate=holdCurriculum;holdCurriculum=null;await gate;}
   return missions.filter(m=>q.get('mission_id').includes(m.id)).map(m=>({mission_id:m.id,program_version_id:V,locale_code:q.get('locale_code').slice(3),title:titles[missions.indexOf(m)],instructions:'Investigate a familiar example together. Share what you notice.',reflection:'What would you try next?',status:'PUBLISHED'}));
  }
  if(table==='learner_ref')return subjectRevoked?[]:[{id:L,workspace_id:W,display_code:'EXPLORER-01',status:'ACTIVE'}];
  if(table==='cohort')return [{id:C,workspace_id:S,display_code:'COHORT-A',status:'ACTIVE'}];
  if(table==='mission_progress'||table==='cohort_mission_delivery'){
   if(holdStatus){const gate=holdStatus;holdStatus=null;await gate;}
   const family=table==='mission_progress';
   return [0,2].map((i)=>({workspace_id:family?W:S,program_version_id:V,mission_id:missions[i].id,[family?'learner_ref_id':'cohort_id']:family?L:C,status:family?(i===0?'COMPLETED':'IN_PROGRESS'):(i===0?'DELIVERED':'STARTED')}));
  }
  throw Error('Unexpected fixture query: '+table);
 };
 p.upstream=async()=>{throw Error('Unexpected external or mutation request');};
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');requests.push({path:url.pathname,method:req.method});
  if(req.method!=='GET'){res.writeHead(405);res.end();return;}
  if(url.pathname==='/api/portal/progress')workspace=url.searchParams.get('workspace_id');
  const handler=routes.get(url.pathname);
  if(handler){await handler(req,res);return;}
  if(url.pathname==='/assets/logo.png'){res.setHeader('Content-Type','image/png');res.end(await fs.readFile(new URL('../../assets/logo.png',import.meta.url)));return;}
  if(['/portal/portal.js','/portal/portal.css','/portal/login.html'].includes(url.pathname)){
   res.setHeader('Content-Type',url.pathname.endsWith('.js')?'text/javascript':url.pathname.endsWith('.css')?'text/css':'text/html');
   res.end(await fs.readFile(new URL('../../'+url.pathname.slice(1),import.meta.url)));return;
  }
  res.writeHead(404);res.end();
 });
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  Object.assign(process.env,{PORTAL_SUPABASE_URL:'http://127.0.0.1:54321',PORTAL_ORIGIN:origin,PORTAL_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic'});
  browser=await chromium.launch({executablePath:process.env.AIEA_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-networking']});
  const ctx=await browser.newContext({viewport:{width:1280,height:1000}});
  await ctx.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install();await page.clock.pauseAt(new Date());
  await page.goto(origin+'/portal');await page.getByLabel('Select a workspace').selectOption(W);
  await page.getByRole('button',{name:'My Programs',exact:true}).click();
  await page.getByRole('button',{name:'AI Explorers Pilot',exact:true}).click();
  await page.getByRole('button',{name:'View program progress',exact:true}).click();
  await page.getByLabel('Select a learner code').selectOption(L);
  await page.getByText('1 of 3 missions recorded as completed. 1 in progress · 1 not started.',{exact:true}).waitFor();
  assert.equal(await page.locator('#progress-list img').count(),0);
  assert.equal(await page.locator('#progress-list button').count(),3);
  assert.equal(await page.locator('#progress-start').isVisible(),false);
  assert.equal(await page.locator('#progress-finish').isVisible(),false);
  if(process.env.AIEA_PORTAL_SCREENSHOTS){await fs.mkdir(process.env.AIEA_PORTAL_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.AIEA_PORTAL_SCREENSHOTS+'/program-progress-desktop.png',fullPage:true});}
  await page.getByRole('button',{name:'Continue mission',exact:true}).click();
  await page.locator('#curriculum-title').filter({hasText:'Reflect'}).waitFor({state:'visible'});
  await page.getByRole('button',{name:'Mark completed',exact:true}).waitFor();
  assert.equal(await page.locator('#subject-select').inputValue(),L);
  assert.ok(requests.every(r=>r.method==='GET'));
  assert.equal(await page.getByRole('button',{name:'Next Mission',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'Previous Mission',exact:true}).click();await page.getByRole('button',{name:'Start mission',exact:true}).waitFor();
  assert.equal(await page.locator('#subject-select').inputValue(),L);
  await page.getByLabel('Curriculum language').selectOption('es');await page.locator('#mission-instructions[lang="es"]').waitFor();
  await page.locator('#subject-select option[value="'+L+'"]').waitFor({state:'attached'});assert.equal(await page.locator('#subject-select').inputValue(),L);
  assert.deepEqual(await page.locator('#curriculum-language-select option').evaluateAll(options=>options.map(o=>o.value)),['en-US','es']);
  await page.getByRole('button',{name:'Previous Mission',exact:true}).click();await page.locator('#curriculum-title').filter({hasText:titles[0]}).waitFor();
  await page.locator('#subject-select option[value="'+L+'"]').waitFor({state:'attached'});assert.equal(await page.getByRole('button',{name:'Previous Mission',exact:true}).isDisabled(),true);
  assert.equal(await page.locator('#curriculum-language-select').inputValue(),'es');assert.equal(await page.locator('#subject-select').inputValue(),L);
  await page.getByRole('button',{name:'Next Mission',exact:true}).click();await page.getByRole('button',{name:'Start mission',exact:true}).waitFor();
  await page.getByRole('button',{name:'Next Mission',exact:true}).click();await page.getByRole('button',{name:'Mark completed',exact:true}).waitFor();
  assert.equal(await page.locator('#curriculum-language-select').inputValue(),'es');assert.equal(await page.locator('#subject-select').inputValue(),L);
  if(process.env.AIEA_PORTAL_SCREENSHOTS){await page.screenshot({path:process.env.AIEA_PORTAL_SCREENSHOTS+'/mission-experience-desktop.png',fullPage:true});
   await page.setViewportSize({width:390,height:844});
   await page.getByRole('button',{name:'Previous Mission',exact:true}).click();await page.getByRole('button',{name:'Start mission',exact:true}).waitFor();
   await page.getByRole('button',{name:'Next Mission',exact:true}).click();await page.getByRole('button',{name:'Mark completed',exact:true}).waitFor();
   assert.equal(await page.locator('#subject-select').inputValue(),L);assert.equal(await page.locator('#curriculum-language-select').inputValue(),'es');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:process.env.AIEA_PORTAL_SCREENSHOTS+'/mission-experience-mobile.png',fullPage:true});await page.setViewportSize({width:1280,height:1000});}
  await page.getByLabel('Curriculum language').selectOption('en-US');await page.locator('#mission-instructions[lang="en-US"]').waitFor();
  await page.getByRole('button',{name:'Mark completed',exact:true}).waitFor();
  await page.getByRole('button',{name:'Mission list',exact:true}).click();
  await page.getByRole('button',{name:'Continue mission',exact:true}).waitFor();
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(process.env.AIEA_PORTAL_SCREENSHOTS)await page.screenshot({path:process.env.AIEA_PORTAL_SCREENSHOTS+'/program-progress-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'5. Create together',exact:true}).last().click();
  await page.getByRole('button',{name:'Start mission',exact:true}).waitFor();
  assert.ok(requests.every(r=>r.method==='GET'),'opening a not-started mission does not start it');
  await page.getByLabel('Select a workspace').selectOption(S);
  await page.getByRole('button',{name:'My Programs',exact:true}).click();
  await page.getByRole('button',{name:'AI Explorers Pilot',exact:true}).click();
  await page.getByRole('button',{name:'View program progress',exact:true}).click();
  await page.getByLabel('Select a cohort').selectOption(C);
  await page.getByText('1 of 3 missions recorded as delivered to this cohort. 1 started · 1 not started.',{exact:true}).waitFor();
  assert.ok(!(await page.locator('#progress-summary-text').textContent()).includes('completed'));
  assert.ok(!(await page.locator('#subject-select').textContent()).includes('EXPLORER'));
  await page.getByRole('button',{name:'Continue mission',exact:true}).click();
  await page.getByRole('button',{name:'Mark delivered',exact:true}).waitFor();
  assert.equal(workspace,S);
  await page.getByRole('button',{name:'Previous Mission',exact:true}).click();await page.getByRole('button',{name:'Start mission',exact:true}).waitFor();
  await page.getByLabel('Curriculum language').selectOption('es');await page.locator('#mission-instructions[lang="es"]').waitFor();
  await page.getByRole('button',{name:'Next Mission',exact:true}).click();await page.getByRole('button',{name:'Mark delivered',exact:true}).waitFor();
  assert.equal(await page.locator('#subject-select').inputValue(),C);assert.equal(await page.locator('#curriculum-language-select').inputValue(),'es');
  assert.equal(await page.getByRole('button',{name:'Mark completed',exact:true}).isVisible(),false);
  // Simulate published-language availability changes in this process only.
  publishedLocales=['en-US'];await page.getByRole('button',{name:'Previous Mission',exact:true}).click();
  await page.locator('#curriculum-language-notice').filter({hasText:'published fallback'}).waitFor();assert.equal(await page.locator('#mission-instructions').getAttribute('lang'),'en-US');
  fallback=null;await page.getByRole('button',{name:'Previous Mission',exact:true}).click();
  await page.locator('#curriculum-notice').filter({hasText:'published languages'}).waitFor();assert.equal(await page.locator('#mission-instructions').textContent(),'');
  await page.locator('#programs-back').click();await page.getByLabel('Curriculum language').selectOption('en-US');
  await page.getByRole('button',{name:'AI Explorers Pilot',exact:true}).waitFor();publishedLocales=['en-US','es'];fallback='en-US';
  // Revoke exact-version access while a neighbor read is held at the backend.
  await page.getByRole('button',{name:'AI Explorers Pilot',exact:true}).click();await page.getByRole('button',{name:'2. Explore <img>',exact:true}).click();
  await page.getByRole('button',{name:'Next Mission',exact:true}).waitFor();holdCurriculum=new Promise(resolve=>{releaseCurriculum=resolve;});
  await page.getByRole('button',{name:'Next Mission',exact:true}).click();active=false;releaseCurriculum();
  await page.locator('#curriculum-notice').filter({hasText:'no longer available'}).waitFor();
  assert.equal(await page.locator('#mission-instructions').textContent(),'');assert.equal(await page.locator('#curriculum-language-select option').count(),0);
  assert.equal(await page.locator('#mission-navigation').isVisible(),false);assert.equal(await page.locator('#subject-select option').count(),0);active=true;
  // Held final read: a revoked subject cannot restore old codes/counts/titles.
  await page.getByLabel('Select a workspace').selectOption(W);
  await page.getByRole('button',{name:'My Programs',exact:true}).click();
  await page.getByRole('button',{name:'AI Explorers Pilot',exact:true}).click();
  await page.getByRole('button',{name:'View program progress',exact:true}).click();
  holdStatus=new Promise(resolve=>{releaseStatus=resolve;});
  await page.getByLabel('Select a learner code').selectOption(L);
  await page.getByText('Loading mission status…',{exact:true}).waitFor();
  subjectRevoked=true;releaseStatus();
  await page.getByText('We couldn’t load status. Reload to check your current access.',{exact:true}).waitFor();
  assert.equal(await page.locator('#progress-summary-text').textContent(),'');assert.equal(await page.locator('#progress-list button').count(),0);
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  assert.equal(await page.locator('#subject-select option').count(),0);assert.equal(await page.locator('#progress-summary-text').textContent(),'');
  assert.deepEqual(errors,[]);assert.ok(requests.every(r=>r.method==='GET'));
  expired=true;await page.goto(origin+'/portal');assert.equal(new URL(page.url()).pathname,'/portal/login.html');
 }finally{
  releaseStatus?.();releaseCurriculum?.();await browser?.close();await new Promise(resolve=>server.close(resolve));Object.assign(p,saved);process.env=env;
 }
});
