# AIEA Portal — Hosted Migration Reconciliation Handoff v1.0

Date: **2026-10-09 (America/Chicago)**.  
Role: AIEA Portal database release engineer.  
Final Human Authority: **Irene**.  
Repository: `/Users/dosfam/Desktop/AIEAcademy/Website/2.0`.  
Accepted baseline: `main` at `e1b2b8b0e880e2d5a277060514e9a8dac8ffdaa0`.  
Current recommendation: **STOP for hosted execution, activation, and release**.

This is a documentation-only handoff. Its creation authorizes only this Markdown file under `docs/portal/handoffs/`. Every operational step below is a proposed future procedure, subject to its stated approval gate. The report does not authorize SQL execution, migrations, hosted configuration changes, Auth hook activation, Vercel deployment, credential/customer-data access, Git staging/commit/push/merge, or Sprint 01E.

## 1. Executive Summary

The supplied hosted inventory is consistent with an **unapplied AIEA Portal foundation**. Both Portal schemas and all expected Portal objects are absent, and no migration-history relation exists. The appropriate candidate is normal initial application of all five accepted migrations, not marking them applied through history repair.

The repository baseline and exact migration bytes are verified. Required order is **M1 → M2 → M3 → M4 → M5**. Sprint 01D contains **two** migrations: M4 introduces the write RPCs and historical timestamp gate; M5 installs trusted per-session generation authority and replaces that gate. M4 alone is not the accepted final write-security state.

Hosted compatibility and production readiness are **not established**. Managed Auth structure/privilege compatibility, actual API exposure, existing authentication consumers, maintenance enforcement, runner behavior, and recovery readiness remain unresolved. Installing M5 does not activate its Auth hook. Hook activation is a separate project-wide issuance change requiring Irene's approval.

Each migration has its own `BEGIN`/`COMMIT`. Earlier migrations can remain committed after a later failure. A proven maintenance boundary must therefore exist before M1 and remain through M5, final inspection, and separately approved activation/validation. A disabled application handler alone cannot fence direct RPC or direct SQL access.

### Evidence classifications used throughout

| Label | Meaning and limit |
| --- | --- |
| **VERIFIED — repository evidence** | Directly inspected Git state, committed SQL, configuration, runtime code, or checked-in documents. A checked-in statement is verified as a document statement, not as independently reproduced runtime behavior. |
| **VERIFIED — user-supplied hosted SQL results** | Manually verified hosted results supplied by the user and accepted for this reconciliation. The agent did not independently query the hosted project or inspect the original query text/output. |
| **REPORTED — not independently verified** | Historical local test results or other claims recorded in repository reports that were not rerun or independently reproduced during this reconciliation. |
| **UNKNOWN — not inspected** | Hosted state, operational behavior, or evidence not supplied or independently inspected. |
| **REFERENCE — official documentation** | Published Supabase/PostgreSQL behavior consulted during reconciliation. Documentation is not evidence of this project's actual configuration or behavior. |
| **RECOMMENDATION / PROPOSED** | Release-engineering judgment or a future procedure. It is not an executed action or Human Authority approval. |

## 2. Accepted Repository Baseline

**VERIFIED — repository evidence:** `HEAD`, `main`, and the accepted baseline all resolve to `e1b2b8b0e880e2d5a277060514e9a8dac8ffdaa0`. All five migration files match the accepted commit byte-for-byte. The inspected Supabase configuration/README, adult Auth handler, runtime, and final 01D acceptance record also match that baseline.

At documentation-task entry, Git reported one pre-existing untracked file: `docs/portal/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md`. It is outside the requested destination, is not part of the accepted commit, and is preserved unchanged. Its earlier inventory and evidence labels are not used as substitutes for the user's fuller hosted findings. The repository was not described as clean.

**VERIFIED — repository documentary evidence:** the final 01D acceptance record states that Irene accepted the bounded HR03 amendment and local implementation/validation. It explicitly leaves hosted activation unauthorized and unproven. Its recorded pre-commit Git state is historical; this report uses the accepted commit above as the current baseline.

Primary repository sources:

