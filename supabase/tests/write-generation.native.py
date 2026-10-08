#!/usr/bin/env python3
"""HR03 authored regression: genuine disposable LOCAL Auth/PostgREST/API only.

Run after accepted entry/curriculum and 01D status fixtures, with the local adapter.
Privileged keys are test-operator fixtures only. Tokens/credentials never printed.
Fault triggers and negative-control gate changes exist only in the disposable DB.
"""
from concurrent.futures import ThreadPoolExecutor
import importlib.util
import json
import select
import subprocess
import time
from pathlib import Path
import urllib.error
import urllib.request

spec=importlib.util.spec_from_file_location('status_test',Path(__file__).with_name('mission-status.native.py'))
p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
t=p.t
RESULTS=[];counter=800;lengths=[]
KEY=810301

def check(label,ok,detail=None):
    row={'label':label,'pass':bool(ok)}
    if detail is not None:row['detail']=detail
    RESULTS.append(row);print(('PASS ' if ok else 'FAIL ')+label,flush=True)
    if not ok:raise SystemExit('HR03 native expectation failed: '+label)

def fresh(n):
    s=p.fresh(n,full=True);lengths.append(len(s['access_token']));return s

def refresh(s):
    st,a,_=t.request(t.C['API_URL'],'/auth/v1/token?grant_type=refresh_token',{'refresh_token':s['refresh_token']})
    if st==200:lengths.append(len(a['access_token']))
    return st,a

def generation(token):return t.claims(token)['aiea_write_generation']
def sid(token):return t.claims(token)['session_id']
def state(token):
    return t.sql("select user_id::text||'|'||generation::text from portal_private.write_session_generation where session_id="+t.quote(sid(token)))
def auth_state(token):
    return t.sql("select md5(to_jsonb(s)::text) from auth.sessions s where id="+t.quote(sid(token)))+'|'+state(token)

def subject(school):
    global counter
    counter+=1;x=p.uid(counter)
    table='cohort' if school else 'learner_ref'
    t.sql('insert into portal.'+table+'(id,workspace_id,display_code) values ('+t.quote(x)+','+t.quote(p.S if school else p.W)+",'HR03 synthetic "+str(counter)+"');")
    return x

def invoke(token,mode,x,action='start',extra=None,m=None,headers=None):
    school=mode.startswith('SCHOOL');m=m or p.uid(1001)
    if headers:
        b={'workspace_id':p.S if school else p.W,'program_version_id':p.V,'mission_id':m,'action':action}
        h={'Content-Type':'application/json',**headers}
        if mode.endswith('RPC'):
            b['cohort_id' if school else 'learner_ref_id']=x
            url=t.C['API_URL']+'/rest/v1/rpc/'+('record_cohort_delivery' if school else 'record_mission_progress')
            h.update({'apikey':t.C['PUBLISHABLE_KEY'],'Authorization':'Bearer '+token,'Accept-Profile':'portal','Content-Profile':'portal'})
        else:
            b['subject_id']=x;url=t.APP+'/api/portal/progress'
            h.update({'Cookie':'aiea_portal_local='+token,'Origin':t.APP})
        req=urllib.request.Request(url,headers=h,data=json.dumps(b).encode())
        try:r=urllib.request.urlopen(req,timeout=15)
        except urllib.error.HTTPError as e:r=e
        r.read();return r.status
    if mode.endswith('RPC'):
        return p.rpc(token,action,w=p.S if school else p.W,m=m,subject=x,school=school,extra=extra)[0]
    b={'workspace_id':p.S if school else p.W,'program_version_id':p.V,'mission_id':m,'subject_id':x,'action':action}
    if extra:b.update(extra)
    return p.api(token,b)[0]

def denied(token,mode,x,label,statuses=(401,403)):
    before=p.snapshot();st=invoke(token,mode,x)
    check(label+' denied',st in statuses,{'http_status':st})
    check(label+' zero domain/audit mutation',p.snapshot()==before)

def allowed(token,mode,x,label,action='start'):
    before=p.snapshot();rows=p.status_rows();st=invoke(token,mode,x,action)
    table='cohort_mission_delivery' if mode.startswith('SCHOOL') else 'mission_progress'
    check(label+' allowed',st==200,{'http_status':st})
    check(label+' exact status row and permitted domains',p.delta(before,p.snapshot())=={table,'audit_event'} and p.exact_status_change(rows,table,x,p.uid(1001)))

