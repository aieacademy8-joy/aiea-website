# AIEA Portal — Hosted Migration Reconciliation Handoff v1.0

Date: 2026-10-09 (America/Chicago).  
Final Human Authority: **Irene**.  
Repository: `/Users/dosfam/Desktop/AIEAcademy/Website/2.0`.  
Accepted baseline: `e1b2b8b0e880e2d5a277060514e9a8dac8ffdaa0`.

This document preserves the immediately preceding read-only hosted database migration reconciliation. Its creation is a documentation-only action authorized by Human Authority. It is a proposed operational handoff, not authorization to execute migrations, activate hooks, change hosted settings, deploy, or begin Sprint 01E.

## 1. Executive summary and current deployment status

**The repository baseline is verified. The hosted project is not yet reconciled sufficiently to authorize migration execution.** All five accepted migrations are **pending candidates**, subject to read-only preflight evidence and Irene's review. They must not be marked applied based on the observations currently available.

The supplied hosted observations indicate that `public` exists, `portal` and `portal_private` were not found, and `to_regclass('supabase_migrations.schema_migrations')` returned NULL. These observations do not establish an empty production project, prove the absence of prior manual SQL, or authorize database changes.

Sprint 01D acceptance is local implementation/validation acceptance. Hosted compatibility, configuration, migration application, Auth Hook activation, operational availability, and production readiness remain unproven. The first 01D migration alone is an intermediate historical write-security state; the HR03 migration must follow before write access can be reopened.

The preceding review used local read-only repository inspection and public official documentation. It did not access production credentials, connect to hosted databases or provider settings, execute SQL, run database-mutating tests, execute migrations, activate hooks, change repository files, stage, commit, push, deploy, or begin Sprint 01E. This handoff adds only the specified Markdown artifact.

## 2. Evidence classifications and verified repository baseline

The classifications describe how evidence was obtained in this review:

- **VERIFIED:** directly inspected repository/Git/file evidence, or a specifically attributed published documentation statement. Repository verification does not imply hosted verification.
- **REPORTED:** Human Authority-supplied hosted observations or previously recorded validation results that were not independently re-executed in this review.
- **UNKNOWN:** hosted facts or operational guarantees for which sufficient evidence is unavailable.

Human Authority's supplied hosted observations are accepted as evidence; their REPORTED classification describes this review's verification boundary, not a rejection of those observations.

| Classification | Finding |
| --- | --- |
| VERIFIED — repository | HEAD is exactly `e1b2b8b0e880e2d5a277060514e9a8dac8ffdaa0`, titled “AIEA Portal: accept Sprint 01D mission status and trusted write authority.” |
| VERIFIED — repository | Before this handoff was created, the working tree and index were clean. The migration/configuration files matched the accepted commit. |
| VERIFIED — repository | The accepted history is 01A → 01B → 01C → 01D. The three 01A migrations remain unchanged. 01B and 01C introduce no migration changes. 01D adds exactly two migrations. |
| VERIFIED — documentary evidence | The checked-in 01D final acceptance record records Irene's acceptance and explicitly excludes hosted activation authorization. |
| REPORTED — validation | Checked-in acceptance and independent re-review records report passing local native validation. This review did not rerun those tests; those results do not establish hosted compatibility. |
| UNKNOWN — hosted | Existing data, other applications, effective privileges, Auth/runtime versions, API exposure, active hooks, migration provenance, and restore readiness. |

The accepted commit chain inspected in Git is:

| Sprint | Accepted commit |
| --- | --- |
| 01A | `0b9d4af280c05e128e07a15e4687b053082f9eea` |
| 01B | `3c2432749e0b265a5519dd8a099ea63a9cd1cd4f` |
| 01C | `079e7f2a13142e956a5766d6e9e17a1f94718f5f` |
| 01D | `e1b2b8b0e880e2d5a277060514e9a8dac8ffdaa0` |

Primary repository evidence:

- [01D final acceptance and repository-boundary review](AIEA_Portal_Sprint_01D_Final_Acceptance_and_Repository_Boundary_Review_v1.0.md).
- [HR03 trusted write generation design](AIEA_Portal_Sprint_01D_HR03_Trusted_Write_Generation_Design_v1.0.md).
- [HR03 independent re-review](AIEA_Portal_Sprint_01D_HR03_Independent_ReReview_v1.0.md).
- [Supabase README](../../supabase/README.md), [local configuration](../../supabase/config.toml), and the five migration files below.

