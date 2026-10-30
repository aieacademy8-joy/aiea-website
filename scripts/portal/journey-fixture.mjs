// Test-only in-memory provider. Never imported by the Portal or local adapter.
// OTP, JWT validation, RLS, Blob and RPC persistence here are synthetic.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
export const id = n => '40000000-0000-0000-0000-' + String(n).padStart(12,'0');
export const A=id(1), W=id(2), S=id(3), V=id(4), P=id(5), L=id(6), C=id(7), L2=id(8), M=id(20), R=id(40);
export function journeyFixture({count=8}={}) {
  if (!Number.isSafeInteger(count) || count < 0 || count > 100) throw Error('Invalid LOCAL TEST DATA sequence length');
  const rule={method:'ADULT_ATTESTATION'}, exp=Math.floor(Date.now()/1000)+3600;
  const state={active:true,adult:true,member:true,session:true,subject:true,locales:['en-US','es'],draftLocales:[],fallback:'en-US',requests:[],writes:[],records:new Map(),change:null};
  const token = Buffer.from('{}').toString('base64url') + '.' + Buffer.from(JSON.stringify({sub:A,iss:'http://127.0.0.1:54321/auth/v1',
    aud:'authenticated',role:'authenticated',is_anonymous:false,exp,session_id:id(90),aiea_write_generation:'1'})).toString('base64url') + '.synthetic-signature';
  const missions=Array.from({length:count},(_,i)=>({id:id(20+i),program_version_id:V,mission_key:'mission-'+(i+1),sequence:i+1,
    completion_rules:rule,evidence_expectations:{required:false}}));
  const bytes=Buffer.from('%PDF-1.4\nSynthetic test worksheet; not accepted curriculum.\n%%EOF');
  const assets=[
    {id:R,mission_id:M,asset_key:'Mission worksheet <img>',locale_code:'en-US',locale_neutral:false},
    {id:id(41),mission_id:M,asset_key:'Hoja de actividad',locale_code:'es',locale_neutral:false},
    {id:id(42),mission_id:null,asset_key:'Program materials',locale_code:null,locale_neutral:true}
  ].map(r=>({...r,program_version_id:V,blob_path:'private/pilot-v1/'+r.id+'.pdf',content_hash:crypto.createHash('sha256').update(bytes).digest('hex')}));
  const tables=()=>({
    user_profile:state.adult?[{user_id:A,status:'ACTIVE',adult_confirmed_at:'2026-10-08T00:00:00Z'}]:[],
    workspace_membership:state.member?[{workspace_id:W,workspace_kind:'FAMILY',user_id:A,role:'OWNER',status:'ACTIVE'},
      {workspace_id:S,workspace_kind:'SCHOOL',user_id:A,role:'TEACHER',status:'ACTIVE'}]:[],
    workspace:[{id:W,kind:'FAMILY',status:'ACTIVE',display_name:'Synthetic family'},{id:S,kind:'SCHOOL',status:'ACTIVE',display_name:'Synthetic school'}],
    entitlement:[W,S].map((workspace_id,i)=>({id:id(10+i),workspace_id,program_version_id:V,status:state.active?'ACTIVE':'REVOKED'})),
    program:[{id:P,program_key:'synthetic-pilot'}],
    program_version:[{id:V,program_id:P,version_key:'LOCAL TEST DATA — '+count+'-mission fixture',status:'PUBLISHED',fallback_locale:state.fallback,completion_rules:rule}],
    program_version_locale:[...state.locales,...state.draftLocales].map(locale_code=>({program_version_id:V,locale_code,title:'LOCAL TEST DATA — synthetic learning journey',description:'Synthetic test text. Not approved AIEA curriculum.',guidance:'Explore '+count+' test missions.',status:state.locales.includes(locale_code)?'PUBLISHED':'DRAFT'})),
    mission:missions,
    mission_locale:missions.flatMap(m=>state.locales.map(locale_code=>({mission_id:m.id,program_version_id:V,locale_code,title:'Mission '+m.sequence,
      instructions:(locale_code==='es'?'Instrucciones':'Lesson instructions')+' '+m.sequence+'\nSynthetic test content.',reflection:'Discuss what you noticed.',status:'PUBLISHED'}))),
    learner_ref:state.subject?[L,L2].map((id,i)=>({id,workspace_id:W,status:'ACTIVE',display_code:'LEARNER-0'+(i+1)})):[],
    cohort:state.subject?[{id:C,workspace_id:S,status:'ACTIVE',display_code:'COHORT-A'}]:[],
    mission_progress:[...state.records.values()].filter(r=>r.workspace_id===W),
    cohort_mission_delivery:[...state.records.values()].filter(r=>r.workspace_id===S),
    resource_asset:assets
  });
  const reply=(status,value)=>({status,text:async()=>JSON.stringify(value)});
  const fetch=async(url,options)=>{
    const u=new URL(url); assert.equal(u.origin,'http://127.0.0.1:54321','fixture rejects every external origin');
    state.requests.push({path:u.pathname,query:u.search,method:options.method});
    state.change?.(u.pathname);
    if(u.pathname==='/auth/v1/otp'){assert.equal(JSON.parse(options.body).create_user,false);return reply(200,{});}
    if(u.pathname==='/auth/v1/verify')return JSON.parse(options.body).token==='123456'?reply(200,{access_token:token,refresh_token:'never-retain'}):reply(401,{});
    if(u.pathname==='/auth/v1/logout'){state.session=false;return reply(204,null);}
    if(!state.session || options.headers.Authorization!=='Bearer '+token)return reply(401,{});
    if(u.pathname==='/auth/v1/user')return reply(200,{id:A,is_anonymous:false});
    assert.equal(options.headers['Accept-Profile'],'portal');
    if(u.pathname.startsWith('/rest/v1/rpc/')){
      assert.equal(options.method,'POST');assert.equal(options.headers['Content-Profile'],'portal');
      const body=JSON.parse(options.body),family=u.pathname.endsWith('/record_mission_progress');
      assert.ok(family||u.pathname.endsWith('/record_cohort_delivery'));
      const subject=body[family?'learner_ref_id':'cohort_id'],key=[body.workspace_id,subject,body.mission_id].join('/');
      if(!state.active||!state.adult||!state.member||!state.subject)return reply(400,{code:'42501'});
      assert.equal(body.workspace_id,family?W:S);assert.equal(body.program_version_id,V);
      assert.ok(missions.some(m=>m.id===body.mission_id));assert.ok(family?[L,L2].includes(subject):subject===C);
      const prior=state.records.get(key),target=body.action==='start'?(family?'IN_PROGRESS':'STARTED'):(family?'COMPLETED':'DELIVERED');
      if(body.action!=='start'&&!prior)return reply(400,{code:'22023'});
      if(!prior||!['COMPLETED','DELIVERED'].includes(prior.status))state.records.set(key,{workspace_id:body.workspace_id,program_version_id:V,
        mission_id:body.mission_id,[family?'learner_ref_id':'cohort_id']:subject,status:target});
      state.writes.push({family,body});
      return reply(200,{mission_id:body.mission_id,subject_id:subject,status:state.records.get(key).status});
    }
    assert.equal(options.method,'GET');
    const name=u.pathname.split('/').at(-1);let rows=tables()[name];assert.ok(rows,'unexpected table '+name);
    for(const [k,v] of u.searchParams){
      if(v.startsWith('eq.'))rows=rows.filter(r=>String(r[k])===v.slice(3));
      if(v.startsWith('in.('))rows=rows.filter(r=>v.slice(4,-1).split(',').includes(String(r[k])));
      if(k==='or'){const match=/^\(mission_id\.is\.null,mission_id\.eq\.([0-9a-f-]+)\)$/.exec(v);assert.ok(match);rows=rows.filter(r=>r.mission_id===null||r.mission_id===match[1]);}
    }
    return reply(200,rows);
  };
  const blob=async pathname=>({statusCode:200,blob:{pathname,size:bytes.length},stream:new ReadableStream({start(controller){controller.enqueue(bytes);controller.close();}})});
  return {state,token,exp,missions,bytes,assets,fetch,blob};
}
