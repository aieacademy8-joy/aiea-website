// Actual client, deterministic DOM/clock and held mocked replies. Separate from browser/native proof.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const source=await fs.readFile(process.env.AIEA_PORTAL_CLIENT_SOURCE || new URL('../../portal/portal.js',import.meta.url),'utf8');
const epoch=1800000000000, W='10000000-0000-0000-0000-000000000002', S='10000000-0000-0000-0000-000000000001', V='v1', M='m1';
const program={program_id:'p1',program_key:'synthetic',program_version_id:V,version_key:'1.0',title:'<script>Program</script>',description:'<b>literal description</b>',guidance:'Adult guidance',resolved_locale:'en-US'};
const ctx=(w=W)=>({workspaces:[{id:w,kind:w===W?'FAMILY':'SCHOOL',display_name:w===W?'Family':'School',role:w===W?'OWNER':'TEACHER'}],selected_workspace_id:w,entitlements:[{program_version_id:V,status:'ACTIVE'}],session_expires_at:epoch/1000+3600});
const data=(view='catalog')=>({workspace_id:W,view,session_expires_at:epoch/1000+3600,program,
  programs:[program],missions:[{id:M,mission_key:'one',sequence:1,title:'One'}],mission:{id:M,mission_key:'one',sequence:1,title:'Mission <img>',instructions:'<img src=x onerror=alert(1)>\nSecond line',reflection:'<script>reflection</script>'}});