def pair(n,same):
    for attempt in range(5):
        # Align at the start of an epoch second; do NOT manufacture JWT iat.
        if same:time.sleep(1.02-time.time()%1)
        old=fresh(n)
        if not same:
            while time.time()<t.claims(old['access_token'])['iat']+1.1:time.sleep(.02)
        st,new=refresh(old)
        check(('same' if same else 'cross')+'-second genuine native refresh HTTP success attempt '+str(attempt+1),st==200)
        oi=t.claims(old['access_token'])['iat'];ni=t.claims(new['access_token'])['iat']
        if (oi==ni)==same:
            check(('same' if same else 'cross')+'-second verified native issuance timestamps',True,{'old_iat':oi,'new_iat':ni})
            check('native refreshed generation advances on the same managed session',sid(old['access_token'])==sid(new['access_token']) and int(generation(new['access_token']))>int(generation(old['access_token'])))
            return old,new
    raise SystemExit('Could not obtain a genuine same-second pair within bounded attempts')

def wait_for(predicate,label,seconds=1.2):
    end=time.monotonic()+seconds
    while time.monotonic()<end:
        if predicate():return
        time.sleep(.025)
    raise SystemExit('Bounded race barrier not reached: '+label)

def barrier():
    cmd=['docker','exec','-i','supabase_db_aiea-portal-local','psql','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres']
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1)
    proc.stdin.write("begin;do $$begin perform pg_advisory_xact_lock("+str(KEY)+");end$$;select 'READY';\n");proc.stdin.flush()
    until=time.monotonic()+5
    while time.monotonic()<until:
        if select.select([proc.stdout],[],[],.1)[0] and proc.stdout.readline().strip()=='READY':return proc
    proc.kill();raise SystemExit('Local controller barrier unavailable')

def release(proc):
    proc.stdin.write('commit;\n');proc.stdin.close();proc.wait(timeout=5)
    assert proc.returncode==0

def trigger(table,when,condition,body):
    # No source/configuration mutation; remove all test-only objects in finally.
    t.sql("create function portal_private.hr03_test_fault() returns trigger language plpgsql set search_path='' as $$begin "+body+";return NEW;end$$;revoke all on function portal_private.hr03_test_fault() from public,anon,authenticated,service_role;create trigger hr03_test_fault "+when+' on '+table+' for each row when ('+condition+') execute function portal_private.hr03_test_fault();')

def untrigger(table):t.sql('drop trigger if exists hr03_test_fault on '+table+';drop function if exists portal_private.hr03_test_fault();')

def races(mode):
    school=mode.startswith('SCHOOL');adult=4 if school else 2
    s=fresh(adult);token=s['access_token'];x=subject(school);before=p.snapshot()
    # Actual Auth refresh pauses AFTER advancing registry inside its uncommitted tx.
    registry='portal_private.write_session_generation'
    gate=barrier();pool=ThreadPoolExecutor(max_workers=2)
    trigger(registry,'after update',"NEW.session_id="+t.quote(sid(token)),"perform pg_advisory_xact_lock("+str(KEY)+")")
    try:
        r=pool.submit(refresh,s)
        wait_for(lambda:t.sql("select count(*) from pg_locks where locktype='advisory' and objid="+str(KEY)+" and not granted")=='1','refresh in hook')
        w=pool.submit(invoke,token,mode,x)
        wait_for(lambda:int(t.sql("select count(*) from pg_stat_activity where usename='authenticator' and wait_event_type='Lock'"))>0,'stale RPC waiting behind refresh')
        release(gate);gate=None
        st,current=r.result(timeout=5);answer=w.result(timeout=5)
        check(mode+' refresh-first native refresh commits',st==200)
        check(mode+' waiting stale write observes committed generation and denies',answer==403)
        check(mode+' refresh-first denied write has zero domain/audit mutation',p.snapshot()==before)
    finally:
        if gate:release(gate)
        pool.shutdown(wait=True);untrigger(registry)
    allowed(current['access_token'],mode,x,mode+' refresh-first current token')

    # Actual RPC pauses at status INSERT, after obtaining all authorization locks.
    s=fresh(adult);token=s['access_token'];x=subject(school);before=p.snapshot();rows=p.status_rows()
    table='portal.cohort_mission_delivery' if school else 'portal.mission_progress'
    field='cohort_id' if school else 'learner_ref_id'
    gate=barrier();pool=ThreadPoolExecutor(max_workers=2)
    trigger(table,'before insert','NEW.'+field+'='+t.quote(x),"perform pg_advisory_xact_lock("+str(KEY)+")")
    try:
        w=pool.submit(invoke,token,mode,x)
        wait_for(lambda:t.sql("select count(*) from pg_locks where locktype='advisory' and objid="+str(KEY)+" and not granted")=='1','authorized RPC at status INSERT')
        # Native Auth uses SKIP LOCKED plus API retries here, not a persistent DB
        # lock wait. Observe real retry SELECT calls while the write holds authority.
        retry_query="select coalesce(sum(calls),0)::bigint from extensions.pg_stat_statements where userid=(select oid from pg_roles where rolname='supabase_auth_admin') and query ilike '%skip locked%' and query ilike '%sessions%'"
        retries=int(t.sql(retry_query));authority=state(token)
        r=pool.submit(refresh,s)
        wait_for(lambda:int(t.sql(retry_query))>retries,'native refresh retries behind authorized write')
        check(mode+' native refresh retries while write retains generation authority',not r.done() and state(token)==authority)
        release(gate);gate=None
        answer=w.result(timeout=5);st,current=r.result(timeout=5)
        check(mode+' write-first authorized write commits before native refresh',answer==200 and st==200)
        check(mode+' write-first changes exact status row and permitted domains',p.delta(before,p.snapshot())=={table.split('.')[1],'audit_event'} and p.exact_status_change(rows,table.split('.')[1],x,p.uid(1001)))
    finally:
        if gate:release(gate)
        pool.shutdown(wait=True);untrigger(table)
    denied(token,mode,x,mode+' write-first token becomes stale after refresh')
    allowed(current['access_token'],mode,x,mode+' write-first current terminal action','deliver' if school else 'complete')

