# AIEA Portal — Sprint 01B Implementation and Validation Report v1.0

Date: 2026-10-06 (America/Chicago)

**Implemented and locally validated; returned for Human Authority review.** This
report does not accept the sprint on Human Authority's behalf or authorize any
repository publication, hosted configuration, deployment or later sprint.

## 1. Authority and baseline

Human Authority approved the existing-adult numeric email OTP, protected runtime,
existing-workspace selection and minimal status-summary slice in the supplied
Sprint 01B Implementation Authorization. The implementation plan was the first
repository modification. Its four implementation rulings are preserved:

1. Previously provisioned identities with valid active adult profiles only.
2. Application session may end at access-token expiry; persistent refresh excluded.
3. Future SCHOOL ownership is deferred; existing roles are read only.
4. Disposable synthetic local testing is authorized; clean resources afterward.

Before implementation, `main`, HEAD, local `main` and cached `origin/main` all
identified `0b9d4af280c05e128e07a15e4687b053082f9eea` —
`AIEA Portal: accept Sprint 01A Supabase foundation`. The working tree was clean
and index empty. No fetch was needed or performed to assess the cached reference.

The frozen architecture was verified against freeze commit
`052101670dc92b38c7ec15c88a2b07572e42d75b`. Its SHA-256 remains
`f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755`.
Authoritative implementation, audit, correction, native-validation, SNV01, SNV03
and final-acceptance artifacts informed the work; their historical evidence was
not edited. Earlier reports' historical failures remain intact.

## 2. Implemented behavior

The existing static public application and CommonJS Vercel function style are
retained. No framework, SDK, dependency manifest, package lock or installation was
added. `/portal` and `/portal/` enter a protected server handler. Unauthenticated
entry redirects to the fixed adult login page; unavailable dependencies fail
closed. The existing public redirect and `/episodes` rewrite are retained.

The adult enters an email, requests a numeric code, then enters six digits. The
server always sends `create_user: false`. Unknown-account responses are generic;
provider failures and rate limiting remain failures. Verification validates the
configured Auth identity and an existing ACTIVE adult-confirmed profile before
issuing the application cookie. No identity/profile provisioning is implemented.

Each private entry/context request validates the JWT with the configured Auth
`/user` endpoint and rechecks the adult profile. JWT shape, issuer, audience,
ordinary authenticated role, non-anonymous status and expiry checks supplement
Auth validation; decoding is never authentication. Tenant reads use the adult
JWT and publishable key with `Accept-Profile: portal`, under unchanged native RLS.

Context lists only existing active own memberships in active workspaces. Zero
workspaces yields an empty state; one auto-selects; multiple require selection.
Selected authority is re-read for each request. FAMILY OWNER and SCHOOL OWNER,
SCHOOL_ADMIN and TEACHER remain explicit existing roles, without ownership
inference or mutation. Permitted selected-workspace entitlement summaries expose
only `id`, `program_version_id` and `status`. Status is informational: no resource,
learner, curriculum, checkout or entitlement-grant operation is enabled.

The responsive AIEA entry/shell supplies accessible form labels, feedback, a
workspace selector, kind/role and status summaries, expiry feedback and signout.
Private DOM state clears during switching, hiding/navigation, failures, expiry
and signout. Abort/generation guards reject superseded asynchronous results.
Workspace selection remains in memory and never establishes authority.

## 3. Exact changed-path inventory

Paths are repository-relative in this inventory. **18 paths total: 3 modified,
15 new.** No other baseline tracked file changed.