const flush=async()=>{for(let i=0;i<16;i++)await Promise.resolve();};
async function fixture() {
  const elements=new Map(),we=new Map(),de=new Map(),requests=[],redirects=[],timers=new Map();let next=0,now=0,channel;
  const element=()=>({hidden:true,textContent:'',children:[],value:'',events:new Map(),append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},focus(){},addEventListener(n,f){this.events.set(n,f);},set innerHTML(_){throw Error('HTML interpretation forbidden');}});
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
  const timer=(fn,delay,repeat=0)=>{const id=++next;timers.set(id,{fn,at:now+delay,repeat});return id;};
  const window={location:{replace:u=>redirects.push(u)},addEventListener:(n,f)=>we.set(n,f),setTimeout:(f,d)=>timer(f,d),clearTimeout:id=>timers.delete(id),setInterval:(f,d)=>timer(f,d,d)};
  const document={hidden:false,body:{dataset:{page:'workspace'}},getElementById:get,createElement:element,addEventListener:(n,f)=>de.set(n,f)};
  vm.runInNewContext(source,{window,document,URLSearchParams,AbortController,Date:class extends Date{static now(){return epoch+now;}},performance:{now:()=>now},BroadcastChannel:class{constructor(){channel=this;}postMessage(){}},fetch:(url,options)=>new Promise(resolve=>requests.push({url,options,resolve}))});
  const event=async(n,doc=false)=>{(doc?de:we).get(n)?.({type:n});await flush();};
  const click=async(id)=>{const e=typeof id==='string'?get(id):id;e.events.get('click').call(e);await flush();};
  const reply=async(n,d,status=200)=>{requests[n].resolve({status,ok:status===200,json:async()=>d});await flush();};
  const advance=async(ms)=>{const target=now+ms;for(;;){const t=[...timers].filter(([,x])=>x.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!t)break;const[id,x]=t;now=x.at;if(x.repeat)x.at+=x.repeat;else timers.delete(id);x.fn();await flush();}now=target;};
  const signal=async(value='pending')=>{channel.onmessage({data:value});await flush();};
  const cleared=()=>get('curriculum').hidden&&['curriculum-title','curriculum-description','program-guidance','mission-instructions','mission-reflection'].every(id=>get(id).textContent==='')&&get('curriculum-list').children.length===0;
  await event('pageshow');await reply(0,ctx());
  return {get,requests,redirects,document,event,click,reply,advance,signal,cleared};
}
async function missionView(f,w=W){await f.click('programs-open');await f.reply(f.requests.length-1,{...data(),workspace_id:w});await f.click(f.get('curriculum-list').children[0].children[0]);await f.reply(f.requests.length-1,{...data('program'),workspace_id:w});await f.click(f.get('curriculum-list').children[0].children[0]);await f.reply(f.requests.length-1,{...data('mission'),workspace_id:w});}
test('01C catalog → exact version → mission and contextual back navigation',async()=>{const f=await fixture();await missionView(f);assert.equal(f.get('mission-instructions').textContent,data().mission.instructions);assert.ok(f.requests.at(-1).url.includes('program_version_id=v1&mission_id=m1'));await f.click('missions-back');assert.ok(f.cleared());assert.ok(f.requests.at(-1).url.endsWith('program_version_id=v1'));await f.reply(f.requests.length-1,data('program'));await f.click('programs-back');await f.reply(f.requests.length-1,data());assert.equal(f.get('curriculum-title').textContent,'My Programs');});
test('01C all HTML-like text is rendered literally',async()=>{const f=await fixture();await missionView(f);assert.equal(f.get('curriculum-title').textContent,'Mission <img>');assert.equal(f.get('mission-reflection').textContent,'<script>reflection</script>');});
test('01C empty catalog and mission list are truthful',async()=>{const f=await fixture();await f.click('programs-open');await f.reply(1,{...data(),programs:[]});assert.match(f.get('curriculum-notice').textContent,/No programs/);await f.click('programs-open');await f.reply(2,data());await f.click(f.get('curriculum-list').children[0].children[0]);await f.reply(3,{...data('program'),missions:[]});assert.match(f.get('curriculum-notice').textContent,/No missions/);});
for(const [status,error,pattern] of [[409,'locale_unavailable',/language/],[404,'curriculum_unavailable',/no longer available/],[503,'temporarily_unavailable',/try again/i]]) test('01C '+status+' clears body and offers retry',async()=>{const f=await fixture();await missionView(f);await f.click('missions-back');await f.reply(f.requests.length-1,{error},status);assert.equal(f.get('mission-instructions').textContent,'');assert.match(f.get('curriculum-notice').textContent,pattern);assert.equal(f.get('curriculum-retry').hidden,false);await f.click('curriculum-retry');assert.ok(f.cleared());});
test('01C selected-workspace denial clears entire private context',async()=>{const f=await fixture();await missionView(f);await f.click('programs-open');await f.reply(f.requests.length-1,{error:'workspace_access_denied'},403);assert.ok(f.cleared());assert.equal(f.get('workspace-name').textContent,'');assert.equal(f.get('retry').hidden,false);});
for(const [error,url] of [['sign_in_required','?expired=1'],['signout_required','?signout_pending=1']]) test('01C '+error+' clears and redirects',async()=>{const f=await fixture();await missionView(f);await f.click('programs-open');await f.reply(f.requests.length-1,{error},401);assert.ok(f.cleared());assert.equal(f.redirects.at(-1),'/portal/login.html'+url);});
test('01C delayed old workspace response cannot restore content',async()=>{const f=await fixture();await f.click('programs-open');f.get('workspace-select').value=S;f.get('workspace-select').events.get('change').call(f.get('workspace-select'));await flush();assert.ok(f.requests[1].options.signal.aborted);await f.reply(1,data());assert.ok(f.cleared());await f.reply(2,ctx(S));assert.ok(f.cleared());});
test('01C superseded navigation response cannot restore old view',async()=>{const f=await fixture();await f.click('programs-open');await f.click('programs-open');await f.reply(1,data('mission'));assert.ok(f.cleared());await f.reply(2,data());assert.equal(f.get('curriculum-title').textContent,'My Programs');});
for(const [event,onDocument] of [['blur',false],['pagehide',false],['visibilitychange',true]]) test('01C '+event+' clears and suppresses held reply',async()=>{const f=await fixture();await missionView(f);await f.click('programs-open');const n=f.requests.length-1;if(onDocument)f.document.hidden=true;await f.event(event,onDocument);assert.ok(f.cleared());await f.reply(n,data());assert.ok(f.cleared());});
test('01C coordination change clears every curriculum field and cannot restore held reply',async()=>{const f=await fixture();await missionView(f);await f.click('programs-open');const n=f.requests.length-1;await f.signal();assert.ok(f.cleared());await f.reply(n,data());assert.ok(f.cleared());for(let i=0;i<12;i++){await f.advance(1000);await f.signal();}assert.equal(f.requests.at(-1).url,'/api/portal/context');assert.equal(f.requests.at(-1).options.signal.aborted,false);await f.reply(f.requests.length-1,ctx(S));assert.ok(f.cleared());});
test('01C signout clears curriculum even if a delayed request resolves',async()=>{const f=await fixture();await missionView(f);await f.click('programs-open');const n=f.requests.length-1;await f.click('signout');assert.ok(f.cleared());await f.reply(n,data());assert.ok(f.cleared());});

test('01C unexpected response workspace never renders',async()=>{const f=await fixture();await f.click('programs-open');await f.reply(1,{...data(),workspace_id:S});assert.equal(f.get('curriculum-list').children.length,0);assert.equal(f.get('curriculum-retry').hidden,false);});

