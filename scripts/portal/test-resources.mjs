// Production API/runtime with synthetic upstream, no hosted providers.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {journeyFixture,id,W,S,V,M,R} from './journey-fixture.mjs';
const require=createRequire(import.meta.url),resources=require('../../lib/portal/resources'),handler=require('../../api/portal/resources');
test('published learning resource contracts and download boundary',async t=>{
 const env={...process.env},savedFetch=global.fetch,savedBlob=resources.blob;
 let f;
 const reset=()=>{f=journeyFixture();global.fetch=f.fetch;resources.blob=f.blob;
  Object.assign(process.env,{PORTAL_SUPABASE_URL:'http://127.0.0.1:54321',PORTAL_ORIGIN:'http://localhost:4321',PORTAL_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic'});};
 const query='workspace_id='+W+'&program_version_id='+V+'&mission_id='+M;
 async function call(q=query,opts={}){
  const req={method:opts.method||'GET',url:'/api/portal/resources?'+q,headers:{cookie:opts.cookie===undefined?'aiea_portal_local='+f.token:opts.cookie}};
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(value){this.body=value;}};await handler(req,res);
  return {...res,data:Buffer.isBuffer(res.body)?null:JSON.parse(res.body)};
 }
 async function check(name,fn){await t.test(name,async()=>{reset();await fn();});}
 try{
  await check('only current mission and common published-language or neutral resources are listed',async()=>{
   const r=await call();assert.equal(r.statusCode,200);assert.deepEqual(r.data.resources.map(x=>x.id),[R,id(42)]);assert.equal(r.data.other_language_count,1);
   assert.deepEqual(Object.keys(r.data.resources[0]).sort(),['asset_key','id','locale_code','locale_neutral']);assert.ok(!/blob_path|private\/|content_hash|downloadUrl/.test(resText(r)));
  });
  await check('requested published language selects its resources without translation',async()=>{const r=await call(query+'&locale=es');assert.deepEqual(r.data.resources.map(x=>x.id),[id(41),id(42)]);assert.equal(r.data.resolved_locale,'es');});
  await check('resources attached to a draft language are neither offered nor counted as published',async()=>{f.state.locales=['en-US'];f.state.draftLocales=['es'];const r=await call();assert.equal(r.statusCode,200);assert.equal(r.data.other_language_count,0);assert.ok(!r.data.resources.some(x=>x.id===id(41)));assert.equal((await call(query+'&resource_id='+id(41))).statusCode,404);});
  await check('explicit program fallback is applied, no per-resource fallback is invented',async()=>{const r=await call(query+'&locale=fr');assert.equal(r.data.resolved_locale,'en-US');assert.equal((await call(query+'&locale=es&resource_id='+R)).statusCode,404);});
  await check('absent approved fallback remains unavailable',async()=>{f.state.fallback=null;assert.equal((await call(query+'&locale=fr')).statusCode,409);});
  await check('other missions do not leak resources',async()=>{const r=await call(query.replace(M,id(21)));assert.deepEqual(r.data.resources.map(x=>x.id),[id(42)]);assert.equal((await call(query.replace(M,id(21))+'&resource_id='+R)).statusCode,404);});
  await check('SCHOOL curriculum resources require entitlement, no cohort completion is inferred',async()=>{const r=await call(query.replace(W,S));assert.equal(r.statusCode,200);assert.ok(!f.state.requests.some(x=>/cohort|progress|rpc/.test(x.path)));});
  await check('hash-verified bytes download with attachment, safe filename and private headers',async()=>{const r=await call(query+'&resource_id='+R);assert.equal(r.statusCode,200);assert.deepEqual(r.body,f.bytes);assert.equal(r.headers['Content-Type'],'application/octet-stream');assert.match(r.headers['Content-Disposition'],/^attachment; filename="Mission-worksheet--img-\.pdf"$/);assert.match(r.headers['Cache-Control'],/private, no-store/);assert.equal(r.headers.Vary,'Cookie');});
  await check('missing Blob configuration fails clearly without a provider call',async()=>{resources.blob=savedBlob;delete process.env.BLOB_READ_WRITE_TOKEN;delete process.env.BLOB_STORE_ID;delete process.env.VERCEL_OIDC_TOKEN;const r=await call(query+'&resource_id='+R);assert.equal(r.statusCode,503);assert.equal(r.data.error,'resources_not_configured');});
  await check('hash mismatch returns no file bytes or path',async()=>{f.assets[0].content_hash='0'.repeat(64);const r=await call(query+'&resource_id='+R);assert.equal(r.statusCode,503);assert.deepEqual(r.data,{error:'resource_unavailable'});assert.equal(r.headers['Content-Disposition'],undefined);});
  await check('missing file is sanitized',async()=>{resources.blob=async()=>null;assert.equal((await call(query+'&resource_id='+R)).statusCode,503);});
  await check('wrong Blob pathname cannot substitute another resource',async()=>{resources.blob=async path=>({...await f.blob(path),blob:{pathname:'another-file',size:1}});assert.equal((await call(query+'&resource_id='+R)).statusCode,503);});
  await check('large declared files fail before bytes are sent',async()=>{resources.blob=async path=>({...await f.blob(path),blob:{pathname:path,size:resources.MAX_BYTES+1}});assert.equal((await call(query+'&resource_id='+R)).statusCode,413);});
  await check('undeclared oversized stream fails before bytes are sent',async()=>{resources.blob=async path=>({statusCode:200,blob:{pathname:path,size:null},stream:new ReadableStream({start(c){c.enqueue(new Uint8Array(resources.MAX_BYTES+1));c.close();}})});assert.equal((await call(query+'&resource_id='+R)).statusCode,413);});
  for(const change of ['active','adult','member','session'])await check(change+' revoked during Blob read suppresses private bytes',async()=>{resources.blob=async path=>{f.state[change]=false;return f.blob(path);};const r=await call(query+'&resource_id='+R);assert.ok([401,403,404].includes(r.statusCode));assert.equal(r.headers['Content-Disposition'],undefined);assert.ok(!Buffer.isBuffer(r.body));});
  await check('held metadata final read detects entitlement revocation',async()=>{let calls=0;f.state.change=path=>{if(path.endsWith('/resource_asset')&&++calls===1)f.state.active=false;};assert.equal((await call()).statusCode,404);});
  await check('resource identity/hash change during assembly suppresses bytes',async()=>{resources.blob=async path=>{const result=await f.blob(path);f.assets[0].content_hash='0'.repeat(64);return result;};assert.equal((await call(query+'&resource_id='+R)).statusCode,503);});
  for(const path of ['https://evil.invalid/file.pdf','../file.pdf','/file.pdf','a\\file.pdf','a/../file.pdf','a\nfile.pdf'])await check('untrusted blob pathname rejected '+JSON.stringify(path),async()=>{f.assets[0].blob_path=path;assert.equal((await call()).statusCode,503);});
  for(const q of ['',query+'&resource_id=x',query+'&resource_id='+R+'&resource_id='+R,query+'&url=https://evil.invalid',query+'&locale=es&locale=en-US',query.replace(V,id(99)),query.replace(M,id(99))])await check('invalid or unauthorized resource request '+q.slice(-65),async()=>{assert.ok([400,404].includes((await call(q)).statusCode));});
  await check('missing session and pending signout cannot browse/download',async()=>{assert.equal((await call(query,{cookie:''})).statusCode,401);assert.equal((await call(query,{cookie:'aiea_portal_local='+f.token+'; aiea_portal_logout_local='+f.token})).statusCode,401);});
  await check('resource endpoint has no mutation mode',async()=>{assert.equal((await call(query,{method:'POST'})).statusCode,405);assert.equal(f.state.requests.length,0);});
  await check('all data queries retain native bearer and read-only boundary',async()=>{await call(query+'&resource_id='+R);assert.ok(f.state.requests.every(r=>r.method==='GET'));assert.equal(f.state.records.size,0);});
 }finally{global.fetch=savedFetch;resources.blob=savedBlob;process.env=env;}
});
function resText(r){return JSON.stringify(r.data);}
