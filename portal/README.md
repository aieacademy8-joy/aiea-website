# Portal runtime — Sprint 01B

The website remains static HTML/CSS/JavaScript with CommonJS Node serverless
functions. Sprint 01B adds the bounded existing-adult entry runtime authorized in
[the implementation plan](../docs/portal/AIEA_Portal_Sprint_01B_Implementation_Plan_v1.0.md).
No framework, bundler or Supabase SDK was added. Hosted setup is not performed.

Database code lives in `supabase/migrations`; executable database cases live in
`supabase/tests`; offline repository validation lives in `scripts/portal`.
The `portal` PostgreSQL schema is the future API boundary. `portal_private` is
never an exposed Data API schema. Existing download checkout is independent.

## Runtime boundary

`/portal/login.html` requests/verifies a six-digit email OTP. `/portal` and
`/portal/` rewrite to the protected `/api/portal/index` handler. Both the entry
and `/api/portal/context` validate Auth and an active adult-confirmed profile.
`/api/portal/auth` accepts only POST request/verify/signout actions with strict
same-origin JSON input. Unknown-account requests have a generic response;
provider/rate failures remain failures. Implicit user creation is always disabled.

The runtime reads `PORTAL_SUPABASE_URL`, `PORTAL_SUPABASE_PUBLISHABLE_KEY` (modern
`sb_publishable_` key), and `PORTAL_ORIGIN`. Only configured HTTPS is allowed,
except explicit loopback HTTP for disposable local development. Configuration
comes from environment management, never static source substitution or browser
input. The service secret is not consumed. Do not set up hosted values in 01B.

Only the access JWT goes in a host-only HttpOnly, SameSite=Lax cookie; HTTPS uses
Secure and the `__Host-` prefix. Local loopback HTTP uses a distinct cookie name.
The cookie expires no later than the JWT. Refresh tokens are discarded, with no
persistent session/refresh UX. No access/refresh token enters browser JavaScript,
URLs, API JSON, localStorage, sessionStorage or logs. Numeric codes necessarily
pass transiently through the form/request; they are never persisted or logged.

Every private request checks expected issuer/audience/role/expiry and validates
the JWT through the configured Auth `/user` endpoint; decoding alone is never
authentication. Reads forward the adult JWT to `portal` PostgREST under existing
RLS. Context lists only that adult's active memberships in active workspaces,
validates the selected workspace anew, and projects permitted status fields.
Zero workspaces is a valid empty state; one auto-selects; multiple require a choice.
Selection is not stored as authority. Results are bounded to 100; overflow fails
closed rather than silently dropping authorized context. No private response is
cached. No request-specific Auth client or identity is shared between requests.

No account/profile/workspace/membership provisioning, role/cohort/learner operation,
domain write, curriculum delivery, entitlement grant, staff path, or checkout is
implemented. ACTIVE summaries do not enable content delivery or satisfy the frozen
commerce gates. No Session ID/PDF/HMAC token authorizes Portal access.

## Session end and accepted limitations

Current-session signout clears the cookie and calls Auth local-scope logout.
After the bounded audit correction, upstream failure clears active access but
preserves a distinct HttpOnly logout-retry cookie until JWT expiry. The retry
cookie never grants Portal access; private handlers refuse pending signout.
Repeated failure remains failure, and new sign-in is blocked until logout
completes or the retry credential expires. Reload routes to a retry control.
Successful Auth revocation clears both cookie slots. If the request cannot reach the server, the UI clears its private view
and asks the adult to retry; it does not claim successful signout. The UI clears
private DOM state during switching, hiding/navigation, failures and expiry, and
rejects superseded asynchronous responses. Native server expiry remains decisive.

