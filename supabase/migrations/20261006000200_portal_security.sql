begin;
-- Security definers are intentionally outside the exposed Data API schema.
-- No helper trusts browser user_metadata, an email domain, or caller actor IDs.
create function portal_private.is_adult() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(
    select 1 from portal.user_profile p where p.user_id=auth.uid() and p.status='ACTIVE'
  ) and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
$$;
create function portal_private.member_role(w uuid) returns text
language sql stable security definer set search_path = '' as $$
  select m.role from portal.workspace_membership m join portal.workspace s on s.id=m.workspace_id
  where m.workspace_id=w and m.user_id=auth.uid() and m.status='ACTIVE'
    and s.status='ACTIVE' and portal_private.is_adult()
$$;
create function portal_private.can_cohort(w uuid,c uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from portal.cohort h where h.id=c and h.workspace_id=w and h.status='ACTIVE'
    and (portal_private.member_role(w) in ('OWNER','SCHOOL_ADMIN') or exists(
      select 1 from portal.cohort_teacher_assignment a join portal.workspace_membership m
        on m.id=a.workspace_membership_id and m.workspace_id=a.workspace_id
      where a.cohort_id=c and a.workspace_id=w and a.status='ACTIVE'
        and m.user_id=auth.uid() and m.status='ACTIVE' and m.role='TEACHER'
        and portal_private.member_role(w)='TEACHER')))
$$;
create function portal_private.can_learner(w uuid,l uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from portal.learner_ref r where r.id=l and r.workspace_id=w and
    (portal_private.member_role(w) in ('OWNER','SCHOOL_ADMIN') or
      (portal_private.member_role(w)='TEACHER' and exists(
        select 1 from portal.cohort_learner_assignment a where a.learner_ref_id=l
          and a.workspace_id=w and a.status='ACTIVE' and portal_private.can_cohort(w,a.cohort_id)))))