| Path | Change and purpose |
| --- | --- |
| `.env.example` | Modified: blank runtime configuration contract; secret explicitly unused |
| `portal/README.md` | Modified: runtime, boundaries, NOTES and reproduction instructions |
| `vercel.json` | Modified: protected Portal rewrites and Portal security/cache headers |
| `api/portal/auth.js` | New: fixed OTP request/verify/signout actions |
| `api/portal/context.js` | New: authenticated current workspace/status context |
| `api/portal/index.js` | New: protected server entry |
| `lib/portal/runtime.js` | New: configuration, session, upstream and RLS read helpers |
| `lib/portal/shell.js` | New: protected shell markup without private embedded data |
| `portal/login.html` | New: existing-adult numeric-code entry |
| `portal/portal.css` | New: bounded responsive AIEA presentation |
| `portal/portal.js` | New: entry/shell interaction and private-state clearing |
| `supabase/templates/adult-email-otp.html` | New: numeric `{{ .Token }}` email template, no verification link |
| `scripts/portal/serve-local.mjs` | New: loopback adapter for actual handlers and checked-in routing/headers |
| `scripts/portal/test-runtime.mjs` | New: mocked upstream adversarial runtime contracts |
| `scripts/portal/test-browser.mjs` | New: real local browser flow and viewport checks |
| `supabase/tests/portal-entry.native.py` | New: loopback synthetic setup and native numeric/runtime checks |
| `docs/portal/AIEA_Portal_Sprint_01B_Implementation_Plan_v1.0.md` | New: approved plan and Human rulings |
| `docs/portal/AIEA_Portal_Sprint_01B_Implementation_and_Validation_Report_v1.0.md` | New: this report |

## 4. Database, auth and security findings

**No schema/security change was required or made.** The three accepted migrations,
grants, RLS policies, helpers, accepted Supabase config and existing test sources
are byte-for-byte unchanged. The new template is not activated in repository
configuration. Synthetic writes occurred only in disposable local testing.

Only the access JWT is stored in a host-only HttpOnly SameSite=Lax cookie. HTTPS
uses `Secure` and `__Host-aiea_portal`; explicit loopback HTTP uses a separate local
cookie name. Cookie lifetime is bounded by JWT expiry. Issued refresh tokens are
discarded, with no refresh endpoint or persistent-refresh UX. The application
does not consume the secret/service-role key. No token appears in browser
JavaScript, URLs, API JSON, browser storage or application logs. The numeric code
necessarily exists transiently in its form/request and is not persisted/logged.

Mutating Auth actions require exact configured Origin, JSON, permitted action
fields and acceptable Fetch Metadata. Direct context access requires the same
authenticated boundary as entry. Requests cannot select an upstream, inject
claims, request signup, choose a role or turn the handler into a proxy. Responses
use no-store, noindex, nosniff, no-referrer and restrictive CSP. Each request owns
its identity context; concurrent-user tests found no identity sharing.

Native tests rejected a corrupted signature and a correctly signed expired JWT,
wrong/replayed/expired numeric codes, wrong email, missing/inactive/non-adult
profiles, revoked membership and inactive workspace. Mocked tests separately
cover malformed/wrong-project claims, configuration/provider/Auth/Data API
failures, input/Origin/method restrictions, projections and response bounds.
Results above 100 rows fail closed rather than return a silently incomplete list.

Current-session signout clears the application cookie and calls Auth local-scope
logout. Dependency failure still clears a received request's cookie and reports
failure. If the network request never reaches the server, the UI clears private
state and asks for a retry; it does not claim successful signout. Native runtime
refusal after Auth signout was demonstrated. This does not change ordinary Data
API signed-out JWT behavior; see unchanged SNV06 below.

## 5. Tenancy, role/cohort and entitlement findings

Native validation covered synthetic zero/one/multiple-workspace adults, FAMILY
OWNER, SCHOOL TEACHER/SCHOOL_ADMIN, unaffiliated adults, forged workspace selection,
switching and request-time revocation/inactivation. Summary data remained bounded
to the selected authorized workspace; billing/provider identifiers were absent.
ACTIVE, SUSPENDED and REVOKED statuses did not enable content delivery.

