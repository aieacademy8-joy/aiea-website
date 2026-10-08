#!/usr/bin/env python3
"""01D disposable loopback managed-Auth/RPC/transaction proofs; no hosted target.
Run after accepted 01B and 01C fixtures with the local adapter. Synthetic data only.
"""
import base64
from concurrent.futures import ThreadPoolExecutor
import hashlib
import hmac
import importlib.util
import json
import struct
import sys
import subprocess
import time
import urllib.request
import urllib.error
from pathlib import Path

spec=importlib.util.spec_from_file_location('accepted_curriculum',Path(__file__).with_name('curriculum.native.py'))
n=importlib.util.module_from_spec(spec);spec.loader.exec_module(n)
t=n.t
users=json.loads((t.CREDS.parent/'curriculum-fixtures.json').read_text())['users']
results=[]
W=t.FAMILY;S=t.SCHOOL
L='20000000-0000-0000-0000-000000000004';C='21000000-0000-0000-0000-000000000001';C2='21000000-0000-0000-0000-000000000002'
def uid(x):return '1d000000-0000-0000-0000-'+str(x).zfill(12)
V=uid(101);VR=uid(102);VU=uid(103)
def check(label,value):
    results.append({'label':label,'pass':bool(value)})
    print(('PASS ' if value else 'FAIL ')+label,flush=True)
    if not value:raise SystemExit('01D native check failed: '+label)
def fresh(number,full=False):
    email=users[str(number)]['email']
    assert email.endswith('@example.invalid')
    st,a,_=t.request(t.C['API_URL'],'/auth/v1/admin/generate_link',{'type':'magiclink','email':email},admin=True)
    assert st==200
    st,a,_=t.request(t.C['API_URL'],'/auth/v1/verify',{'type':'magiclink','token_hash':a['hashed_token']})
    assert st==200
    return a if full else a['access_token']
def signed(claims):
    head=base64.urlsafe_b64encode(b'{"alg":"HS256","typ":"JWT"}').decode().rstrip('=')
    body=base64.urlsafe_b64encode(json.dumps(claims).encode()).decode().rstrip('=')
    raw=head+'.'+body
    return raw+'.'+base64.urlsafe_b64encode(hmac.new(t.C['JWT_SECRET'].encode(),raw.encode(),hashlib.sha256).digest()).decode().rstrip('=')
def rpc(token,action='start',w=W,v=V,m=None,subject=L,school=False,extra=None):
    body={'workspace_id':w,'program_version_id':v,'mission_id':m or uid(1001),('cohort_id' if school else 'learner_ref_id'):subject,'action':action}
    if extra:body.update(extra)
    headers={'apikey':t.C['PUBLISHABLE_KEY'],'Content-Type':'application/json','Content-Profile':'portal','Accept-Profile':'portal'}
    if token:headers['Authorization']='Bearer '+token
    req=urllib.request.Request(t.C['API_URL']+'/rest/v1/rpc/'+('record_cohort_delivery' if school else 'record_mission_progress'),headers=headers,data=json.dumps(body).encode())
    try:r=urllib.request.urlopen(req,timeout=15)
    except urllib.error.HTTPError as e:r=e
    return r.status,json.loads(r.read())
def api(token,body=None,subject=None):
    path='/api/portal/progress'
    if body is None:path+='?workspace_id='+W+'&program_version_id='+V+('&subject_id='+subject if subject else '')
    return t.request(t.APP,path,body,cookie='aiea_portal_local='+token)
def snapshot():
    tables=t.sql("select tablename from pg_tables where schemaname='portal' order by tablename").splitlines()
    query=' union all '.join("select '"+table+"|'||md5(coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb)::text) from portal."+table+' x' for table in tables)
    return dict(row.split('|',1) for row in t.sql(query+';').splitlines())
def delta(a,b):return {k for k in a if a[k]!=b[k]}
def status_rows():
    q=" union all ".join("select '"+table+"/'||id::text||'|'||md5(to_jsonb(x)::text) from portal."+table+' x' for table in ['mission_progress','cohort_mission_delivery'])
    return dict(row.split('|',1) for row in t.sql(q+';').splitlines() if row)
def exact_status_change(before,table,subject,mission):
    after=status_rows();changed={k for k in set(before)|set(after) if before.get(k)!=after.get(k)}
    key='learner_ref_id' if table=='mission_progress' else 'cohort_id'
    target=t.sql('select id from portal.'+table+' where '+key+'='+t.quote(subject)+' and mission_id='+t.quote(mission)+';')
    return changed=={table+'/'+target}
