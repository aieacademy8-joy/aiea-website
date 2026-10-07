-- Run only against an EMPTY local migration test database. Every fixture rolls back.
-- psql path after local `supabase start`/`supabase db reset --local --no-seed`:
-- psql -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p 54322 -U postgres -d postgres -f supabase/tests/foundation.sql
-- No provider API, real account, auth email, or production database is involved.
begin;
create function pg_temp.ok(value boolean,label text) returns text
language plpgsql as $$ begin
  if value is distinct from true then raise exception 'FAIL %',label; end if;
  return 'PASS '||label;
end $$;
create function pg_temp.denied(statement text,expected_state text,label text) returns text
language plpgsql as $$ begin
  begin execute statement;
  exception when others then
    if sqlstate=expected_state then return 'PASS '||label; end if;
    raise exception 'FAIL %: expected %, got % (%)',label,expected_state,sqlstate,sqlerrm;
  end;
  raise exception 'FAIL %: operation unexpectedly succeeded',label;
end $$;

insert into auth.users(id) select ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,5) n;
-- Synthetic managed assurance fixtures, rolled back with every other fixture.
-- Native integration tests separately enroll/challenge/verify real Auth factors.
insert into auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at)
 select ('02000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,
 ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'totp','verified',now(),now() from generate_series(1,5) n;
insert into auth.sessions(id,user_id,factor_id,aal)
 select ('03000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,
 ('00000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,
 ('02000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'aal2' from generate_series(1,5) n;
insert into portal.user_profile(user_id,adult_confirmed_at) select id,now() from auth.users where id::text like '00000000-0000-0000-0000-%';
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":"aal2","amr":[{"method":"totp"}]}',true);
insert into portal.staff_authorization(user_id,capabilities) values
 ('00000000-0000-0000-0000-000000000001',array['STAFF_MANAGE','CURRICULUM_PUBLISH','SUPPORT_READ']);
insert into portal.workspace(id,kind,display_name) values
 ('10000000-0000-0000-0000-000000000001','SCHOOL','Synthetic school A'),
 ('10000000-0000-0000-0000-000000000002','FAMILY','Synthetic family'),
 ('10000000-0000-0000-0000-000000000003','SCHOOL','Synthetic school B');
insert into portal.workspace_membership(id,workspace_id,workspace_kind,user_id,role) values
 ('11000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','FAMILY','00000000-0000-0000-0000-000000000002','OWNER'),
 ('11000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','SCHOOL','00000000-0000-0000-0000-000000000003','TEACHER'),
 ('11000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','SCHOOL','00000000-0000-0000-0000-000000000004','SCHOOL_ADMIN');
insert into portal.learner_ref(id,workspace_id,display_code) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','L1'),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','L2'),
 ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000003','L3'),
 ('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000002','L4');
insert into portal.cohort(id,workspace_id,display_code) values
 ('21000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','C1'),
 ('21000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','C2');
insert into portal.cohort_teacher_assignment(workspace_id,cohort_id,workspace_membership_id) values
 ('10000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000003');
insert into portal.cohort_learner_assignment(workspace_id,cohort_id,learner_ref_id) values
 ('10000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001'),
 ('10000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002');
insert into portal.program(id,program_key) values ('30000000-0000-0000-0000-000000000001','synthetic-pilot');
insert into portal.program_version(id,program_id,version_key,default_locale,fallback_locale) values
 ('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','v1','en-US','en-US'),
 ('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','v2','en-US',null);
insert into portal.program_version_locale(program_version_id,locale_code,title,status)
 select id,'en-US','Synthetic title','PUBLISHED' from portal.program_version;
insert into portal.mission(id,program_version_id,mission_key,sequence) values
 ('50000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','m1',1),
 ('50000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000002','m2',1);
insert into portal.mission_locale(mission_id,program_version_id,locale_code,title,instructions,status)
 select id,program_version_id,'en-US','Synthetic mission','Synthetic instructions','PUBLISHED' from portal.mission;
insert into portal.assessment(id,program_version_id,assessment_key,phase) values
 ('60000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','pre','PRE'),
 ('60000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000002','pre','PRE');
insert into portal.assessment_locale(assessment_id,program_version_id,locale_code,title,instructions,status)
 select id,program_version_id,'en-US','Synthetic pre','Synthetic instructions','PUBLISHED' from portal.assessment;
insert into portal.assessment_item(id,assessment_id,program_version_id,item_key,sequence,response_option_keys) values
 ('70000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','q1',1,array['yes','no']),
 ('70000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000002','q1',1,array['yes','no']);
insert into portal.assessment_item_locale(assessment_item_id,assessment_id,program_version_id,locale_code,prompt,response_option_labels,status)
 select id,assessment_id,program_version_id,'en-US','Synthetic prompt','{"yes":"Yes","no":"No"}'::jsonb,'PUBLISHED' from portal.assessment_item;
set constraints all immediate;
update portal.program_version set status='REVIEW_READY';
update portal.mission_locale set status='DRAFT' where mission_id='50000000-0000-0000-0000-000000000001';
select pg_temp.denied($q$update portal.program_version set status='PUBLISHED',content_hash=repeat('a',64) where id='40000000-0000-0000-0000-000000000001'$q$,'23514','F05 incomplete mission locale rejects publication') as result;
update portal.mission_locale set status='PUBLISHED' where mission_id='50000000-0000-0000-0000-000000000001';
update portal.program_version set status='PUBLISHED',content_hash=repeat('a',64);
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000004","session_id":"03000000-0000-0000-0000-000000000004","aal":"aal1"}',true);
insert into portal.billing_reference(id,workspace_id,program_version_id,initiating_user_id,offering_key,environment,idempotency_key,stripe_account_id,stripe_product_id,stripe_price_id,status) values
 ('80000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004','test-offer','test','synthetic-school','acct_synthetic','prod_synthetic','price_synthetic','PAID');
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000002","session_id":"03000000-0000-0000-0000-000000000002","aal":"aal1"}',true);
insert into portal.billing_reference(id,workspace_id,program_version_id,initiating_user_id,offering_key,environment,idempotency_key,stripe_account_id,stripe_product_id,stripe_price_id,status) values
 ('80000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','test-offer','test','synthetic-family','acct_synthetic','prod_synthetic','price_synthetic','PAID');
insert into portal.entitlement(workspace_id,program_version_id,billing_reference_id) select workspace_id,program_version_id,id from portal.billing_reference;

select pg_temp.ok((select count(*)=28 from pg_tables where schemaname='portal'),'exact frozen 28-domain inventory') as result;
select pg_temp.ok(not exists(select 1 from pg_tables where schemaname='portal' and not rowsecurity),'RLS enabled on all private tables') as result;
select pg_temp.ok(not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='portal' and c.relkind='r' and has_table_privilege('authenticated',c.oid,'INSERT,UPDATE,DELETE')),'browser mutations denied on every domain') as result;
select pg_temp.ok(not has_table_privilege('service_role','portal.audit_event','INSERT,UPDATE,DELETE'),'service cannot fabricate or rewrite audit') as result;
select pg_temp.ok(exists(select 1 from portal.audit_event where object_type='staff_authorization' and actor_user_id='00000000-0000-0000-0000-000000000001'),'staff bootstrap is attributed and audited') as result;
select pg_temp.denied($q$insert into portal.cohort_learner_assignment(workspace_id,cohort_id,learner_ref_id) values ('10000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003')$q$,'23503','learner/cohort cross-workspace FK denial') as result;
select pg_temp.denied($q$insert into portal.entitlement(workspace_id,program_version_id,billing_reference_id) values ('10000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000001')$q$,'23503','entitlement/workspace/billing mismatch') as result;
select pg_temp.denied($q$insert into portal.entitlement(workspace_id,program_version_id,billing_reference_id) values ('10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002','80000000-0000-0000-0000-000000000001')$q$,'23503','entitlement exact-version mismatch') as result;
select pg_temp.denied($q$update portal.mission set mission_key='silently-changed'$q$,'23514','published structure immutable') as result;
select pg_temp.denied($q$update portal.mission_locale set instructions='silently-changed'$q$,'23514','published locale immutable') as result;
select pg_temp.denied($q$update portal.mission set program_version_id='40000000-0000-0000-0000-000000000002' where id='50000000-0000-0000-0000-000000000001'$q$,'23514','published child cannot be reparented') as result;
select pg_temp.denied($q$update portal.program_version set status='DRAFT'$q$,'23514','published version cannot revert to draft') as result;
select pg_temp.denied($q$delete from portal.audit_event$q$,'23514','audit append-only guard') as result;
select pg_temp.denied($q$update portal.billing_reference set subscription_id='sub_synthetic'$q$,'23514','subscriptions disabled') as result;
select pg_temp.denied($q$update portal.billing_reference set workspace_id='10000000-0000-0000-0000-000000000003'$q$,'23514','purchase correlation cannot be moved') as result;
select pg_temp.denied($q$update portal.billing_reference set status='REFUNDED' where id='80000000-0000-0000-0000-000000000001'$q$,'23514','full refund cannot leave entitlement active') as result;
select pg_temp.denied($q$update portal.billing_reference set status='DISPUTE_LOST' where id='80000000-0000-0000-0000-000000000001'$q$,'23514','final dispute loss cannot leave entitlement active') as result;
set constraints portal.billing_access_guard, portal.entitlement_billing_access_guard deferred;
update portal.billing_reference set status='REFUNDED' where id='80000000-0000-0000-0000-000000000001';
update portal.entitlement set status='REVOKED' where billing_reference_id='80000000-0000-0000-0000-000000000001';
set constraints all immediate;
select pg_temp.ok((select count(*)=1 from portal.entitlement where billing_reference_id='80000000-0000-0000-0000-000000000001' and status='REVOKED'),'atomic refund/revocation transaction succeeds') as result;
update portal.billing_reference set status='PAID' where id='80000000-0000-0000-0000-000000000001';
update portal.entitlement set status='ACTIVE' where billing_reference_id='80000000-0000-0000-0000-000000000001';
insert into portal.stripe_event(provider_event_id,billing_reference_id,environment,stripe_account_id,event_type,provider_object_id,payload_hash,provider_created_at)
 values ('evt_synthetic','80000000-0000-0000-0000-000000000001','test','acct_synthetic','payment_intent.succeeded','pi_synthetic',repeat('a',64),now());
select pg_temp.denied($q$insert into portal.stripe_event(provider_event_id,environment,stripe_account_id,event_type,provider_object_id,payload_hash,provider_created_at) values ('evt_synthetic','test','acct_synthetic','payment_intent.succeeded','pi_synthetic',repeat('a',64),now())$q$,'23505','duplicate provider event denied') as result;
select pg_temp.denied($q$update portal.stripe_event set environment='live'$q$,'23514','event environment/billing mismatch denied') as result;
select pg_temp.denied($q$insert into portal.workspace_membership(workspace_id,workspace_kind,user_id,role) values ('10000000-0000-0000-0000-000000000002','FAMILY','00000000-0000-0000-0000-000000000005','TEACHER')$q$,'23514','family teacher role prohibited') as result;
select pg_temp.denied($q$insert into portal.cohort(workspace_id,display_code) values ('10000000-0000-0000-0000-000000000002','forbidden')$q$,'23503','family cohort prohibited') as result;
set local role authenticated;
select pg_temp.ok((select count(*)=1 from portal.learner_ref),'family owner reads only family learner') as result;
select pg_temp.ok((select count(*)=0 from portal.cohort),'family owner has no school cohort visibility') as result;
reset role;

-- Backend writes use verified end-user context; supplied actor IDs are ignored.
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000004","session_id":"03000000-0000-0000-0000-000000000004","aal":"aal1"}',true);
set local role service_role;
insert into portal.mission_progress(id,workspace_id,learner_ref_id,mission_id,program_version_id,actor_user_id) values
 ('90000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000005');
select pg_temp.ok((select actor_user_id='00000000-0000-0000-0000-000000000004' from portal.mission_progress where id='90000000-0000-0000-0000-000000000001'),'actor derived from verified session') as result;
select pg_temp.denied($q$insert into portal.mission_progress(workspace_id,learner_ref_id,mission_id,program_version_id) values ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001')$q$,'23503','mission/program-version mismatch') as result;
insert into portal.assessment_attempt(id,workspace_id,learner_ref_id,assessment_id,program_version_id,locale_code) values
 ('91000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','en-US');
insert into portal.assessment_response(assessment_attempt_id,assessment_item_id,assessment_id,program_version_id,response_option_key) values
 ('91000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','yes');
select pg_temp.denied($q$update portal.assessment_response set response_option_key='Translated label'$q$,'23514','response identity uses structural option key') as result;
select pg_temp.denied($q$insert into portal.assessment_response(assessment_attempt_id,assessment_item_id,assessment_id,program_version_id,response_option_key) values ('91000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','yes')$q$,'23503','response item/assessment mismatch') as result;
update portal.assessment_attempt set status='FINALIZED',finalized_at=now();
select pg_temp.denied($q$update portal.assessment_response set response_option_key='no'$q$,'23514','finalized response immutable') as result;
select pg_temp.denied($q$update portal.assessment_attempt set locale_code='fr-FR'$q$,'23514','finalized attempt immutable') as result;
insert into portal.evidence_record(id,workspace_id,learner_ref_id,program_version_id,mission_id,evidence_type,note,entered_locale,status,submitted_at) values
 ('92000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','OBSERVATION','Synthetic note','en-US','SUBMITTED',now());
select pg_temp.denied($q$update portal.evidence_record set note='silent edit'$q$,'23514','submitted evidence immutable') as result;
select pg_temp.denied($q$insert into portal.staff_authorization(user_id,capabilities) values ('00000000-0000-0000-0000-000000000005',array['SUPPORT_READ'])$q$,'42501','service cannot bootstrap unauthorized staff') as result;
insert into portal.pilot_feedback(workspace_id,program_version_id,cohort_id,learner_ref_id,note,entered_locale) values
 ('10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Synthetic feedback','en-US');
select pg_temp.denied($q$insert into portal.pilot_feedback(workspace_id,program_version_id,cohort_id,learner_ref_id,note,entered_locale) values ('10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','Synthetic feedback','en-US')$q$,'23514','feedback learner/cohort mismatch denied') as result;
reset role;

-- Teacher sees one assigned learner/cohort; admin sees the school only.
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000003","session_id":"03000000-0000-0000-0000-000000000003","aal":"aal1"}',true);
set local role authenticated;
select pg_temp.ok((select count(*)=1 from portal.learner_ref),'teacher assigned learner only') as result;
select pg_temp.ok((select count(*)=1 from portal.cohort),'unassigned teacher/cohort denial') as result;
select pg_temp.ok((select count(*)=1 from portal.program_version),'entitlement denies other program version') as result;
select pg_temp.ok((select count(*)=1 from portal.workspace),'cross-workspace RLS denial') as result;
select pg_temp.ok((select count(*)=0 from portal.pilot_feedback),'teacher cannot read another adult private feedback') as result;
select pg_temp.denied('select billing_reference_id from portal.entitlement','42501','billing basis hidden from entitlement summary') as result;
select pg_temp.denied('select * from portal.billing_reference','42501','raw billing hidden from teacher') as result;
select pg_temp.denied('select * from portal.staff_authorization','42501','raw staff grants hidden') as result;
select pg_temp.denied('insert into portal.audit_event(action,object_type,object_id) values (''FORGED'',''test'',''test'')','42501','browser cannot forge audit actor') as result;
reset role;
set local role service_role;
select pg_temp.denied($q$insert into portal.cohort_mission_delivery(workspace_id,cohort_id,mission_id,program_version_id) values ('10000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001')$q$,'42501','server learning guard denies unassigned teacher cohort') as result;
select pg_temp.denied($q$insert into portal.billing_reference(workspace_id,program_version_id,offering_key,environment,idempotency_key,stripe_account_id,stripe_product_id,stripe_price_id) values ('10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','forged','test','forged','acct_synthetic','prod_synthetic','price_synthetic')$q$,'42501','teacher has no purchasing authority') as result;
reset role;
update portal.cohort_teacher_assignment set status='REVOKED';
set local role authenticated;
select pg_temp.ok((select count(*)=0 from portal.learner_ref),'assignment revocation removes learner access immediately') as result;
select pg_temp.ok((select count(*)=0 from portal.mission_progress),'assignment revocation removes historical record access') as result;
reset role;
select pg_temp.ok((select count(*)=1 from portal.mission_progress),'revocation retains historical learning') as result;
update portal.cohort_teacher_assignment set status='ACTIVE';
update portal.workspace_membership set status='REVOKED' where role='TEACHER';
set local role authenticated;
select pg_temp.ok((select count(*)=0 from portal.workspace),'inactive membership authorizes nothing') as result;
reset role;
update portal.workspace_membership set status='ACTIVE' where role='TEACHER';
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000004","session_id":"03000000-0000-0000-0000-000000000004","aal":"aal1"}',true);
set local role authenticated;
select pg_temp.ok((select count(*)=2 from portal.learner_ref),'explicit school admin sees school learners') as result;
select pg_temp.ok((select count(*)=1 from portal.workspace),'school admin cannot cross workspaces') as result;
reset role;
update portal.entitlement set status='REVOKED' where workspace_id='10000000-0000-0000-0000-000000000001';
set local role authenticated;
select pg_temp.ok((select count(*)=0 from portal.program_version),'revoked entitlement denies curriculum') as result;
select pg_temp.ok((select count(*)=0 from portal.evidence_record),'revoked entitlement denies evidence access') as result;
reset role;
update portal.entitlement set status='ACTIVE' where workspace_id='10000000-0000-0000-0000-000000000001';

select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":"aal1"}',true);
select pg_temp.ok(not portal_private.staff_has('SUPPORT_READ'),'staff without aal2 denied') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":"aal2","amr":[{"method":"phone"}]}',true);
select pg_temp.ok(not portal_private.staff_has('SUPPORT_READ'),'phone-only aal2 denied for staff') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000005","session_id":"03000000-0000-0000-0000-000000000005","aal":"aal2","amr":[{"method":"totp"}]}',true);
select pg_temp.ok(not portal_private.staff_has('SUPPORT_READ'),'ordinary adult TOTP does not grant staff') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000005","session_id":"03000000-0000-0000-0000-000000000005","aal":"aal2","amr":[{"method":"totp"}],"user_metadata":{"role":"OWNER","staff":true}}',true);
select pg_temp.ok(not portal_private.staff_has('SUPPORT_READ') and portal_private.member_role('10000000-0000-0000-0000-000000000001') is null,'self-editable metadata grants no authority') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":"aal2","amr":[{"method":"totp"}]}',true);
select pg_temp.ok(portal_private.staff_has('SUPPORT_READ'),'authorized staff with TOTP aal2 passes bounded gate') as result;
select pg_temp.ok(not portal_private.staff_has('EXPORT'),'staff capability is bounded') as result;
set local role authenticated;
select pg_temp.ok((select count(*)=0 from portal.learner_ref),'staff authorization does not create broad browser access') as result;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000004","session_id":"03000000-0000-0000-0000-000000000004","aal":"aal1"}',true);
select pg_temp.ok(portal_private.resolve_locale('40000000-0000-0000-0000-000000000001','fr-FR')='en-US','explicit deterministic locale fallback') as result;
insert into portal.billing_reference(id,workspace_id,program_version_id,offering_key,environment,idempotency_key,stripe_account_id,stripe_product_id,stripe_price_id,status) values
 ('80000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002','test-offer-v2','test','synthetic-school-v2','acct_synthetic','prod_synthetic_v2','price_synthetic_v2','PAID');
insert into portal.entitlement(workspace_id,program_version_id,billing_reference_id) values
 ('10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002','80000000-0000-0000-0000-000000000003');
select pg_temp.ok(portal_private.has_version('10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002'),'F05 unavailable-locale fixture has active exact-version entitlement') as result;
select pg_temp.ok(portal_private.resolve_locale('40000000-0000-0000-0000-000000000002','en-US')='en-US','F05 entitled requested locale resolves without fallback') as result;
select pg_temp.ok(portal_private.resolve_locale('40000000-0000-0000-0000-000000000002','fr-FR') is null,'F05 entitled unavailable locale with no fallback returns null') as result;
-- Sprint 01A-C: bounded F01-F05 regressions. All claims/records are synthetic.
set constraints portal.version_default_locale deferred;
insert into portal.program_version(id,program_id,version_key,default_locale) values ('40000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000001','v3-claim-probe','en-US');
insert into portal.program_version_locale(program_version_id,locale_code,title,status) values ('40000000-0000-0000-0000-000000000003','en-US','Synthetic claim probe','PUBLISHED');
set constraints all immediate;
update portal.program_version set status='REVIEW_READY' where id='40000000-0000-0000-0000-000000000003';
set local role service_role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","amr":[{"method":"totp"}]}',true);
select pg_temp.ok(portal_private.staff_has('STAFF_MANAGE') is false,'F01 missing aal returns definite false') as result;
select pg_temp.denied($q$update portal.staff_authorization set capabilities=capabilities||array['EXPORT'] where user_id='00000000-0000-0000-0000-000000000001'$q$,'42501','F01 missing aal denies staff management') as result;
select pg_temp.denied($q$update portal.program_version set status='RETIRED' where id='40000000-0000-0000-0000-000000000002'$q$,'42501','F01 missing aal denies retirement') as result;
select pg_temp.denied($q$update portal.program_version set status='PUBLISHED',content_hash=repeat('b',64) where id='40000000-0000-0000-0000-000000000003'$q$,'42501','F01 missing aal denies publication') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":null,"amr":[{"method":"totp"}]}',true);
select pg_temp.ok(portal_private.staff_has('STAFF_MANAGE') is false,'F01 null aal returns definite false') as result;
select pg_temp.denied($q$update portal.staff_authorization set capabilities=capabilities||array['EXPORT'] where user_id='00000000-0000-0000-0000-000000000001'$q$,'42501','F01 null aal denies staff management') as result;
select pg_temp.denied($q$update portal.program_version set status='RETIRED' where id='40000000-0000-0000-0000-000000000002'$q$,'42501','F01 null aal denies retirement') as result;
select pg_temp.denied($q$update portal.program_version set status='PUBLISHED',content_hash=repeat('b',64) where id='40000000-0000-0000-0000-000000000003'$q$,'42501','F01 null aal denies publication') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":"aal1","amr":[{"method":"totp"}]}',true);
select pg_temp.ok(portal_private.staff_has('STAFF_MANAGE') is false,'F01 aal1 returns definite false') as result;
select pg_temp.denied($q$update portal.staff_authorization set capabilities=capabilities||array['EXPORT'] where user_id='00000000-0000-0000-0000-000000000001'$q$,'42501','F01 aal1 denies staff management') as result;
select pg_temp.denied($q$update portal.program_version set status='RETIRED' where id='40000000-0000-0000-0000-000000000002'$q$,'42501','F01 aal1 denies retirement') as result;
select pg_temp.denied($q$update portal.program_version set status='PUBLISHED',content_hash=repeat('b',64) where id='40000000-0000-0000-0000-000000000003'$q$,'42501','F01 aal1 denies publication') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":"aal9","amr":[{"method":"totp"}]}',true);
select pg_temp.ok(portal_private.staff_has('STAFF_MANAGE') is false,'F01 unexpected aal returns definite false') as result;
select pg_temp.denied($q$update portal.staff_authorization set capabilities=capabilities||array['EXPORT'] where user_id='00000000-0000-0000-0000-000000000001'$q$,'42501','F01 unexpected aal denies staff management') as result;
select pg_temp.denied($q$update portal.program_version set status='RETIRED' where id='40000000-0000-0000-0000-000000000002'$q$,'42501','F01 unexpected aal denies retirement') as result;
select pg_temp.denied($q$update portal.program_version set status='PUBLISHED',content_hash=repeat('b',64) where id='40000000-0000-0000-0000-000000000003'$q$,'42501','F01 unexpected aal denies publication') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":{"value":"aal2"},"amr":[{"method":"totp"}]}',true);
select pg_temp.ok(portal_private.staff_has('STAFF_MANAGE') is false,'F01 object aal returns definite false') as result;
select pg_temp.denied($q$update portal.staff_authorization set capabilities=capabilities||array['EXPORT'] where user_id='00000000-0000-0000-0000-000000000001'$q$,'42501','F01 object aal denies staff management') as result;
select pg_temp.denied($q$update portal.program_version set status='RETIRED' where id='40000000-0000-0000-0000-000000000002'$q$,'42501','F01 object aal denies retirement') as result;
select pg_temp.denied($q$update portal.program_version set status='PUBLISHED',content_hash=repeat('b',64) where id='40000000-0000-0000-0000-000000000003'$q$,'42501','F01 object aal denies publication') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":2,"amr":[{"method":"totp"}]}',true);
select pg_temp.ok(portal_private.staff_has('STAFF_MANAGE') is false,'F01 numeric aal returns definite false') as result;
select pg_temp.denied($q$update portal.staff_authorization set capabilities=capabilities||array['EXPORT'] where user_id='00000000-0000-0000-0000-000000000001'$q$,'42501','F01 numeric aal denies staff management') as result;
select pg_temp.denied($q$update portal.program_version set status='RETIRED' where id='40000000-0000-0000-0000-000000000002'$q$,'42501','F01 numeric aal denies retirement') as result;
select pg_temp.denied($q$update portal.program_version set status='PUBLISHED',content_hash=repeat('b',64) where id='40000000-0000-0000-0000-000000000003'$q$,'42501','F01 numeric aal denies publication') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":"","amr":[{"method":"totp"}]}',true);
select pg_temp.ok(portal_private.staff_has('STAFF_MANAGE') is false,'F01 empty aal returns definite false') as result;
select pg_temp.denied($q$update portal.staff_authorization set capabilities=capabilities||array['EXPORT'] where user_id='00000000-0000-0000-0000-000000000001'$q$,'42501','F01 empty aal denies staff management') as result;
select pg_temp.denied($q$update portal.program_version set status='RETIRED' where id='40000000-0000-0000-0000-000000000002'$q$,'42501','F01 empty aal denies retirement') as result;
select pg_temp.denied($q$update portal.program_version set status='PUBLISHED',content_hash=repeat('b',64) where id='40000000-0000-0000-0000-000000000003'$q$,'42501','F01 empty aal denies publication') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":"aal2"}',true);
select pg_temp.ok(portal_private.staff_has('STAFF_MANAGE') is false,'F01 missing AMR returns definite false') as result;
select pg_temp.denied($q$update portal.staff_authorization set capabilities=capabilities||array['EXPORT'] where user_id='00000000-0000-0000-0000-000000000001'$q$,'42501','F01 missing AMR denies staff management') as result;
select pg_temp.denied($q$update portal.program_version set status='RETIRED' where id='40000000-0000-0000-0000-000000000002'$q$,'42501','F01 missing AMR denies retirement') as result;
select pg_temp.denied($q$update portal.program_version set status='PUBLISHED',content_hash=repeat('b',64) where id='40000000-0000-0000-0000-000000000003'$q$,'42501','F01 missing AMR denies publication') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":"aal2","amr":null}',true);
select pg_temp.ok(portal_private.staff_has('STAFF_MANAGE') is false,'F01 null AMR returns definite false') as result;
select pg_temp.denied($q$update portal.staff_authorization set capabilities=capabilities||array['EXPORT'] where user_id='00000000-0000-0000-0000-000000000001'$q$,'42501','F01 null AMR denies staff management') as result;
select pg_temp.denied($q$update portal.program_version set status='RETIRED' where id='40000000-0000-0000-0000-000000000002'$q$,'42501','F01 null AMR denies retirement') as result;
select pg_temp.denied($q$update portal.program_version set status='PUBLISHED',content_hash=repeat('b',64) where id='40000000-0000-0000-0000-000000000003'$q$,'42501','F01 null AMR denies publication') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":"aal2","amr":{"method":"totp"}}',true);
select pg_temp.ok(portal_private.staff_has('STAFF_MANAGE') is false,'F01 object AMR returns definite false') as result;
select pg_temp.denied($q$update portal.staff_authorization set capabilities=capabilities||array['EXPORT'] where user_id='00000000-0000-0000-0000-000000000001'$q$,'42501','F01 object AMR denies staff management') as result;
select pg_temp.denied($q$update portal.program_version set status='RETIRED' where id='40000000-0000-0000-0000-000000000002'$q$,'42501','F01 object AMR denies retirement') as result;
select pg_temp.denied($q$update portal.program_version set status='PUBLISHED',content_hash=repeat('b',64) where id='40000000-0000-0000-0000-000000000003'$q$,'42501','F01 object AMR denies publication') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":"aal2","amr":"totp"}',true);
select pg_temp.ok(portal_private.staff_has('STAFF_MANAGE') is false,'F01 scalar AMR returns definite false') as result;
select pg_temp.denied($q$update portal.staff_authorization set capabilities=capabilities||array['EXPORT'] where user_id='00000000-0000-0000-0000-000000000001'$q$,'42501','F01 scalar AMR denies staff management') as result;
select pg_temp.denied($q$update portal.program_version set status='RETIRED' where id='40000000-0000-0000-0000-000000000002'$q$,'42501','F01 scalar AMR denies retirement') as result;
select pg_temp.denied($q$update portal.program_version set status='PUBLISHED',content_hash=repeat('b',64) where id='40000000-0000-0000-0000-000000000003'$q$,'42501','F01 scalar AMR denies publication') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":"aal2","amr":[]}',true);
select pg_temp.ok(portal_private.staff_has('STAFF_MANAGE') is false,'F01 empty AMR returns definite false') as result;
select pg_temp.denied($q$update portal.staff_authorization set capabilities=capabilities||array['EXPORT'] where user_id='00000000-0000-0000-0000-000000000001'$q$,'42501','F01 empty AMR denies staff management') as result;
select pg_temp.denied($q$update portal.program_version set status='RETIRED' where id='40000000-0000-0000-0000-000000000002'$q$,'42501','F01 empty AMR denies retirement') as result;
select pg_temp.denied($q$update portal.program_version set status='PUBLISHED',content_hash=repeat('b',64) where id='40000000-0000-0000-0000-000000000003'$q$,'42501','F01 empty AMR denies publication') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":"aal2","amr":[{"method":"phone"}]}',true);
select pg_temp.ok(portal_private.staff_has('STAFF_MANAGE') is false,'F01 phone-only AMR returns definite false') as result;
select pg_temp.denied($q$update portal.staff_authorization set capabilities=capabilities||array['EXPORT'] where user_id='00000000-0000-0000-0000-000000000001'$q$,'42501','F01 phone-only AMR denies staff management') as result;
select pg_temp.denied($q$update portal.program_version set status='RETIRED' where id='40000000-0000-0000-0000-000000000002'$q$,'42501','F01 phone-only AMR denies retirement') as result;
select pg_temp.denied($q$update portal.program_version set status='PUBLISHED',content_hash=repeat('b',64) where id='40000000-0000-0000-0000-000000000003'$q$,'42501','F01 phone-only AMR denies publication') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":"aal2","amr":[null,{},"totp",{"method":null}]}',true);
select pg_temp.ok(portal_private.staff_has('STAFF_MANAGE') is false,'F01 malformed AMR entries returns definite false') as result;
select pg_temp.denied($q$update portal.staff_authorization set capabilities=capabilities||array['EXPORT'] where user_id='00000000-0000-0000-0000-000000000001'$q$,'42501','F01 malformed AMR entries denies staff management') as result;
select pg_temp.denied($q$update portal.program_version set status='RETIRED' where id='40000000-0000-0000-0000-000000000002'$q$,'42501','F01 malformed AMR entries denies retirement') as result;
select pg_temp.denied($q$update portal.program_version set status='PUBLISHED',content_hash=repeat('b',64) where id='40000000-0000-0000-0000-000000000003'$q$,'42501','F01 malformed AMR entries denies publication') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":"aal2","amr":[{"method":"totp"}]}',true);
select pg_temp.ok(portal_private.staff_has('STAFF_MANAGE') is true,'F01 valid aal2 TOTP retains staff capability') as result;
reset role;
update portal.user_profile set status='INACTIVE' where user_id='00000000-0000-0000-0000-000000000001';
set local role service_role;
select pg_temp.ok(portal_private.staff_has('STAFF_MANAGE') is false,'F01 inactive adult staff returns definite false') as result;
select pg_temp.denied($q$update portal.staff_authorization set capabilities=capabilities||array['EXPORT'] where user_id='00000000-0000-0000-0000-000000000001'$q$,'42501','F01 inactive adult staff cannot manage staff') as result;
reset role;
update portal.user_profile set status='ACTIVE' where user_id='00000000-0000-0000-0000-000000000001';
-- F02: initial resolution is legal; resolved/finished history cannot be rebound.
insert into portal.stripe_event(provider_event_id,environment,stripe_account_id,event_type,provider_object_id,payload_hash,provider_created_at) values ('evt_initial_bind','test','acct_synthetic','payment_intent.succeeded','pi_initial_bind',repeat('b',64),now());
update portal.stripe_event set billing_reference_id='80000000-0000-0000-0000-000000000001' where provider_event_id='evt_initial_bind';
select pg_temp.ok((select billing_reference_id='80000000-0000-0000-0000-000000000001' and status='PROCESSING' from portal.stripe_event where provider_event_id='evt_initial_bind'),'F02 legitimate initial event binding succeeds') as result;
select pg_temp.ok(exists(select 1 from portal.audit_event a where a.object_type='stripe_event' and a.object_id=(select id::text from portal.stripe_event where provider_event_id='evt_initial_bind') and a.action='UPDATE' and a.details->'old_billing_reference_id'='null'::jsonb and a.details->>'new_billing_reference_id'='80000000-0000-0000-0000-000000000001' and a.actor_user_id='00000000-0000-0000-0000-000000000001'),'F02 initial binding audit records old and new correlation') as result;
select pg_temp.denied($q$update portal.stripe_event set billing_reference_id='80000000-0000-0000-0000-000000000003' where provider_event_id='evt_initial_bind'$q$,'23514','F02 resolved processing event cannot be rebound') as result;
update portal.stripe_event set status='APPLIED' where provider_event_id='evt_initial_bind';
select pg_temp.denied($q$update portal.stripe_event set billing_reference_id='80000000-0000-0000-0000-000000000003' where provider_event_id='evt_initial_bind'$q$,'23514','F02 APPLIED same-workspace purchase rebinding denied') as result;
select pg_temp.denied($q$update portal.stripe_event set billing_reference_id='80000000-0000-0000-0000-000000000002' where provider_event_id='evt_initial_bind'$q$,'23514','F02 APPLIED cross-workspace rebinding denied') as result;
select pg_temp.denied($q$update portal.stripe_event set billing_reference_id=null where provider_event_id='evt_initial_bind'$q$,'23514','F02 APPLIED correlation cannot be cleared') as result;
select pg_temp.denied($q$update portal.stripe_event set status='PROCESSING' where provider_event_id='evt_initial_bind'$q$,'23514','F02 APPLIED replay cannot regress lifecycle') as result;
select pg_temp.denied($q$delete from portal.stripe_event where provider_event_id='evt_initial_bind'$q$,'23514','F02 APPLIED event deletion cannot reset correlation or idempotency') as result;
select pg_temp.denied($q$update portal.stripe_event set provider_event_id='evt_rewritten' where provider_event_id='evt_initial_bind'$q$,'23514','F02 provider event identity remains immutable') as result;
select pg_temp.denied($q$insert into portal.stripe_event(provider_event_id,environment,stripe_account_id,event_type,provider_object_id,payload_hash,provider_created_at) values ('evt_initial_bind','test','acct_synthetic','payment_intent.succeeded','pi_initial_bind',repeat('b',64),now())$q$,'23505','F02 duplicate APPLIED provider event denied') as result;
update portal.stripe_event set status='APPLIED',billing_reference_id='80000000-0000-0000-0000-000000000001' where provider_event_id='evt_initial_bind';
select pg_temp.ok((select count(*)=1 from portal.stripe_event where provider_event_id='evt_initial_bind' and status='APPLIED' and billing_reference_id='80000000-0000-0000-0000-000000000001'),'F02 identical APPLIED replay preserves single identity and correlation') as result;
select pg_temp.denied($q$insert into portal.stripe_event(provider_event_id,environment,stripe_account_id,event_type,provider_object_id,payload_hash,provider_created_at,status) values ('evt_unresolved_applied','test','acct_synthetic','payment_intent.succeeded','pi_unresolved',repeat('b',64),now(),'APPLIED')$q$,'23514','F02 unresolved event cannot become APPLIED') as result;
insert into portal.stripe_event(provider_event_id,environment,stripe_account_id,event_type,provider_object_id,payload_hash,provider_created_at,status) values ('evt_retry_bind','test','acct_synthetic','payment_intent.succeeded','pi_retry_bind',repeat('b',64),now(),'RETRYABLE_FAILED');
update portal.stripe_event set billing_reference_id='80000000-0000-0000-0000-000000000001',status='APPLIED' where provider_event_id='evt_retry_bind';
select pg_temp.ok((select billing_reference_id='80000000-0000-0000-0000-000000000001' and status='APPLIED' from portal.stripe_event where provider_event_id='evt_retry_bind'),'F02 retryable unresolved event can bind and apply atomically') as result;
-- F03: compatible final state from either mutation direction; never provider behavior.
select pg_temp.ok((select b.status='PAID' and e.status='ACTIVE' from portal.billing_reference b join portal.entitlement e on e.billing_reference_id=b.id where b.id='80000000-0000-0000-0000-000000000002'),'F03 PAID plus ACTIVE is compatible') as result;
select pg_temp.denied($q$update portal.billing_reference set status='PENDING' where id='80000000-0000-0000-0000-000000000002'$q$,'23514','F03 billing regression to PENDING beneath ACTIVE denied') as result;
select pg_temp.denied($q$update portal.billing_reference set status='CHECKOUT_CREATED' where id='80000000-0000-0000-0000-000000000002'$q$,'23514','F03 billing regression to CHECKOUT_CREATED beneath ACTIVE denied') as result;
update portal.billing_reference set status='PARTIALLY_REFUNDED' where id='80000000-0000-0000-0000-000000000002';
select pg_temp.ok((select status='ACTIVE' from portal.entitlement where billing_reference_id='80000000-0000-0000-0000-000000000002'),'F03 PARTIALLY_REFUNDED preserves compatible ACTIVE without automatic change') as result;
update portal.billing_reference set status='DISPUTE_OPEN' where id='80000000-0000-0000-0000-000000000002';
select pg_temp.ok((select status='ACTIVE' from portal.entitlement where billing_reference_id='80000000-0000-0000-0000-000000000002'),'F03 DISPUTE_OPEN preserves compatible ACTIVE without automatic change') as result;
update portal.billing_reference set status='DISPUTE_WON' where id='80000000-0000-0000-0000-000000000002';
select pg_temp.ok((select status='ACTIVE' from portal.entitlement where billing_reference_id='80000000-0000-0000-0000-000000000002'),'F03 DISPUTE_WON preserves compatible ACTIVE without automatic change') as result;
update portal.billing_reference set status='DISPUTE_OPEN' where id='80000000-0000-0000-0000-000000000002';
update portal.entitlement set status='SUSPENDED' where billing_reference_id='80000000-0000-0000-0000-000000000002';
select pg_temp.ok((select status='SUSPENDED' from portal.entitlement where billing_reference_id='80000000-0000-0000-0000-000000000002'),'F03 unresolved dispute permits controlled suspension') as result;
update portal.entitlement set status='REVOKED' where billing_reference_id='80000000-0000-0000-0000-000000000002';
update portal.billing_reference set status='PENDING' where id='80000000-0000-0000-0000-000000000002';
select pg_temp.denied($q$update portal.entitlement set status='ACTIVE' where billing_reference_id='80000000-0000-0000-0000-000000000002'$q$,'23514','F03 entitlement activation on PENDING billing denied') as result;
set constraints portal.billing_access_guard, portal.entitlement_billing_access_guard deferred;
update portal.entitlement set status='ACTIVE' where billing_reference_id='80000000-0000-0000-0000-000000000002';
update portal.billing_reference set status='PAID' where id='80000000-0000-0000-0000-000000000002';
set constraints all immediate;
select pg_temp.ok((select status='ACTIVE' from portal.entitlement where billing_reference_id='80000000-0000-0000-0000-000000000002'),'F03 deferred activation before PAID update commits compatible final state') as result;
select pg_temp.denied($q$do $probe$ begin set constraints portal.billing_access_guard, portal.entitlement_billing_access_guard deferred; update portal.billing_reference set status='PENDING' where id='80000000-0000-0000-0000-000000000002'; set constraints all immediate; end $probe$$q$,'23514','F03 deferred final-state check rejects PENDING with ACTIVE') as result;
set constraints portal.billing_access_guard, portal.entitlement_billing_access_guard deferred;
update portal.billing_reference set status='DISPUTE_LOST' where id='80000000-0000-0000-0000-000000000002';
update portal.entitlement set status='REVOKED' where billing_reference_id='80000000-0000-0000-0000-000000000002';
set constraints all immediate;
select pg_temp.ok((select status='REVOKED' from portal.entitlement where billing_reference_id='80000000-0000-0000-0000-000000000002'),'F03 atomic final-dispute-loss plus revocation succeeds') as result;
select pg_temp.denied($q$update portal.entitlement set status='SUSPENDED' where billing_reference_id='80000000-0000-0000-0000-000000000002'$q$,'23514','F03 terminal billing cannot retain SUSPENDED entitlement') as result;
update portal.billing_reference set status='PAID' where id='80000000-0000-0000-0000-000000000002';
update portal.entitlement set status='ACTIVE' where billing_reference_id='80000000-0000-0000-0000-000000000002';
-- F04: original grant is immutable; revocation is derived and thereafter immutable.
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000002","session_id":"03000000-0000-0000-0000-000000000002","aal":"aal2","amr":[{"method":"totp"}]}',true);
set local role service_role;
select pg_temp.ok(portal_private.staff_has('STAFF_MANAGE') is false,'F01 ordinary family owner TOTP does not grant staff') as result;
select pg_temp.denied($q$update portal.staff_authorization set granted_by='00000000-0000-0000-0000-000000000002' where user_id='00000000-0000-0000-0000-000000000001'$q$,'42501','F04 ordinary customer cannot forge grant provenance') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000004","session_id":"03000000-0000-0000-0000-000000000004","aal":"aal2","amr":[{"method":"totp"}]}',true);
select pg_temp.ok(portal_private.staff_has('CURRICULUM_PUBLISH') is false,'F01 school admin TOTP does not grant staff') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":"aal2","amr":[{"method":"totp"}]}',true);
select pg_temp.denied($q$update portal.staff_authorization set granted_by='00000000-0000-0000-0000-000000000002' where user_id='00000000-0000-0000-0000-000000000001'$q$,'23514','F04 authorized staff cannot forge historical grant actor') as result;
select pg_temp.denied($q$update portal.staff_authorization set granted_at='2000-01-01'::timestamptz where user_id='00000000-0000-0000-0000-000000000001'$q$,'23514','F04 authorized staff cannot forge historical grant timestamp') as result;
insert into portal.staff_authorization(user_id,capabilities,granted_by,granted_at) values ('00000000-0000-0000-0000-000000000005',array['SUPPORT_READ','CURRICULUM_PUBLISH'],'00000000-0000-0000-0000-000000000002','2000-01-01');
select pg_temp.ok((select granted_by='00000000-0000-0000-0000-000000000001' and granted_at=transaction_timestamp() from portal.staff_authorization where user_id='00000000-0000-0000-0000-000000000005'),'F04 new grant derives actual actor and time despite supplied forgery') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000005","session_id":"03000000-0000-0000-0000-000000000005","aal":"aal2","amr":[{"method":"totp"}]}',true);
select pg_temp.ok(portal_private.staff_has('STAFF_MANAGE') is false,'F01 active staff missing capability returns definite false') as result;
select pg_temp.denied($q$update portal.staff_authorization set capabilities=capabilities||array['EXPORT'] where user_id='00000000-0000-0000-0000-000000000005'$q$,'42501','F01 missing STAFF_MANAGE capability denies management') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":"aal2","amr":[{"method":"totp"}]}',true);
update portal.staff_authorization set status='REVOKED',revoked_by='00000000-0000-0000-0000-000000000002',revoked_at='2000-01-01' where user_id='00000000-0000-0000-0000-000000000005';
select pg_temp.ok((select revoked_by='00000000-0000-0000-0000-000000000001' and revoked_at=transaction_timestamp() and granted_by='00000000-0000-0000-0000-000000000001' from portal.staff_authorization where user_id='00000000-0000-0000-0000-000000000005'),'F04 revocation derives actual actor and time while preserving original grant') as result;
select pg_temp.denied($q$update portal.staff_authorization set revoked_by='00000000-0000-0000-0000-000000000002' where user_id='00000000-0000-0000-0000-000000000005'$q$,'23514','F04 post-revocation revocation actor forgery denied') as result;
select pg_temp.denied($q$update portal.staff_authorization set revoked_at='2000-01-01'::timestamptz where user_id='00000000-0000-0000-0000-000000000005'$q$,'23514','F04 post-revocation revocation timestamp forgery denied') as result;
select pg_temp.denied($q$update portal.staff_authorization set granted_at='2000-01-01'::timestamptz where user_id='00000000-0000-0000-0000-000000000005'$q$,'23514','F04 post-revocation grant after revocation forgery denied') as result;
select pg_temp.denied($q$update portal.staff_authorization set status='ACTIVE',revoked_by=null,revoked_at=null where user_id='00000000-0000-0000-0000-000000000005'$q$,'23514','F04 reactivation cannot erase revocation provenance') as result;
select pg_temp.denied($q$delete from portal.staff_authorization where user_id='00000000-0000-0000-0000-000000000005'$q$,'23514','F04 API deletion cannot erase grant provenance') as result;
select pg_temp.ok(exists(select 1 from portal.audit_event where object_type='staff_authorization' and object_id='00000000-0000-0000-0000-000000000005' and action='UPDATE' and actor_user_id='00000000-0000-0000-0000-000000000001' and details->>'old_status'='ACTIVE' and details->>'new_status'='REVOKED' and jsonb_typeof(details->'new_revoked_at')='string' and details->'old_revoked_at'='null'::jsonb and details->>'old_granted_at'=details->>'new_granted_at'),'F04 audit preserves actual privileged actor and grant-revocation provenance') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000005","session_id":"03000000-0000-0000-0000-000000000005","aal":"aal2","amr":[{"method":"totp"}]}',true);
select pg_temp.ok(portal_private.staff_has('CURRICULUM_PUBLISH') is false,'F01 revoked staff with matching capability returns definite false') as result;
select pg_temp.denied($q$update portal.program_version set status='RETIRED' where id='40000000-0000-0000-0000-000000000002'$q$,'42501','F01 revoked staff cannot retire curriculum') as result;
reset role;
-- F05: independent denial branches in existing RLS, restored after each test.
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000003","session_id":"03000000-0000-0000-0000-000000000003","aal":"aal1","amr":[]}',true);
update portal.cohort_learner_assignment set status='REVOKED' where learner_ref_id='20000000-0000-0000-0000-000000000001';
set local role authenticated;
select pg_temp.ok((select count(*)=0 from portal.learner_ref),'F05 learner assignment revocation denies learner reads') as result;
select pg_temp.ok((select count(*)=0 from portal.mission_progress),'F05 learner assignment revocation denies learning reads') as result;
reset role;
update portal.cohort_learner_assignment set status='ACTIVE' where learner_ref_id='20000000-0000-0000-0000-000000000001';
update portal.user_profile set status='INACTIVE' where user_id='00000000-0000-0000-0000-000000000003';
set local role authenticated;
select pg_temp.ok((select count(*)=0 from portal.workspace),'F05 inactive adult profile denies workspace reads') as result;
select pg_temp.ok((select count(*)=0 from portal.learner_ref),'F05 inactive adult profile denies learner reads') as result;
reset role;
update portal.user_profile set status='ACTIVE' where user_id='00000000-0000-0000-0000-000000000003';
update portal.workspace set status='INACTIVE' where id='10000000-0000-0000-0000-000000000001';
set local role authenticated;
select pg_temp.ok((select count(*)=0 from portal.workspace),'F05 inactive workspace denies workspace reads') as result;
select pg_temp.ok((select count(*)=0 from portal.program_version),'F05 inactive workspace denies curriculum reads') as result;
reset role;
update portal.workspace set status='ACTIVE' where id='10000000-0000-0000-0000-000000000001';
update portal.cohort set status='INACTIVE' where id='21000000-0000-0000-0000-000000000001';
set local role authenticated;
select pg_temp.ok((select count(*)=0 from portal.cohort),'F05 inactive cohort denies cohort reads') as result;
select pg_temp.ok((select count(*)=0 from portal.learner_ref),'F05 inactive cohort denies learner reads') as result;
reset role;
update portal.cohort set status='ACTIVE' where id='21000000-0000-0000-0000-000000000001';
update portal.entitlement set status='SUSPENDED' where workspace_id='10000000-0000-0000-0000-000000000001';
set local role authenticated;
select pg_temp.ok((select count(*)=0 from portal.program_version),'F05 suspended entitlement denies curriculum reads') as result;
select pg_temp.ok((select count(*)=0 from portal.evidence_record),'F05 suspended entitlement denies evidence reads') as result;
reset role;
update portal.entitlement set status='ACTIVE' where workspace_id='10000000-0000-0000-0000-000000000001';
select pg_temp.ok((select count(*)=1 from portal.evidence_record),'F05 suspension and revocation retain evidence history') as result;
set local role authenticated;
select pg_temp.denied($q$select * from portal.stripe_event$q$,'42501','F05 unauthorized stripe_event read denied') as result;
select pg_temp.denied($q$select * from portal.audit_event$q$,'42501','F05 unauthorized audit_event read denied') as result;
select pg_temp.denied($q$select portal_private.staff_has('STAFF_MANAGE')$q$,'42501','F05 staff helper is not browser-callable') as result;
select pg_temp.denied($q$select portal_private.resolve_locale('40000000-0000-0000-0000-000000000001','en-US')$q$,'42501','F05 private locale resolver is not browser-callable') as result;
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000004","session_id":"03000000-0000-0000-0000-000000000004","aal":"aal1","amr":[]}',true);
select pg_temp.denied($q$update portal.program_version set status='RETIRED' where id='40000000-0000-0000-0000-000000000001'$q$,'42501','ordinary admin cannot retire curriculum') as result;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":"aal2","amr":[{"method":"totp"}]}',true);
update portal.program_version set status='RETIRED' where id='40000000-0000-0000-0000-000000000001';
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000004","session_id":"03000000-0000-0000-0000-000000000004","aal":"aal1"}',true);
select pg_temp.ok(portal_private.has_version('10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001'),'retirement preserves existing entitlement access') as result;
select pg_temp.denied($q$insert into portal.entitlement(workspace_id,program_version_id,billing_reference_id) values ('10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000001')$q$,'23514','retired version blocks new entitlements') as result;
-- Controlled operator-level deletion simulation, not a shipped deletion endpoint.
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","session_id":"03000000-0000-0000-0000-000000000001","aal":"aal2","amr":[{"method":"totp"}]}',true);
delete from portal.user_profile where user_id='00000000-0000-0000-0000-000000000004';
delete from auth.users where id='00000000-0000-0000-0000-000000000004';
select pg_temp.ok((select count(*)=1 from portal.assessment_attempt where status='FINALIZED' and actor_user_id is null),'account deletion nulls finalized actor while preserving learning') as result;
select pg_temp.ok((select count(*)=1 from portal.evidence_record where status='SUBMITTED' and actor_user_id is null),'account deletion nulls submitted evidence actor') as result;
select pg_temp.ok((select count(*)=1 from portal.billing_reference where id='80000000-0000-0000-0000-000000000001' and initiating_user_id is null),'account deletion retains billing independently') as result;
select pg_temp.ok(not exists(select 1 from portal.audit_event where actor_user_id='00000000-0000-0000-0000-000000000004'),'account deletion nulls audit actor without deleting events') as result;
set local role anon;
select pg_temp.denied('select * from portal.workspace','42501','anonymous private-table denial') as result;
reset role;
rollback;
