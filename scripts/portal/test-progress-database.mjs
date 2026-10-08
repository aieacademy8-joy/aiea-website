// Separate 01D in-memory suite; accepted foundation source/inventory unchanged.
import fs from 'node:fs/promises';
import { fileURLToPath,pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../../',import.meta.url));
if(!process.argv[2])throw Error('Supply local PGlite module path; no database URLs accepted');
const {PGlite}=await import(pathToFileURL(path.resolve(process.argv[2])).href),db=new PGlite();
try{
 await db.exec(await fs.readFile(path.join(root,'supabase/tests/bootstrap.pglite.sql'),'utf8'));
 // Extra synthetic managed fields required only by 01D; accepted bootstrap stays intact.
 await db.exec('alter table auth.users add column is_anonymous boolean default false, add column deleted_at timestamptz, add column banned_until timestamptz; alter table auth.sessions add column refreshed_at timestamp; create role supabase_auth_admin nologin; grant usage on schema auth to supabase_auth_admin; grant select,update on auth.sessions to supabase_auth_admin;');
 for(const n of (await fs.readdir(path.join(root,'supabase/migrations'))).filter(n=>n.endsWith('.sql')).sort())await db.exec(await fs.readFile(path.join(root,'supabase/migrations',n),'utf8'));
 // Re-run the unchanged accepted foundation inventory under ALL forward migrations.
 const accepted=await db.exec(await fs.readFile(path.join(root,'supabase/tests/foundation.sql'),'utf8'));
 const foundationLabels=accepted.flatMap(r=>r.rows||[]).map(r=>r.result).filter(x=>typeof x==='string'&&x.startsWith('PASS ')).map(x=>x.slice(5));
 const foundationExpected=JSON.parse(await fs.readFile(path.join(root,'supabase/tests/assertions.json'),'utf8'));
 assert.equal(new Set(foundationLabels).size,foundationLabels.length);assert.deepEqual([...foundationLabels].sort(),[...foundationExpected].sort());
 console.log('PASS unchanged accepted foundation: exact '+foundationLabels.length+' assertion inventory under all forward migrations');
 // Reuse only the accepted fixture prelude, never its assertion inventory.
 const foundation=await fs.readFile(path.join(root,'supabase/tests/foundation.sql'),'utf8');
 let setup=foundation.split("select pg_temp.ok((select count(*)=28")[0];
 assert.ok(setup.includes("update portal.program_version set status='PUBLISHED'"));
 setup=setup.replace("update portal.program_version set status='PUBLISHED',content_hash=repeat('a',64);",`update portal.program_version set completion_rules='{"method":"ADULT_ATTESTATION"}' where id='40000000-0000-0000-0000-000000000001';
 update portal.mission set completion_rules='{"method":"ADULT_ATTESTATION"}',evidence_expectations='{"required":false}' where id='50000000-0000-0000-0000-000000000001';
 update portal.program_version set status='PUBLISHED',content_hash=repeat('a',64);`);
 await db.exec(setup);
 const generationResults=await db.exec(await fs.readFile(path.join(root,'supabase/tests/write-generation.sql'),'utf8'));
 const generationLabels=generationResults.flatMap(r=>r.rows||[]).map(r=>r.result).filter(x=>typeof x==='string'&&x.startsWith('PASS ')).map(x=>x.slice(5));
 const generationExpected=JSON.parse(await fs.readFile(path.join(root,'supabase/tests/write-generation.assertions.json'),'utf8'));
 assert.equal(new Set(generationLabels).size,generationLabels.length);assert.deepEqual([...generationLabels].sort(),[...generationExpected].sort());
 generationLabels.forEach(x=>console.log('PASS '+x));
 const results=await db.exec(await fs.readFile(path.join(root,'supabase/tests/mission-status.sql'),'utf8'));
 const actual=results.flatMap(r=>r.rows||[]).map(r=>r.result).filter(x=>typeof x==='string'&&x.startsWith('PASS ')).map(x=>x.slice(5));
 const expected=JSON.parse(await fs.readFile(path.join(root,'supabase/tests/mission-status.assertions.json'),'utf8'));
 assert.equal(new Set(actual).size,actual.length);assert.equal(new Set(expected).size,expected.length);assert.deepEqual([...actual].sort(),[...expected].sort());
 actual.forEach(x=>console.log('PASS '+x));console.log('PASS exact '+actual.length+' SQL assertion inventory');
}finally{await db.close();}