Cross-window coordination uses BroadcastChannel signals containing no identity or
credential. Signout initiation clears other views; completion or verification
outcome triggers fresh authorization. Focus restoration clears and revalidates;
blur clears private state. After A05 correction, one remote coordination episode
has a non-renewable ten-second pause measured from its first pending signal with
a monotonic clock. Repeated/stale pending keeps private state cleared but cannot
move that deadline or cancel its recovery read. The episode includes the fresh
validation until its response completes; later replays can start another bounded
episode, never a sliding lease. Expiry triggers a fresh
context request when visible; hidden views stay empty until restoration. Focus
and visibility check the elapsed deadline even if background timers were deferred.
The 30-second revalidation fallback runs with and without BroadcastChannel;
it does not cancel an already-active coordination recovery read.
Neither focus nor periodic checks extend a pending deadline. Recovery discards
selected workspace and never redisplays cached private data. Server authorization,
including A01 pending-logout quarantine, and native RLS remain authoritative.

A previously copied bearer credential is subject to native Auth until revocation
actually succeeds; the browser keeps no active access cookie while retry is
pending. Restoring the old access cookie beside the pending cookie is refused;
after successful native revocation, replay of the original cookie alone is
refused. No distributed revocation store or refresh persistence was introduced.

All four inherited accepted OPEN NOTES are unchanged: SNV02 deprecated inbucket; SNV04
refresh-chain cascade unproven; SNV05 no exact-path-only native callback guarantee;
SNV06 unexpired signed-out JWTs may remain usable through ordinary stateless Data
API/RLS. This application checks Auth on requests; it does not change the Data API
or fix/reclassify a NOTE. The accepted live-session/bound-TOTP staff gate is untouched.
01B-A03 remains an additional OPEN NOTE: local routing tests do not establish
hosted Vercel rewrite/CDN/HTTPS-cookie behavior. Five NOTES remain open.

## Local validation (separately authorized disposable infrastructure only)

- `node --test scripts/portal/test-runtime.mjs`: mocked upstream adversarial
  handler contracts, not native Auth proof.
- `node --test scripts/portal/test-coordination.mjs`: executes the actual client
  with deterministic DOM/clock and mocked context replies. Covers lost completion,
  timer/focus/visibility recovery, stale-response cancellation and server quarantine.
  A05 cases sustain repeated pending through two episodes and held responses,
  including periodic work. The old renewal assertion was replaced by the required
  non-renewable initial-deadline assertion; original evidence is preserved.
  `AIEA_PORTAL_CLIENT_SOURCE` optionally selects a saved pre-correction source file for a
  negative control. It is a test-runner input, never a production configuration.
- `node scripts/portal/serve-local.mjs`: loopback-only test adapter using the
  three runtime environment variables. It exercises checked-in rewrite/header
  definitions; it is not a Vercel deployment or full platform emulator.
- Run unchanged 01A SQL, SNV01 and SNV03 regressions against the accepted local
  config first. Preserve their sources/evidence and assertion inventory.
- For numeric tests, copy Supabase to a disposable directory and append only:

  ```toml
  [auth.email.template.magic_link]
  subject = "Your AIEA sign-in code"
  content_path = "./supabase/templates/adult-email-otp.html"
  ```

  Keep the repository `supabase/config.toml` unchanged. Apply the three unchanged
  migrations to a clean disposable local stack, capture CLI JSON privately, and
  set `AIEA_LOCAL_CREDENTIALS` to that file. With the application adapter running,
  run `python3 supabase/tests/portal-entry.native.py --setup`, then the same script
  without `--setup`. Setup creates synthetic `@example.invalid` adults and accepted
  fixture data, including genuine TOTP for test curriculum publication. Fixture
  tokens/claims never supply production runtime authority. The expiry test ages a
  synthetic managed email timestamp; it does not alter configured OTP lifetime.
- `node scripts/portal/test-browser.mjs`: uses `AIEA_LOCAL_CREDENTIALS`,
  `AIEA_PLAYWRIGHT_MODULE` (installed Playwright path), and optionally
  `AIEA_CHROME_PATH`. Exercises the untouched synthetic adult 8 after setup, blocks
  external browser requests, saves screenshots/results only beside private test
  credentials. Client expiry-clock simulation is separate from native expiry proof.

