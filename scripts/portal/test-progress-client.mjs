// Actual production client under deterministic DOM/clock and held replies.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const source=await fs.readFile(new URL('../../portal/portal.js',import.meta.url),'utf8');
const W='w1',V='v1',M='m1',L='l1',epoch=1800000000000,exp=epoch/1000+3600;
const context=(kind='FAMILY')=>({workspaces:[{id:W,kind,display_name:'Workspace',role:kind==='FAMILY'?'OWNER':'TEACHER'}],selected_workspace_id:W,entitlements:[{program_version_id:V,status:'ACTIVE'}],session_expires_at:exp});
const program={program_version_id:V,title:'Program',version_key:'1',resolved_locale:'en-US'};
const curriculum=view=>({workspace_id:W,view,session_expires_at:exp,program,programs:[program],missions:[{id:M,sequence:1,title:'Mission'}],mission:{id:M,title:'Mission',instructions:'Instructions',reflection:''}});
const progress=(subject=null,status='NOT_STARTED',kind='FAMILY',allowed=true)=>({workspace_id:W,program_version_id:V,kind,subject_id:subject,session_expires_at:exp,subjects:[{id:L,display_code:'<img> learner'}],missions:[{mission_id:M,sequence:1,status,completion_allowed:allowed}]});
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
async function fixture(kind='FAMILY'){
 const elements=new Map(),events=new Map(),devents=new Map(),requests=[],redirects=[];let channel,interval;
 const element=()=>({hidden:true,disabled:false,value:'',textContent:'',children:[],events:new Map(),append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},focus(){},addEventListener(n,f){this.events.set(n,f);},set innerHTML(_){throw Error('no HTML');}});
 const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
 const document={hidden:false,body:{dataset:{page:'workspace'}},getElementById:get,createElement:element,addEventListener:(n,f)=>devents.set(n,f)};
 const window={location:{replace:x=>redirects.push(x)},addEventListener:(n,f)=>events.set(n,f),setTimeout(){return 1;},clearTimeout(){},setInterval(f){interval=f;}};
 vm.runInNewContext(source,{window,document,URLSearchParams,AbortController,Date:class extends Date{static now(){return epoch;}},performance:{now:()=>0},BroadcastChannel:class{constructor(){channel=this;}postMessage(){}},fetch:(url,options)=>new Promise(resolve=>requests.push({url,options,resolve}))});
 const click=async id=>{const e=typeof id==='string'?get(id):id;e.events.get('click').call(e);await flush();};
 const reply=async(data,status=200,index=requests.length-1)=>{requests[index].resolve({status,ok:status===200,json:async()=>data});await flush();};
 const change=async(value)=>{get('subject-select').value=value;get('subject-select').events.get('change').call(get('subject-select'));await flush();};
 events.get('pageshow')();await flush();await reply(context(kind));
 await click('programs-open');await reply(curriculum('catalog'));await click(get('curriculum-list').children[0].children[0]);await reply(curriculum('program'));await click(get('curriculum-list').children[0].children[0]);await reply(curriculum('mission'));
 const open=async()=>{await click('progress-open');await reply(progress(null,'NOT_STARTED',kind));await change(L);await reply(progress(L,'NOT_STARTED',kind));};
 return {get,click,reply,change,open,requests,redirects,document,tick:async()=>{interval();await flush();},event:async(n,doc=false)=>{(doc?devents:events).get(n)?.();await flush();},signal:async()=>{channel.onmessage({data:'pending'});await flush();}};
}
test('01D browsing sends no progress request or write',async()=>{const f=await fixture();assert.ok(f.requests.every(r=>!r.url.includes('/progress')));});
test('01D explicit status selector uses literal minimal code',async()=>{const f=await fixture();await f.open();assert.equal(f.get('subject-select').children[1].textContent,'<img> learner');assert.equal(f.get('progress-start').hidden,false);assert.equal(f.get('progress-finish').hidden,true);});
test('01D Start sends fixed context once and fresh reads acknowledgement',async()=>{const f=await fixture();await f.open();await f.click('progress-start');const n=f.requests.length-1;await f.click('progress-start');assert.equal(f.requests.length-1,n);assert.equal(f.requests[n].options.method,'POST');assert.deepEqual(JSON.parse(f.requests[n].options.body),{workspace_id:W,program_version_id:V,mission_id:M,subject_id:L,action:'start'});assert.equal(f.get('progress-finish').hidden,true);await f.reply({workspace_id:W,program_version_id:V,subject_id:L,mission_id:M,status:'IN_PROGRESS'},200,n);assert.equal(f.requests.at(-1).options.method,undefined);await f.reply(progress(L,'IN_PROGRESS'));assert.equal(f.get('progress-finish').hidden,false);});
test('01D unsupported completion never presents completion action',async()=>{const f=await fixture();await f.open();await f.change(L);await f.reply(progress(L,'IN_PROGRESS','FAMILY',false));assert.equal(f.get('progress-finish').hidden,true);assert.match(f.get('progress-notice').textContent,/unavailable/);});
test('01D school delivery action and explanation distinct from learner completion',async()=>{const f=await fixture('SCHOOL');await f.open();await f.change(L);await f.reply(progress(L,'STARTED','SCHOOL',false));assert.equal(f.get('progress-finish').textContent,'Mark delivered');assert.match(f.get('progress-explanation').textContent,/does not record individual completion/);await f.click('progress-finish');assert.equal(JSON.parse(f.requests.at(-1).options.body).action,'deliver');});
test('01D uncertain write acknowledgement requires reload without automatic repeat',async()=>{const f=await fixture();await f.open();await f.click('progress-start');await f.reply({error:'temporarily_unavailable'},503);assert.equal(f.get('subject-select').children.length,0);assert.match(f.get('progress-notice').textContent,/not confirmed/);const n=f.requests.length;await f.click('progress-retry');assert.equal(f.requests.length,n+1);assert.equal(f.requests.at(-1).options.method,undefined);});
for(const event of ['blur','pagehide','visibilitychange','coordination','workspace'])test('01D '+event+' clears status and suppresses held write acknowledgement',async()=>{
 const f=await fixture();await f.open();await f.click('progress-start');const n=f.requests.length-1;
 if(event==='visibilitychange'){f.document.hidden=true;await f.event(event,true);}else if(event==='coordination')await f.signal();else if(event==='workspace'){f.get('workspace-select').value='other';f.get('workspace-select').events.get('change').call(f.get('workspace-select'));await flush();}else await f.event(event);
 assert.equal(f.get('progress-panel').hidden,true);assert.equal(f.get('progress-list').children.length,0);assert.equal(f.get('subject-select').children.length,0);assert.equal(f.requests[n].options.signal.aborted,true);
 await f.reply({workspace_id:W,program_version_id:V,subject_id:L,mission_id:M,status:'IN_PROGRESS'},200,n);assert.equal(f.get('progress-panel').hidden,true);
});
test('01D subject switch suppresses held previous subject response',async()=>{const f=await fixture();await f.open();await f.change(L);const n=f.requests.length-1;await f.change(null);await f.reply(progress(L,'COMPLETED'),200,n);assert.equal(f.get('progress-list').children.length,0);await f.reply(progress());assert.equal(f.get('subject-select').value,'');});
for(const [status,error]of [[401,'sign_in_required'],[401,'signout_required'],[403,'status_access_denied'],[404,'subject_unavailable'],[503,'temporarily_unavailable']])test('01D '+status+' status failure clears private subject state',async()=>{const f=await fixture();await f.open();await f.change(L);await f.reply({error},status);assert.equal(f.get('subject-select').children.length,0);assert.equal(f.get('progress-list').children.length,0);if(status===401)assert.ok(f.redirects.length);});
test('01D empty subjects explain provisioning dependency without creating it',async()=>{const f=await fixture();await f.click('progress-open');await f.reply({...progress(),subjects:[]});assert.match(f.get('progress-notice').textContent,/Contact AIEA/);assert.ok(f.requests.every(r=>r.options.method!=='POST'));});
test('01D mismatched response subject fails closed',async()=>{const f=await fixture();await f.open();await f.change(L);await f.reply(progress('other'));assert.equal(f.get('subject-select').children.length,0);});

