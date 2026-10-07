begin;
create function portal_private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$ begin new.updated_at=now(); return new; end $$;

-- Every privileged table change is audited without copying personal payloads.
-- No browser can invoke this trigger function or insert a fabricated audit row.
create function portal_private.audit_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r jsonb; actor uuid := auth.uid();
begin
  r := case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
  -- FK actor nulling is separately controlled by the parent deletion workflow.
  if tg_op='UPDATE' and pg_trigger_depth()>1 and
    (to_jsonb(new)-'actor_user_id'-'granted_by'-'revoked_by'-'initiating_user_id'-'published_by'-'user_id'-'updated_at') =
    (to_jsonb(old)-'actor_user_id'-'granted_by'-'revoked_by'-'initiating_user_id'-'published_by'-'user_id'-'updated_at') then
    return new;
  end if;
  insert into portal.audit_event(actor_user_id,action,object_type,object_id,workspace_id,details)
    values(actor,tg_op,tg_table_name,coalesce(r->>'id',r->>'user_id',r->>'assessment_item_id',r->>'mission_id',r->>'assessment_id',r->>'program_version_id') || coalesce('/'||(r->>'locale_code'),''),
      case when tg_table_name='workspace' then (r->>'id')::uuid else (r->>'workspace_id')::uuid end,
      jsonb_build_object('execution',case when actor is null then 'SYSTEM_OR_OPERATOR' else 'AUTHENTICATED' end,
        'old_status',case when tg_op='INSERT' then null else to_jsonb(old)->>'status' end,
        'new_status',case when tg_op='DELETE' then null else r->>'status' end,
        'old_capabilities',case when tg_op='INSERT' then null else to_jsonb(old)->'capabilities' end,
        'new_capabilities',case when tg_op='DELETE' then null else r->'capabilities' end)
      || case when tg_table_name='stripe_event' then jsonb_build_object(
        'old_billing_reference_id',case when tg_op='INSERT' then null else to_jsonb(old)->'billing_reference_id' end,
        'new_billing_reference_id',case when tg_op='DELETE' then null else r->'billing_reference_id' end)
      when tg_table_name='staff_authorization' then jsonb_build_object(
        'old_granted_at',case when tg_op='INSERT' then null else to_jsonb(old)->'granted_at' end,
        'new_granted_at',case when tg_op='DELETE' then null else r->'granted_at' end,
        'old_revoked_at',case when tg_op='INSERT' then null else to_jsonb(old)->'revoked_at' end,
        'new_revoked_at',case when tg_op='DELETE' then null else r->'revoked_at' end)
      else '{}'::jsonb end);
  return case when tg_op='DELETE' then old else new end;
end $$;
create function portal_private.audit_append_only() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op='UPDATE' and pg_trigger_depth()>1 and old.actor_user_id is not null and new.actor_user_id is null
    and not exists(select 1 from auth.users where id=old.actor_user_id)
    and (to_jsonb(new)-'actor_user_id')=(to_jsonb(old)-'actor_user_id') then return new; end if;
  raise exception 'audit_event is append-only; only FK actor anonymization is permitted' using errcode='23514';
end $$;
create trigger audit_append_only before update or delete on portal.audit_event
  for each row execute function portal_private.audit_append_only();

