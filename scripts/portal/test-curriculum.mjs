// Handler contracts with mocked upstream. Native Auth/PostgREST proof is separate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), handler = require('../../api/portal/curriculum.js');
const id = n => '10000000-0000-0000-0000-' + String(n).padStart(12,'0');
const A=id(1), W=id(2), B=id(3), P=id(4), V=id(5), V2=id(6), M=id(7);
test('Sprint 01C bounded curriculum handler contracts (mocked)', async t => {
  const saved = global.fetch, env = { ...process.env }; let db, requests, token, authCalls, change;
  function reset() {
    Object.assign(process.env, { PORTAL_SUPABASE_URL:'http://127.0.0.1:54321', PORTAL_ORIGIN:'http://localhost:4321', PORTAL_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic' });
    token = Buffer.from('{}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:A,iss:process.env.PORTAL_SUPABASE_URL+'/auth/v1',aud:'authenticated',role:'authenticated',is_anonymous:false,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.signature';
    db = {
      user_profile:[{user_id:A,status:'ACTIVE',adult_confirmed_at:'2026-10-07T00:00:00Z'}],
      workspace_membership:[{workspace_id:W,workspace_kind:'FAMILY',user_id:A,status:'ACTIVE',role:'OWNER'},{workspace_id:B,workspace_kind:'SCHOOL',user_id:A,status:'ACTIVE',role:'TEACHER'}],
      workspace:[{id:W,kind:'FAMILY',status:'ACTIVE',display_name:'Family'},{id:B,kind:'SCHOOL',status:'ACTIVE',display_name:'School'}],
      entitlement:[{id:id(8),workspace_id:W,program_version_id:V,status:'ACTIVE'},{id:id(9),workspace_id:B,program_version_id:V2,status:'ACTIVE'}],
      program:[{id:P,program_key:'synthetic',publisher_identity:'never-return'}],
      program_version:[{id:V,program_id:P,version_key:'v1',status:'PUBLISHED',fallback_locale:'en-US'},{id:V2,program_id:P,version_key:'v2',status:'PUBLISHED',fallback_locale:null}],
      program_version_locale:[V,V2].flatMap(v => [{program_version_id:v,locale_code:'en-US',status:'PUBLISHED',title:'Synthetic program',description:'Description',guidance:'Guidance',content_blocks:['never-return']},{program_version_id:v,locale_code:'es',status:'PUBLISHED',title:'Programa',description:'Descripción',guidance:'Guía'}]),
      mission:[{id:M,program_version_id:V,mission_key:'m1',sequence:1}],
      mission_locale:['en-US','es'].map(locale_code=>({mission_id:M,program_version_id:V,locale_code,status:'PUBLISHED',title:'Mission',instructions:'<img src=x onerror=alert(1)>\nLiteral text',reflection:'Reflect',content_blocks:['never-return']}))
    };
    requests=[]; authCalls=0; change=null;
    global.fetch = async (url,options) => {
      requests.push({url,options}); const u=new URL(url), table=u.pathname.split('/').at(-1);
      if (table==='user') { authCalls++; if (change) change(table); return {status:200,text:async()=>JSON.stringify({id:A,is_anonymous:false})}; }
      if (change) change(table);
      let rows=db[table]; if (!rows) throw Error('unexpected upstream');
      for(const [k,v] of u.searchParams) {
        if(v.startsWith('eq.')) rows=rows.filter(x=>String(x[k])===v.slice(3));
        if(v.startsWith('in.(')) rows=rows.filter(x=>v.slice(4,-1).split(',').includes(String(x[k])));
      }
      return {status:200,text:async()=>JSON.stringify(rows)};
    };
  }
  async function call(query='workspace_id='+W, opts={}) {
    const req={method:opts.method||'GET',url:'/api/portal/curriculum?'+query,headers:{cookie:opts.cookie===undefined?'aiea_portal_local='+token:opts.cookie}};
    const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(s){this.text=s;}};
    await handler(req,res); return {...res,data:JSON.parse(res.text)};
  }
  async function check(name, fn) { await t.test(name,async()=>{reset();await fn();}); }
  const version='workspace_id='+W+'&program_version_id='+V, mission=version+'&mission_id='+M;
  try {
    await check('catalog intersects selected workspace rather than union RLS',async()=>{const r=await call();assert.equal(r.statusCode,200);assert.deepEqual(r.data.programs.map(x=>x.program_version_id),[V]);assert.equal(authCalls,2);});
    await check('other workspace entitlement cannot authorize selected workspace version',async()=>{const r=await call('workspace_id='+W+'&program_version_id='+V2);assert.equal(r.statusCode,404);assert.ok(!requests.some(x=>x.url.includes('/program?')));});
    await check('teacher with no cohort assignment reads entitled school curriculum',async()=>{const r=await call('workspace_id='+B+'&program_version_id='+V2);assert.equal(r.statusCode,200);assert.deepEqual(r.data.missions,[]);assert.ok(!requests.some(x=>/cohort|learner/.test(x.url)));});
    for(const role of ['OWNER','SCHOOL_ADMIN','TEACHER']) await check('SCHOOL role '+role,async()=>{db.workspace_membership[1].role=role;assert.equal((await call('workspace_id='+B)).statusCode,200);});
    await check('multiple versions and duplicate billing bases dedupe exact versions',async()=>{db.entitlement.push({id:id(10),workspace_id:W,program_version_id:V,status:'ACTIVE'},{id:id(11),workspace_id:W,program_version_id:V2,status:'ACTIVE'});assert.equal((await call()).data.programs.length,2);});
    await check('program missions ordered numerically with non-eight count',async()=>{db.mission.push({id:id(12),program_version_id:V,mission_key:'m3',sequence:3},{id:id(13),program_version_id:V,mission_key:'m2',sequence:2});for(const m of db.mission.slice(1)) db.mission_locale.push({...db.mission_locale[0],mission_id:m.id,title:m.mission_key});assert.deepEqual((await call(version)).data.missions.map(m=>m.sequence),[1,2,3]);});
    await check('mission response is literal text with strict fields',async()=>{const r=await call(mission);assert.equal(r.statusCode,200);assert.equal(r.data.mission.instructions,db.mission_locale[0].instructions);assert.deepEqual(Object.keys(r.data.mission).sort(),['id','instructions','mission_key','reflection','sequence','title']);assert.ok(!/content_blocks|never-return|publisher|billing|blob_path/.test(r.text));});
    await check('catalog response allowlist omits program body and internals',async()=>{const r=await call();assert.deepEqual(Object.keys(r.data.programs[0]).sort(),['program_id','program_key','program_version_id','resolved_locale','title','version_key']);});
    await check('requested published locale wins',async()=>{assert.equal((await call(version+'&locale=es')).data.program.resolved_locale,'es');});
    await check('explicit approved fallback resolves',async()=>{assert.equal((await call(version+'&locale=fr-FR')).data.program.resolved_locale,'en-US');});
    await check('default locale is never implicit fallback',async()=>{db.program_version[0].fallback_locale=null;db.program_version[0].default_locale='en-US';assert.equal((await call(version+'&locale=fr-FR')).statusCode,409);const r=await call('workspace_id='+W+'&locale=fr-FR');assert.equal(r.data.programs[0].title,null);assert.equal(r.data.programs[0].resolved_locale,null);});
    await check('draft program locale cannot be served',async()=>{db.program_version_locale[0].status='DRAFT';assert.equal((await call(version)).statusCode,409);});
    await check('missing/draft mission locale fails closed',async()=>{db.mission_locale[0].status='DRAFT';assert.equal((await call(mission)).statusCode,503);});
    for(const status of ['PUBLISHED','RETIRED']) await check('entitled '+status+' version is accessible',async()=>{db.program_version[0].status=status;assert.equal((await call(version)).statusCode,200);});
    for(const status of ['DRAFT','REVIEW_READY']) await check(status+' structural version is not served',async()=>{db.program_version[0].status=status;assert.equal((await call(version)).statusCode,503);});
    for(const status of ['SUSPENDED','REVOKED']) await check(status+' entitlement denies version and empties catalog',async()=>{db.entitlement[0].status=status;assert.equal((await call(version)).statusCode,404);assert.deepEqual((await call()).data.programs,[]);});
    await check('mission in another exact version denied',async()=>{assert.equal((await call(version+'&mission_id='+id(50))).statusCode,404);});
    await check('workspace without membership denied before curriculum read',async()=>{assert.equal((await call('workspace_id='+id(50))).statusCode,403);assert.ok(!requests.some(x=>x.url.includes('/program')));});
    for(const table of ['workspace','workspace_membership','user_profile']) await check('inactive '+table+' denies request',async()=>{db[table][0].status='INACTIVE';assert.equal((await call(version)).statusCode,403);});
    await check('anonymous session denied',async()=>{assert.equal((await call(version,{cookie:''})).statusCode,401);});
    await check('pending signout credential denied',async()=>{assert.equal((await call(version,{cookie:'aiea_portal_local='+token+'; aiea_portal_logout_local='+token})).statusCode,401);assert.equal(requests.length,0);});
    await check('expired session denied before upstream',async()=>{const claims=JSON.parse(Buffer.from(token.split('.')[1],'base64url'));claims.exp=1;token=token.split('.')[0]+'.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.signature';assert.equal((await call(version)).statusCode,401);assert.equal(requests.length,0);});
    await check('entitlement revocation during assembly denies final response',async()=>{change=table=>{if(table==='mission_locale') db.entitlement[0].status='REVOKED';};assert.equal((await call(mission)).statusCode,404);});
    await check('membership revocation during assembly denies final response',async()=>{change=table=>{if(table==='mission_locale') db.workspace_membership[0].status='REVOKED';};assert.equal((await call(mission)).statusCode,403);});
    await check('Auth failure during final validation denies private response',async()=>{const f=global.fetch;global.fetch=async(u,o)=>{if(u.endsWith('/user')&&authCalls===1)return {status:401,text:async()=>'{}'};return f(u,o);};assert.equal((await call(mission)).statusCode,401);});
    for(const q of ['', 'workspace_id=x', 'workspace_id='+W+'&mission_id='+M,version+'&mission_id=x','workspace_id='+W+'&workspace_id='+B,'workspace_id='+W+'&locale=en-US&locale=es','workspace_id='+W+'&locale=', 'workspace_id='+W+'&locale='+('x'.repeat(600)), 'workspace_id='+W+'&url=https://evil.invalid','workspace_id='+W+'&locale=en-US%29,foo']) await check('malformed/duplicate/unsupported query '+q.slice(0,75),async()=>{assert.equal((await call(q)).statusCode,400);assert.equal(requests.length,0);});
    await check('POST is forbidden without any upstream mutation',async()=>{assert.equal((await call(version,{method:'POST'})).statusCode,405);assert.equal(requests.length,0);});
    await check('101 upstream rows fail closed',async()=>{db.mission=Array(101).fill(db.mission[0]);assert.equal((await call(version)).statusCode,503);});
    await check('oversized upstream field fails closed',async()=>{db.mission_locale[0].instructions='x'.repeat(64001);assert.equal((await call(mission)).statusCode,503);});
    await check('oversized upstream payload fails closed',async()=>{db.mission_locale[0].instructions='x'.repeat(524289);assert.equal((await call(mission)).statusCode,503);});
    await check('unexpected mission parent from upstream fails closed',async()=>{const f=global.fetch;global.fetch=async(u,o)=>u.includes('/mission?')?{status:200,text:async()=>JSON.stringify([{...db.mission[0],program_version_id:V2}])}:f(u,o);assert.equal((await call(mission)).statusCode,503);});
    await check('upstream outage sanitized',async()=>{global.fetch=async()=>{throw Error('private-upstream-secret');};const r=await call(version);assert.equal(r.statusCode,503);assert.ok(!r.text.includes('private'));});
    await check('all browsing upstream calls are JWT-backed GETs under portal RLS',async()=>{await call(mission);assert.ok(requests.every(x=>x.options.method==='GET'&&x.options.headers.Authorization==='Bearer '+token));assert.ok(requests.filter(x=>x.url.includes('/rest/')).every(x=>x.options.headers['Accept-Profile']==='portal'));});
    await check('private cache/session headers and expiry retained',async()=>{const r=await call(mission);assert.match(r.headers['Cache-Control'],/private, no-store/);assert.equal(r.headers.Vary,'Cookie');assert.ok(r.data.session_expires_at>Date.now()/1000);});
  } finally { global.fetch=saved; process.env=env; }
});
