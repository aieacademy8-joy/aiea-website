# AIEA Portal — Hosted Metadata Preflight Package v1.0

Date: **2026-10-09 (America/Chicago)**. Final Human Authority: **Irene**.  
Accepted source: `e1b2b8b0e880e2d5a277060514e9a8dac8ffdaa0`.  
Mode: **metadata only; SQL prepared, not executed**.  
Release-engineering input: [Hosted Migration Reconciliation Handoff v1.0](AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md).

This package is the only repository change authorized by this task. It prepares five read-only SQL batches for Irene's manual SQL Editor review. It does not authorize migrations, permission changes, hook activation, provider configuration, rehearsal writes, deployment, Git publication, or Sprint 01E. Migration and release decisions remain **STOP** pending evidence and separate approval.

## 1. Existing evidence and its limits

| Classification | Evidence | Limit |
| --- | --- | --- |
| VERIFIED — repository | HEAD is the accepted commit above; all five migration files match its bytes and the reconciliation handoff's SHA-256 manifest. | Source identity does not establish hosted installation or compatibility. |
| VERIFIED — documentary evidence | Accepted 01D reports record local HR03 acceptance, independent PASS, and 01D-A01 CLOSED. | Execution results remain REPORTED here; no tests were rerun. |
| VERIFIED AS RECORDED — supplied hosted evidence | The current handoff labels user-supplied SQL results verified: PostgreSQL 17.11, inventory role `postgres`, `public` owned by `pg_database_owner`, both Portal schemas absent, no tables/views/sequences in the three inspected schemas, no expected Portal functions, public `rls_auto_enable()` present, and migration-history relation absent. | This task did not receive/reinspect the original SQL, screenshots, or result grids and did not contact Supabase. These facts are carried forward with the handoff's provenance, not independently reverified or expanded. |
| UNKNOWN | Exact target/observation context, current catalog state, Auth structures/privileges, defaults/event triggers, API exposure, existing Auth consumers, runner/recovery readiness and hosted behavior. | The batches and operator checklist address metadata gaps; runtime guarantees still require separately authorized rehearsal. |

The inventory supports **initial application of five migrations**, conditional on unchanged target metadata. It does not justify migration-history repair or the claim that the whole project is empty. No Portal schemas today does not prove SQL was never attempted or later removed.

Accepted order and hashes:

| Order | Migration | SHA-256 |
| --- | --- | --- |
| M1 | `20261006000100_portal_domains.sql` | `f0bdbe5ed8f4f622362c0a6c149bc26644b06552b8a7358b8d792dbfe05a8464` |
| M2 | `20261006000200_portal_security.sql` | `b5afa539f70e34b6c22080a582de22cc484d294b8f368e11e08c141f745184d4` |
| M3 | `20261006000300_portal_guards.sql` | `8fababc9491321f176fcfbf5196ff44a98a41bd657d263a897f51498837bb486` |
| M4 | `20261008000100_portal_mission_status.sql` | `e05eb2bba019b17f4d72b40f7f7b033eef5450fcdb81f90be842a9fc8af5ba6f` |
| M5 | `20261008000200_portal_write_generation.sql` | `d958198cc2bb77599e593420c25cb63e33a2748af5ddeed163cdbdfbf7c1c7b0` |

M4 alone contains the historical timestamp gate. M5 replaces it with exact signed per-session generation verification. Both files must remain unchanged and ordered. Each migration commits separately. A maintenance boundary must cover direct RPC, direct SQL, service clients and jobs before M1, not merely the Portal UI. Installation of M5 does not activate its hook.

## 2. Human operator checklist and SQL safety

1. In the existing authenticated Dashboard, confirm the intended production project, environment and database. Record a nonsensitive project label and observation time. Do not copy project passwords, connection strings, API keys, JWTs, hook secrets, SMTP credentials or personal user pages.
2. Confirm the SQL Editor execution role. These queries describe that role; they do not switch roles. If the future runner uses a different owner/role, its privilege evidence remains UNKNOWN and needs its own approved metadata review.
3. Review the complete batch before executing it. Run batches 1–5 individually, in order, without concurrent migration/configuration work. Each begins `READ ONLY` and ends `ROLLBACK`. No migration statement is included.
4. Save **every SELECT result grid**, batch/query label, column headers, timestamp, completeness and sanitized errors. If the Editor shows only one grid, execute one labeled SELECT at a time enclosed by the same `BEGIN ... READ ONLY;` / `ROLLBACK;` wrapper. Do not remove the read-only protection.
5. On error, issue only `ROLLBACK;` if the transaction remains open, record a sanitized error and stop that batch. Do not grant access, change roles, repair objects or weaken the query to obtain a result. A denied/incomplete query is UNKNOWN, not PASS. Rerunning the unchanged read-only batch after an unrelated transient issue must be labeled as a separate attempt.
6. Review outputs before sharing. Catalog object names normally describe infrastructure, but redact any unusual identifier containing an email/personal identifier. Do not include unrelated Dashboard panels or raw logs. Retain sensitive operator context privately.
7. Complete the Dashboard checklist below without changing controls. Return the result package to Irene for reconciliation; do not run migrations or activate anything.

**Safety review:** SQL reads `pg_catalog` metadata and invokes only qualified PostgreSQL information/privilege/formatting functions. It never selects records from `auth.users`, `auth.sessions`, MFA tables, Portal domains, Storage, Vault or migration-ledger contents. It never reads password catalogs, routine bodies, policy expressions, view definitions, query text, connection strings, or unrestricted configuration arrays. Role flags come from `pg_roles`, not `pg_authid`. Unknown/custom role identities are masked to catalog OIDs in expanded ACL/membership outputs.

