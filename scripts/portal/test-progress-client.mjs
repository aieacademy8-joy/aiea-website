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
const progress=(subject=null,status='NOT_STARTED',kind='FAMILY',allowed=true)=>({workspace_id:W,program_version_id:V,kind,subject_id:subject,session_expires_at:exp,subjects:[{id:L,display_code:'<img> learner'}],missions:[{mission_id:M,sequence:1,status,completion_allowed:allowed}],
 summary:subject?{total:1,counts:kind==='FAMILY'?{NOT_STARTED:0,IN_PROGRESS:0,COMPLETED:0,[status]:1}:{NOT_STARTED:0,STARTED:0,DELIVERED:0,[status]:1},next_mission_id:['COMPLETED','DELIVERED'].includes(status)?null:M}:null});
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
const resourceId='40000000-0000-0000-0000-000000000040';
const resources=()=>({workspace_id:W,program_version_id:V,mission_id:M,requested_locale:'en-US',resolved_locale:'en-US',
 session_expires_at:exp,other_language_count:0,resources:[{id:resourceId,asset_key:'Worksheet <img>',locale_code:'en-US',locale_neutral:false}]});
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
test('mission resources use exact reading context and literal labels without progress writes',async()=>{
 const f=await fixture();await f.click('resources-open');assert.match(f.requests.at(-1).url,/workspace_id=w1&program_version_id=v1&mission_id=m1&locale=en-US/);
 await f.reply(resources());assert.equal(f.get('resources-list').children[0].children[0].textContent,'Download Worksheet <img>');
 assert.ok(f.requests.every(r=>r.options.method!=='POST'));assert.equal(f.get('resources-open').disabled,false);
});
test('unavailable resource translation is explained without fabricated content',async()=>{
 const f=await fixture();await f.click('resources-open');await f.reply({...resources(),resources:[],other_language_count:1});
 assert.equal(f.get('resources-list').children.length,0);assert.match(f.get('resources-notice').textContent,/other published languages/);
});
test('resource response from another mission or language cannot render files',async()=>{
 for(const data of [{...resources(),mission_id:'foreign'},{...resources(),resolved_locale:'es'},{...resources(),session_expires_at:exp-1}]){
  const f=await fixture();await f.click('resources-open');await f.reply(data);assert.equal(f.get('resources-list').children.length,0);assert.match(f.get('resources-notice').textContent,/couldn’t load/);
 }
});
test('missing download configuration has useful guidance and no automatic retry',async()=>{
 const f=await fixture();await f.click('resources-open');await f.reply(resources());await f.click(f.get('resources-list').children[0].children[0]);
 assert.match(f.requests.at(-1).url,/resource_id=/);const n=f.requests.length;await f.reply({error:'resources_not_configured'},503);
 assert.equal(f.requests.length,n);assert.match(f.get('resources-notice').textContent,/not available yet/);
 assert.equal(f.get('resources-list').children[0].children[0].disabled,false);assert.ok(f.requests.every(r=>r.options.method!=='POST'));
});
for(const event of ['blur','pagehide','visibilitychange','coordination','workspace'])test('resources '+event+' clears links and suppresses held metadata and download',async()=>{
 for(const downloading of [false,true]){
  const f=await fixture();await f.click('resources-open');
  if(downloading){await f.reply(resources());await f.click(f.get('resources-list').children[0].children[0]);}
  const held=f.requests.length-1;
  if(event==='visibilitychange'){f.document.hidden=true;await f.event(event,true);}else if(event==='coordination')await f.signal();
  else if(event==='workspace'){f.get('workspace-select').value='other';f.get('workspace-select').events.get('change').call(f.get('workspace-select'));await flush();}else await f.event(event);
  assert.equal(f.requests[held].options.signal.aborted,true);await f.reply(resources(),200,held);
  assert.equal(f.get('resources-list').children.length,0);assert.equal(f.get('resources-panel').hidden,true);assert.equal(f.get('resources-notice').textContent,'');
 }
});
for(const status of [401,403,404,503])test('resource '+status+' failure clears resource state',async()=>{
 const f=await fixture();await f.click('resources-open');await f.reply({error:'resource_unavailable'},status);
 assert.equal(f.get('resources-list').children.length,0);if(status===401)assert.ok(f.redirects.length);
 if(status===403||status===404){assert.equal(f.get('mission-instructions').textContent,'');assert.equal(f.get('resources-panel').hidden,true);}
});
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