No additional hosted assurance is inferred from repository acceptance or historical test counts.

## 3. Hosted Supabase observations supplied by Human Authority

| Classification | Supplied observation | Evidentiary limit |
| --- | --- | --- |
| REPORTED — hosted | The `public` schema exists. | Does not establish its contents, data volume, consumers, grants, or API exposure. |
| REPORTED — hosted | The `portal` schema was not found. | Must be confirmed through a catalog-based inventory with the database/query role identified. |
| REPORTED — hosted | The `portal_private` schema was not found. | Does not establish that equivalent legacy objects or public wrappers are absent elsewhere. |
| REPORTED — hosted | `to_regclass('supabase_migrations.schema_migrations')` returned NULL. | The relation did not resolve in the reported query context. This is not evidence of an existing table containing zero rows. |

The preceding review did not independently query these observations. Project identity, query role, observation time, and the broader catalog/configuration context remain UNKNOWN.

## 4. Complete accepted migration inventory

All five files are in `supabase/migrations/` at the accepted baseline. The identifiers M1–M5 below are document shorthand, not alternate migration versions.

| Order | Sprint | Exact filename | Accepted effect |
| --- | --- | --- | --- |
| M1 | 01A | `20261006000100_portal_domains.sql` | Creates `portal` and `portal_private`; 28 product-domain tables; constraints, indexes, and initial privileges. |
| M2 | 01A | `20261006000200_portal_security.sql` | Adds authorization helpers, product-table RLS, service grants, and bounded authenticated reads, including entitlement column summaries. |
| M3 | 01A | `20261006000300_portal_guards.sql` | Adds audit, publication, learning, staff, billing, and lifecycle guards. |
| — | 01B/01C | **No additional migrations** | Accepted runtime and curriculum delivery use the unchanged foundation. |
| M4 | 01D | `20261008000100_portal_mission_status.sql` | Adds the two authenticated write RPCs and initial private authorization helpers. |
| M5 | 01D HR03 | `20261008000200_portal_write_generation.sql` | Adds the private registry/allocator and issuance hook; replaces M4's timestamp gate with generation matching. |

VERIFIED SHA-256 manifest:

```text
20261006000100_portal_domains.sql
f0bdbe5ed8f4f622362c0a6c149bc26644b06552b8a7358b8d792dbfe05a8464

20261006000200_portal_security.sql
b5afa539f70e34b6c22080a582de22cc484d294b8f368e11e08c141f745184d4

20261006000300_portal_guards.sql
8fababc9491321f176fcfbf5196ff44a98a41bd657d263a897f51498837bb486

20261008000100_portal_mission_status.sql
e05eb2bba019b17f4d72b40f7f7b033eef5450fcdb81f90be842a9fc8af5ba6f

20261008000200_portal_write_generation.sql
d958198cc2bb77599e593420c25cb63e33a2748af5ddeed163cdbdfbf7c1c7b0
```

The accepted historical files must remain unchanged. Test SQL, synthetic Auth bootstraps, fixture scripts, seeds, and local fault/negative-control functions are not deployment migrations.

## 5. Dependencies and required execution order

**Required order: M1 → M2 → M3 → M4 → M5.**

| Migration | Dependencies |
| --- | --- |
| M1 | Managed `auth.users`, compatible Supabase roles, UUID-function resolution, and an authorized migration owner with the required schema creation/FK privileges. |
| M2 | M1's schemas/tables; `auth.uid()`, `auth.jwt()`, managed sessions and TOTP factor structures; compatible function-owner privileges. |
| M3 | M1's domains and M2's authorization helpers; compatible trigger/owner privileges. |
| M4 | Complete M1–M3 foundation, managed account/session column compatibility, and lock authority. |
| M5 | M4's existing helper/RPC graph, managed session/user FKs and lock compatibility, `supabase_auth_admin`, registry/allocator privileges and policies, and an appropriate definer owner for the forced-RLS registry. |

M4 preserves the original epoch-second freshness comparison. The accepted HR03 correction replaces that insufficient same-second test in M5. **M4 alone is not the accepted final write-security state.** Do not omit M4, skip M5, reverse them, or reopen production write access between them.

Each file contains its own `BEGIN`/`COMMIT`. The five-file batch must not be assumed atomic. Earlier files can remain committed when a later file fails.

## 6. Hosted schema and migration-history reconciliation

