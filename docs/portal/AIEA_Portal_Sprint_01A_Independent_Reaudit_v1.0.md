# AIEA Portal — Sprint 01A Independent Re-audit v1.0

Date: 2026-10-06 (America/Chicago)  
Document type: Independent Technical / Security / Architecture Re-audit  
Status: REPORT ONLY — NOT AN IMPLEMENTATION AUTHORITY  
Scope: Independent verification of the uncommitted F01–F05 correction and broader foundation regressions  
Implementation authority: NONE

## A. Executive verdict

**A. PASS — CORRECTIONS INDEPENDENTLY VERIFIED**

F01, F02, F03, F04 and F05 independently pass. The original failure paths no longer succeed under the tested database roles and synthetic session contexts. No new BLOCKER, MAJOR or MINOR repository finding was identified in this re-audit.

The supplied 188 SQL assertions, seven runner self-tests and 35 offline checks passed independently. Beyond those checks, the auditor executed 101 separately constructed savepoint-isolated adversarial cases, nine additional actual-commit/privacy cases, and seven end-to-end in-memory runner mutation experiments. These counts describe different test units and are not a combined security score.

This verdict supports Human Authority acceptance of the corrected Sprint 01A repository foundation. It does not establish Supabase-native compatibility, production readiness, provider payment truth, or completion of future Portal endpoints. No implementation, provider setup, deployment or Sprint 01B work was performed.

## B. Repository safety verification

| Check | Independently observed result |
|---|---|
| Repository | `aiea-website`; origin `https://github.com/aieacademy8-joy/aiea-website.git` |
| Branch | `main` |
| HEAD | `052101670dc92b38c7ec15c88a2b07572e42d75b` |
| Cached origin/main | Same frozen commit |
| Current branch history/reflog | No subsequent Sprint 01A implementation commit |
| Staging | Empty |
| Correction report | Present and read in full |
| Frozen architecture | Read in full; byte-for-byte identical to the tracked artifact at HEAD |
| Original independent handoff | Read in full; matches the prior exported audit, including F01–F05 and its original FAIL verdict; 16,261 bytes |
| Handoff SHA-256 | `a3c5fc8c425ce102b64d9e5e51ea5e0d6a45e58af9d305f98f16eca4f6a6b93c` |
| Handoff preservation cross-check | Current hash also matches the available pre-correction fingerprint record |
| Initial working tree | One tracked modification (`.gitignore`) and 15 expected untracked files; implementation and correction remain uncommitted |
| Application boundary | `.gitignore` is the only tracked difference from HEAD; public website, checkout, APIs, dependencies, configuration and frozen artifacts have no tracked changes |
| Audit actions | No staging, commit, push, deployment or external provider change |

Local repository evidence supports the stated branch, commit and staging boundary. Cached remote references and local history cannot independently prove that no action occurred through an external deployment/provider system or another checkout; those systems were not queried or changed.

The auditor read all four authoritative sources: the FROZEN architecture, original implementation report, original independent audit handoff, and correction report. The builder's correction report was treated as a claim to verify. All migrations, SQL tests, assertion inventory, runner, offline validator, scaffold READMEs, local configuration, environment example and `.gitignore` were inspected.

The available pre-correction fingerprint record identifies exactly the six claimed existing correction paths as changed. That builder-generated record is corroborative evidence rather than a substitute for inspection and behavioral tests.

## C. F01 independent result

**PASS — original MAJOR finding closed for the repository foundation.**

Relevant implementation: [security migration, `staff_has`, line 54](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000200_portal_security.sql:54>); [guards migration, publication/retirement, line 48](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000300_portal_guards.sql:48>); [staff-management guard, line 216](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000300_portal_guards.sql:216>).

The complete staff predicate is coalesced to FALSE, AAL is compared as the exact JSON string `aal2`, and only an AMR array is expanded. TOTP must be an exact JSON string method. Privileged call sites reject any result `IS NOT TRUE`.

The original missing-AAL exploit was replayed against an active authorized staff actor with TOTP AMR. The predicate returned FALSE, and attempted staff grant, retirement and publication were rejected with SQLSTATE `42501`.

Independent variants included missing/null/aal1/uppercase/whitespace/numeric/Boolean/object/array AAL; missing/null/scalar/Boolean/numeric/object/empty/nonconforming AMR; malformed AMR entries; missing capability; inactive adult; revoked staff; and ordinary family owner, teacher, school admin and other adult identities with forged editable metadata. All expected denials held. Positive active staff with the necessary capability, TOTP and aal2 could grant bounded staff authority, publish and retire.