There is no DML, DDL, `DO`, dynamic SQL, `COPY`, `SELECT INTO`, `EXPLAIN ANALYZE`, row-lock clause, role switch, `set_config`, sequence allocation/reset, application-function invocation, network function, history repair, or configuration mutation. `BEGIN READ ONLY` and `ROLLBACK` affect only the temporary transaction. Metadata reads can still take ordinary catalog read locks and produce normal provider query logs; this is not a zero-load operation. Neither the SQL Editor wrapper nor individual SQL statements were executed by this agent.

## 3. SQL Batch 1 — context, absence and naming reconciliation

Purpose: refresh the narrow handoff inventory and expose drift/collisions without reading any application rows. Results are a per-batch snapshot, not a project-wide empty-state proof.

```sql
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;

-- B1.1: Context. No network addresses or connection strings.
SELECT CURRENT_TIMESTAMP AS observed_at,
       pg_catalog.current_database() AS database_name,
       SESSION_USER AS session_role,
       CURRENT_USER AS effective_role,
       pg_catalog.current_setting('server_version') AS server_version,
       pg_catalog.current_setting('server_version_num') AS server_version_num,
       pg_catalog.current_setting('transaction_read_only') AS read_only_guard;

-- B1.2: Expected namespaces, relation counts, and ledger existence only.
WITH wanted(schema_name) AS (
  VALUES ('public'), ('portal'), ('portal_private'), ('supabase_migrations')
)
SELECT w.schema_name, n.oid IS NOT NULL AS schema_exists,
       pg_catalog.pg_get_userbyid(n.nspowner) AS schema_owner,
       (SELECT pg_catalog.count(*) FROM pg_catalog.pg_class c
         WHERE c.relnamespace = n.oid AND c.relkind IN ('r','p')) AS tables,
       (SELECT pg_catalog.count(*) FROM pg_catalog.pg_class c
         WHERE c.relnamespace = n.oid AND c.relkind IN ('v','m')) AS views,
       (SELECT pg_catalog.count(*) FROM pg_catalog.pg_class c
         WHERE c.relnamespace = n.oid AND c.relkind = 'S') AS sequences,
       (SELECT pg_catalog.count(*) FROM pg_catalog.pg_proc p
         WHERE p.pronamespace = n.oid) AS routines,
       pg_catalog.to_regclass('supabase_migrations.schema_migrations')
         IS NOT NULL AS migration_ledger_exists
FROM wanted w
LEFT JOIN pg_catalog.pg_namespace n ON n.nspname = w.schema_name
ORDER BY w.schema_name;

-- B1.3: Exact accepted relation names found anywhere (metadata only).
WITH wanted(object_name) AS (
  VALUES ('user_profile'), ('workspace'), ('workspace_membership'),
    ('staff_authorization'), ('learner_ref'), ('cohort'),
    ('cohort_teacher_assignment'), ('cohort_learner_assignment'),
    ('program'), ('program_version'), ('program_version_locale'),
    ('mission'), ('mission_locale'), ('resource_asset'), ('assessment'),
    ('assessment_locale'), ('assessment_item'), ('assessment_item_locale'),
    ('billing_reference'), ('stripe_event'), ('entitlement'),
    ('cohort_mission_delivery'), ('mission_progress'), ('assessment_attempt'),
    ('assessment_response'), ('evidence_record'), ('pilot_feedback'),
    ('audit_event'), ('write_session_generation'), ('write_generation_seq')
)
SELECT n.nspname AS schema_name, c.relname AS object_name,
       c.relkind AS object_kind,
       pg_catalog.pg_get_userbyid(c.relowner) AS owner_role
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
JOIN wanted w ON w.object_name = c.relname
WHERE n.nspname NOT IN ('pg_catalog','information_schema')
  AND n.nspname NOT LIKE 'pg_toast%'
  AND n.nspname NOT LIKE 'pg_temp_%'
ORDER BY n.nspname, c.relname;

-- B1.4: Accepted routine names/overloads and the known public event helper.
-- No routine is invoked; no body/default-argument text is returned.
WITH wanted(routine_name) AS (
  VALUES ('is_adult'), ('member_role'), ('can_cohort'), ('can_learner'),
    ('has_version'), ('can_version'), ('can_attempt'), ('staff_has'),
    ('touch_updated_at'), ('audit_change'), ('audit_append_only'),
    ('guard_version'), ('guard_curriculum'), ('guard_program'),
    ('guard_option_keys'), ('guard_entitlement'), ('guard_billing'),
    ('guard_billing_access'), ('guard_staff'), ('guard_stripe_event'),
    ('guard_learning'), ('guard_response'), ('resolve_locale'),
    ('assert_write_session'), ('lock_status_authority'),
    ('attestation_allowed'), ('record_mission_progress'),
    ('record_cohort_delivery'), ('issue_write_generation'), ('rls_auto_enable')
)
SELECT n.nspname AS schema_name, p.proname AS routine_name,
       pg_catalog.oidvectortypes(p.proargtypes) AS input_types,
       pg_catalog.format_type(p.prorettype, NULL) AS return_type,
       pg_catalog.pg_get_userbyid(p.proowner) AS owner_role,
       p.prokind AS routine_kind, l.lanname AS language,
       p.prosecdef AS security_definer, p.provolatile AS volatility
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
JOIN pg_catalog.pg_language l ON l.oid = p.prolang
JOIN wanted w ON w.routine_name = p.proname
WHERE n.nspname NOT IN ('pg_catalog','information_schema')
ORDER BY n.nspname, p.proname, input_types;

ROLLBACK;
```

