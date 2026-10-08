# AIEA Portal — Sprint 01B Audit Correction Report v1.0

Date: 2026-10-07 (America/Chicago)

**A01/A02 corrections implemented and locally validated; independent re-audit
recommended.** Human Authority acceptance is pending. The original independent
verdict remains **FAIL — correction cycle required**, recorded faithfully in
`AIEA_Portal_Sprint_01B_Independent_Adversarial_Audit_v1.0.md`.

## 1. Authorized boundary and original findings

Human Authority authorized a bounded correction pass for A01 and A02, associated
regressions and truthful documentation. A03 and the four inherited NOTES must
remain OPEN. No schema/architecture/provider/deployment, refresh persistence,
product expansion, staging/commit/push or Sprint 01C work is authorized.

**01B-A01 — MAJOR:** Logout failure lost the credential needed to retry revocation.
The next no-credential request could report success while the original session
remained usable. **01B-A02 — MINOR:** Another visible window could retain the
previous adult's private summary after the shared session changed.

The earlier implementation report's original sections remain as pre-audit history;
a clearly separated Section 11 records this correction. Neither the original
audit verdict nor earlier validation history has been rewritten as a passing audit.

## 2. A01 implementation and sequential regression

The server now removes active Portal access and retains only a distinct logout
retry credential when upstream logout fails. It is a host-only HttpOnly SameSite=Lax
cookie; HTTPS uses Secure and `__Host-aiea_portal_logout`, loopback HTTP uses
`aiea_portal_logout_local`. Its lifetime cannot exceed the original access JWT's
expiry. No refresh token, new secret, database record or shared revocation store
is introduced. Tokens remain outside JavaScript, storage, URLs and logs.

Private authentication rejects pending logout before issuing any Auth/Data API
read. Restoring the active cookie alongside the pending cookie does not restore
access. The retry cookie itself is not accepted as the application session.
OTP request/verification is blocked while retry is pending so replacing the adult
session cannot silently abandon pending revocation. Private entry routes a pending
session to a login retry control, preserving recovery across reload.

Each retry sends the preserved credential to the fixed native Auth local-scope
logout endpoint. Upstream failure, including 403, reports `signout_incomplete` and
preserves retry capability. Auth success (204), or Auth's definitive invalid-session
response (401), clears both cookie slots. A genuine absent-session request remains
idempotent. A malformed pending retry never becomes absent-session success.

The initiating view clears private state before awaiting the request, announces
pending state to other windows, and truthfully reports failure with retry. No
failed response displays the successful-signout message. The session remains
quarantined in the browser until successful revocation or JWT expiry.

`scripts/portal/test-runtime.mjs` now exercises the entire cookie-jar sequence
as one adversarial subtest, plus pending-signin, forbidden/malformed retry,
reload routing and HTTPS retry-cookie contracts. It does not substitute isolated
cookie-clear and retry checks for the sequential regression.

The real-browser/native sequence in `scripts/portal/test-audit-browser.mjs`
performed **12 passing A01 checks** in one run:

1. Real numeric sign-in gives a visible synthetic adult's private summary.
2. Test-process upstream logout injection delays and returns 503.
3. Private DOM clears before that failed response returns.
4. The cookie jar loses active access and retains only bounded HttpOnly retry.
5. Pending-jar context access is denied.
6. Original access-cookie restoration beside pending state is denied.
7. The retry credential is not accepted as a session cookie.
8. A second injected failure still reports failure and retains its credential.
9. Reload reaches the truthful retry control.
10. Removing injection permits actual native Auth revocation and clears both slots.
11. Replay of the original cookie alone against Portal context is then denied.
12. Browser credential storage remains empty.

Only upstream failure was injected through a temporary fetch hook in the disposable
test process. Verification, tenancy reads and eventual revocation used actual
native local Auth and the actual application handlers. No production fault
endpoint/option exists. The test hook, flag, adapter and browser are cleaned in
`finally`.

**Boundary qualification:** this is browser-session quarantine and retry, not a
claim that a previously copied bearer is globally revoked before Auth can complete
logout. Such a bearer remains subject to native Auth until actual revocation or
expiry. The retained retry cookie grants no active Portal access; original-cookie
replay alone was proved denied after actual revocation. Immediate global denylisting
during an Auth outage would require additional shared state and is not introduced
or claimed by this bounded correction. Ordinary Data API behavior/SNV06 is unchanged.