test('dynamic sequence metadata displays ordinals without renaming mission identity and clears on revocation',async()=>{
 const f=await fixture();await missionView(f);
 await f.click('missions-back');await f.reply(f.requests.length-1,{...data('program'),sequence:{unit:'MISSION',total:1,position:null}});
 assert.equal(f.get('curriculum-sequence').textContent,'1 mission available');
 await f.click(f.get('curriculum-list').children[0].children[0]);
 await f.reply(f.requests.length-1,{...data('mission'),mission:{...data().mission,sequence:9},sequence:{unit:'MISSION',total:1,position:1},navigation:{previous_mission_id:null,next_mission_id:null}});
 assert.equal(f.get('curriculum-sequence').textContent,'Mission 9 · 1 of 1');
 assert.ok(f.requests.at(-1).url.includes('mission_id=m1'));
 await f.click('programs-open');assert.equal(f.get('curriculum-sequence').textContent,'');
 await f.reply(f.requests.length-1,{error:'workspace_access_denied'},403);
 assert.equal(f.get('curriculum-sequence').textContent,'');assert.ok(f.cleared());
});
for(const sequence of [{unit:'LESSON',total:1,position:1},{unit:'MISSION',total:5,position:6},
 {unit:'MISSION',total:101,position:1},{unit:'MISSION',total:4,position:2}])test('invalid or reinterpreted sequence metadata fails closed '+JSON.stringify(sequence),async()=>{
 const f=await fixture();await missionView(f);await f.click('curriculum-retry');
 await f.reply(f.requests.length-1,{...data('mission'),sequence,navigation:{previous_mission_id:null,next_mission_id:null}});
 assert.equal(f.get('mission-instructions').textContent,'');assert.equal(f.get('curriculum-sequence').textContent,'');assert.equal(f.get('curriculum-retry').hidden,false);
});