No cohort, learner or staff endpoint/UI was introduced. Teacher cohort privacy
and explicit administrator boundaries were retained and exercised through the
unchanged native foundation regressions. Existing verified current-session/TOTP
staff authorization remains outside the ordinary-adult runtime and unchanged.

## 6. Tests and measured results

All final test runs below passed with zero failures. Counts are separate evidence
groups, not a claim of independent unique scenarios across overlapping suites.

| Validation | Result | Evidence boundary |
| --- | --- | --- |
| Accepted native foundation regression | **467 PASS / 0 FAIL** | Real local PostgreSQL/Auth/PostgREST; breakdown below |
| Unchanged PGlite database assertions | **188 PASS** | In-memory synthetic Auth/JWT claims; separate from native proof |
| Unchanged runner inventory self-tests | **7 PASS** | Missing/replaced/duplicate/extra/invalid inventory detection |
| New runtime adversarial contracts | **67 behavior subtests PASS** | Node reports 68 tests including the parent; mocked upstream |
| New numeric OTP/native runtime | **70 PASS / 0 FAIL** | Real disposable Auth, mail, Data API and actual handlers |
| New real-browser flow | **20 PASS / 0 FAIL** | Headless Chrome; desktop 1440×1000 and mobile 390×844 |
| JavaScript syntax | **20 files PASS** | Existing and new API/runtime/browser/test sources |
| Python AST | **4 files PASS** | Existing validator/native sources plus new native suite |
| JSON configuration | **2 files PASS** | Vercel config and assertion inventory |
| Whitespace/error check | **PASS** | `git diff --check` |

The **467** unchanged native checks comprise **188** named SQL assertions with
exact inventory matching, **103** HTTP/Auth/RLS checks, **38** additional native
privilege/ordinary OTP/expiry checks, **13** checked-in SNV01 checks, **100**
checked-in SNV03 checks, **22** concurrency checks and **3** SERIALIZABLE/retry
checks. Existing sources and accepted historical reports were not rewritten.

The baseline ran first with accepted configuration. That stack was stopped with
`--no-backup`. Numeric tests then used a clean disposable copy with only the
`auth.email.template.magic_link` numeric-template overlay documented in the
README. Repository `supabase/config.toml` remained unchanged. Thus historical
magic-link evidence is not presented as numeric-code proof.

The 70 new native checks include actual numeric delivery without a verification
link, verification, wrong code/email, replay, native code expiry, resend limiting,
signup denial/no new identities, real-session protected entry/context, profile
gates, tenant/role/status boundaries and signout. Numeric expiry ages a synthetic
managed email timestamp; it does not alter the configured lifetime. Native signed
expired-JWT rejection is separate from the browser's simulated client clock.

The 20 final browser checks cover the actual email/code UI and mail delivery,
multi-workspace selection, FAMILY/SCHOOL roles, no learner/admin controls, empty
browser storage/inaccessible HttpOnly cookie, token-free URL/verification JSON,
client expiry feedback, signout, responsive fit and unchanged home/episodes routes.
Desktop login/workspace and mobile workspace screenshots were visually inspected.
An initial browser harness run stopped while reading a response after page
navigation; response capture was corrected in the harness, and the complete
20-check rerun passed. The aborted run is not included in passing totals.

Reproduction: use the runtime test command and disposable setup/overlay/native
and browser commands in `portal/README.md`. Existing bundled Node v24.19.0,
Supabase CLI v2.120.0, PGlite, Playwright and Chrome were reused. No dependencies
were installed. The old fixed-allowlist foundation validator was not run or
claimed to pass the expanded Sprint 01B path inventory.

## 7. Frozen governance and remaining NOTES

All seven frozen Human Authority rulings remain unchanged: account/workspace/
membership before checkout without guest claims; SCHOOL teacher cohort privacy
and explicit admin authority; independent server-managed staff authorization;
one-time commerce and specified paid/refund/dispute entitlement outcomes;
cohort delivery distinct from individual evidence; controlled privacy/retention
categories with durations deferred; adult passwordless aal1 and privileged
current-TOTP-backed aal2/capability with production SMTP prerequisite. This slice
does not implement or broaden deferred commerce, retention or staff operations.