## 3. A02 implementation and two-window evidence

BroadcastChannel carries only `pending`/`revalidate` signals, never identity,
workspace, email, code or credentials. A receiving Portal view clears private DOM,
invalidates asynchronous generations, aborts stale requests and discards selected
workspace authority. Pending signout holds other views clear until completion or
failure signals fresh revalidation. Verification outcomes signal session change,
including failure that clears an existing cookie.

Blur clears the private view. Focus/visibility restoration clears and requests
current context before rendering. Without BroadcastChannel, a 30-second fallback
also bounds stale visible state. No browser persistent storage or server authority
substitute was added; Auth validation and native RLS remain decisive.

The combined suite performed **8 passing A02 checks** using real Chrome pages
sharing a browser context/cookies. Window A first displayed Adult A's FAMILY name,
OWNER role and ACTIVE entitlement. Window B completed actual numeric authentication
as Adult B. Window A received the session condition and requested fresh context.
The harness held its response and verified that workspace name, role, entitlement
and selector data were cleared before any replacement response could render.
After release, Window A displayed only Adult B's SCHOOL/TEACHER summary. Signout
through Window B removed Window A's private view.

A separate two-page focus sequence disabled BroadcastChannel only in Window A.
After the shared adult changed, focus triggered revalidation; its response was held
to prove private clearing before Adult B rendered. Headless Chrome may keep targets
focused, so the harness explicitly delivers the focus event in addition to bringing
the page forward. This proves the real client focus listener against native server
authorization, not operating-system window-manager behavior. No private context
data or handler result was substituted.

The first combined run reached A02 clearing but hit a Playwright routing race on
a superseded request. The harness now tolerates already-handled cancelled routes
and waits to remove routing until current data renders. The complete rerun passed
all 20 checks; the partial run is excluded from final passing totals.

## 4. Complete final validation

All final runs below have **zero failures**. Overlapping suites are reported
separately; counts are not added into an inflated unique-scenario total.

| Suite/check | Final result |
| --- | --- |
| Unchanged Sprint 01A native baseline | **467 PASS** |
| Unchanged PGlite named database assertions | **188 PASS** |
| Unchanged runner inventory self-tests | **7 PASS** |
| Corrected mocked runtime | **73 behavioral subtests PASS; Node 74 including parent** |
| Existing Sprint 01B native numeric/runtime suite | **70 PASS** |
| Existing Sprint 01B browser suite | **20 PASS** |
| New combined A01/A02 browser/native suite | **20 PASS: 12 A01 + 8 A02** |
| JavaScript syntax | **21 files PASS** |
| Python AST | **4 files PASS** |
| JSON parsing | **2 files PASS** |
| `git diff --check` | **PASS** |

Runtime behavior subtests increased from 67 to 73; browser coverage gained the
separate 20-check combined suite. Existing native 70 and browser 20 inventories
remain intact. Native fixture setup adds fresh synthetic adults 11–15 for the new
browser sequences; no existing native assertions were removed.

The unchanged 467 baseline comprises 188 exact named SQL assertions, 103 HTTP/Auth/
RLS checks, 38 additional native privilege/OTP/expiry checks, 13 SNV01 checks,
100 SNV03 checks, 22 concurrency checks and 3 SERIALIZABLE/retry checks. It ran
first with accepted configuration; that stack was removed before a fresh numeric
stack used only the documented disposable template overlay. Historical magic-link
evidence is not recast as numeric proof. Accepted sources/evidence remain unchanged.

Existing local bundled Node v24.19.0, Supabase CLI v2.120.0, PGlite, Playwright and
Chrome were reused without dependency installation. Reproduction commands and
test boundaries are documented in `portal/README.md`. The old fixed-allowlist
foundation validator was not run or claimed to accept the expanded path inventory.

## 5. Exact changed paths

**Full current Sprint 01B delta against the accepted baseline: 21 paths, comprising
3 modified and 18 new.** Repository-relative inventory:

| Path | Baseline status | Changed in this correction? |
| --- | --- | --- |
| `.env.example` | Modified | No |
| `portal/README.md` | Modified | Yes |
| `vercel.json` | Modified | No |
| `api/portal/auth.js` | New | Yes |
| `api/portal/context.js` | New | No |
| `api/portal/index.js` | New | Yes |
| `lib/portal/runtime.js` | New | Yes |
| `lib/portal/shell.js` | New | No |
| `portal/login.html` | New | Yes |
| `portal/portal.css` | New | No |
| `portal/portal.js` | New | Yes |
| `supabase/templates/adult-email-otp.html` | New | No |
| `scripts/portal/serve-local.mjs` | New | No |
| `scripts/portal/test-runtime.mjs` | New | Yes |
| `scripts/portal/test-browser.mjs` | New | No |
| `scripts/portal/test-audit-browser.mjs` | New | New correction path |
| `supabase/tests/portal-entry.native.py` | New | Yes: disposable fixture setup only |
| `docs/portal/AIEA_Portal_Sprint_01B_Implementation_Plan_v1.0.md` | New | No |
| `docs/portal/AIEA_Portal_Sprint_01B_Implementation_and_Validation_Report_v1.0.md` | New | Yes: separated appended correction section |
| `docs/portal/AIEA_Portal_Sprint_01B_Independent_Adversarial_Audit_v1.0.md` | New | New correction path |
| `docs/portal/AIEA_Portal_Sprint_01B_Audit_Correction_Report_v1.0.md` | New | New correction path |

This correction changes **9** existing Sprint 01B candidate files and creates
**3**, a **12-path correction delta**. No routing/provider configuration changed
during correction. The original plan, original implementation report history and
all other existing Sprint 01B files are preserved as indicated above.

## 6. Remaining NOTES and limits

Exactly **five NOTES remain OPEN**, with no silent correction/removal/reclassification:

| Finding | Retained disposition |
| --- | --- |
| 01B-A03 | OPEN NOTE: Local routing tests do not establish hosted Vercel rewrite/CDN/HTTPS-cookie behavior |
| SNV02 | OPEN NOTE: `[inbucket]` deprecated; local mail worked; accepted config unchanged |
| SNV04 | OPEN NOTE: Current refresh-chain cascade unproven; controls unchanged |
| SNV05 | OPEN NOTE: Same-site redirect/path behavior is not an exact-path-only callback guarantee |
| SNV06 | OPEN NOTE: Ordinary stateless Data API/RLS can accept an unexpired signed-out JWT; privileged live-session gate unchanged |

A01/A02 are locally corrected candidates awaiting independent re-audit, not
independently accepted CLOSED findings. No new schema/security conflict was found.
All seven frozen Human Authority rulings are preserved. No hosted deployment,
CDN/rewrite assurance, production SMTP, HTTPS browser transport or real-user
provisioning was performed. Local HTTP browser tests and Secure-cookie serialization
do not resolve A03. Session expiry still requires reauthentication; no refresh,
onboarding, ownership, learner/cohort management, curriculum, commerce or staff
functionality was added.

## 7. Cleanup, preservation and repository state

Both disposable stacks were stopped with `stop --no-backup`. Final read-only Docker
inspection found no containers or volumes and no project network; only default
bridge/host/none networks remained. No listener remained on 4321. Both ordinary
and fault-injected adapters were stopped and browser cleanup completed. The
temporary hook/flag, copied Supabase project, generated CLI credential JSON,
issued-session JSON and raw startup logs were removed. An in-memory credential-value
scan identified no additional retained matching files. Synthetic Auth/data/mail
were removed with disposable volumes. Pre-existing tooling/images and prior
validation evidence directories were left intact.

Sanitized result logs/JSON and synthetic screenshots remain outside the repository
in the private temporary directory
`/var/folders/v7/9s2qngr52z798fdlhklzlhx40000gn/T/aiea-01b-correction-fz1sh66k`.
They are ephemeral local supporting evidence, contain no issued credentials, and
do not replace the checked-in reproducible test sources.

Pre-implementation hashes of all 145 baseline tracked files identify only the
same three modified existing paths: `.env.example`, `portal/README.md`,
`vercel.json`. All **21** accepted baseline `supabase/` and `docs/portal/` paths
remain byte-identical, including all three migrations, RLS/grants/helpers, config,
assertions/native sources, frozen architecture and Sprint 01A accepted evidence.
Frozen architecture SHA-256 remains
`f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755`.
Pre-correction hashes confirm the precise 12-path bounded correction above.