// 01C-A01: only routing/authority metadata may cross the cleared periodic boundary.
const changeWorkspace=async(f,w)=>{f.get('workspace-select').value=w;f.get('workspace-select').events.get('change').call(f.get('workspace-select'));await flush();};
async function periodic(f){await f.advance(30000);assert.ok(f.cleared());return f.requests.length-1;}
test('01C-A01 entitled mission automatically refetches fresh bytes after periodic authorization',async()=>{
  const f=await fixture();await f.advance(29999);await missionView(f);const n=f.requests.length;
  await f.advance(1);assert.ok(f.cleared());assert.ok(f.requests[n].url.startsWith('/api/portal/context'));
  await f.reply(n,ctx());
  assert.equal(f.requests.length,n+2,'fresh curriculum GET without a navigation click');
  assert.equal(f.requests[n+1].url,'/api/portal/curriculum?workspace_id='+W+'&locale=en-US&program_version_id='+V+'&mission_id='+M);
  assert.equal(f.requests[n+1].options.cache,'no-store');assert.ok(f.cleared(),'old bytes stay cleared until fresh reply');
  await f.reply(n+1,{...data('mission'),mission:{...data().mission,instructions:'Fresh authoritative instructions'}});
  assert.ok(f.cleared(),'fresh bytes remain undisplayed during final reconciliation');
  assert.equal(f.requests[n+2].url,'/api/portal/context?workspace_id='+W);await f.reply(n+2,ctx());
  assert.equal(f.get('mission-instructions').textContent,'Fresh authoritative instructions');
});
for(const view of ['catalog','program'])test('01C-A01 '+view+' automatically resumes its exact route',async()=>{
  const f=await fixture();await f.click('programs-open');await f.reply(1,data());
  if(view==='program'){await f.click(f.get('curriculum-list').children[0].children[0]);await f.reply(2,data('program'));}
  const n=await periodic(f);assert.equal(f.requests[n].url,'/api/portal/context?workspace_id='+W);await f.reply(n,ctx());
  assert.equal(f.requests[n+1].url,'/api/portal/curriculum?workspace_id='+W+'&locale=en-US'+(view==='program'?'&program_version_id='+V:''));
  assert.ok(f.cleared());await f.reply(n+1,data(view));assert.ok(f.cleared());await f.reply(n+2,ctx());assert.equal(f.get('curriculum').hidden,false);
});
for(const [name,context] of [
  ['entitlement revoked',{...ctx(),entitlements:[]}],
  ['entitlement suspended',{...ctx(),entitlements:[{program_version_id:V,status:'SUSPENDED'}]}],
  ['membership role changed',{...ctx(),workspaces:[{...ctx().workspaces[0],role:'TEACHER'}]}],
  ['workspace kind changed',{...ctx(),workspaces:[{...ctx().workspaces[0],kind:'SCHOOL'}]}],
  ['session authority changed',{...ctx(),session_expires_at:epoch/1000+7200}],
  ['different selected workspace',ctx(S)],
  ['selected membership absent',{...ctx(),workspaces:[],selected_workspace_id:null}],
])test('01C-A01 '+name+' does not resume',async()=>{
  const f=await fixture();await missionView(f);const n=await periodic(f);await f.reply(n,context);
  assert.equal(f.requests.length,n+1);assert.ok(f.cleared());
});
for(const name of ['selected membership revoked','selected workspace inactive','adult profile inactive'])test('01C-A01 '+name+' denial does not resume',async()=>{
  const f=await fixture();await missionView(f);const n=await periodic(f);await f.reply(n,{error:'workspace_access_denied'},403);
  assert.equal(f.requests[n+1].url,'/api/portal/context');await f.reply(n+1,{...ctx(),workspaces:[],selected_workspace_id:null,entitlements:[]});
  assert.equal(f.requests.length,n+2);assert.ok(f.cleared());
});
for(const error of ['sign_in_required','signout_required'])test('01C-A01 '+error+' during periodic validation does not resume',async()=>{
  const f=await fixture();await missionView(f);const n=await periodic(f);await f.reply(n,{error},401);
  assert.equal(f.requests.length,n+1);assert.ok(f.cleared());assert.ok(f.redirects.at(-1).includes(error==='signout_required'?'signout_pending=1':'expired=1'));
});
test('01C-A01 already expired fresh context cannot resume',async()=>{
  const f=await fixture();await missionView(f);const n=await periodic(f);await f.reply(n,{...ctx(),session_expires_at:epoch/1000+29});assert.ok(f.cleared());assert.equal(f.requests.length,n+1);assert.ok(f.redirects.at(-1).endsWith('expired=1'));
});
for(const stage of ['context','curriculum','reconciliation'])for(const event of ['workspace','pending','revalidate','signout','blur','expiry'])test('01C-A01 '+event+' during held periodic '+stage+' invalidates resume',async()=>{
  const f=await fixture();await missionView(f);let n=await periodic(f);
  if(stage!=='context'){await f.reply(n,ctx());n++;}
  if(stage==='reconciliation'){await f.reply(n,data('mission'));n++;}
  if(event==='workspace')await changeWorkspace(f,S);
  else if(event==='pending')await f.signal('pending');
  else if(event==='revalidate')await f.signal('revalidate');
  else if(event==='signout')await f.click('signout');
  else if(event==='blur')await f.event('blur');
  else await f.advance(3600000);
  const count=f.requests.length;await f.reply(n,stage==='curriculum'?data('mission'):ctx());
  assert.ok(f.cleared());assert.equal(f.requests.length,count,'held old reply cannot issue a resume');
  if(event==='workspace'){await f.reply(count-1,ctx(S));assert.ok(f.cleared());}
});
test('01C-A01 held obsolete curriculum JSON cannot restore content',async()=>{
  const f=await fixture();await missionView(f);await f.click('programs-open');const n=f.requests.length-1;let release;
  f.requests[n].resolve({status:200,ok:true,json:()=>new Promise(r=>release=r)});await flush();
  await changeWorkspace(f,S);release(data());await flush();assert.ok(f.cleared());
});
test('01C-A01 repeated periodic checks coalesce and do not accumulate resume state',async()=>{
  const f=await fixture();await missionView(f);const n=await periodic(f);
  await f.advance(90000);assert.equal(f.requests.length,n+1);assert.equal(f.requests[n].options.signal.aborted,false);
  await f.reply(n,ctx());await f.advance(90000);assert.equal(f.requests.length,n+2);assert.ok(f.cleared());
  await f.reply(n+1,data('mission'));assert.equal(f.requests.length,n+3);await f.advance(90000);assert.equal(f.requests.length,n+3);assert.ok(f.cleared());
  await f.reply(n+2,ctx());await f.advance(30000);assert.equal(f.requests.length,n+4);
  await f.reply(n+3,ctx());assert.equal(f.requests.length,n+5);await f.reply(n+4,data('mission'));await f.reply(n+5,ctx());
  await f.signal('pending');await f.advance(10001);const recovery=f.requests.length-1;
  for(let i=0;i<12;i++){await f.signal('pending');await f.advance(1000);}
  assert.equal(f.requests.length,recovery+1);assert.equal(f.requests[recovery].options.signal.aborted,false);
  await f.reply(recovery,ctx());assert.ok(f.cleared());await f.advance(30000);
  assert.ok(f.requests.at(-1).url.startsWith('/api/portal/context'));assert.ok(f.cleared());
});
for(const [status,error] of [[404,'curriculum_unavailable'],[403,'workspace_access_denied'],[401,'sign_in_required'],[503,'temporarily_unavailable']])test('01C-A01 fresh curriculum '+status+' never restores prior bytes',async()=>{
  const f=await fixture();await missionView(f);const n=await periodic(f);await f.reply(n,ctx());await f.reply(n+1,{error},status);
  assert.equal(f.get('mission-instructions').textContent,'');assert.equal(f.get('curriculum-title').textContent,'');
});