Expected: `read_only_guard = on`; reported engine 17.11 and role `postgres`; `public` exists with the recorded owner; Portal schemas absent; zero product relation counts in the recorded three schemas; ledger absent. The `supabase_migrations` namespace itself may exist even when the ledger does not. `public.rls_auto_enable()` returning `event_trigger` is consistent with the handoff, but its ownership/security properties were previously UNKNOWN. Matching object names in other schemas are review candidates, not automatically AIEA objects. A different version/owner/context, any Portal installation, an existing ledger or an unexplained collision requires reconciliation before migration approval. Do not query a newly discovered ledger's statements, mark versions applied, or drop anything.

Limits: name matching does not detect renamed objects or wrappers using dynamic SQL/external code. Absence here must be supplemented by the operator's application/writer inventory. Changes between batches invalidate a combined-snapshot claim.

## 4. SQL Batch 2 — managed Auth contract and UUID resolution

Purpose: establish only the structures used by M1–M5. Do not query the managed tables themselves or call `auth.uid()`, `auth.jwt()` or the UUID generator.

```sql
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;

-- B2.1: Required managed columns, actual types, owners and RLS flags.
WITH wanted(table_name, column_name) AS (
  VALUES ('users','id'), ('users','is_anonymous'),
    ('users','deleted_at'), ('users','banned_until'),
    ('sessions','id'), ('sessions','user_id'), ('sessions','aal'),
    ('sessions','not_after'), ('sessions','factor_id'),
    ('sessions','refreshed_at'), ('mfa_factors','id'),
    ('mfa_factors','user_id'), ('mfa_factors','factor_type'),
    ('mfa_factors','status')
)
SELECT w.table_name, w.column_name,
       c.oid IS NOT NULL AS table_exists,
       a.attnum IS NOT NULL AS column_exists,
       pg_catalog.format_type(a.atttypid, a.atttypmod) AS actual_type,
       a.attnotnull AS not_null,
       pg_catalog.pg_get_userbyid(c.relowner) AS owner_role,
       c.relkind AS relation_kind,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced
FROM wanted w
LEFT JOIN pg_catalog.pg_namespace n ON n.nspname = 'auth'
LEFT JOIN pg_catalog.pg_class c
  ON c.relnamespace = n.oid AND c.relname = w.table_name
LEFT JOIN pg_catalog.pg_attribute a
  ON a.attrelid = c.oid AND a.attname = w.column_name
  AND a.attnum > 0 AND NOT a.attisdropped
ORDER BY w.table_name, w.column_name;

-- B2.2: Single-column, valid, nonpartial UUID id uniqueness for FK targets.
WITH wanted(table_name) AS (VALUES ('users'), ('sessions'))
SELECT w.table_name, c.oid IS NOT NULL AS table_exists,
       EXISTS (
         SELECT 1 FROM pg_catalog.pg_index i
         JOIN pg_catalog.pg_attribute a
           ON a.attrelid = c.oid AND a.attname = 'id'
           AND a.attnum > 0 AND NOT a.attisdropped
         WHERE i.indrelid = c.oid AND i.indisunique
           AND i.indisvalid AND i.indisready AND i.indimmediate
           AND i.indpred IS NULL AND i.indexprs IS NULL
           AND i.indnkeyatts = 1 AND i.indkey[0] = a.attnum
       ) AS immediate_unique_id_index
FROM wanted w
LEFT JOIN pg_catalog.pg_namespace n ON n.nspname = 'auth'
LEFT JOIN pg_catalog.pg_class c
  ON c.relnamespace = n.oid AND c.relname = w.table_name
ORDER BY w.table_name;

-- B2.3: Enum labels, if these managed attributes use enum types.
SELECT c.relname AS table_name, a.attname AS column_name,
       tn.nspname AS type_schema, t.typname AS type_name,
       e.enumlabel AS allowed_label
FROM pg_catalog.pg_namespace n
JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid
JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid
JOIN pg_catalog.pg_type t ON t.oid = a.atttypid
JOIN pg_catalog.pg_namespace tn ON tn.oid = t.typnamespace
JOIN pg_catalog.pg_enum e ON e.enumtypid = t.oid
WHERE n.nspname = 'auth' AND a.attnum > 0 AND NOT a.attisdropped
  AND ((c.relname = 'sessions' AND a.attname = 'aal')
    OR (c.relname = 'mfa_factors' AND a.attname IN ('factor_type','status')))
ORDER BY c.relname, a.attname, e.enumsortorder;

-- B2.4: Zero-argument function resolution only; none is executed.
WITH wanted(signature) AS (
  VALUES ('auth.uid()'), ('auth.jwt()'), ('gen_random_uuid()')
)
SELECT w.signature, p.oid IS NOT NULL AS function_exists,
       n.nspname AS resolved_schema,
       pg_catalog.format_type(p.prorettype, NULL) AS return_type,
       pg_catalog.pg_get_userbyid(p.proowner) AS owner_role,
       p.prosecdef AS security_definer, p.prokind AS routine_kind
FROM wanted w
LEFT JOIN pg_catalog.pg_proc p
  ON p.oid = pg_catalog.to_regprocedure(w.signature)
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
ORDER BY w.signature;

-- B2.5: Managed-table policy metadata; no USING/WITH CHECK expression text.
SELECT c.relname AS table_name, p.polname AS policy_name,
       p.polcmd AS command_code, p.polpermissive AS permissive,
       p.polroles AS role_oids
FROM pg_catalog.pg_policy p
JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'auth' AND c.relname IN ('users','sessions','mfa_factors')
ORDER BY c.relname, p.polname;

-- B2.6: Noninternal managed-table trigger metadata; no body/argument contents.
SELECT c.relname AS table_name, t.tgname AS trigger_name,
       t.tgenabled AS enable_mode,
       (t.tgtype::integer & 1) <> 0 AS row_trigger,
       (t.tgtype::integer & 4) <> 0 AS on_insert,
       (t.tgtype::integer & 8) <> 0 AS on_delete,
       (t.tgtype::integer & 16) <> 0 AS on_update,
       fn.nspname AS function_schema, p.proname AS function_name,
       p.prosecdef AS function_security_definer
FROM pg_catalog.pg_trigger t
JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
JOIN pg_catalog.pg_proc p ON p.oid = t.tgfoid
JOIN pg_catalog.pg_namespace fn ON fn.oid = p.pronamespace
WHERE n.nspname = 'auth' AND c.relname IN ('users','sessions','mfa_factors')
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

ROLLBACK;
```