Branch remains `main`. HEAD, local `main` and cached `origin/main` remain
`0b9d4af280c05e128e07a15e4687b053082f9eea`. Index is empty; the working tree
contains only the 21 listed unstaged/untracked paths. Nothing was staged,
committed, pushed or deployed. No hosted Supabase, Vercel, Stripe, Postmark,
MailerLite or other external provider was changed. No production data was used.

## 8. Review recommendation

Independent re-audit should replay the complete A01 cookie-jar/failure/retry/native
revocation sequence and A02 shared-session/focus sequences, assess the documented
quarantine/bearer boundary, and confirm five unchanged open NOTES and preserved
repository scope. The original independent FAIL remains historical evidence until
a separate re-audit establishes a new verdict.

**STOP — bounded corrections and local validation complete; returned to Human
Authority for review and independent re-audit.** No staging, commit, push,
deployment, provider changes or Sprint 01C work is authorized or performed.

## 9. A04 post-re-audit correction — 2026-10-07

### Independent re-audit history and current disposition

Sections 1–8 above remain the original A01/A02 correction history. The independent
post-correction re-audit subsequently returned **FAIL — further correction
required**, specifically because of **01B-A04 — MINOR: A lost completion signal
permanently blocks an existing Portal view**. Private fields were correctly
cleared; this was an availability/recovery defect, not private-data retention.

The re-audit independently confirmed **A01 corrected** on inspected code and
reproduced evidence. It independently confirmed **A02 corrected for normal
completed sequences**, with final acceptance withheld because of A04. These
dispositions were supplied by Human Authority and are faithfully recorded in the
appended post-correction section of the independent audit artifact. Both original
independent FAIL verdicts remain historical evidence. Neither originally passed.

Human Authority authorized A04 correction only, associated regressions and truthful
documentation. **A04 is a candidate correction awaiting independent re-audit; it
is not self-declared independently CLOSED. Sprint 01B is not self-approved.**

### Exact A04 implementation

Only `portal/portal.js` changes production behavior. A received `pending` signal
now starts a **ten-second coordination lease**, measured with `performance.now()`
and an independently scheduled recovery timeout. A new pending signal replaces
the previous lease; completion cancels it. Focus, visibility restoration and
periodic checks do not extend its deadline. If background timeout delivery was
deferred, restoration checks the elapsed monotonic deadline explicitly.

Expiry releases only the client coordination pause. It clears private DOM,
cancels superseded requests, discards selected workspace and requests fresh server
context when visible. Hidden views stay empty and request fresh context on
restoration. The **30-second authoritative revalidation fallback now runs with
and without BroadcastChannel**, also covering a shared-cookie change that finishes
after the ten-second recovery read. Browser suspension can defer timer execution;
restoration supplies the deadline check and fresh validation path.

There is no cached-private-state restoration. A server response must complete
before private rendering, and asynchronous generation guards still reject stale
responses. The coordination lease is an availability mechanism, never authority.
Auth validation and unchanged native RLS remain decisive. In particular, lease
expiry cannot remove or bypass A01's server-managed pending-logout cookie gate.
No refresh persistence, browser token storage, new runtime configuration,
server/API, schema, migration, RLS or provider change was introduced.

### Adversarial regression and negative controls

`scripts/portal/test-coordination.mjs` executes the actual client source in a
deterministic browser DOM/clock harness with mocked context responses. All **13**
final tests pass. They cover lost completion, early focus without extending the
lease, deferred-timer focus/visibility recovery, timeout-only recovery, hidden
views, completed A02 notification, replaced pending leases, server outage,
unchanged A01 quarantine, superseded old-adult responses, no-channel fallback and
a late cookie change after initial recovery.

The same 13 tests were run against the saved pre-A04 client: **11 expected FAIL,
2 PASS**. The failed assertions include the absence of a fresh recovery request;
the completed A02 and no-channel sequences still pass. This is an intentional
negative control, not a failed final candidate run.