test('01C-A01 catalog authority-set change does not resume an obsolete catalog',async()=>{
  const f=await fixture();await f.click('programs-open');await f.reply(1,data());const n=await periodic(f);
  await f.reply(n,{...ctx(),entitlements:[...ctx().entitlements,{program_version_id:'new-version',status:'ACTIVE'}]});
  assert.equal(f.requests.length,n+1);assert.ok(f.cleared());
});
test('01C-A01 periodic context JSON held across workspace generation cannot issue resume',async()=>{
  const f=await fixture();await missionView(f);const n=await periodic(f);let release;
  f.requests[n].resolve({status:200,ok:true,json:()=>new Promise(r=>release=r)});await flush();
  await changeWorkspace(f,S);const count=f.requests.length;release(ctx());await flush();
  assert.equal(f.requests.length,count);assert.ok(f.cleared());await f.reply(count-1,ctx(S));assert.ok(f.cleared());
});
test('01C-A01 fresh context failure stays clear and does not retain an automatic resume',async()=>{
  const f=await fixture();await missionView(f);const n=await periodic(f);await f.reply(n,{},503);
  assert.ok(f.cleared());assert.equal(f.get('retry').hidden,false);await f.click('retry');await f.reply(n+1,ctx());
  assert.ok(f.cleared());assert.equal(f.requests.length,n+2);
});

// Context is accepted before the held fresh curriculum reaches the application.
// The changed context represents server state applicable to that successful read.
test('01C-A02 between-request SCHOOL role transition cancels stale automatic mission display',async()=>{
  const f=await fixture();await changeWorkspace(f,S);await f.reply(1,ctx(S));await missionView(f,S);
  const n=await periodic(f);await f.reply(n,ctx(S));
  const changed={...ctx(S),workspaces:[{...ctx(S).workspaces[0],role:'SCHOOL_ADMIN'}]};
  await f.reply(n+1,{...data('mission'),workspace_id:S});
  assert.ok(f.cleared(),'fresh curriculum must not display before authority reconciliation');
  assert.equal(f.requests[n+2].url,'/api/portal/context?workspace_id='+S);
  await f.reply(n+2,changed);assert.ok(f.cleared());await f.reply(n+3,changed);
  assert.equal(f.get('workspace-role').textContent,'Your role: School administrator');assert.ok(f.cleared());
  await missionView(f,S);assert.equal(f.get('mission-instructions').textContent,data().mission.instructions,'valid School administrator can explicitly navigate');
});
test('01C-A02 between-request catalog set expansion cancels stale automatic catalog display',async()=>{
  const f=await fixture();await f.click('programs-open');await f.reply(1,data());const n=await periodic(f);await f.reply(n,ctx());
  const added={...program,program_version_id:'v2',title:'Newly active program'};
  const changed={...ctx(),entitlements:[...ctx().entitlements,{program_version_id:'v2',status:'ACTIVE'}]};
  await f.reply(n+1,{...data(),programs:[program,added]});
  assert.ok(f.cleared(),'expanded fresh catalog must not display under the earlier context set');
  assert.equal(f.requests[n+2].url,'/api/portal/context?workspace_id='+W);
  await f.reply(n+2,changed);assert.ok(f.cleared());await f.reply(n+3,changed);assert.ok(f.cleared());
  assert.equal(f.get('entitlements').children.length,2);
  await f.click('programs-open');await f.reply(f.requests.length-1,{...data(),programs:[program,added]});
  assert.equal(f.get('curriculum-list').children.length,2,'explicit fresh navigation may show newly ACTIVE version');
});

