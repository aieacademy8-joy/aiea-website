-- Appended to the accepted transactional synthetic foundation fixture by the
-- separate in-memory runner. Never a production seed. Final ROLLBACK covers all.
update auth.sessions set aal='aal1';
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-0000-0000-000000000002',
 'session_id','03000000-0000-0000-0000-000000000002','aal','aal1','role','authenticated','is_anonymous',false,
 'iat',floor(extract(epoch from now())),'exp',floor(extract(epoch from now()))+3600,
 'aiea_write_generation',(select generation::text from portal_private.write_session_generation where session_id='03000000-0000-0000-0000-000000000002'))::text,true);
select pg_temp.ok(has_function_privilege('authenticated','portal.record_mission_progress(uuid,uuid,uuid,uuid,text)','EXECUTE'),'01D authenticated bounded RPC grant') as result;
select pg_temp.ok(not has_function_privilege('anon','portal.record_mission_progress(uuid,uuid,uuid,uuid,text)','EXECUTE'),'01D anonymous RPC denied') as result;
select pg_temp.ok(not has_function_privilege('authenticated','portal_private.assert_write_session()','EXECUTE'),'01D managed-session helper private') as result;
set local role authenticated;
select pg_temp.denied($q$insert into portal.mission_progress(workspace_id,learner_ref_id,mission_id,program_version_id) values ('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000004','50000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001')$q$,'42501','01D direct progress DML denied') as result;
select pg_temp.denied($q$select portal.record_mission_progress('10000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004','complete')$q$,'22023','01D completion requires explicit start') as result;
select pg_temp.ok(portal.record_mission_progress('10000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004','start')->>'status'='IN_PROGRESS','01D family starts active owned learner') as result;
reset role;
create temp table before_repeat as select count(*) n from portal.audit_event;
set local role authenticated;
select portal.record_mission_progress('10000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004','start');
reset role;
select pg_temp.ok((select count(*) from portal.audit_event)=(select n from before_repeat),'01D duplicate start creates no audit mutation') as result;
set local role authenticated;
select pg_temp.ok(portal.record_mission_progress('10000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004','complete')->>'status'='COMPLETED','01D explicit supported attestation completes') as result;
select pg_temp.ok(portal.record_mission_progress('10000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004','start')->>'status'='COMPLETED','01D terminal progress cannot downgrade') as result;
reset role;
select pg_temp.ok((select actor_user_id='00000000-0000-0000-0000-000000000002' from portal.mission_progress),'01D actor derived from adult session') as result;
update auth.sessions set not_after=now()-interval '1 second' where user_id='00000000-0000-0000-0000-000000000002';
set local role authenticated;
select pg_temp.denied($q$select portal.record_mission_progress('10000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004','start')$q$,'42501','01D elapsed managed session denied') as result;
reset role;
update auth.sessions set not_after=null,aal='aal2' where user_id='00000000-0000-0000-0000-000000000002';
set local role authenticated;
select pg_temp.denied($q$select portal.record_mission_progress('10000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004','start')$q$,'42501','01D historical assurance mismatch denied') as result;
reset role;
delete from auth.sessions where user_id='00000000-0000-0000-0000-000000000002';
set local role authenticated;
select pg_temp.denied($q$select portal.record_mission_progress('10000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004','start')$q$,'42501','01D removed managed session denies still-live JWT') as result;
reset role;
select pg_temp.ok(portal_private.attestation_allowed('40000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001'),'01D strict explicit completion contract accepted') as result;
select pg_temp.ok(not portal_private.attestation_allowed('40000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000002'),'01D empty completion rules denied') as result;
rollback;
