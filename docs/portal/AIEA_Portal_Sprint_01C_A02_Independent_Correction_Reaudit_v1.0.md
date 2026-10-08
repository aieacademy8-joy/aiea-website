# AIEA Portal — Sprint 01C A02 Independent Correction Re-audit v1.0

Date: 2026-10-08.  
Authority: Human Authority's focused 01C-A02 independent correction re-audit request.  
Baseline HEAD: `3c2432749e0b265a5519dd8a099ea63a9cd1cd4f` (accepted Sprint 01B).  
Execution: actual production client, independent deterministic challenges, and disposable loopback Supabase/native Chrome. Production code was not modified.

## 1. Disposition

**01C-A02 = CLOSED. 01C-A01 remains CLOSED.**

The preserved pre-A02 client independently reproduces both original native failures. The corrected client prevents stale automatic display after the same between-request role and catalog-set changes, reconciles the authoritative summary, and permits valid explicit fresh navigation. An additional native challenge changes authority after a successful curriculum response but before the final context request reaches the application; the corrected client also suppresses automatic display there.

Unchanged authority still resumes the exact reading route through fresh curriculum and final context requests without navigation clicks. Private curriculum fields stay cleared while either is unresolved, and repeated timer ticks coalesce.

Current findings: **BLOCKER 0; MAJOR 0; MINOR 0; inherited OPEN NOTE 5.** No new defect was found in this focused re-audit. This disposition does not itself constitute Human Authority acceptance or repository-boundary approval. Both historical FAIL reports remain unchanged.

## 2. Independently verified correction delta

Read `AIEA_Portal_Sprint_01C_A02_Correction_and_Revalidation_v1.0.md` first. Compared current repository bytes with the independent A01 re-audit's pre-audit hash ledger, supplemented by the recorded hash of its report. This establishes a prior inventory of 178 versionable files independently of the implementation report.

Exactly four prior files changed; one implementation correction report was added. The other 174 prior files are unchanged.

| Path | Independently inspected delta |
| --- | --- |
| `portal/portal.js` | Sole production correction: shared transient authority comparison; final fresh context read before automatic display; response route/session/set reconciliation; mismatch discards automatic continuation and refreshes summary; periodic coalescing includes that summary refresh |
| `scripts/portal/test-curriculum-client.mjs` | Expanded actual-client deterministic regressions |
| `scripts/portal/test-curriculum-browser.mjs` | Expanded native browser/reconciliation challenges |
| `portal/README.md` | Correction behavior and validation documentation |
| `docs/portal/AIEA_Portal_Sprint_01C_A02_Correction_and_Revalidation_v1.0.md` | Added implementation correction report |

Reviewed the complete production delta and relevant unchanged Auth/context/curriculum handlers. Final reconciliation checks current generation/workspace after fetch and JSON, expiry, workspace kind, membership role, exact-version authority (or catalog ACTIVE set), curriculum route IDs, and curriculum/context expiry agreement. A valid mismatch requests an ordinary fresh summary with no automatic route. No instructional text is copied into the continuation snapshot.

Preserved SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| Original independent audit | `74c06328cbf39025201afbfb586358ad28ffe095f6fe064db5a9f9f276b5476d` |
| A01 independent correction re-audit | `f32486d3aa6d5d2a234922b6882f021535703d90a79e4478b5adcb8334eb95bb` |
| Frozen P0 architecture/data contract | `f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755` |
| Independently verified pre-A02 production client | `ca94e5e9b0cc8244ac4e546f5dbfc53b9548b6fd269d548389554ea3c2a14144` |

## 3. Independent falsification and negative controls

The saved pre-A02 client was matched to the **prior independent auditor's** client hash before testing. It was injected as the browser's client resource while all local handlers, Auth, PostgREST and RLS remained native and current. The original independent eight-case probe was copied into a new evidence directory; original evidence was not overwritten.

The timing was:

1. Open a synthetic authorized mission, or school catalog.
2. Obtain a successful periodic native context response and let the client accept it.
3. Hold the newly automatic curriculum request **before forwarding it to the application**.
4. Change and independently query the synthetic server authority.
5. Release the request and observe display behavior.