for(const [name,fresh] of [
  ['exact entitlement SUSPENDED',{...ctx(),entitlements:[{program_version_id:V,status:'SUSPENDED'}]}],
  ['exact entitlement REVOKED',{...ctx(),entitlements:[{program_version_id:V,status:'REVOKED'}]}],
  ['membership role',{...ctx(),workspaces:[{...ctx().workspaces[0],role:'TEACHER'}]}],
  ['workspace kind',{...ctx(),workspaces:[{...ctx().workspaces[0],kind:'SCHOOL'}]}],
  ['selected workspace',ctx(S)],
  ['session expiry',{...ctx(),session_expires_at:epoch/1000+7200}],
])test('01C-A02 final reconciliation detects changed '+name,async()=>{
  const f=await fixture();await missionView(f);const n=await periodic(f);await f.reply(n,ctx());await f.reply(n+1,data('mission'));
  assert.ok(f.cleared());await f.reply(n+2,fresh);assert.ok(f.cleared());assert.equal(f.requests.length,n+4);
  await f.reply(n+3,fresh);assert.ok(f.cleared());
});
for(const [status,error] of [[401,'sign_in_required'],[401,'signout_required'],[403,'workspace_access_denied'],[503,'temporarily_unavailable']])test('01C-A02 final reconciliation '+error+' fails closed',async()=>{
  const f=await fixture();await missionView(f);const n=await periodic(f);await f.reply(n,ctx());await f.reply(n+1,data('mission'));await f.reply(n+2,{error},status);
  assert.equal(f.get('curriculum-title').textContent,'');assert.equal(f.get('mission-instructions').textContent,'');assert.equal(f.get('mission-reflection').textContent,'');
  if(status===401)assert.ok(f.redirects.at(-1).includes(error==='signout_required'?'signout_pending=1':'expired=1'));
});
test('01C-A02 final reconciliation rejects expired context',async()=>{
  const f=await fixture();await missionView(f);const n=await periodic(f);await f.reply(n,ctx());await f.reply(n+1,data('mission'));await f.reply(n+2,{...ctx(),session_expires_at:epoch/1000+29});
  assert.ok(f.cleared());assert.ok(f.redirects.at(-1).endsWith('expired=1'));
});
test('01C-A02 catalog response must match reconciled exact-version set even if the set reverted',async()=>{
  const f=await fixture();await f.click('programs-open');await f.reply(1,data());const n=await periodic(f);await f.reply(n,ctx());
  await f.reply(n+1,{...data(),programs:[program,{...program,program_version_id:'transient-version'}]});await f.reply(n+2,ctx());
  assert.ok(f.cleared());await f.reply(n+3,ctx());assert.ok(f.cleared());
});
for(const event of ['workspace','pending','pagehide','visibilitychange'])test('01C-A02 held reconciliation JSON across '+event+' cannot render',async()=>{
  const f=await fixture();await missionView(f);const n=await periodic(f);await f.reply(n,ctx());await f.reply(n+1,data('mission'));let release;
  f.requests[n+2].resolve({status:200,ok:true,json:()=>new Promise(r=>release=r)});await flush();
  if(event==='workspace')await changeWorkspace(f,S);
  else if(event==='pending')await f.signal();
  else{if(event==='visibilitychange')f.document.hidden=true;await f.event(event,event==='visibilitychange');}
  const count=f.requests.length;release(ctx());await flush();assert.ok(f.cleared());assert.equal(f.requests.length,count);
});
test('01C-A02 duplicate/reordered ACTIVE billing bases do not cancel unchanged continuation',async()=>{
  const f=await fixture();await missionView(f);const n=await periodic(f);await f.reply(n,ctx());await f.reply(n+1,data('mission'));
  await f.reply(n+2,{...ctx(),entitlements:[...ctx().entitlements,...ctx().entitlements]});assert.equal(f.get('mission-instructions').textContent,data().mission.instructions);
});

test('01C-A02 curriculum session expiry must agree with reconciled context',async()=>{
  const f=await fixture();await missionView(f);const n=await periodic(f);await f.reply(n,ctx());
  await f.reply(n+1,{...data('mission'),session_expires_at:epoch/1000+7200});await f.reply(n+2,ctx());
  assert.ok(f.cleared());await f.reply(n+3,ctx());assert.ok(f.cleared());
});
test('01C-A02 fresh title body and reflection stay cleared until reconciliation and replace old bytes',async()=>{
  const f=await fixture();await missionView(f);const n=await periodic(f);await f.reply(n,ctx());
  await f.reply(n+1,{...data('mission'),mission:{...data().mission,title:'New authoritative title',instructions:'New authoritative body',reflection:'New authoritative reflection'}});
  assert.ok(f.cleared());await f.reply(n+2,ctx());
  assert.equal(f.get('curriculum-title').textContent,'New authoritative title');assert.equal(f.get('mission-instructions').textContent,'New authoritative body');assert.equal(f.get('mission-reflection').textContent,'New authoritative reflection');
});

test('01C-A02 changed-context summary refresh also coalesces periodic ticks',async()=>{
  const f=await fixture();await missionView(f);const n=await periodic(f);await f.reply(n,ctx());await f.reply(n+1,data('mission'));
  const changed={...ctx(),workspaces:[{...ctx().workspaces[0],role:'TEACHER'}]};await f.reply(n+2,changed);
  assert.equal(f.requests.length,n+4);await f.advance(90000);
  assert.equal(f.requests.length,n+4,'one bounded summary refresh, no repeated timer reads');assert.equal(f.requests[n+3].options.signal.aborted,false);assert.ok(f.cleared());
  await f.reply(n+3,changed);assert.ok(f.cleared());await f.advance(30000);assert.ok(f.requests.at(-1).url.startsWith('/api/portal/context'));
});