def faults():
    registry='portal_private.write_session_generation'
    for fault,body in [('rollback',"raise exception 'synthetic HR03 hook failure'"),('timeout','perform pg_sleep(3)')]:
        s=fresh(2);token=s['access_token'];x=subject(False);a=auth_state(token);before=p.snapshot()
        last=int(t.sql('select last_value from portal_private.write_generation_seq'))
        trigger(registry,'after update',"NEW.session_id="+t.quote(sid(token)),body)
        try:
            start=time.monotonic();st,response=refresh(s);elapsed=time.monotonic()-start
            check('hook '+fault+' fails issuance without token',st==500 and 'access_token' not in response,{'http_status':st,'elapsed_seconds':round(elapsed,3)})
            check('hook '+fault+' rolls back managed/authoritative state',auth_state(token)==a)
            check('hook '+fault+' creates no domain/audit mutation',p.snapshot()==before)
            check('hook '+fault+' consumes unreused allocation',int(t.sql('select last_value from portal_private.write_generation_seq'))>last)
            if fault=='timeout':check('native hook timeout bounded near two seconds',1.5<elapsed<6)
        finally:untrigger(registry)
        allowed(token,'FAMILY RPC',x,'previous current token after failed '+fault)
        st,current=refresh(s);check('native refresh recovers after '+fault,st==200)
        denied(token,'FAMILY RPC',x,'old token after recovered '+fault)

    s=fresh(2);token=s['access_token'];before=auth_state(token)
    t.sql('revoke execute on function portal_private.issue_write_generation(jsonb) from supabase_auth_admin;')
    try:
        st,response=refresh(s)
        check('unavailable issuance hook fails without token',st==500 and 'access_token' not in response)
        check('unavailable hook preserves prior authority',auth_state(token)==before)
    finally:t.sql('grant execute on function portal_private.issue_write_generation(jsonb) to supabase_auth_admin;')
    st,current=refresh(s);check('native issuance recovers after hook grant restored',st==200)

    # Initial issuance failure must roll back the newly created managed session too.
    email=p.users['2']['email']
    st,link,_=t.request(t.C['API_URL'],'/auth/v1/admin/generate_link',{'type':'magiclink','email':email},admin=True);assert st==200
    before=t.sql('select count(*) from auth.sessions');registry_before=t.sql('select count(*) from '+registry)
    trigger(registry,'after insert','true',"raise exception 'synthetic initial issuance failure'")
    try:
        st,response,_=t.request(t.C['API_URL'],'/auth/v1/verify',{'type':'magiclink','token_hash':link['hashed_token']})
        check('initial issuance hook failure returns no token',st==500 and 'access_token' not in response)
        check('initial issuance rollback removes uncommitted managed session and registry',t.sql('select count(*) from auth.sessions')==before and t.sql('select count(*) from '+registry)==registry_before)
    finally:untrigger(registry)