create function portal_private.guard_version() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op='DELETE' then
    if old.status in ('PUBLISHED','RETIRED') then raise exception 'published version cannot be deleted' using errcode='23514'; end if;
    return old;
  end if;
  if tg_op='INSERT' and new.status<>'DRAFT' then raise exception 'version must begin as DRAFT' using errcode='23514'; end if;
  if tg_op='UPDATE' then
    if old.status in ('PUBLISHED','RETIRED') then
      if pg_trigger_depth()>1 and old.published_by is not null and new.published_by is null
        and not exists(select 1 from auth.users where id=old.published_by)
        and (to_jsonb(new)-'published_by'-'updated_at')=(to_jsonb(old)-'published_by'-'updated_at') then return new; end if;
      if (to_jsonb(new)-'status'-'updated_at')<>(to_jsonb(old)-'status'-'updated_at') or
        not (old.status='PUBLISHED' and new.status='RETIRED') then
        raise exception 'published curriculum is immutable; create a new version' using errcode='23514';
      end if;
      if portal_private.staff_has('CURRICULUM_PUBLISH') is not true then
        raise exception 'retirement requires active staff + TOTP aal2' using errcode='42501';
      end if;
    elsif new.status<>old.status and not ((old.status='DRAFT' and new.status='REVIEW_READY') or
        (old.status='REVIEW_READY' and new.status in ('DRAFT','PUBLISHED'))) then
      raise exception 'invalid publication transition' using errcode='23514';
    end if;
  end if;
  if new.status='PUBLISHED' and old.status is distinct from 'PUBLISHED' then
    if portal_private.staff_has('CURRICULUM_PUBLISH') is not true then
      raise exception 'publication requires active staff + TOTP aal2 + CURRICULUM_PUBLISH' using errcode='42501';
    end if;
    new.published_by=auth.uid(); new.published_at=now();
    if new.content_hash is null then raise exception 'publication requires content hash' using errcode='23514'; end if;
    if not exists(select 1 from portal.program_version_locale where program_version_id=new.id
      and locale_code=new.default_locale and status='PUBLISHED') or
      (new.fallback_locale is not null and not exists(select 1 from portal.program_version_locale
        where program_version_id=new.id and locale_code=new.fallback_locale and status='PUBLISHED')) then
      raise exception 'default/fallback locale must be published' using errcode='23514';
    end if;
    -- Publication validates a complete localized tree for every approved locale.
    if exists(select 1 from portal.program_version_locale l where l.program_version_id=new.id and l.status='PUBLISHED' and (
      exists(select 1 from portal.mission m where m.program_version_id=new.id and not exists(
        select 1 from portal.mission_locale x where x.mission_id=m.id and x.locale_code=l.locale_code and x.status='PUBLISHED')) or
      exists(select 1 from portal.assessment a where a.program_version_id=new.id and not exists(
        select 1 from portal.assessment_locale x where x.assessment_id=a.id and x.locale_code=l.locale_code and x.status='PUBLISHED')) or
      exists(select 1 from portal.assessment_item i where i.program_version_id=new.id and not exists(
        select 1 from portal.assessment_item_locale x where x.assessment_item_id=i.id and x.locale_code=l.locale_code and x.status='PUBLISHED')))) then
      raise exception 'published locale is incomplete' using errcode='23514';
    end if;
    if exists(select 1 from portal.assessment_item_locale l join portal.assessment_item i on i.id=l.assessment_item_id
      where i.program_version_id=new.id and
        (select array_agg(k order by k) from jsonb_object_keys(l.response_option_labels) k) is distinct from
        (select array_agg(k order by k) from unnest(i.response_option_keys) k)) then
      raise exception 'publication option labels do not match structural keys' using errcode='23514';
    end if;
  end if;
  return new;
end $$;
create trigger version_guard before insert or update or delete on portal.program_version
  for each row execute function portal_private.guard_version();

-- Lock BOTH old and new parents: moving a child cannot evade immutability.
-- Parent row locks serialize publication against concurrent content changes.
create function portal_private.guard_curriculum() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v uuid; prior_v uuid; next_v uuid; s text;
begin
  if tg_op<>'INSERT' then prior_v=old.program_version_id; end if;
  if tg_op<>'DELETE' then next_v=new.program_version_id; end if;
  for v in select distinct x from unnest(array[prior_v,next_v]) x where x is not null order by x loop
    select status into s from portal.program_version where id=v for update;
    if s in ('PUBLISHED','RETIRED') then raise exception 'published curriculum child is immutable' using errcode='23514'; end if;
  end loop;
  return case when tg_op='DELETE' then old else new end;
end $$;
create function portal_private.guard_program() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Freeze the structural identity even while draft children are being edited.
  if tg_op='UPDATE' and new.program_key<>old.program_key then
    raise exception 'program identity is stable' using errcode='23514';
  end if;
  return new;
end $$;
create trigger program_identity before update on portal.program for each row execute function portal_private.guard_program();