// Mission navigation and published language choices use the same client lifecycle.
const lessonIds=[M,'m2','m3'];
function experience(view='mission',locale='en-US',mid=M){
  const i=lessonIds.indexOf(mid),localized={...program,available_locales:['en-US','es'],resolved_locale:locale};
  return {...data(view),requested_locale:locale,program:localized,programs:[localized],
    missions:lessonIds.map((id,i)=>({id,sequence:[2,5,9][i],title:'Published '+locale+' '+id})),
    mission:{...data().mission,id:mid,sequence:[2,5,9][i],title:'Published '+locale+' '+mid,instructions:'Published '+locale+' instructions <img>'},
    navigation:{previous_mission_id:lessonIds[i-1]||null,next_mission_id:lessonIds[i+1]||null}};
}
async function experienceView(f){
  await f.click('programs-open');await f.reply(f.requests.length-1,experience('catalog'));
  await f.click(f.get('curriculum-list').children[0].children[0]);await f.reply(f.requests.length-1,experience('program'));
  await f.click(f.get('curriculum-list').children[0].children[0]);await f.reply(f.requests.length-1,experience());
}
async function chooseLanguage(f,code){const e=f.get('curriculum-language-select');e.value=code;e.events.get('change').call(e);await flush();}
const experienceCleared=f=>f.get('mission-navigation').hidden&&f.get('mission-previous').disabled&&f.get('mission-next').disabled&&
  f.get('curriculum-language-controls').hidden&&f.get('curriculum-language-select').children.length===0&&f.get('curriculum-language-notice').textContent==='';