Expected interpretation:

- All fourteen columns exist on real managed tables. IDs/user IDs/factor IDs are UUID; `is_anonymous` is boolean; account deletion/ban and session deadline fields are compatible timestamps. `refreshed_at` is a compatible timestamp used by M4's historical intermediate body; M5 removes that comparison. Review actual timestamp/time-zone types rather than treating every difference as equivalent.
- `users.id` and `sessions.id` are nonnull UUID with immediate usable uniqueness. Both uniqueness flags should be true for the accepted foreign keys. Metadata presence is necessary, not an attempted FK-creation proof.
- AAL supports `aal1`/`aal2`; factor type supports `totp`; factor status supports `verified`. If a field is text rather than enum, B2.3 has no row for it; this is not proof those values or constraints are compatible. Stop for a scoped constraint/type review if needed; do not export arbitrary CHECK expressions.
- `auth.uid()` returns UUID; `auth.jwt()` returns JSONB; the visible zero-argument UUID routine returns UUID. PostgreSQL 17's `pg_catalog.gen_random_uuid()` is the expected built-in resolution. An application-defined shadow routine or missing helper requires review. Reconfirm runner search-path equivalence in batch 5; resolution under the Editor role is not resolution under every runner.
- RLS flags/owners are metadata only. Do not change provider-managed Auth RLS or ownership to force compatibility.
- B2.5 policy command codes are `r` SELECT, `a` INSERT, `w` UPDATE, `d` DELETE and `*` ALL; role OID 0 means PUBLIC. Compare other role OIDs with B3.1. Empty policy/trigger results do not imply unrestricted table access. Additional managed-row policies or custom triggers need provider/operator reconciliation of behavior without exporting their bodies/arguments; metadata cannot prove they allow the hook/gates to run.

## 5. SQL Batch 3 — roles, memberships and necessary Auth privileges

Purpose: inspect effective privilege predicates without assuming ordinary grants, switching roles, invoking helpers or acquiring managed-row locks. NULL/missing rows are not a positive result.