$$;
create function portal_private.has_version(w uuid,v uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select portal_private.member_role(w) is not null and exists(
    select 1 from portal.entitlement e join portal.program_version p on p.id=e.program_version_id
    where e.workspace_id=w and e.program_version_id=v and e.status='ACTIVE'
      and p.status in ('PUBLISHED','RETIRED'))
$$;
create function portal_private.can_version(v uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from portal.workspace_membership m where m.user_id=auth.uid()
    and m.status='ACTIVE' and portal_private.has_version(m.workspace_id,v))
$$;
create function portal_private.can_attempt(a uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from portal.assessment_attempt t where t.id=a
    and portal_private.can_learner(t.workspace_id,t.learner_ref_id)
    and portal_private.has_version(t.workspace_id,t.program_version_id))
$$;
-- Service-side gate only. JWT must already be cryptographically validated by Auth.
-- TOTP AMR prevents phone-only aal2 from satisfying the frozen staff boundary.
create function portal_private.staff_has(capability text) returns boolean
language sql stable security definer set search_path = '' as $$
  -- Missing/JSON-null/wrong-type assurance claims always produce FALSE.
  -- A malformed AMR container must not throw or accidentally satisfy this gate.
  select coalesce(portal_private.is_adult() and auth.jwt()->'aal'='"aal2"'::jsonb
    and exists(select 1 from jsonb_array_elements(case
      when jsonb_typeof(auth.jwt()->'amr')='array' then auth.jwt()->'amr' else '[]'::jsonb end) m
      where m->'method'='"totp"'::jsonb)
    -- JWT assurance is historical: factor removal can downgrade its session
    -- while the signed token remains unexpired. Recheck managed state here.
    and exists(select 1 from auth.sessions a join auth.mfa_factors f
      on f.id=a.factor_id and f.user_id=a.user_id
      where a.id::text=auth.jwt()->>'session_id' and a.user_id=auth.uid()
        and a.aal='aal2' and (a.not_after is null or a.not_after>statement_timestamp())
        and f.factor_type='totp' and f.status='verified')
    and exists(select 1 from portal.staff_authorization s where s.user_id=auth.uid()
      and s.status='ACTIVE' and capability=any(s.capabilities)),false)
$$;

-- Default-deny all private tables, including service-only domains.
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname='portal' loop
    execute format('alter table portal.%I enable row level security',t.tablename);
    execute format('revoke all on portal.%I from public, anon, authenticated',t.tablename);
    execute format('grant select, insert, update, delete on portal.%I to service_role',t.tablename);
  end loop;
end $$;
-- Audit mutations are exclusively trigger writes, not arbitrary service DML.
revoke insert, update, delete on portal.audit_event from service_role;

grant select on portal.user_profile, portal.workspace, portal.workspace_membership,
  portal.learner_ref, portal.cohort, portal.cohort_teacher_assignment, portal.cohort_learner_assignment,
  portal.program, portal.program_version, portal.program_version_locale, portal.mission, portal.mission_locale,
  portal.assessment, portal.assessment_locale, portal.assessment_item, portal.assessment_item_locale,
  portal.resource_asset, portal.cohort_mission_delivery, portal.mission_progress,
  portal.assessment_attempt, portal.assessment_response, portal.evidence_record, portal.pilot_feedback to authenticated;
-- Column grants are deliberately summaries: no billing correlation or provider IDs.
grant select(id,workspace_id,program_version_id,status,created_at,updated_at) on portal.entitlement to authenticated;
create policy profile_self on portal.user_profile for select to authenticated
  using(user_id=auth.uid() and portal_private.is_adult());
create policy workspace_member on portal.workspace for select to authenticated
  using(portal_private.member_role(id) is not null);
create policy membership_scope on portal.workspace_membership for select to authenticated
  using(portal_private.member_role(workspace_id) is not null and
    (user_id=auth.uid() or portal_private.member_role(workspace_id) in ('OWNER','SCHOOL_ADMIN')));
create policy learner_scope on portal.learner_ref for select to authenticated
  using(portal_private.can_learner(workspace_id,id) and exists(
    select 1 from portal.entitlement e where e.workspace_id=learner_ref.workspace_id
      and portal_private.has_version(e.workspace_id,e.program_version_id)));
create policy cohort_scope on portal.cohort for select to authenticated
  using(portal_private.can_cohort(workspace_id,id));
create policy teacher_assignment_scope on portal.cohort_teacher_assignment for select to authenticated
  using(portal_private.member_role(workspace_id) in ('OWNER','SCHOOL_ADMIN') or
    (portal_private.can_cohort(workspace_id,cohort_id) and exists(
      select 1 from portal.workspace_membership m where m.id=workspace_membership_id and m.user_id=auth.uid())));
create policy learner_assignment_scope on portal.cohort_learner_assignment for select to authenticated
  using(portal_private.can_cohort(workspace_id,cohort_id) and portal_private.can_learner(workspace_id,learner_ref_id)
    and exists(select 1 from portal.entitlement e where e.workspace_id=cohort_learner_assignment.workspace_id
      and portal_private.has_version(e.workspace_id,e.program_version_id)));
create policy entitlement_summary on portal.entitlement for select to authenticated
  using(portal_private.member_role(workspace_id) is not null);
create policy program_entitled on portal.program for select to authenticated
  using(exists(select 1 from portal.program_version v where v.program_id=program.id and portal_private.can_version(v.id)));
create policy version_entitled on portal.program_version for select to authenticated
  using(portal_private.can_version(id));
do $$ declare t text; begin
  foreach t in array array['mission','assessment','assessment_item','resource_asset'] loop
    execute format('create policy curriculum_entitled on portal.%I for select to authenticated using(portal_private.can_version(program_version_id))',t);
  end loop;
  foreach t in array array['program_version_locale','mission_locale','assessment_locale','assessment_item_locale'] loop
    execute format('create policy locale_entitled on portal.%I for select to authenticated using(status=''PUBLISHED'' and portal_private.can_version(program_version_id))',t);
  end loop;
  foreach t in array array['mission_progress','assessment_attempt','evidence_record'] loop
    execute format('create policy learner_delivery on portal.%I for select to authenticated using(portal_private.can_learner(workspace_id,learner_ref_id) and portal_private.has_version(workspace_id,program_version_id))',t);
  end loop;
end $$;
create policy cohort_delivery on portal.cohort_mission_delivery for select to authenticated
  using(portal_private.can_cohort(workspace_id,cohort_id) and portal_private.has_version(workspace_id,program_version_id));
create policy response_attempt on portal.assessment_response for select to authenticated
  using(portal_private.can_attempt(assessment_attempt_id));
create policy feedback_scope on portal.pilot_feedback for select to authenticated
  using(portal_private.has_version(workspace_id,program_version_id) and
    (portal_private.member_role(workspace_id) in ('OWNER','SCHOOL_ADMIN') or
      (actor_user_id=auth.uid() and (cohort_id is null or portal_private.can_cohort(workspace_id,cohort_id))
        and (learner_ref_id is null or portal_private.can_learner(workspace_id,learner_ref_id)))));

-- Fail closed in 01A: browser writes are not granted. Future bounded write APIs
-- must validate active membership, exact entitlement, actor and cohort before use.
-- Staff receives no broad RLS bypass. Service credentials are exclusively server-side.
revoke all on all functions in schema portal_private from public, anon, authenticated;
grant execute on function portal_private.is_adult(), portal_private.member_role(uuid),
  portal_private.can_cohort(uuid,uuid), portal_private.can_learner(uuid,uuid),
  portal_private.has_version(uuid,uuid), portal_private.can_version(uuid),
  portal_private.can_attempt(uuid) to authenticated;
grant execute on all functions in schema portal_private to service_role;
commit;