The pre-A02 source returned six passing denial controls and exactly two expected failures:

| Original timing / pre-A02 source | Native result |
| --- | --- |
| Exact entitlement SUSPENDED / REVOKED | Curriculum 404; no resume |
| Membership INACTIVE / REVOKED; workspace INACTIVE; adult INACTIVE | Curriculum 403; no resume |
| SCHOOL TEACHER → SCHOOL_ADMIN | Context 200, curriculum 200, **automatic mission resumed under stale Teacher context** |
| Catalog ACTIVE exact-version set expands | Context 200, curriculum 200, **catalog automatically resumed under stale earlier entitlement summary** |

Two independent deterministic role/catalog controls also fail on that source and pass on current source. The preserved pre-A01 source was separately matched to the original audit ledger and fails the retained regression at the expected missing fresh GET (`5 !== 6`). These expected failures are negative-control evidence, not failures of the final candidate.

## 4. Original A02 timing and final reconciliation results

The independent corrected-client native probe repeated all eight transitions at two boundaries: before curriculum application processing, and after a completed native curriculum 200 but before final context application processing. It passed **84 assertions**, including direct database confirmation of each synthetic change, private-field clearing, native statuses, final summary and explicit navigation.

| Authority transition | Before curriculum processing | After curriculum 200, before final context processing |
| --- | --- | --- |
| Exact entitlement SUSPENDED / REVOKED | Curriculum 404; no automatic display | Final context 200 reflects changed entitlement; response discarded; no automatic display |
| Membership INACTIVE / REVOKED | Curriculum 403; no automatic display | Final context 403; no automatic display |
| Workspace INACTIVE | Curriculum 403; no automatic display | Final context 403; no automatic display |
| Adult INACTIVE | Curriculum 403; no automatic display | Final context 403; no automatic display |
| TEACHER → SCHOOL_ADMIN | Curriculum and final context 200; no automatic mission display; summary becomes School administrator | Same corrected behavior |
| Catalog ACTIVE set expands | Curriculum and final context 200; no automatic catalog display; summary reflects newly ACTIVE version | Same corrected behavior |

For both role-transition timings, School administrator remained authorized and explicit fresh catalog/program/mission navigation opened the mission. For both catalog timings, explicit fresh My Programs navigation included newly ACTIVE Synthetic 01C 7. The correction does not falsely classify those valid transitions as unauthorized.

The final-context hold was observed before release: title, instructions, reflection and curriculum list remained empty. Assertions waited through reconciliation and any summary refresh, rather than treating an empty intermediate frame as a completed result.

**Original A02 timing: PASS. Final reconciliation: PASS.**

## 5. Unchanged authority and retained A01

The independent native control held completed periodic context, fresh curriculum and final context separately. At every held phase it advanced three more periodic boundaries and verified that no duplicate request or private display appeared. The automatic curriculum GET retained the selected school, exact version and mission IDs. Only release of the successful final context permitted the freshly fetched mission to display; no intervening navigation click occurred.

The checked-in deterministic regression also repeats the original A01 trigger: open reading at 29.999 seconds and cross the timer boundary one millisecond later. It now resumes fresh instructions after final reconciliation. Catalog and program route continuation, changed fresh title/body/reflection, and summary-refresh coalescing regressions pass.

Inspection confirms that `readingContext` contains route/authority metadata only. Clearing empties private DOM and invalidates the curriculum generation. The fresh response held in its outstanding async request is never used to restore a superseded generation. No private-body cache or persistent route/session store was introduced.

**01C-A01 remains CLOSED.**

## 6. Authority, stale-response and failure challenges

Added 56 independent actual-client deterministic tests outside the repository, using controlled DOM/clock and held fetch/JSON boundaries. These include the cross-product of three phases (context, curriculum, final reconciliation), response/JSON holds, and eight invalidations (workspace change, pending coordination, revalidation coordination, signout, pagehide, hidden document, blur, expiry). Every obsolete reply was released afterward; none restored private fields or launched an obsolete continuation.

Additional independent checks cover timer coalescing during JSON holds at every phase, malformed JSON at every phase, and mismatching version/mission response IDs. All 56 passed. Two separately authored original role/catalog challenges pass against current source.

