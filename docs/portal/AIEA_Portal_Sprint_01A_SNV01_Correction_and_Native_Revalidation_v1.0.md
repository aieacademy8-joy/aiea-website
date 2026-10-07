# AIEA Portal — Sprint 01A SNV01 Correction and Native Revalidation v1.0

Date: 2026-10-06  
Authority: Human authorization to correct SNV01 only and repeat isolated local Supabase-native validation.  
Accepted findings: [Supabase-Native Validation Report v1.0](AIEA_Portal_Sprint_01A_Supabase_Native_Validation_Report_v1.0.md).  
Governing authority: [P0 Architecture and Data Contract v1.0 — FROZEN](AIEA_Portal_P0_Architecture_and_Data_Contract_v1.0_FROZEN.md).

## A. Decision and scope

**SNV01: CORRECTED AND VERIFIED. Overall native gate: FAIL — new MAJOR finding SNV03 requires Human review.**

The one-line correction enables ordinary existing-adult passwordless email authentication while retaining disabled global signup and anonymous authentication. Local email delivery, token verification, valid adult sessions, replay denial, token expiry, and explicit signup-denial responses were demonstrated. All three migrations applied cleanly, all 188 accepted SQL assertions passed, and the original 103 Auth/PostgREST/TOTP checks remained passing.

The newly authorized deeper session tests found that removing a verified TOTP factor downgrades the managed Auth session to `aal1`, but its old, unexpired `aal2` JWT remains accepted by Auth and by the database staff predicate. A guarded curriculum retirement also succeeded with those stale assurance claims inside a **rolled-back** disposable transaction. This is SNV03, not a failure of the email-provider correction. No correction to SNV03 or any other control was made.

Open findings: **0 BLOCKER, 1 MAJOR, 0 MINOR, 4 NOTE**. SNV01 is closed in this correction pass. SNV02 remains unchanged and documented only. Human acceptance of this report is not presumed, and Sprint 01B has not begun.

## B. Exact repository changes

| File | Change |
|---|---|
| `supabase/config.toml:37` | Changed `[auth.email].enable_signup` from `false` to `true`; exactly one configuration line changed |
| `supabase/tests/auth-otp.native.py` | Added a narrowly scoped, 13-check local SNV01 regression |
| `docs/portal/AIEA_Portal_Sprint_01A_SNV01_Correction_and_Native_Revalidation_v1.0.md` | Created this canonical correction/revalidation report |

Exact configuration correction:

```diff
 [auth.email]
-enable_signup = false
+enable_signup = true
 enable_confirmations = true
```

The distinct global settings remain unchanged:

```toml
[auth]
enable_signup = false
enable_anonymous_sign_ins = false
```

`[inbucket]` remains byte-for-byte unchanged. No migration, existing SQL assertion, assertion manifest, earlier report, application runtime, dependency manifest, or frozen architecture file changed.

The new regression uses only an explicit loopback Auth/Data API URL and local Mailpit, a local publishable key supplied through the environment, and a pre-existing synthetic `@example.invalid` adult fixture. It checks that the resulting session resolves to that exact active, adult-confirmed profile. It contains no embedded credential, administrator key, hosted endpoint, provider integration, or runtime implementation. Its denied-signup assertions exclude rate-limiting responses and require an Auth error code.

## C. Security boundaries preserved and native environment

The correction changed email-provider availability only. Global public signup and anonymous authentication remain disabled. Unknown-user requests did not create an Auth identity. The fixtures explicitly represent adults; learner references received no Auth identity. Tenant, cohort, exact-version entitlement, staff capabilities, TOTP predicates, publication, billing/event, evidence, and audit implementation bytes were preserved.

Preserving those implementation bytes is not a claim that every native session guarantee is correct: SNV03 reveals an existing current-assurance gap that the former synthetic JWT tests could not exercise. No assurance boundary was intentionally weakened to obtain a passing result.

