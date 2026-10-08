// Chrome + actual local handlers/native Auth/RLS. Only named failure displays and
// focus/coordination clocks are controlled; held successful responses stay native.
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url), { chromium }=require(process.env.AIEA_PLAYWRIGHT_MODULE);
const credentials=process.env.AIEA_LOCAL_CREDENTIALS, directory=path.dirname(credentials);
const c=JSON.parse(await fs.readFile(credentials,'utf8'));
if(c.API_URL!=='http://127.0.0.1:54321')throw Error('Disposable loopback only');
const f=JSON.parse(await fs.readFile(path.join(directory,'curriculum-fixtures.json'),'utf8'));
const origin='http://localhost:4321', W='10000000-0000-0000-0000-000000000002', S='10000000-0000-0000-0000-000000000001';
const results=[];
// Operator SQL is confined to the disposable synthetic fixture. It is never a Portal request.
const sql=statement=>execFileSync('docker',['exec','-i','supabase_db_aiea-portal-local','psql','-X','-At','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres'],{input:statement,encoding:'utf8'}).trim();
const quote=value=>"'"+value.replaceAll("'","''")+"'";
const tables=sql("select tablename from pg_tables where schemaname='portal' order by tablename").split('\n');
const snapshot=()=>createHash('sha256').update(tables.map(t=>sql('select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'+"'[]'::jsonb"+') from portal.'+t+' x;')).join('\n')).digest('hex');
const learning=['learner_ref','cohort','cohort_teacher_assignment','cohort_learner_assignment','mission_progress','cohort_mission_delivery','assessment_attempt','assessment_response','evidence_record','pilot_feedback'];
const learningSnapshot=()=>createHash('sha256').update(learning.map(t=>sql("select coalesce(jsonb_agg(to_jsonb(x) order by id),'[]'::jsonb) from portal."+t+' x;')).join('\n')).digest('hex');
const learningBefore=learningSnapshot();
function check(label,value){results.push({label,pass:!!value});console.log((value?'PASS ':'FAIL ')+label);if(!value)throw Error(label);}
async function code(){const email=f.users['8'].email;if(!email.endsWith('@example.invalid'))throw Error('Synthetic adult only');const r=await fetch(c.API_URL+'/auth/v1/admin/generate_link',{method:'POST',headers:{apikey:c.SECRET_KEY,Authorization:'Bearer '+c.SERVICE_ROLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({type:'magiclink',email})});if(r.status!==200)throw Error('Synthetic code unavailable');return {action:'verify',email,code:(await r.json()).email_otp};}
const browser=await chromium.launch({executablePath:process.env.AIEA_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-networking']});
try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route('**/*',route=>{const u=new URL(route.request().url());return u.hostname==='localhost'&&u.port==='4321'?route.continue():route.abort();});
  const response=await context.request.post(origin+'/api/portal/auth',{headers:{Origin:origin},data:await code()});
  check('01C native existing-adult app verification succeeds',response.status()===200&&JSON.stringify(await response.json())==='{"authenticated":true}');
  const page=await context.newPage(), errors=[], domainMutations=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.method()!=='GET'&&!r.url().endsWith('/api/portal/auth'))domainMutations.push(r.url());});
  await page.clock.install();await page.clock.pauseAt(new Date());
  await page.goto(origin+'/portal');
  const choose=async w=>{await page.getByLabel('Select a workspace').waitFor();await page.getByLabel('Select a workspace').selectOption(w);await page.getByRole('heading',{name:w===W?'Synthetic family':'Synthetic school A',exact:true}).waitFor();};
  const open=async()=>{await page.getByRole('button',{name:'My Programs',exact:true}).click();await page.getByRole('button',{name:'Synthetic 01C 1',exact:true}).waitFor();await page.getByRole('button',{name:'Synthetic 01C 1',exact:true}).click();await page.getByRole('button',{name:'1. Synthetic mission 1',exact:true}).waitFor();await page.getByRole('button',{name:'1. Synthetic mission 1',exact:true}).click();await page.locator('#mission-instructions').waitFor({state:'visible'});};
  const domainBefore=snapshot();
  await choose(W);await open();
  check('01C native browser reaches pinned mission text',await page.locator('#curriculum-title').textContent()==='Synthetic mission 1'&&(await page.locator('#mission-instructions').textContent()).includes('Synthetic instructions 1'));
  check('01C HTML-like instructions render as literal text',await page.locator('#mission-instructions img').count()===0&&await page.evaluate(()=>window.bad!==true)&& (await page.locator('#mission-instructions').textContent()).startsWith('<img'));
  check('01C no activity/completion/upload controls',await page.getByRole('button',{name:/complete|submit|upload|assessment|score/i}).count()===0);
  // 01C-A01: hold native context and fresh mission replies separately. No clicks
  // occur between the timer boundary and the newly authorized mission display.
  const curriculumRequests=[];page.on('request',r=>{if(r.url().includes('/api/portal/curriculum?'))curriculumRequests.push(r.url());});
  async function holdNext(pattern,completed=false){
    let release,arrived,finished;
    const gate=new Promise(r=>release=r),seen=new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>reject(Error('Expected native revalidation request: '+pattern)),15000);timeout.unref();
      arrived=()=>{clearTimeout(timeout);resolve();};
    }),done=new Promise(r=>finished=r);
    await page.route(pattern,async route=>{
      let upstream=completed?await route.fetch():null;arrived();await gate;
      upstream ||= await route.fetch();await route.fulfill({response:upstream}).catch(()=>{});finished(upstream.status());
    },{times:1});
    return {release,seen,done};
  }
  const contextHold=await holdNext('**/api/portal/context?workspace_id='+W,true);
  const missionHold=await holdNext('**/api/portal/curriculum?**',true);
  await page.clock.runFor(30000);await contextHold.seen;
  check('01C-A01 native periodic context clears private mission',await page.locator('#curriculum').isHidden()&&await page.locator('#mission-instructions').textContent()==='');
  await page.clock.runFor(60000);
  check('01C-A01 held context coalesces repeated periodic ticks',curriculumRequests.length===0);
  contextHold.release();check('01C-A01 fresh native context succeeds',await contextHold.done===200);await missionHold.seen;
  check('01C-A01 automatic fresh GET preserves exact selected workspace/version/mission',curriculumRequests.length===1&&curriculumRequests[0].endsWith('workspace_id='+W+'&locale=en-US&program_version_id='+f.version+'&mission_id='+f.mission));
  check('01C-A01 no cached instructional bytes during fresh mission hold',await page.locator('#curriculum').isHidden()&&await page.locator('#mission-instructions').textContent()==='');
  await page.clock.runFor(60000);check('01C-A01 held mission coalesces repeated ticks',curriculumRequests.length===1);
  const reconciliationHold=await holdNext('**/api/portal/context?workspace_id='+W,true);
  missionHold.release();check('01C-A01 fresh native mission succeeds',await missionHold.done===200);await reconciliationHold.seen;
  check('01C-A02 fresh mission remains private while final context reconciliation is held',await page.locator('#curriculum').isHidden()&&await page.locator('#curriculum-title').textContent()===''&&await page.locator('#mission-instructions').textContent()===''&&await page.locator('#mission-reflection').textContent()==='');
  await page.clock.runFor(60000);check('01C-A02 reconciliation coalesces repeated timer ticks',curriculumRequests.length===1);
  reconciliationHold.release();check('01C-A02 final native reconciliation succeeds',await reconciliationHold.done===200);await page.locator('#mission-instructions').waitFor({state:'visible'});
  check('01C-A01 reading resumes without any navigation click',(await page.locator('#mission-instructions').textContent()).includes('Synthetic instructions 1'));
  check('01C-A01 all 28 Portal tables unchanged across navigation and periodic resumption',tables.length===28&&snapshot()===domainBefore);
  await fs.writeFile(path.join(directory,'curriculum-a01-no-write.json'),JSON.stringify({tables:tables.length,before:domainBefore,after:snapshot()},null,2));
  await page.screenshot({path:path.join(directory,'curriculum-mission-desktop.png'),fullPage:true});
  check('01C desktop fits viewport',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.setViewportSize({width:390,height:844});
  await page.clock.runFor(100);
  await page.locator('#curriculum').screenshot({path:path.join(directory,'curriculum-mission-mobile.png')});
  check('01C mobile fits viewport',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.getByRole('button',{name:'Mission list',exact:true}).click();await page.getByRole('button',{name:'1. Synthetic mission 1',exact:true}).waitFor();
  check('01C three missions displayed in sequence',JSON.stringify(await page.locator('#curriculum-list button').allTextContents())===JSON.stringify(['1. Synthetic mission 1','2. Synthetic mission 2','3. Synthetic mission 3']));
  check('01C program guidance and description render safely',await page.locator('#program-guidance').textContent()==='Synthetic adult guidance'&&await page.locator('#curriculum-description b').count()===0&&await page.locator('#curriculum-description').textContent()==='<b>Literal description</b>');
  await page.screenshot({path:path.join(directory,'curriculum-program-mobile.png'),fullPage:true});
  await page.locator('#programs-back').click();await page.getByRole('button',{name:'Synthetic 01C 1',exact:true}).waitFor();
  check('01C duplicate billing bases produce one catalog entry',await page.getByRole('button',{name:'Synthetic 01C 1',exact:true}).count()===1);
  await page.screenshot({path:path.join(directory,'curriculum-catalog-mobile.png'),fullPage:true});
  // Hold an actual completed native response across workspace switching.
  let release, arrived;
  const gate=new Promise(r=>release=r), seen=new Promise(r=>arrived=r);
  await page.route('**/api/portal/curriculum?**',async route=>{const upstream=await route.fetch();arrived();await gate;await route.fulfill({response:upstream}).catch(()=>{});},{times:1});
  await page.locator('#programs-open').click();await seen;
  await choose(S);
  check('01C workspace switch clears curriculum while old reply is held',await page.locator('#curriculum').isHidden()&&await page.locator('#mission-instructions').textContent()==='');
  release();await page.clock.runFor(50);
  check('01C delayed old-workspace native reply cannot restore content',await page.locator('#curriculum').isHidden());
  const denied=await context.request.get(origin+'/api/portal/curriculum?workspace_id='+S+'&program_version_id='+f.version);
  check('01C native API denies family version in selected school',denied.status()===404);
  await page.locator('#programs-open').click();await page.getByRole('button',{name:'Synthetic 01C 2',exact:true}).waitFor();
  check('01C school catalog exposes its own version only',await page.getByRole('button',{name:'Synthetic 01C 1',exact:true}).count()===0);
  await choose(W);await open();
  await page.evaluate(()=>{const b=new BroadcastChannel('aiea-portal-session');b.postMessage('pending');b.close();});
  await page.locator('#curriculum').waitFor({state:'hidden'});
  check('01C coordination pending clears all instructional text',await page.locator('#mission-instructions').textContent()===''&&await page.locator('#mission-reflection').textContent()==='');
  const recovered=page.waitForResponse(r=>r.url().endsWith('/api/portal/context'));
  await page.clock.runFor(10001);await recovered;
  await choose(W);await open();
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  check('01C controlled blur clears mission',await page.locator('#curriculum').isHidden()&&await page.locator('#mission-instructions').textContent()==='');
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await choose(W);
  await page.route('**/api/portal/curriculum?**',route=>route.fulfill({status:409,contentType:'application/json',body:'{"error":"locale_unavailable"}'}),{times:1});
  await page.locator('#programs-open').click();await page.getByText('This program is unavailable in the requested language.',{exact:true}).waitFor();
  check('01C controlled unavailable display has truthful retry',await page.locator('#curriculum-retry').isVisible()&&await page.locator('#mission-instructions').textContent()==='');
  await page.locator('#curriculum-retry').click();await page.getByRole('button',{name:'Synthetic 01C 1',exact:true}).waitFor();
  await page.getByRole('button',{name:'Synthetic 01C 1',exact:true}).click();await page.getByRole('button',{name:'1. Synthetic mission 1',exact:true}).click();await page.locator('#mission-instructions').waitFor({state:'visible'});
  // Revocations happen only through this test operator against synthetic rows,
  // while the periodic context request is held BEFORE its native authorization.
  for(const [label,table,where,status] of [
    ['entitlement revoked','entitlement','workspace_id='+quote(W)+' and program_version_id='+quote(f.version),'REVOKED'],
    ['selected membership revoked','workspace_membership','workspace_id='+quote(W)+' and user_id='+quote(f.users['8'].id),'REVOKED'],
    ['selected workspace inactive','workspace','id='+quote(W),'INACTIVE'],
    ['adult profile inactive','user_profile','user_id='+quote(f.users['8'].id),'INACTIVE'],
  ]){
    const hold=await holdNext('**/api/portal/context?workspace_id='+W);
    const requestCount=curriculumRequests.length;
    await page.clock.runFor(30000);await hold.seen;
    sql('update portal.'+table+' set status='+quote(status)+' where '+where+';');
    try{
      hold.release();const statusCode=await hold.done;
      if(table==='user_profile')await page.waitForURL('**/portal/login.html?expired=1');
      else await page.waitForFunction(()=>document.querySelector('#status')?.textContent!=='Loading your workspaces…');
      check('01C-A01 native '+label+' does not resume',curriculumRequests.length===requestCount&&
        (await page.locator('#mission-instructions').count()===0||await page.locator('#mission-instructions').textContent()==='')&&statusCode===(table==='entitlement'?200:403));
    }finally{sql('update portal.'+table+" set status='ACTIVE' where "+where+';');}
    // Adult-profile denial intentionally clears the accepted access cookie.
    if(table==='user_profile'){
      const restored=await context.request.post(origin+'/api/portal/auth',{headers:{Origin:origin},data:await code()});
      check('01C-A01 profile restoration requires explicit synthetic sign-in',restored.status()===200);
    }
    await page.goto(origin+'/portal');await choose(W);await open();
  }
  // 01C-A02 independent timing: accept native context, then hold the new
  // curriculum request BEFORE the application and change native authority.
  const memberWhere='workspace_id='+quote(S)+' and user_id='+quote(f.users['8'].id);
  const entitlementWhere='workspace_id='+quote(S)+' and program_version_id='+quote(f.school_version);
  async function schoolView(view){
    const auth=await context.request.post(origin+'/api/portal/auth',{headers:{Origin:origin},data:await code()});
    if(auth.status()!==200)throw Error('Synthetic transition setup sign-in');
    await page.goto(origin+'/portal');await choose(S);await page.locator('#programs-open').click();
    await page.getByRole('button',{name:'Synthetic 01C 2',exact:true}).waitFor();
    if(view==='mission'){
      await page.getByRole('button',{name:'Synthetic 01C 2',exact:true}).click();
      await page.getByRole('button',{name:'1. Synthetic mission 1',exact:true}).click();await page.locator('#mission-instructions').waitFor({state:'visible'});
    }
  }
  for(const t of [
    {label:'exact entitlement SUSPENDED',table:'entitlement',field:'status',where:entitlementWhere,value:'SUSPENDED',restore:'ACTIVE',status:404},
    {label:'exact entitlement REVOKED',table:'entitlement',field:'status',where:entitlementWhere,value:'REVOKED',restore:'ACTIVE',status:404},
    {label:'membership INACTIVE',table:'workspace_membership',field:'status',where:memberWhere,value:'INACTIVE',restore:'ACTIVE',status:403},
    {label:'membership REVOKED',table:'workspace_membership',field:'status',where:memberWhere,value:'REVOKED',restore:'ACTIVE',status:403},
    {label:'workspace INACTIVE',table:'workspace',field:'status',where:'id='+quote(S),value:'INACTIVE',restore:'ACTIVE',status:403},
    {label:'adult profile INACTIVE',table:'user_profile',field:'status',where:'user_id='+quote(f.users['8'].id),value:'INACTIVE',restore:'ACTIVE',status:403},
    {label:'TEACHER to SCHOOL_ADMIN',table:'workspace_membership',field:'role',where:memberWhere,value:'SCHOOL_ADMIN',restore:'TEACHER',status:200},
    {label:'catalog ACTIVE set expands',table:'entitlement',field:'status',where:'workspace_id='+quote(S)+" and program_version_id='1c000000-0000-0000-0000-000000000107'",value:'ACTIVE',restore:'SUSPENDED',status:200,view:'catalog'},
  ]){
    await schoolView(t.view||'mission');
    const contextHold=await holdNext('**/api/portal/context?workspace_id='+S,true);
    const curriculumHold=await holdNext('**/api/portal/curriculum?**');
    await page.clock.runFor(30000);await contextHold.seen;
    const cleared=await page.locator('#curriculum').isHidden()&&await page.locator('#mission-instructions').textContent()==='';
    contextHold.release();const contextStatus=await contextHold.done;await curriculumHold.seen;
    sql('update portal.'+t.table+' set '+t.field+'='+quote(t.value)+' where '+t.where+';');
    try{
      const changed=sql('select '+t.field+' from portal.'+t.table+' where '+t.where+';')===t.value;
      curriculumHold.release();const curriculumStatus=await curriculumHold.done;
      await page.waitForFunction(()=>{const s=document.querySelector('#status');return s&&!s.textContent.startsWith('Loading');});
      check('01C-A02 between-request '+t.label+' prevents automatic display',changed&&cleared&&contextStatus===200&&curriculumStatus===t.status&&await page.locator('#curriculum-title').textContent()===''&&await page.locator('#mission-instructions').textContent()===''&&await page.locator('#mission-reflection').textContent()==='');
      if(t.field==='role'){
        check('01C-A02 changed valid role has refreshed context',await page.locator('#workspace-role').textContent()==='Your role: School administrator');
        await page.locator('#programs-open').click();await page.getByRole('button',{name:'Synthetic 01C 2',exact:true}).click();
        await page.getByRole('button',{name:'1. Synthetic mission 1',exact:true}).click();await page.locator('#mission-instructions').waitFor({state:'visible'});
        check('01C-A02 SCHOOL_ADMIN remains authorized for explicit fresh mission navigation',(await page.locator('#mission-instructions').textContent()).includes('Synthetic instructions 1'));
      }
      if(t.view==='catalog'){
        check('01C-A02 expanded entitlement summary is refreshed',(await page.locator('#entitlements li').filter({hasText:'Program version 1c000000-0000-0000-0000-000000000107'}).textContent()).startsWith('ACTIVE'));
        await page.locator('#programs-open').click();await page.getByRole('button',{name:'Synthetic 01C 7',exact:true}).waitFor();
        check('01C-A02 explicit fresh catalog may include newly ACTIVE version',await page.getByRole('button',{name:'Synthetic 01C 7',exact:true}).isVisible());
      }
    }finally{sql('update portal.'+t.table+' set '+t.field+'='+quote(t.restore)+' where '+t.where+';');}
  }
  await page.goto(origin+'/portal');await choose(W);await open();
  // Out-of-band signout supplies no coordination signal: the next fresh native
  // Auth/context request must itself reject the still-open reading route.
  const signedOutHold=await holdNext('**/api/portal/context?workspace_id='+W);
  const signedOutCount=curriculumRequests.length;
  await page.clock.runFor(30000);await signedOutHold.seen;
  const signedOut=await context.request.post(origin+'/api/portal/auth',{headers:{Origin:origin},data:{action:'signout'}});
  check('01C-A01 synthetic out-of-band native signout succeeds',signedOut.status()===200);
  signedOutHold.release();check('01C-A01 periodic native Auth rejects signed-out session',await signedOutHold.done===401);await page.waitForURL('**/portal/login.html?expired=1');
  check('01C-A01 signed-out route never resumes',curriculumRequests.length===signedOutCount&&await page.locator('#curriculum').count()===0);
  const again=await context.request.post(origin+'/api/portal/auth',{headers:{Origin:origin},data:await code()});
  check('01C-A01 synthetic adult can sign in again explicitly',again.status()===200);
  await page.goto(origin+'/portal');await choose(W);await open();
  check('01C-A01 learning/cohort/learner/evidence/assessment tables unchanged through adversarial browser checks',learningSnapshot()===learningBefore);
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.waitForURL('**/portal/login.html?signed_out=1');
  check('01C native signout removes curriculum page and access cookie',await page.locator('#curriculum').count()===0&&(await context.cookies()).length===0);
  check('01C no domain mutations or script errors',domainMutations.length===0&&errors.length===0);
  await fs.writeFile(path.join(directory,'curriculum-browser-results.json'),JSON.stringify(results,null,2));
  console.log('PASS '+results.length+' native-backed browser checks; unavailable response and focus/clock events controlled');
}finally{await browser.close();}