Retained/current client tests further exercise changed workspace kind, role and session expiry; expired final context; final 401 including pending-signout, 403 and 503; fresh context/curriculum failures; catalog response/final-set disagreement including a reverted set; and duplicate/reordered ACTIVE billing bases. Fresh title/instructions/reflection remain undisplayed until reconciliation and then replace old bytes.

Native accepted/runtime/curriculum/browser groups verify signed-out and correctly signed expired session refusal, pending-signout quarantine/retry/replay, current Auth/profile validation, selected-workspace RLS restrictions and old-workspace suppression. The native browser signout control invalidates an open route without a coordination signal. Final-boundary signout/expiry and coordination are additionally challenged deterministically.

**Authority-change, stale-response and fail-closed verdict: PASS.** This is a fresh-read/generation guarantee, not a claim of transactional revocation after the final authoritative read or recall of already delivered bytes. It does not alter the inherited SNV06 limit.

## 7. Regression results

Counts overlap and are not a unique-scenario total. Tests were executed afresh against current source and synthetic loopback fixtures.

| Group | Result |
| --- | --- |
| Accepted mocked runtime, including A01 | 73 behavioral checks PASS |
| Accepted deterministic A02/A04/A05 coordination | 16 tests PASS |
| Sprint 01C mocked curriculum handler/security | 50 behavioral checks PASS |
| Current actual-client lifecycle, retained A01 and A02 | 82 tests PASS |
| Combined checked-in Node run | 223 PASS entries: 221 leaf checks/tests and two parent containers |
| Additional independent actual-client stale-response/failure suite | 56 PASS |
| Independent original role/catalog controls, current source | 2 PASS |
| Accepted native 01B runtime/Auth | 70 checks PASS |
| Accepted original browser | 20 checks PASS |
| Accepted A01/A02 native/browser sequence | 20 checks PASS |
| Accepted A04 missing-completion recovery | 27 checks PASS |
| Accepted A05 sustained/replayed pending | 16 checks PASS |
| Sprint 01C native curriculum/Auth/PostgREST/RLS | 44 checks PASS |
| Current Sprint 01C native-backed browser | 52 checks PASS |
| Independent corrected-client native two-boundary probe | 84 assertions PASS |
| Hash-verified pre-A02 native negative control | Six denials PASS; two expected historical failures reproduced |
| Hash-verified pre-A02 deterministic negative control | Two expected failures reproduced |
| Hash-verified retained pre-A01 negative control | Expected missing-fresh-GET failure reproduced |

**Accepted A01/A02/A04/A05 regression verdict: PASS.** Their sources/assertions are unchanged. Relevant Auth, expiry, quarantine and security checks were rerun through the groups above. Broader foundation/SNV01 email/SNV03 staff investigations were not rerun in this focused client correction audit; their source/configuration and historical evidence remain unchanged.

Chrome clock/focus/coordination delivery is controlled. Successful native responses and authority transitions are real local operations; the existing unavailable-display test injects its named 409. Local tests do not establish hosted delivery or operating-system scheduling guarantees.

## 8. No-write verdict

**PASS.** The independent native unchanged-authority control compared ordered full-row snapshots of all **28 Portal tables** before browsing continuation and after automatic display; every table was unchanged.

The freshly rerun checked-in browser suite independently recorded the same all-28 equality with SHA-256 before and after:

`56c6c496629d3afc073583d09cd159fc713d3b9cae6b2be8ebb40744c2f3275d`.

Its ten learner/cohort/delivery/progress/assessment/evidence/feedback tables also remained unchanged through the adversarial sequence. Native curriculum tests retain their learning-table no-write check. Browser monitoring found no domain-mutation requests or script errors. The production correction adds a GET-only context read and no write capability.

Synthetic fixture provisioning and deliberate operator authority mutations/restoration are separate from browsing; the all-28 equality claim covers the successful navigation/resumption control.

## 9. Scope and repository boundary

