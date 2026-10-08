# AIEA Portal — Sprint 01C A01 Independent Correction Re-audit v1.0

Date: 2026-10-08 (America/Chicago)  
Authority: Human Authority's focused 01C-A01 correction re-audit request.  
Repository: `/Users/dosfam/Desktop/AIEAcademy/Website/2.0`.

## 1. Disposition

**01C-A01 = CLOSED.** The original timer-triggered loss of an otherwise unchanged, authorized reading route is independently corrected. Private DOM clears at the periodic boundary, fresh context authorizes the same workspace, and a fresh exact-route curriculum GET resumes reading without navigation clicks. Repeated ticks coalesce.

**New finding: 01C-A02 — MINOR, OPEN, correction required before Sprint 01C acceptance.** The automatic-continuation authority comparison uses only the earlier context response. A relevant role or catalog-entitlement-set change made after that response but before the fresh curriculum request reaches the application is not reconciled before automatic display. Both independent native challenges reproduced automatic resumption despite the requested authority-change guard.

Open disposition: **BLOCKER 0; MAJOR 0; MINOR 1; inherited OPEN NOTE 5.** Closing the original finding does not accept the correction as a whole or Sprint 01C. No unauthorized curriculum disclosure, private-body cache restoration or product-domain write was demonstrated by the new finding. It is a continuation-policy and stale-context defect.

The original independent audit and historical FAIL remain byte-identical. This separate report records the later result without rewriting that history.

## 2. Independently verified correction delta

HEAD remains accepted Sprint 01B `3c2432749e0b265a5519dd8a099ea63a9cd1cd4f`; index is empty. Comparison used the original auditor's 175-file pre-audit hash ledger plus the recorded hash of the original audit report, rather than relying on the correction report's inventory.

Of those **176 pre-existing versionable files**, exactly four differ. Exactly one correction report was added:

| Repository-relative path | Independently observed correction |
| --- | --- |
| `portal/portal.js` | Sole production behavior change: transient route/authority metadata, periodic fresh-context comparison, fresh curriculum refetch and outstanding-request coalescing; explicit expired-context rejection |
| `scripts/portal/test-curriculum-client.mjs` | Extended deterministic client tests and pre-correction source selector |
| `scripts/portal/test-curriculum-browser.mjs` | Extended native-backed continuation, authority-denial and no-write probes |
| `portal/README.md` | Updated behavior and reproduction documentation |
| `docs/portal/AIEA_Portal_Sprint_01C_A01_Correction_and_Revalidation_v1.0.md` | Separate correction report |

All other original candidate, accepted baseline and governance bytes remain unchanged. The saved pre-correction production client was independently matched to the original auditor's `portal/portal.js` hash before use as a negative control.

Preserved original audit SHA-256:

`74c06328cbf39025201afbfb586358ad28ffe095f6fe064db5a9f9f276b5476d`

Preserved frozen architecture SHA-256:

`f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755`

Pre-re-audit inventory: **177 versionable files**, with 16 working changes relative to accepted HEAD: six modified baseline paths and ten new paths. This report is the auditor's sole repository addition, making 17 working changes: six modified and eleven new.

## 3. Negative control and falsification method

Read the requested correction report first, then inspected the actual production correction diff, both changed test sources, README delta and unchanged context/curriculum handlers. The original audit, architecture and accepted-regression bytes were checked independently.

Reran the checked-in positive regression against current source. Ran the identical targeted test against the hash-verified pre-correction source through `AIEA_PORTAL_CLIENT_SOURCE`. The old source fails specifically because the expected fresh curriculum GET is absent:

```text
fresh curriculum GET without a navigation click
5 !== 6
```

The current client passes that test. This distinguishes a working continuation correction from a test that merely accepts clearing or redisplays old bytes.

An external deterministic suite added 13 challenges to the 54 checked-in client tests: duplicate/reordered active billing bases; held context and curriculum JSON across hide, pagehide, pending, blur and workspace changes; independently changed title/body/reflection in the fresh response; and twenty repeated continuation episodes with held responses and repeated timer ticks. All 67 passed.

Native testing used a fresh copied loopback Supabase project with the existing numeric-template overlay, synthetic `@example.invalid` adults, unchanged migrations and existing publication/TOTP fixture helpers. Hosted/provider environments were not contacted. Existing installed Node, Supabase CLI, Chrome and Playwright were reused; nothing was installed.

