// Real handlers with a synthetic provider. Native validation is a separate test.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {journeyFixture,W,S,V,L,C,id} from './journey-fixture.mjs';
const require=createRequire(import.meta.url);
const curriculum=require('../../api/portal/curriculum'),progress=require('../../api/portal/progress');

test('dynamic, explicitly mission-based sequences under the accepted contract',async t=>{
 const originalFetch=global.fetch,env={...process.env};
 async function call(handler,f,query,body){
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(value){this.text=value;}};
  const req={method:body?'POST':'GET',url:'/api/portal/'+(handler===curriculum?'curriculum':'progress')+'?'+query,
   headers:{cookie:'aiea_portal_local='+f.token,origin:'http://localhost:4321','content-type':'application/json'},body};
  await handler(req,res);return {...res,data:JSON.parse(res.text)};
 }
 try{
  Object.assign(process.env,{PORTAL_SUPABASE_URL:'http://127.0.0.1:54321',PORTAL_ORIGIN:'http://localhost:4321',PORTAL_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic'});
  for(const count of [0,1,4,5,8,9,36,100])await t.test(count+' items: ordering, totals, boundaries, identities and separate progress',async()=>{
   const f=journeyFixture({count});global.fetch=f.fetch;
   // Gaps are valid in the accepted contract; ordinal and sequence differ.
   f.missions.forEach((m,i)=>{m.sequence=2+i*3;});
   f.missions.reverse();
   const query='workspace_id='+W+'&program_version_id='+V;
   const program=await call(curriculum,f,query);
   assert.equal(program.statusCode,200);
   assert.deepEqual(program.data.sequence,{unit:'MISSION',total:count,position:null});
   assert.equal(program.data.missions.length,count);
   assert.equal(program.data.program.title,'LOCAL TEST DATA — synthetic learning journey');
   assert.ok(!('lessons' in program.data));
   for(const index of new Set([0,Math.floor(count/2),count-1])){
    if(!count)break;
    const mission=program.data.missions[index];
    const result=await call(curriculum,f,query+'&mission_id='+mission.id);
    assert.equal(result.statusCode,200);
    assert.equal(result.data.mission.id,mission.id);
    assert.equal(result.data.mission.sequence,2+index*3);
    assert.deepEqual(result.data.sequence,{unit:'MISSION',total:count,position:index+1});
    assert.deepEqual(result.data.navigation,{previous_mission_id:program.data.missions[index-1]?.id||null,next_mission_id:program.data.missions[index+1]?.id||null});
   }
   for(const [workspace,subject,family] of [[W,L,true],[S,C,false]]){
    const q='workspace_id='+workspace+'&program_version_id='+V+'&subject_id='+subject;
    assert.equal((await call(progress,f,q)).data.summary.total,count);
    if(!count)continue;
    const body={workspace_id:workspace,program_version_id:V,subject_id:subject,mission_id:program.data.missions[0].id,action:'start'};
    assert.equal((await call(progress,f,'',body)).statusCode,200);
    assert.equal((await call(progress,f,'',{...body,action:family?'complete':'deliver'})).statusCode,200);
    const recorded=await call(progress,f,q);
    assert.equal(recorded.data.summary.total,count);
    assert.equal(recorded.data.summary.counts[family?'COMPLETED':'DELIVERED'],1);
    assert.equal(recorded.data.summary.next_mission_id,program.data.missions[1]?.id||null);
    const saved=recorded.data.missions.find(m=>m.mission_id===body.mission_id);
    assert.equal(saved.mission_id,body.mission_id);
    assert.equal(saved.status,family?'COMPLETED':'DELIVERED');
   }
  });
  await t.test('client-supplied pilot limits and lesson identities are rejected, not silently applied',async()=>{
   const f=journeyFixture({count:9});global.fetch=f.fetch;
   for(const extra of ['pilot_lesson_count=4','lesson_id='+id(20),'limit=5','stage=1','quarter=1']){
    assert.equal((await call(curriculum,f,'workspace_id='+W+'&program_version_id='+V+'&'+extra)).statusCode,400);
   }
   assert.equal(f.state.requests.length,0);
  });
  await t.test('direct unauthorized version and item requests expose no sequence or content',async()=>{
   const f=journeyFixture({count:5});global.fetch=f.fetch;
   for(const query of ['workspace_id='+W+'&program_version_id='+id(99),
    'workspace_id='+W+'&program_version_id='+V+'&mission_id='+id(99)]){
    const result=await call(curriculum,f,query);assert.equal(result.statusCode,404);assert.ok(!('sequence' in result.data));
   }
   f.state.active=false;
   assert.equal((await call(curriculum,f,'workspace_id='+W+'&program_version_id='+V+'&mission_id='+id(20))).statusCode,404);
  });
  await t.test('old eight-mission fixture remains test data with unchanged mission identities',()=>{
   const f=journeyFixture();assert.equal(f.missions.length,8);assert.equal(f.missions[0].id,id(20));
   assert.ok(f.missions.every(m=>m.mission_key.startsWith('mission-')&&!('lesson_id' in m)));
   for(const count of [-1,4.5,101])assert.throws(()=>journeyFixture({count}));
  });
 }finally{global.fetch=originalFetch;process.env=env;}
});
