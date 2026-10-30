// Read-only program overview through the real handler, with synthetic upstream.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),p=require('../../lib/portal/runtime'),handler=require('../../api/portal/progress');
const id=n=>'20000000-0000-0000-0000-'+String(n).padStart(12,'0');
const W=id(1),V=id(2),L=id(3),A=id(4),other=id(5),rule={method:'ADULT_ATTESTATION'};
test('program progress overview API',async t=>{
 const saved={...p},env={...process.env};let kind,missions,records,requests,authCalls,change,subjects,active;
 function reset(){
  kind='FAMILY';records=[];requests=[];authCalls=0;change=null;active=true;
  subjects=[{id:L,workspace_id:W,display_code:'L-01',status:'ACTIVE'}];
  // Non-contiguous published ordering, deliberately shuffled upstream.
  missions=[9,2,5].map(n=>({id:id(10+n),program_version_id:V,sequence:n,completion_rules:rule,evidence_expectations:{required:false}}));
  Object.assign(process.env,{PORTAL_SUPABASE_URL:'http://127.0.0.1:54321',PORTAL_ORIGIN:'http://localhost:4321',PORTAL_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic'});
  p.authenticate=async()=>{authCalls++;if(change)change(authCalls);return {token:'synthetic-adult',userId:A,exp:Math.floor(Date.now()/1000)+3600};};
  p.context=async(c,a,w)=>{if(w!==W)p.fail(403,'workspace_access_denied');return {workspaces:[{id:W,kind,role:kind==='FAMILY'?'OWNER':'TEACHER'}],entitlements:active?[{program_version_id:V,status:'ACTIVE'}]:[]};};
  p.rows=async(c,token,path)=>{
   assert.equal(token,'synthetic-adult');requests.push(path);
   if(path.startsWith('program_version?'))return [{id:V,status:'RETIRED',completion_rules:rule}];
   if(path.startsWith('learner_ref?')||path.startsWith('cohort?'))return subjects;
   if(path.startsWith('mission?'))return missions;
   if(path.startsWith('mission_progress?')||path.startsWith('cohort_mission_delivery?'))return records;
   throw Error('Unexpected query');
  };
  p.upstream=async()=>{throw Error('Overview must never write or use an RPC');};
 }
 function statuses(values){records=values.map(([sequence,status])=>({workspace_id:W,program_version_id:V,mission_id:id(10+sequence),[kind==='FAMILY'?'learner_ref_id':'cohort_id']:L,status}));}
 async function call(subject=L,workspace=W){
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(text){this.text=text;}};
  await handler({method:'GET',url:'/api/portal/progress?workspace_id='+workspace+'&program_version_id='+V+(subject?'&subject_id='+subject:''),headers:{}},res);
  return {...res,data:JSON.parse(res.text)};
 }
 async function check(name,fn){await t.test(name,async()=>{reset();await fn();});}
 try{
  await check('no subject selection has no summary and reads no status records',async()=>{const r=await call(null);assert.equal(r.statusCode,200);assert.equal(r.data.summary,null);assert.ok(requests.every(q=>!q.startsWith('mission_progress?')));});
  await check('absent FAMILY records yield not-started counts without inferred progress',async()=>{const r=await call();assert.deepEqual(r.data.summary,{total:3,counts:{NOT_STARTED:3,IN_PROGRESS:0,COMPLETED:0},next_mission_id:id(12)});assert.deepEqual(r.data.missions.map(m=>m.sequence),[2,5,9]);assert.equal(authCalls,2);});
  await check('in-progress mission precedes the earlier not-started mission for continue',async()=>{statuses([[2,'COMPLETED'],[9,'IN_PROGRESS']]);assert.deepEqual((await call()).data.summary,{total:3,counts:{NOT_STARTED:1,IN_PROGRESS:1,COMPLETED:1},next_mission_id:id(19)});});
  await check('earliest recorded in-progress mission wins without rewriting other records',async()=>{statuses([[2,'IN_PROGRESS'],[9,'IN_PROGRESS']]);assert.equal((await call()).data.summary.next_mission_id,id(12));assert.equal(records.length,2);});
  await check('all completed returns no next mission or new completion claim',async()=>{statuses([[2,'COMPLETED'],[5,'COMPLETED'],[9,'COMPLETED']]);const r=await call();assert.equal(r.data.summary.next_mission_id,null);assert.equal(r.data.summary.counts.COMPLETED,3);assert.ok(!r.text.includes('mastery'));});
  await check('HR01 stays closed for unknown requirements even with an in-progress suggestion',async()=>{missions.forEach(m=>{m.completion_rules={method:'ASSESSMENT'};});statuses([[9,'IN_PROGRESS']]);const r=await call();assert.equal(r.data.summary.next_mission_id,id(19));assert.ok(r.data.missions.every(m=>!m.completion_allowed));});
  await check('SCHOOL counts delivery and never reads learner progress',async()=>{kind='SCHOOL';statuses([[2,'DELIVERED'],[9,'STARTED']]);const r=await call();assert.deepEqual(r.data.summary,{total:3,counts:{NOT_STARTED:1,STARTED:1,DELIVERED:1},next_mission_id:id(19)});assert.ok(requests.every(q=>!q.includes('learner')&&!q.startsWith('mission_progress?')));assert.ok(r.data.missions.every(m=>!m.completion_allowed));});
  await check('all delivered suggests no additional action',async()=>{kind='SCHOOL';statuses([[2,'DELIVERED'],[5,'DELIVERED'],[9,'DELIVERED']]);assert.equal((await call()).data.summary.next_mission_id,null);});
  await check('empty mission set returns zero counts and no suggestion',async()=>{missions=[];assert.deepEqual((await call()).data.summary,{total:0,counts:{NOT_STARTED:0,IN_PROGRESS:0,COMPLETED:0},next_mission_id:null});});
  await check('unassigned teacher gets empty subject choices without fabricated totals',async()=>{kind='SCHOOL';subjects=[];const r=await call(null);assert.equal(r.statusCode,200);assert.deepEqual(r.data.subjects,[]);assert.equal(r.data.summary,null);assert.equal((await call()).statusCode,404);});
  await check('other workspace is denied before curriculum or progress rows',async()=>{assert.equal((await call(L,other)).statusCode,403);assert.equal(requests.length,0);});
  await check('subject revoked during assembly suppresses counts and codes',async()=>{change=n=>{if(n===2)subjects=[];};const r=await call();assert.equal(r.statusCode,404);assert.ok(!r.text.includes('L-01'));assert.ok(!r.text.includes('summary'));});
  await check('entitlement revoked during assembly suppresses summary',async()=>{change=n=>{if(n===2)active=false;};assert.equal((await call()).statusCode,404);});
  await check('native session denial at final boundary suppresses summary',async()=>{change=n=>{if(n===2)p.fail(401,'sign_in_required');};const r=await call();assert.equal(r.statusCode,401);assert.ok(!r.text.includes('summary'));assert.ok(r.headers['Set-Cookie']);});
  for(const [name,mutate] of [
   ['cross-workspace row',()=>{statuses([[2,'COMPLETED']]);records[0].workspace_id=other;}],
   ['cross-version row',()=>{statuses([[2,'COMPLETED']]);records[0].program_version_id=other;}],
   ['wrong subject row',()=>{statuses([[2,'COMPLETED']]);records[0].learner_ref_id=other;}],
   ['foreign mission row',()=>{statuses([[2,'COMPLETED']]);records[0].mission_id=other;}],
   ['duplicate status rows',()=>{statuses([[2,'COMPLETED'],[2,'COMPLETED']]);}],
   ['duplicate mission sequence',()=>{missions[0].sequence=missions[1].sequence;}],
   ['unknown saved status',()=>{statuses([[2,'MASTERED']]);}],
   ['school individual completion status',()=>{kind='SCHOOL';statuses([[2,'COMPLETED']]);}],
  ])await check(name+' fails closed without any summary',async()=>{mutate();const r=await call();assert.equal(r.statusCode,503);assert.ok(!r.text.includes('summary'));});
  await check('explicit selected-workspace/version/subject filtering and private response',async()=>{const r=await call();const q=requests.find(q=>q.startsWith('mission_progress?'));assert.ok(q.includes('workspace_id=eq.'+W)&&q.includes('program_version_id=eq.'+V)&&q.includes('learner_ref_id=eq.'+L));assert.match(r.headers['Cache-Control'],/private, no-store/);assert.equal(r.headers.Vary,'Cookie');});
 }finally{Object.assign(p,saved);process.env=env;}
});
