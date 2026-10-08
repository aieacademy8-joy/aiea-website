import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const auth = require('../../api/portal/auth.js'), context = require('../../api/portal/context.js'), entry = require('../../api/portal/index.js');
const runtime = require('../../lib/portal/runtime.js');
const A='00000000-0000-0000-0000-000000000001', B='00000000-0000-0000-0000-000000000002';
const W='10000000-0000-0000-0000-000000000001', S='10000000-0000-0000-0000-000000000002', V='20000000-0000-0000-0000-000000000001';
const E='30000000-0000-0000-0000-000000000001';
function jwt(extra={}) { return Buffer.from('{}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:A,iss:'http://127.0.0.1:54321/auth/v1',aud:'authenticated',role:'authenticated',is_anonymous:false,exp:Math.floor(Date.now()/1000)+600,...extra})).toString('base64url')+'.signature'; }
function call(handler,{method='GET',url='/api/portal/context',cookie,body,origin='http://localhost:4321',headers={}}={}) {
  const req={method,url,body,headers:{origin,'content-type':'application/json',...(cookie?{cookie}:{}),...headers}};
  const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},end(s=''){this.text=s;}};
  return handler(req,res).then(()=>res);
}
test('bounded Portal runtime adversarial contracts (mocked upstream; native proof is separate)',async t=>{
  const savedFetch=global.fetch, savedEnv={...process.env};
  let token, fixture, requests;
  function reset() {
    process.env.PORTAL_SUPABASE_URL='http://127.0.0.1:54321'; process.env.PORTAL_ORIGIN='http://localhost:4321'; process.env.PORTAL_SUPABASE_PUBLISHABLE_KEY='sb_publishable_synthetic';
    token=jwt(); fixture={user:{id:A,is_anonymous:false},profile:[{user_id:A,status:'ACTIVE',adult_confirmed_at:'2026-10-06T00:00:00Z'}],
      memberships:[{workspace_id:W,workspace_kind:'FAMILY',role:'OWNER'}],workspaces:[{id:W,kind:'FAMILY',display_name:'Family'}],
      entitlements:[{id:E,program_version_id:V,status:'ACTIVE',billing_reference_id:'never-project'}]}; requests=[];
    global.fetch=async (url,options)=>{
      requests.push({url,options}); const path=new URL(url).pathname;
      if(fixture.offline) throw Error('sensitive upstream detail');
      let status=200,value;
      if(path==='/auth/v1/user') {status=fixture.authStatus||((options.headers.Authorization==='Bearer '+token)?200:401);value=fixture.user;}
      else if(path==='/auth/v1/otp') {status=fixture.otpStatus||200;value={error_code:fixture.otpError||'otp_disabled'};}
      else if(path==='/auth/v1/verify') {status=fixture.verifyStatus||200;value={access_token:token,refresh_token:'must-never-be-returned'};}
      else if(path==='/auth/v1/logout') {status=fixture.logoutStatus||204;value=null;}
      else if(path.endsWith('/user_profile')) value=fixture.profile;
      else if(path.endsWith('/workspace_membership')) value=fixture.memberships;
      else if(path.endsWith('/workspace')) value=fixture.workspaces;
      else if(path.endsWith('/entitlement')) value=fixture.entitlements;
      else throw Error('Unexpected route');
      if(path.startsWith('/rest/')&&fixture.dbStatus) status=fixture.dbStatus;
      return {status,text:async()=>value===null?'':JSON.stringify(value)};
    };
  }
  const cookie=()=> 'aiea_portal_local='+token;
  async function check(name,fn){await t.test(name,async()=>{reset();await fn();});}
  try {
    await check('OTP explicitly disables implicit signup and normalizes email',async()=>{const r=await call(auth,{method:'POST',body:{action:'request',email:' Adult@Example.invalid '}});assert.equal(r.statusCode,200);assert.deepEqual(JSON.parse(requests[0].options.body),{email:'adult@example.invalid',create_user:false});assert.ok(!r.headers['Set-Cookie']);});
    for(const code of [400,403,422]) await check('unknown account response does not reveal native rejection '+code,async()=>{fixture.otpStatus=code;const r=await call(auth,{method:'POST',body:{action:'request',email:'unknown@example.invalid'}});assert.deepEqual(JSON.parse(r.text),{requested:true});});
    await check('OTP rate limit is not hidden as success',async()=>{fixture.otpStatus=429;const r=await call(auth,{method:'POST',body:{action:'request',email:'adult@example.invalid'}});assert.equal(r.statusCode,429);assert.equal(r.headers['Retry-After'],'60');});
    await check('email provider failure is not mistaken for unknown account',async()=>{fixture.otpStatus=422;fixture.otpError='email_provider_disabled';const r=await call(auth,{method:'POST',body:{action:'request',email:'adult@example.invalid'}});assert.equal(r.statusCode,503);assert.ok(!r.text.includes('email_provider_disabled'));});
    await check('verification stores only access cookie and returns no tokens',async()=>{const r=await call(auth,{method:'POST',body:{action:'verify',email:'adult@example.invalid',code:'123456'}});assert.equal(r.statusCode,200);assert.deepEqual(JSON.parse(r.text),{authenticated:true});assert.match(r.headers['Set-Cookie'],/HttpOnly; SameSite=Lax; Max-Age=\d+/);assert.ok(!r.text.includes(token));assert.ok(!r.headers['Set-Cookie'].includes('must-never'));assert.deepEqual(JSON.parse(requests[0].options.body),{email:'adult@example.invalid',token:'123456',type:'email'});});
    for(const code of [400,401,403,422]) await check('invalid/replayed/expired upstream verification denies '+code,async()=>{fixture.verifyStatus=code;const r=await call(auth,{method:'POST',body:{action:'verify',email:'adult@example.invalid',code:'123456'}});assert.equal(r.statusCode,401);assert.match(r.headers['Set-Cookie'],/Max-Age=0/);});
    for(const input of ['12345','1234567','abcdef',123456]) await check('reject malformed numeric input '+typeof input+String(input),async()=>{const r=await call(auth,{method:'POST',body:{action:'verify',email:'adult@example.invalid',code:input}});assert.equal(r.statusCode,400);assert.equal(requests.length,0);});
    for(const origin of ['https://evil.example.invalid',undefined]) await check('same-origin POST required '+String(origin),async()=>{const r=await call(auth,{method:'POST',body:{action:'request',email:'adult@example.invalid'},headers:{origin}});assert.equal(r.statusCode,403);assert.equal(requests.length,0);});
    await check('cross-site Fetch Metadata denied',async()=>{const r=await call(auth,{method:'POST',body:{action:'signout'},headers:{'sec-fetch-site':'cross-site'}});assert.equal(r.statusCode,403);});
    await check('wrong content type denied',async()=>{const r=await call(auth,{method:'POST',body:{action:'signout'},headers:{'content-type':'text/plain'}});assert.equal(r.statusCode,415);});
    await check('caller cannot supply signup or role options',async()=>{const r=await call(auth,{method:'POST',body:{action:'request',email:'adult@example.invalid',create_user:true,role:'OWNER'}});assert.equal(r.statusCode,400);assert.equal(requests.length,0);});
    await check('unsupported actions denied',async()=>{const r=await call(auth,{method:'POST',body:{action:'create-workspace'}});assert.equal(r.statusCode,400);});
    for(const [handler,method] of [[auth,'GET'],[context,'POST'],[entry,'POST']]) await check('method restriction '+method+handler.name,async()=>{const r=await call(handler,{method});assert.equal(r.statusCode,405);});
    for(const bad of ['', 'invalid.invalid.invalid', 'aiea_portal_local=bad']) await check('missing/malformed session '+bad,async()=>{const r=await call(context,{cookie:bad});assert.equal(r.statusCode,401);assert.equal(requests.length,0);});
    await check('duplicate session cookies denied',async()=>{const r=await call(context,{cookie:cookie()+'; '+cookie()});assert.equal(r.statusCode,401);});
    await check('decoded forged identity cannot authenticate',async()=>{const r=await call(context,{cookie:'aiea_portal_local='+jwt({sub:B})});assert.equal(r.statusCode,401);assert.equal(requests.length,1);});
    for(const extra of [{exp:1},{iss:'https://wrong.example.invalid/auth/v1'},{aud:'service_role'},{role:'service_role'},{is_anonymous:true},{sub:'not-uuid'},{nbf:9999999999}]) await check('claim boundary '+JSON.stringify(extra),async()=>{token=jwt(extra);const r=await call(context,{cookie:cookie()});assert.equal(r.statusCode,401);assert.equal(requests.length,0);});
    await check('Auth identity must match token subject',async()=>{fixture.user.id=B;const r=await call(context,{cookie:cookie()});assert.equal(r.statusCode,401);});
    for(const profile of [[],[{user_id:A,status:'INACTIVE',adult_confirmed_at:'2026-10-06'}],[{user_id:A,status:'ACTIVE',adult_confirmed_at:null}]]) await check('active adult profile required '+JSON.stringify(profile),async()=>{fixture.profile=profile;const r=await call(context,{cookie:cookie()});assert.equal(r.statusCode,403);assert.match(r.headers['Set-Cookie'],/Max-Age=0/);});
    await check('zero workspace adult is valid without invented provisioning',async()=>{fixture.memberships=[];const r=await call(context,{cookie:cookie()});assert.equal(r.statusCode,200);const d=JSON.parse(r.text);assert.deepEqual(d.workspaces,[]);assert.equal(d.selected_workspace_id,null);assert.equal(requests.length,3);});
    await check('single workspace auto-selects and projects permitted fields only',async()=>{const r=await call(context,{cookie:cookie()});assert.equal(r.statusCode,200);const d=JSON.parse(r.text);assert.equal(d.selected_workspace_id,W);assert.deepEqual(d.entitlements,[{id:E,program_version_id:V,status:'ACTIVE'}]);assert.ok(!r.text.includes('billing_reference'));assert.ok(requests.every(r=>!r.options.headers.apikey.includes('secret')));assert.ok(requests.filter(r=>r.url.includes('/rest/')).every(r=>r.options.headers['Accept-Profile']==='portal'&&r.options.headers.Authorization==='Bearer '+token));assert.ok(requests.some(r=>r.url.includes('user_id=eq.'+A+'&status=eq.ACTIVE')));});
    await check('multiple workspaces require selection and roles remain explicit',async()=>{fixture.memberships.push({workspace_id:S,workspace_kind:'SCHOOL',role:'TEACHER'});fixture.workspaces.push({id:S,kind:'SCHOOL',display_name:'School'});let r=await call(context,{cookie:cookie()});assert.equal(JSON.parse(r.text).selected_workspace_id,null);r=await call(context,{cookie:cookie(),url:'/api/portal/context?workspace_id='+S});assert.equal(JSON.parse(r.text).workspaces[1].role,'TEACHER');assert.ok(requests.at(-1).url.includes('workspace_id=eq.'+S));});
    await check('unauthorized workspace denied without logging out valid adult',async()=>{const r=await call(context,{cookie:cookie(),url:'/api/portal/context?workspace_id='+S});assert.equal(r.statusCode,403);assert.ok(!r.headers['Set-Cookie']);assert.ok(!requests.some(r=>r.url.includes('/entitlement')));});
    await check('revoked membership is re-read each request',async()=>{let r=await call(context,{cookie:cookie()});assert.equal(r.statusCode,200);fixture.memberships=[];r=await call(context,{cookie:cookie(),url:'/api/portal/context?workspace_id='+W});assert.equal(r.statusCode,403);});
    await check('inactive workspace cannot be selected',async()=>{fixture.workspaces=[];const r=await call(context,{cookie:cookie(),url:'/api/portal/context?workspace_id='+W});assert.equal(r.statusCode,403);});
    await check('FAMILY TEACHER fails closed',async()=>{fixture.memberships[0].role='TEACHER';const r=await call(context,{cookie:cookie()});assert.equal(r.statusCode,503);});
    for(const status of ['ACTIVE','SUSPENDED','REVOKED']) await check('summary displays status without granting content '+status,async()=>{fixture.entitlements[0].status=status;const r=await call(context,{cookie:cookie()});assert.equal(JSON.parse(r.text).entitlements[0].status,status);assert.ok(!requests.some(r=>/mission|learner_ref|resource_asset/.test(r.url)));});
    await check('excessive result set fails closed',async()=>{fixture.memberships=Array(101).fill(fixture.memberships[0]);const r=await call(context,{cookie:cookie()});assert.equal(r.statusCode,503);});
    for(const query of ['workspace_id=bad','workspace_id='+W+'&workspace_id='+S,'token=legacy','url=https://evil.example.invalid']) await check('invalid/unsupported query '+query,async()=>{const r=await call(context,{cookie:cookie(),url:'/api/portal/context?'+query});assert.equal(r.statusCode,400);});
    await check('protected entry redirects anonymous without private markup',async()=>{const r=await call(entry);assert.equal(r.statusCode,303);assert.equal(r.headers.Location,'/portal/login.html');assert.equal(r.text,'');});
    await check('protected shell carries no user/token payload',async()=>{const r=await call(entry,{cookie:cookie()});assert.equal(r.statusCode,200);assert.ok(r.text.includes('workspace-select'));assert.ok(!r.text.includes(token));assert.ok(!r.text.includes(A));});
    await check('authenticated responses prevent cache/frame/referrer leakage',async()=>{const r=await call(context,{cookie:cookie()});assert.match(r.headers['Cache-Control'],/private, no-store/);assert.match(r.headers['Content-Security-Policy'],/frame-ancestors 'none'/);assert.equal(r.headers['Referrer-Policy'],'no-referrer');assert.equal(r.headers.Vary,'Cookie');});
    await check('HTTPS cookie is host-only and secure',async()=>{process.env.PORTAL_ORIGIN='https://portal.example.invalid';const r=await call(auth,{method:'POST',origin:process.env.PORTAL_ORIGIN,body:{action:'verify',email:'adult@example.invalid',code:'123456'}});assert.equal(r.statusCode,200);assert.match(r.headers['Set-Cookie'],/^__Host-aiea_portal=/);assert.match(r.headers['Set-Cookie'],/; Secure$/);assert.ok(!r.headers['Set-Cookie'].includes('Domain='));});
    await check('signout targets current session and clears cookie',async()=>{const r=await call(auth,{method:'POST',cookie:cookie(),body:{action:'signout'}});assert.equal(r.statusCode,200);assert.ok(r.headers['Set-Cookie'].every(c=>/Max-Age=0/.test(c)));assert.ok(requests[0].url.endsWith('/logout?scope=local'));});
    await check('signout without cookie is idempotent',async()=>{const r=await call(auth,{method:'POST',body:{action:'signout'}});assert.equal(r.statusCode,200);assert.equal(requests.length,0);});
    await check('signout outage still clears local cookie and reports failure',async()=>{fixture.offline=true;const r=await call(auth,{method:'POST',cookie:cookie(),body:{action:'signout'}});assert.equal(r.statusCode,503);assert.match(r.headers['Set-Cookie'][0],/Max-Age=0/);assert.match(r.headers['Set-Cookie'][1],/aiea_portal_logout_local=.+;.*HttpOnly/);assert.ok(!r.text.includes('sensitive'));});
    await check('A01 complete cookie-jar failure/retry/replay/eventual-revocation sequence',async()=>{
      const original=cookie(), jar=new Map(original.split('=').length ? [[original.split('=')[0],original.split('=')[1]]] : []);
      const header=()=>[...jar].map(([k,v])=>k+'='+v).join('; ');
      const apply=r=>{for(const c of r.headers['Set-Cookie']||[]){const [k,v]=c.split(';')[0].split('=');if(/Max-Age=0(?:;|$)/.test(c))jar.delete(k);else jar.set(k,v);}};
      assert.equal((await call(context,{cookie:header()})).statusCode,200);
      fixture.logoutStatus=503;
      let r=await call(auth,{method:'POST',cookie:header(),body:{action:'signout'}});apply(r);
      assert.equal(r.statusCode,503);assert.equal(JSON.parse(r.text).error,'signout_incomplete');
      assert.ok(!jar.has('aiea_portal_local'));assert.equal(jar.get('aiea_portal_logout_local'),token);
      assert.equal((await call(context,{cookie:header()})).statusCode,401);
      // Restoring the original access cookie alongside the pending retry cannot regain access.
      assert.equal((await call(context,{cookie:original+'; '+header()})).statusCode,401);
      r=await call(auth,{method:'POST',cookie:header(),body:{action:'signout'}});apply(r);
      assert.equal(r.statusCode,503);assert.equal(jar.size,1);assert.ok(!r.text.includes('signed_out'));
      fixture.logoutStatus=204;
      r=await call(auth,{method:'POST',cookie:header(),body:{action:'signout'}});
      assert.equal(requests.at(-1).options.headers.Authorization,'Bearer '+token);apply(r);
      assert.equal(r.statusCode,200);assert.deepEqual(JSON.parse(r.text),{signed_out:true});assert.equal(jar.size,0);
      fixture.authStatus=401;
      assert.equal((await call(context,{cookie:original})).statusCode,401);
    });
    await check('pending logout blocks sign-in without discarding retry credential',async()=>{
      const r=await call(auth,{method:'POST',cookie:'aiea_portal_logout_local='+token,body:{action:'verify',email:'adult@example.invalid',code:'123456'}});
      assert.equal(r.statusCode,409);assert.equal(JSON.parse(r.text).error,'signout_required');assert.equal(requests.length,0);assert.ok(!r.headers['Set-Cookie']);
    });
    await check('upstream forbidden logout is not false success',async()=>{
      fixture.logoutStatus=403;const r=await call(auth,{method:'POST',cookie:cookie(),body:{action:'signout'}});
      assert.equal(r.statusCode,503);assert.match(r.headers['Set-Cookie'][1],/Max-Age=[1-9]/);
    });
    await check('malformed pending retry never becomes idempotent success',async()=>{
      const r=await call(auth,{method:'POST',cookie:'aiea_portal_logout_local=broken',body:{action:'signout'}});
      assert.equal(r.statusCode,503);assert.ok(!r.text.includes('signed_out'));
    });
    await check('pending logout entry retains retry and routes to truthful recovery',async()=>{
      const r=await call(entry,{cookie:'aiea_portal_logout_local='+token});assert.equal(r.statusCode,303);
      assert.equal(r.headers.Location,'/portal/login.html?signout_pending=1');assert.equal(requests.length,0);
      assert.ok(!r.headers['Set-Cookie'].includes('aiea_portal_logout_local'));
    });
    await check('HTTPS retry credential is host-only HttpOnly Secure and expiry bounded',async()=>{
      process.env.PORTAL_ORIGIN='https://portal.example.invalid';fixture.logoutStatus=503;
      const r=await call(auth,{method:'POST',origin:process.env.PORTAL_ORIGIN,cookie:'__Host-aiea_portal='+token,body:{action:'signout'}});
      assert.equal(r.statusCode,503);const c=r.headers['Set-Cookie'][1];assert.match(c,/^__Host-aiea_portal_logout=/);assert.match(c,/HttpOnly; SameSite=Lax; Max-Age=\d+; Secure$/);assert.ok(!c.includes('Domain='));
    });
    await check('Auth outage fails closed',async()=>{fixture.offline=true;const r=await call(entry,{cookie:cookie()});assert.equal(r.statusCode,503);assert.ok(!r.text.includes('workspace-select'));});
    await check('database failure fails closed',async()=>{fixture.dbStatus=500;const r=await call(context,{cookie:cookie()});assert.equal(r.statusCode,503);});
    await check('missing configuration fails closed without outbound requests',async()=>{delete process.env.PORTAL_ORIGIN;const r=await call(context,{cookie:cookie()});assert.equal(r.statusCode,503);assert.equal(requests.length,0);});
    await check('service-equivalent key rejected',async()=>{process.env.PORTAL_SUPABASE_PUBLISHABLE_KEY='sb_secret_not_allowed';assert.throws(()=>runtime.config(),/not_configured/);});
    await check('concurrent identities do not share authentication context',async()=>{
      const tb=jwt({sub:B});global.fetch=async(url,options)=>{const b=options.headers.Authorization==='Bearer '+tb,id=b?B:A;let value;
        if(url.includes('/auth/v1/user'))value={id,is_anonymous:false};else if(url.includes('/user_profile?'))value=[{user_id:id,status:'ACTIVE',adult_confirmed_at:'2026-10-06'}];else if(url.includes('/workspace_membership?')){assert.ok(url.includes('user_id=eq.'+id));value=[];}else throw Error();
        await new Promise(r=>setTimeout(r,b?1:5));return {status:200,text:async()=>JSON.stringify(value)};};
      const result=await Promise.all([call(context,{cookie:cookie()}),call(context,{cookie:'aiea_portal_local='+tb})]);assert.ok(result.every(r=>r.statusCode===200));
    });
  } finally {global.fetch=savedFetch;for(const k of Object.keys(process.env))if(!(k in savedEnv))delete process.env[k];Object.assign(process.env,savedEnv);}
});