def negative_controls():
    """Prove this regression detects the original defect, in disposable DB only."""
    saved=t.sql("select pg_get_functiondef('portal_private.assert_write_session()'::regprocedure)")
    old_source=(t.ROOT/'supabase/migrations/20261008000100_portal_mission_status.sql').read_text()
    old_gate=old_source[old_source.index('create function portal_private.assert_write_session()'):old_source.index('create function portal_private.lock_status_authority')].replace('create function','create or replace function',1)
    evidence=[]
    try:
        for mode in ['FAMILY RPC','SCHOOL RPC','FAMILY API','SCHOOL API']:
            old,current=pair(4 if mode.startswith('SCHOOL') else 2,True);x=subject(mode.startswith('SCHOOL'))
            t.sql(old_gate)
            before=p.snapshot();st=invoke(old['access_token'],mode,x);changed=sorted(p.delta(before,p.snapshot()))
            evidence.append({'label':mode+' same-second stale token must deny with original gate','pass':st==403,'expected_failure':True,'actual_http_status':st,'changed_domains':changed})
            check(mode+' original-gate negative control reproduces audit defect',st==200 and changed==sorted(['audit_event','cohort_mission_delivery' if mode.startswith('SCHOOL') else 'mission_progress']))
            t.sql(saved)
            denied(old['access_token'],mode,x,mode+' restored generation gate rejects same stale token')
            allowed(current['access_token'],mode,x,mode+' restored gate allows current terminal mutation','deliver' if mode.startswith('SCHOOL') else 'complete')
    finally:
        t.sql(saved)
        (t.CREDS.parent/'write-generation-negative-control-results.json').write_text(json.dumps(evidence,indent=2))

