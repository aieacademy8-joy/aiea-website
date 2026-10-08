// Actual Chrome + local handlers + native Auth/RPC. Held acknowledgements stay native.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{chromium}=require(process.env.AIEA_PLAYWRIGHT_MODULE);
const dir=path.dirname(process.env.AIEA_LOCAL_CREDENTIALS),c=JSON.parse(await fs.readFile(process.env.AIEA_LOCAL_CREDENTIALS,'utf8'));
if(c.API_URL!=='http://127.0.0.1:54321')throw Error('Disposable loopback only');
const f=JSON.parse(await fs.readFile(path.join(dir,'progress-fixtures.json'),'utf8')),origin='http://localhost:4321',results=[];
const W='10000000-0000-0000-0000-000000000002',S='10000000-0000-0000-0000-000000000001',retry='1d000000-0000-0000-0000-000000000041';
const sql=x=>execFileSync('docker',['exec','-i','supabase_db_aiea-portal-local','psql','-X','-At','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres'],{input:x,encoding:'utf8'}).trim();
const tables=sql("select tablename from pg_tables where schemaname='portal' order by tablename").split('\n');
function snapshot(){const query=tables.map(t=>"select '"+t+"|'||md5(coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb)::text) from portal."+t+' x').join(' union all ');return Object.fromEntries(sql(query+';').split('\n').map(x=>x.split('|')));}
const delta=(a,b)=>Object.keys(a).filter(k=>a[k]!==b[k]).sort();
function check(label,v){results.push({label,pass:!!v});console.log((v?'PASS ':'FAIL ')+label);if(!v)throw Error(label);}
const browser=await chromium.launch({executablePath:process.env.AIEA_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-networking']});
async function login(n){
 const email=f.users[String(n)].email;if(!email.endsWith('@example.invalid'))throw Error('Synthetic adults only');
 const r=await fetch(c.API_URL+'/auth/v1/admin/generate_link',{method:'POST',headers:{apikey:c.SECRET_KEY,Authorization:'Bearer '+c.SERVICE_ROLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({type:'magiclink',email})});
 if(r.status!==200)throw Error('Local synthetic code unavailable');const code=(await r.json()).email_otp;
 const ctx=await browser.newContext({viewport:{width:1200,height:1000}});
 await ctx.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 const signed=await ctx.request.post(origin+'/api/portal/auth',{headers:{Origin:origin},data:{action:'verify',email,code}});if(signed.status()!==200)throw Error('Local login failed');
 const page=await ctx.newPage();await page.clock.install();await page.clock.pauseAt(new Date());await page.goto(origin+'/portal');
 return {ctx,page};
}
async function open(page,mission){await page.getByRole('button',{name:'My Programs',exact:true}).click();await page.getByRole('button',{name:'Synthetic 01D 1',exact:true}).click();await page.getByRole('button',{name:mission+'. Status mission '+mission,exact:true}).click();await page.locator('#mission-instructions').waitFor({state:'visible'});}
async function choose(page,id){await page.locator('#subject-select').selectOption(id);await page.getByText('Status loaded.',{exact:true}).waitFor();}
try{
 const {ctx,page}=await login(2),errors=[],writes=[];page.on('pageerror',x=>errors.push(x.message));page.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/progress'))writes.push(r);});
 const before=snapshot();await open(page,14);check('01D mission browsing performs no write',writes.length===0&&JSON.stringify(snapshot())===JSON.stringify(before));
 await page.getByRole('button',{name:'Record mission status',exact:true}).click();await page.locator('#subject-select option[value="'+f.learner+'"]').waitFor({state:'attached'});await choose(page,f.learner);
 check('01D existing learner selector and absent state visible',await page.locator('#progress-list').textContent().then(x=>x.includes('Mission 14 · NOT STARTED')));
 let release,seen;const gate=new Promise(r=>release=r),arrived=new Promise(r=>seen=r);
 await page.route('**/api/portal/progress',async route=>{if(route.request().method()!=='POST')return route.continue();const response=await route.fetch();seen(response.status());await gate;await route.fulfill({response}).catch(()=>{});},{times:1});
 const startBefore=snapshot();await page.getByRole('button',{name:'Start mission',exact:true}).click();check('01D native start committed while acknowledgement held',await arrived===200);
 check('01D only status/audit domains change for browser Start',JSON.stringify(delta(startBefore,snapshot()))===JSON.stringify(['audit_event','mission_progress']));
 await choose(page,retry);check('01D subject switch clears previous learner status while acknowledgement held',await page.locator('#subject-select').inputValue()===retry);
 release();await page.waitForTimeout(100);check('01D obsolete write acknowledgement cannot restore previous learner',await page.locator('#subject-select').inputValue()===retry&&!await page.locator('#progress-finish').isVisible());
 await choose(page,f.learner);check('01D fresh status read recovers committed start',await page.locator('#progress-finish').isVisible());
 const completeBefore=snapshot();await page.getByRole('button',{name:'Mark completed',exact:true}).click();await page.getByText('Status loaded.',{exact:true}).waitFor();
 check('01D explicit family completion confirmed after fresh read',(await page.locator('#progress-list').textContent()).includes('Mission 14 · COMPLETED'));
 check('01D completion changes only status/audit domains',JSON.stringify(delta(completeBefore,snapshot()))===JSON.stringify(['audit_event','mission_progress']));
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(dir,'progress-family-mobile.png')});
 check('01D mobile status panel has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));check('01D blur clears learner options/status DOM',await page.evaluate(()=>document.getElementById('subject-select').options.length===0&&document.getElementById('progress-list').textContent===''&&document.getElementById('progress-panel').hidden));
 check('01D browser no script error',errors.length===0);await ctx.close();
 const teacher=await login(3);await open(teacher.page,14);await teacher.page.getByRole('button',{name:'Record mission status',exact:true}).click();await teacher.page.locator('#subject-select option[value="'+f.cohort+'"]').waitFor({state:'attached'});await choose(teacher.page,f.cohort);
 check('01D teacher sees only assigned cohort',await teacher.page.locator('#subject-select option').count()===2);
 await teacher.page.getByRole('button',{name:'Start mission',exact:true}).click();await teacher.page.getByRole('button',{name:'Mark delivered',exact:true}).waitFor();
 const schoolBefore=snapshot();await teacher.page.getByRole('button',{name:'Mark delivered',exact:true}).click();await teacher.page.getByText('Status loaded.',{exact:true}).waitFor();
 check('01D SCHOOL delivery is explicit and truthful',(await teacher.page.locator('#progress-list').textContent()).includes('Mission 14 · DELIVERED')&&(await teacher.page.locator('#progress-explanation').textContent()).includes('does not record individual completion'));
 check('01D SCHOOL delivered mutates only cohort status/audit',JSON.stringify(delta(schoolBefore,snapshot()))===JSON.stringify(['audit_event','cohort_mission_delivery']));
 check('01D SCHOOL delivery creates no individual progress',sql("select count(*) from portal.mission_progress where workspace_id='"+S+"';")==='0');
 await teacher.page.screenshot({path:path.join(dir,'progress-school-desktop.png')});await teacher.ctx.close();
 const unassigned=await login(8);await unassigned.page.getByLabel('Select a workspace').selectOption(S);await unassigned.page.getByRole('heading',{name:'Synthetic school A',exact:true}).waitFor();await open(unassigned.page,14);await unassigned.page.getByRole('button',{name:'Record mission status',exact:true}).click();await unassigned.page.getByText('No authorized active cohorts are available. Contact AIEA for help.',{exact:true}).waitFor();
 check('01D unassigned teacher retains curriculum reads with truthful empty cohort state',await unassigned.page.locator('#subject-select option').count()===1&&!await unassigned.page.locator('#progress-start').isVisible());await unassigned.ctx.close();
 await fs.writeFile(path.join(dir,'progress-browser-results.json'),JSON.stringify(results,null,2));console.log('PASS '+results.length+' 01D browser checks');
}finally{await browser.close();}