`scripts/portal/test-pending-browser.mjs` performs **27 passing real-browser/native
checks**, comprising nine checks each for focus, timeout and visibility recovery.
Each sequence starts with Adult A's authorized FAMILY/OWNER/ACTIVE summary in
Window A. Window B sends a real BroadcastChannel `pending`, completes native
verification as synthetic Adult B, deliberately sends no completion, then closes.
Window A's observer confirms pending without revalidate. Private fields remain
empty while unresolved. Recovery issues a new `/api/portal/context` request with
the old selection discarded. The response is held to prove no private rendering
before authorization completes; after release, only Adult B's SCHOOL/TEACHER
summary renders. Credential storage remains empty.

The identical browser regression was first run with only Window A's client source
overridden by the saved pre-A04 bytes. It passed the initial authentication,
clearing, sender-disappearance and no-cached-render observations, then **failed
exactly** `A04 focus: missing completion recovers through fresh server context`.
No request arrived. The runner verified that precise failure rather than accepting
an arbitrary setup/harness error as a negative result. With actual corrected
source, all three sequences pass. Existing A01/A02/browser/native tests were not
edited to conceal the A04 defect.

Saved pre-A04 client SHA-256:
`10a51bb638d1fbfd4b05da4ea72e437538bb56290398309e79af2abbb54e7d56`.
`AIEA_PORTAL_CLIENT_SOURCE` is an optional test-only source selector for reproducible
negative controls; it is not a production setting or provider change.

Browser tests use real local Auth, actual handlers and Data API/RLS. Existing
synthetic adults 2/3 receive native fixture-generated numeric codes; this is not
new mail-delivery evidence. Client time is advanced by Playwright, and headless
focus/visibility events are explicitly delivered. These prove the client recovery
state machine against native authorization, not operating-system timer/focus or
hosted Vercel behavior. The unchanged 70-check native suite retains actual numeric
mail, replay/expiry, tenancy and signout proof.

### Complete final A04 validation results

All final candidate runs below have **zero failures**. Expected pre-A04 failures
are separate negative-control evidence, not included in final passing totals.
Counts are overlapping evidence groups and are not summed as unique scenarios.

| Validation | Final result |
| --- | --- |
| Unchanged Sprint 01A native regression | **467 PASS** |
| Unchanged PGlite named assertions | **188 PASS** |
| Unchanged runner inventory self-tests | **7 PASS** |
| Unchanged mocked server/runtime suite | **73 behavioral subtests PASS; Node 74 with parent** |
| New actual-client coordination tests | **13 PASS** |
| Unchanged Sprint 01B numeric/native runtime | **70 PASS** |
| Unchanged original browser flow | **20 PASS** |
| Unchanged A01/A02 sequential browser/native suite | **20 PASS: A01 12 + A02 8** |
| New A04 missing-completion browser/native suite | **27 PASS** |
| JavaScript syntax | **23 files PASS** |
| Python AST | **4 files PASS** |
| JSON parsing | **2 files PASS** |
| `git diff --check` | **PASS** |

The unchanged 467 baseline again comprises 188 exact SQL assertions, 103 HTTP/Auth/
RLS checks, 38 extra native privilege/OTP/expiry checks, 13 SNV01, 100 SNV03,
22 concurrency and 3 SERIALIZABLE/retry checks. It ran with accepted configuration
before removal and a fresh disposable numeric-template stack. The accepted config,
three migrations, assertion inventory and all existing test sources remained
unchanged. No dependency installation or hosted work was performed. The old
fixed-allowlist foundation validator was not claimed to accept the larger manifest.

### Exact A04 changed paths and full Sprint 01B inventory

**Seven paths in this A04 correction: five modified candidate files and two new.**

| Path | A04 change |
| --- | --- |
| `portal/portal.js` | Modified: bounded pending lease and recovery/revalidation |
| `portal/README.md` | Modified: current recovery contract and test reproduction |
| `scripts/portal/test-coordination.mjs` | New: deterministic actual-client regressions/negative control |
| `scripts/portal/test-pending-browser.mjs` | New: native/browser missing-sender regression/negative control |
| `docs/portal/AIEA_Portal_Sprint_01B_Independent_Adversarial_Audit_v1.0.md` | Appended: independent second FAIL and supplied dispositions |
| `docs/portal/AIEA_Portal_Sprint_01B_Implementation_and_Validation_Report_v1.0.md` | Appended: separated A04 correction evidence |
| `docs/portal/AIEA_Portal_Sprint_01B_Audit_Correction_Report_v1.0.md` | Appended: this separated A04 evidence |