**PASS for the authorized narrow correction.** Independent prior-ledger comparison establishes that production behavior changed only in `portal/portal.js`. No schema, migration, RLS, grant, dependency/framework, provider configuration, persistent credential, private curriculum cache, persistent route/session mechanism, frozen architecture or Sprint 01D change was introduced. Accepted handlers, local adapter, Auth/security source and unrelated website/commerce bytes are unchanged by A02.

Before this report there were 179 versionable files and 18 unstaged/untracked paths. All 179 pre-existing hashes remained unchanged throughout the re-audit. This report is the sole repository addition, making 19 working paths: six modified baseline paths and thirteen new paths. HEAD and branch `main` remain unchanged; index is empty. No staging, commit, push, deployment or self-acceptance occurred.

## 10. Exact findings and inherited notes

| ID | Current disposition | Evidence / retained meaning |
| --- | --- | --- |
| 01C-A01 | Original MINOR — CLOSED, retained | Fresh exact-route resumption without clicks; repeated ticks coalesce; old-client missing-GET negative control preserved |
| 01C-A02 | Original MINOR — CLOSED by this independent re-audit | Both original native role/catalog failures reproduced on verified old source; corrected native two-boundary and actual-client challenges pass |
| 01B-A03 | NOTE — OPEN, inherited | Local proof does not establish hosted rewrite/CDN/HTTPS-cookie behavior |
| SNV02 | NOTE — OPEN, inherited | Accepted inbucket configuration is deprecated in the tested CLI |
| SNV04 | NOTE — OPEN, inherited | Current refresh-chain cascade invalidation remains unproven |
| SNV05 | NOTE — OPEN, inherited | Same-site native redirect/path behavior does not establish exact-path-only callback guarantees |
| SNV06 | NOTE — OPEN, inherited | Ordinary stateless Data API/RLS may accept an unexpired signed-out JWT; Portal Auth validation and privileged current-session/TOTP gates remain distinct |

Exactly these five inherited notes remain OPEN with their accepted classifications and meanings. No new BLOCKER, MAJOR, MINOR or NOTE was identified. Historical FAIL evidence and prior finding dispositions were not rewritten.

## 11. Cleanup and evidence

Used a fresh copied disposable Supabase project, existing unchanged migrations and copied-project-only numeric email-template overlay. Synthetic adults use `@example.invalid`. Application/Auth/PostgREST requests targeted loopback; browser routing rejected other destinations. No hosted/provider environment was contacted or modified. Existing installed tools/images were reused; no dependency installation occurred.

Stopped the stack with `stop --no-backup`. Removed the copied project, generated credential/fixture-reference JSON and raw startup/status credential logs. Adapters and Chrome closed. Final inspection found no Docker containers or volumes, only default `bridge`, `host`, `none` networks, and no port-4321 listener. A bounded scan of retained evidence text found no complete JWT, secret-key literal or TOTP URI. Previous evidence directories were left intact.

New evidence outside the repository:

- `/private/tmp/aiea-01c-a02-independent-reaudit`: pre-re-audit hash ledger, independent production diff, verified pre-A02 client, independent client/native probe sources, checked-in Node output, deterministic negative controls and retained A01 negative control.
- `/var/folders/v7/9s2qngr52z798fdlhklzlhx40000gn/T/aiea-01c-a02-reaudit-stack-ol0sm9hs`: fresh native/browser regression logs, independent positive/negative logs and JSON, negative-control screenshots, synthetic browser screenshots and no-write digest. Credential files and copied project were removed.

Key evidence: `checked-node.log`, `independent-client.log`, `current-original-challenges.log`, `negative-client.log`, `retained-a01-negative.log`, `production-a02.diff`, `independent-negative.log`, `negative-authority-results.json`, `independent-positive.log`, `independent-positive-results.json`, `portal-entry.log`, `portal-audit.log`, `portal-pending.log`, `portal-replayed.log`, `curriculum-native.log`, `curriculum-browser.log`, and `curriculum-a01-no-write.json`.

**Final disposition: 01C-A02 = CLOSED; 01C-A01 remains CLOSED. STOP.**

PASS — 01C-A02 independently closed; 01C-A01 remains closed; Sprint 01C ready for final Human Authority acceptance/repository-boundary review