| Accepted finding | Disposition retained | Sprint 01B treatment |
| --- | --- | --- |
| SNV02 | **OPEN — NOTE** | `[inbucket]` remains deprecated; local mail worked; accepted section unchanged |
| SNV04 | **OPEN — NOTE** | Current refresh-chain cascade remains unproven; refresh controls unchanged; no refresh UX added |
| SNV05 | **OPEN — NOTE** | Same-site redirect behavior does not prove exact-path-only callbacks; accepted config unchanged; no callback flow added |
| SNV06 | **OPEN — NOTE** | Ordinary stateless PostgREST/RLS can accept an unexpired signed-out JWT; native new tests observed Data API acceptance after runtime Auth refusal |

SNV01 and SNV03 remain accepted CLOSED, with their existing corrections intact.
No NOTE was fixed, removed, promoted or demoted. Runtime Auth validation adds the
authorized application boundary without reclassifying native Data API behavior.

## 8. Configuration and remaining limitations

Runtime identifies `PORTAL_SUPABASE_URL`, modern
`PORTAL_SUPABASE_PUBLISHABLE_KEY` and exact `PORTAL_ORIGIN`. Values remain blank
in `.env.example`; `PORTAL_SUPABASE_SECRET_KEY` is not consumed. The numeric email
template is committed as source but activated only in the disposable test copy.

No hosted Vercel routing/CDN/serverless deployment, HTTPS browser transport or
production SMTP delivery was tested. Secure-cookie serialization was tested;
real-browser tests used explicit loopback HTTP. The loopback adapter exercises
actual handlers and checked-in rewrite/header definitions but is not a full
Vercel emulator. Production origins, numeric-template activation, SMTP/Postmark,
abuse/rate controls, hosted assurance and controlled real-adult provisioning
require separate Human Authority authorization. Provider limits are authoritative;
the UI resend timer is courtesy feedback, not an anti-abuse boundary.

Sessions require reauthentication at access-token expiry. No workspace onboarding,
first SCHOOL owner, invitations, child accounts, learner records, cohort
management, general uploads, curriculum delivery, checkout, staff administration,
entitlement mutation or later-sprint implementation was added. No production data
was used. Local tests do not establish general production readiness.

## 9. Disposable-resource cleanup

Both disposable stacks were stopped with CLI `stop --no-backup`. Read-only Docker
inspection after final cleanup found no containers, volumes or Portal project
network; only default bridge/host/none networks remained. The application server
was stopped and no listener remained on port 4321. Browser test cleanup closed
Chrome. The disposable project directory was removed. This run's CLI credential
JSON, session-token JSON, raw startup logs and status logs were deleted; an
in-memory credential-value scan found no additional retained matching files.
Local mail, synthetic accounts/data and managed sessions were removed with the
stack volumes. Pre-existing tooling/images and historical test directories were
not modified or removed.

Sanitized result logs/JSON and synthetic screenshots remain outside the repository
for local review in the private temporary directory
`/var/folders/v7/9s2qngr52z798fdlhklzlhx40000gn/T/aiea-01b-0_eejs5u`.
These are ephemeral supporting artifacts, not committed historical evidence or
credentials and not a substitute for rerunning the checked-in test sources.

## 10. Repository preservation and review gate

Comparison with pre-implementation SHA-256 hashes of all **145** tracked files
found exactly the three modified existing files listed above. All **21** baseline
tracked `supabase/` and `docs/portal/` paths remain byte-identical, including the
three migrations, config, assertions/native test sources, frozen architecture and
accepted Sprint 01A evidence. All other public application source is unchanged.

