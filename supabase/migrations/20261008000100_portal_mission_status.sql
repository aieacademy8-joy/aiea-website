-- Sprint 01D / Irene HR01 + HR02. Forward-only; no direct adult table DML.
begin;

create function portal_private.assert_write_session() returns void
language plpgsql security definer set search_path = '' as $$
declare j jsonb := auth.jwt(); s auth.sessions; p portal.user_profile; u auth.users;
begin
  if auth.uid() is null or j->>'role' is distinct from 'authenticated'
    or j->'is_anonymous' is distinct from 'false'::jsonb
    or jsonb_typeof(j->'exp') is distinct from 'number'
    or jsonb_typeof(j->'iat') is distinct from 'number'
    or (j->>'exp')::numeric <= extract(epoch from clock_timestamp())
    or (j->>'iat')::numeric > extract(epoch from clock_timestamp())
    or j->>'aal' not in ('aal1','aal2') or j->>'aal' is null then
    raise exception 'current managed adult session required' using errcode='42501';
  end if;
  select * into u from auth.users where id=auth.uid() for share;
  if not found or u.is_anonymous is distinct from false or u.deleted_at is not null
    or (u.banned_until is not null and u.banned_until>clock_timestamp()) then
    raise exception 'current managed adult account required' using errcode='42501';
  end if;
  -- Auth owns this state. Logout/session deletion contends with this lock;
  -- a JWT alone, fake session ID, or historical assurance cannot authorize DML.
  select * into s from auth.sessions where id::text=j->>'session_id'
    and user_id=auth.uid() for share;
  if not found or s.aal::text is distinct from j->>'aal'
    or (s.not_after is not null and s.not_after<=clock_timestamp())
    or (s.refreshed_at is not null and (j->>'iat')::numeric <
      floor(extract(epoch from s.refreshed_at at time zone 'UTC'))) then
    raise exception 'current managed adult session required' using errcode='42501';
  end if;
  select * into p from portal.user_profile where user_id=auth.uid() for share;
  if not found or p.status<>'ACTIVE' or p.adult_confirmed_at is null then
    raise exception 'active adult required' using errcode='42501';
  end if;
end $$;