```sql
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;

-- B3.1: Required role flags; never password/configuration fields.
WITH wanted(role_name) AS (
  VALUES ('postgres'), ('anon'), ('authenticated'), ('service_role'),
    ('authenticator'), ('supabase_auth_admin'), ('pg_database_owner'),
    (CURRENT_USER::text)
)
SELECT DISTINCT w.role_name, r.oid AS role_oid, r.oid IS NOT NULL AS role_exists,
       r.rolsuper AS superuser, r.rolbypassrls AS bypass_rls,
       r.rolinherit AS inherits, r.rolcanlogin AS can_login,
       r.rolcreaterole AS can_create_roles
FROM wanted w
LEFT JOIN pg_catalog.pg_roles r ON r.rolname = w.role_name
ORDER BY w.role_name;

-- B3.2: Effective/transitive membership between the relevant roles.
WITH relevant AS (
  SELECT oid, rolname FROM pg_catalog.pg_roles
  WHERE rolname IN ('postgres','anon','authenticated','service_role',
    'authenticator','supabase_auth_admin','pg_database_owner')
    OR rolname = CURRENT_USER
)
SELECT a.rolname AS actor_role, t.rolname AS target_role,
       pg_catalog.pg_has_role(a.oid, t.oid, 'MEMBER') AS is_member,
       pg_catalog.pg_has_role(a.oid, t.oid, 'USAGE') AS privileges_available,
       pg_catalog.pg_has_role(a.oid, t.oid, 'SET') AS can_set_role
FROM relevant a CROSS JOIN relevant t
WHERE a.oid <> t.oid
ORDER BY a.rolname, t.rolname;

-- B3.3: Direct membership options; custom role names masked.
WITH relevant AS (
  SELECT oid, rolname FROM pg_catalog.pg_roles
  WHERE rolname IN ('postgres','anon','authenticated','service_role',
    'authenticator','supabase_auth_admin','pg_database_owner')
    OR rolname = CURRENT_USER
)
SELECT COALESCE(m.rolname, 'other_role_oid=' || am.member::text) AS member_role,
       COALESCE(t.rolname, 'other_role_oid=' || am.roleid::text) AS granted_role,
       am.admin_option, am.inherit_option, am.set_option
FROM pg_catalog.pg_auth_members am
LEFT JOIN relevant m ON m.oid = am.member
LEFT JOIN relevant t ON t.oid = am.roleid
WHERE m.oid IS NOT NULL OR t.oid IS NOT NULL
ORDER BY member_role, granted_role;

-- B3.4: Necessary managed-table SELECT/UPDATE/FK privileges by role.
WITH targets AS (
  SELECT c.oid, c.relname, a.attnum AS id_column_number
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_catalog.pg_attribute a
    ON a.attrelid = c.oid AND a.attname = 'id'
    AND a.attnum > 0 AND NOT a.attisdropped
  WHERE n.nspname = 'auth' AND c.relname IN ('users','sessions','mfa_factors')
), actors AS (
  SELECT oid, rolname FROM pg_catalog.pg_roles
  WHERE rolname IN ('postgres','anon','authenticated','service_role',
    'authenticator','supabase_auth_admin') OR rolname = CURRENT_USER
)
SELECT r.rolname AS actor_role, c.relname AS managed_table,
       pg_catalog.has_schema_privilege(r.oid, 'auth', 'USAGE') AS auth_usage,
       pg_catalog.has_table_privilege(r.oid, c.oid, 'SELECT') AS table_select,
       NOT EXISTS (
         SELECT 1 FROM pg_catalog.pg_attribute a
         WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
           AND NOT pg_catalog.has_column_privilege(r.oid,c.oid,a.attnum,'SELECT')
       ) AS all_columns_select,
       pg_catalog.has_any_column_privilege(r.oid,c.oid,'UPDATE') AS any_column_update,
       CASE WHEN c.relname IN ('users','sessions')
         AND c.id_column_number IS NOT NULL THEN
         pg_catalog.has_column_privilege(r.oid,c.oid,c.id_column_number,'REFERENCES')
       END AS id_references
FROM actors r CROSS JOIN targets c
ORDER BY r.rolname, c.relname;

-- B3.5: Auth helper EXECUTE privileges only, not helper invocation.
WITH actors AS (
  SELECT oid, rolname FROM pg_catalog.pg_roles
  WHERE rolname IN ('postgres','anon','authenticated','service_role',
    'authenticator','supabase_auth_admin') OR rolname = CURRENT_USER
), helpers AS (
  SELECT p.oid, p.proname FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'auth' AND p.proname IN ('uid','jwt') AND p.pronargs = 0
)
SELECT r.rolname AS actor_role, p.proname AS helper,
       pg_catalog.has_function_privilege(r.oid,p.oid,'EXECUTE') AS can_execute
FROM actors r CROSS JOIN helpers p
ORDER BY r.rolname, p.proname;

ROLLBACK;
```

Interpretation and STOP gates:

- All required roles must exist. The Editor's effective identity is the candidate owner only if the approved runner will use that same role. `pg_database_owner` is a special implicit database-owner role; lack of a direct membership row is not itself a defect.
- `anon`/`authenticated` must not gain `supabase_auth_admin`, `postgres`, superuser or bypass-RLS authority. `authenticator` switching into ordinary API roles is expected provider architecture; membership in `service_role` is not automatically a new defect. Review provider-managed memberships rather than revoking them. Unexpected paths into trusted Auth/owner authority require a STOP and provider/security review. Superuser membership predicates can be true because of superuser privilege; compare B3.1.
- The migration owner needs `auth` USAGE, UUID target REFERENCES and compatible managed Auth read/lock privileges. M4/M5 gate bodies use `SELECT *` on users/sessions, hence all-columns SELECT matters. M2 staff assurance reads sessions/factors. The hook's Auth role needs session SELECT and UPDATE privilege on at least one column for `SELECT ... FOR UPDATE`.
- SELECT plus UPDATE is **only a necessary ACL condition for row locking**. No locks were attempted. RLS/policies, managed ownership and actual Auth transaction visibility still require review/rehearsal. Positive predicates do not establish that a production row could or should be read.
- Future definer access to the forced-RLS private registry must be justified. Owner identity alone does not bypass FORCE RLS. If the intended owner has neither superuser nor BYPASSRLS, the accepted design lacks demonstrated owner access; stop for review, not a privilege repair. M5's private grants cannot be tested before those objects exist.
- B3.4/B3.5 omit absent targets; cross-check completeness against B2 and B3.1. Provider service-role privileges are not browser authorization, and a broad provider grant is not an instruction to remove it in this task.

## 6. SQL Batch 4 — creation rights, defaults and DDL event triggers

Purpose: assess who would own/create objects, potential additive default grants and the known `rls_auto_enable()` event-trigger dependency. No function/trigger/policy definition text is exported.