| Component | Actual environment |
|---|---|
| Isolation | Disposable **LOCAL** Supabase; no remote project/login/link/push |
| CLI | Official Supabase **2.120.0**, macOS ARM64, reused temporary verified binary |
| CLI archive SHA-256 | `3b8546cc61aeabab6fd1f68edc7f664ebdfa96bdd6a9b18d8d612708f430ae28` |
| Host | macOS **26.6.2**, build **25G83**, Apple ARM64 |
| Runtime | Docker Desktop **4.94.0** build **241994**; Docker client/server **29.8.2** |
| PostgreSQL | **15.19**, image `public.ecr.aws/supabase/postgres:15.19.0.004` |
| Auth | `public.ecr.aws/supabase/gotrue:v2.197.0` |
| PostgREST | `public.ecr.aws/supabase/postgrest:v16.4` |
| Gateway | `public.ecr.aws/supabase/kong:2.8.1` |
| Local mail | `public.ecr.aws/supabase/mailpit:v1.31.3`, legacy `inbucket` configuration/name retained |
| Local endpoints | API `127.0.0.1:54321`, DB `54322`, Mailpit `54324`; no website callback runtime launched |
| Main temporary project | `/var/folders/v7/9s2qngr52z798fdlhklzlhx40000gn/T/aiea-snv01-mac4mjuv/project` |
| Final regression project | Same temporary root, `regression-project`; started only after the main stack/data were removed |

Only PostgreSQL, Auth, PostgREST, gateway, and local mail services ran. Realtime, Storage, Studio, database metadata API, Edge Runtime, analytics/log collection, image proxy, and pooler services were excluded. The corrected scaffold was copied to each temporary project without further configuration changes.

The main run provisioned five synthetic adult identities and reused the accepted fixture setup with their actual managed Auth IDs. One ordinary adult received an operator-created local staff capability solely for the later concurrency and factor-removal tests, after the original ordinary-adult/no-staff test had passed. The second clean stack provisioned one synthetic adult solely to retest the final checked-in SNV01 regression and inspect actual denial codes.

No real email address, customer account, production SMTP, hosted Supabase project, or external provider was used. Local credentials, JWTs, refresh tokens, and TOTP secrets remained outside the repository and are omitted here.

Both disposable stacks were stopped with `supabase stop --no-backup`. Final Docker inventories showed no project containers, project-labelled volumes, or project network. Local downloaded images, the temporary CLI/evidence, and Docker Desktop remain available.

## D. Migration and accepted regression results

**PASS.** All three migrations applied to a clean local managed database in both starts:

| Migration | Result |
|---|---|
| `20261006000100_portal_domains.sql` | Applied cleanly |
| `20261006000200_portal_security.sql` | Applied cleanly |
| `20261006000300_portal_guards.sql` | Applied cleanly |

The main run executed `foundation.sql` using native container `psql`, `ON_ERROR_STOP=1`, against the actual Supabase Auth schema. **188 unique PASS labels exactly matched `assertions.json`; the transaction ended in ROLLBACK.** No assertion was deleted, relabelled, bypassed, or changed. The PGlite bootstrap was not used.

The 28-table inventory, native RLS, browser/service privilege restrictions, publication/localization guards, immutable finalized learning/evidence, staff provenance, exact-version/billing relationships, refund/dispute consistency, and event-ledger protections continued to pass the accepted SQL cases.

The original **103 native Auth/PostgREST/TOTP checks passed again**, and **38 additional native privilege/ordinary-OTP/expired-JWT checks passed**. The final repository SNV01 regression passed all **13** checks on the second clean stack; three fixture/identity-count checks also passed there.

Final measured inventory:

| Group | Cases | Met expectation / observed as recorded | Failed expectation |
|---|---:|---:|---:|
| Accepted native SQL inventory | 188 | 188 | 0 |
| Repeated Auth/PostgREST/TOTP/JWT/RLS inventory | 103 | 103 | 0 |
| Privileges, ordinary OTP, replay, expired JWT | 38 | 38 | 0 |
| Final checked-in SNV01 regression | 13 | 13 | 0 |
| Final clean-stack setup and no-created-unknown-user checks | 3 | 3 | 0 |
| Redirect checks/observations | 12 | 12 | 0 |
| Email expiry and refresh rotation/reuse | 8 | 7 | 1 |
| Signout checks/observations | 5 | 5 | 0 |
| Independent refresh/factor-removal checks/observations | 9 | 9 | 0 |
| Independent current-assurance reproduction | 6 | 5 | 1 |
| Controlled native concurrency | 22 | 22 | 0 |
| SERIALIZABLE conflict and retry | 3 | 3 | 0 |
| **Total final cases** | **410** | **408** | **2** |

The two failed expectations are the refresh-chain cascade expectation described in SNV04 and the current managed-assurance requirement in SNV03. Passing observation checks that reproduce a limitation do not close that finding. This count excludes duplicate/debugging runs, setup commands, migration statements, and unexecuted tests; it is not a claim of 410 independent attacks.