- [Supabase foundation and 01D documentation](../../../supabase/README.md).
- [Local Supabase configuration](../../../supabase/config.toml).
- [Final 01D acceptance and repository-boundary review](../AIEA_Portal_Sprint_01D_Final_Acceptance_and_Repository_Boundary_Review_v1.0.md).
- [HR03 trusted write generation design](../AIEA_Portal_Sprint_01D_HR03_Trusted_Write_Generation_Design_v1.0.md).
- [HR03 implementation and validation report](../AIEA_Portal_Sprint_01D_HR03_Correction_Implementation_and_Validation_Report_v1.0.md).
- [HR03 independent re-review](../AIEA_Portal_Sprint_01D_HR03_Independent_ReReview_v1.0.md).
- [Adult Auth handler](../../../api/portal/auth.js) and [Portal runtime](../../../lib/portal/runtime.js).

**REPORTED — not independently verified:** acceptance records report local native validation and independent re-review PASS, including 605 HR03 matrix passes and 188 foundation assertions. Those results were not rerun during reconciliation or document creation. They do not prove hosted compatibility, production behavior, or operational readiness.

## 3. Verified Hosted Supabase Inventory

All findings in this table are **VERIFIED — user-supplied hosted SQL results**, with the verification boundary defined in Section 1.

| Supplied finding | Reconciliation and evidentiary limit |
| --- | --- |
| PostgreSQL version **17.11** | Records the hosted engine version. Source inspection establishes no specific incompatibility, but does not prove execution/runtime compatibility. |
| Query role **postgres** | Records the inventory query identity. Future migration-runner identity, effective permissions, and ownership must still be confirmed. |
| `public` exists, owned by `pg_database_owner` | Compatible with the migrations, which create separate schemas. No change to `public` ownership is required by these files. |
| `portal` absent | M1's product schema is not installed. |
| `portal_private` absent | M1's private schema and M5's private authority objects are not installed. |
| No tables, views, or sequences found in `portal`, `portal_private`, or `public` | Consistent with no surviving Portal installation in those schemas. Does not establish that Auth, Storage, other schemas, or the overall project are empty. |
| No AIEA Portal functions found | Consistent with M2–M5 being unapplied in the expected location. Legacy equivalents/alternate entry points elsewhere require final preflight. |
| Existing public function `rls_auto_enable()` | Not created, replaced, or dropped by the accepted migrations. Definition, ACLs, ownership, and attached event triggers remain unknown. |
| `supabase_migrations.schema_migrations` absent | There is no existing migration ledger to reconcile. This is different from an existing ledger containing zero rows. |

**RECOMMENDATION:** treat all five migrations as pending initial-application candidates. Do not mark them applied before executing them successfully.

**UNKNOWN — not inspected:** exact hosted project/database/environment identity, inventory observation timestamp, original query coverage, prior migration attempts/removal, other-schema objects, active workloads, and current provider settings. Absence of current objects does not prove that SQL was never attempted or subsequently removed.

## 4. Repository Migration Manifest and Exact Execution Order

**VERIFIED — repository evidence:** the accepted migration directory contains exactly the following five files. M1–M5 are report shorthand, not alternative migration identifiers.

| Order | Sprint | Exact migration | Accepted effect |
| --- | --- | --- | --- |
| M1 | 01A | [20261006000100_portal_domains.sql](../../../supabase/migrations/20261006000100_portal_domains.sql) | Creates `portal` and `portal_private`, 28 product-domain tables, constraints, indexes, and initial privileges. |
| M2 | 01A | [20261006000200_portal_security.sql](../../../supabase/migrations/20261006000200_portal_security.sql) | Installs authorization helpers, product-table RLS, service grants, and bounded authenticated reads. |
| M3 | 01A | [20261006000300_portal_guards.sql](../../../supabase/migrations/20261006000300_portal_guards.sql) | Installs audit, publication, learning, staff, billing, and lifecycle guards/triggers. |
| M4 | 01D | [20261008000100_portal_mission_status.sql](../../../supabase/migrations/20261008000100_portal_mission_status.sql) | Installs two write RPCs and initial private status/session helpers. |
| M5 | 01D HR03 | [20261008000200_portal_write_generation.sql](../../../supabase/migrations/20261008000200_portal_write_generation.sql) | Adds the private registry/allocator and issuance hook; replaces M4's session gate in place. |

There are no separate 01B/01C migration files in this baseline. Required order is **M1 → M2 → M3 → M4 → M5**. Preserve the accepted files; do not reorder, squash, omit either 01D file, or rewrite historical migrations during deployment.