- After stopping the ordinary local adapter, run
  `node scripts/portal/test-audit-browser.mjs` with the same private credential
  and installed Playwright environment variables. It starts/stops an exclusive
  loopback adapter, injects only upstream logout failures through a temporary
  test-process fetch hook, and exercises eventual real native revocation and
  two real browser pages with shared cookies. Fresh synthetic adults 11–15 are
  provisioned only by disposable `--setup`. A held context response proves stale
  state clearing before new data may render. The independent focus regression
  disables BroadcastChannel in one page and delivers its focus event explicitly
  because headless targets may remain focused. No production test endpoint or
  fault option exists in the runtime. The test removes its hook/flag/server/browser.
- With the ordinary adapter stopped, run `node scripts/portal/test-pending-browser.mjs`
  with the same private credentials/installed Playwright environment. It starts an
  exclusive loopback adapter, uses existing synthetic adults 2/3 and native fixture
  numeric codes, and tests an actual sender closing without completion. It holds
  the receiver's response to prove clearing before current-adult rendering. Focus,
  timeout and hidden/visibility sequences use the browser clock; visibility/focus
  events are explicitly delivered in headless Chrome. Native Auth/context remain
  real. Optional `AIEA_PORTAL_CLIENT_SOURCE` serves saved pre-A04 code only to the
  receiver for a negative control; the same recovery assertion must then fail.
  Fixture code generation is not new mail-delivery evidence. Server/browser cleanup
  runs in `finally`; results are saved only beside private temporary credentials.
- `node scripts/portal/test-replayed-pending-browser.mjs` uses the same private
  environment with no ordinary adapter running. Two real pages sustain one-second
  pending signals for 80 seconds of browser time across two coordination episodes.
  Actual native context responses are held unchanged to prove clearing until
  authorization completes and continued replay cannot cancel recovery. Optional
  `AIEA_PORTAL_CLIENT_SOURCE` selects saved pre-A05 receiver code for the negative
  control, which must fail exactly on the missing first recovery request. It uses
  existing synthetic adults and native fixture codes, not new mail-delivery proof.
  The exclusive loopback adapter/browser close in `finally`; no production test
  endpoint or provider change is introduced.

These native fixtures are for a clean disposable stack only, never production.
Stop/remove local stack volumes with local CLI `stop --no-backup` afterward, stop
the test server/browser, and verify cleanup. No hosted CLI link/push/configuration.
Production numeric template/SMTP, approved origins, abuse controls, hosted assurance,
real adult provisioning, and broader launch remain separate Human Authority gates.

## Sprint 01C — published curriculum reads

Sprint 01C extends the protected document with My Programs → exact program
version → ordered mission list → mission text. The earlier sections describe the
accepted Sprint 01B baseline; curriculum reads are the separately authorized 01C
addition. No domain write, Level model, activity/completion/evidence control,
content_blocks renderer, resource delivery or publishing tooling is added.