```sql
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;

-- B4.1: Database CREATE and existing-schema rights; no new schema created.
WITH actors AS (
  SELECT oid, rolname FROM pg_catalog.pg_roles
  WHERE rolname IN ('postgres','anon','authenticated','service_role',
    'authenticator','supabase_auth_admin') OR rolname = CURRENT_USER
), schemas AS (
  SELECT oid, nspname FROM pg_catalog.pg_namespace
  WHERE nspname IN ('public','portal','portal_private','auth')
)
SELECT r.rolname AS actor_role, n.nspname AS existing_schema,
       pg_catalog.has_database_privilege(r.oid,pg_catalog.current_database(),'CREATE')
         AS database_create,
       pg_catalog.has_schema_privilege(r.oid,n.oid,'USAGE') AS schema_usage,
       pg_catalog.has_schema_privilege(r.oid,n.oid,'CREATE') AS schema_create
FROM actors r CROSS JOIN schemas n
ORDER BY r.rolname, n.nspname;

-- B4.2: Owner's global defaults, including built-in defaults if no override.
WITH owner_role AS (
  SELECT oid, rolname FROM pg_catalog.pg_roles WHERE rolname = CURRENT_USER
), kinds(object_type, builtin_type, description) AS (
  VALUES ('r'::"char",'r'::"char",'tables'),
    ('f'::"char",'f'::"char",'routines'),
    ('S'::"char",'s'::"char",'sequences'),
    ('n'::"char",'n'::"char",'schemas')
), known AS (
  SELECT oid, rolname FROM pg_catalog.pg_roles
  WHERE rolname IN ('postgres','anon','authenticated','service_role',
    'authenticator','supabase_auth_admin','pg_database_owner') OR rolname = CURRENT_USER
)
SELECT o.rolname AS future_owner, k.description AS object_type,
       d.oid IS NOT NULL AS has_explicit_global_default,
       CASE WHEN a.grantee = 0 THEN 'PUBLIC'
         ELSE COALESCE(g.rolname,'other_role_oid=' || a.grantee::text) END AS grantee,
       a.privilege_type, a.is_grantable
FROM owner_role o CROSS JOIN kinds k
LEFT JOIN pg_catalog.pg_default_acl d
  ON d.defaclrole = o.oid AND d.defaclnamespace = 0 AND d.defaclobjtype = k.object_type
CROSS JOIN LATERAL pg_catalog.aclexplode(
  COALESCE(d.defaclacl,pg_catalog.acldefault(k.builtin_type,o.oid))) a
LEFT JOIN known g ON g.oid = a.grantee
ORDER BY k.description, grantee, a.privilege_type;

-- B4.3: Schema-specific additive defaults for that owner, if present.
WITH known AS (
  SELECT oid, rolname FROM pg_catalog.pg_roles
  WHERE rolname IN ('postgres','anon','authenticated','service_role',
    'authenticator','supabase_auth_admin','pg_database_owner') OR rolname = CURRENT_USER
)
SELECT n.nspname AS schema_name, d.defaclobjtype AS object_type,
       CASE WHEN a.grantee = 0 THEN 'PUBLIC'
         ELSE COALESCE(g.rolname,'other_role_oid=' || a.grantee::text) END AS grantee,
       a.privilege_type, a.is_grantable
FROM pg_catalog.pg_default_acl d
JOIN pg_catalog.pg_roles o ON o.oid = d.defaclrole
JOIN pg_catalog.pg_namespace n ON n.oid = d.defaclnamespace
CROSS JOIN LATERAL pg_catalog.aclexplode(d.defaclacl) a
LEFT JOIN known g ON g.oid = a.grantee
WHERE o.rolname = CURRENT_USER AND n.nspname IN ('public','portal','portal_private')
ORDER BY n.nspname, d.defaclobjtype, grantee, a.privilege_type;

-- B4.4: Event-trigger attachment/enable state only; no trigger invoked.
SELECT e.evtname AS event_trigger_name, e.evtevent AS event,
       e.evtenabled AS enable_mode, e.evttags AS command_tags,
       pg_catalog.pg_get_userbyid(e.evtowner) AS owner_role,
       n.nspname AS function_schema, p.proname AS function_name,
       pg_catalog.oidvectortypes(p.proargtypes) AS input_types,
       p.prosecdef AS function_security_definer,
       e.evttags IS NULL AS all_command_tags
FROM pg_catalog.pg_event_trigger e
JOIN pg_catalog.pg_proc p ON p.oid = e.evtfoid
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
ORDER BY e.evtname;

ROLLBACK;
```

Interpretation:

- The intended owner needs database CREATE to create the absent schemas, and appropriate existing-object/FK authority. Schema absence intentionally means there are no Portal rows in B4.1/B4.3; that is not missing evidence of a future grant.
- Global defaults and schema-specific defaults combine. An empty B4.3 does not mean no grants: built-in/global defaults still apply. Built-in PUBLIC routine EXECUTE is common; accepted migrations explicitly revoke their final function grants. Do not assume schema-local REVOKE removes globally supplied grants.
- Any unexpected additive grant to a custom role needs review, especially across M1→M2 and M4→M5. M1 precedes full RLS; M2 precedes M3 guards. A known broad default is not permission to alter it. The absence of future-schema defaults cannot establish future final ACLs; compare final objects only in a separately approved post-install review.
- Event-trigger modes are `O` (ordinary/origin), `D` (disabled), `R` (replica) or `A` (always). NULL command tags mean no tag restriction, not inactivity. Enabled triggers covering migration DDL require a behavior review. The handoff's public `rls_auto_enable()` must be reconciled with its attachment, provider provenance and exact privately inspected behavior: names/flags alone do not establish safe or unsafe effects.
- Do not execute the event helper or export unreviewed function bodies. Irene may inspect the known function definition privately in the SQL Editor/Dashboard object viewer and return only a sanitized behavioral summary. If its effects cannot be established without exposing sensitive source, leave UNKNOWN and stop for provider review.

## 7. SQL Batch 5 — safe runtime settings and prerequisite runtime inventory

Purpose: collect narrowly selected settings and languages/extensions. SQL does not identify the running hosted GoTrue/PostgREST version or prove the Dashboard's active API configuration.

