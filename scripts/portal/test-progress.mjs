// Fixed API/RPC contracts with mocked upstream; native session proof is separate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url),p=require('../../lib/portal/runtime'),g=require('../../lib/portal/progress'),handler=require('../../api/portal/progress');
const id=n=>'10000000-0000-0000-0000-'+String(n).padStart(12,'0');
const W=id(1),V=id(2),M=id(3),L=id(4),A=id(5),rule={method:'ADULT_ATTESTATION'};
test('01D completion vocabulary fails closed',async t=>{
  const yes={completion_rules:rule},mission={completion_rules:rule,evidence_expectations:{required:false}};
  await t.test('explicit exact vocabulary accepted',()=>assert.equal(g.completion(yes,mission),true));
  for(const x of [undefined,null,{},[],{method:'UNKNOWN'},{method:'ADULT_ATTESTATION',assessment:true},{method:'ADULT_ATTESTATION',evidence:false}]) {
    await t.test('version rejects '+JSON.stringify(x),()=>assert.equal(g.completion({completion_rules:x},mission),false));
    await t.test('mission rejects '+JSON.stringify(x),()=>assert.equal(g.completion(yes,{...mission,completion_rules:x}),false));
  }
  for(const x of [undefined,null,{},[],{required:true},{required:false,artifact:false}]) await t.test('evidence rejects '+JSON.stringify(x),()=>assert.equal(g.completion(yes,{...mission,evidence_expectations:x}),false));
});
test('01D bounded handler contracts',async t=>{
  const saved={...p},env={...process.env};let kind,subjects,status,requests,authCalls,change;
  const query='workspace_id='+W+'&program_version_id='+V;
  function reset(){kind='FAMILY';subjects=[{id:L,workspace_id:W,status:'ACTIVE',display_code:'<img> Code'}];status='NOT_STARTED';requests=[];authCalls=0;change=null;
    Object.assign(process.env,{PORTAL_SUPABASE_URL:'http://127.0.0.1:54321',PORTAL_ORIGIN:'http://localhost:4321',PORTAL_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic'});
    p.authenticate=async()=>{authCalls++;if(change)change(authCalls);return {token:'synthetic',userId:A,exp:2000000000};};
    p.context=async()=>({workspaces:[{id:W,kind,role:kind==='FAMILY'?'OWNER':'TEACHER'}],entitlements:[{program_version_id:V,status:'ACTIVE'}]});
    p.rows=async(c,token,path)=>{requests.push(path);if(path.startsWith('program_version?'))return [{id:V,status:'PUBLISHED',completion_rules:rule}];
      if(path.startsWith('learner_ref?')||path.startsWith('cohort?'))return subjects;
      if(path.startsWith('mission?'))return [{id:M,program_version_id:V,sequence:1,completion_rules:rule,evidence_expectations:{required:false}}];
      return status==='NOT_STARTED'?[]:[{workspace_id:W,program_version_id:V,mission_id:M,[kind==='FAMILY'?'learner_ref_id':'cohort_id']:L,status}];};
    p.upstream=async(c,path,options)=>{requests.push({path,options});return {status:200,value:{subject_id:L,mission_id:M,status:kind==='FAMILY'?'IN_PROGRESS':'STARTED',private:'never-return'}};};
  }
  async function call(method='GET',q=query,body){const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(v){this.text=v;}};await handler({method,url:'/api/portal/progress'+(q?'?'+q:''),headers:{origin:'http://localhost:4321','content-type':'application/json'},body},res);return {...res,data:JSON.parse(res.text)};}
  const body=()=>({workspace_id:W,program_version_id:V,mission_id:M,subject_id:L,action:'start'});
  async function check(n,f){await t.test(n,async()=>{reset();await f();});}
  try{
    await check('read returns literal subject code and bounded fields',async()=>{const r=await call();assert.equal(r.statusCode,200);assert.deepEqual(r.data.subjects,[{id:L,display_code:'<img> Code'}]);assert.equal(r.data.missions[0].completion_allowed,true);assert.equal(authCalls,2);assert.ok(requests.every(x=>typeof x==='string'));});
    await check('selected subject status returned',async()=>{status='IN_PROGRESS';assert.equal((await call('GET',query+'&subject_id='+L)).data.missions[0].status,status);});
    await check('SCHOOL read is cohort-only',async()=>{kind='SCHOOL';const r=await call();assert.equal(r.data.missions[0].completion_allowed,false);assert.ok(!requests.some(x=>/learner/.test(x)));});
    await check('family fixed JWT-backed RPC body excludes actor',async()=>{const r=await call('POST','',body());assert.equal(r.statusCode,200);const x=requests.find(x=>x.options);assert.equal(x.path,'/rest/v1/rpc/record_mission_progress');assert.equal(x.options.token,'synthetic');assert.equal(x.options.body.learner_ref_id,L);assert.ok(!Object.hasOwn(x.options.body,'actor_user_id'));assert.ok(!r.text.includes('never-return'));});
    await check('school fixed RPC only',async()=>{kind='SCHOOL';assert.equal((await call('POST','',body())).statusCode,200);assert.equal(requests.find(x=>x.options).path,'/rest/v1/rpc/record_cohort_delivery');});
    for(const [kindValue,action] of [['FAMILY','deliver'],['SCHOOL','complete']])await check(kindValue+' rejects '+action,async()=>{kind=kindValue;assert.equal((await call('POST','',{...body(),action})).statusCode,400);assert.ok(!requests.some(x=>x.options));});
    for(const [q,code] of [['',400],[query+'&subject_id=bad',400],[query+'&workspace_id='+W,400],[query+'&actor_user_id='+A,400],[query+'&table=anything',400]])await check('malformed GET '+q,async()=>assert.equal((await call('GET',q)).statusCode,code));
    for(const patch of [{actor_user_id:A},{action:'reset'},{subject_id:'bad'},{action:'delete'}])await check('invalid POST '+JSON.stringify(patch),async()=>assert.equal((await call('POST','',{...body(),...patch})).statusCode,400));
    await check('cross-origin POST denied before Auth',async()=>{process.env.PORTAL_ORIGIN='http://127.0.0.1:4321';assert.equal((await call('POST','',body())).statusCode,403);assert.equal(authCalls,0);});
    await check('POST query denied',async()=>assert.equal((await call('POST',query,body())).statusCode,400));
    await check('wrong subject denied before RPC',async()=>{subjects=[];assert.equal((await call('POST','',body())).statusCode,404);assert.ok(!requests.some(x=>x.options));});
    await check('revoked subject at final read denies private response',async()=>{change=n=>{if(n===2)subjects=[];};assert.equal((await call()).statusCode,403);});
    await check('final native Auth failure denies success acknowledgement',async()=>{p.authenticate=async()=>{if(++authCalls===2)p.fail(401,'sign_in_required');return {token:'synthetic',userId:A,exp:2000000000};};assert.equal((await call('POST','',body())).statusCode,401);});
    for(const [sqlcode,http] of [['42501',403],['22023',409],['40001',503],['anything',503]])await check('sanitized RPC '+sqlcode,async()=>{p.upstream=async()=>({status:400,value:{code:sqlcode,message:'private secret'}});const r=await call('POST','',body());assert.equal(r.statusCode,http);assert.ok(!r.text.includes('secret'));});
    await check('GET overflow fails closed',async()=>{p.rows=async()=>{p.fail(503,'temporarily_unavailable');};assert.equal((await call()).statusCode,503);});
    await check('unsupported method denied',async()=>assert.equal((await call('DELETE')).statusCode,405));
    await check('private no-store and cookie variance',async()=>{const r=await call();assert.match(r.headers['Cache-Control'],/private, no-store/);assert.equal(r.headers.Vary,'Cookie');});
    await check('RPC POST profile headers use portal',async()=>{const fetch=global.fetch;try{global.fetch=async(url,o)=>{assert.equal(o.headers['Content-Profile'],'portal');assert.equal(o.headers['Accept-Profile'],'portal');return {status:200,text:async()=>'{}'};};await saved.upstream(saved.config(),'/rest/v1/rpc/record_mission_progress',{token:'synthetic',method:'POST',body:{},data:true});}finally{global.fetch=fetch;}});
  }finally{Object.assign(p,saved);process.env=env;}
});