The full current Sprint 01B inventory is **23 paths: the 21 paths in Section 5
plus the two new test scripts above**, comprising **3 modified baseline paths and
20 new paths**. All other pre-A04 candidate files remain byte-identical, including
server/runtime/Auth/quarantine code, original A01/A02 and browser tests, native
fixture setup, Vercel config, environment contract and original implementation
plan. Prior report/audit text is preserved as an exact prefix before new sections.

### Five unchanged OPEN NOTES

Exactly **01B-A03, SNV02, SNV04, SNV05 and SNV06 remain OPEN NOTES**, with the same
meanings recorded in Section 6. No NOTE was fixed, removed, promoted or demoted.
A03 still records that local routing tests do not establish hosted Vercel rewrite/
CDN/HTTPS-cookie behavior. A04 is a MINOR correction candidate, not an extra NOTE.
All seven frozen Human Authority rulings remain unchanged.

### Cleanup and repository state

Both disposable stacks were stopped with `stop --no-backup`; synthetic Auth/data,
managed sessions and mail were removed with their volumes. Final Docker inspection
found no containers or volumes and only default bridge/host/none networks. No
listener remained on port 4321. Ordinary, audit and A04 adapters and Chrome were
closed. Private CLI credentials, baseline issued-session JSON, raw startup logs
and the copied project were removed. An in-memory scan for saved credential values
found no additional retained matching files. Pre-existing tools/images and prior
validation directories were not altered or removed.

Sanitized logs/results/screenshots, pre-A04 public source and hashes remain only
as ephemeral local evidence in the private temporary directory
`/var/folders/v7/9s2qngr52z798fdlhklzlhx40000gn/T/aiea-01b-a04-9wid0lpj`.
The checked-in test sources and README provide reproduction instructions.

All **21** accepted baseline Supabase/architecture/evidence paths remain byte-identical;
frozen architecture SHA-256 remains
`f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755`.
No accepted Sprint 01A evidence, schema/migration/RLS or frozen architecture changed.
Branch is `main`; HEAD, local `main` and cached `origin/main` remain
`0b9d4af280c05e128e07a15e4687b053082f9eea`. Index is empty. All 23 candidate paths
remain unstaged/uncommitted. Nothing was staged, committed, pushed or deployed;
no hosted Supabase, Vercel or other provider configuration changed. No real users
or production data were used. No Sprint 01C work was begun.

**STOP — A04 implementation and local validation complete; Human Authority review
and independent re-audit required.** Re-audit should reproduce the missing-sender
negative/positive controls, retained A01/A02 sequences, fresh-authority rendering
and five unchanged NOTES before deciding Sprint 01B acceptance.


## 10. A05 post-re-audit correction — 2026-10-07

### Authority and disposition

This section appends bounded A05 correction evidence. Sections 1–9 remain
historical evidence. Human Authority supplied the final A04 independent re-audit:
**FAIL — further correction required**, independently confirming **A01 corrected,
A02 corrected and A04 corrected**, and reporting **01B-A05 — MINOR**. Repeated
pending signals renewed the ten-second deadline indefinitely. Private fields
stayed clear; the demonstrated defect was availability, not private-data exposure
or authorization bypass. All three independent FAIL verdicts remain intact in the
independent audit artifact. No independent transcript, count or identity is invented.

**A05 is a locally corrected candidate awaiting independent re-audit.** This
report does not close A05 independently or approve Sprint 01B. Authorization was
limited to the correction, associated regressions and truthful appended evidence.

### Exact implementation and boundary

Only `portal/portal.js` changes production behavior. The first pending signal
starts the existing ten-second monotonic deadline. Further pending signals in the
same episode clear private fields and discard selected workspace without renewing
the deadline, incrementing the request generation or aborting the recovery read.
If timer delivery was deferred, a later pending observed at/after the deadline
initiates recovery. The episode includes its authoritative validation request:
`pendingValidation` remains set until the current request completes; superseded
requests cannot clear that flag. The 30-second periodic fallback skips an active
coordination recovery request so periodic work cannot starve that request either.