### Verified SHA-256 release manifest

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

Expected final Portal state derived from SQL: **28 product tables in `portal`, one private registry table, one private sequence, and 29 distinct Portal/private functions**. M5 replaces `assert_write_session()` rather than adding another signature. No product views or product sequences are created. These totals exclude managed Supabase objects, the migration ledger, and the existing public function. Counts supplement definition/privilege comparisons; they are not sufficient release evidence alone.

Test SQL, synthetic Auth bootstraps, native fixture scripts, negative controls, and seeds are not deployment migrations and must not run against the hosted production project.

## 5. Migration Dependencies and Prerequisites

### Dependency graph

| Migration | Required dependencies |
| --- | --- |
| M1 | Managed `auth.users(id)`, referenced Supabase roles, UUID-function resolution, and an authorized owner with schema-creation/FK privileges. |
| M2 | M1 tables/schemas; `auth.uid()`, `auth.jwt()`, managed sessions/factors; compatible definer-owner permissions. |
| M3 | M1 domains and M2 helpers; function/trigger ownership and permission compatibility. |
| M4 | Complete M1–M3 foundation; compatible managed account/session fields and row-lock authority. |
| M5 | M4's existing gate/RPC graph; managed session/user FK targets; `supabase_auth_admin`; registry/allocator grants and policies; compatible session locking and definer access to the forced-RLS registry. |

### Metadata prerequisites to verify before execution approval

**UNKNOWN — not inspected:** the following hosted prerequisites must be established by sanitized metadata evidence:

- Correct project, database, environment, operator, and observation context.
- Managed Auth objects and compatible column types:
  - `auth.users`: `id`, `is_anonymous`, `deleted_at`, `banned_until`.
  - `auth.sessions`: `id`, `user_id`, `aal`, `not_after`, `factor_id`, `refreshed_at`.
  - `auth.mfa_factors`: `id`, `user_id`, `factor_type`, `status`.
  - Functions `auth.uid()`, `auth.jwt()`, and resolvable `gen_random_uuid()`.
- Roles `anon`, `authenticated`, `service_role`, `authenticator`, and `supabase_auth_admin`; their memberships and effective privileges.
- Intended migration owner, schema CREATE rights, managed Auth REFERENCES/read/row-lock authority, effective default ACLs, and object ownership.
- Definer gates' ability to read Auth and the forced-RLS registry under the accepted security model. Table ownership alone must not be assumed to bypass FORCE RLS.
- Trusted Auth role's managed-session read/lock privileges. M5 supplies private-object grants, not a blanket managed-Auth privilege repair.
- Extensions/function resolution, DDL event triggers, naming collisions and legacy equivalents in other schemas.
- No competing migration/deployment process; reviewed lock/statement timeout expectations and workload risk.

**VERIFIED — repository evidence:** these files reference managed Auth tables but do not alter their definitions. They contain no extension-installation statement. Do not install an extension merely from habit; verify UUID resolution first.

Do not solve privilege failures with broad grants, private-schema exposure, RLS weakening, or changing the invoker hook to SECURITY DEFINER. Any necessary correction requires a separately reviewed proposal and Irene's authorization.

## 6. Sprint 01D Auth Hook Requirements

**VERIFIED — repository evidence:** M5 installs:

- `portal_private.write_session_generation(session_id, user_id, generation)`, with managed Auth FKs and RLS enabled **and forced**.
- `portal_private.write_generation_seq`, a positive bigint, noncycling allocator.
- `portal_private.issue_write_generation(event jsonb) returns jsonb`, **SECURITY INVOKER**, with an empty search path.
- A replacement `portal_private.assert_write_session()` requiring a signed canonical string claim `aiea_write_generation` matching the locked session registry entry.

The exact intended Custom Access Token Hook target is **`portal_private.issue_write_generation(jsonb)`**. The repository's documented local validation URI is `pg-functions://postgres/portal_private/issue_write_generation`. That is a reference, not an instruction to change hosted settings or copy local configuration.

M5 grants `supabase_auth_admin` private-schema USAGE, hook EXECUTE, registry SELECT/INSERT, UPDATE limited to `generation`, and sequence USAGE. It does not grant registry DELETE/TRUNCATE/identity UPDATE or allocator-reset authority. Browser/service roles receive no new registry/allocator/hook authority. Effective inherited/default privileges still require hosted inspection.

