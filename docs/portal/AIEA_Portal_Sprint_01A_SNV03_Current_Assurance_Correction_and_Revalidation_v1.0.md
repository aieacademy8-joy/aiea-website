# AIEA Portal — Sprint 01A SNV03 Current Assurance Correction and Revalidation v1.0

Date: 2026-10-06 (America/Chicago)  
Authority: Human authorization for the bounded SNV03 repository correction and disposable LOCAL native revalidation only.  
Governing artifact: [P0 Architecture and Data Contract v1.0 — FROZEN](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_P0_Architecture_and_Data_Contract_v1.0_FROZEN.md>).  
Prior finding: [SNV01 Correction and Native Revalidation v1.0](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_Sprint_01A_SNV01_Correction_and_Native_Revalidation_v1.0.md>), Section H, SNV03.

## A. Decision / final gate status

**SNV03: CLOSED — corrected and verified within the authorized local database/native boundary. Overall bounded native gate: PASS.**

The existing private staff predicate now requires current managed Auth session/factor assurance as well as its existing JWT, active adult, active staff and bounded capability checks. Genuine authorized staff can publish, retire and manage staff. After genuine factor removal, the old unexpired `aal2` JWT remains accepted by native Auth, but the predicate returns FALSE and all three privileged guard paths reject the operation with SQLSTATE `42501`. A separately created session and newly verified factor reproduce that denial.

Final post-correction native inventory: **467 PASS, 0 FAIL**. Additional offline verification: **188 PGlite assertions and 7 runner self-tests PASS**, reported separately. Open findings: **BLOCKER 0; MAJOR 0; MINOR 0; NOTE 4**. SNV02 and SNV04–SNV06 remain unchanged NOTES. Human acceptance of this correction/report is still the next gate; this is not production or Sprint 01B approval.

Frozen architecture changed: **NO**. Sprint 01B begun: **NO**. Staged, committed, pushed, deployed, or external providers modified: **NO** to each.

## B. Root cause of SNV03

The previous `portal_private.staff_has(text)` required exact JWT `aal2`, TOTP AMR, an active adult profile and an active matching capability. It did not bind the JWT's `session_id` to current managed assurance.

In the pinned native Auth version, deleting the genuine verified TOTP factor downgraded its managed session to `aal1` while the previously issued signed JWT still carried `aal2`/TOTP AMR. `/auth/v1/user` continued to accept that JWT. Consequently, JWT validation alone did not establish current assurance. The previous predicate returned TRUE and its retirement caller accepted an UPDATE in a rolled-back transaction.

Before editing, the frozen contract and the implementation, independent handoff, correction, independent re-audit, original native validation and SNV01 correction reports were re-read. The predicate, all three privileged call sites, SQL claim fixtures, native managed schema and helper-owner read privileges were inspected. The failure was reproduced on the unchanged pre-correction configuration/migrations in a disposable stack.

## C. Exact correction implemented

The only production security implementation change is this additional conjunct inside the existing SECURITY DEFINER `staff_has` function:

```sql
and exists(select 1 from auth.sessions a join auth.mfa_factors f
  on f.id=a.factor_id and f.user_id=a.user_id
  where a.id::text=auth.jwt()->>'session_id' and a.user_id=auth.uid()
    and a.aal='aal2' and (a.not_after is null or a.not_after>statement_timestamp())
    and f.factor_type='totp' and f.status='verified')
```

The session must exist, belong to the JWT adult, retain managed `aal2`, and have no elapsed explicit `not_after`. Its **bound factor**, rather than any factor on the account, must still be a verified TOTP belonging to the same adult. Text comparison of the session ID avoids an unsafe UUID cast; absent, null, malformed, object-valued and another adult's session IDs fail closed.

The exact JSON JWT AAL/TOTP checks remain necessary: an old `aal1` token cannot acquire authority just because its session later upgrades. The complete predicate still coalesces to FALSE. All existing privileged callers still require explicit TRUE. No new helper, exposed RPC, role grant, Auth DDL, Auth mutation in a production migration, configuration change or runtime endpoint was added.