create function portal_private.guard_option_keys() returns trigger
language plpgsql security definer set search_path = '' as $$
declare keys text[];
begin
  if tg_table_name='assessment_item' then
    keys=new.response_option_keys;
    if cardinality(keys)<>(select count(distinct x) from unnest(keys) x where x ~ '^[a-z0-9][a-z0-9_-]*$') then
      raise exception 'response option keys must be distinct stable structural keys' using errcode='23514';
    end if;
  else
    select response_option_keys into keys from portal.assessment_item where id=new.assessment_item_id;
    if (select array_agg(k order by k) from jsonb_object_keys(new.response_option_labels) k) is distinct from
       (select array_agg(k order by k) from unnest(keys) k) or exists(
         select 1 from jsonb_each(new.response_option_labels) x where jsonb_typeof(x.value)<>'string') then
      raise exception 'localized option labels must exactly match structural keys' using errcode='23514';
    end if;
  end if;
  return new;
end $$;
create trigger option_keys before insert or update on portal.assessment_item for each row execute function portal_private.guard_option_keys();
create trigger option_labels before insert or update on portal.assessment_item_locale for each row execute function portal_private.guard_option_keys();

create function portal_private.guard_entitlement() returns trigger
language plpgsql security definer set search_path = '' as $$
declare p text;
begin
  if tg_op='UPDATE' and (new.workspace_id,new.program_version_id,new.billing_reference_id) is distinct from
    (old.workspace_id,old.program_version_id,old.billing_reference_id) then
    raise exception 'entitlement basis is immutable' using errcode='23514';
  end if;
  select status into p from portal.program_version where id=new.program_version_id for update;
  perform 1 from portal.billing_reference where id=new.billing_reference_id for update;
  if tg_op='INSERT' and p is distinct from 'PUBLISHED' then raise exception 'new entitlement requires published non-retired version' using errcode='23514'; end if;
  -- Billing compatibility is checked symmetrically at transaction completion by
  -- both constraint triggers below, so either order of atomic updates is valid.
  return new;
end $$;
create trigger entitlement_guard before insert or update on portal.entitlement for each row execute function portal_private.guard_entitlement();
create function portal_private.guard_billing() returns trigger
language plpgsql security definer set search_path = '' as $$
declare p text;
begin
  if tg_op='INSERT' then
    if auth.uid() is null or portal_private.member_role(new.workspace_id) not in ('OWNER','SCHOOL_ADMIN') or
      portal_private.member_role(new.workspace_id) is null then
      raise exception 'billing creation requires authenticated purchasing authority' using errcode='42501';
    end if;
    select status into p from portal.program_version where id=new.program_version_id for update;
    if p is distinct from 'PUBLISHED' then raise exception 'checkout requires published non-retired version' using errcode='23514'; end if;
    new.initiating_user_id=auth.uid();
  else
    if (new.workspace_id,new.program_version_id,new.offering_key,new.environment,new.idempotency_key,new.stripe_account_id,new.stripe_product_id,new.stripe_price_id) is distinct from
      (old.workspace_id,old.program_version_id,old.offering_key,old.environment,old.idempotency_key,old.stripe_account_id,old.stripe_product_id,old.stripe_price_id) then
      raise exception 'server-trusted billing correlation is immutable' using errcode='23514';
    end if;
    if new.initiating_user_id is distinct from old.initiating_user_id and not
      (pg_trigger_depth()>1 and new.initiating_user_id is null and not exists(select 1 from auth.users where id=old.initiating_user_id)) then
      raise exception 'billing initiating actor is immutable' using errcode='23514';
    end if;
  end if;
  return new;
end $$;
create trigger billing_guard before insert or update on portal.billing_reference for each row execute function portal_private.guard_billing();
-- Validate the FINAL transaction state, allowing atomic billing+access updates.
create function portal_private.guard_billing_access() returns trigger
language plpgsql security definer set search_path = '' as $$
declare bid uuid;
begin
  bid=case when tg_table_name='billing_reference' then (to_jsonb(new)->>'id')::uuid
    else (to_jsonb(new)->>'billing_reference_id')::uuid end;
  if exists(select 1 from portal.billing_reference b join portal.entitlement e on e.billing_reference_id=b.id
    where b.id=bid and e.status='ACTIVE' and b.status not in ('PAID','PARTIALLY_REFUNDED','DISPUTE_OPEN','DISPUTE_WON')) then
    raise exception 'active entitlement requires compatible final one-time billing state' using errcode='23514';
  end if;
  if exists(select 1 from portal.billing_reference b join portal.entitlement e on e.billing_reference_id=b.id
    where b.id=bid and b.status in ('REFUNDED','DISPUTE_LOST') and e.status<>'REVOKED') then
    raise exception 'full refund/final dispute loss requires atomic entitlement revocation' using errcode='23514';
  end if;
  return null;
