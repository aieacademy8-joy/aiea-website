# AIEA Portal — Sprint 01A Supabase-Native Validation Report v1.0

Date: 2026-10-06  
Authority: Human acceptance of corrected Sprint 01A and authorization for isolated, non-production Supabase-native validation only.  
System under test: the accepted, uncommitted foundation on `main`, following the independent re-audit.  
Governing architecture: [P0 Architecture and Data Contract v1.0 — FROZEN](AIEA_Portal_P0_Architecture_and_Data_Contract_v1.0_FROZEN.md).  
Prior acceptance evidence: [Independent Re-audit v1.0](AIEA_Portal_Sprint_01A_Independent_Reaudit_v1.0.md), read in full before validation.

## A. Executive verdict

**FAIL — the Supabase-native validation gate remains closed pending Human review and a separately authorized correction.**

The unchanged migrations apply successfully to actual Supabase PostgreSQL 15.19. All 188 existing database assertions pass. An additional 103 Auth/PostgREST checks pass, including Auth-issued passwordless sessions, real TOTP enrollment/challenge/verification, tenant and teacher isolation, private-schema exclusion, and request-time revocation. A further 31 native privilege checks pass.

However, the accepted configuration disables the email provider. An ordinary email OTP request for an existing, confirmed adult returns HTTP 422, `email_provider_disabled`, `Email logins are disabled`. Administrator-generated magic links can still produce sessions; their success does not establish the ordinary adult sign-in experience required by frozen Section K. The failure was reproduced for a family owner and a teacher. See **SNV01** in Section O.

**327 final-inventory checks executed: 326 passed and 1 failed.** Four of the passing checks independently confirm the failure and its effective configuration; they do not resolve it. Counts: **0 BLOCKER, 1 MAJOR, 0 MINOR, 1 NOTE**. Setup commands, migration statements, harness debugging attempts, and checks left unexecuted are excluded from the 327.

No implementation correction was made. The previous repository acceptance of F01–F05 remains recorded; this report does not reopen those corrections or claim that the next native gate passed. Sprint 01B was not begun.

## B. Exact environment used

| Component | Actual environment |
|---|---|
| Isolation | Disposable **local** Supabase CLI project; no remote project, login, link, or database push |
| Temporary project | `/tmp/aiea-supabase-native-yj1e996d/project` |
| Project identifier | `aiea-portal-local`, copied unchanged from the accepted scaffold |
| Supabase CLI | **2.120.0**, official macOS ARM64 release, installed only in the temporary validation directory |
| CLI archive SHA-256 | `3b8546cc61aeabab6fd1f68edc7f664ebdfa96bdd6a9b18d8d612708f430ae28`, matched the official release asset |
| Host | macOS **26.6.2**, build **25G83**, Apple ARM64 |
| Docker Desktop | **4.94.0**, build **241994**; explicitly approved startup and daemon access |
| Docker client / server | **29.8.2 / 29.8.2** during validation; initial pre-start client inventory reported 29.7.2 |
| Database image | `public.ecr.aws/supabase/postgres:15.19.0.004` |
| Database runtime | **PostgreSQL 15.19**, `aarch64-unknown-linux-gnu`, GCC 15.2.0, 64-bit |
| Supabase Auth | `public.ecr.aws/supabase/gotrue:v2.197.0` |
| PostgREST | `public.ecr.aws/supabase/postgrest:v16.4` |
| API gateway | `public.ecr.aws/supabase/kong:2.8.1` |
| Local test mail | `public.ecr.aws/supabase/mailpit:v1.31.3`, exposed under the CLI's legacy `inbucket` container name |
| Test tooling | Temporary Python standard-library HTTP/SQL harnesses; container `psql`; accepted SQL assertion inventory |
| Endpoints | Local API `127.0.0.1:54321`, database port `54322`, test-mail UI port `54324` |

The accepted `supabase/` directory was copied outside the repository without changing its configuration, migrations, or tests. Startup excluded Realtime, Storage, image proxy, Studio, database metadata API, Edge Runtime, analytics/log collection, and pooler services that are not required for this gate. Auth, PostgREST, PostgreSQL, gateway, and local mail ran. The CLI also downloaded a Realtime image during initialization, but no Realtime container ran.

Five synthetic adult Auth identities used `@example.invalid` addresses. No real customer account or email address was used. Local generated credentials, access/refresh tokens, and TOTP material stayed outside the repository and are omitted from this report. No production SMTP was configured.