The independent native falsification changed the timing tested by the candidate browser suite. Its authority-denial cases primarily mutate fixtures before the periodic context request performs native authorization. The new probe instead obtains a real successful context response, permits it to pass the client's comparison, holds the automatically issued curriculum request **before forwarding it to the application**, changes synthetic authority, then releases that fresh request. Thus both the native curriculum handler and its final checks execute after the change. This does not depend on revoking bytes after a completed curriculum response.

Evidence roots:

- `/private/tmp/aiea-01c-a01-independent-reaudit`
- `/var/folders/v7/9s2qngr52z798fdlhklzlhx40000gn/T/aiea-01c-a01-reaudit-stack-t8gfpgo7`

They are temporary evidence outside the repository, excluded from any candidate commit and not runtime dependencies.

## 4. Periodic-resumption verdict

**PASS for the original 01C-A01 trigger under unchanged authority.**

| Required behavior | Independent result |
| --- | --- |
| A. Periodic boundary performs fresh authorization | PASS: fresh `/api/portal/context?workspace_id=…`; native Auth/context/RLS remain real |
| B. Private curriculum clears while unresolved | PASS: empty title/instructions/reflection and hidden curriculum during both context and curriculum holds |
| C. Same workspace and unchanged authority resume exact route through fresh requests | PASS for catalog, program and mission; native mission request preserves selected workspace, exact version and mission |
| D. No cached private body/title/instructions/reflection restoration | PASS: retained state contains routing/authority metadata only; changed fresh-response text is the text rendered |
| E. No manual My Programs navigation solely due to timer | PASS: native mission returns without navigation clicks after context/refetch release |
| F. Repeated unresolved ticks do not duplicate/queue resumptions | PASS: held context and curriculum coalesce; twenty additional deterministic episodes passed |

The verified old-client negative control fails the exact original symptom, while current source passes. Therefore the original **01C-A01 is CLOSED**, independently of the separate new authority-change failure below.

## 5. Authority-change and stale-response verdict

**Newer-generation suppression and denial clearing: PASS. Full authority-change continuation guard: FAIL — 01C-A02.**

Checked-in and added client tests rejected held responses/JSON across workspace/session/coordination/signout/expiry/hide/blur/page transitions. They also discarded continuation for changed role, kind, selected workspace, session expiry, relevant entitlement or catalog version set observed in the fresh context response. Context/curriculum errors do not restore old instructional bytes or retain an automatic route for later retry.

The independently timed native probe produced these results. Every case began with successfully displayed curriculum, a real periodic context 200, and cleared private curriculum while unresolved. Each fixture change happened after that context response but before the fresh curriculum request was forwarded to the application:

| Change before fresh curriculum application request | Fresh curriculum status | Automatic display | Required negative challenge |
| --- | --- | --- | --- |
| Exact-version entitlement SUSPENDED | 404 | No | PASS |
| Exact-version entitlement REVOKED | 404 | No | PASS |
| Selected membership INACTIVE | 403 | No | PASS |
| Selected membership REVOKED | 403 | No | PASS |
| Selected workspace INACTIVE | 403 | No | PASS |
| Adult profile INACTIVE | 403 | No | PASS |
| Valid SCHOOL membership TEACHER → SCHOOL_ADMIN | 200 | **Yes, mission** | **FAIL** |
| Catalog's ACTIVE exact-version set expands | 200 | **Yes, catalog** | **FAIL** |

The last two cases retain valid native curriculum-read permission, which explains the 200 responses. The failure is specifically the requested rule that relevant authority/catalog-set changes must cancel automatic continuation. It is not a finding that SCHOOL_ADMIN should be denied curriculum access or that newly active entitlements should be hidden during an explicit new navigation.

Native signed-out/expired-session refusal, pending-signout quarantine and earlier-generation clearing passed in the retained regression groups. These do not establish atomic revocation of already delivered bytes or change SNV06. The two failures above occur before the application's fresh curriculum read and are more specific than that inherited limitation.

## 6. New finding 01C-A02

| Field | Finding |
| --- | --- |
| ID | **01C-A02** |
| Severity / status | **MINOR — OPEN** |
| Exact affected production path | `/Users/dosfam/Desktop/AIEAcademy/Website/2.0/portal/portal.js` |
| Relevant locations | Lines 138–140 capture context authority; lines 154–159 compare that earlier snapshot and launch continuation; lines 196–230 accept/render fresh curriculum and retain the earlier context authority without reconciling subsequent role/catalog-set changes |
| Root cause | Authority is compared at the context step, but automatic display is allowed after the later curriculum read without reconciling changes that occurred between those steps. Generation/workspace checks do not change when server-side role or entitlement-set metadata changes without a browser signal. |
| Product/private-state impact | Continuation occurs under changed authority contrary to the requested guard. The mission case also displays the earlier Teacher role while the native membership is SCHOOL_ADMIN. The catalog case displays a newly active version while the earlier summary still marks that version SUSPENDED. |
| Security qualification | Fresh, currently entitled curriculum is returned; no cross-workspace disclosure, revoked-version access, old-body cache restoration, credential persistence or product write was demonstrated. This is not classified as MAJOR. |
| Required before acceptance | **YES.** Human Authority ruling and a bounded correction/re-audit are required; no production correction was made here. |