end $$;
create constraint trigger billing_access_guard after insert or update on portal.billing_reference
  deferrable initially deferred for each row execute function portal_private.guard_billing_access();
create constraint trigger entitlement_billing_access_guard after insert or update on portal.entitlement
  deferrable initially deferred for each row execute function portal_private.guard_billing_access();
create function portal_private.guard_staff() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- First grant is an explicit out-of-band Human database-operator bootstrap.
  -- The API service role cannot bootstrap or grant itself authority.
  if current_setting('role',true) in ('service_role','authenticated','anon') and
    portal_private.staff_has('STAFF_MANAGE') is not true then
    raise exception 'staff management requires existing STAFF_MANAGE + TOTP aal2' using errcode='42501';
  end if;
  if tg_op='INSERT' then
    if portal_private.is_adult() is not true then raise exception 'bootstrap must identify the Human adult actor' using errcode='42501'; end if;
    new.granted_by=auth.uid(); new.granted_at=now();
    new.status='ACTIVE'; new.revoked_by=null; new.revoked_at=null;
  elsif tg_op='UPDATE' then
    if new.user_id<>old.user_id then raise exception 'staff identity cannot be moved' using errcode='23514'; end if;
    -- Preserve the existing controlled account-deletion exception, never a DML
    -- provenance override: only nested FK nulling for an actually deleted adult.
    if pg_trigger_depth()>1 and
      (to_jsonb(new)-'granted_by'-'revoked_by'-'updated_at')=(to_jsonb(old)-'granted_by'-'revoked_by'-'updated_at') and
      (new.granted_by is not distinct from old.granted_by or
        (new.granted_by is null and not exists(select 1 from auth.users where id=old.granted_by))) and
      (new.revoked_by is not distinct from old.revoked_by or
        (new.revoked_by is null and not exists(select 1 from auth.users where id=old.revoked_by))) then return new; end if;
    if (new.granted_by,new.granted_at) is distinct from (old.granted_by,old.granted_at) then
      raise exception 'original staff grant provenance is immutable' using errcode='23514';
    end if;
    if old.status='REVOKED' and new.status='ACTIVE' then
      raise exception 'staff reactivation requires a future controlled grant lifecycle' using errcode='23514';
    end if;
    if new.status='REVOKED' and old.status<>'REVOKED' then
      if portal_private.is_adult() is not true then raise exception 'staff revocation requires an adult actor' using errcode='42501'; end if;
      new.revoked_by=auth.uid(); new.revoked_at=now();
    elsif (new.revoked_by,new.revoked_at) is distinct from (old.revoked_by,old.revoked_at) then
      raise exception 'staff revocation provenance is immutable' using errcode='23514';
    end if;
  elsif tg_op='DELETE' and current_setting('role',true) in ('service_role','authenticated','anon') then
    raise exception 'retain staff provenance; revoke instead; privacy deletion remains controlled' using errcode='23514';
  end if;
  return case when tg_op='DELETE' then old else new end;
end $$;
create trigger staff_guard before insert or update or delete on portal.staff_authorization for each row execute function portal_private.guard_staff();
create function portal_private.guard_stripe_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op='DELETE' then
    raise exception 'retain durable Stripe event identity; deletion requires future controlled retention' using errcode='23514';
  end if;
  if new.billing_reference_id is not null and not exists(select 1 from portal.billing_reference b
    where b.id=new.billing_reference_id and b.environment=new.environment and b.stripe_account_id=new.stripe_account_id) then
    raise exception 'Stripe event account/environment does not match billing basis' using errcode='23514';
  end if;
  if tg_op='UPDATE' and (new.provider_event_id,new.environment,new.stripe_account_id,new.event_type,new.provider_object_id,new.payload_hash) is distinct from
    (old.provider_event_id,old.environment,old.stripe_account_id,old.event_type,old.provider_object_id,old.payload_hash) then
    raise exception 'verified Stripe event identity is immutable' using errcode='23514';
  end if;
  if tg_op='UPDATE' then
    -- Initial NULL -> resolved binding is allowed only during processing/retry.
    -- Once bound, it cannot be changed or cleared, even before APPLIED.
    if new.billing_reference_id is distinct from old.billing_reference_id and
      (old.billing_reference_id is not null or old.status not in ('PROCESSING','RETRYABLE_FAILED')) then
      raise exception 'Stripe event billing correlation is immutable once resolved' using errcode='23514';
    end if;
    if old.status in ('APPLIED','IGNORED') and new.status<>old.status then
      raise exception 'completed Stripe event cannot be replayed through another state' using errcode='23514';
    end if;
  end if;
  if new.status='APPLIED' and new.billing_reference_id is null then
    raise exception 'applied Stripe event requires resolved billing correlation' using errcode='23514';
  end if;
  return new;