At the boundary, the existing `/api/portal/context` path performs fresh server
Auth validation and native RLS reads. Private fields remain empty until its
response completes. No timer restores cached workspace, role or entitlement data.
Selected workspace remains non-authoritative and is discarded before recovery.
A later replay after completed validation may start another episode, but its
first deadline is likewise nonrenewable. Completed `revalidate`, focus/visibility,
signout and request-generation protections retain their existing behavior.
Hidden views remain clear until restoration. Ten seconds bounds the coordination
pause in an executing visible client; browser suspension, network latency and
server outage are not represented as guaranteed wall-clock completion.

Server/Auth/logout-quarantine code is unchanged. No token storage, refresh-token
persistence, schema, migration, RLS, provider setting or product feature was added.
All seven frozen Human Authority rulings remain unchanged.

### Sustained/replayed-pending regression and negative controls

The actual-client deterministic suite now has **16 PASS**. Twelve prior cases
remain unchanged. One prior assertion explicitly expected a later pending to
renew the deadline; it was corrected to assert recovery at the initial deadline.
Three new cases cover sustained/replayed pending across **90 virtual seconds**,
elapsed deadlines with deferred timer delivery, and authoritative A01 logout
quarantine under sustained pending. Held responses prove no private restoration
and no repeated-pending/periodic cancellation. Both episodes render only the
current authorized teacher summary after response release.

The saved pre-A05 client on the identical updated suite gives **12 PASS / 4
expected FAIL**, specifically the four A05 recovery cases. These expected failures
are negative-control evidence, separate from final candidate passing results.
The original 13-test suite is also saved; it was not represented as unchanged.

The new `scripts/portal/test-replayed-pending-browser.mjs` uses real Chrome,
BroadcastChannel, shared HttpOnly cookies, local native Auth, actual application
handlers and native Data API/RLS. Window A initially shows Adult A's FAMILY owner
summary. Window B sends pending, verifies existing synthetic Adult B, and never
sends completion. **82 real pending signals across two 40-second virtual episodes**
arrive at one-second intervals. The first recovery read begins at ten seconds in
each episode despite continued pending. The harness immediately sends that request
to the native server and holds its actual unchanged response. Continued signals
and the 30-second fallback do not abort/supersede it. Private fields stay empty,
the old workspace query is absent, and only current Adult B's SCHOOL/TEACHER state
renders after release. The later replay repeats the bounded recovery. Channel
payloads are only pending; browser cookies/storage expose no credentials.
**All 16 browser/native checks PASS.**

With the saved pre-A05 receiver, the browser negative control passes the first
three setup/authentication/clearing observations, then fails exactly
**“A05 sustained pending reaches first authoritative recovery boundary”** because
no fresh context request appears. The runner checked that exact final failed
label, rather than accepting an arbitrary harness/setup failure.

Saved public source SHA-256:
`5924021a8f48ec81b4e498a46ef3e48e5f0c2382e54a1fe879c23beb9b1f9a93`.
Saved original coordination-suite SHA-256:
`d03f49921f6f148044ee1e757890325385e22889ff415feb59417b53dfe12d94`.
The README records reproduction and the optional test-only
`AIEA_PORTAL_CLIENT_SOURCE` negative-control selector.

Browser clocks are Playwright-controlled, so durations prove state-machine
behavior, not operating-system scheduling guarantees. The new browser fixture
uses native-generated numeric codes for existing synthetic adults only; it is
not new email-delivery evidence. The retained native suite provides actual
numeric mail/replay/expiry proof. No real users or production data were used.

### Complete final A05 validation results

All final candidate runs below have **zero failures**. Expected pre-A05 failures
are separate evidence. Counts overlap and are not summed as unique scenarios.

| Validation | Final result |
| --- | --- |
| Unchanged Sprint 01A native regression | **467 PASS** |
| Unchanged PGlite named assertions, separate in-memory run | **188 PASS** |
| Unchanged runner inventory self-tests | **7 PASS** |
| Unchanged mocked server/runtime suite | **73 behavioral subtests PASS; Node 74 with parent** |
| Updated actual-client coordination suite | **16 PASS** |
| Unchanged Sprint 01B numeric/native runtime | **70 PASS** |
| Unchanged original browser flow | **20 PASS** |
| Unchanged A01/A02 sequential browser/native suite | **20 PASS: A01 12 + A02 8** |
| Unchanged A04 missing-completion browser/native suite | **27 PASS** |
| New A05 sustained/replayed-pending browser/native suite | **16 PASS** |
| JavaScript syntax | **24 files PASS** |
| Python AST | **4 files PASS** |
| JSON parsing | **2 files PASS** |
| `git diff --check` | **PASS** |