The disposable stack was stopped with `supabase stop --no-backup` after reproducing SNV01. Follow-up Docker inventories returned no project containers, project-labelled volumes, or project network. Docker Desktop itself remains available; downloaded images and temporary evidence/tooling remain local.

Tool provenance: [official CLI release assets](https://github.com/supabase/cli/releases/expanded_assets/v2.120.0), [official local development guide](https://supabase.com/docs/guides/local-development/cli/getting-started), and [CLI configuration reference](https://supabase.com/docs/guides/local-development/cli/config). The observed runtime and HTTP responses, rather than configuration documentation alone, determine the findings below.

## C. Migration result

**PASS — all three accepted migrations applied from a clean local database state.** There were no existing Docker containers before this stack was created. No migration was edited, skipped, reordered, or replaced by a synthetic Auth bootstrap.

| Migration | CLI history entry | Result |
|---|---|---|
| `20261006000100_portal_domains.sql` | `20261006000100` | Applied |
| `20261006000200_portal_security.sql` | `20261006000200` | Applied |
| `20261006000300_portal_guards.sql` | `20261006000300` | Applied |

The native database contains all 28 frozen Portal domain tables with RLS enabled. The existing `foundation.sql` ran through container `psql` with `ON_ERROR_STOP=1`: **188 unique PASS labels exactly matched `assertions.json`**, and the final transaction rolled back. Native `auth.users` accepted the test fixtures. The PGlite bootstrap was **not** executed against Supabase.

A later temporary fixture setup reused the accepted setup statements, substituted the five actual Auth user IDs, and committed only in the disposable database to support HTTP checks. The two published versions, three workspaces, four learners, teacher assignments, and exact-version entitlements were synthetic. These fixture adaptations were test tooling, not changes to the system under test.

## D. Auth/JWT/session validation

**Mixed result: native sessions and TOTP work; ordinary email sign-in fails (SNV01).**

- Native Auth rejected public signup and anonymous signup.
- The local administrator API created five confirmed synthetic identities. Generating and verifying local administrator-issued magic links produced real signed `authenticated` sessions at `aal1`.
- Each session had the expected subject, `authenticated` audience, future expiry, and `is_anonymous=false`; `/auth/v1/user` independently validated its identity. This checks issued claims and Auth validation, not enforcement of every possible issuer/audience policy by PostgREST.
- Refreshing an ordinary adult session after editing its user metadata worked. Self-asserted owner/staff metadata granted no Portal authority.
- Real TOTP enrollment, challenge, and verification succeeded for both an authorized staff adult and an ordinary adult. Auth issued `aal2` JWTs containing TOTP AMR. The ordinary adult still received no staff authority.
- Tampered-signature and malformed JWTs were rejected by PostgREST with HTTP 401.
- The original `aal1` tokens remained insufficient for the staff predicate after the corresponding sessions upgraded.
- The normal `POST /auth/v1/otp` flow with `create_user=false` failed for existing adults. Consequently the planned local-mail delivery, emailed-link consumption/replay, and ordinary emailed-session checks were not completed.

For service-side predicate checks, the temporary harness carried claims from actual Auth-issued, Auth-validated JWTs into a local SQL transaction before switching to `service_role`. This tests the database contract under verified end-user context. It does not implement or certify a future backend that validates and forwards those claims.

## E. RLS and tenant-isolation validation

**PASS for executed cases.** Actual adult JWTs through PostgREST showed:

| Adult | Learner visibility | Workspace visibility |
|---|---|---|
| Family owner | One family learner | Own family only |
| Assigned school teacher | One assigned learner | Own school only |
| School administrator | Two learners in own school | Own school only |
| Staff without tenant membership | None | No tenant authority inferred from staff grant |
| Unaffiliated adult | None | None |

Each adult could read only their own profile. Anonymous Portal reads were denied. Updating user metadata to claim workspace ownership or staff status did not change access. Revoking membership or deactivating the adult profile removed access on the next request with the same signed token. Native SQL assertions additionally exercised cross-workspace foreign keys, inactive membership, unauthorized actors, and browser mutation denial.

## F. Teacher/cohort privacy validation

**PASS for executed cases.** The teacher JWT saw one assigned cohort and its assigned learner, not the other cohort's learner. The family owner saw no school cohorts. Revoking the teacher assignment immediately reduced learner and cohort reads to zero; restoring the assignment restored the fixture for subsequent checks.

The native SQL suite also passed unassigned teacher/cohort learning-write denial, learner/cohort mismatch denial, assignment revocation of historical access while retaining records, cross-workspace restrictions, and another adult's private-feedback exclusion. No child Auth identity or broad teacher role was introduced.

## G. Staff authorization validation

**PASS for executed database and session cases.** A real `aal1` staff session failed `staff_has`; the same adult's real TOTP-backed `aal2` session passed the granted support capability. An ordinary adult's genuine TOTP-backed `aal2` session failed the same staff predicate. Staff had no broad tenant browser access.

Revoking the staff row using the verified real staff context removed authority while the signed `aal2` token remained otherwise usable. The native audit recorded that real Auth actor and the revoked state. Browser access to staff grants and browser staff inserts were denied.

The 188-assertion native suite also passed F01 malformed/missing/null assurance cases and F02 staff bootstrap, grant/revoke provenance, bounded capability, reactivation, deletion, actor spoofing, and audit protections. Actual phone MFA, lost-factor recovery, and future staff endpoints remain unverified.

## H. Exact-version entitlement validation

**PASS for executed cases.** Family and teacher JWTs read only the entitled published version; the unentitled second version and unaffiliated adult remained excluded. Entitlement summary reads worked only for explicitly granted summary columns; the billing-correlation column was denied.

Suspending the school entitlement denied curriculum and learner reads on the next request with the existing teacher JWT. The SQL suite passed exact-version/workspace/billing composite relationships, revoked access, unpublished/retired new-assignment restrictions, and preservation of learning history after authorization removal.

## I. Publication/localization validation

**PASS in the native 188-assertion suite.** Executed cases include authorized publication with attributable publisher/hash, denial without TOTP-backed bounded staff authorization, complete approved locale-tree requirements, published curriculum/locale immutability, child reparenting denial, lifecycle/retirement restrictions, stable response option keys, and F05 entitled fallback/unavailable-locale cases.

PostgREST with the teacher JWT returned only the entitled published mission locale. Native PostgreSQL accepted the relevant deferred locale foreign keys and triggers. No canonical text or frozen publication rule was changed. Concurrent publication/retirement interleavings were not reached before the Auth finding halted further validation.

## J. Learning/evidence immutability validation

**PASS in the native SQL suite.** The real PostgreSQL engine enforced finalized attempt/response immutability, submitted evidence immutability, structural response identity, version/context foreign keys, actor derivation, teacher scope, exact entitlement, and preservation during revocation. Controlled actor-reference nulling cases passed without permitting arbitrary edits.

No future learning-write HTTP endpoint was implemented. Browser writes remain denied; the native SQL service-role checks validate the existing database guards.

## K. Billing/entitlement/event-ledger validation

**PASS at the tested database boundary.** The 188 native assertions passed account/workspace purchasing authority, initiating-actor derivation, immutable purchase correlation, disabled subscription use, exact-version integrity, deferred refund/revocation consistency, and final-dispute-loss protections.

F03 event identity, immutable/one-time binding, applied-event prerequisites, terminal-state protections, duplicate event IDs, account/environment consistency, and audit correlation cases passed. F04 checks covered entitlement-to-billing consistency on both update directions and the permitted/forbidden billing states. Browser billing/event reads and browser entitlement grants were denied through the actual Data API.

No Stripe connection, checkout, webhook signature verification, external payment truth, reconciliation, notification, or production transaction was attempted. Passing database assertions does not certify those future integrations or concurrent transaction ordering.

## L. PostgREST/schema exposure validation

**PASS for executed cases.** The effective running configuration was:

```text
PGRST_DB_SCHEMAS=portal
PGRST_DB_EXTRA_SEARCH_PATH=public,extensions
```

Requests selecting `portal_private`, `auth`, or `public` as the Data API profile returned HTTP 406 / `PGRST106` for anonymous, adult, and service-role callers. Extra search path entries did not become exposed schemas. A `portal` RPC request for the private `staff_has` helper returned HTTP 404 / `PGRST202`.

Anonymous Portal reads returned HTTP 401 / `42501`; forbidden adult table/column access and inserts returned HTTP 403 / `42501`. The service role could read the four synthetic learners and the audit log through the `portal` profile, but its audit insertion was denied. No private helper was moved into the exposed schema.

## M. Privilege/service-role validation

**PASS — 31 additional native privilege/structure checks.** Actual managed roles, rather than synthetic PGlite roles, showed:

- `anon` and `authenticated`: non-superuser, no RLS bypass; no membership in service/operator roles.
- `authenticator`: `NOINHERIT`, with membership allowing switching to the three API roles.
- `service_role`: non-superuser with native `BYPASSRLS`; this is a trusted server credential, not an adult identity.
- All 23 private functions owned by migration role `postgres`, which is a non-superuser with RLS bypass in this environment. All fix an empty search path; 22 are SECURITY DEFINER and the timestamp-touch function is SECURITY INVOKER.
- None of the three API roles has `TRUNCATE`, `TRIGGER`, or `REFERENCES` on any Portal table. None has audit INSERT/UPDATE/DELETE. Browser roles cannot create objects in either Portal schema; service cannot create private helpers.
- Browser roles cannot execute the staff/locale service-only helpers. Managed `supabase_auth_admin` cannot SELECT learner records.

Inspection also showed Supabase's broad defaults are schema-scoped to its own exposed schemas; they did not automatically grant browser access in the new Portal schemas. This describes the tested CLI images, not an assurance about an uninspected hosted project or future migration owner.

## N. Adversarial tests executed

| Final inventory | Passed | Failed | Evidence |
|---|---:|---:|---|
| Accepted native SQL assertions | 188 | 0 | Every unique label matched `supabase/tests/assertions.json`; rollback confirmed |
| Real Auth, TOTP, JWT, PostgREST, and revocation checks | 103 | 0 | `http-results.json` |
| Additional native privilege checks and ordinary OTP request | 31 | 1 | `extra-results.json` |
| Independent SNV01 reproductions/configuration checks | 4 | 0 | `reproduction-results.json` |
| **Total** | **326** | **1** | **327 executed checks** |

The 188 accepted cases are catalogued in the unchanged checked-in assertion inventory and SQL. They were executed against the native managed schema, not merely read or rerun in WASM. The additional HTTP checks include negative access attempts, forged metadata, JWT corruption, schema-profile attacks, ordinary-adult TOTP, service audit forgery, and revocation using existing tokens.

The temporary harness initially expected a non-existent `external.anonymous` settings key; the actual key is `external.anonymous_users`. Its settings assertion was narrowed to the observed signup flag, while actual anonymous-signup rejection was tested separately. This harness mistake was corrected outside the repository before the final HTTP inventory. It is not a product finding and its aborted run is excluded from the final counts.

Temporary evidence directory: `/tmp/aiea-supabase-native-yj1e996d`. These local files are not repository deliverables and may be removed by the operating system. Reproduction is specified in Section O so the report does not depend on permanent temporary-file retention.

| Evidence file | SHA-256 |
|---|---|
| `foundation-native.log` | `ff67f735585147ddff5cc56c5385c3be5a8fe3d0773b821718fedc294ff7c524` |
| `http-results.json` | `47bd7b1505e6e15d09f706fa428221eac993ddc2e84e24afbcd397d37876e8c8` |
| `extra-results.json` | `a789318f60d4ef5edfa2c130bb1d9bc1933299db0f733138be05002f571aea38` |
| `reproduction-results.json` | `a34956f9ecd365e76e45bcace6b5961eecac7126abf1c6d106a83e508de0b2d5` |
| `inspect.log` | `480c46d25cc0080395d0f75a7d8ea019a17bf91d06c42b82b3ad1ab35c9d3944` |

No 7-case runner self-test or 35-case offline-validator result from earlier reports is added to this task's count. The original offline validator's fixed report allowlist predates the accepted re-audit and this authorized report; it was not edited to accommodate either artifact. Repository preservation was checked directly against a pre-task content-hash baseline instead.

## O. Findings

| ID | Severity | Affected file/line/domain | Reproduction | Impact | Required correction |
|---|---|---|---|---|---|
| **SNV01** | **MAJOR** | `supabase/config.toml:37`, `[auth.email]`; adult passwordless Auth / frozen Section K | Start unchanged scaffold with CLI 2.120.0. Pre-create and confirm an adult via the local Auth admin API. POST `/auth/v1/otp` with that email and `create_user=false`. HTTP 422, `email_provider_disabled`. Repeated for two existing adults. `/settings` shows `external.email=false`; container has `GOTRUE_EXTERNAL_EMAIL_ENABLED=false`. | Ordinary parents/teachers cannot initiate the required passwordless email login. Admin-generated links conceal this gap if used as the only authentication test. This blocks acceptance of the native gate, despite passing database/security checks. No unauthorized access was observed. | **Proposed, not applied or retested:** change only `[auth.email].enable_signup` to `true` to enable the email provider; retain global `[auth].enable_signup=false` at line 33 and anonymous sign-ins disabled at line 34. Add an ordinary existing-adult OTP regression and prove public/unknown-user signup remains denied. Requires separate Human correction authorization. |
| **SNV02** | **NOTE** | `supabase/config.toml:22–24`, local mail configuration | CLI start and stop both warn that `[inbucket]` is deprecated in favor of `[local_smtp]`. | No present startup/migration failure: the compatibility mapping launched Mailpit successfully. The warning is independent of SNV01. | No correction is required to reproduce or explain this gate failure. Consider a separately approved, version-aware local-mail section update when maintaining the CLI configuration; do not combine it silently with SNV01. |

Severity rationale: SNV01 is MAJOR because it prevents the required adult sign-in path in the accepted local configuration. It is not classified BLOCKER as an unrecoverable migration/data-loss/security-boundary failure; the gate nevertheless fails until the behavior is corrected and retested. SNV02 is a compatibility warning without observed functional failure. **Totals: BLOCKER 0; MAJOR 1; MINOR 0; NOTE 1.**

### SNV01 reproducible procedure

1. Copy the accepted `supabase/` directory into an otherwise empty temporary project. Use official CLI 2.120.0 and start its local PostgreSQL 15/Auth/PostgREST stack. Do not link a hosted project or change the accepted configuration.
2. Use only the generated local admin credential to create a synthetic existing confirmed adult, for example `native-validation-2@example.invalid`. `POST /auth/v1/admin/users` with `email_confirm=true` succeeds. The test also established an adult profile and family-owner membership; the failure occurs at Auth before those Portal roles are evaluated.
3. With the local publishable API key, make the ordinary request:

   ```http
   POST http://127.0.0.1:54321/auth/v1/otp
   apikey: <generated-local-publishable-key>
   Content-Type: application/json

   {"email":"native-validation-2@example.invalid","create_user":false}
   ```

   Observed response:

   ```json
   {"code":422,"error_code":"email_provider_disabled","msg":"Email logins are disabled"}
   ```

4. Repeat for the pre-existing confirmed teacher `native-validation-3@example.invalid`: identical response.
5. Inspect only the relevant non-secret settings:

   ```text
   /auth/v1/settings: external.email=false, disable_signup=true
   GOTRUE_EXTERNAL_EMAIL_ENABLED=false
   GOTRUE_DISABLE_SIGNUP=true
   GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED=false
   ```

These observed effective settings establish the cause. The [official configuration reference](https://supabase.com/docs/guides/local-development/cli/config#auth.email.enable_signup) describes the similarly named global and email-specific signup controls; it does not substitute for the observed provider-disable behavior. The proposed one-line correction is an inference from the effective runtime mapping and remains **untested**, because no implementation or test-copy correction was authorized after discovery.

## P. Frozen architecture conformance

**Preserved without edits.** The canonical file is byte-identical to the frozen commit `052101670dc92b38c7ec15c88a2b07572e42d75b` and to the pre-task baseline.

Frozen artifact SHA-256: `f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755`.

All tested database controls continue to support the frozen adult-only, tenant/cohort, exact-version, staff/TOTP, publication/localization, billing/event, immutable evidence, and retention boundaries. SNV01 identifies a configuration behavior that does not support the required ordinary adult sign-in path; it does not authorize weakening adult onboarding, public-signup controls, or staff assurance requirements.

No deferred feature, child authentication, subscription functionality, upload, retention duration, production provider integration, or Portal runtime was added.

## Q. Remaining unverified boundaries

Validation stopped after the ordinary OTP failure was reproduced and classified. The following are **not passed by this report**:

- The proposed SNV01 correction and its effect on existing-adult login, unknown-user/signup rejection, local email delivery, one-time token replay prevention, token expiry, and redirect allowlisting.
- The planned correctly signed expired-JWT request; issued JWT expiry claims were inspected, but the negative expiry request was not reached.
- Multi-session publication/retirement/entitlement races, learning finalization races, assignment changes during writes, concurrent duplicate events, concurrent billing transitions, and serialization/retry behavior. The native SQL suite's deferred constraints ran in a single connection.
- Session expiry/termination, stale refresh tokens, factor removal, phone MFA, factor recovery, and a governed staff recovery workflow beyond the executed old-`aal1` and database-revocation checks.
- Hosted Supabase settings, migration ownership, managed extensions, custom claim hooks, remote role/default privilege differences, and provider upgrades beyond the exact local images used here.
- Future bounded backend authorization/claim-forwarding endpoints, UI/callback handling, learner deletion/export workflows, and operational bootstrap/recovery procedures.
- Production SMTP deliverability, customer onboarding, real Stripe payment truth, raw-body signatures, live checkout, webhooks, external idempotency/reconciliation, notifications/retries, and Blob/export integration.

No website runtime was started on the configured callback port. No runtime capability is inferred from scaffold comments or the synthetic fixture's operator privileges.

## R. Files created/modified

**Exactly one repository file created by this task:**

```text
docs/portal/AIEA_Portal_Sprint_01A_Supabase_Native_Validation_Report_v1.0.md
```

**Existing repository files modified by this task: none.** A pre-task baseline covered all 139 tracked and non-ignored untracked files. All 139 retained their exact bytes. The pre-existing `.gitignore` modification and 16 untracked foundation/review files belong to earlier work and were preserved.

Accepted system-under-test hashes:

| File | SHA-256 |
|---|---|
| `supabase/config.toml` | `9670635fc663050d8296d567dff961f95bc8142abd554e275f392370d06efee0` |
| `20261006000100_portal_domains.sql` | `f0bdbe5ed8f4f622362c0a6c149bc26644b06552b8a7358b8d792dbfe05a8464` |
| `20261006000200_portal_security.sql` | `8a159ad2768d85685ecd16f3840f1ecff3f43a9fee1abb933d636dfd10995bf6` |
| `20261006000300_portal_guards.sql` | `8fababc9491321f176fcfbf5196ff44a98a41bd657d263a897f51498837bb486` |

Temporary CLI binaries, copies, scripts, fixtures, local credentials, and logs were created under `/tmp/aiea-supabase-native-yj1e996d`. The CLI initialized its user cache outside the repository. Docker downloaded local images and created then removed the disposable project services/data. No dependency manifest or lockfile changed, and no local credential was added to the repository.

## S. Git status and safety

- Branch: `main`.
- HEAD and locally cached `origin/main`: `052101670dc92b38c7ec15c88a2b07572e42d75b`; no network fetch was needed to make the local comparison.
- Index: empty before and after validation; nothing staged.
- No commit, push, deployment, production connection, provider/project creation, provider configuration change, or live website change.
- Only authorized disposable local Supabase resources were created; those resources were removed after validation.
- Canonical frozen architecture, public application code, accepted migrations/configuration/tests, prior reports, and dependencies remain unchanged.

Final short status, with earlier changes preserved:

```text
## main...origin/main
 M .gitignore
?? .env.example
?? docs/portal/AIEA_Portal_Sprint_01A_Correction_Report_v1.0.md
?? docs/portal/AIEA_Portal_Sprint_01A_Implementation_Foundation_Report_v1.0.md
?? docs/portal/AIEA_Portal_Sprint_01A_Independent_Audit_Handoff_v1.0.md
?? docs/portal/AIEA_Portal_Sprint_01A_Independent_Reaudit_v1.0.md
?? docs/portal/AIEA_Portal_Sprint_01A_Supabase_Native_Validation_Report_v1.0.md
?? portal/
?? scripts/
?? supabase/
```

There are 17 untracked files after this report, compared with 16 before it, and the same one pre-existing tracked-file modification. No `.temp` or linked-project state was created inside the repository.

## T. Recommended next gate

**Human Authority review of this report, followed by a separately authorized, narrowly scoped SNV01 correction and repeat native validation.**

If authorized, the correction pass should enable the local email provider while retaining the global no-public-signup and no-anonymous-sign-in boundaries; prove ordinary existing-adult OTP/magic-link delivery and verification using local mail; prove unknown-user signup remains denied; and repeat the native migrations, 188 regression assertions, Auth/PostgREST/TOTP checks, and remaining session/concurrency checks. SNV02 may remain a documented warning unless separately included in that authorization.

Do not treat this failed gate or the suggested correction as authorization for Sprint 01B, a hosted production project, runtime endpoints, provider configuration, staging, commit, push, or deployment. Work stops with this report for Human review.