Final branch remains `main`; HEAD, local `main` and cached `origin/main` remain
`0b9d4af280c05e128e07a15e4687b053082f9eea`. The index remains empty. The working
tree intentionally contains only the **18** listed unstaged/untracked Sprint 01B
paths. Nothing was staged, committed, pushed or deployed. No hosted Supabase,
Vercel, Stripe, Postmark, MailerLite or other external provider configuration was
created or changed. No hosted project or credentials were created.

**STOP — implementation and local validation complete; awaiting Human Authority
review.** Staging, commit, push, deployment, provider changes and Sprint 01C remain
unauthorized.

## 11. Post-audit bounded correction — 2026-10-07

**Sections 1–10 above are the original pre-audit implementation/validation
snapshot, not evidence that independent audit passed.** The independent audit
returned **FAIL — correction cycle required**. Its original verdict/findings
are preserved in
`AIEA_Portal_Sprint_01B_Independent_Adversarial_Audit_v1.0.md`. Human Authority
authorized corrections to A01/A02 only. The complete current correction evidence
and final path inventory are in
`AIEA_Portal_Sprint_01B_Audit_Correction_Report_v1.0.md`.

### A01 — original MAJOR and correction

Logout failure previously deleted the application credential before upstream
revocation completed. Retry could then lack the required credential, report
success and leave the original Auth session live until expiry. The original
isolated tests did not prove the full cookie-jar sequence.

The correction clears the active application cookie and immediately clears UI
state, while preserving a separate host-only HttpOnly logout-retry cookie bounded
by the original access JWT expiry. It contains no refresh token. The runtime
never accepts that cookie as an active session; any pending retry blocks private
entry/context and new sign-in. Retry sends the retained credential to Auth.
Repeated upstream failure remains failure and retains retry capability.
Successful native revocation clears both cookie slots. Reload reaches a truthful
retry control. Upstream 403 is no longer treated as successful logout.

Regression evidence: a complete mocked cookie-jar sequence plus **12** checks in
the combined real-browser/native suite demonstrate authenticated entry, injected
upstream failure, immediate private-state clearing, retry-only cookie retention,
denied pending context/old-cookie restoration beside pending state, another failed
retry without false success, reload recovery, eventual real native revocation,
cookie clearing and denial of original-cookie replay after revocation.

This is browser session quarantine, not a distributed bearer denylist. A previously
copied bearer remains subject to native Auth until revocation actually completes;
no immediate global rejection during an Auth outage is claimed. The browser does
not retain active Portal access to support retry. The original JWT alone is
demonstrably rejected by the runtime after eventual native revocation. Ordinary
stateless Data API behavior and SNV06 remain unchanged.

### A02 — original MINOR and correction

An already-open visible window could retain the previous adult's private summary
after another window changed the shared authenticated session. Visibility handling
alone did not invalidate that view or ensure focus revalidation.

Credential-free BroadcastChannel signals now clear private DOM, cancel superseded
requests and reset selected workspace on session changes. Signout initiation
signals pending state; completion/failure triggers revalidation. Verification
outcomes signal session changes, including failure that clears the old cookie.
Blur clears private state; focus and visibility restoration revalidate before
rendering. Browsers without BroadcastChannel also revalidate every 30 seconds.
No token or identity is stored in browser persistent storage or coordination
messages. Server Auth checks/RLS remain authoritative.

Regression evidence: **8** checks in the combined suite use two real Chrome pages
sharing cookies. Adult A's FAMILY owner summary is initially visible. Window B
authenticates Adult B; Window A clears all private fields while its context
response is held, then renders only Adult B's SCHOOL teacher summary after
server authorization. Cross-window signout clears Window A. A separate focus
sequence disables BroadcastChannel in A, holds the response and verifies clearing
before current Adult B data renders. The focus event is explicitly delivered in
headless Chrome in addition to bringing the page forward; this is not a claim
of native operating-system focus testing.

### Current tests, NOTES and repository boundary