const overviewMissions=[{id:M,sequence:2,title:'Explore <img>'},{id:'m2',sequence:5,title:'Create together'},{id:'m3',sequence:9,title:'Reflect'}];
function overviewData(kind='FAMILY',states=['COMPLETED','NOT_STARTED','IN_PROGRESS'],subject=L){
 const missions=overviewMissions.map((m,i)=>({mission_id:m.id,sequence:m.sequence,status:states[i],completion_allowed:kind==='FAMILY'}));
 const counts=kind==='FAMILY'?{NOT_STARTED:0,IN_PROGRESS:0,COMPLETED:0}:{NOT_STARTED:0,STARTED:0,DELIVERED:0};
 missions.forEach(m=>counts[m.status]++);
 const next=missions.find(m=>m.status===(kind==='FAMILY'?'IN_PROGRESS':'STARTED'))||missions.find(m=>m.status==='NOT_STARTED');
 return {...progress(subject,states[0],kind),missions,summary:subject?{total:missions.length,counts,next_mission_id:next?.mission_id||null}:null};
}
async function overview(kind='FAMILY',states){
 const f=await fixture(kind);await f.click('missions-back');await f.reply({...curriculum('program'),missions:overviewMissions});
 assert.equal(f.get('progress-open').textContent,'View program progress');
 await f.click('progress-open');await f.reply(overviewData(kind,states,null));await f.change(L);await f.reply(overviewData(kind,states));return f;
}
test('program overview shows recorded FAMILY counts, literal titles and no write actions',async()=>{
 const f=await overview();assert.equal(f.get('progress-title').textContent,'Program progress');
 assert.match(f.get('progress-summary-text').textContent,/1 of 3 missions recorded as completed\. 1 in progress · 1 not started/);
 assert.equal(f.get('progress-list').children[0].children[0].textContent,'2. Explore <img>');
 assert.equal(f.get('progress-start').hidden,true);assert.equal(f.get('progress-finish').hidden,true);
 assert.equal(f.get('progress-meter').value,1);assert.equal(f.get('progress-meter').max,3);
 assert.equal(f.get('progress-meter-label').textContent,'Recorded learner completion');assert.equal(f.get('progress-summary').className,'progress-summary');
 assert.ok(f.requests.every(r=>r.options.method!=='POST'));
});
test('Continue mission opens the in-progress mission and freshly authorizes the selected learner',async()=>{
 const f=await overview();await f.click('progress-continue');assert.match(f.requests.at(-1).url,/mission_id=m3$/);
 assert.equal(f.get('progress-summary-text').textContent,'');assert.equal(f.get('subject-select').children.length,0);
 await f.reply({...curriculum('mission'),mission:{...curriculum('mission').mission,id:'m3',title:'Reflect'}});
 assert.match(f.requests.at(-1).url,/subject_id=l1$/);assert.equal(f.get('progress-list').children.length,0);
 await f.reply(overviewData());assert.equal(f.get('subject-select').value,L);assert.equal(f.get('progress-finish').hidden,false);
 assert.ok(f.requests.every(r=>r.options.method!=='POST'));
});
test('overview mission rows open an exact mission without starting or completing it',async()=>{
 const f=await overview();await f.click(f.get('progress-list').children[1].children[0]);assert.match(f.requests.at(-1).url,/mission_id=m2$/);
 assert.ok(f.requests.every(r=>r.options.method!=='POST'));
});
test('first not-started mission can be opened when none is in progress',async()=>{
 const f=await overview('FAMILY',['COMPLETED','NOT_STARTED','NOT_STARTED']);assert.equal(f.get('progress-continue').textContent,'Open next mission');
 await f.click('progress-continue');assert.match(f.requests.at(-1).url,/mission_id=m2$/);
});
test('all completed hides continue and reports only recorded completion',async()=>{
 const f=await overview('FAMILY',['COMPLETED','COMPLETED','COMPLETED']);assert.equal(f.get('progress-continue').hidden,true);
 assert.match(f.get('progress-notice').textContent,/recorded completion/);assert.doesNotMatch(f.get('progress-notice').textContent,/mastery|certified/i);
 assert.equal(f.get('progress-meter').value,3);assert.equal(f.get('progress-meter').max,3);assert.equal(f.get('progress-summary').className,'progress-summary is-complete');
});
test('SCHOOL overview reports cohort delivery separately and continues a started mission',async()=>{
 const f=await overview('SCHOOL',['DELIVERED','NOT_STARTED','STARTED']);assert.match(f.get('progress-summary-text').textContent,/delivered to this cohort\. 1 started/);
 assert.doesNotMatch(f.get('progress-summary-text').textContent,/completed|mastery/i);
 assert.equal(f.get('progress-list').children[0].children[1].textContent,'Delivered to cohort');
 assert.equal(f.get('progress-meter').value,1);assert.equal(f.get('progress-meter-label').textContent,'Recorded cohort delivery');
 await f.click('progress-continue');assert.match(f.requests.at(-1).url,/mission_id=m3$/);
});
test('no selection and empty published missions never display a fabricated progress total',async()=>{
 const f=await fixture();await f.click('missions-back');await f.reply({...curriculum('program'),missions:[]});await f.click('progress-open');
 await f.reply({...progress(),missions:[]});assert.equal(f.get('progress-summary').hidden,true);assert.equal(f.get('progress-continue').hidden,true);
 await f.change(L);await f.reply({...progress(L),missions:[],summary:{total:0,counts:{NOT_STARTED:0,IN_PROGRESS:0,COMPLETED:0},next_mission_id:null}});
 assert.equal(f.get('progress-continue').hidden,true);assert.match(f.get('progress-notice').textContent,/No missions/);
 assert.equal(f.get('progress-meter').hidden,true);assert.equal(f.get('progress-summary').className,'progress-summary');
});
for(const event of ['blur','pagehide','visibilitychange','coordination','workspace'])test('overview '+event+' clears counts, titles, codes and held response',async()=>{
 const f=await overview();await f.change(L);const held=f.requests.length-1;
 if(event==='visibilitychange'){f.document.hidden=true;await f.event(event,true);}else if(event==='coordination')await f.signal();
 else if(event==='workspace'){f.get('workspace-select').value='other';f.get('workspace-select').events.get('change').call(f.get('workspace-select'));await flush();}else await f.event(event);
 await f.reply(overviewData(),200,held);assert.equal(f.get('progress-summary-text').textContent,'');assert.equal(f.get('progress-list').children.length,0);
 assert.equal(f.get('subject-select').children.length,0);assert.equal(f.get('progress-continue').hidden,true);
 assert.equal(f.get('progress-meter').value,0);assert.equal(f.get('progress-meter').hidden,true);assert.equal(f.get('progress-meter-label').textContent,'');
});
test('overview periodic revalidation refetches counts and coalesces while status is held',async()=>{
 const f=await overview();await f.tick();assert.equal(f.get('progress-summary-text').textContent,'');
 await f.reply(context());await f.reply({...curriculum('program'),missions:overviewMissions});await f.reply(context());
 const n=f.requests.length;await f.tick();assert.equal(f.requests.length,n);await f.reply(overviewData('FAMILY',['COMPLETED','COMPLETED','IN_PROGRESS']));
 assert.match(f.get('progress-summary-text').textContent,/2 of 3/);assert.ok(f.requests.every(r=>r.options.method!=='POST'));
});
for(const patch of [{summary:null},{summary:{total:100,counts:{},next_mission_id:null}},{summary:{total:3,counts:{COMPLETED:1,IN_PROGRESS:1,NOT_STARTED:1},next_mission_id:'foreign'}},{missions:[]}])test('malformed overview fails closed '+JSON.stringify(patch),async()=>{
 const f=await overview();await f.change(L);await f.reply({...overviewData(),...patch});assert.equal(f.get('progress-summary').hidden,true);
 assert.equal(f.get('progress-summary-text').textContent,'');assert.equal(f.get('progress-list').children.length,0);assert.equal(f.get('progress-retry').hidden,false);
});