The NULL history lookup does not prove that no SQL was ever manually applied or that production has no data. Reconcile the live catalog separately from migration-history metadata.

| Read-only finding | Required disposition |
| --- | --- |
| Portal objects absent; history absent/empty | Plan actual execution of all five accepted migrations after separate authorization. Record each only after successful application. |
| Portal objects present; history absent/empty | Stop automatic execution. Compare definitions, owners, grants, policies, constraints, triggers, and provenance against the accepted files. |
| Partial objects or drift | Stop. Prepare a separately reviewed recovery/forward-correction plan. |
| History entries present but expected objects absent/different | Treat as inconsistent evidence. Do not skip SQL merely because migration timestamps match. |

`migration repair --status applied` inserts migration-history records without executing the migration. `--status reverted` removes history records without undoing objects. Neither repairs a schema or performs a rollback. [Supabase CLI migration repair documentation](https://supabase.com/docs/reference/cli/supabase-migration-repair).

For a genuinely unapplied foundation, the later authorized runner should create its migration tracking infrastructure and execute the files normally. Supabase documents first-push history creation and recording after successful migration application. **Do not pre-mark these five versions applied.** [Supabase migration execution documentation](https://supabase.com/docs/reference/cli/supabase-db-push).

If prior manual application is later proven, any history repair requires separate authorization and migration-specific evidence of equivalent resulting state. That evidence is currently unavailable. An uncertain commit acknowledgement or a mismatch between committed objects and ledger state must be investigated before retrying; these SQL files are not generally safe to rerun blindly.

No remote CLI linking, pushing, pulling with history updates, history repair, or purported dry run is an authorized next action under this handoff. No credential-dependent CLI operation was performed in the preceding review.

## 7. Required Auth Hook configuration and dependencies

VERIFIED — M5 installs:

- `portal_private.write_session_generation(session_id, user_id, generation)`, with managed session/user foreign keys and RLS enabled and forced.
- `portal_private.write_generation_seq`, a positive bigint allocator with NO CYCLE.
- `portal_private.issue_write_generation(event jsonb) returns jsonb`, SECURITY INVOKER with an empty search path.
- A replacement `portal_private.assert_write_session()` requiring the signed string claim `aiea_write_generation` to match locked per-session registry authority.

The intended hook target is **`portal_private.issue_write_generation(jsonb)`**. The accepted local validation reference is:

```toml
# Reference only: used in a disposable copied LOCAL configuration.
# This is not an instruction to change repository or hosted settings.
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/portal_private/issue_write_generation"
```

The repository configuration has no enabled hook. Migration execution alone does not activate it. Hosted selection/activation of the exact function requires separate Human Authority authorization and compatibility evidence. `portal_private` must remain outside exposed Data API schemas.

M5 grants `supabase_auth_admin` private-schema USAGE, hook EXECUTE, registry SELECT/INSERT, UPDATE limited to `generation`, and allocator USAGE. It does not grant registry DELETE/TRUNCATE/identity UPDATE or sequence-reset authority. Browser/service roles receive no new registry/allocator/hook authority. Effective inherited/default grants must also be checked.

The invoker hook requires managed-session read/row-lock authority under the trusted Auth role. The SECURITY DEFINER write gate's owner must be able to read managed Auth rows and the FORCE RLS registry under the accepted model. Missing permissions must not be addressed by unreviewed broad grants, changing the hook to SECURITY DEFINER, or weakening RLS.

The hook derives identity from trusted issuance context, locks the exact managed session before allocating, and overwrites the generation claim. It does not derive authority from user metadata or caller body/header values. Authority is per session; the allocator's global position is not a cross-session authorization comparison. Rollback gaps in allocation are expected and do not justify resetting the sequence.

Material activation dependencies and risks:

- The Custom Access Token Hook runs before issuance and must preserve Supabase's required claims. Inspect any existing hook and downstream custom-claim dependencies before proposing replacement. [Supabase hook contract](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook).
- Activation affects issuance across the project. This accepted hook rejects anonymous/non-authenticated issuance contexts. Existing anonymous clients or incompatible authentication flows could be disrupted. Their presence is UNKNOWN.
- Permission errors, execution errors, and lock contention can block sign-in/refresh. Supabase documents a two-second PostgreSQL hook processing limit. Hosted availability/load behavior remains unproven; local measurements are not hosted SLAs. Activation can also apply automatic grants/revocations, requiring a post-activation ACL recheck. [Supabase Auth Hooks documentation](https://supabase.com/docs/guides/auth/auth-hooks).
- REPORTED — local native evidence establishes transactional issuance/registry behavior for the tested runtime. Hosted runtime compatibility and the same rollback/concurrency behavior remain UNKNOWN until separately authorized validation.
- Pre-activation tokens are not backfilled. Missing claims or missing/mismatched registry state fail closed for 01D writes. The accepted Portal discards refresh tokens and provides no browser authority-repair/refresh flow; fresh approved sign-in is the practical issuance path.
- Disabling the hook does not itself fence writes: already-issued generation-bearing tokens may still match existing registry state.

## 8. Direct-RPC maintenance boundary and migration risks

M4 grants authenticated EXECUTE on exactly these exposed signatures:

- `portal.record_mission_progress(uuid,uuid,uuid,uuid,text)`.
- `portal.record_cohort_delivery(uuid,uuid,uuid,uuid,text)`.

An application maintenance page or disabled `/api/portal/progress` handler cannot prevent direct PostgREST RPC calls using an adult bearer token. The maintenance boundary must protect the database/API paths themselves.

For the proposed initial migration, establish maintenance **before M1** and retain it through M5, final-state inspection, and any separately authorized activation/validation:

1. Keep `portal` unavailable through production PostgREST and `portal_private` permanently unexposed.
2. Pause Portal API writers, direct SQL callers, jobs, and service clients. API schema exposure controls do not fence direct database connections.
3. Inspect public-schema wrappers, extra RPC overloads, inherited/default grants, and alternate entry points. An exposed wrapper could bypass a schema-only maintenance fence.
4. Preserve unrelated production API exposure; do not remove `public` or disrupt existing applications without a separately reviewed dependency plan.
5. Prove the fence is effective before the intermediate M4 state can become callable. If an effective fence cannot be demonstrated, execution remains blocked.
6. Reopen only after M5's accepted gate, final grants, and required validation have passed and Irene authorizes release.

Required final-state checks include:

- 28 product tables plus one private registry and one private sequence.
- RLS enabled on product tables; registry RLS enabled and forced.
- Bounded authenticated reads and entitlement column summaries; no authenticated direct table DML.
- Only the two intended authenticated-callable exposed write signatures; no old overload, public wrapper, or alternate mutation bypass.
- Accepted function definitions/ownership/search paths; invoker hook and definer mutation gates preserved.
- Effective registry/allocator/hook grants matching M5, including inherited/default ACL effects.
- Private-schema USAGE for accepted policy helpers distinguished from private Data API exposure.

Schema exposure and SQL grants are separate controls. Preserve accepted least privilege rather than copying a generic broad-grant recipe. [Supabase custom-schema documentation](https://supabase.com/docs/guides/api/using-custom-schemas).

The HR03 guarantee is bounded: after a newer generation commits, an older token cannot authorize a new 01D mutation. An already-authorized write holding the required locks may finish before concurrent refresh; refresh-first denies a waiting obsolete write. This is not global bearer invalidation, latest-login selection across independent sessions, or closure of ordinary stateless-read signout behavior.

## 9. Production safety requirements and additional read-only checks

| Area | Required evidence before an execution decision |
| --- | --- |
| Project identity | Intended project/database/environment confirmed by the designated operator; observation time and query role recorded. |
| Catalog inventory | Namespace checks; tables, views, functions, sequences, triggers, dependencies, and legacy Portal equivalents in any other schemas. |
| Existing production use | Applications/jobs using `public`, Auth, Storage, and other schemas; aggregate data inventory where authorized; naming or authorization overlap. No customer records need to be shared in this handoff. |
| Managed Auth contract | Required structures and types: `auth.users` (`id`, `is_anonymous`, `deleted_at`, `banned_until`); `auth.sessions` (`id`, `user_id`, `aal`, `not_after`, `factor_id`, `refreshed_at`); `auth.mfa_factors` (`id`, `user_id`, `factor_type`, `status`); `auth.uid()` and `auth.jwt()`. |
| Roles/ownership | `anon`, `authenticated`, `service_role`, `authenticator`, `supabase_auth_admin`; intended migration owner, inherited memberships, CREATE rights, default ACLs, and effective privileges. |
| Auth privileges | Migration owner's REFERENCES/read/row-lock authority; trusted Auth role's managed-session read/lock authority; accepted definer access to forced-RLS registry. |
| Runtime/extensions | Hosted PostgreSQL version, installed extension inventory, and UUID-function resolution. The five migrations contain no extension-installation statement. |
| Configuration | Operator-supplied sanitized evidence of actual exposed schemas/search path, existing hook, authentication methods, signup/anonymous settings, callbacks, TOTP, token/session limits, and runtime versions. |
| Recovery/operations | Backup/PITR coverage, restore rehearsal evidence, concurrent migration processes, workload/lock risk, and the ability to enforce every maintenance boundary. |

The accepted `supabase/config.toml` specifies local PostgreSQL 15, local API exposure of `portal`, and local Auth configuration. It is not evidence of hosted settings and must not be copied wholesale into production. PostgreSQL 15 provides `gen_random_uuid()` directly; do not presume a new `pgcrypto` installation is necessary. [PostgreSQL UUID documentation](https://www.postgresql.org/docs/15/functions-uuid.html).

VERIFIED — these migrations reference managed Auth tables without altering their definitions. New foreign-key dependencies affect future managed-user/session deletion: product relationships include RESTRICT/SET NULL behavior, and the private registry cascades with managed session/user deletion. Those lifecycle effects must be reviewed for existing production consumers.

Existing Auth users do not automatically become Portal adults or receive profiles, memberships, entitlements, or staff authority. Do not infer, seed, or provision those records. Server-recorded adult confirmation is not age verification. First staff bootstrap remains a separately controlled Human operation.

Protect existing Auth users, sessions, public data, Storage data, other applications, and unrelated API consumers. Do not run production resets, synthetic bootstrap/fixture/test SQL, or seed scripts. Backups and sensitive schema captures must remain in approved secure operator custody; share sanitized metadata only. No credentials, tokens, customer records, or broad secret-bearing configuration dumps are required here.

## 10. Proposed deployment sequence — not authorized for execution

1. **Complete read-only reconciliation.** Resolve project identity, schema/history state, managed Auth dependencies, effective grants, production consumers, configuration, and restore readiness. Return discrepancies to Irene.
2. **Rehearse under separate authorization.** Use an isolated compatible environment and the exact five-file manifest. Exercise migration failure/recovery, native Auth/PostgREST, same-second stale-token rejection, both RPCs, and hook contention/failure. Existing fixture/bootstrap scripts must never run against production.
3. **Obtain execution authorization.** Irene approves the exact target, manifest, runner/version, backup point, maintenance controls, abort conditions, and recovery procedure. Hook activation remains a separate explicit gate.
4. **Establish and prove maintenance before M1.** Apply the complete direct-RPC/direct-SQL boundary in Section 8 while preserving unrelated production operations.
5. **Apply M1–M5 in order.** Use one controlled runner, fail on errors, and exclude seeds, test SQL, managed-schema resets, and unrelated migrations. Recheck source hashes immediately before execution. Record successful application truthfully.
6. **Inspect final state while fenced.** Reconcile definitions, ownership, effective grants, RLS, triggers, and all five history records. Prove M5 is installed; do not infer success from a runner exit message alone.
7. **Hold activation separately.** Without the hook and valid new issuance, 01D writes remain unavailable. Retain maintenance while awaiting the activation decision.
8. **Activate/validate only after authorization.** Select the exact hook target, recheck activation-side ACL changes, obtain fresh approved issuance, and validate approved cases. Release maintenance only after all required gates pass and Irene authorizes release.

Database migration, Auth Hook activation, API exposure, application deployment, and production launch are distinct authorization gates. Completion of one does not authorize the others.

## 11. Proposed rollback and recovery sequence

There are **no accepted down migrations** in this baseline. Do not treat migration-history repair as rollback. Prefer reviewed forward recovery while preserving data and keeping write access fenced.

| Failure point | Proposed response |
| --- | --- |
| Before a migration file commits | Abort and verify rollback/catalog/history state. Earlier committed files remain. |
| Commit acknowledgement or history recording uncertain | Stop. Reconcile actual objects and ledger before retrying; do not blindly rerun or mark applied. |
| M4 succeeds; M5 fails | Keep all write routes fenced. Recover through a reviewed M5 procedure. Never reopen on the historical timestamp-only gate. |
| Hook activation fails or disrupts Auth | Fence writes first. Under recovery authorization, restore the prior hook configuration. Retain the accepted generation gate. Disabling the hook alone does not invalidate existing generation-bearing tokens. |
| Portal writes or other new data already exist | Prefer a reviewed forward fix. Preserve domain and audit history. Do not automatically drop schemas or restore the whole project. |

Destructive object removal requires a separate approved reversal script, dependency/data checks, and explicit scope. A whole-project restore can discard unrelated production transactions committed after the recovery point; its blast radius and reconciliation must be approved before use.

Never reset/reuse the generation allocator during routine recovery. A restore that rewinds registry/sequence authority requires a reviewed token/session recovery strategy before reopening, because previously issued tokens must not regain authority through generation reuse. No such production recovery strategy is verified by this review.

## 12. Remaining UNKNOWN items, authorization blockers, and retained notes

The following are blockers to an execution/activation decision, not newly established implementation audit defects:

- Confirmed hosted project/database identity, query role, and observation context.
- Complete catalog/history reconciliation and evidence excluding partial/manual application or drift.
- Existing production data, users, applications, jobs, direct SQL consumers, and alternate RPC/wrapper paths.
- Hosted PostgreSQL/Auth/PostgREST compatibility and required effective privileges/owners.
- Actual exposed schemas/search path, current custom-token hook, custom-claim consumers, and Auth methods/settings.
- Compatibility of the project-wide issuance hook with existing anonymous or other authentication consumers.
- A proven maintenance boundary covering direct RPC and direct database access.
- Backup/PITR coverage, restore rehearsal, and approved recovery handling for data, sessions, and non-reused generation authority.
- Hosted hook grants/activation effects, timeout/load behavior, fresh issuance, and approved validation/release criteria.
- Irene's separate execution, activation, recovery, and release authorizations.

The five inherited notes retain their recorded classification and remain OPEN:

| ID | Retained limitation |
| --- | --- |
| 01B-A03 | Hosted rewrite/CDN/HTTPS-cookie behavior unproven. |
| SNV02 | Deprecated local inbucket configuration. |
| SNV04 | Global refresh-chain cascade invalidation unproven. |
| SNV05 | Exact-path-only native callback guarantees unproven. |
| SNV06 | Ordinary stateless Data API/RLS may accept an unexpired signed-out JWT. |

HR03 does not close SNV04/SNV06 or establish global token invalidation. Local acceptance does not constitute hosted production readiness. No provisioning, commerce, privacy lifecycle expansion, generic mutation path, or Sprint 01E work follows from this handoff.

## 13. Exact recommended next operator action

**Submit this handoff to Irene and STOP.** The proposed next technical action for her review is a metadata-only preflight by the designated operator through an already authorized session. It is not a request to supply credentials, connect this agent to hosted settings, execute migrations, or activate a hook.

The initial packet below is proposed read-only SQL only. It has **not been executed** in this review or handoff task:

```sql
BEGIN TRANSACTION READ ONLY;

SELECT current_database() AS database_name,
       current_user AS query_role,
       current_setting('server_version') AS postgres_version;

WITH expected(name) AS (
  VALUES ('public'), ('portal'), ('portal_private'),
         ('supabase_migrations')
)
SELECT e.name,
       n.oid IS NOT NULL AS exists,
       pg_get_userbyid(n.nspowner) AS owner
FROM expected e
LEFT JOIN pg_catalog.pg_namespace n ON n.nspname = e.name
ORDER BY e.name;

SELECT to_regclass('supabase_migrations.schema_migrations')
         AS migration_history,
       to_regclass('auth.users') AS auth_users,
       to_regclass('auth.sessions') AS auth_sessions,
       to_regclass('auth.mfa_factors') AS auth_mfa_factors,
       to_regprocedure('auth.uid()') AS auth_uid,
       to_regprocedure('auth.jwt()') AS auth_jwt,
       to_regprocedure('pg_catalog.gen_random_uuid()') AS uuid_generator;

SELECT extname, extversion
FROM pg_catalog.pg_extension
ORDER BY extname;

ROLLBACK;
```

If the history relation remains absent, **do not query it directly or create it**. If it exists, inspect its structure before preparing a separate read-only history query. Return sanitized results for reconciliation, then complete the remaining catalog/grant/configuration checks described above. This initial packet alone does not satisfy the entire preflight.

**STOP — Irene is the final Human Authority. No SQL execution, migration, hosted operation, Auth Hook activation, credential access, staging, commit, push, deployment, application/configuration change, or Sprint 01E work is authorized by this documentation-only handoff.**