Final correction results: unchanged native baseline **467 PASS**; PGlite **188
PASS**; runner self-tests **7 PASS**; runtime **73 behavioral subtests PASS**
(Node reports **74** including parent, versus original 67/68); existing numeric
native **70 PASS**; existing browser **20 PASS**; additional combined A01/A02
browser/native sequences **20 PASS**. JavaScript syntax **21 files**, Python AST
**4 files**, JSON **2 files**, and `git diff --check` pass. Final runs have zero
failures. An initial combined browser run hit a harness routing race when a
superseded request was released; the harness was corrected and the complete
20-check rerun passed. The partial run is excluded from final totals.

**Five NOTES remain OPEN:** 01B-A03 (local routing does not establish hosted
Vercel rewrite/CDN/HTTPS-cookie behavior), SNV02, SNV04, SNV05 and SNV06. No NOTE
was fixed, removed, promoted or demoted. A01/A02 are correction candidates for
independent re-audit, not independently accepted CLOSED findings.

The current full Sprint 01B inventory is **21 paths: 3 modified baseline paths
and 18 new paths**. It comprises all 18 paths in original Section 3, plus:

- `scripts/portal/test-audit-browser.mjs`
- `docs/portal/AIEA_Portal_Sprint_01B_Independent_Adversarial_Audit_v1.0.md`
- `docs/portal/AIEA_Portal_Sprint_01B_Audit_Correction_Report_v1.0.md`

Correction modifications within the original inventory are limited to
`api/portal/auth.js`, `api/portal/index.js`, `lib/portal/runtime.js`,
`portal/login.html`, `portal/portal.js`, `portal/README.md`,
`scripts/portal/test-runtime.mjs`, `supabase/tests/portal-entry.native.py`
(additional disposable fixtures only), and this report. Including the three
new paths above, this is a **12-path correction delta**. `vercel.json`,
`.env.example`, the original plan, original browser suite and all other original
Sprint 01B paths were unchanged during correction.

Disposable stacks/data/mail, server and browser were cleaned; private generated
credentials/raw startup logs and copied project were removed. Sanitized evidence
remains outside the repository in the private temporary correction directory
recorded in the separate correction report. All 21 accepted baseline Supabase/
architecture/evidence paths remain byte-identical. No schema, frozen architecture,
accepted Sprint 01A evidence or provider configuration changed. `main`, HEAD,
local `main` and cached `origin/main` remain at the accepted baseline; index empty;
all Sprint 01B changes unstaged/uncommitted. Nothing was staged, committed, pushed,
deployed or changed in hosted providers. **STOP for Human Authority review and
independent re-audit; no Sprint 01C work.**

## 12. A04 post-re-audit correction — 2026-10-07

Sections 1–10 remain pre-audit history; Section 11 remains the first A01/A02
correction history. The independent post-correction re-audit returned a second
**FAIL — further correction required**, specifically for **01B-A04 — MINOR: lost
completion permanently latches another view's pending state**. This was an
availability/recovery defect with private fields correctly cleared. Both
independent FAIL verdicts are preserved in the independent audit artifact.

The re-audit independently confirmed **A01 corrected** on inspected code and
reproduced evidence. It independently confirmed **A02 corrected for normal
completed sequences**, while final acceptance was withheld because of A04.
Those supplied dispositions supersede Section 11's then-pending re-audit status;
they do not retroactively make either audit pass.

Only the client changes production behavior for A04: remote pending now has a
ten-second monotonic deadline and recovery timeout. Focus/visibility checks the
deadline after deferred background delivery. A 30-second authoritative
revalidation fallback runs with or without BroadcastChannel, including late
shared-session changes after initial recovery. Private state stays cleared;
recovery discards selection and renders only after fresh server context completes.
No cached state, browser token storage, refresh persistence, server/Auth/quarantine,
schema/RLS, provider configuration or broader product feature was added or changed.
Hidden views remain clear until restoration; suspended-browser scheduling is not
represented as a precise wall-clock execution guarantee.