def main():
    modes=['FAMILY RPC','SCHOOL RPC','FAMILY API','SCHOOL API']
    s=fresh(2);token=s['access_token']
    check('initial native issuance binds exact session/adult/generation',state(token)==p.users['2']['id']+'|'+generation(token))
    for same in (True,False):
        for mode in modes:
            old,current=pair(4 if mode.startswith('SCHOOL') else 2,same);x=subject(mode.startswith('SCHOOL'))
            label=mode+(' same-second' if same else ' cross-second')
            denied(old['access_token'],mode,x,label+' old token')
            before=p.snapshot()
            check(label+' header substitution cannot restore stale authority',invoke(old['access_token'],mode,x,headers={'X-AIEA-Write-Generation':generation(current['access_token']),'aiea_write_generation':generation(current['access_token'])})==403 and p.snapshot()==before)
            allowed(current['access_token'],mode,x,label+' current token')
            before=p.snapshot();check(label+' duplicate start idempotent',invoke(current['access_token'],mode,x)==200 and p.snapshot()==before)
            allowed(current['access_token'],mode,x,label+' current terminal action','deliver' if mode.startswith('SCHOOL') else 'complete')
            before=p.snapshot();check(label+' repeated terminal action idempotent',invoke(current['access_token'],mode,x,'deliver' if mode.startswith('SCHOOL') else 'complete')==200 and p.snapshot()==before)

    for mode in modes:
        s=fresh(4 if mode.startswith('SCHOOL') else 2);token=s['access_token'];x=subject(mode.startswith('SCHOOL'))
        for value in [None,False,1,{},[], '', '0','01','-1','1.0','9223372036854775808','9'*40]:
            j=t.claims(token);j['aiea_write_generation']=value
            denied(p.signed(j),mode,x,mode+' malformed claim '+json.dumps(value))
        j=t.claims(token);j.pop('aiea_write_generation');denied(p.signed(j),mode,x,mode+' missing claim')
        j=t.claims(token);j['aiea_write_generation']=str(int(generation(token))+100000)
        denied(p.signed(j),mode,x,mode+' incorrect signed generation')
        other=fresh(4 if mode.startswith('SCHOOL') else 2)['access_token']
        j=t.claims(token);j['session_id']=sid(other)
        denied(p.signed(j),mode,x,mode+' wrong session/generation pair')
        j=t.claims(token);j['aiea_write_generation']=generation(other)
        forged=token.split('.')[0]+'.'+p.signed(j).split('.')[1]+'.'+token.split('.')[2]
        denied(forged,mode,x,mode+' modified claim without issuer signature')
        before=p.snapshot();st=invoke(token,mode,x,extra={'aiea_write_generation':generation(token)})
        check(mode+' cannot substitute generation through body',st in (400,404) and p.snapshot()==before)
        before=p.snapshot();t.sql('delete from portal_private.write_session_generation where session_id='+t.quote(sid(token)))
        denied(token,mode,x,mode+' missing authoritative state')
        st,new=refresh(s);check(mode+' trusted reissuance never reuses removed generation',st==200 and int(generation(new['access_token']))>int(generation(token)))
        denied(token,mode,x,mode+' removed generation stays obsolete after trusted issuance')
        allowed(new['access_token'],mode,x,mode+' trusted reissuance restores only new authority')
        # Operator-only corruption probe: neither the gate nor trusted issuance
        # may silently rebind a surviving registry row to a different adult.
        token=new['access_token'];key=t.quote(sid(token));owner=t.claims(token)['sub']
        t.sql('update portal_private.write_session_generation set user_id='+t.quote(p.users['5']['id'])+' where session_id='+key)
        try:
            denied(token,mode,x,mode+' mismatched registry adult')
            corrupt=state(token);st,response=refresh(new)
            check(mode+' trusted hook refuses identity rebinding and rolls back',st==500 and 'access_token' not in response and state(token)==corrupt)
        finally:t.sql('update portal_private.write_session_generation set user_id='+t.quote(owner)+' where session_id='+key)
        st,recovered=refresh(new);check(mode+' trusted issuance recovers after operator repair',st==200)
        denied(token,mode,x,mode+' prior generation obsolete after repair issuance')

    for mode in modes:
        n=4 if mode.startswith('SCHOOL') else 2
        a=fresh(n);b=fresh(n);x=subject(mode.startswith('SCHOOL'));y=subject(mode.startswith('SCHOOL'))
        bg=state(b['access_token']);st,new=refresh(a)
        check(mode+' independent sessions bind distinct identity with same adult',sid(a['access_token'])!=sid(b['access_token']) and t.claims(a['access_token'])['sub']==t.claims(b['access_token'])['sub'])
        check(mode+' refreshing A preserves B registry',st==200 and state(b['access_token'])==bg)
        allowed(b['access_token'],mode,x,mode+' independent session B still authorized')
        allowed(new['access_token'],mode,y,mode+' independent session A current authorized')
        denied(a['access_token'],mode,y,mode+' independent session A old denied')

    for n,base in [(2,'FAMILY'),(4,'SCHOOL')]:
        s=fresh(n)
        with ThreadPoolExecutor(max_workers=3) as pool:answers=list(pool.map(lambda _:refresh(s),range(3)))
        check(base+' three concurrent genuine refreshes succeed',all(st==200 for st,_ in answers))
        tokens=[a['access_token'] for _,a in answers];gens=[int(generation(x)) for x in tokens];current=tokens[gens.index(max(gens))]
        check(base+' concurrent issuance serializes unique authoritative generations',len(set(gens))==3 and state(current).endswith('|'+str(max(gens))))
        for mode in [base+' RPC',base+' API']:
            x=subject(n==4)
            for stale in [s['access_token']]+[token for token in tokens if token!=current]:denied(stale,mode,x,mode+' concurrent obsolete generation '+generation(stale))
            allowed(current,mode,x,mode+' concurrent authoritative generation')

    # Model delayed HTTP delivery without any app refresh feature: obtain native
    # response A, withhold its delivery to the consumer, deliver B, then deliver A.
    for mode in modes:
        s=fresh(4 if mode.startswith('SCHOOL') else 2);st,a=refresh(s);assert st==200
        st,b=refresh(a);assert st==200
        x=subject(mode.startswith('SCHOOL'))
        allowed(b['access_token'],mode,x,mode+' newer response delivered first')
        denied(a['access_token'],mode,x,mode+' delayed older response cannot restore authority')

    for mode in modes:races(mode)
    faults()
    negative_controls()
    final_controls()