def setup():
    assert t.sql("select count(*) from portal.program where id='"+uid(1)+"';")=='0'
    st,p,_=t.request(t.C['API_URL'],'/auth/v1/admin/users',{'email':'portal-01d-publisher-'+str(time.time_ns())+'@example.invalid','email_confirm':True},admin=True);assert st==200
    users['18']={'id':p['id'],'email':p['email']}
    t.sql('insert into portal.user_profile(user_id,adult_confirmed_at) values ('+t.quote(p['id'])+',now());')
    token=fresh(18)
    st,f,_=t.request(t.C['API_URL'],'/auth/v1/factors',{'factor_type':'totp','friendly_name':'01D local publication'},token);assert st==200
    st,ch,_=t.request(t.C['API_URL'],'/auth/v1/factors/'+f['id']+'/challenge',{},token);assert st==200
    secret=f['totp']['secret'];key=base64.b32decode(secret+'='*(-len(secret)%8));d=hmac.new(key,struct.pack('>Q',int(time.time())//30),hashlib.sha1).digest();o=d[-1]&15
    code=str((struct.unpack('>I',d[o:o+4])[0]&0x7fffffff)%1000000).zfill(6)
    st,a,_=t.request(t.C['API_URL'],'/auth/v1/factors/'+f['id']+'/verify',{'challenge_id':ch['id'],'code':code},token);assert st==200
    token=a['access_token'];claim=n.claim_sql(token)
    statements=['begin;',claim,'insert into portal.staff_authorization(user_id,capabilities) values ('+t.quote(p['id'])+",array['CURRICULUM_PUBLISH']);", "insert into portal.program(id,program_key) values ('"+uid(1)+"','synthetic-01d');"]
    for vn in range(1,4):
        v=uid(100+vn);rules='{}' if vn==3 else '{"method":"ADULT_ATTESTATION"}'
        statements.append("insert into portal.program_version(id,program_id,version_key,default_locale,fallback_locale,completion_rules) values ('"+v+"','"+uid(1)+"','01d-v"+str(vn)+"','en-US','en-US','"+rules+"');")
        statements.append("insert into portal.program_version_locale(program_version_id,locale_code,title,status) values ('"+v+"','en-US','Synthetic 01D "+str(vn)+"','PUBLISHED');")
        for seq in (range(1,15) if vn==1 else [1]):
            m=uid(vn*1000+seq);mr='{"method":"ADULT_ATTESTATION"}';er='{"required":false}'
            if seq==2:mr='{}'
            if seq==3:mr='{"method":"UNKNOWN"}'
            if seq==4:mr='{"method":"ADULT_ATTESTATION","assessment":true}'
            if seq==5:er='{"required":true}'
            if seq==6:er='{}'
            statements.append("insert into portal.mission(id,program_version_id,mission_key,sequence,completion_rules,evidence_expectations) values ('"+m+"','"+v+"','mission-"+str(seq)+"',"+str(seq)+",'"+mr+"','"+er+"');")
            statements.append("insert into portal.mission_locale(mission_id,program_version_id,locale_code,title,instructions,status) values ('"+m+"','"+v+"','en-US','Status mission "+str(seq)+"','Synthetic status instructions','PUBLISHED');")
        statements.append("update portal.program_version set status='REVIEW_READY' where id='"+v+"';update portal.program_version set status='PUBLISHED',content_hash=repeat('d',64) where id='"+v+"';")
    statements+=['commit;'];t.sql('\n'.join(statements))
    for wn,actor in [(W,2),(S,4)]:
        for vn in range(1,4):
            v=uid(100+vn);b=uid((200 if wn==W else 300)+vn)
            t.sql('begin;'+n.claim_sql(fresh(actor))+"insert into portal.billing_reference(id,workspace_id,program_version_id,offering_key,environment,idempotency_key,stripe_account_id,stripe_product_id,stripe_price_id,status) values ('"+b+"','"+wn+"','"+v+"','synthetic-01d','test','"+b+"','acct_synthetic','prod_synthetic','price_synthetic','PAID');insert into portal.entitlement(workspace_id,program_version_id,billing_reference_id) values ('"+wn+"','"+v+"','"+b+"');commit;")
    t.sql('begin;'+claim+"update portal.program_version set status='RETIRED' where id='"+VR+"';commit;")
    t.sql("insert into portal.learner_ref(id,workspace_id,display_code) values ('"+uid(41)+"','"+W+"','Retry learner');insert into portal.learner_ref(id,workspace_id,display_code,status) values ('"+uid(42)+"','"+W+"','Inactive learner','INACTIVE');")
    path=t.CREDS.parent/'progress-fixtures.json';path.write_text(json.dumps({'users':users,'version':V,'retired_version':VR,'mission':uid(1001),'learner':L,'cohort':C}));path.chmod(0o600)
    check('synthetic 01D fixture published through genuine managed TOTP guard',True)

def main():

    if '--reuse-fixtures' not in sys.argv:setup()
    tokens={i:fresh(i) for i in [2,3,4,8,16]};adult=tokens[2]
    check('new migration keeps authenticated table DML denied',t.sql("select count(*) from pg_tables where schemaname='portal' and has_table_privilege('authenticated',format('%I.%I',schemaname,tablename),'INSERT,UPDATE,DELETE');")=='0')
    check('new RPCs have only authenticated ordinary grants',t.sql("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='portal' and p.proname in ('record_mission_progress','record_cohort_delivery') and has_function_privilege('authenticated',p.oid,'EXECUTE') and not has_function_privilege('anon',p.oid,'EXECUTE') and not has_function_privilege('service_role',p.oid,'EXECUTE');")=='2')
    before=snapshot();st,data,h=api(adult,subject=L)
    check('GET projects subject/status under exact workspace/version',st==200 and data['subject_id']==L and data['missions'][0]['completion_allowed'] and 'no-store' in h['Cache-Control'])
    check('status browsing changes none of all 28 domains',snapshot()==before)
    check('anonymous direct RPC denied',rpc(None)[0] in [401,403])
    check('direct RPC rejects forged actor argument',rpc(adult,extra={'actor_user_id':users['4']['id']})[0]>=400)
    check('completion before start denied',rpc(adult,'complete')[0]==400)
    before=snapshot();row_before=status_rows();st,data=rpc(adult)
    check('native direct RPC start succeeds with managed adult session',st==200 and data['status']=='IN_PROGRESS')
    check('start changes only intended progress and audit domains',delta(before,snapshot())=={'mission_progress','audit_event'})
    check('start changes exactly the selected learner/mission row',exact_status_change(row_before,'mission_progress',L,uid(1001)))
    before=snapshot();check('duplicate start returns existing state',rpc(adult)[1]['status']=='IN_PROGRESS')
    check('duplicate start is byte-identical across all domains',snapshot()==before)
    before=snapshot();row_before=status_rows();check('supported explicit adult completion succeeds',rpc(adult,'complete')[1]['status']=='COMPLETED')
    check('complete changes only progress and audit domains',delta(before,snapshot())=={'mission_progress','audit_event'})
    check('completion changes exactly the selected learner/mission row',exact_status_change(row_before,'mission_progress',L,uid(1001)))
    before=snapshot();rpc(adult,'complete');rpc(adult,'start')
    check('duplicate terminal and late start preserve every domain',snapshot()==before)
    check('progress creator and audit updater derive native adult',t.sql("select actor_user_id::text from portal.mission_progress where learner_ref_id='"+L+"' and mission_id='"+uid(1001)+"';")==users['2']['id'])
    for seq in range(2,7):
        check('unsupported mission '+str(seq)+' can start',rpc(adult,m=uid(1000+seq))[0]==200)
        before=snapshot();check('unsupported completion '+str(seq)+' denied',rpc(adult,'complete',m=uid(1000+seq))[0]==400)
        check('unsupported completion '+str(seq)+' changes no domain',snapshot()==before)
    rpc(adult,v=VU,m=uid(3001));check('absent version completion rules deny complete',rpc(adult,'complete',v=VU,m=uid(3001))[0]==400)
    check('RETIRED exact entitled version can start',rpc(adult,v=VR,m=uid(2001))[0]==200)
    check('RETIRED exact entitled version supports approved completion',rpc(adult,'complete',v=VR,m=uid(2001))[0]==200)
    for label,kwargs in [('cross workspace learner',{'subject':'20000000-0000-0000-0000-000000000001'}),('inactive learner',{'subject':uid(42)}),('wrong mission version',{'m':uid(2001)}),('unentitled version',{'v':uid(199)}),('SCHOOL individual progress',{'w':S,'subject':'20000000-0000-0000-0000-000000000001'})]:
        before=snapshot();check(label+' denied',rpc(adult,**kwargs)[0] in [400,403]);check(label+' no mutations',snapshot()==before)
    check('authorized SCHOOL owner cannot invoke individual progress RPC',rpc(tokens[16],w=S,subject='20000000-0000-0000-0000-000000000001')[0]==403)
    check('authorized FAMILY owner cannot invoke cohort delivery RPC',rpc(adult,w=W,subject=C,school=True)[0]==403)
    check('native adult without application profile cannot write',rpc(fresh(6))[0]==403)
    check('native inactive application adult cannot write',rpc(fresh(7))[0]==403)
    for action in ['reset','delete','reopen','deliver','COMPLETED']:
        check('unsupported FAMILY action '+action+' denied',rpc(adult,action)[0]==400)
    body={'workspace_id':W,'program_version_id':V,'mission_id':uid(1007),'subject_id':L,'action':'start'}
    before=snapshot();st,_,_=api(adult,body);check('same-origin application write succeeds',st==200)
    check('application start only progress/audit',delta(before,snapshot())=={'mission_progress','audit_event'})
    before=snapshot();st,_,_=api(adult,body);check('lost acknowledgement retry succeeds idempotently',st==200 and snapshot()==before)
    check('selected SCHOOL workspace cannot borrow FAMILY subject',api(tokens[8],{**body,'workspace_id':S})[0] in [400,404])
    for seq,(i,label) in enumerate([(3,'assigned teacher'),(4,'school admin'),(16,'school owner')],8):
        m=uid(1000+seq)
        check(label+' can start exact authorized cohort',rpc(tokens[i],w=S,subject=C,m=m,school=True)[0]==200)
        before=snapshot();row_before=status_rows();check(label+' can deliver exact cohort',rpc(tokens[i],'deliver',w=S,subject=C,m=m,school=True)[0]==200)
        check(label+' delivery changes only cohort delivery/audit',delta(before,snapshot())=={'cohort_mission_delivery','audit_event'})
        check(label+' delivery changes exactly selected cohort/mission row',exact_status_change(row_before,'cohort_mission_delivery',C,m))
        before=snapshot();rpc(tokens[i],'deliver',w=S,subject=C,m=m,school=True);rpc(tokens[i],'start',w=S,subject=C,m=m,school=True)
        check(label+' terminal retries mutate no domain',snapshot()==before)
    before=snapshot();check('unassigned teacher direct RPC denied',rpc(tokens[8],w=S,subject=C,school=True)[0]==403)
    check('assigned teacher different cohort denied',rpc(tokens[3],w=S,subject=C2,school=True)[0]==403)
    check('teacher denials change no domain',snapshot()==before)
    check('SCHOOL completion action denied',rpc(tokens[4],'complete',w=S,subject=C,school=True)[0]==400)
    check('SCHOOL deliver without explicit start denied',rpc(tokens[4],'deliver',w=S,subject=C,m=uid(1014),school=True)[0]==400)
    for table,condition,field,value,token,kwargs,label in [
        ('learner_ref',"id='"+L+"'",'status','INACTIVE',adult,{},'inactive family learner'),
        ('cohort',"id='"+C+"'",'status','INACTIVE',tokens[3],{'w':S,'subject':C,'school':True},'inactive school cohort'),
        ('cohort_teacher_assignment',"cohort_id='"+C+"'",'status','REVOKED',tokens[3],{'w':S,'subject':C,'school':True},'revoked exact teacher assignment'),
        ('workspace',"id='"+W+"'",'status','INACTIVE',adult,{},'inactive workspace'),
        ('workspace_membership',"workspace_id='"+W+"' and user_id='"+users['2']['id']+"'",'status','REVOKED',adult,{},'revoked membership'),
        ('user_profile',"user_id='"+users['2']['id']+"'",'status','INACTIVE',adult,{},'inactive adult profile'),
        ('entitlement',"workspace_id='"+W+"' and program_version_id='"+V+"'",'status','SUSPENDED',adult,{},'suspended entitlement'),
        ('entitlement',"workspace_id='"+W+"' and program_version_id='"+V+"'",'status','REVOKED',adult,{},'revoked entitlement')]:
        t.sql('update portal.'+table+' set '+field+'='+t.quote(value)+' where '+condition+';');before=snapshot()
        check(label+' direct RPC denied',rpc(token,**kwargs)[0]==403);check(label+' denial has no side effects',snapshot()==before)
        t.sql('update portal.'+table+' set '+field+"='ACTIVE' where "+condition+';')
    # Actual signed tokens retain genuine session_id unless deliberately replaced.
    for mode in ['expired-jwt','missing-session','other-adult-session','expired-managed','assurance-changed','advanced-generation','banned-account','deleted-account','native-signout']:
        token=fresh(2);j=t.claims(token);sid=j['session_id']
        if mode=='expired-jwt':j['exp']=int(time.time())-10;token=signed(j)
        if mode=='missing-session':j['session_id']=uid(999);token=signed(j)
        if mode=='other-adult-session':j['session_id']=t.claims(tokens[3])['session_id'];token=signed(j)
        if mode=='expired-managed':t.sql("update auth.sessions set not_after=now()-interval '1 second' where id='"+sid+"';")
        if mode=='assurance-changed':t.sql("update auth.sessions set aal='aal2' where id='"+sid+"';")
        # HR03 replaces timestamp freshness with issuer-bound generation authority.
        if mode=='advanced-generation':t.sql("update portal_private.write_session_generation set generation=nextval('portal_private.write_generation_seq') where session_id='"+sid+"';")
        if mode=='banned-account':t.sql("update auth.users set banned_until=now()+interval '1 hour' where id='"+users['2']['id']+"';")
        if mode=='deleted-account':t.sql("update auth.users set deleted_at=now() where id='"+users['2']['id']+"';")
        if mode=='native-signout':
            check('genuine native signout succeeds',t.request(t.C['API_URL'],'/auth/v1/logout?scope=local',{},token)[0]==204)
            check('native signout deletes exact managed session',t.sql("select count(*) from auth.sessions where id='"+sid+"';")=='0')
            check('SNV06 negative control ordinary stateless SELECT still accepts signed-out JWT',t.request(t.C['API_URL'],'/rest/v1/mission?select=id&limit=1',token=token)[0]==200)
        before=snapshot();check(mode+' direct write denied',rpc(token,m=uid(1011))[0] in [401,403]);check(mode+' no domain mutation',snapshot()==before)
        if mode in ['banned-account','deleted-account']:t.sql("update auth.users set banned_until=null,deleted_at=null where id='"+users['2']['id']+"';")
        if mode in ['native-signout','expired-managed','assurance-changed']:
            check(mode+' application write denied',api(token,{**body,'mission_id':uid(1011)})[0] in [401,403])
    # Genuine native refresh proves that historical JWTs in a live refreshed
    # session cannot use the new write boundary (ordinary stateless reads persist).
    original=fresh(2,full=True);old=original['access_token']
    while time.time()<t.claims(old)['iat']+1.1:time.sleep(.05)
    st,current,_=t.request(t.C['API_URL'],'/auth/v1/token?grant_type=refresh_token',{'refresh_token':original['refresh_token']})
    check('genuine native session refresh succeeds',st==200)
    before=snapshot();check('pre-refresh JWT cannot invoke write RPC',rpc(old,m=uid(1011))[0]==403)
    check('pre-refresh write denial changes no domain',snapshot()==before)
    check('freshly issued refreshed session JWT can write',rpc(current['access_token'],m=uid(1011))[0]==200)
    # Real concurrent HTTP requests, unique absent-row key and stable audit count.
    before=int(t.sql("select count(*) from portal.audit_event where object_type='mission_progress';"))
    with ThreadPoolExecutor(max_workers=8) as pool:answers=list(pool.map(lambda _:rpc(adult,m=uid(1012),subject=uid(41)),range(8)))
    check('eight simultaneous starts all succeed',all(st==200 and d['status']=='IN_PROGRESS' for st,d in answers))
    check('concurrent start creates exactly one row',t.sql("select count(*) from portal.mission_progress where learner_ref_id='"+uid(41)+"' and mission_id='"+uid(1012)+"';")=='1')
    check('concurrent start creates exactly one audit',int(t.sql("select count(*) from portal.audit_event where object_type='mission_progress';"))==before+1)
    with ThreadPoolExecutor(max_workers=8) as pool:answers=list(pool.map(lambda _:rpc(adult,'complete',m=uid(1012),subject=uid(41)),range(8)))
    check('eight simultaneous completions all succeed',all(st==200 and d['status']=='COMPLETED' for st,d in answers))
    check('concurrent completion creates exactly one further audit',int(t.sql("select count(*) from portal.audit_event where object_type='mission_progress';"))==before+2)
    school_audit=int(t.sql("select count(*) from portal.audit_event where object_type='cohort_mission_delivery';"))
    with ThreadPoolExecutor(max_workers=8) as pool:answers=list(pool.map(lambda i:rpc(tokens[[3,4,16][i%3]],w=S,subject=C,m=uid(1011),school=True),range(8)))
    check('eight concurrent SCHOOL starts all succeed',all(st==200 and d['status']=='STARTED' for st,d in answers))
    check('concurrent SCHOOL start creates one audit',int(t.sql("select count(*) from portal.audit_event where object_type='cohort_mission_delivery';"))==school_audit+1)
    with ThreadPoolExecutor(max_workers=8) as pool:answers=list(pool.map(lambda i:rpc(tokens[[3,4,16][i%3]],'deliver',w=S,subject=C,m=uid(1011),school=True),range(8)))
    check('eight concurrent SCHOOL deliveries all succeed',all(st==200 and d['status']=='DELIVERED' for st,d in answers))
    check('concurrent SCHOOL delivery creates one further audit',int(t.sql("select count(*) from portal.audit_event where object_type='cohort_mission_delivery';"))==school_audit+2)
    # Hold an uncommitted authorization revocation, verify RPC waits then denies.
    statements=[('learner',"update portal.learner_ref set status='INACTIVE' where id='"+uid(41)+"';", "update portal.learner_ref set status='ACTIVE' where id='"+uid(41)+"';",adult,{'subject':uid(41),'m':uid(1013)}),
        ('assignment',"update portal.cohort_teacher_assignment set status='REVOKED' where cohort_id='"+C+"';","update portal.cohort_teacher_assignment set status='ACTIVE' where cohort_id='"+C+"';",tokens[3],{'w':S,'subject':C,'school':True,'m':uid(1013)}),
        ('membership',"update portal.workspace_membership set status='REVOKED' where workspace_id='"+W+"' and user_id='"+users['2']['id']+"';","update portal.workspace_membership set status='ACTIVE' where workspace_id='"+W+"' and user_id='"+users['2']['id']+"';",adult,{'m':uid(1013)}),
        ('entitlement',"update portal.entitlement set status='SUSPENDED' where workspace_id='"+W+"' and program_version_id='"+V+"';","update portal.entitlement set status='ACTIVE' where workspace_id='"+W+"' and program_version_id='"+V+"';",adult,{'m':uid(1013)}),
        ('profile',"update portal.user_profile set status='INACTIVE' where user_id='"+users['2']['id']+"';","update portal.user_profile set status='ACTIVE' where user_id='"+users['2']['id']+"';",adult,{'m':uid(1013)}),
        ('session',"delete from auth.sessions where id='"+t.claims(fresh(2))['session_id']+"';",'',None,{})]
    # Session race uses its own current token; regenerate statement to bind it.
    race_token=fresh(2);statements[-1]=('session',"delete from auth.sessions where id='"+t.claims(race_token)['session_id']+"';",'',race_token,{'m':uid(1013)})
    for label,mutation,restore,token,kwargs in statements:
        cmd=['docker','exec','-i','supabase_db_aiea-portal-local','psql','-X','-At','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres']
        proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
        proc.stdin.write("begin;set application_name='aiea_01d_race';"+mutation+'select pg_sleep(1.5);commit;');proc.stdin.close()
        deadline=time.monotonic()+8
        while time.monotonic()<deadline:
            if t.sql("select count(*) from pg_stat_activity where application_name='aiea_01d_race' and wait_event='PgSleep';")=='1':break
            time.sleep(.03)
        else:raise SystemExit('Race synchronization failed')
        st,_=rpc(token,**kwargs);proc.wait(timeout=10)
        check(label+' uncommitted revocation wins before write',st==403 and proc.returncode==0)
        if restore:t.sql(restore)
    check('no SCHOOL learner progress created',t.sql("select count(*) from portal.mission_progress where workspace_id='"+S+"';")=='0')
    out=t.CREDS.parent/'progress-native-results.json';out.write_text(json.dumps(results,indent=2))
    print('PASS '+str(len(results))+' 01D native checks',flush=True)

if __name__=='__main__':main()