const localizedCurriculum=(view='mission',mid=M,locale='en-US')=>({...curriculum(view),requested_locale:locale,
 program:{...program,available_locales:['en-US','es'],resolved_locale:locale},
 mission:{...curriculum('mission').mission,id:mid},navigation:{previous_mission_id:mid===M?null:M,next_mission_id:mid===M?'m2':null}});
const localStatus=(kind,mid=M)=>{
 const d=progress(L,kind==='FAMILY'?'IN_PROGRESS':'STARTED',kind);d.missions[0].mission_id=mid;d.summary.next_mission_id=mid;return d;
};
async function statusExperience(kind){
 const f=await fixture(kind);await f.open();await f.click('missions-back');await f.reply(localizedCurriculum('program'));await f.reply(localStatus(kind));
 await f.click(f.get('progress-list').children[0].children[0]);await f.reply(localizedCurriculum());await f.reply(localStatus(kind));return f;
}
for(const kind of ['FAMILY','SCHOOL'])test(kind+' next/previous and language selection retain subject ID through fresh authorized reads',async()=>{
 const f=await statusExperience(kind);await f.click('mission-next');assert.match(f.requests.at(-1).url,/program_version_id=v1&mission_id=m2$/);
 assert.equal(f.get('subject-select').children.length,0);await f.reply(localizedCurriculum('mission','m2'));assert.match(f.requests.at(-1).url,/subject_id=l1$/);
 await f.reply(localStatus(kind,'m2'));assert.equal(f.get('subject-select').value,L);assert.equal(f.get('progress-finish').textContent,kind==='FAMILY'?'Mark completed':'Mark delivered');
 const e=f.get('curriculum-language-select');e.value='es';e.events.get('change').call(e);await flush();
 assert.match(f.requests.at(-1).url,/locale=es&program_version_id=v1&mission_id=m2$/);assert.equal(f.get('subject-select').children.length,0);
 await f.reply(localizedCurriculum('mission','m2','es'));assert.match(f.requests.at(-1).url,/subject_id=l1$/);await f.reply(localStatus(kind,'m2'));
 assert.equal(f.get('subject-select').value,L);assert.equal(f.get('curriculum-language-select').value,'es');
 await f.click('mission-previous');assert.match(f.requests.at(-1).url,/locale=es&program_version_id=v1&mission_id=m1$/);
 await f.reply(localizedCurriculum('mission',M,'es'));await f.reply(localStatus(kind));assert.equal(f.get('subject-select').value,L);
 assert.ok(f.requests.every(r=>r.options.method!=='POST'));
});
for(const kind of ['FAMILY','SCHOOL'])test(kind+' revoked subject after next mission cannot restore private subject or action state',async()=>{
 const f=await statusExperience(kind);await f.click('mission-next');await f.reply(localizedCurriculum('mission','m2'));await f.reply({error:'subject_unavailable'},404);
 assert.equal(f.get('subject-select').children.length,0);assert.equal(f.get('progress-summary-text').textContent,'');assert.equal(f.get('progress-list').children.length,0);
 assert.equal(f.get('progress-start').hidden,true);assert.equal(f.get('progress-finish').hidden,true);assert.ok(f.requests.every(r=>r.options.method!=='POST'));
});