### Reproduction: valid role change

1. Sign in as the synthetic adult with a SCHOOL/TEACHER membership. Open that school's entitled exact-version mission.
2. At the periodic boundary, fetch and hold the actual successful native context response. Confirm private curriculum is cleared.
3. Release context; hold the automatically issued exact mission GET before forwarding it to the application.
4. Through the disposable test operator, change that same active school membership to `SCHOOL_ADMIN`. Verify the row's role before releasing the held GET.
5. Release the request. Native curriculum authorization and final checks now execute against SCHOOL_ADMIN and return 200.
6. Observe automatic mission display without navigation, with the earlier Teacher context still displayed. Expected by the requested guard: cancel this automatic continuation.

### Reproduction: catalog set change

Use the same sequence while reading the catalog. After successful context, activate the school's existing SUSPENDED synthetic version entitlement before the fresh catalog GET reaches the application. The new GET returns the newly expanded valid catalog, and the client automatically displays it. The screenshot shows that version in My Programs while the earlier workspace summary still says SUSPENDED. Expected by the requested catalog-set guard: cancel this automatic continuation.

Preserved falsification source: `/private/tmp/aiea-01c-a01-independent-reaudit/browser-authority-transition.mjs`.

Native evidence in the second root above:

- `browser-authority-transition.log`
- `independent-authority-results.json`
- `independent-authority-7.png`
- `independent-authority-8.png`

Preserved final failed assertions/observations:

```text
FAIL valid SCHOOL role TEACHER to SCHOOL_ADMIN after context; context=200 curriculum=200 resumed=true
FAIL catalog ACTIVE exact-version set expands after context; context=200 curriculum=200 resumed=true
```

Both screenshots were visually inspected. Fixture changes were restored in `finally` and later removed with the entire disposable stack. They were test-operator operations, not Portal behavior.

The first independent browser attempt stopped at an audit-harness expectation that curriculum adult-profile 403 would redirect. The accepted curriculum client instead clears and displays denial. That expectation was corrected without changing production. Its initial log is retained as `browser-authority-transition-initial-harness-fail.log`; it is not a production finding. The final complete probe reports six passing denials and the two genuine continuation failures above.

## 7. Relevant regression results

Counts overlap; mocked, native and browser evidence are distinct and must not be summed as unique scenarios.

| Freshly executed group | Result |
| --- | --- |
| Accepted 01B mocked runtime, including failed-signout contracts | 73 leaf checks PASS |
| Accepted 01B deterministic A02/A04/A05 coordination | 16 PASS |
| 01C mocked curriculum handlers | 50 leaf checks PASS |
| Corrected 01C actual-client suite | 54 PASS |
| Combined checked-in Node run | 195 PASS entries: 193 leaf checks/tests plus two parents |
| Independent extended client suite | 67 PASS: 54 checked-in plus 13 added |
| Verified pre-correction client negative control | One expected FAIL: missing automatic fresh GET |
| Accepted native 01B numeric/runtime/signout | 70 PASS |
| Accepted original 01B Chrome | 20 PASS |
| Accepted A01/A02 native/browser | 20 PASS |
| Accepted A04 native/browser | 27 PASS |
| Accepted A05 native/browser | 16 PASS |
| Unchanged 01C native Auth/PostgREST/RLS/handler | 44 PASS |
| Corrected 01C native-backed Chrome | 37 PASS |
| Independently timed native authority-transition probe | **Six PASS; two FAIL — 01C-A02** |
| Syntax / whitespace | Three changed JavaScript sources parse; `git diff --check` PASS |

A01/A02/A04/A05 accepted regression sources were unchanged. Their native/browser sequences retain pending-signout quarantine/retry/replay, cross-adult coordination, lost-completion recovery and sustained/replayed-pending protections. No broader 01A investigation was claimed rerun during this focused re-audit; its source/configuration/evidence remain unchanged.

## 8. No-write and repository-boundary verdicts

**No-write: PASS within the inspected code and exercised browsing sequences.**

