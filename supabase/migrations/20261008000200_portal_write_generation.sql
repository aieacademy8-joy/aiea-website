-- Irene 01D-HR03: trusted issuance binding for the two 01D write RPCs only.
-- The Auth hook must be activated separately; this migration activates no provider.
begin;

create sequence portal_private.write_generation_seq as bigint minvalue 1 no cycle;
create table portal_private.write_session_generation (
  session_id uuid primary key references auth.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  generation bigint not null check (generation > 0)
);
alter table portal_private.write_session_generation enable row level security;
alter table portal_private.write_session_generation force row level security;
revoke all on table portal_private.write_session_generation from public,anon,authenticated,service_role,supabase_auth_admin;
revoke all on sequence portal_private.write_generation_seq from public,anon,authenticated,service_role,supabase_auth_admin;
grant select,insert on table portal_private.write_session_generation to supabase_auth_admin;
grant update(generation) on table portal_private.write_session_generation to supabase_auth_admin;
grant usage on sequence portal_private.write_generation_seq to supabase_auth_admin;
create policy auth_generation_select on portal_private.write_session_generation
  for select to supabase_auth_admin using (true);
create policy auth_generation_insert on portal_private.write_session_generation
  for insert to supabase_auth_admin with check (true);
create policy auth_generation_update on portal_private.write_session_generation
  for update to supabase_auth_admin using (true) with check (true);

create function portal_private.issue_write_generation(event jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare c jsonb := event->'claims'; sid uuid; adult uuid; issued bigint;
begin
  if jsonb_typeof(c) is distinct from 'object'
    or jsonb_typeof(event->'user_id') is distinct from 'string'
    or jsonb_typeof(c->'sub') is distinct from 'string'
    or jsonb_typeof(c->'session_id') is distinct from 'string'
    or c->>'role' is distinct from 'authenticated'
    or c->'is_anonymous' is distinct from 'false'::jsonb then
    raise exception 'trusted managed issuance required' using errcode='42501';
  end if;
  begin
    adult := (event->>'user_id')::uuid;
    sid := (c->>'session_id')::uuid;
    if adult is distinct from (c->>'sub')::uuid then
      raise exception 'trusted managed issuance required' using errcode='42501';
    end if;
  exception when invalid_text_representation then
    raise exception 'trusted managed issuance required' using errcode='42501';
  end;
  -- Issuance and writes serialize on the SAME managed session. Allocate only
  -- after taking this lock, so concurrent issuance cannot install a lower value.
  perform 1 from auth.sessions s where s.id=sid and s.user_id=adult for update;
  if not found then
    raise exception 'trusted managed issuance required' using errcode='42501';
  end if;
  insert into portal_private.write_session_generation as g(session_id,user_id,generation)
    values(sid,adult,nextval('portal_private.write_generation_seq'::regclass))
    on conflict(session_id) do update set generation=excluded.generation
      where g.user_id=excluded.user_id
    returning generation into issued;
  if not found then
    raise exception 'managed issuance identity mismatch' using errcode='42501';
  end if;
  -- Overwrite any prior value. No user metadata or caller-provided header/body
  -- participates. Only Auth receives this result and signs the resulting claims.
  return jsonb_build_object('claims',jsonb_set(c,'{aiea_write_generation}',to_jsonb(issued::text)));
end $$;
revoke all on function portal_private.issue_write_generation(jsonb)
  from public,anon,authenticated,service_role,supabase_auth_admin;
grant usage on schema portal_private to supabase_auth_admin;
grant execute on function portal_private.issue_write_generation(jsonb) to supabase_auth_admin;

-- Replace the common gate in place: no alternate RPC/signature or repair path.
create or replace function portal_private.assert_write_session() returns void
language plpgsql security definer set search_path = '' as $$
declare j jsonb := auth.jwt(); s auth.sessions; p portal.user_profile; u auth.users;
  g portal_private.write_session_generation;
begin
  if auth.uid() is null or j->>'role' is distinct from 'authenticated'
    or j->'is_anonymous' is distinct from 'false'::jsonb
    or jsonb_typeof(j->'exp') is distinct from 'number'
    or jsonb_typeof(j->'iat') is distinct from 'number'
    or (j->>'exp')::numeric <= extract(epoch from clock_timestamp())
    or (j->>'iat')::numeric > extract(epoch from clock_timestamp())
    or j->>'aal' not in ('aal1','aal2') or j->>'aal' is null
    or jsonb_typeof(j->'aiea_write_generation') is distinct from 'string'
    or (j->>'aiea_write_generation') !~ '^[1-9][0-9]{0,18}$' then
    raise exception 'current managed adult session required' using errcode='42501';
  end if;
  select * into u from auth.users where id=auth.uid() for share;
  if not found or u.is_anonymous is distinct from false or u.deleted_at is not null
    or (u.banned_until is not null and u.banned_until>clock_timestamp()) then
    raise exception 'current managed adult account required' using errcode='42501';
  end if;
  select * into s from auth.sessions where id::text=j->>'session_id'
    and user_id=auth.uid() for share;
  if not found or s.aal::text is distinct from j->>'aal'
    or (s.not_after is not null and s.not_after<=clock_timestamp()) then
    raise exception 'current managed adult session required' using errcode='42501';
  end if;
  -- READ COMMITTED locking reads observe the committed replacement after a wait.
  -- Locks remain held through the RPC transaction and its second session check.
  select * into g from portal_private.write_session_generation where session_id=s.id for share;
  if not found or g.user_id is distinct from auth.uid()
    or g.generation::text is distinct from j->>'aiea_write_generation' then
    raise exception 'current managed adult session required' using errcode='42501';
  end if;
  select * into p from portal.user_profile where user_id=auth.uid() for share;
  if not found or p.status<>'ACTIVE' or p.adult_confirmed_at is null then
    raise exception 'active adult required' using errcode='42501';
  end if;
end $$;
revoke all on function portal_private.assert_write_session()
  from public,anon,authenticated,service_role,supabase_auth_admin;
commit;