The independent F01 group contained 31 cases, with multiple predicate and actual-operation checks per case. The supplied suite's additional F01 assertions also passed.

The deterministic Boolean result was verified for these assurance-claim cases with valid synthetic Auth identity fields. Raw malformed identity fields, token signatures, issuer/audience, expiration, real session lifecycle and real Auth claim issuance remain the native/authentication boundary; no SQL claim simulation establishes their production validity.

## D. F02 independent result

**PASS — original MAJOR finding closed for the repository foundation.**

Relevant implementation: [guards migration, `guard_stripe_event`, line 257](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000300_portal_guards.sql:257>) and [correlation audit fields, line 26](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000300_portal_guards.sql:26>).

Initial NULL correlation can resolve while the old state is PROCESSING or RETRYABLE_FAILED, including resolution and application in one update. Once non-null, correlation cannot change or clear. APPLIED requires a billing basis. APPLIED and IGNORED cannot change to another lifecycle state. Event DELETE is guarded, and provider event ID remains unique and immutable.

The original APPLIED school-to-family reassociation was rejected with `23514`. Independent tests also rejected same-workspace reassociation to another purchase, clearing, resolved PROCESSING/RETRYABLE_FAILED rebinding, rebinding of completed/terminal rows, terminal lifecycle regression, provider event ID rewriting and event deletion. Duplicate insertion failed with `23505`. Legitimate initial binding and same-state replay preserved one ledger identity and its binding. Initial-binding audit entries retain old/new billing-reference IDs; billing's immutable tenant relationship preserves the corresponding workspace context.

The independent F02 group contained 12 cases, many testing multiple target/state variants. Browser ledger mutation and service-role TRUNCATE denial were additionally verified in the regression group.

These results establish ledger correlation/idempotency protections. They do not establish HTTP webhook deduplication or absence of duplicate commerce effects: no live event processor or entitlement-effect handler exists in 01A. Those remain frozen §R integration work.

## E. F03 independent result

**PASS — original MAJOR finding closed for the repository foundation.**

Relevant implementation: [guards migration, `guard_entitlement`, line 154](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000300_portal_guards.sql:154>) and [shared deferred billing/access guard, line 196](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000300_portal_guards.sql:196>).

Both billing and entitlement INSERT/UPDATE constraint triggers inspect current final state. ACTIVE is compatible only with PAID, PARTIALLY_REFUNDED, DISPUTE_OPEN or DISPUTE_WON. REFUNDED and DISPUTE_LOST require every corresponding entitlement to be REVOKED. The former asymmetric immediate billing check was removed; immutable basis and parent locks remain.

An independently constructed matrix tested all eight billing states against ACTIVE, SUSPENDED and REVOKED entitlements, in both billing-first and entitlement-first order: 48 cases. Each explicitly deferred the constraints and forced final validation with `SET CONSTRAINTS ALL IMMEDIATE`. All expected allowed and denied combinations behaved correctly. A 49th case proved that revoking only the ACTIVE entitlement is insufficient when another SUSPENDED entitlement remains beneath terminal billing; revoking all corresponding rows permits the transaction.

Actual COMMIT tests independently rejected PAID-to-PENDING, CHECKOUT_CREATED, REFUNDED and DISPUTE_LOST changes beneath an unchanged ACTIVE entitlement. Each failed with `23514`, and the previously committed PAID state remained intact. Four positive COMMIT cases accepted refund plus revocation and final dispute loss plus revocation, each in both mutation orders.

The original F03 path therefore cannot persist invalid ACTIVE authorization after a successful commit. Compatible partial-refund and unresolved-dispute states still work. Partial refunds do not automatically alter entitlement. Unresolved disputes support existing ACTIVE access or controlled suspension; terminal billing cannot retain SUSPENDED entitlement. No provider-ordering or payment-verification claim is made.

## F. F04 independent result

**PASS — original MINOR finding closed for the repository foundation.**

Relevant implementation: [guards migration, `guard_staff`, line 216](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000300_portal_guards.sql:216>) and [staff provenance audit fields, line 29](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000300_portal_guards.sql:29>).

Existing original grant actor/time cannot be rewritten. Insert derives actor/time and clears supplied revocation provenance. The active-to-revoked transition derives revocation actor/time; subsequent changes cannot rewrite those fields. Reactivation and API-role deletion fail closed, preventing an exposed delete/reinsert provenance reset. Ordinary customers lack both browser write grants and staff-management capability.