Freshly rerun browser operator snapshots of all **28 Portal tables** were identical before successful navigation/continuation and after the fresh mission response. Snapshot SHA-256 before and after:

`694999ed5eafc7149d88cec0fcf56edda1c686964207c60d4062afcf76bb2b05`

The ten learner/cohort/delivery/progress/assessment/evidence/feedback tables also remained unchanged across the candidate's adversarial browser sequence and unchanged native curriculum suite. No domain mutation request or script error was observed by the rerun browser suite. The correction adds only GET-based continuation; its production delta adds no write capability.

Fixture publication/provisioning, deliberate authority transitions and restoration are separate synthetic operator writes. Equality of all 28 tables is claimed for the successful browsing/continuation interval, not across those deliberate operator mutations.

**Narrow repository/scope boundary: PASS.** Only the single client file changes production behavior in the correction. No schema/migration/RLS/grant, dependency/framework, provider configuration, persistent credentials, private curriculum body cache, persistent route/session mechanism, architecture change or Sprint 01D scope was introduced. `contextAuthority`/`readingContext` hold transient route IDs, workspace kind/role, expiry and active-version IDs; their fields contain no curriculum body or credential. Existing clearing paths invalidate them.

All accepted 01A/01B evidence and tests, frozen architecture, curriculum handlers/read model, local adapter, configuration and unrelated website/commerce bytes remain unchanged. The new finding concerns the behavior of the permitted correction, not an out-of-scope repository expansion.

## 9. Exact findings and five inherited NOTES

| ID | Severity / disposition | Evidence / impact | Acceptance action |
| --- | --- | --- | --- |
| 01C-A01 | Original MINOR — **CLOSED** | Hash-verified old client fails; corrected actual client/native browser resume the exact route through fresh requests and coalesce ticks | Original timer-loss defect independently closed; historical FAIL unchanged |
| 01C-A02 | **MINOR — OPEN, new** | `portal/portal.js`; two native between-request authority transitions resume automatically despite changed role/catalog set | **Correction required before acceptance; Human ruling first** |
| 01B-A03 | NOTE — OPEN, inherited | `vercel.json`, `scripts/portal/serve-local.mjs`, accepted 01B acceptance evidence; local results do not establish hosted rewrite/CDN/HTTPS-cookie behavior | Unchanged |
| SNV02 | NOTE — OPEN, inherited | `supabase/config.toml`, accepted SNV01/SNV03 evidence; accepted inbucket configuration is deprecated | Unchanged |
| SNV04 | NOTE — OPEN, inherited | `supabase/config.toml`, accepted SNV03 evidence; current refresh-chain cascade invalidation remains unproven | Unchanged |
| SNV05 | NOTE — OPEN, inherited | `supabase/config.toml`, accepted SNV01 evidence; same-site redirect/path behavior does not establish exact-path-only native callback guarantees | Unchanged |
| SNV06 | NOTE — OPEN, inherited | `supabase/migrations/20261006000200_portal_security.sql`, `lib/portal/runtime.js`, accepted SNV03 evidence; ordinary stateless Data API/RLS may accept an unexpired signed-out JWT; Portal Auth and current-session/TOTP gates remain distinct | Unchanged |

Exactly these five inherited NOTES remain OPEN with their accepted meanings/severities. None was resolved, removed or reclassified. No new NOTE was substituted for the new MINOR defect.

## 10. Cleanup and final state

The disposable numeric stack was stopped with `stop --no-backup`; its containers, volumes, synthetic Auth/database/mail/session data and copied project were removed. Generated CLI credentials, fixture-reference JSON and raw startup/status credential logs were removed. Adapters and Chrome closed through cleanup paths. Final Docker inspection found no containers or volumes and only default `bridge`, `host`, `none` networks. No port-4321 listener remained.

Sanitized logs/results, screenshots, verified old public source, temporary test/orchestration sources, correction diff, snapshot digest and source-hash ledgers remain outside the repository. A bounded retained-text scan found no complete signed JWT, secret-key literal or TOTP URI. Existing installed tools/images, the original audit/failing evidence and unrelated historical evidence directories were preserved.

The auditor's sole repository write is this report. All **177 pre-existing versionable files** retain their pre-re-audit SHA-256 values. HEAD remains accepted Sprint 01B; index remains empty. Nothing was staged, committed, pushed, deployed, configured on a hosted/provider environment, corrected in production or begun for Sprint 01D.

**Final disposition: 01C-A01 = CLOSED; 01C-A02 = MINOR / OPEN. STOP for Human Authority ruling and correction review.**

FAIL — correction required before Sprint 01C acceptance
