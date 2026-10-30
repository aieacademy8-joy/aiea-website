import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {localCredentials,localResourceStore,prepare,migrations,projectId} from './native-local.mjs';

test('native launcher rejects hosted or credential-bearing endpoints and privileged keys',()=>{
 for(const API_URL of ['https://example.supabase.co','http://localhost:54321','http://127.0.0.1:54321/','http://user:secret@127.0.0.1:54321','http://127.0.0.1:54321?x=1'])
  assert.throws(()=>localCredentials({API_URL,PUBLISHABLE_KEY:'sb_publishable_local'}));
 for(const key of ['sb_secret_privileged','eyJhbGciOiJIUzI1NiJ9.service',''])
  assert.throws(()=>localCredentials({API_URL:'http://127.0.0.1:54321',PUBLISHABLE_KEY:key}));
 const data={API_URL:'http://127.0.0.1:54321',PUBLISHABLE_KEY:'sb_publishable_local',SECRET_KEY:'never-forward',SERVICE_ROLE_KEY:'never-forward'};
 assert.deepEqual(localCredentials(data),{PORTAL_SUPABASE_URL:data.API_URL,PORTAL_SUPABASE_PUBLISHABLE_KEY:data.PUBLISHABLE_KEY,PORTAL_ORIGIN:'http://localhost:4321',PORTAL_LOCAL_PORT:'4321'});
});
test('explicit local resource store reads actual private bytes and denies traversal or escaping symlinks',async()=>{
 const parent=await fs.mkdtemp(path.join(os.tmpdir(),'aiea-native-resource-test-'));
 try{
  const base=path.join(parent,'store');await fs.mkdir(base);
  await fs.writeFile(path.join(base,'local-test.txt'),'LOCAL TEST DATA');
  await fs.writeFile(path.join(parent,'outside.txt'),'outside');
  await fs.symlink(path.join(parent,'outside.txt'),path.join(base,'escape.txt'));
  const store=await localResourceStore(base),result=await store('local-test.txt');
  assert.equal(await new Response(result.stream).text(),'LOCAL TEST DATA');
  assert.equal(result.blob.pathname,'local-test.txt');
  for(const name of ['../outside.txt','/outside.txt','https://example.com','escape.txt','./local-test.txt','a\\b'])await assert.rejects(store(name));
 }finally{await fs.rm(parent,{recursive:true,force:true});}
});
test('preparation pins only five accepted migrations, never overwrites a project and activates only the copied local hook',async()=>{
 const parent=await fs.mkdtemp(path.join(os.tmpdir(),'aiea-native-local-test-'));
 try{
  const target=path.join(parent,'project');await prepare(target);
  assert.deepEqual((await fs.readdir(path.join(target,'supabase/migrations'))).sort(),migrations.map(([name])=>name));
  for(const [name,digest] of migrations)assert.equal(createHash('sha256').update(await fs.readFile(path.join(target,'supabase/migrations',name))).digest('hex'),digest);
  const config=await fs.readFile(path.join(target,'supabase/config.toml'),'utf8');
  assert.ok(config.includes('project_id = "'+projectId+'"'));
  assert.ok(config.includes('schemas = ["portal"]'));
  assert.ok(config.includes('enable_signup = false'));
  assert.ok(config.includes('enable_anonymous_sign_ins = false'));
  assert.ok(config.includes('uri = "pg-functions://postgres/portal_private/issue_write_generation"'));
  assert.ok(config.includes('content_path = "./supabase/templates/adult-email-otp.html"'));
  assert.ok(!config.includes('portal_private"]'));
  await assert.rejects(prepare(target),{code:'EEXIST'});
  await assert.rejects(prepare(path.resolve('native-pilot-test')),/outside the repository/);
 }finally{await fs.rm(parent,{recursive:true,force:true});}
});