```sql
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;

-- B5.1: Current Editor/default settings; only these nonsensitive names.
SELECT name, setting, unit, source
FROM pg_catalog.pg_settings
WHERE name IN ('server_version','server_version_num','search_path',
  'default_transaction_isolation','default_transaction_read_only',
  'statement_timeout','lock_timeout','idle_in_transaction_session_timeout',
  'row_security','session_replication_role')
ORDER BY name;

-- B5.2: Only selected per-role/per-database settings; never unrestricted arrays.
-- Auth/pre-request/signing secrets, passwords and connection settings are excluded.
WITH roles AS (
  SELECT oid, rolname FROM pg_catalog.pg_roles
  WHERE rolname IN ('postgres','authenticator','supabase_auth_admin') OR rolname = CURRENT_USER
), relevant AS (
  SELECT s.setrole, s.setdatabase, cfg.item
  FROM pg_catalog.pg_db_role_setting s
  CROSS JOIN LATERAL pg_catalog.unnest(s.setconfig) cfg(item)
  WHERE (s.setrole = 0 OR s.setrole IN (SELECT oid FROM roles))
    AND (s.setdatabase = 0 OR s.setdatabase =
      (SELECT oid FROM pg_catalog.pg_database WHERE datname = pg_catalog.current_database()))
    AND pg_catalog.split_part(cfg.item,'=',1) IN (
      'search_path','default_transaction_isolation','default_transaction_read_only',
      'statement_timeout','lock_timeout','idle_in_transaction_session_timeout',
      'row_security','pgrst.db_schemas','pgrst.db_extra_search_path')
)
SELECT CASE WHEN s.setrole = 0 THEN 'ALL_ROLES' ELSE r.rolname::text END AS role_scope,
       CASE WHEN s.setdatabase = 0 THEN 'ALL_DATABASES' ELSE 'CURRENT_DATABASE' END AS database_scope,
       pg_catalog.split_part(s.item,'=',1) AS setting_name,
       pg_catalog.substr(s.item,pg_catalog.strpos(s.item,'=')+1) AS setting_value
FROM relevant s LEFT JOIN roles r ON r.oid = s.setrole
ORDER BY role_scope, database_scope, setting_name;

-- B5.3: Required trusted SQL/PLpgSQL languages and candidate owner's usage.
WITH wanted(language_name) AS (VALUES ('sql'), ('plpgsql'))
SELECT w.language_name, l.oid IS NOT NULL AS language_exists,
       l.lanpltrusted AS trusted_language,
       CASE WHEN l.oid IS NOT NULL THEN
         pg_catalog.has_language_privilege(CURRENT_USER,l.oid,'USAGE')
       END AS owner_can_use
FROM wanted w LEFT JOIN pg_catalog.pg_language l ON l.lanname = w.language_name
ORDER BY w.language_name;

-- B5.4: Extension metadata only; no installation or extension-function call.
SELECT e.extname AS extension_name, e.extversion AS installed_version,
       n.nspname AS extension_schema
FROM pg_catalog.pg_extension e
JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
ORDER BY e.extname;

ROLLBACK;
```

Expected: required SQL/PLpgSQL languages exist and are usable by the candidate owner. No extension installation is prescribed: the migrations contain none, and PostgreSQL 17 provides the UUID primitive. An extension list is environment context, not proof of Auth/hook compatibility.

`READ COMMITTED` is the accepted write-lock visibility assumption. A conflicting role/database default needs review; the Editor's explicit REPEATABLE READ wrapper is for these metadata snapshots only. Defaults do not prove an Auth/PostgREST connection's effective transaction settings. An empty B5.2 means no selected catalog overrides, not no provider configuration. API exposure may come from service configuration/Dashboard and supersede catalog expectations. An existing authenticator `pgrst.db_schemas` override requires reconciliation; SQL cannot prove its loaded runtime state. No setting is changed by this package.

Timeouts are metadata, not an availability SLA. The documented PostgreSQL Auth hook limit and accepted local lock tests still need runtime-version/load/rollback rehearsal; do not increase timeouts under this preflight.

## 8. Dashboard/operator checks — no setting changes

Record only sanitized configuration facts or cropped/redacted evidence. Do not visit Users/session/data-table pages, API-key/connection-password panels or secret managers for this package. If a settings screen exposes a secret field, do not reveal/copy it; record only configured/not configured.

| Check | What Irene should record | Expected/interpretation |
| --- | --- | --- |
| D1 — Target and operator | Nonsensitive project/environment label, intended database, observation time and operator role. Match the privately held approved target reference. | Database name `postgres` and server version do not uniquely identify a Supabase project. Wrong/uncertain target: STOP. |
| D2 — Data API | Whether enabled; actual exposed schemas and extra search path; whether a catalog override conflicts. | Preserve unrelated applications. `portal_private` must never be exposed. Before installation/release, the proposed `portal` maintenance boundary must be defined and later proved; its absence alone is not a permanent fence. |
| D3 — Existing Auth hooks | Hook kinds enabled, PostgreSQL/HTTP type, nonsensitive target identity, existing claim/consumer dependencies. Do not export URLs containing credentials/query secrets or webhook signing secrets. | No replacement/activation now. Future target is `portal_private.issue_write_generation(jsonb)`; PostgreSQL URI reference: `pg-functions://postgres/portal_private/issue_write_generation`. Unreconciled existing hook: STOP. |
| D4 — Auth methods/session policy | Signup/anonymous/phone/provider methods, Site URL and redirect scope (sanitized), JWT/session lifetime, relevant MFA/TOTP settings. | Compare accepted numeric OTP/adult/TOTP boundaries with existing consumers. Do not copy the local TOML into hosted settings. Incompatible anonymous/nonmanaged issuance paths require review. |
| D5 — Email delivery | Email provider enabled; six-digit `{{ .Token }}` template confirmed; custom SMTP configured/not configured, approved sender/recipient policy and documented rate limits. | No email test or credential retrieval now. Configured delivery is not delivery proof; template/SMTP validation remains a later bounded gate. |
| D6 — Runtime versions/semantics | GoTrue/Auth and PostgREST versions if actually displayed or available in an existing sanitized provider record; owner of any provider confirmation. | SQL's PostgreSQL version does not identify these services. If not available, UNKNOWN and request nonsensitive provider confirmation; no log dump, management API call or credential collection. |
| D7 — Existing consumers/writers | Operator-owned inventory of other Auth clients, custom-claim consumers, services/jobs/direct-SQL writers, migrations and release automation; whether any release is in progress. | Do not query job payloads, source containing secrets or `pg_stat_activity.query`. A metadata snapshot cannot demonstrate maintenance fencing or lack of competing writers. |
| D8 — Recovery and execution custody | Backup/PITR availability and recovery-point metadata; known restore-rehearsal/coverage status; proposed runner/version/owner, manifest, maintenance owner and abort plan. | No backup access/download/restore or CLI command now. Managed Auth/configuration/external assets and generation-safe token recovery require explicit coverage. No accepted down migrations exist. |
| D9 — Metadata-rehearsal boundary | Identify whether a separately approved isolated environment can represent PostgreSQL 17.11 and the managed runtime; authorized synthetic-test plan owner. | This package neither creates that environment nor authorizes tests. Metadata alone cannot prove FK creation, forced-RLS execution, issuance atomicity, row locks, timeout recovery or HTTPS/Vercel behavior. |