test('01D periodic continuation refetches exact subject with no write and coalesces',async()=>{
 const f=await fixture();await f.open();const n=f.requests.length;await f.tick();assert.equal(f.get('subject-select').children.length,0);
 await f.reply(context());await f.reply(curriculum('mission'));await f.reply(context());
 assert.ok(f.requests.at(-1).url.includes('subject_id='+L));const held=f.requests.length;await f.tick();assert.equal(f.requests.length,held);
 await f.reply(progress(L,'IN_PROGRESS'));assert.equal(f.get('subject-select').value,L);assert.equal(f.get('progress-finish').hidden,false);
 assert.ok(f.requests.slice(n).every(r=>r.options.method!=='POST'));
});
test('01D revoked subject during periodic continuation cannot restore saved codes/status',async()=>{
 const f=await fixture();await f.open();await f.tick();await f.reply(context());await f.reply(curriculum('mission'));await f.reply(context());
 await f.reply({error:'subject_unavailable'},404);assert.equal(f.get('subject-select').children.length,0);assert.equal(f.get('progress-list').children.length,0);
 assert.equal(f.get('progress-finish').hidden,true);assert.ok(f.requests.every(r=>r.options.method!=='POST'));
});
test('01D same-version mission navigation retains only subject ID and refetches status',async()=>{
 const f=await fixture();await f.open();const n=f.requests.length;await f.click('missions-back');assert.equal(f.get('subject-select').children.length,0);
 await f.reply(curriculum('program'));assert.ok(f.requests.at(-1).url.includes('subject_id='+L));assert.equal(f.get('progress-list').children.length,0);
 await f.reply(progress(L,'IN_PROGRESS'));assert.equal(f.get('subject-select').value,L);assert.ok(f.requests.slice(n).every(r=>r.options.method!=='POST'));
});