The redirect group includes an observed same-site path acceptance, explained by pinned upstream Auth source in SNV05. An initial stricter path-only assumption was corrected in the temporary harness after inspection of that source; the repository configuration was not changed. A temporary signout script also initially omitted a helper function; it was repaired outside the repository before its final five-case run. Neither harness issue is concealed as a product correction.

## E. Ordinary adult OTP, denied signup, replay, expiry, and redirects

**SNV01 ordinary flow: PASS.**

1. The effective Auth settings reported `external.email=true`, `disable_signup=true`, and `external.anonymous_users=false`.
2. An existing confirmed adult's `POST /auth/v1/otp` with `create_user=false` returned HTTP 200.
3. Mailpit captured the email for that exact synthetic adult. The link targeted the local Auth API.
4. `/auth/v1/verify` accepted the emailed one-time token and issued a signed non-anonymous adult session. `/auth/v1/user` validated the exact identity, and PostgREST returned its pre-existing active, adult-confirmed profile under RLS.
5. Reusing the consumed token was denied. A separately tested link consumed through GET could not subsequently be replayed through POST.

The default Supabase email template delivers a magic link for the ordinary email OTP request. Verification used the emailed one-time token hash through the native verify endpoint; this does not claim that a six-digit code template/UI was implemented. Supabase documents the shared [passwordless email/magic-link/OTP flow](https://supabase.com/docs/guides/auth/auth-email-passwordless).

Final reason-specific denial evidence:

| Attempt | Native result |
|---|---|
| Unknown email, `create_user=false` | Denied: `otp_disabled` |
| Unknown email, `create_user=true` | Denied: `signup_disabled` |
| Public email/password signup | Denied: `signup_disabled` |
| Anonymous signup/sign-in | Denied: `anonymous_provider_disabled` |

These were Auth 4xx rejections other than 429, with no access token. The final clean database still contained **exactly the one pre-provisioned adult** after all unknown/public/anonymous attempts. No unknown or child identity was created.

**Expiry: tested.** The unchanged native email-token expiry was 3600 seconds. A synthetic ordinary magic-link token's managed `auth.users.recovery_sent_at` was backdated by two hours in the disposable fixture; verification returned HTTP 403 / `otp_expired`. This exercises the native expiry comparison without waiting an hour or changing the expiry configuration. A correctly signed, already-expired local JWT was separately rejected by PostgREST with HTTP 401.

**Redirects: tested with the native limitations recorded.** The explicit callback `http://localhost:4321/portal/auth/callback` was preserved in the delivered link; GET verification returned a redirect to that callback and a signed-session fragment. The test captured the redirect without following it or launching a website. An unallowlisted external destination fell back to `http://localhost:4321`. A path suffix on the configured site origin was accepted by Supabase's built-in site-origin rule; see SNV05. No exact-path-only guarantee is asserted.

## F. Auth/PostgREST/TOTP/RLS and privilege revalidation

The repeated 103-case run demonstrated real Auth-issued `aal1` sessions, actual TOTP enrollment/challenge/verification and `aal2` AMR, refresh after untrusted metadata edits, JWT tamper/malformed-token rejection, and these Portal boundaries:

- Family owner: own family and one family learner.
- Teacher: assigned school/cohort and one assigned learner; other cohort and workspace excluded.
- School administrator: own school's two learners; other workspace excluded.
- Unaffiliated adult: no workspace, learner, or entitled curriculum.
- Staff without tenant membership: no broad browser tenant access.
- Active exact-version entitlement only: other version excluded; suspension removes curriculum/learner access with the same signed token.
- Teacher assignment, membership, adult-profile, and staff-row revocation: effective on the next tested request/predicate evaluation.
- Ordinary adult TOTP alone: no staff authority; old `aal1` token: no staff authority; real `aal2` plus active bounded staff capability: passes before factor removal.
- Anonymous reads, browser writes, billing/event/staff/audit reads, billing-correlation column reads, and service audit forgery: denied as before.

PostgREST still exposed **only `portal`**. `portal_private`, `auth`, and `public` profile requests returned 406 / `PGRST106` for anonymous, adult, and service callers; private helper RPC lookup returned 404 / `PGRST202`. The extra search path did not expose those schemas. Native role inheritance, RLS-bypass attributes, helper ownership/empty search paths, and no API-role TRUNCATE/TRIGGER/REFERENCES/audit-DML privileges remained passing.

The original successful staff checks establish claim/capability/row-revocation behavior. They do not resolve SNV03's newly tested live-factor/session-assurance mismatch. SQL backend tests forwarded claims only from local Auth-issued tokens that Auth accepted; no production backend or endpoint was implemented.

## G. Remaining local session and concurrency checks executed

### Sessions

- Email-token expiry, correct allowed callback, external redirect fallback, consumed-token replay, and expired signed JWT rejection were tested as described above.
- Refresh rotation produced distinct tokens. A stale non-parent token was rejected after exceeding the unchanged ten-second reuse interval. Contrary to the tested cascade expectation, the current token still refreshed successfully; this reproduced independently on another adult after three rotations and a twelve-second wait (SNV04).
- Local signout returned 204, removed the managed `auth.sessions` row, denied refresh, and caused `/auth/v1/user` to reject that signed-out session. The unexpired access token still passed stateless PostgREST signature/RLS validation (SNV06).
- Removing a verified TOTP factor succeeded and downgraded the managed session to `aal1`; an old `aal2` JWT still passed Auth and the staff predicate. Fresh enrollment/verification/removal reproduced the result independently, including an accepted guarded operation in rollback (SNV03).

### Concurrent transactions

These cases used separate native `psql` sessions, observed actual `pg_stat_activity` lock waits, released the first transaction deliberately, and checked the second transaction's outcome. They did not approximate concurrency with sequential savepoints.

| Interleaving | Observed result |
|---|---|
| Publication first, localized child edit second | Edit waited, then failed `23514`; published text retained |
| Localized child edit first, publication second | Publication waited, then succeeded with the committed localized tree |
| Retirement first, new entitlement second | Insert waited, then failed `23514`; no new entitlement |
| Assessment finalization first, response insert second | Insert waited, then failed `23514`; no post-finalization response |
| Duplicate event, first transaction commits | Waiter failed `23505`; exactly one event row |
| Duplicate event, first transaction rolls back | Waiter succeeded; exactly one event row |
| Atomic full refund/revocation first, reactivation second | Reactivation waited, then failed `23514`; final billing/access state consistent |
| Assignment revoked between READ COMMITTED statements | The next authorization statement saw the committed revocation |
| SERIALIZABLE billing conflict | Waiter failed `40001`; a fresh authorized retry succeeded with a consistent final state |

The concurrency group contains 22 checks, plus three SERIALIZABLE/retry checks. In-flight statements that already evaluated authorization under an earlier snapshot were not claimed to be retroactively cancelled by revocation. Exhaustive schedules, all isolation levels, deadlocks under every lock order, and full application-level retry orchestration remain unverified.

## H. Findings and required next decisions

| ID | Status / severity | Evidence and impact | Required action |
|---|---|---|---|
| SNV01 | **CLOSED — corrected and verified** | Existing-adult email provider was disabled. The authorized one-line correction now permits ordinary local delivery and verification while signup/anonymous boundaries remain denied. | Human review of this correction and evidence; no further SNV01 implementation change proposed. |
| SNV02 | **OPEN — NOTE** | `[inbucket]` deprecation warning remains on startup/stop; Mailpit works. `supabase/config.toml:22–24` unchanged. | Document only; no correction authorized or performed. |
| **SNV03** | **OPEN — MAJOR** | After TOTP removal, managed session `aal1`, zero verified TOTP factors, old JWT `aal2`, Auth `/user` HTTP 200, `staff_has('CURRICULUM_PUBLISH')=true`; existing retirement guard accepted UPDATE 1 in rollback. Affects `supabase/migrations/20261006000200_portal_security.sql:58–63` and its privileged guard callers, including retirement in `20261006000300_portal_guards.sql:65`. | Separately authorize a bounded current-session assurance correction and regressions. Before privileged operations, confirm the JWT's session belongs to the adult and is still managed `aal2` with the required verified TOTP factor; validating the old JWT through `/user` alone was insufficient here. Exact implementation needs separate review/authorization. No migration/helper was changed. |
| SNV04 | **OPEN — NOTE** | Stale non-parent refresh reuse returned 400 / `refresh_token_already_used`, but the current refresh token subsequently returned 200 and a new access token. Rotation enabled; reuse interval ten seconds. Independently reproduced on two adults beyond the interval. | Treat session-family cascade revocation as unverified/unsupported in the observed native version; investigate upstream behavior before relying on it. Do not claim the chain was revoked. No repository correction authorized or made. |
| SNV05 | **OPEN — NOTE** | Exact callback worked and an external destination was refused/fell back, but same-site callback suffix was accepted. Pinned Auth source permits matching site scheme/host independent of path and gives loopback ports additional flexibility. | Human review of the native redirect boundary; any future stricter callback validation must be separately authorized. No redirect configuration changed. |
| SNV06 | **OPEN — NOTE** | After signout, managed session and refresh authorization disappeared, while the unexpired JWT still read the family's learner through PostgREST. This is documented stateless JWT behavior. | Do not rely on signout alone for immediate Data API revocation. Existing Portal membership/staff/entitlement row revocation continues to work. Future sensitive-operation session validation requires separate authorization. |

**Open counts: BLOCKER 0; MAJOR 1; MINOR 0; NOTE 4.** SNV03 prevents an overall native PASS. Its impact is a privileged database/backend authorization gap, not a demonstrated anonymous/browser RPC exploit: private staff helpers remain unexposed and the reproduction used a trusted local service transaction. No customer-facing Portal runtime currently exists.

### SNV03 reproducible sequence

1. Start the corrected scaffold locally and apply its unchanged migrations. Provision a synthetic confirmed adult, active adult profile, and operator-created bounded `CURRICULUM_PUBLISH` staff authorization in the disposable database.
2. Use genuine Auth TOTP enrollment/challenge/verification. Confirm both the JWT and its `session_id` row in `auth.sessions` report `aal2`.
3. DELETE that verified factor through `/auth/v1/factors/<factor-id>` with the real session. Observe success, no remaining verified TOTP factor for the adult, and managed session `aal1`.
4. Reuse the old, unexpired `aal2` JWT. `/auth/v1/user` still returns 200. Supply its Auth-accepted claims to a local service transaction, as in the native backend-context tests.
5. `portal_private.staff_has('CURRICULUM_PUBLISH')` returns true. Updating a synthetic published version to RETIRED succeeds with UPDATE 1; rollback that transaction. Expected current-assurance denial does not occur.
6. Repeat with a newly enrolled and verified factor: same result. Preserve the failure; do not modify the helper, guard, Auth configuration, or frozen authority to mask it.

The source of the gap is that the current predicate checks JWT `aal`/TOTP AMR and the active staff row, but does not check the current managed session/factor state. This report does not redefine the frozen requirement that privileged staff operate with current TOTP-backed `aal2` assurance.

Relevant primary evidence: [pinned Auth v2.197.0 redirect validation source](https://github.com/supabase/auth/blob/v2.197.0/internal/utilities/request.go#L89), [Supabase session/signout and refresh-reuse documentation](https://supabase.com/docs/guides/auth/sessions), and [redirect configuration documentation](https://supabase.com/docs/guides/auth/redirect-urls). SNV04's observed lack of cascade differs from the session documentation's general description; no upstream root cause or fix is asserted. SNV03 is established by the local reproduction rather than inferred solely from documentation.

## I. Remaining unverified boundaries

- SNV03 correction and proof of denial after factor removal, session downgrade/termination, and other stale-assurance transitions. No such correction was authorized in this pass.
- Refresh-family invalidation beyond the measured SNV04 behavior, including vendor-version differences and long-running session policy enforcement.
- Governed lost-factor recovery, administrative recovery/re-enrollment policy, phone MFA (disabled), and future privileged HTTP endpoints.
- Exhaustive concurrency schedules, reverse-order variants not listed above, application-level idempotency/retry handling, sustained load, and operational crash recovery.
- Hosted Supabase role/default privilege/configuration differences, custom JWT hooks/signing keys, remote migration ownership, and versions other than those tested.
- Numeric-code email template/UI, website callback implementation, production email deliverability, customer onboarding, privacy/deletion/export workflows, and production operational controls.
- Real Stripe checkout/payment truth, signed webhooks, provider reconciliation, notifications/retries, Blob exports, and every other external integration or deferred feature.

These remain outside this report's passing claims. No hosted project, production SMTP, real Stripe interaction, or website runtime was used to fill those gaps.

## J. Evidence, repository status, and next gate

Temporary evidence root:

```text
/var/folders/v7/9s2qngr52z798fdlhklzlhx40000gn/T/aiea-snv01-mac4mjuv
```

The main evidence includes `foundation-native.log`, JSON inventories for each group in Section D, `snv01-regression-final.log`, `factor-reproduction-observation.json`, temporary scripts, and local startup/stop logs. These may expire with temporary storage; the canonical report and checked-in SNV01 regression carry the reviewable result. Tokens/keys/TOTP material are not copied into this report or the repository.

| Evidence | SHA-256 |
|---|---|
| Native 188-assertion log | `ff67f735585147ddff5cc56c5385c3be5a8fe3d0773b821718fedc294ff7c524` |
| Repeated 103-case inventory | `47bd7b1505e6e15d09f706fa428221eac993ddc2e84e24afbcd397d37876e8c8` |
| Final SNV01 regression log | `7788b2da9cd2fe1f3a597c33c6cdce2c0ccc65a9de6b1f6acac73af9833b1e3e` |
| Independent SNV03 operation observation | `0e94ba083419543c7085643c6df8c708cb9b50fa823ec48fa256507ce14a322d` |
| Native concurrency inventory | `f6c17427368f1508fc5da29faa72763f37779a436721b0beab514e50b38deb45` |
| SERIALIZABLE/retry inventory | `794eb7124e872a3b5e9b9ca6ac3ef5828787a970a7059f16dcd31196bd8bc78a` |

Corrected configuration SHA-256: `f8d8632bca4cea518b2ec898863598064538734e215bd26774a0e63185c94281`.  
New regression SHA-256: `31d2b963bf6477a0636ab0b3fd74c811c1602d1cdc51127ba7de82ee668e7f19`.

The pre-task baseline covered **140** existing tracked/non-ignored untracked files. Only `supabase/config.toml` changed, by the single authorized line. The other **139** retain their exact bytes, including the frozen architecture and previous accepted validation report. Exactly two repository files were added: the new regression and this report. The original offline validator's historical allowlist was not edited or represented as passing the newer authorized report/test paths; preservation was checked directly against the baseline.

Frozen architecture SHA-256 remains `f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755`, byte-identical to frozen commit `052101670dc92b38c7ec15c88a2b07572e42d75b`.

| Required safety/status item | Result |
|---|---|
| Frozen architecture preserved | **YES** |
| Branch | `main` |
| HEAD / locally cached `origin/main` | `052101670dc92b38c7ec15c88a2b07572e42d75b` |
| Staged files | **NO** |
| Commits | **NO** |
| Pushes | **NO** |
| Deployments | **NO** |
| External providers modified | **NO** |
| Hosted project created/modified | **NO** |
| Public website/runtime changed | **NO** |
| SNV02 corrected | **NO** |
| Sprint 01B begun | **NO** |
| Disposable local services/data | Created for validation, then removed |

Final short status retains the earlier uncommitted foundation and adds only the authorized new files:

```text
## main...origin/main
 M .gitignore
?? .env.example
?? docs/portal/AIEA_Portal_Sprint_01A_Correction_Report_v1.0.md
?? docs/portal/AIEA_Portal_Sprint_01A_Implementation_Foundation_Report_v1.0.md
?? docs/portal/AIEA_Portal_Sprint_01A_Independent_Audit_Handoff_v1.0.md
?? docs/portal/AIEA_Portal_Sprint_01A_Independent_Reaudit_v1.0.md
?? docs/portal/AIEA_Portal_Sprint_01A_SNV01_Correction_and_Native_Revalidation_v1.0.md
?? docs/portal/AIEA_Portal_Sprint_01A_Supabase_Native_Validation_Report_v1.0.md
?? portal/
?? scripts/
?? supabase/
```

There are 19 untracked files versus 17 before this pass, and the same pre-existing tracked `.gitignore` modification. The corrected configuration was already untracked and therefore remains inside the `supabase/` status group. The index is empty. No CLI linked-project state was written inside the repository.

Exact canonical report path:

```text
/Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_Sprint_01A_SNV01_Correction_and_Native_Revalidation_v1.0.md
```

**Recommended next gate: Human Authority review of SNV01 closure and the new SNV03 finding, followed only by a separately authorized, bounded current-session/TOTP assurance correction and native revalidation.** Review SNV04–SNV06 as native limitations before any runtime/launch authorization. Leave SNV02 documented unless separately authorized. Do not begin Sprint 01B, stage, commit, push, deploy, or modify any external provider. Work stops with this report.