The existing, uncommitted security migration was amended in place. All three migrations were subsequently applied from clean local state. No previously applied hosted migration history was changed; no hosted database was contacted.

## D. Exact files changed

Repository root: `/Users/dosfam/Desktop/AIEAcademy/Website/2.0`.

| File | Exact task change |
|---|---|
| [supabase/migrations/20261006000200_portal_security.sql](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000200_portal_security.sql:54>) | Added the managed session/bound verified TOTP conjunct and explanatory comment to `staff_has`; no other function or privilege statement changed |
| [supabase/tests/bootstrap.pglite.sql](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/tests/bootstrap.pglite.sql:7>) | Added minimal synthetic managed session/factor table shapes for the offline runner only |
| [supabase/tests/foundation.sql](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/tests/foundation.sql:22>) | Added rolled-back synthetic session/factor fixtures and matching session IDs to existing claim contexts |
| [supabase/tests/staff-assurance.native.py](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/tests/staff-assurance.native.py>) | New, local-only 100-check SNV03 regression with genuine Auth TOTP, fresh-session reproduction and actual guarded operations |
| [supabase/README.md](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/README.md>) | Documented the tightened predicate and native regression prerequisites/use |
| [This canonical report](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_Sprint_01A_SNV03_Current_Assurance_Correction_and_Revalidation_v1.0.md>) | New correction/revalidation report |

Exactly **four existing files changed and two files were added**. The 188 assertion predicates and labels, assertion manifest, runner, domains migration, guards migration, SNV01 regression, configuration, prior reports, public website and dependencies are unchanged. A normalization comparison removed only the new fixture block/session-ID fields and recovered the prior SQL file byte-for-byte.

The synthetic bootstrap's Auth-owned fixture cascades mirror test identity cleanup only. That bootstrap never ran against Supabase; no production/customer FK or deletion rule changed.

## E. Why the frozen requirement is satisfied

Frozen Section L requires an authenticated active adult, that exact adult's active bounded staff authorization, current session `aal2`, the appropriate capability, and audited bounded operations. It also calls for stale-session, missing-factor and revoked-staff testing. This correction enforces the current assurance condition at the **existing database guard boundary** without changing any of those requirements.

The helper's existing `postgres` owner already has SELECT on native `auth.sessions` and `auth.mfa_factors`. Native inspection confirmed that the managed session has `id`, `user_id`, `aal`, `factor_id` and `not_after`, and that the linked factor has `user_id`, `factor_type` and `status`. Genuine enrollment/verification established that the session's bound factor is the verified TOTP. No additional browser or service Auth-table grant was necessary.

Cryptographic validation of the end-user token remains a prerequisite of the existing service contract. SQL does not authenticate an arbitrary caller-provided JSON claim document. The native harness obtained actual signed tokens from local Auth and used their claims to exercise the database service boundary; deliberately malformed session-ID cases are separately labelled SQL-context adversarial probes. No future backend claim-forwarding implementation is certified here.