The new actual-client coordination suite passes **13** tests. With the saved
pre-A04 source, the identical suite produces **11 expected FAIL / 2 PASS**.
The new native/browser missing-completion suite passes **27** checks across focus,
timeout and visibility sequences. The saved pre-A04 receiver passes initial
authentication/clearing/disappearance observations and fails exactly on the missing
fresh recovery request. This verified negative control proves the regression
detects the reproduced defect; existing tests were not rewritten to hide it.
Held context responses demonstrate no private rendering before authoritative
validation; afterward only current Adult B's SCHOOL/TEACHER summary renders.

Final retained regressions: **467 native baseline PASS; 188 PGlite PASS; 7 runner
checks PASS; 73 server/runtime subtests PASS (Node 74 with parent); 70 numeric/native
PASS; 20 original browser PASS; 20 A01/A02 sequence PASS**. JavaScript syntax
**23 files**, Python AST **4 files**, JSON **2 files** and `git diff --check` pass.
All final candidate runs have zero failures; expected negative-control failures
are separate evidence. Client clocks and headless focus/visibility delivery are
test-controlled; native Auth/handlers/Data API remain real. Fixture-generated
numeric codes in the A04 suite are not new mail-delivery evidence.

Exactly **five NOTES remain OPEN: 01B-A03, SNV02, SNV04, SNV05 and SNV06**,
without correction, removal or severity change. **A04 remains a candidate
correction awaiting independent re-audit, not independently CLOSED.** This report
does not self-approve Sprint 01B.

The exact A04 delta is seven paths: modified `portal/portal.js`,
`portal/README.md`, and the independent audit, implementation/validation and audit
correction reports; new `scripts/portal/test-coordination.mjs` and
`scripts/portal/test-pending-browser.mjs`. The full Sprint 01B inventory is the
21 paths recorded in Section 11 plus these two scripts: **23 total, 3 modified
baseline paths and 20 new paths**. Exact changes, negative-control hash and full
evidence are recorded in Section 9 of
`AIEA_Portal_Sprint_01B_Audit_Correction_Report_v1.0.md`.

Disposable stacks/data/mail, adapters, Chrome, copied project and generated
credentials/raw startup logs were cleaned. Sanitized local evidence remains in
the private temporary A04 directory identified in the correction report. All
accepted Supabase/architecture/Sprint 01A evidence bytes remain unchanged, as do
all pre-A04 server files, existing tests, fixture setup and Vercel/environment
configuration. Prior report/audit history remains an exact prefix.

`main`, HEAD, local `main` and cached `origin/main` remain at the accepted
`0b9d4af280c05e128e07a15e4687b053082f9eea`; index empty; all 23 paths
unstaged/uncommitted. Nothing was staged, committed, pushed, deployed or changed
in hosted providers. No production data/real users or Sprint 01C work.
**STOP for Human Authority review and independent re-audit.**


## 13. A05 post-re-audit correction — 2026-10-07

Sections 1–12 remain historical evidence. The final A04 independent re-audit
returned a third **FAIL — further correction required**, independently confirming
**A01 corrected, A02 corrected and A04 corrected**. Its new **01B-A05 — MINOR**
finding was indefinitely renewable pending coordination. Private fields stayed
cleared; the demonstrated defect was availability, not exposure or authorization
bypass. All three independent FAIL verdicts remain preserved in the audit artifact.
Those supplied dispositions supersede earlier pending-re-audit statuses without
retroactively passing those audits.

The bounded production change is confined to `portal/portal.js`. The first pending
starts the existing ten-second monotonic deadline. Repeated pending clears private
fields/selection without renewing that deadline or cancelling its recovery read.
The episode includes authoritative validation, tracked until the current request
completes; periodic fallback does not cancel that active read. A pending observed
after a deferred deadline also triggers recovery. Recovery performs fresh server
context authorization and native RLS; no cached state returns when time expires.
Later replays can start another bounded episode. Completed revalidation,
focus/visibility and signout retain their existing behavior. Browser suspension
and network completion are not guaranteed wall-clock deadlines. No backend/Auth/
logout-quarantine, token persistence, schema/RLS or provider changes were made.