test('first, middle and last mission controls keep the exact program and never write',async()=>{
  const f=await fixture();await experienceView(f);assert.equal(f.get('mission-previous').disabled,true);assert.equal(f.get('mission-next').disabled,false);
  const before=f.requests.length;await f.click('mission-previous');assert.equal(f.requests.length,before);
  await f.click('mission-next');assert.ok(f.cleared());assert.ok(experienceCleared(f));assert.match(f.requests.at(-1).url,/program_version_id=v1&mission_id=m2$/);
  await f.reply(f.requests.length-1,experience('mission','en-US','m2'));assert.equal(f.get('mission-previous').disabled,false);assert.equal(f.get('mission-next').disabled,false);
  await f.click('mission-next');await f.reply(f.requests.length-1,experience('mission','en-US','m3'));assert.equal(f.get('mission-next').disabled,true);
  await f.click('mission-previous');await f.reply(f.requests.length-1,experience('mission','en-US','m2'));assert.match(f.get('curriculum-title').textContent,/m2$/);
  assert.ok(f.requests.every(r=>r.options.method!=='POST'));
});
test('only published language choices are offered and literal canonical text is displayed',async()=>{
  const f=await fixture();await experienceView(f);assert.deepEqual(f.get('curriculum-language-select').children.map(x=>x.value),['en-US','es']);
  await chooseLanguage(f,'es');assert.ok(f.cleared());assert.ok(experienceCleared(f));assert.match(f.requests.at(-1).url,/locale=es&program_version_id=v1&mission_id=m1$/);
  await f.reply(f.requests.length-1,experience('mission','es'));assert.equal(f.get('mission-instructions').textContent,'Published es instructions <img>');assert.equal(f.get('mission-instructions').lang,'es');
  assert.equal(f.get('curriculum-language-select').value,'es');assert.equal(f.get('curriculum-language-notice').textContent,'');
  const n=f.requests.length;await chooseLanguage(f,'fr-FR');assert.equal(f.requests.length,n,'unsupported choice cannot initiate client navigation');
});
test('selected language follows next, previous, mission list, catalog and reopened program',async()=>{
  const f=await fixture();await experienceView(f);await chooseLanguage(f,'es');await f.reply(f.requests.length-1,experience('mission','es'));
  for(const [button,view,mid] of [['mission-next','mission','m2'],['mission-previous','mission',M],['missions-back','program',M],['programs-back','catalog',M]]){
    await f.click(button);assert.match(f.requests.at(-1).url,/locale=es/);await f.reply(f.requests.length-1,experience(view,'es',mid));
  }
  await f.click(f.get('curriculum-list').children[0].children[0]);assert.match(f.requests.at(-1).url,/locale=es&program_version_id=v1$/);
});
test('single supported language disables the selector without inventing choices',async()=>{
  const f=await fixture();await f.click('programs-open');const d=experience('catalog');d.programs=[{...d.program,available_locales:['en-US']}];await f.reply(f.requests.length-1,d);
  assert.equal(f.get('curriculum-language-controls').hidden,false);assert.equal(f.get('curriculum-language-select').disabled,true);
  assert.deepEqual(f.get('curriculum-language-select').children.map(x=>x.value),['en-US']);
});
test('empty authorized catalog has no language controls',async()=>{
  const f=await fixture();await f.click('programs-open');await f.reply(f.requests.length-1,{...experience('catalog'),programs:[]});assert.equal(f.get('curriculum-language-controls').hidden,true);
});
test('explicit fallback is announced and requested language remains selected for navigation',async()=>{
  const f=await fixture();await experienceView(f);await chooseLanguage(f,'es');const d=experience('mission','es');d.program={...d.program,resolved_locale:'en-US',available_locales:['en-US']};
  await f.reply(f.requests.length-1,d);assert.match(f.get('curriculum-language-notice').textContent,/es.*unavailable.*published fallback.*en-US/);
  assert.equal(f.get('mission-instructions').lang,'en-US');assert.deepEqual(f.get('curriculum-language-select').children.map(x=>x.value),['','en-US']);
  await f.click('mission-next');assert.match(f.requests.at(-1).url,/locale=es&program_version_id=v1&mission_id=m2$/);
});
test('catalog without an applicable fallback exposes published choices for an explicit selection',async()=>{
  const f=await fixture();await f.click('programs-open');const d=experience('catalog');d.programs=[{...d.program,resolved_locale:null,title:null,available_locales:['es']}];
  await f.reply(f.requests.length-1,d);assert.match(f.get('curriculum-language-notice').textContent,/Choose a published/);assert.deepEqual(f.get('curriculum-language-select').children.map(x=>x.value),['','es']);
  await chooseLanguage(f,'es');assert.match(f.requests.at(-1).url,/locale=es$/);await f.reply(f.requests.length-1,experience('catalog','es'));assert.equal(f.get('curriculum-language-select').value,'es');
});
test('unavailable translation clears canonical text and offers published-language navigation',async()=>{
  const f=await fixture();await experienceView(f);await chooseLanguage(f,'es');await f.reply(f.requests.length-1,{error:'locale_unavailable'},409);
  assert.equal(f.get('mission-instructions').textContent,'');assert.ok(experienceCleared(f));assert.match(f.get('curriculum-notice').textContent,/published languages/);
  await f.click('programs-back');assert.match(f.requests.at(-1).url,/locale=es$/);
});
test('periodic revalidation preserves language and exact mission but refetches all private state',async()=>{
  const f=await fixture();await experienceView(f);await chooseLanguage(f,'es');await f.reply(f.requests.length-1,experience('mission','es'));
  const n=await periodic(f);assert.ok(experienceCleared(f));await f.reply(n,ctx());assert.match(f.requests[n+1].url,/locale=es&program_version_id=v1&mission_id=m1$/);
  await f.reply(n+1,experience('mission','es'));assert.ok(f.cleared());assert.ok(experienceCleared(f));await f.reply(n+2,ctx());assert.equal(f.get('curriculum-language-select').value,'es');assert.equal(f.get('mission-next').disabled,false);
});
for(const event of ['workspace','pending','signout','blur','pagehide','visibilitychange','expiry'])for(const action of ['neighbor','language'])test(action+' held response across '+event+' cannot restore private controls or content',async()=>{
  const f=await fixture();await experienceView(f);if(action==='neighbor')await f.click('mission-next');else await chooseLanguage(f,'es');const n=f.requests.length-1;
  if(event==='workspace')await changeWorkspace(f,S);else if(event==='pending')await f.signal();else if(event==='signout')await f.click('signout');
  else if(event==='expiry')await f.advance(3600000);else{if(event==='visibilitychange')f.document.hidden=true;await f.event(event,event==='visibilitychange');}
  await f.reply(n,experience('mission',action==='language'?'es':'en-US',action==='neighbor'?'m2':M));assert.ok(f.cleared());assert.ok(experienceCleared(f));
});
for(const [status,error] of [[403,'workspace_access_denied'],[404,'curriculum_unavailable'],[401,'sign_in_required'],[401,'signout_required']])test('navigation '+error+' clears mission and supported-language state',async()=>{
  const f=await fixture();await experienceView(f);await f.click('mission-next');await f.reply(f.requests.length-1,{error},status);
  assert.equal(f.get('mission-instructions').textContent,'');assert.ok(experienceCleared(f));if(status===401)assert.ok(f.redirects.length);
});
for(const patch of [{navigation:{previous_mission_id:null,next_mission_id:M}},{navigation:{previous_mission_id:'m2',next_mission_id:'m2'}},{requested_locale:'fr-FR'},{program:{...program,program_version_id:'foreign',available_locales:['es']}}])test('mismatched navigation/language payload fails closed '+JSON.stringify(patch),async()=>{
  const f=await fixture();await experienceView(f);await f.click('curriculum-retry');await f.reply(f.requests.length-1,{...experience(),...patch});assert.equal(f.get('mission-instructions').textContent,'');assert.ok(experienceCleared(f));
});