Independent attempts covered grant actor replacement/nulling, past/future grant timestamps, premature revocation actor/time assignment, forged actor/timestamps at legitimate grant and revoke transitions, post-revocation rewrites, reactivation and service-role deletion. False supplied provenance was either rejected with `23514` or replaced with the authenticated manager and transaction time at the legitimate transition. The audit retained the actual manager, status change and timestamps. The independent F04 group contained seven cases with multiple field checks per case.

One additional operator-level privacy case deleted the original grantor after explicitly removing its subject/profile rows. Narrow FK-driven nulling preserved the retained staff row's grant/revocation timestamps and REVOKED status while nulling actor references, including audit actors. This is an isolated database-operator simulation, not a shipped privacy endpoint or an API-role bypass.

## G. F05 independent result

**PASS — original MINOR finding closed for the repository foundation.**

Relevant implementation: [runner inventory validation, line 9](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/scripts/portal/test-database.mjs:9>), [expected assertion inventory](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/tests/assertions.json>), and [entitled locale controls, line 199](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/tests/foundation.sql:199>).

Expected names come from a separate checked-in JSON inventory rather than runtime SQL discovery. The runner checks exact expected/actual membership, duplicate executed names, and nonempty/unique/valid expected inventory. The 188 supplied behavioral assertions and seven database-free self-tests passed independently. Inspected assertions exercise actual guards, role grants, RLS and expected SQLSTATEs, rather than only counting schema objects.

Seven end-to-end mutation experiments used temporary copies held entirely in memory. The real runner's execution and inventory-checking code was retained; its file-reading adapter supplied mutated SQL/inventory and its root/argv context was set explicitly for memory execution. No temporary file or repository source was written. Each experiment returned failure exit code 1 for the intended inventory reason:

| In-memory mutation | Observed rejection |
|---|---|
| Remove one original assertion | Missing `exact frozen 28-domain inventory` |
| Remove every assertion SELECT | Expected-name inventory mismatch; empty execution cannot pass |
| Add an unexpected executed name | Unexpected-name mismatch |
| Duplicate an executed name | Duplicate executed assertion |
| Duplicate an expected inventory entry | Invalid expected assertion inventory |
| Empty expected inventory | Invalid expected assertion inventory |
| Non-array expected inventory | Invalid expected assertion inventory |

Initial auditor-only adapter attempts encountered argv setup and SQL dollar-quoting errors before reaching the intended mutation checks. Those adapter issues were corrected in memory; only the seven subsequently completed experiments above are counted as verification evidence. No implementation or runtime package was changed.

The unavailable-locale fixture now explicitly has an ACTIVE exact-version entitlement, separately proves requested `en-US` resolution, and then proves unavailable `fr-FR` with no fallback returns NULL. It is no longer confounded by entitlement denial. Coverage now includes learner-assignment revocation, inactive adult/workspace/cohort, suspended entitlement and additional private-read/helper denials.

Inventory matching guards accidental suite reduction. It does not prove that an assertion's predicate is meaningful or prevent an intentional coordinated rewrite of tests and inventory; independent predicate inspection and adversarial probes remain necessary.

## H. Broader regression result

**PASS within the locally testable foundation boundary.**

| Area | Evidence/result |
|---|---|
| Frozen domains | All 28 tables remain represented; all 28 have RLS enabled |
| Adult-only identity | Minimal adult profile marker remains server-managed; learner_ref has no authentication identity |
| Workspace/cohort tenancy | Composite tenant FKs and role/workspace compatibility remain; negative relationship tests pass |
| Teacher privacy | Active teacher/cohort and learner/cohort intersection remains; assignment, membership and inactive-context denials pass |
| Exact-version access | Mission/assessment/evidence/billing relationships remain pinned; wrong-version tests and entitlement-gated reads pass |
| Browser/anonymous boundary | Authenticated browser writes remain denied; independent privilege scan also checked TRUNCATE, TRIGGER and REFERENCES; anon has no Portal table privileges |
| Sensitive tables/helpers | Browser billing/Stripe/staff/audit access and privileged-helper calls remain denied; service cannot directly write audit or truncate the ledger/provenance/audit tables in the isolated role model |
| Publication/localization | Publication tree checks, immutable published children, parent reparenting denial and locale separation remain; incomplete locale publication is rejected |
| Finalized learning | Finalized attempts/responses and submitted evidence remain immutable; controlled actor nulling retains history |
| Privacy | Learner reference remains minimal; no learner media/Storage foundation; no migration ON DELETE CASCADE |
| Commerce scope | Subscription/invoice identifiers remain constrained inactive; notification state remains separate; no live Stripe processor or Portal checkout wiring added |
| Website/dependencies | Existing public website, APIs, package/dependency configuration and deployment configuration remain unchanged from HEAD |
| Environment | Placeholder example remains blank/test-only; localhost redirects, disabled signup/anonymous sign-in and Storage remain; no real credentials found in inspected files |