The updated deterministic suite passes **16 tests**: 12 prior cases unchanged,
one obsolete assertion expecting deadline renewal replaced with the initial-deadline
assertion, and three sustained/replayed/deferred/quarantine adversarial cases.
Saved pre-A05 source on that identical suite gives **12 PASS / 4 expected FAIL**.
The saved original 13-test suite and source hashes remain in local evidence.

The new native/browser suite passes **16 checks**, delivering **82 real pending
signals over two 40-second virtual episodes**. It reaches each first ten-second
boundary despite continued signals, sends the actual context request to native
Auth/handlers/RLS, then holds its unchanged response. Private fields remain empty;
continued pending and periodic fallback do not cancel it. Releasing it renders
only current Adult B's SCHOOL/TEACHER state, with old selection discarded. The
saved pre-A05 receiver passes three setup/clearing observations, then fails exactly
on the missing first authoritative recovery request. This verified negative control
is separate from final candidate passing results. Browser clocks are controlled;
fixture-generated native numeric codes are not new email-delivery evidence.

Complete final results: **467 unchanged native Sprint 01A PASS; 188 separate
PGlite PASS; 7 runner self-tests PASS; 73 server/runtime subtests PASS (Node 74
with parent); 16 coordination PASS; 70 unchanged numeric/native PASS; 20 unchanged
original browser PASS; 20 unchanged A01/A02 PASS (12 + 8); 27 unchanged A04
browser/native PASS; 16 new A05 browser/native PASS**. JavaScript syntax **24 files**,
Python AST **4 files**, JSON **2 files** and `git diff --check` pass. Final candidate
runs have zero failures; overlapping groups are not summed as unique scenarios.
Exact baseline breakdown, controls, source hashes and limits appear in Section 10
of `AIEA_Portal_Sprint_01B_Audit_Correction_Report_v1.0.md`.

Exactly **five OPEN NOTES remain unchanged: 01B-A03, SNV02, SNV04, SNV05 and
SNV06**. All seven frozen Human Authority rulings remain unchanged. **A05 remains
a locally corrected candidate awaiting independent re-audit**, not independently
CLOSED. This report does not self-approve Sprint 01B.

The A05 delta is seven paths: modified `portal/portal.js`, `portal/README.md`,
`scripts/portal/test-coordination.mjs` and the three Sprint 01B audit/correction/
implementation reports; new `scripts/portal/test-replayed-pending-browser.mjs`.
The full Sprint 01B inventory is **24 paths: 3 modified baseline paths and 21 new
paths**. All other pre-A05 candidate files are byte-identical, including backend,
existing native fixtures, A01/A02 and A04 browser suites, environment/Vercel and
original plan. Prior report/audit history remains an exact prefix.

Disposable stacks/data/mail, adapters, Chrome, copied project and generated
credentials/session files/raw startup logs were cleaned. Final inspection found
no containers, volumes or port-4321 listener; only default Docker networks remain.
Sanitized evidence and saved public negative-control sources remain in the private
A05 temporary directory recorded in the correction report. All 21 accepted
Supabase/architecture/Sprint 01A evidence paths and frozen architecture bytes
remain unchanged. No dependencies installed, hosted/provider changes, real users
or production data were used.

Branch `main`, HEAD, local `main` and cached `origin/main` remain at
`0b9d4af280c05e128e07a15e4687b053082f9eea`; index empty; all 24 candidate paths
unstaged/uncommitted. Nothing was staged, committed, pushed or deployed.
No Sprint 01C work. **STOP for Human Authority review and independent re-audit.**
