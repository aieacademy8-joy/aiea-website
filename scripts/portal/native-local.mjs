// Isolated native pilot tooling. Never links a hosted project or imports content.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const migrations=[
 ['20261006000100_portal_domains.sql','f0bdbe5ed8f4f622362c0a6c149bc26644b06552b8a7358b8d792dbfe05a8464'],
 ['20261006000200_portal_security.sql','b5afa539f70e34b6c22080a582de22cc484d294b8f368e11e08c141f745184d4'],
 ['20261006000300_portal_guards.sql','8fababc9491321f176fcfbf5196ff44a98a41bd657d263a897f51498837bb486'],
 ['20261008000100_portal_mission_status.sql','e05eb2bba019b17f4d72b40f7f7b033eef5450fcdb81f90be842a9fc8af5ba6f'],
 ['20261008000200_portal_write_generation.sql','d958198cc2bb77599e593420c25cb63e33a2748af5ddeed163cdbdfbf7c1c7b0']
];
export const projectId='aiea-portal-native-pilot';
export function localCredentials(data){
 if(data.API_URL!=='http://127.0.0.1:54321'||
    !/^sb_publishable_[A-Za-z0-9_-]+$/.test(data.PUBLISHABLE_KEY||''))
  throw Error('An isolated loopback Supabase status file with a publishable key is required');
 return {PORTAL_SUPABASE_URL:data.API_URL,PORTAL_SUPABASE_PUBLISHABLE_KEY:data.PUBLISHABLE_KEY,
  PORTAL_ORIGIN:'http://localhost:4321',PORTAL_LOCAL_PORT:'4321'};
}
export async function prepare(destination){
 const target=path.resolve(destination);
 if(target===root||target.startsWith(root+path.sep))throw Error('Keep the native pilot outside the repository');
 const copies=await Promise.all(migrations.map(async([name,hash])=>{
  const bytes=await fs.readFile(path.join(root,'supabase/migrations',name));
  if(createHash('sha256').update(bytes).digest('hex')!==hash)throw Error('Accepted migration integrity mismatch: '+name);
  return {name,bytes};
 }));
 let config=await fs.readFile(path.join(root,'supabase/config.toml'),'utf8');
 if(!config.includes('project_id = "aiea-portal-local"'))throw Error('Unexpected source config');
 config=config.replace('project_id = "aiea-portal-local"','project_id = "'+projectId+'"');
 config+='\n[auth.email.template.magic_link]\nsubject = "Your AIEA sign-in code"\ncontent_path = "./supabase/templates/adult-email-otp.html"\n\n[auth.hook.custom_access_token]\nenabled = true\nuri = "pg-functions://postgres/portal_private/issue_write_generation"\n';
 await fs.mkdir(target,{mode:0o700}); // Refuse reuse/reset of an existing database workspace.
 await fs.mkdir(path.join(target,'supabase/migrations'),{recursive:true,mode:0o700});
 await fs.mkdir(path.join(target,'supabase/templates'),{mode:0o700});
 for(const {name,bytes} of copies)await fs.writeFile(path.join(target,'supabase/migrations',name),bytes,{flag:'wx'});
 await fs.writeFile(path.join(target,'supabase/config.toml'),config,{flag:'wx'});
 await fs.copyFile(path.join(root,'supabase/templates/adult-email-otp.html'),path.join(target,'supabase/templates/adult-email-otp.html'));
 await fs.writeFile(path.join(target,'pilot.json'),JSON.stringify({projectId,migrations,source:root},null,2),{flag:'wx'});
 console.log('Isolated native project prepared: five pinned migrations, local HR03 hook and numeric OTP template; no curriculum seeded.');
}
export async function localResourceStore(directory){
 const base=await fs.realpath(directory);
 return async pathname=>{
  if(typeof pathname!=='string'||pathname.startsWith('/')||/[\\:\x00-\x1f]/.test(pathname)||
     pathname.split('/').some(part=>!part||part==='.'||part==='..'))throw Error('Invalid local resource path');
  const target=await fs.realpath(path.join(base,pathname));
  if(!target.startsWith(base+path.sep))throw Error('Resource escapes the isolated store');
  const file=await fs.open(target,'r');
  try{
   const stat=await file.stat();
   if(!stat.isFile()||stat.size>4000000)throw Error('Local resource unavailable');
   const bytes=await file.readFile();
   return {statusCode:200,blob:{pathname,size:bytes.length},stream:new ReadableStream({start(controller){controller.enqueue(bytes);controller.close();}})};
  }finally{await file.close();}
 };
}
export async function serve(credentialsPath,resourceDirectory){
 const config=localCredentials(JSON.parse(await fs.readFile(credentialsPath,'utf8')));
 // Only the public local key enters the ordinary Portal process. Hosted Blob
 // credentials are deliberately unavailable in this native-only launcher.
 for(const name of ['BLOB_READ_WRITE_TOKEN','BLOB_STORE_ID','VERCEL_OIDC_TOKEN'])delete process.env[name];
 Object.assign(process.env,config);
 if(resourceDirectory){
  // Explicit development-only private file store. Production handlers still use
  // Vercel Blob; all database authorization and download hash checks run intact.
  const {createRequire}=await import('node:module');
  createRequire(import.meta.url)('../../lib/portal/resources').blob=await localResourceStore(resourceDirectory);
 }
 await import('./serve-local.mjs');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [command,argument,resourceDirectory]=process.argv.slice(2);
 try{
  if(!argument||!['prepare','serve'].includes(command))throw Error('Usage: native-local.mjs prepare <new-directory> | serve <private-local-status.json>');
  if(command==='prepare')await prepare(argument);else await serve(argument,resourceDirectory);
 }catch(error){console.error(error.message);process.exitCode=1;}
}