The hook uses trusted issuance context, verifies session/user identity, locks the managed session before allocating, and overwrites the generation claim. It preserves other incoming claims. It does not derive authority from user metadata, email domains, or caller body/header values. It does not check adult confirmation or provision Portal access; compatible non-Portal users may also receive the claim.

**REFERENCE — official documentation:** custom access-token hooks run before issuance, and Supabase checks required claims in the returned payload. Existing hook behavior/custom-claim consumers must be reconciled before replacement. [Custom Access Token Hook contract](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook).

**REFERENCE — official documentation:** PostgreSQL hooks have a two-second processing limit, and configuration can apply hook grants/revocations. Hosted lock contention, timeout behavior and activation-side ACLs must be validated. [Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks).

**REPORTED — not independently verified:** accepted local evidence reports transactionally coupled issuance/registry advancement, same-second stale-token rejection, independent-session behavior, rollback and timeout tests. This is not proof of equivalent hosted runtime behavior.

Activation constraints:

- Migration execution alone does not activate the hook; repository config contains no enabled custom-token hook.
- Activation affects project-wide issuance. Anonymous or incompatible contexts are rejected by this hook; existing consumers must be assessed before activation.
- Existing tokens are not backfilled. Missing claim/registry state fails closed for 01D writes.
- The Portal stores no refresh token and has no browser authority-repair flow. Fresh approved sign-in is its practical issuance path.
- Disabling the hook does not fence already-issued generation-bearing tokens.
- Generation authority is per session. Refreshing one session does not revoke another session for the same user.

**Bounded guarantee:** after a newer generation commits, an older token cannot authorize a new 01D mutation. A write already holding authority locks may finish before refresh; refresh-first denies a waiting obsolete write. This is not global bearer invalidation or closure of SNV04/SNV06.

## 7. Direct RPC Exposure and Transaction Boundary Risks

**VERIFIED — repository evidence:** M4 grants authenticated EXECUTE on exactly these exposed write signatures:

- `portal.record_mission_progress(uuid,uuid,uuid,uuid,text)`.
- `portal.record_cohort_delivery(uuid,uuid,uuid,uuid,text)`.

An application maintenance page or disabled `/api/portal/progress` handler cannot block direct PostgREST calls with an adult bearer token. Direct SQL, service clients and jobs also require their own fence.

**PROPOSED maintenance boundary:** keep `portal` unavailable through production Data API before M1; keep `portal_private` unexposed permanently; pause Portal database writers and inspect alternate wrappers/overloads/entry points. Preserve unrelated applications and existing API exposure. Demonstrate fencing rather than assuming that schema absence alone protects future objects.