create function portal_private.lock_status_authority(w uuid,v uuid,m uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare k text; r text; st text;
begin
  perform portal_private.assert_write_session();
  select kind into k from portal.workspace where id=w and status='ACTIVE' for share;
  if not found then raise exception 'status access denied' using errcode='42501'; end if;
  select role into r from portal.workspace_membership where workspace_id=w
    and user_id=auth.uid() and status='ACTIVE' for share;
  if not found then raise exception 'status access denied' using errcode='42501'; end if;
  perform 1 from portal.entitlement where workspace_id=w and program_version_id=v
    and status='ACTIVE' order by id for share;
  if not found then raise exception 'status access denied' using errcode='42501'; end if;
  select status into st from portal.program_version where id=v for share;
  if not found or st not in ('PUBLISHED','RETIRED') then
    raise exception 'status access denied' using errcode='42501'; end if;
  perform 1 from portal.mission where id=m and program_version_id=v for share;
  if not found then raise exception 'status access denied' using errcode='42501'; end if;
  return k;
end $$;

create function portal_private.attestation_allowed(v uuid,m uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(exists(select 1 from portal.program_version p join portal.mission x
    on x.program_version_id=p.id where p.id=v and x.id=m
      and p.completion_rules='{"method":"ADULT_ATTESTATION"}'::jsonb
      and x.completion_rules='{"method":"ADULT_ATTESTATION"}'::jsonb
      and x.evidence_expectations='{"required":false}'::jsonb),false)
$$;

create function portal.record_mission_progress(workspace_id uuid,program_version_id uuid,
  mission_id uuid,learner_ref_id uuid,action text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare prior text; result text; allowed boolean;
begin
  if action is null or action not in ('start','complete') then
    raise exception 'invalid status action' using errcode='22023'; end if;
  if portal_private.lock_status_authority(workspace_id,program_version_id,mission_id)<>'FAMILY' then
    raise exception 'family status only' using errcode='42501'; end if;
  -- Serializes absent-row insertion, duplicate actions and all status advancement.
  perform 1 from portal.learner_ref l where l.id=learner_ref_id
    and l.workspace_id=record_mission_progress.workspace_id and l.status='ACTIVE' for update;
  if not found or portal_private.member_role(workspace_id) is distinct from 'OWNER' then
    raise exception 'status access denied' using errcode='42501'; end if;
  select x.status into prior from portal.mission_progress x
    where x.learner_ref_id=record_mission_progress.learner_ref_id
      and x.mission_id=record_mission_progress.mission_id for update;
  allowed=portal_private.attestation_allowed(program_version_id,mission_id);
  if action='complete' and not allowed then
    raise exception 'completion requirements unsupported' using errcode='22023'; end if;
  if action='complete' and (prior is null or prior='NOT_STARTED') then
    raise exception 'start required' using errcode='22023'; end if;
  perform portal_private.assert_write_session(); -- expiry may elapse while waiting
  result=case when prior='COMPLETED' then prior when action='complete' then 'COMPLETED' else 'IN_PROGRESS' end;
  if prior is null then
    insert into portal.mission_progress(workspace_id,learner_ref_id,mission_id,program_version_id,status)
      values(workspace_id,learner_ref_id,mission_id,program_version_id,result);
  elsif result<>prior then
    update portal.mission_progress x set status=result where
      x.learner_ref_id=record_mission_progress.learner_ref_id and x.mission_id=record_mission_progress.mission_id;
  end if;
  return jsonb_build_object('subject_id',learner_ref_id,'mission_id',mission_id,'status',result,'completion_allowed',allowed);
end $$;

create function portal.record_cohort_delivery(workspace_id uuid,program_version_id uuid,
  mission_id uuid,cohort_id uuid,action text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare prior text; result text; r text;
begin
  if action is null or action not in ('start','deliver') then
    raise exception 'invalid status action' using errcode='22023'; end if;
  if portal_private.lock_status_authority(workspace_id,program_version_id,mission_id)<>'SCHOOL' then
    raise exception 'school delivery only' using errcode='42501'; end if;
  perform 1 from portal.cohort c where c.id=cohort_id
    and c.workspace_id=record_cohort_delivery.workspace_id and c.status='ACTIVE' for update;
  if not found then raise exception 'status access denied' using errcode='42501'; end if;
  r=portal_private.member_role(workspace_id);
  if r='TEACHER' then
    perform 1 from portal.cohort_teacher_assignment a join portal.workspace_membership b
      on b.id=a.workspace_membership_id and b.workspace_id=a.workspace_id
      where a.workspace_id=record_cohort_delivery.workspace_id and a.cohort_id=record_cohort_delivery.cohort_id
        and a.status='ACTIVE' and b.user_id=auth.uid() and b.status='ACTIVE' and b.role='TEACHER'
      order by a.id for share of a;
    if not found then raise exception 'status access denied' using errcode='42501'; end if;
  elsif r is null or r not in ('OWNER','SCHOOL_ADMIN') then
    raise exception 'status access denied' using errcode='42501';
  end if;
  select x.status into prior from portal.cohort_mission_delivery x where
    x.cohort_id=record_cohort_delivery.cohort_id and x.mission_id=record_cohort_delivery.mission_id for update;
  if action='deliver' and prior is null then raise exception 'start required' using errcode='22023'; end if;
  perform portal_private.assert_write_session();
  result=case when prior='DELIVERED' then prior when action='deliver' then 'DELIVERED' else 'STARTED' end;
  if prior is null then
    insert into portal.cohort_mission_delivery(workspace_id,cohort_id,mission_id,program_version_id,status)
      values(workspace_id,cohort_id,mission_id,program_version_id,result);
  elsif result<>prior then
    update portal.cohort_mission_delivery x set status=result,delivered_at=clock_timestamp()
      where x.cohort_id=record_cohort_delivery.cohort_id and x.mission_id=record_cohort_delivery.mission_id;
  end if;
  return jsonb_build_object('subject_id',cohort_id,'mission_id',mission_id,'status',result);
end $$;

revoke all on function portal_private.assert_write_session(),
  portal_private.lock_status_authority(uuid,uuid,uuid),portal_private.attestation_allowed(uuid,uuid)
  from public,anon,authenticated,service_role;
revoke all on function portal.record_mission_progress(uuid,uuid,uuid,uuid,text),
  portal.record_cohort_delivery(uuid,uuid,uuid,uuid,text) from public,anon,authenticated,service_role;
grant execute on function portal.record_mission_progress(uuid,uuid,uuid,uuid,text),
  portal.record_cohort_delivery(uuid,uuid,uuid,uuid,text) to authenticated;
commit;