end $$;
create trigger stripe_event_guard before insert or update or delete on portal.stripe_event for each row execute function portal_private.guard_stripe_event();
-- Provider verification, atomic event application, refund/dispute reconciliation,
-- and staff correction RPCs are a later mandatory gate; no webhook is wired here.

create function portal_private.guard_learning() returns trigger
language plpgsql security definer set search_path = '' as $$
declare frozen boolean := false; actor uuid := auth.uid();
begin
  if tg_op<>'INSERT' then
    frozen=(tg_table_name='assessment_attempt' and to_jsonb(old)->>'status'='FINALIZED') or
      (tg_table_name='evidence_record' and to_jsonb(old)->>'status'='SUBMITTED');
    if frozen then
      if tg_op='UPDATE' and pg_trigger_depth()>1 and old.actor_user_id is not null and new.actor_user_id is null
        and not exists(select 1 from auth.users where id=old.actor_user_id)
        and (to_jsonb(new)-'actor_user_id'-'updated_at')=(to_jsonb(old)-'actor_user_id'-'updated_at') then return new; end if;
      raise exception 'finalized/submitted record requires a future controlled correction/deletion operation' using errcode='23514';
    end if;
    if tg_op='DELETE' then raise exception 'learning deletion requires controlled privacy operation' using errcode='42501'; end if;
    if (new.workspace_id,new.program_version_id) is distinct from (old.workspace_id,old.program_version_id) or
      (to_jsonb(new)->>'learner_ref_id') is distinct from (to_jsonb(old)->>'learner_ref_id') or
      (to_jsonb(new)->>'mission_id') is distinct from (to_jsonb(old)->>'mission_id') or
      (to_jsonb(new)->>'assessment_id') is distinct from (to_jsonb(old)->>'assessment_id') or
      (to_jsonb(new)->>'cohort_id') is distinct from (to_jsonb(old)->>'cohort_id') then
      raise exception 'learning context is immutable' using errcode='23514';
    end if;
    -- Preserve a draft/history row while a controlled account deletion nulls actor.
    if pg_trigger_depth()>1 and old.actor_user_id is not null and new.actor_user_id is null
      and not exists(select 1 from auth.users where id=old.actor_user_id)
      and (to_jsonb(new)-'actor_user_id'-'updated_at')=(to_jsonb(old)-'actor_user_id'-'updated_at') then return new; end if;
  end if;
  if actor is null then raise exception 'learning mutation requires verified adult session context' using errcode='42501'; end if;
  if not portal_private.has_version(new.workspace_id,new.program_version_id) then
    raise exception 'active membership and exact entitlement required' using errcode='42501'; end if;
  if tg_table_name='cohort_mission_delivery' then
    if not portal_private.can_cohort(new.workspace_id,new.cohort_id) then raise exception 'unassigned cohort' using errcode='42501'; end if;
  elsif tg_table_name='pilot_feedback' then
    if (new.cohort_id is not null and not portal_private.can_cohort(new.workspace_id,new.cohort_id)) or
       (new.learner_ref_id is not null and not portal_private.can_learner(new.workspace_id,new.learner_ref_id)) then
      raise exception 'unauthorized feedback context' using errcode='42501'; end if;
    if new.cohort_id is not null and new.learner_ref_id is not null and not exists(
      select 1 from portal.cohort_learner_assignment where cohort_id=new.cohort_id
        and learner_ref_id=new.learner_ref_id and workspace_id=new.workspace_id and status='ACTIVE') then
      raise exception 'feedback learner/cohort mismatch' using errcode='23514'; end if;
  elsif not portal_private.can_learner(new.workspace_id,new.learner_ref_id) then
    raise exception 'unauthorized learner' using errcode='42501';
  end if;
  if tg_table_name='assessment_attempt' and not exists(select 1 from portal.assessment_locale l
    where l.assessment_id=(to_jsonb(new)->>'assessment_id')::uuid
      and l.locale_code=to_jsonb(new)->>'locale_code' and l.status='PUBLISHED') then
    raise exception 'assessment attempt requires published locale' using errcode='23514';
  end if;
  if tg_op='INSERT' then new.actor_user_id=actor; else new.actor_user_id=old.actor_user_id; end if;
  return new;