Private-schema SQL USAGE for accepted policy helpers is different from Data API exposure. Preserve least privilege; do not apply generic broad schema/table grants. [Using Custom Schemas](https://supabase.com/docs/guides/api/using-custom-schemas).

**VERIFIED — repository evidence:** each migration has its own explicit transaction. Intermediate risks are:

| Intermediate state | Release risk |
| --- | --- |
| M1 committed, M2 pending | Tables exist before M2's RLS installation; effective default ACLs/privileged callers matter. |
| M2 committed, M3 pending | RLS exists before the complete integrity/audit guard set. |
| M4 committed, M5 pending/failed | Callable write RPCs retain the historical timestamp gate; same-second stale-token protection is incomplete. |
| M5 installed, hook inactive | Final gate exists, but ordinary missing-generation tokens cannot perform 01D writes. |
| Hook active, validation pending | Fresh write authority may exist; maintenance must remain effective until release approval. |

Do not infer all-or-nothing deployment from one runner invocation. Do not blindly rerun a file after uncertain commit acknowledgement or ledger recording. Reconcile objects and history first.

Adding an outer transaction or `psql --single-transaction` does not make these unchanged files atomic because they contain their own transaction commands. Atomic repackaging would change execution semantics and requires separate review/approval. [PostgreSQL psql](https://www.postgresql.org/docs/17/app-psql.html).

## 8. Hosted Authentication and Environment Requirements

**VERIFIED — repository evidence:** the local config is a development scaffold: PostgreSQL 15, local origins/callbacks, `portal` API exposure, disabled anonymous sign-in, TOTP settings and local mail configuration. It is not evidence of hosted configuration and must not be copied wholesale into production.

The accepted Portal requests email OTP with `create_user: false`, validates the returned adult identity/profile, stores an access token in an HttpOnly cookie, and discards refresh tokens. Existing Auth identities do not automatically become Portal adults or receive workspaces, learners, memberships, entitlements, curriculum or staff capabilities. No provisioning is authorized here.

**UNKNOWN — not inspected:** actual hosted authentication methods, signup/anonymous settings, existing hook, token/session lifetimes, callback allowlist, email templates, SMTP delivery/rate limits, TOTP and recovery policies, and other Auth consumers.

Future activation requires:

- Approved exact Site URL/callback allowlist and adult-only onboarding policy, while preserving unrelated Auth consumers.
- OTP delivery/template compatibility, approved recipients and bounded authentication smoke cases.
- TOTP assurance for any approved staff operation and a separately controlled first-staff bootstrap/recovery procedure.
- Secure operator-managed runtime configuration. The accepted runtime expects `PORTAL_SUPABASE_URL`, `PORTAL_SUPABASE_PUBLISHABLE_KEY`, and `PORTAL_ORIGIN`; no credential values are requested or inspected here.
- Hosted HTTPS, cookie/rewrite/CDN/no-cache behavior and token-size validation. The runtime's access-token cookie bound is 3,800 characters; existing custom claims may affect size.

No service credential belongs in a browser or static source. Stripe, commerce, Blob expansion, new provisioning and Sprint 01E are not required to install these migrations and are outside this handoff's scope.

The new foreign keys also affect lifecycle behavior: Portal profile/staff references include user-delete restrictions; actor references include SET NULL; the private registry cascades with managed session/user deletion. Future deletion/recovery procedures must account for these dependencies. No managed user/session deletion is authorized here.

## 9. Recommended Deployment Method

**RECOMMENDATION:** use one controlled, version-pinned Supabase CLI migration runner, rehearsed with the exact five-file manifest, under the proven maintenance boundary. Prefer normal ordered application/history recording over separate Dashboard paste operations.

**REFERENCE — official documentation:** first `db push` creates `supabase_migrations.schema_migrations`; successful application records each migration version. Subsequent pushes skip recorded versions. [Supabase db push](https://supabase.com/docs/reference/cli/supabase-db-push).

Before approving the runner, establish its exact version, secure target/connection selection, pending-file list, explicit-transaction behavior, history-recording behavior, failure handling and log custody. Do not assume ledger writes are atomic with this baseline's explicit file commits. This behavior has not been independently verified for a selected runner version.

Exclude seeds, custom-role additions, bootstrap/tests and unrelated migrations. No remote reset is acceptable. Do not pre-mark these versions applied. Migration-history comparison alone does not prove definition/checksum equivalence.

A reviewed `psql` runner using `ON_ERROR_STOP` can be a fallback, but needs an explicit history-recording and recovery design. It must not be improvised during release. [PostgreSQL psql](https://www.postgresql.org/docs/17/app-psql.html).

History repair only inserts/deletes ledger records; it does not apply or reverse objects. If future evidence establishes manual application, repair requires migration-specific equivalence evidence and separate approval. [Supabase migration repair](https://supabase.com/docs/reference/cli/supabase-migration-repair).

No remote CLI command was run. A `--dry-run` label does not by itself establish compliance with a strict read-only boundary; version-specific side effects and credential use must be reviewed before any later use.

## 10. Numbered Deployment Plan with Human Approval Gates

**All steps below are proposed future work. This documentation request authorizes none of the hosted or rehearsal actions.**

1. **Complete sanitized metadata preflight.** Confirm target identity, current catalog/history state, managed Auth contract, effective ACLs/default grants, event triggers, exposure, existing consumers and recovery coverage. If objects/history differ from this report, stop and reconcile before proceeding. **Gate:** Irene reviews the evidence and unresolved discrepancies; any new hosted inspection needs an authorized operator/session and defined metadata-only scope.

2. **Authorize isolated rehearsal.** Use PostgreSQL 17.11 or a justified compatible environment and representative managed Auth/PostgREST versions. Exercise all five unchanged files, failures, history reconciliation, direct RPC security and hook availability. Use synthetic fixtures only in isolation. **Human approval:** Irene approves environment, scope and operator before rehearsal begins.

3. **Approve the hosted execution package.** Bind target, manifest/checksums, runner/version, connection method, maintenance controls, backup point, abort criteria, logs, operator and recovery procedure. **Human approval:** Irene explicitly authorizes migration execution. This does not authorize hook activation, API exposure, application deployment or release.

4. **Establish and prove maintenance before M1.** Fence Portal Data API/direct SQL/service/job writers; preserve unrelated operations; exclude wrappers/alternate entry points and competing releases. Verify the approved recovery point. **Gate:** no execution if fencing or recovery evidence fails.

5. **Apply M1 → M2 → M3 → M4 → M5.** Recheck source hashes, use one approved runner, stop on errors and exclude seeds/tests/resets. Record successful outcomes truthfully. **Gate:** no write reopening between files; uncertain acknowledgement requires object/ledger reconciliation rather than automatic retry.

6. **Inspect the final database while fenced.** Compare definitions/owners/grants/policies/triggers and inventory against the accepted baseline; verify all five history records and the M5 replacement. **Gate:** final state passes; discrepancies return to Irene and require approved recovery.

7. **Request the separate Auth hook activation decision.** Present existing Auth/claim compatibility, exact target, expected ACL effects, availability criteria and hook-recovery procedure. **Human approval:** Irene explicitly authorizes activation and the bounded hosted validation scope.

8. **Activate and validate while Portal remains fenced.** Recheck ACLs, perform fresh approved issuance, validate both RPCs and existing authentication consumers through approved test paths/accounts. **Gate:** all approved security/availability criteria pass; any failure invokes approved recovery and retains maintenance.

9. **Approve Portal exposure and release.** Present final reconciliation and smoke results, remaining accepted notes and monitoring/recovery ownership. **Human approval:** Irene explicitly authorizes the exact exposure/release change. Vercel/application deployment requires its own approval and is not implied by database acceptance.

10. **Recover under the approved contingency package if necessary.** Keep writes fenced. Prefer reviewed forward recovery. **Human approval:** actions outside the approved contingency, destructive reversal, session recovery, or whole-project restore require Irene's explicit authorization.

## 11. Hosted Validation and Smoke-Test Requirements

**UNKNOWN — not inspected:** none of the following hosted checks has been executed or passed by this review. Approval must define target, operator, accounts, permitted writes and evidence handling. Security/race/fault tests should be exercised comprehensively in isolation; do not adapt repository synthetic scripts into production probes.

### Final-state metadata checks before activation

- Both expected schemas; 28 product tables plus the private registry/allocator; 29 distinct accepted function definitions; no unintended view/wrapper/overload.
- Product-table RLS enabled and private registry RLS enabled/forced; expected policies, constraints, triggers and indexes installed.
- Qualified function references, empty search paths, invoker hook and accepted definer owners preserved.
- Authenticated bounded reads and entitlement column summaries; no authenticated direct table DML; no raw billing/staff/audit browser access.
- Exactly the two intended authenticated-callable exposed write signatures; no alternate mutation bypass.
- Effective hook/registry/sequence grants, including role inheritance/default ACLs, match M5. No browser/service allocation, reset, repair or identity-update authority.
- `portal_private` excluded from Data API; maintenance still effective for `portal` and direct writers.
- All five truthful history records; schema definitions and manifest also reconciled rather than relying on version timestamps alone.

### Approved activation/smoke cases

| Area | Required evidence |
| --- | --- |
| Auth continuity | Approved existing adult sign-in/OTP and relevant non-Portal flows remain compatible; required/existing custom claims preserved; no unexpected anonymous/other-consumer disruption. |
| Fresh issuance | Signed canonical `aiea_write_generation` claim corresponds to current managed session/registry authority; no credential/token values included in the report. |
| Missing/obsolete authority | Pre-activation, missing, malformed or stale authority denies 01D writes without product/audit mutation. |
| Direct RPC boundary | Anon/service/private-hook requests cannot gain write authority; approved authenticated requests reach only the intended RPCs and obey subject/workspace/version authorization. |
| FAMILY | Existing approved OWNER/learner path supports start/completion only under exact HR01 attestation/evidence rules; unsupported rules deny; terminal/repeated actions remain idempotent. |
| SCHOOL | Existing approved cohort/role/teacher assignment supports STARTED/DELIVERED; no individual learner-progress fanout or completion inference. |
| Revocation/expiry | Account/session/profile/membership/entitlement/assignment loss and stale assurance deny as designed; lock ordering tested in isolation. |
| Read behavior | GET causes no progress/domain audit mutation; tenant/version isolation and retired-entitled access remain bounded. |
| Availability/recovery | Hook errors/timeouts/lock contention fail issuance safely; registry advancement rollback behavior and recovery established in isolation and bounded hosted observations. |
| Application environment | When separately authorized, HTTPS/rewrite/CDN/cookies/cache/token-size/callback behavior passes on the actual hosted path. No Vercel deployment is authorized here. |

If approved hosted accounts lack required pre-existing Portal records/content, record that validation gap. Do not provision real records, create entitlements, publish curriculum or bootstrap staff under this report. Those are separate scopes and approval gates.

### Work safe before hosted activation

Repository inspection, checksum verification, review of sanitized operator-supplied metadata/configuration, documentation, and preparation of validation/recovery criteria can proceed without activation or production credentials.

After separate approval, isolated rehearsal and fenced installation of all five migrations can precede hook activation. A fully migrated but hook-inactive database can remain fenced; ordinary missing-generation tokens cannot perform 01D writes. Those SQL/configuration activities remain unauthorized by this documentation-only request.

## 12. Rollback and Recovery Procedures

**VERIFIED — repository evidence:** no accepted down migrations exist. **RECOMMENDATION:** retain maintenance and prefer reviewed forward recovery while preserving domain/audit history. Every procedure below requires the approved contingency scope or additional Irene authorization.

| Failure point | Proposed response |
| --- | --- |
| Failure before a file commits | Stop; verify transaction rollback, object state and ledger. Earlier committed files remain. Do not continue to later files automatically. |
| Commit or ledger acknowledgement uncertain | Stop and reconcile actual definitions/objects/history before retrying. Files are not generally idempotent. Do not guess or pre-mark applied. |
| M4 committed; M5 failed | Keep all writes fenced. Recover through a reviewed M5 procedure. Never reopen with the historical timestamp gate. |
| M5 installed; hook not active | Retain the accepted gate and maintenance while awaiting separate activation approval. Do not weaken the gate to make old tokens work. |
| Hook activation breaks Auth | Fence Portal writes first; restore the prior hook configuration under recovery authorization, recheck ACLs and validate Auth. Disabling the hook alone does not invalidate existing generation-bearing tokens. |
| Product writes/new data already exist | Prefer forward repair; preserve audit and domain data. No automatic schema drops or whole-project restore. |
| Destructive reversal considered | Prepare a separate dependency/data-aware reversal script, impact assessment and history reconciliation. Obtain explicit approval. |

Never reset/reuse the generation allocator during routine recovery. Sequence allocation gaps after aborted transactions are expected. [PostgreSQL sequence behavior](https://www.postgresql.org/docs/17/functions-sequence.html).

A restore that rewinds registry/allocator authority requires an approved token/session strategy before reopening so previously issued authority cannot regain validity through reused generations. No production recovery strategy for that scenario is verified here.

Whole-project restore can discard unrelated transactions committed after the recovery point. Verify recovery coverage for managed Auth/configuration and any relevant external Storage/Blob assets rather than treating a database backup as complete project recovery. Preserve backups and sensitive captures in approved operator custody; this agent does not access them.

Migration-history repair is never rollback. Do not use remote reset, test bootstrap/fixture SQL, sequence resets, broad privilege changes or unreviewed Auth deletions as recovery shortcuts.

## 13. Outstanding Blockers, Risks, and Unknowns

These are blockers to execution/activation/release decisions, not newly established implementation defects. Accepted local findings are not reclassified.

| Item | Evidence status | Required resolution |
| --- | --- | --- |
| Target identity/observation context | UNKNOWN beyond supplied version/query role | Operator confirms exact project/database/environment and current timestamp. |
| Full catalog/provenance/event-trigger reconciliation | UNKNOWN beyond supplied inventory | Exclude legacy equivalents, wrappers, event-trigger interference and partial/manual drift. |
| Managed Auth/runtime compatibility | UNKNOWN | Confirm structures/types and Auth/PostgREST versions; rehearse accepted semantics. |
| Owner/roles/effective/default ACLs | UNKNOWN | Prove schema/FK/row-lock/forced-RLS access and least privilege. |
| Existing applications/Auth consumers/hook/claims | UNKNOWN | Inventory dependencies and validate project-wide issuance impact. |
| Actual exposure/provider settings | UNKNOWN | Sanitized operator-supplied configuration evidence, including callbacks/OTP/TOTP/signup methods. |
| Maintenance enforcement | UNKNOWN | Demonstrate Data API plus direct SQL/service/job fencing before M1. |
| Runner/version/ledger semantics | UNKNOWN | Pin and rehearse handling of explicit commits, errors and history recording. |
| Backup/PITR/restore/token recovery | UNKNOWN | Evidence of coverage/rehearsal and generation-safe recovery with reviewed blast radius. |
| Hosted activation ACL/timeout/load behavior | UNKNOWN | Separately approved activation/validation and failure criteria. |
| Approved smoke accounts/records | UNKNOWN | Define authorized test paths without accessing customer data or expanding provisioning scope. |
| Hosted application behavior | UNKNOWN | Resolve relevant inherited notes through separately authorized validation. |
| Execution/activation/recovery/release authorization | Not granted by this task | Irene approves each concrete package/gate separately. |

Known operational risks include partial commits, intermediate M4 exposure, Auth-wide issuance failure, lifecycle FKs, inherited grants, generation reuse after restore, and unrelated-data loss from project restore. Controls are specified above; none is claimed proven on the hosted project.

## 14. Five Inherited Open Notes

**VERIFIED — repository documentary evidence:** the accepted 01D review retains exactly these five notes as **NOTE — OPEN**:

| ID | Retained limitation |
| --- | --- |
| 01B-A03 | Hosted rewrite/CDN/HTTPS-cookie behavior unproven. |
| SNV02 | Deprecated local inbucket configuration. |
| SNV04 | Global refresh-chain cascade invalidation unproven. |
| SNV05 | Exact-path-only native callback guarantees unproven. |
| SNV06 | Ordinary stateless Data API/RLS may accept an unexpired signed-out JWT. |

No note is closed or reclassified by this reconciliation. SNV02 is a local-config limitation, not evidence of a hosted mail defect. HR03's bounded write guarantee does not establish global refresh-chain or stateless-read invalidation and does not close SNV04/SNV06.

## 15. Final GO / CONDITIONAL GO / STOP Recommendation

| Decision scope | Recommendation |
| --- | --- |
| Documentation/repository reconciliation | **GO — completed within the authorized scope.** |
| Proposed further sanitized metadata preflight and isolated rehearsal | **CONDITIONAL GO — only after Irene authorizes the specific operator/environment/scope.** This is a recommendation, not granted permission. |
| Hosted migrations | **STOP — prerequisite, maintenance, runner and recovery evidence plus execution authorization are incomplete.** |
| Auth hook activation | **STOP — separate compatibility evidence and explicit activation authorization required.** |
| Portal exposure/production release/Vercel deployment | **STOP — hosted validation and separate release/deployment approvals required.** |
| Sprint 01E | **STOP — excluded and not begun.** |

The inventory supports an initial five-migration deployment candidate. It does not support a claim of hosted compatibility or production readiness. Irene remains the final Human Authority.

## 16. Exact Next Authorized Action

**Deliver this saved document to the user for Irene's review, then STOP.** The currently authorized action is completion of this documentation file and its local path/brief completion confirmation. No further technical or hosted action is authorized.

The recommended next technical proposal for Irene is a sanitized, metadata-only preflight by the designated operator through an explicitly authorized session, covering the unknowns in Sections 5 and 13. It does not require sharing credentials, tokens or customer records with this agent. Approval of this document does not automatically authorize that preflight, rehearsal, migrations or activation.

This task used local read-only inspection and creation of the single requested Markdown file. It did not execute SQL/migrations, run database-mutating tests, connect to hosted providers, access production credentials/customer data, activate hooks, change provider configuration, deploy to Vercel, stage/commit/push/merge, or begin Sprint 01E. The pre-existing handoff outside `handoffs/` remains unchanged.

**STOP — return control to Irene.**