`GET /api/portal/curriculum` requires `workspace_id`, accepts optional
`program_version_id` and then `mission_id`, and accepts a single bounded `locale`
(omitted means the UI's `en-US`). Mission requires version. Other/duplicate or
malformed parameters are rejected. Requests reuse accepted Auth, profile and
pending-signout checks. Read-only aggregation forwards the adult JWT under
existing RLS. Because curriculum RLS authorizes a union of workspaces, each
response is additionally restricted to the selected workspace's ACTIVE exact
entitlements, with Auth/workspace/entitlement revalidation before success.
PUBLISHED and previously entitled RETIRED versions remain accessible; duplicate
billing bases do not duplicate catalog versions. No service credential is used.

Locale choice is requested PUBLISHED locale → explicit PUBLISHED fallback →
unavailable. A default locale never becomes an implicit fallback. Missing catalog
localization is explicit (null title/locale); a localized detail unavailable in
that language returns 409. Inaccessible versions/missions return 404; inaccessible
workspaces return 403. Incomplete published trees, unexpected upstream shapes,
overflow and provider failures fail closed with sanitized 503 responses. The
server reads explicit columns and returns only the fields recorded in the
implementation plan, with bounded text/rows and a 512-KiB response cap.

The browser renders literal textContent only. New curriculum state is cleared
and in-flight reads invalidated by the accepted clear/session/coordination path,
including workspace changes, blur/hide, periodic revalidation and signout.
The 01C-A01 correction retains only transient route/authority metadata for an open
catalog/program/mission when the 30-second timer fires. It clears private DOM,
freshly validates the same selected workspace/context, then freshly fetches that
exact curriculum route. Changed/denied authority never resumes the old route.
Repeated ticks coalesce while that validation/refetch is outstanding; ordinary
session/workspace/coordination events still invalidate the attempt. No curriculum
bytes are restored from cache, and no private data or navigation authority is
persisted.

The 01C-A02 correction adds one final fresh context request after a successful
automatic curriculum response, before any title/body/reflection is displayed.
The same selected workspace/kind/role/session and route-relevant ACTIVE version
checks apply again. A catalog's returned version set must also match the final
ACTIVE context set. Changed context cancels continuation and refreshes the
workspace summary through the existing loader; valid role transitions and new
entitlements remain available through explicit fresh navigation. Errors and stale
generations stay fail-closed. The periodic chain coalesces through this final
reconciliation and the single summary refresh after a valid mismatch. This is a bounded reconciliation, with no new polling or server
contract. The initial implementation, A01 report and both independent reports
retain their historical evidence; see the separate A02 correction/revalidation
report for current results.

The consumer reads Portal-owned published rows only. There is no Factory runtime
dependency, package format/importer/ingestion/publishing pipeline or production
curriculum provisioning. Section R commerce repairs and hosted operational gates
remain prerequisites to real delivery. All five OPEN NOTES above remain unchanged.

Additional validation sources:

- `node --test scripts/portal/test-curriculum.mjs`: mocked handler authorization,
  locale, field projection, limits and final-response revalidation.
- `node --test scripts/portal/test-curriculum-client.mjs`: actual client with
  deterministic DOM/clock and held mocked replies; tests navigation, literal text,
  failures, session/workspace changes and non-renewable coordination recovery.
  Includes the retained 01C-A01 fresh-refetch regression, 01C-A02 between-request
  role/catalog-set challenges, and final reconciliation failure/stale-generation
  checks. Optional `AIEA_PORTAL_CLIENT_SOURCE` runs the targeted regressions against
  saved pre-correction clients as negative controls; those controls must fail.
- `python3 supabase/tests/curriculum.native.py`: after unchanged 01B numeric
  fixtures and accepted entry tests on a clean disposable stack. Adds synthetic
  Portal curriculum through existing guards with genuine managed TOTP, then tests
  native Auth/PostgREST/RLS and handler isolation. Snapshots compare learning,
  cohort, learner, evidence and assessment records before/after browsing. Fixture
  setup is test-only and must never target production.
- `node scripts/portal/test-curriculum-browser.mjs`: after the new native fixture
  script, with the ordinary loopback adapter and the same installed Playwright/
  Chrome/private credential environment used by existing browser tests. Exercises
  native-backed navigation, literal HTML-like text, responsive layouts, held
  native responses across workspace changes, coordination clearing and signout.
  The 01C-A01 extension separately holds native context and mission replies,
  proves automatic resumption without clicks, and changes disposable synthetic
  entitlement/membership/workspace/profile authority while revalidation is held.
  A02 additionally accepts native periodic context, holds automatic curriculum
  BEFORE the application, changes synthetic role/entitlement/membership/workspace/
  profile authority, and proves no automatic display. Explicit navigation still
  permits SCHOOL_ADMIN and newly ACTIVE versions. Final reconciliation is held
  separately to check empty DOM and timer coalescing.
  Test-only operator SQL snapshots all 28 Portal tables across successful reads
  and ten learning/cohort/evidence/assessment tables across adversarial checks.
  This script requires local Docker access for those fixture operations.
  Its unavailable display is an injected response; focus events and the browser
  clock are controlled and do not establish operating-system/hosted scheduling.

Run accepted 01B audit/pending/replayed browser regressions before adding 01C
fixtures: those historical tests deliberately assert the original single fixture
entitlement summary. Their sources/assertions stay unchanged. Capture logs and
screenshots only beside private temporary credentials, then stop/remove the
disposable stack volumes, adapter, copied project and credential/fixture files.

## Sprint 01D — explicit adult-recorded mission status

`GET /api/portal/progress` requires workspace_id and program_version_id; an
optional subject_id loads that subject's statuses. Only existing ACTIVE FAMILY
learner references or authorized ACTIVE SCHOOL cohorts are listed. Select fields
and 100-row/512-KiB bounds remain explicit. Reads recheck Auth, selected-workspace
entitlement and subject visibility before returning. Opening curriculum/status
creates no product records.

`POST /api/portal/progress` accepts exactly workspace_id, program_version_id,
mission_id, subject_id and action. Same-origin JSON and native Auth/profile/cookie/
pending-signout checks apply. FAMILY actions are start/complete; SCHOOL actions
are start/deliver. The fixed RPC is chosen from the verified workspace kind and
receives the adult JWT using Content-Profile: portal. No service credential or
caller-supplied actor is used. Direct table writes remain denied.

The explicit “Record mission status” control opens a learner-code/cohort selector.
Status is confirmed by a fresh read after a successful write. Uncertain responses
require reload; the UI never retries a mutation automatically. A committed write
survives navigation, lost acknowledgement or fetch abortion. Subjects/statuses
clear with the inherited private lifecycle. Periodic continuation keeps only
transient route/subject IDs and refetches authorization/status; lost subject
access cannot restore private codes/status. No persistent private cache is added.

Family completion requires BOTH mission and version completion_rules to equal
`{"method":"ADULT_ATTESTATION"}` exactly, and mission evidence_expectations to
equal `{"required":false}` exactly. Missing/empty/unknown/additional requirements
fail closed. This is a bounded execution vocabulary, not a publication operation
or a claim that existing production curriculum uses it. Start remains explicit
and completion requires a started record. SCHOOL DELIVERED only records cohort
facilitation; it never creates learner progress or asserts learning/mastery.

The new database write gate independently validates the live managed Auth account
and session, even for direct RPC calls. HR03 additionally requires the issuer-signed
per-session generation to match locked private authority, distinguishing genuine
same-second issuance. Missing/obsolete generations fail closed. The trusted Auth
hook is enabled only in disposable local validation configuration; repository and
hosted configuration remain unchanged. No refresh token or second credential is
added to the accepted access-token cookie flow. See the Supabase README for locking,
expiry, trusted issuance and grant details. Existing read/Auth behavior and all
five OPEN NOTES remain unchanged, including SNV06's ordinary stateless Data API
limit. Provisioning, observations, assessments, evidence/artifacts, resources,
individual SCHOOL progress, correction/deletion and other deferred scope remain
outside 01D.

Separate validation sources: test-progress.mjs (mocked API),
test-progress-client.mjs (actual client/deterministic lifecycle),
test-progress-database.mjs with mission-status.sql/mission-status.assertions.json
(in-memory synthetic SQL), mission-status.native.py (genuine local Auth/direct
RPC/concurrency/revocation), and test-progress-browser.mjs (local native Chrome).
Native checks run after accepted 01B/01C fixtures on a disposable numeric-OTP
stack. --reuse-fixtures is only a local test recovery option, not cleanup or
production provisioning. Preserve failure evidence; final acceptance requires
clean-fixture execution. Private credentials and screenshots stay outside Git.

HR03 adds write-generation.sql/write-generation.assertions.json (synthetic trust/
grant/rollback checks) and write-generation.native.py (genuine Auth/PostgREST/API,
same-/cross-second refreshes, independent/concurrent sessions, races and hook fault
injection). Historical 01D-A01 failure/blocker evidence remains unchanged. Local
validation does not authorize hosted hook activation or self-acceptance.