Exact-path-only callback guarantees and hosted HTTPS/CDN/cookie behavior remain unproven; Dashboard entries alone do not close them. No actual Vercel project inspection is required by these SQL batches or authorized here.

## 9. STOP conditions and next decision evidence

Stop and return to Irene if any of the following applies:

- Target/operator identity is uncertain; inventory differs from the initial-install premise; Portal objects or a ledger unexpectedly exist; or previous migration/removal provenance cannot be reconciled.
- A query errors, returns incomplete/truncated output, or changes could have occurred between batches. Do not interpret permissions failure as object absence.
- Required Auth relation/column/type/uniqueness/helper/language is missing or incompatible; UUID resolution is shadowed; the runner's owner/privileges differ from the tested metadata identity.
- Ordinary callers can acquire trusted Auth/owner authority; necessary schema/FK/read/row-lock privileges are missing; forced-RLS owner access is unjustified; or additive default grants/event-trigger effects remain unexplained.
- The private schema is exposed; an existing hook/consumer conflicts; actual runtime versions/transaction assumptions remain unproven; or safe maintenance/recovery/runner controls are absent.
- A solution would require a grant, RLS/owner change, managed-schema modification, hook/configuration change, history repair, broad source export, customer access, production credentials or application edit. Prepare a separate proposal; do not perform it.

The next evidence bundle should contain:

1. Target confirmation, observation context, all **23 labeled SELECT result sets** (4 + 6 + 5 + 4 + 4), and sanitized errors/completeness. Use the SQL labels as the authoritative inventory.
2. D1–D9 check outcomes marked VERIFIED by Irene, REPORTED with provenance, or UNKNOWN. Attach only safely redacted evidence; never keys, tokens, personal rows, raw function bodies or logs.
3. A discrepancy table mapping each prerequisite to its result, reason and required next action. No boolean-only aggregate “all passed” should hide unknowns.
4. Confirmed intended migration owner/runner, exact five-file manifest, existing-consumer impact review, event-trigger/default-grant reconciliation, maintenance/recovery proposal and remaining isolated rehearsal requirements.
5. Irene's explicit next decision and scope. Clean metadata may support approval of an isolated rehearsal or a separately bounded execution package; it is **not automatic migration, hook, exposure or deployment approval**.

No hosted PASS is claimed. No SQL was run. The earlier raw local validation evidence is not replaced by this package. The five inherited notes remain **NOTE — OPEN**: `01B-A03`, `SNV02`, `SNV04`, `SNV05`, `SNV06`; 01D-A01 remains closed in the accepted bounded local review. None is reclassified here.

## 10. Preparation verification and references

The package was manually reviewed for PostgreSQL 17 catalog/privilege semantics and statically checked for five read-only transaction wrappers, labeled SELECT inventory, absence-safe catalog joins, fixed output/configuration allowlists and prohibited operations. **No SQL parser/execution PASS, hosted compatibility PASS, or runtime permission/locking proof is claimed.** Queries were not executed anywhere, including locally.

Read-only context cannot replace the statement/function allowlist. Permission predicates consider effective privileges but do not execute application logic or establish row-policy outcomes. [PostgreSQL 17 information/privilege functions](https://www.postgresql.org/docs/17/functions-info.html). Row-lock permission prerequisites and semantics: [PostgreSQL 17 SELECT](https://www.postgresql.org/docs/17/sql-select.html). Membership options: [PostgreSQL 17 pg_auth_members](https://www.postgresql.org/docs/17/catalog-pg-auth-members.html). Global/schema-specific default ACL semantics: [PostgreSQL 17 pg_default_acl](https://www.postgresql.org/docs/17/catalog-pg-default-acl.html). These references describe PostgreSQL behavior, not observed hosted results.

Both pre-existing reconciliation handoffs are preserved. Only this Markdown file was created. No hosted connection/SQL/credential/customer access, mutation test, migration, provider change, Auth activation, Vercel deployment, code change, stage, commit, push, merge or Sprint 01E work occurred.

**STOP — return control to Irene for manual metadata execution and review.**