def final_controls():
    modes=['FAMILY RPC','SCHOOL RPC','FAMILY API','SCHOOL API']
    for mode in modes:
        s=fresh(4 if mode.startswith('SCHOOL') else 2);token=s['access_token'];x=subject(mode.startswith('SCHOOL'))
        st,_,_=t.request(t.C['API_URL'],'/auth/v1/logout?scope=local',{},token)
        check(mode+' genuine logout removes managed session and private registry',st==204 and state(token)=='')
        denied(token,mode,x,mode+' signed-out stale token')
        for reason in ['expired-jwt','expired-managed','deleted-session','assurance-changed','banned-account','deleted-account','inactive-profile','inactive-workspace','revoked-membership','revoked-entitlement','inactive-subject']:
            s=fresh(4 if mode.startswith('SCHOOL') else 2);token=s['access_token'];adult=t.claims(token)['sub'];restore=None
            w=p.S if mode.startswith('SCHOOL') else p.W
            if reason=='expired-jwt':j=t.claims(token);j['exp']=int(time.time())-10;token=p.signed(j)
            if reason=='expired-managed':t.sql('update auth.sessions set not_after=now()-interval \'1 second\' where id='+t.quote(sid(token)))
            if reason=='deleted-session':t.sql('delete from auth.sessions where id='+t.quote(sid(token)))
            if reason=='assurance-changed':t.sql("update auth.sessions set aal='aal2' where id="+t.quote(sid(token)))
            if reason=='banned-account':
                t.sql('update auth.users set banned_until=now()+interval \'1 hour\' where id='+t.quote(adult));restore='update auth.users set banned_until=null where id='+t.quote(adult)
            if reason=='inactive-profile':
                t.sql("update portal.user_profile set status='INACTIVE' where user_id="+t.quote(adult));restore="update portal.user_profile set status='ACTIVE' where user_id="+t.quote(adult)
            if reason=='deleted-account':
                t.sql('update auth.users set deleted_at=now() where id='+t.quote(adult));restore='update auth.users set deleted_at=null where id='+t.quote(adult)
            if reason=='inactive-workspace':
                t.sql("update portal.workspace set status='INACTIVE' where id="+t.quote(w));restore="update portal.workspace set status='ACTIVE' where id="+t.quote(w)
            if reason=='revoked-membership':
                condition='workspace_id='+t.quote(w)+' and user_id='+t.quote(adult)
                t.sql("update portal.workspace_membership set status='REVOKED' where "+condition);restore="update portal.workspace_membership set status='ACTIVE' where "+condition
            if reason=='revoked-entitlement':
                condition='workspace_id='+t.quote(w)+' and program_version_id='+t.quote(p.V)
                t.sql("update portal.entitlement set status='REVOKED' where "+condition);restore="update portal.entitlement set status='ACTIVE' where "+condition
            if reason=='inactive-subject':
                table='cohort' if mode.startswith('SCHOOL') else 'learner_ref'
                t.sql('update portal.'+table+" set status='INACTIVE' where id="+t.quote(x));restore='update portal.'+table+" set status='ACTIVE' where id="+t.quote(x)
            # The accepted API hides inaccessible versions/subjects with 404;
            # generation/session denials continue to require 401/403 explicitly.
            statuses=(401,403,404) if mode.endswith('API') and reason in ('revoked-entitlement','inactive-subject') else (401,403)
            try:denied(token,mode,x,mode+' '+reason,statuses=statuses)
            finally:
                if restore:t.sql(restore)

    check('native registry RLS and forced RLS',t.sql("select relrowsecurity and relforcerowsecurity from pg_class where oid='portal_private.write_session_generation'::regclass")=='t')
    for role in ['anon','authenticated','service_role']:
        check(role+' cannot read or mutate authoritative registry',t.sql("select has_table_privilege('"+role+"','portal_private.write_session_generation','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')")=='f')
        check(role+' cannot execute hook or allocate/reset generation',t.sql("select has_function_privilege('"+role+"','portal_private.issue_write_generation(jsonb)','EXECUTE') or has_sequence_privilege('"+role+"','portal_private.write_generation_seq','USAGE,SELECT,UPDATE')")=='f')
        check(role+' cannot assume trusted Auth role',t.sql("select pg_has_role('"+role+"','supabase_auth_admin','MEMBER')")=='f')
    before=p.snapshot()
    for label,statement in [
        ('registry read','select * from portal_private.write_session_generation'),
        ('registry insert',"insert into portal_private.write_session_generation values ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000000',1)"),
        ('registry update','update portal_private.write_session_generation set generation=1'),
        ('registry delete','delete from portal_private.write_session_generation'),
        ('registry truncate','truncate portal_private.write_session_generation'),
        ('hook execution',"select portal_private.issue_write_generation('{}')"),
        ('sequence allocation',"select nextval('portal_private.write_generation_seq')"),
        ('sequence reset',"select setval('portal_private.write_generation_seq',1)")]:
        r=subprocess.run(['docker','exec','-i','supabase_db_aiea-portal-local','psql','-X','-At','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres'],input='begin;set local role authenticated;'+statement+';rollback;',text=True,capture_output=True)
        check('native authenticated SQL cannot perform '+label,r.returncode!=0 and 'permission denied' in r.stderr.lower())
    check('native privilege denial probes create no domain/audit mutation',p.snapshot()==before)
    check('native Data API login role cannot assume trusted Auth role',t.sql("select pg_has_role('authenticator','supabase_auth_admin','MEMBER')")=='f')
    for school in [False,True]:
        token=fresh(4 if school else 2)['access_token'];x=subject(school);before=p.snapshot()
        table='cohort_mission_delivery' if school else 'mission_progress'
        body={'workspace_id':p.S if school else p.W,'program_version_id':p.V,'mission_id':p.uid(1001),'cohort_id' if school else 'learner_ref_id':x,'status':'STARTED' if school else 'IN_PROGRESS'}
        req=urllib.request.Request(t.C['API_URL']+'/rest/v1/'+table,headers={'apikey':t.C['PUBLISHABLE_KEY'],'Authorization':'Bearer '+token,'Content-Type':'application/json','Content-Profile':'portal','Accept-Profile':'portal'},data=json.dumps(body).encode())
        try:r=urllib.request.urlopen(req,timeout=15)
        except urllib.error.HTTPError as e:r=e
        r.read();check('native valid adult cannot directly INSERT '+table,r.status==403 and p.snapshot()==before)
        allowed(token,'SCHOOL RPC' if school else 'FAMILY RPC',x,'native valid adult retains bounded RPC after direct DML denial')
    check('trusted Auth cannot reset sequence or update bound identities',t.sql("select has_sequence_privilege('supabase_auth_admin','portal_private.write_generation_seq','UPDATE') or has_column_privilege('supabase_auth_admin','portal_private.write_session_generation','user_id','UPDATE') or has_column_privilege('supabase_auth_admin','portal_private.write_session_generation','session_id','UPDATE') or has_table_privilege('supabase_auth_admin','portal_private.write_session_generation','DELETE,TRUNCATE')")=='f')
    check('exactly two exposed write signatures remain',t.sql("select string_agg(proname||'('||oidvectortypes(proargtypes)||')','|' order by proname) from pg_proc where pronamespace='portal'::regnamespace and proname in ('record_mission_progress','record_cohort_delivery')")=='record_cohort_delivery(uuid, uuid, uuid, uuid, text)|record_mission_progress(uuid, uuid, uuid, uuid, text)')
    check('no other authenticated-callable Portal function is exposed',t.sql("select count(*) from pg_proc where pronamespace='portal'::regnamespace and has_function_privilege('authenticated',oid,'EXECUTE') and proname not in ('record_mission_progress','record_cohort_delivery')")=='0')
    token=fresh(2)['access_token']
    for name in ['issue_write_generation','assert_write_session','write_session_generation']:
        path='/rest/v1/rpc/'+name if name!='write_session_generation' else '/rest/v1/'+name+'?select=*'
        st,_,_=t.request(t.C['API_URL'],path,{} if name!='write_session_generation' else None,token)
        check('PostgREST cannot expose private '+name,st in (404,406))
    before=p.snapshot();authority=state(token)
    status_read=p.api(token,subject=p.L)[0];curriculum_read=p.n.get(token,v=p.n.uid(101))[0]
    check('native status/curriculum GET succeeds with no domain, audit or generation change',status_read==200 and curriculum_read==200 and p.snapshot()==before and state(token)==authority)
    check('SCHOOL delivery never creates learner progress',t.sql("select count(*) from portal.mission_progress where workspace_id="+t.quote(p.S))=='0')
    check('all native token sizes within accepted 3800-character cookie boundary',max(lengths)<=3800,{'min_token_characters':min(lengths),'max_token_characters':max(lengths)})
    check('all test-only fault triggers/functions removed',t.sql("select count(*) from pg_proc where proname='hr03_test_fault'")=='0')

if __name__=='__main__':
    try:main()
    finally:(t.CREDS.parent/'write-generation-native-results.json').write_text(json.dumps(RESULTS,indent=2))