No Portal UI, customer-access activation or deferred product feature was introduced. Runtime onboarding, controlled staff/support/export/correction/privacy endpoints and frozen §R commerce repairs remain future work; this audit does not describe them as implemented.

## I. Adversarial tests actually executed

| Execution | Independently observed result |
|---|---|
| Three migrations from empty existing PGlite runtime | PASS, original order; PostgreSQL 17.5 |
| Full supplied SQL suite | 188 PASS; exact named inventory matched |
| Runner self-tests | 7 PASS |
| Offline foundation validator | 35 PASS before creation of this report |
| Independent savepoint cases | 101 PASS: F01 31; F02 12; F03 49; F04 7; broader privileges 2 |
| Additional actual COMMIT/privacy cases | 9 PASS: four invalid commit denials, four compatible commits, one controlled grantor-nullification case |
| End-to-end memory-copy mutations | 7 intended inventory rejections, each exit 1 |
| Node syntax | 11 files PASS: nine existing APIs, public main.js, database runner |
| Python validator AST | PASS |
| TOML syntax/local safety flags | PASS |
| Git whitespace check | PASS |
| Audit write boundary | Existing source/report fingerprints unchanged; this re-audit report is the only authorized new file |

The pre-existing temporary PGlite 0.3.14 runtime was reused. No download/install, dependency/lockfile change, native Supabase connection or project was needed. All synthetic identities, claims, DML and SQL COMMIT operations occurred exclusively in disposable in-memory databases; they were not Git commits or remote migrations.

The offline validator has a fixed pre-report file allowlist. Its 35-PASS result was obtained before this explicitly authorized report was created. This new audit artifact is not in that allowlist; the validator was not modified to accommodate it. Final audit safety verification compares the original fingerprint inventory plus this one authorized report, separately from that validator.

## J. Findings table

Original severity is retained for traceability; closed findings are not new findings.

| ID | Severity | Status | Independent reproduction/result | Required action |
|---|---|---|---|---|
| F01 | MAJOR — original | CLOSED / PASS | Missing AAL returns FALSE; original grant/retirement/publication bypass and assurance variants reject with 42501; valid staff succeeds | No further repository correction for F01; verify real signed Auth/TOTP/session behavior at the separately authorized native gate |
| F02 | MAJOR — original | CLOSED / PASS | Original APPLIED cross-tenant rebinding, same-tenant rebinding, clearing, lifecycle regression and deletion reject; legitimate initial resolution and audit correlation succeed | No further repository correction for F02; implement/test the future verified idempotent processor under its own authority |
| F03 | MAJOR — original | CLOSED / PASS | 48 ordered billing/entitlement combinations plus multi-entitlement final-state case behave correctly; invalid actual commits reject and compatible commits succeed | No further repository correction for F03; validate multi-session behavior and provider reconciliation later |
| F04 | MINOR — original | CLOSED / PASS | Provenance rewrites reject; legitimate grant/revoke derives real actor/time; reactivation/API delete denied; controlled actor nulling preserves timestamps | No further repository correction for F04; future lifecycle/privacy endpoints remain separately governed |
| F05 | MINOR — original | CLOSED / PASS | Separate manifest matches all 188 assertions; seven actual runner mutations reject; locale test independently entitled | No further repository correction for F05; continue independent review of assertion semantics |

New BLOCKER findings: **0**. New MAJOR findings: **0**. New MINOR findings: **0**.

Native/integration observations below are residual validation boundaries rather than newly demonstrated repository defects.

## K. Frozen architecture conformance

**YES — frozen architecture preserved.**

The canonical artifact is byte-for-byte unchanged. Corrections reinforce frozen §§G/H/L staff authority and attribution, §§M/N billing/event/access integrity, §O publication immutability, §P localization, and §Q retained history/controlled deletion. No table inventory, tenant model, authentication model, product scope or retention duration was expanded.