end $$;
create function portal_private.guard_response() returns trigger
language plpgsql security definer set search_path = '' as $$
declare a portal.assessment_attempt; prior uuid; next_id uuid; aid uuid; keys text[];
begin
  if tg_op<>'INSERT' then prior=old.assessment_attempt_id; end if;
  if tg_op<>'DELETE' then next_id=new.assessment_attempt_id; end if;
  for aid in select distinct x from unnest(array[prior,next_id]) x where x is not null order by x loop
    select * into a from portal.assessment_attempt where id=aid for update;
    if a.status='FINALIZED' then raise exception 'finalized responses are immutable' using errcode='23514'; end if;
    if not portal_private.can_attempt(aid) then raise exception 'unauthorized assessment attempt' using errcode='42501'; end if;
  end loop;
  if tg_op='UPDATE' and (new.assessment_attempt_id,new.assessment_item_id,new.assessment_id,new.program_version_id) is distinct from
    (old.assessment_attempt_id,old.assessment_item_id,old.assessment_id,old.program_version_id) then
    raise exception 'response context is immutable' using errcode='23514'; end if;
  if tg_op<>'DELETE' then
    select response_option_keys into keys from portal.assessment_item where id=new.assessment_item_id;
    if not coalesce(new.response_option_key=any(keys),false) then raise exception 'invalid structural option key' using errcode='23514'; end if;
  end if;
  return case when tg_op='DELETE' then old else new end;
end $$;
create trigger response_guard before insert or update or delete on portal.assessment_response for each row execute function portal_private.guard_response();

-- Deterministic choice: requested published locale, explicit approved fallback,
-- otherwise NULL/unavailable. Default is not an implicit fallback.
create function portal_private.resolve_locale(v uuid,requested text) returns text
language sql stable security definer set search_path = '' as $$
  select l.locale_code from portal.program_version p join portal.program_version_locale l on l.program_version_id=p.id
  where p.id=v and portal_private.can_version(v) and l.status='PUBLISHED'
    and (l.locale_code=requested or l.locale_code=p.fallback_locale)
  order by case when l.locale_code=requested then 0 else 1 end limit 1
$$;

do $$ declare t record; n text; begin
  for t in select tablename from pg_tables where schemaname='portal' and tablename<>'audit_event' loop
    execute format('create trigger z_touch before update on portal.%I for each row execute function portal_private.touch_updated_at()',t.tablename);
    execute format('create trigger z_audit after insert or update or delete on portal.%I for each row execute function portal_private.audit_change()',t.tablename);
  end loop;
  foreach n in array array['program_version_locale','mission','mission_locale','resource_asset','assessment','assessment_locale','assessment_item','assessment_item_locale'] loop
    execute format('create trigger a_curriculum_guard before insert or update or delete on portal.%I for each row execute function portal_private.guard_curriculum()',n);
  end loop;
  foreach n in array array['cohort_mission_delivery','mission_progress','assessment_attempt','evidence_record','pilot_feedback'] loop
    execute format('create trigger a_learning_guard before insert or update or delete on portal.%I for each row execute function portal_private.guard_learning()',n);
  end loop;
end $$;
revoke all on all functions in schema portal_private from public, anon;
revoke execute on function portal_private.touch_updated_at(), portal_private.audit_change(), portal_private.audit_append_only(),
  portal_private.guard_version(), portal_private.guard_curriculum(), portal_private.guard_program(),
  portal_private.guard_option_keys(), portal_private.guard_entitlement(), portal_private.guard_learning(),
  portal_private.guard_response(), portal_private.guard_staff(), portal_private.guard_stripe_event(),
  portal_private.guard_billing(), portal_private.guard_billing_access(),
  portal_private.resolve_locale(uuid,text) from authenticated;
grant execute on function portal_private.resolve_locale(uuid,text) to service_role;
commit;