The 467 baseline comprises 188 exact SQL assertions, 103 HTTP/Auth/RLS checks,
38 extra native privilege/OTP/expiry checks, 13 SNV01, 100 SNV03, 22 concurrency
and 3 SERIALIZABLE/retry checks. It ran with the accepted configuration before
removal and a fresh disposable numeric-template stack. The accepted configuration,
migrations, assertion inventory and existing native test sources stayed unchanged.
PGlite is separate synthetic in-memory evidence, not native assurance. No dependency
installation or hosted work occurred. The old fixed-allowlist foundation validator
is not claimed to accept the larger Sprint 01B manifest.

### Exact A05 changed paths and full Sprint 01B inventory

**Seven paths: six modified candidate files and one new test script.**

| Path | A05 change |
| --- | --- |
| `portal/portal.js` | Nonrenewable pending episode including authoritative recovery |
| `portal/README.md` | Current contract and reproduction instructions |
| `scripts/portal/test-coordination.mjs` | One obsolete renewal assertion updated; three adversarial cases added |
| `scripts/portal/test-replayed-pending-browser.mjs` | New sustained/replayed-pending native/browser regression and negative control |
| `docs/portal/AIEA_Portal_Sprint_01B_Independent_Adversarial_Audit_v1.0.md` | Appended third independent FAIL and supplied dispositions |
| `docs/portal/AIEA_Portal_Sprint_01B_Implementation_and_Validation_Report_v1.0.md` | Appended separated A05 evidence |
| `docs/portal/AIEA_Portal_Sprint_01B_Audit_Correction_Report_v1.0.md` | Appended this separated A05 evidence |

The full current Sprint 01B inventory is **24 paths: 3 modified baseline paths
and 21 new paths** (Section 9's 23 plus the new A05 browser script). All other
pre-A05 candidate files remain byte-identical, including server/Auth/quarantine,
original browser, A01/A02 and A04 browser tests, native fixtures, Vercel/environment
configuration and original plan. Prior audit/report contents remain exact prefixes.

### Five unchanged OPEN NOTES

Exactly **01B-A03, SNV02, SNV04, SNV05 and SNV06 remain OPEN NOTES**, with the
same meanings recorded in Section 6. No NOTE was fixed, removed, promoted or
demoted. A03 still records absent hosted Vercel rewrite/CDN/HTTPS-cookie assurance.
A05 is a MINOR correction candidate, not a sixth NOTE.

### Cleanup and repository state

Both disposable stacks were stopped with `stop --no-backup`; synthetic Auth/data,
sessions and mail were removed with their volumes. Final inspection found no
Docker containers or volumes, only default bridge/host/none networks, and no
listener on port 4321. Adapters and Chrome closed. Private CLI credentials,
issued-session JSON, raw startup logs and the copied project were removed.
An in-memory scan for saved credential values found no additional retained
matching files. Audit fault hooks/flags are absent. Existing tools/images and
prior validation directories were not altered or removed.

Sanitized logs/results/screenshots, saved pre-A05 public client/test sources and
hashes remain as ephemeral local evidence in the mode-700 private directory
`/var/folders/v7/9s2qngr52z798fdlhklzlhx40000gn/T/aiea-01b-a05-roccsgkx`.
Repository test sources and README provide reproduction instructions.

All **21 accepted baseline Supabase/architecture/evidence paths** remain
byte-identical. Frozen architecture SHA-256 remains
`f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755`.
Branch is `main`; HEAD, local `main` and cached `origin/main` remain
`0b9d4af280c05e128e07a15e4687b053082f9eea`. Index is empty. All 24 Sprint 01B
candidate paths remain unstaged/uncommitted. Nothing was staged, committed,
pushed or deployed. No hosted Supabase, Vercel or other provider setting changed.
No schema/RLS/migration, frozen architecture or accepted Sprint 01A evidence changed.
No Sprint 01C work began.

**STOP — A05 locally corrected candidate; Human Authority review and independent
re-audit required.** Re-audit should reproduce both sustained/replayed controls,
retained A01/A02/A04 sequences, fresh-authority rendering and the five unchanged
NOTES before determining Sprint 01B acceptance.
