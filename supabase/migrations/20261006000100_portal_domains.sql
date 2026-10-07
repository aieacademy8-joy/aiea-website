-- Authority: docs/portal/AIEA_Portal_P0_Architecture_and_Data_Contract_v1.0_FROZEN.md
-- Repository scaffold only. No remote execution is authorized by Sprint 01A.
begin;
create schema portal;
create schema portal_private;
revoke all on schema portal, portal_private from public, anon, authenticated;
grant usage on schema portal to authenticated, service_role;
grant usage on schema portal_private to authenticated, service_role;
alter default privileges in schema portal revoke all on tables from public, anon, authenticated;
alter default privileges in schema portal_private revoke execute on functions from public, anon, authenticated;

create table portal.user_profile (
  user_id uuid primary key references auth.users(id) on delete restrict,
  preferred_locale text not null default 'en-US',
  adult_confirmed_at timestamptz not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
comment on column portal.user_profile.adult_confirmed_at is
  'Server-recorded adult onboarding confirmation; not inferred from user_metadata. Not age verification.';
create table portal.workspace (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('FAMILY','SCHOOL')),
  display_name text not null check (length(display_name) between 1 and 120),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(id,kind)
);
create table portal.workspace_membership (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null, workspace_kind text not null,
  user_id uuid references auth.users(id) on delete set null,
  role text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE','REVOKED')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(workspace_id,workspace_kind) references portal.workspace(id,kind) on delete restrict,
  check ((workspace_kind='FAMILY' and role='OWNER') or
         (workspace_kind='SCHOOL' and role in ('OWNER','SCHOOL_ADMIN','TEACHER'))),
  unique(id,workspace_id)
);
create unique index membership_one_active on portal.workspace_membership(workspace_id,user_id) where status='ACTIVE';
create index membership_user_access on portal.workspace_membership(user_id,workspace_id,status);
create table portal.staff_authorization (
  user_id uuid primary key references auth.users(id) on delete restrict,
  capabilities text[] not null check (cardinality(capabilities)>0 and
    capabilities <@ array['STAFF_MANAGE','CURRICULUM_PUBLISH','ENTITLEMENT_MANAGE','SUPPORT_READ','EXPORT','PRIVACY_MANAGE']::text[]),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','REVOKED')),
  granted_by uuid references auth.users(id) on delete set null, granted_at timestamptz not null default now(),
  revoked_by uuid references auth.users(id) on delete set null, revoked_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((status='ACTIVE' and revoked_at is null) or (status='REVOKED' and revoked_at is not null))
);
create table portal.learner_ref (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references portal.workspace(id) on delete restrict,
  display_code text not null check(length(display_code) between 1 and 60),
  age_band text check(length(age_band)<=40), grade_band text check(length(grade_band)<=40),
  status text not null default 'ACTIVE' check(status in ('ACTIVE','INACTIVE')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(id,workspace_id)
);
comment on table portal.learner_ref is 'No auth identity, name requirement, DOB, email, media, or upload fields. Use nickname/initials/generated code.';
create table portal.cohort (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null,
  workspace_kind text not null default 'SCHOOL' check(workspace_kind='SCHOOL'),
  display_code text not null check(length(display_code) between 1 and 80),
  status text not null default 'ACTIVE' check(status in ('ACTIVE','INACTIVE')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(workspace_id,workspace_kind) references portal.workspace(id,kind) on delete restrict,
  unique(id,workspace_id)
);
create table portal.cohort_teacher_assignment (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null,
  cohort_id uuid not null, workspace_membership_id uuid not null,
  status text not null default 'ACTIVE' check(status in ('ACTIVE','REVOKED')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(cohort_id,workspace_id) references portal.cohort(id,workspace_id) on delete restrict,
  foreign key(workspace_membership_id,workspace_id) references portal.workspace_membership(id,workspace_id) on delete restrict
);
create unique index teacher_assignment_one_active on portal.cohort_teacher_assignment(cohort_id,workspace_membership_id) where status='ACTIVE';
create index teacher_assignment_access on portal.cohort_teacher_assignment(workspace_membership_id,cohort_id,status);
create table portal.cohort_learner_assignment (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null,
  cohort_id uuid not null, learner_ref_id uuid not null,
  status text not null default 'ACTIVE' check(status in ('ACTIVE','REVOKED')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(cohort_id,workspace_id) references portal.cohort(id,workspace_id) on delete restrict,
  foreign key(learner_ref_id,workspace_id) references portal.learner_ref(id,workspace_id) on delete restrict
);
create unique index learner_assignment_one_active on portal.cohort_learner_assignment(cohort_id,learner_ref_id) where status='ACTIVE';
create index learner_assignment_access on portal.cohort_learner_assignment(learner_ref_id,cohort_id,status);

create table portal.program (
  id uuid primary key default gen_random_uuid(), program_key text not null unique check(program_key ~ '^[a-z0-9][a-z0-9_-]*$'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table portal.program_version (
  id uuid primary key default gen_random_uuid(), program_id uuid not null references portal.program(id) on delete restrict,
  version_key text not null, status text not null default 'DRAFT' check(status in ('DRAFT','REVIEW_READY','PUBLISHED','RETIRED')),
  default_locale text not null, fallback_locale text,
  completion_rules jsonb not null default '{}' check(jsonb_typeof(completion_rules)='object'),
  published_by uuid references auth.users(id) on delete set null, published_at timestamptz,
  content_hash text check(content_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(program_id,version_key),
  check(status not in ('PUBLISHED','RETIRED') or (published_at is not null and content_hash is not null))
);
create table portal.program_version_locale (
  program_version_id uuid not null references portal.program_version(id) on delete restrict,
  locale_code text not null check(locale_code ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'),
  title text not null, description text not null default '', guidance text not null default '',
  status text not null default 'DRAFT' check(status in ('DRAFT','PUBLISHED')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key(program_version_id,locale_code)
);
alter table portal.program_version add constraint version_default_locale
  foreign key(id,default_locale) references portal.program_version_locale(program_version_id,locale_code) deferrable initially deferred;
alter table portal.program_version add constraint version_fallback_locale
  foreign key(id,fallback_locale) references portal.program_version_locale(program_version_id,locale_code) deferrable initially deferred;
create table portal.mission (
  id uuid primary key default gen_random_uuid(), program_version_id uuid not null references portal.program_version(id) on delete restrict,
  mission_key text not null, sequence integer not null check(sequence>0),
  evidence_expectations jsonb not null default '{}' check(jsonb_typeof(evidence_expectations)='object'),
  completion_rules jsonb not null default '{}' check(jsonb_typeof(completion_rules)='object'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(program_version_id,mission_key), unique(program_version_id,sequence), unique(id,program_version_id)
);
create table portal.mission_locale (
  mission_id uuid not null, program_version_id uuid not null, locale_code text not null,
  title text not null, instructions text not null, reflection text not null default '',
  content_blocks jsonb not null default '[]' check(jsonb_typeof(content_blocks)='array'),
  status text not null default 'DRAFT' check(status in ('DRAFT','PUBLISHED')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key(mission_id,locale_code),
  foreign key(mission_id,program_version_id) references portal.mission(id,program_version_id) on delete restrict,
  foreign key(program_version_id,locale_code) references portal.program_version_locale(program_version_id,locale_code) on delete restrict
);
create table portal.resource_asset (
  id uuid primary key default gen_random_uuid(), program_version_id uuid not null references portal.program_version(id) on delete restrict,
  mission_id uuid, asset_key text not null, locale_code text, locale_neutral boolean not null default false,
  blob_path text not null check(length(blob_path) between 1 and 1024 and blob_path !~ '://'),
  content_hash text not null check(content_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(mission_id,program_version_id) references portal.mission(id,program_version_id) on delete restrict,
  foreign key(program_version_id,locale_code) references portal.program_version_locale(program_version_id,locale_code) on delete restrict,
  check((locale_neutral and locale_code is null) or (not locale_neutral and locale_code is not null)),
  unique(program_version_id,asset_key)
);
comment on column portal.resource_asset.blob_path is 'AIEA-published versioned private Vercel Blob pathname only; no signed URL or learner upload.';
create table portal.assessment (
  id uuid primary key default gen_random_uuid(), program_version_id uuid not null references portal.program_version(id) on delete restrict,
  assessment_key text not null, phase text not null check(phase in ('PRE','POST')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(program_version_id,assessment_key), unique(id,program_version_id)
);
create table portal.assessment_locale (
  assessment_id uuid not null, program_version_id uuid not null, locale_code text not null,
  title text not null, instructions text not null,
  status text not null default 'DRAFT' check(status in ('DRAFT','PUBLISHED')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key(assessment_id,locale_code),
  foreign key(assessment_id,program_version_id) references portal.assessment(id,program_version_id) on delete restrict,
  foreign key(program_version_id,locale_code) references portal.program_version_locale(program_version_id,locale_code) on delete restrict
);
create table portal.assessment_item (
  id uuid primary key default gen_random_uuid(), assessment_id uuid not null, program_version_id uuid not null,
  item_key text not null, sequence integer not null check(sequence>0),
  response_option_keys text[] not null check(cardinality(response_option_keys)>0),
  scoring_rules jsonb not null default '{}' check(jsonb_typeof(scoring_rules)='object'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(assessment_id,program_version_id) references portal.assessment(id,program_version_id) on delete restrict,
  unique(assessment_id,item_key), unique(assessment_id,sequence), unique(id,assessment_id,program_version_id)
);
create table portal.assessment_item_locale (
  assessment_item_id uuid not null, assessment_id uuid not null, program_version_id uuid not null, locale_code text not null,
  prompt text not null, response_option_labels jsonb not null check(jsonb_typeof(response_option_labels)='object'),
  status text not null default 'DRAFT' check(status in ('DRAFT','PUBLISHED')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key(assessment_item_id,locale_code),
  foreign key(assessment_item_id,assessment_id,program_version_id) references portal.assessment_item(id,assessment_id,program_version_id) on delete restrict,
  foreign key(assessment_id,locale_code) references portal.assessment_locale(assessment_id,locale_code) on delete restrict
);

create table portal.billing_reference (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references portal.workspace(id) on delete restrict,
  program_version_id uuid not null references portal.program_version(id) on delete restrict,
  initiating_user_id uuid references auth.users(id) on delete set null,
  offering_key text not null, environment text not null check(environment in ('test','live')),
  idempotency_key text not null unique, stripe_account_id text not null,
  stripe_product_id text not null, stripe_price_id text not null,
  checkout_session_id text unique, payment_intent_id text unique, charge_id text unique,
  customer_id text, refund_id text unique, dispute_id text unique,
  subscription_id text unique check(subscription_id is null), invoice_id text unique check(invoice_id is null),
  status text not null default 'PENDING' check(status in ('CHECKOUT_CREATED','PENDING','PAID','PARTIALLY_REFUNDED','REFUNDED','DISPUTE_OPEN','DISPUTE_WON','DISPUTE_LOST')),
  provider_status text, notification_status text not null default 'NOT_REQUESTED' check(notification_status in ('NOT_REQUESTED','PENDING','SENT','RETRYABLE_FAILED')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(id,workspace_id,program_version_id)
);
comment on column portal.billing_reference.customer_id is 'Not globally unique: a Customer can make multiple purchases. Latest refund/dispute IDs are summaries; stripe_event retains all relevant provider object IDs.';
create index billing_workspace on portal.billing_reference(workspace_id);
create table portal.stripe_event (
  id uuid primary key default gen_random_uuid(), provider_event_id text not null unique,
  billing_reference_id uuid references portal.billing_reference(id) on delete restrict,
  environment text not null check(environment in ('test','live')), stripe_account_id text not null,
  event_type text not null, provider_object_id text not null,
  payload_hash text not null check(payload_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'PROCESSING' check(status in ('PROCESSING','APPLIED','IGNORED','RETRYABLE_FAILED','TERMINAL_ERROR')),
  failure_code text check(length(failure_code)<=100), provider_created_at timestamptz not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index stripe_event_billing on portal.stripe_event(billing_reference_id);
create table portal.entitlement (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, program_version_id uuid not null,
  billing_reference_id uuid not null,
  status text not null default 'ACTIVE' check(status in ('ACTIVE','SUSPENDED','REVOKED')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(billing_reference_id,workspace_id,program_version_id) references portal.billing_reference(id,workspace_id,program_version_id) on delete restrict
);
create unique index entitlement_one_active on portal.entitlement(workspace_id,program_version_id,billing_reference_id) where status='ACTIVE';
create index entitlement_access on portal.entitlement(workspace_id,program_version_id,status);

create table portal.cohort_mission_delivery (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, cohort_id uuid not null,
  mission_id uuid not null, program_version_id uuid not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'STARTED' check(status in ('STARTED','DELIVERED')),
  started_at timestamptz not null default now(), delivered_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(cohort_id,workspace_id) references portal.cohort(id,workspace_id) on delete restrict,
  foreign key(mission_id,program_version_id) references portal.mission(id,program_version_id) on delete restrict,
  unique(cohort_id,mission_id),
  check((status='STARTED' and delivered_at is null) or (status='DELIVERED' and delivered_at is not null and delivered_at>=started_at))
);
create table portal.mission_progress (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, learner_ref_id uuid not null,
  mission_id uuid not null, program_version_id uuid not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'NOT_STARTED' check(status in ('NOT_STARTED','IN_PROGRESS','COMPLETED')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(learner_ref_id,workspace_id) references portal.learner_ref(id,workspace_id) on delete restrict,
  foreign key(mission_id,program_version_id) references portal.mission(id,program_version_id) on delete restrict,
  unique(learner_ref_id,mission_id)
);
create table portal.assessment_attempt (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, learner_ref_id uuid not null,
  assessment_id uuid not null, program_version_id uuid not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'DRAFT' check(status in ('DRAFT','FINALIZED')), finalized_at timestamptz,
  locale_code text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(learner_ref_id,workspace_id) references portal.learner_ref(id,workspace_id) on delete restrict,
  foreign key(assessment_id,program_version_id) references portal.assessment(id,program_version_id) on delete restrict,
  foreign key(assessment_id,locale_code) references portal.assessment_locale(assessment_id,locale_code) on delete restrict,
  unique(id,assessment_id,program_version_id), unique(id,learner_ref_id,workspace_id,program_version_id),
  check((status='DRAFT' and finalized_at is null) or (status='FINALIZED' and finalized_at is not null))
);
create table portal.assessment_response (
  id uuid primary key default gen_random_uuid(), assessment_attempt_id uuid not null,
  assessment_item_id uuid not null, assessment_id uuid not null, program_version_id uuid not null,
  response_option_key text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(assessment_attempt_id,assessment_id,program_version_id) references portal.assessment_attempt(id,assessment_id,program_version_id) on delete restrict,
  foreign key(assessment_item_id,assessment_id,program_version_id) references portal.assessment_item(id,assessment_id,program_version_id) on delete restrict,
  unique(assessment_attempt_id,assessment_item_id)
);
create table portal.evidence_record (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null, learner_ref_id uuid not null,
  program_version_id uuid not null references portal.program_version(id) on delete restrict,
  mission_id uuid, assessment_attempt_id uuid,
  requirement_key text, evidence_type text not null check(evidence_type in ('OBSERVATION','REFLECTION','ASSESSMENT_SUPPORT','MISSION_EVIDENCE')),
  actor_user_id uuid references auth.users(id) on delete set null,
  note text not null check(length(note)<=4000), entered_locale text not null,
  status text not null default 'DRAFT' check(status in ('DRAFT','SUBMITTED')), submitted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(learner_ref_id,workspace_id) references portal.learner_ref(id,workspace_id) on delete restrict,
  foreign key(mission_id,program_version_id) references portal.mission(id,program_version_id) on delete restrict,
  foreign key(assessment_attempt_id,learner_ref_id,workspace_id,program_version_id) references portal.assessment_attempt(id,learner_ref_id,workspace_id,program_version_id) on delete restrict,
  check(mission_id is not null or assessment_attempt_id is not null),
  check((status='DRAFT' and submitted_at is null) or (status='SUBMITTED' and submitted_at is not null))
);
create table portal.pilot_feedback (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references portal.workspace(id) on delete restrict,
  program_version_id uuid not null references portal.program_version(id) on delete restrict,
  cohort_id uuid, learner_ref_id uuid,
  actor_user_id uuid references auth.users(id) on delete set null,
  note text not null check(length(note) between 1 and 4000), entered_locale text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(cohort_id,workspace_id) references portal.cohort(id,workspace_id) on delete restrict,
  foreign key(learner_ref_id,workspace_id) references portal.learner_ref(id,workspace_id) on delete restrict
);
create table portal.audit_event (
  id uuid primary key default gen_random_uuid(), actor_user_id uuid references auth.users(id) on delete set null,
  action text not null, object_type text not null, object_id text not null,
  workspace_id uuid references portal.workspace(id) on delete restrict,
  -- Intentionally exclude user notes, raw provider payloads, email and full records.
  details jsonb not null default '{}' check(jsonb_typeof(details)='object' and octet_length(details::text)<=2048),
  created_at timestamptz not null default now()
);
create index audit_workspace_time on portal.audit_event(workspace_id,created_at);

-- Index leading columns for tenant FKs and bounded support reads.
do $$ declare t text; begin
  foreach t in array array['learner_ref','cohort','cohort_teacher_assignment','cohort_learner_assignment',
    'cohort_mission_delivery','mission_progress','assessment_attempt','evidence_record','pilot_feedback'] loop
    execute format('create index %I on portal.%I(workspace_id)',t||'_workspace_idx',t);
  end loop;
end $$;
commit;