The source inspection is consistent with the pinned [Auth session model](https://github.com/supabase/auth/blob/v2.197.0/internal/models/sessions.go) and [MFA implementation](https://github.com/supabase/auth/blob/v2.197.0/internal/api/mfa.go); the actual managed schema and native reproductions establish this report's result.

## F. Security boundaries preserved

- PostgREST still exposes only `portal`; `auth`, `portal_private` and `public` remain unavailable as API profiles. The private staff helper remains absent from exposed RPCs and non-executable by browser/anonymous roles.
- Existing SECURITY DEFINER ownership, empty search path, 23-function inventory, RLS, read-only browser grants and limited entitlement columns remain intact. No public/private table privilege expanded.
- Staff capabilities remain separate from workspace membership. Ordinary adults with genuine TOTP receive no staff authority. Metadata/email/domain do not create authority; service credentials alone do not supply an adult actor.
- Tenant, cohort, assignment, exact-version entitlement, publication/localization, billing/event, immutable learning/evidence, attribution and audit rules are unchanged and passed regression.
- Global signup and anonymous authentication remain disabled. The accepted SNV01 email-provider correction remains enabled and unchanged. No child Auth identity was created; every new Auth fixture represents a synthetic adult.
- No ordinary Data API session policy, refresh policy, redirect rule, mail section, commerce flow or provider setting was changed. SNV02 and SNV04–SNV06 were not corrected.

## G. Native environment used

| Component | Observed environment |
|---|---|
| Isolation | Disposable **LOCAL** Supabase project, copied outside the repository; no login/link/remote push |
| Temporary root | `/var/folders/v7/9s2qngr52z798fdlhklzlhx40000gn/T/aiea-snv03-ked5a4si` |
| Project / local ports | `aiea-portal-local`; API `127.0.0.1:54321`, database `54322`, Mailpit `54324` |
| CLI | Reused official macOS ARM64 Supabase **2.120.0** binary, originally checksum-verified |
| CLI archive SHA-256 | `3b8546cc61aeabab6fd1f68edc7f664ebdfa96bdd6a9b18d8d612708f430ae28` |
| Host | macOS **26.6.2**, build **25G83**, ARM64 |
| Docker | Desktop **4.94.0**, build **241994**; client/server **29.8.2 / 29.8.2** |
| PostgreSQL | **15.19**, ARM64, GCC 15.2.0; `public.ecr.aws/supabase/postgres:15.19.0.004` |
| Auth | `public.ecr.aws/supabase/gotrue:v2.197.0` |
| PostgREST | `public.ecr.aws/supabase/postgrest:v16.4` |
| Gateway | `public.ecr.aws/supabase/kong:2.8.1` |
| Local mail | `public.ecr.aws/supabase/mailpit:v1.31.3`; legacy `inbucket` configuration/name unchanged |
| Tooling | Python standard-library HTTP/TOTP harnesses, container `psql`; offline PGlite **0.3.14**, PostgreSQL **17.5** |

The before-correction stack was discarded before the corrected clean start. Only PostgreSQL, Auth, PostgREST, gateway and local mail ran; other Supabase services were excluded. The accepted configuration was copied without edits. Native tests used synthetic `@example.invalid` adults, not real customer addresses, and no production SMTP or website callback runtime.

The new checked-in regression accepts only the fixed loopback API and local Docker database container. Supply a private local CLI JSON credential-file path through `AIEA_LOCAL_CREDENTIALS`. Credentials, tokens, TOTP secrets and temporary Auth records are omitted from this report/repository. Fixture preparation may commit synthetic rows in the disposable database; privileged positive/negative **probe** transactions roll back.

Both stacks were stopped using local `supabase stop --no-backup`. Final Docker inventories returned no project containers, project-labelled volumes or project network. Docker Desktop and cached images remain available; temporary scripts/evidence remain local and may expire.

## H. Exact validation inventory and counts

| Final post-correction native group | Executed | PASS | FAIL |
|---|---:|---:|---:|
| Accepted SQL named assertion inventory | 188 | 188 | 0 |
| Accepted Auth/TOTP/JWT/PostgREST/RLS inventory | 103 | 103 | 0 |
| Native privileges, ordinary OTP/replay, expired signed JWT | 38 | 38 | 0 |
| Unchanged checked-in SNV01 regression | 13 | 13 | 0 |
| New checked-in SNV03 regression | 100 | 100 | 0 |
| Controlled native concurrency | 22 | 22 | 0 |
| SERIALIZABLE conflict and fresh-transaction retry | 3 | 3 | 0 |
| **Total final native cases** | **467** | **467** | **0** |

Separate offline inventory: **188 PGlite SQL assertions PASS; 7 runner inventory self-tests PASS; Python regression syntax and Git whitespace checks PASS**. These are not added to the 467 native cases. All three corrected migrations applied cleanly in order, and native migration history contains precisely their three versions.

The new 100 cases comprise **22 contexts × 4 checks = 88**, plus **12 managed-state/native-transition checks**. Each context checks the staff predicate and actual retirement, publication and staff-management operations. Negative operations must raise `42501`; a successful unauthorized operation or a different error aborts the test. Positive operations must succeed. Counts describe test units, not independent attack classes.

Before-correction evidence includes two named prerequisite checks and the recorded failing security observation. They are not counted as passing post-correction regressions. Initial new-harness runs exposed a missing fixture transaction and a missing actor context for fixture revocation; those test-only errors were repaired, and incomplete runs are excluded. A preliminary 93-check completed run is also excluded in favor of the final expanded 100-check inventory.

The 103-case harness's fixture publication was adapted to use a genuinely verified current TOTP session. It no longer depends on synthetic JWT-only publication authority. Its original 103 checks/labels remain unchanged. The SQL fixture updates preserve all original assertion predicates, including malformed AAL/AMR checks evaluated with otherwise-valid managed sessions, so those denials remain independently meaningful.

## I. SNV03 before / after reproduction

| State / operation | Before correction | After correction |
|---|---|---|
| Genuine TOTP staff, current managed `aal2` | Publication succeeds | Predicate and all three guards succeed |
| Verified factor removed through native API | Successful; session becomes `aal1` | Successful; session becomes `aal1` |
| Old JWT following removal | JWT `aal2`; Auth `/user` HTTP 200 | JWT `aal2`, unexpired; Auth `/user` HTTP 200 |
| Predicate with that old JWT | **TRUE — failure** | **FALSE — required denial** |
| Guarded retirement with that old JWT | **UPDATE 1 accepted in rollback — failure** | **Denied `42501`** |
| Guarded publication / staff management after removal | Not part of the fresh before probe | **Both denied `42501`** |
| Independently fresh factor and distinct session, then removal | Previously reported failing condition | **Managed `aal1`; old JWT still accepted by Auth; all guards denied** |

Reproduction: provision an active synthetic adult and bounded operator-created staff grant; obtain an actual passwordless session; enroll/challenge/verify TOTP; publish fixture curriculum; remove the factor using Auth; retain the old JWT; check current managed state, Auth validation, the private predicate and each guarded operation under its verified end-user service context. Repeat with a newly issued session ID and newly verified factor. The checked-in regression contains this sequence.

It additionally proves that a downgraded old session remains denied while **another session of the same adult** has genuine current `aal2`. Assurance cannot be borrowed across sessions.

## J. Positive authorized-staff case

An active adult with active `CURRICULUM_PUBLISH` and `STAFF_MANAGE`, an actual Auth-verified TOTP factor and its current managed `aal2` session passed the predicate. Publication recorded the authenticated publisher in a committed synthetic fixture. Separate rolled-back probes successfully retired a published version, published a review-ready version and inserted a bounded staff grant. A fresh independent session/factor repeated these positive probes before its factor was removed.

No browser, broad workspace role, editable metadata, unsigned token or service-key-only context supplied this authority. The existing operator bootstrap remained explicit and attributable; it was not exposed or expanded.

## K. Negative, stale, revoked and aal1 cases

The final SNV03 regression denied the predicate and all three guarded operations for:

- ordinary adult with genuine TOTP and no staff grant;
- old `aal1` token after its session's TOTP upgrade;
- a separate staff session whose JWT and managed state are both only `aal1`;
- inactive or missing adult profile, and revoked staff authorization;
- elapsed managed-session `not_after`, explicit managed `aal1` downgrade, unverified bound factor, another adult's bound factor, or a bound factor of another type;
- missing, null, malformed, object-valued or another adult's session ID in the separately labelled SQL adversarial contexts;
- old genuine `aal2` after first factor removal, after independent factor/session removal, and after native local signout removes the managed session;
- the first downgraded session while a different genuine `aal2` session exists for the same adult.

Managed-state mutations other than actual enrollment/removal/signout are controlled, rolled-back test simulations. Real API removal/downgrade and native signout were also exercised directly; synthetic mutations do not substitute for those native lifecycle proofs. Successful valid staff cases establish that negative outcomes are not caused by universal denial or missing helper privileges.

## L. Existing accepted controls / migration regression

**All three migrations apply cleanly:** `20261006000100_portal_domains`, corrected `20261006000200_portal_security`, and unchanged `20261006000300_portal_guards`. Native SQL ran with `ON_ERROR_STOP=1`, exactly **188 unique labels matched the unchanged manifest**, and the fixture transaction ended in ROLLBACK. PGlite also passes the same 188 labels with its updated test-only managed schema.

The repeated 103 native cases retain family/school tenant isolation, assigned-teacher cohort privacy, exact published-version access, entitlement column restrictions, metadata forgery denial, membership/assignment/profile/staff revocation, real TOTP/AMR issuance, old-`aal1` denial, JWT tamper rejection, service audit-forgery denial and private-schema/helper exclusion. The 38-case group retains native role inheritance, helper ownership/search paths, browser mutation restrictions, ordinary email delivery/replay and correctly signed expired-JWT rejection.

SNV01's unchanged 13-check regression proves email provider enabled, existing-adult OTP request and local delivery, one-time verification, the exact active adult profile/session, replay denial and reason-specific denials: unknown adult `otp_disabled`, implicit/public signup `signup_disabled`, anonymous authentication `anonymous_provider_disabled`. These are Auth denials, not rate-limit responses. Global signup/anonymous settings and the configuration hash remain unchanged.

The 22 concurrency checks and 3 serialization checks passed again using separate native connections and observed lock waits: publication/content ordering in both directions, retirement/new entitlement, finalization/response, duplicate events under commit/rollback, refund/revocation versus reactivation, next-statement assignment revocation, `40001` conflict and successful fresh retry. Billing/event, evidence, localization, F01–F05 provenance/Boolean/inventory controls and tenant/version rules were not modified.

## M. Remaining findings

| ID | Status / severity | Disposition |
|---|---|---|
| SNV01 | **CLOSED — Human accepted** | Email configuration and regression unchanged; ordinary OTP/signup-denial regression PASS |
| SNV02 | **OPEN — NOTE** | Legacy `[inbucket]` deprecation warning remains; local mail works; no correction |
| SNV03 | **CLOSED — corrected and natively verified** | Current session/bound verified TOTP enforced; old JWT alone cannot satisfy privileged guards |
| SNV04 | **OPEN — NOTE** | Previously observed stale-refresh rejection without demonstrated current-chain cascade remains documented; refresh controls unchanged and that observation is not newly reclassified or claimed fixed |
| SNV05 | **OPEN — NOTE** | Native same-site redirect/path behavior remains documented; redirect configuration unchanged; no stricter callback guarantee claimed |
| SNV06 | **OPEN — NOTE** | Ordinary stateless PostgREST acceptance of an unexpired signed-out JWT remains documented; ordinary RLS/session behavior unchanged. The explicitly authorized privileged staff check now denies absent managed sessions |

**Open counts: BLOCKER 0; MAJOR 0; MINOR 0; NOTE 4.** No new implementation finding was identified. Original closed finding severities are not counted as open findings. No control or architecture was changed to conceal any native behavior NOTE. Full redirect/refresh-family observation groups were not rerun or counted in this SNV03 inventory.

## N. Remaining unverified boundaries

- Hosted environments, migration-owner differences, remote role/default privileges, custom hooks, signing-key configuration, schema upgrades and Auth versions other than those pinned here. Dependence on the inspected managed session/factor fields requires revalidation when the native stack changes.
- Future backend/endpoints must cryptographically validate tokens, establish the verified adult context, invoke the same bounded gate, validate targets and audit operations. No production authentication/claim-forwarding or support/export/privacy endpoint was built.
- Governed lost-factor/recovery/reenrollment procedures, administrative ban/deletion workflows, phone MFA authentication and WebAuthn. A rolled-back alternate factor-type denial is not a real phone enrollment test.
- Current assurance is evaluated against the database statement's visible managed state. Committed invalidation is enforced on subsequent READ COMMITTED statements. Already evaluated/in-flight statements are not retroactively cancelled. Exhaustive Auth-factor-removal versus privileged-write schedules, every isolation/lock order, sustained load and application retry orchestration are unverified.
- SNV04 refresh-family invalidation, SNV05 stricter callback policies, SNV06 immediate ordinary Data API signout revocation, long-running session policies and future vendor behavior remain limitations/gates as previously documented.
- Production SMTP, real customer onboarding, website callback/UI, Stripe/payment truth/webhooks/reconciliation, Blob/export integrations, operational bootstrap/recovery and approved deletion/retention workflows remain outside this task.

These limits do not reopen the demonstrated SNV03 correction or authorize a broader redesign. The local PASS applies to the defined corrected guard boundary and executed cases.

## O. Repository safety / status / evidence

The pre-task baseline covered **142** tracked/non-ignored untracked files. Exactly the four existing paths in Section D changed; the other **138** retain their exact bytes. The two new files are the regression and this report. The frozen artifact remains byte-identical to HEAD, SHA-256:

`f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755`.

| Required status | Result |
|---|---|
| Branch | `main` |
| HEAD / cached origin/main | `052101670dc92b38c7ec15c88a2b07572e42d75b` |
| Frozen architecture changed | **NO** |
| Sprint 01B begun | **NO** |
| Staged files | **NO**; index empty |
| Commits | **NO** |
| Pushes | **NO** |
| Deployments | **NO** |
| Hosted Supabase created/modified | **NO** |
| External providers modified | **NO** |
| Stripe / Postmark / Vercel / MailerLite modified | **NO** |
| Public website/runtime/dependencies changed | **NO** |
| SNV02 / SNV04 / SNV05 / SNV06 controls corrected | **NO** |
| Disposable services/data | Created locally, then removed; no remaining project container/volume/network |

The pre-existing `.gitignore` tracked modification remains the only tracked difference from HEAD. The earlier foundation and reports remain uncommitted; total untracked file inventory grows from **19 to 21**. All four modified foundation files were already untracked. There is no repository CLI linked-project state, embedded credential, new dependency or new application file. Local Git references/history/index support the repository status; external systems were not queried or changed.

Evidence root is the temporary root in Section G. Final checks matched every counted group and verified distinct SNV03/SNV01 PASS labels. Key hashes:

| Evidence / source | SHA-256 |
|---|---|
| `before-observation.json` | `b87d4812e08084552e1af391d86bf1a6b6b0b06d4b03286ba9f4072aee13d55f` |
| `foundation-native.log` | `45b6a17dfe6f86aa4225b7eccc925aab2edd13b6cde0ae60c2b9254332b44dc6` |
| `http-results.json` | `47bd7b1505e6e15d09f706fa428221eac993ddc2e84e24afbcd397d37876e8c8` |
| `extra-results.json` | `7e8d2c1ce28f1c2b6a6e87f27b7297406b16bdd435a3b69dfbeea9628916dc44` |
| `snv01-regression.log` | `7788b2da9cd2fe1f3a597c33c6cdce2c0ccc65a9de6b1f6acac73af9833b1e3e` |
| `snv03-final.log` | `4da079c7d2ce51ee76ec0d2690d03391facbad97ee275fd054493e33ff97a2b9` |
| `concurrency-results.json` | `f6c17427368f1508fc5da29faa72763f37779a436721b0beab514e50b38deb45` |
| `serialization-results.json` | `794eb7124e872a3b5e9b9ca6ac3ef5828787a970a7059f16dcd31196bd8bc78a` |
| Corrected security migration | `b5afa539f70e34b6c22080a582de22cc484d294b8f368e11e08c141f745184d4` |
| New SNV03 regression | `7e99c876e8b3fa2f38eb61399cf33af408a2c47b032006dd7084ebf3e494ee4d` |
| Unchanged accepted configuration | `f8d8632bca4cea518b2ec898863598064538734e215bd26774a0e63185c94281` |

The historical offline validator has a pre-existing fixed allowlist that predates the later authorized reports/tests. It was not altered or represented as passing the expanded file inventory. Direct baseline preservation, exact assertion matching, native tests and relevant syntax/whitespace checks establish this task's verification instead.

## P. Recommended next gate

**Human Authority review and acceptance of this bounded SNV03 correction and native revalidation**, including the current-state predicate, test-only fixture changes, remaining NOTES and explicit unverified boundaries. Independent review may be authorized before accepting the corrected uncommitted foundation.

Exact canonical report path:

`/Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_Sprint_01A_SNV03_Current_Assurance_Correction_and_Revalidation_v1.0.md`

**Work stops with this report.** No Sprint 01B, staging, commit, push, deployment, hosted Supabase work or external provider modification is authorized or begun.