Custom schemas, fixed-search-path helpers, read-only browser grants, unsupported staff reactivation and fail-closed deletion are bounded foundation choices. They do not substitute for the final P0 server-operation requirements or authorize new scope.

## L. Remaining Supabase-native uncertainties

These observations require separate Human Authority authorization and remain unverified here:

- PostgreSQL 15 compatibility versus tested PGlite PostgreSQL 17.5; actual Supabase CLI configuration acceptance and migration execution.
- Managed Auth schema, effective role inheritance/default privileges, function ownership, SECURITY DEFINER behavior and service-role permissions in the actual project.
- PostgREST exposure of portal only, private-helper non-exposure, real anonymous/adult/service JWT requests and entitlement column permissions.
- Token signatures, issuer/audience, expiry, real AAL/TOTP AMR issuance, stale sessions, factor removal, recovery and staff revocation during real sessions.
- Concurrent publication/content edits, finalization/responses, retirement/purchases, assignment revocation, event processing and billing/entitlement mutations; lock ordering, deadlock/retry and isolation behavior.
- Controlled adult onboarding, SMTP and redirect allowlists; no authentication mail or provider configuration was performed.
- Bounded server write/support/export/correction/privacy operations and their audit behavior; none are claimed complete.
- Verified Stripe payment truth, trusted offer mapping, event ordering/idempotency/retries and all frozen §R runtime commerce repairs; current isolated download/HMAC flow remains separate.
- Private versioned Blob delivery/hash verification, external object replacement controls, authorized deletion/export lifecycle and approved retention policy.

Local SQL proofs and synthetic JWT claims do not resolve these questions. No Supabase-native validation was started.

## M. Files created/modified

The auditor created only:

[AIEA_Portal_Sprint_01A_Independent_Reaudit_v1.0.md](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_Sprint_01A_Independent_Reaudit_v1.0.md>)

Exact path: `/Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_Sprint_01A_Independent_Reaudit_v1.0.md`

Implementation files modified by auditor: **NONE**. Other existing files modified: **NONE**. Other files created: **NONE**. No temporary-copy files were created; mutation copies existed only in memory. No packages were installed.

Existing uncommitted files and the original handoff were preserved. Audit-source fingerprint checks cover the pre-existing changed/untracked boundary; the frozen artifact is additionally compared directly with Git HEAD.

## N. Git status

Branch remains `main`. HEAD and cached origin/main remain `052101670dc92b38c7ec15c88a2b07572e42d75b`. The index remains empty. The original `.gitignore` modification and pre-existing untracked scaffold/correction artifacts remain uncommitted; this report adds one untracked documentation file.

Final expected inventory is one tracked modified file and 16 untracked files:

```text
 M .gitignore
?? .env.example
?? docs/portal/AIEA_Portal_Sprint_01A_Correction_Report_v1.0.md
?? docs/portal/AIEA_Portal_Sprint_01A_Implementation_Foundation_Report_v1.0.md
?? docs/portal/AIEA_Portal_Sprint_01A_Independent_Audit_Handoff_v1.0.md
?? docs/portal/AIEA_Portal_Sprint_01A_Independent_Reaudit_v1.0.md
?? portal/README.md
?? scripts/portal/test-database.mjs
?? scripts/portal/validate-foundation.py
?? supabase/README.md
?? supabase/config.toml
?? supabase/migrations/20261006000100_portal_domains.sql
?? supabase/migrations/20261006000200_portal_security.sql
?? supabase/migrations/20261006000300_portal_guards.sql
?? supabase/tests/assertions.json
?? supabase/tests/bootstrap.pglite.sql
?? supabase/tests/foundation.sql
```

Files staged: **NONE**. Git commits: **NONE**. Pushes: **NONE**. Deployments: **NONE**. External provider changes: **NONE**.

## O. Recommended next gate

**Human Authority review and acceptance of the corrected, still-uncommitted Sprint 01A foundation and this independent re-audit.** No further F01–F05 repository correction is required by this audit.

Only after acceptance should Human Authority consider a separately scoped authorization for isolated non-production Supabase-native validation covering Section L. Production deployment, live customer access, Portal commerce/runtime wiring and deferred features remain outside this approval. This report grants no authority to stage, commit, push, deploy, create/connect a project, configure providers or begin Sprint 01B.

**Final verdict: A. PASS — CORRECTIONS INDEPENDENTLY VERIFIED.**
