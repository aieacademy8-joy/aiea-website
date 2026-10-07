-- Isolated test runtime ONLY. Never run this on a Supabase project.
-- Fail rather than overwrite an existing managed auth schema.
create schema auth;
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create table auth.users(id uuid primary key);
-- Minimal managed assurance shape for SQL fixtures only; native tests use Auth.
create table auth.mfa_factors(id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,
  factor_type text not null,status text not null,created_at timestamptz not null,updated_at timestamptz not null);
create table auth.sessions(id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,
  factor_id uuid,aal text,not_after timestamptz);
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb
$$;
create function auth.uid() returns uuid language sql stable as $$
  select (auth.jwt()->>'sub')::uuid
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid(), auth.jwt() to anon, authenticated, service_role;
