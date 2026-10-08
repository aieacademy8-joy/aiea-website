# AIEA Portal — Sprint 01C A02 Correction and Revalidation v1.0

Date: 2026-10-08 (America/Chicago)

Authority: Human Authority ruling accepting **01C-A02 = MINOR, correction required before Sprint 01C acceptance**, authorizing this bounded correction, and requiring preservation of independently closed **01C-A01**.

Baseline HEAD: accepted Sprint 01B `3c2432749e0b265a5519dd8a099ea63a9cd1cd4f`, with the existing uncommitted Sprint 01C candidate, A01 correction and independent reports.

Disposition: **A02 correction candidate validated; STOP for Human Authority review. No self-acceptance.** A01's independently established closure is retained. Neither independent report nor either historical FAIL was edited.

## 1. Root cause

A01 compared the reading route's transient authority snapshot with a successful periodic context response, then requested fresh curriculum. It accepted a later curriculum 200 without reconciling context again. A valid server-side role transition or catalog ACTIVE-version-set expansion could occur after context was accepted but before that curriculum request reached the application. Native curriculum authorization correctly permitted the new role/set, but the client automatically displayed the response with the earlier workspace summary and continuation metadata.

No browser generation change accompanies those server-side transitions. Existing generation checks and curriculum authorization therefore did not detect this continuation-consistency defect. This was not unauthorized curriculum access.

## 2. Exact correction

The sole production change is in `portal/portal.js`:

1. Extract the existing authority projection/comparison into shared helpers. The projected fields remain selected workspace identity/kind, membership role, session expiry and deduplicated/sorted ACTIVE exact-version IDs. Detail continuation checks the selected exact version; catalog continuation checks the complete ACTIVE set.
2. Pass the transient resume metadata only to automatic periodic curriculum loading. Explicit navigation retains its existing fresh authorized request path.
3. After a successful fresh automatic curriculum response, issue **one additional fresh selected-workspace context GET before displaying any curriculum field**. Both requests use `cache: 'no-store'`. The reconciliation uses the curriculum request's abort signal and checks current session/curriculum generations and selected workspace before and after response JSON.
4. Reject denied, pending-signout, expired, failed or superseded reconciliation. Compare the original continuation authority against the final authoritative context. Curriculum session expiry must agree with that context. Detail responses must identify the requested version/mission; a catalog response's complete exact-version set must equal the final ACTIVE set. The latter also rejects an expanded response if the entitlement set has reverted before reconciliation.
5. On a valid context mismatch, discard the automatic response and call the existing workspace loader **without a resume route**. This bounded summary refresh removes stale Teacher/entitlement metadata without declaring SCHOOL_ADMIN unauthorized or hiding newly ACTIVE versions from explicit fresh navigation. It does not retry the curriculum automatically.
6. If context remains consistent, display only the freshly received curriculum. The existing periodic request marker stays active through reconciliation and the single ordinary summary refresh after a valid mismatch, so repeated ticks coalesce. That refresh carries an explicit periodic flag without a resume route. Existing clear/abort/generation/signout/pending-recovery paths remain in force.

The unchanged-authority sequence is now: periodic context → fresh exact-route curriculum → fresh context reconciliation → automatic display. A valid mismatch may add one ordinary summary refresh, with no recursive continuation or polling loop. The freshly received response exists only within its in-flight async operation pending reconciliation; it is never saved as a private cache or used to restore old curriculum bytes.

This is a bounded authoritative reconciliation, not a transactional database snapshot or an atomic revocation guarantee for changes after the final read. It closes the reproduced between-request timing. No server/API contract, schema, migration, RLS/grant, dependency/framework, provider/hosted configuration, persistent route/credential/refresh mechanism, frozen architecture or Sprint 01D work was introduced.

## 3. Exact changed-path delta

Relative to the pre-A02 candidate, exactly **five paths** comprise this correction:

| Repository-relative path | Delta |
| --- | --- |
| `portal/portal.js` | Shared comparison and final bounded context reconciliation before automatic display |
| `scripts/portal/test-curriculum-client.mjs` | Retained A01 regression with final reconciliation; A02 timing, failure, generation, content-set and fresh-byte checks |
| `scripts/portal/test-curriculum-browser.mjs` | Native between-request authority transitions, final reconciliation hold/coalescing and explicit-navigation proof |
| `portal/README.md` | Current bounded reconciliation behavior and test execution evidence limits |
| `docs/portal/AIEA_Portal_Sprint_01C_A02_Correction_and_Revalidation_v1.0.md` | This separate report |

A pre-edit SHA-256 ledger covered 178 versionable files. Only the first four above changed; **174 pre-existing files remain byte-identical**. This report is the sole additional file. Accepted A01/A02/A04/A05 regression sources, Auth/context/curriculum handlers, curriculum read model, local adapter, initial implementation evidence, A01 correction report, both independent reports, frozen architecture, migrations/configuration and unrelated website/commerce files retain their pre-A02 bytes.

Preserved SHA-256 values:

- Original independent audit: `74c06328cbf39025201afbfb586358ad28ffe095f6fe064db5a9f9f276b5476d`.
- Independent A01 correction re-audit: `f32486d3aa6d5d2a234922b6882f021535703d90a79e4478b5adcb8334eb95bb`.
- A01 correction/revalidation report: `65b1bdd77021ab087213a2402cb6ff7133d59440c56c372c8a17a97c5dd4a3df`.
- Frozen architecture: `f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755`.

## 4. Between-request negative control

Before production edits, saved the exact pre-A02 `portal.js` and ran a separate copy of the independent native falsification against it on fresh disposable fixtures. For each case: obtain native periodic context 200 → release it for client acceptance → hold the automatic curriculum request before forwarding to the application → change synthetic authority → release the request.

Preserved results:

```text
PASS exact entitlement suspended after context; context=200 curriculum=404 resumed=false
PASS exact entitlement revoked after context; context=200 curriculum=404 resumed=false
PASS selected membership inactive after context; context=200 curriculum=403 resumed=false
PASS selected membership revoked after context; context=200 curriculum=403 resumed=false
PASS selected workspace inactive after context; context=200 curriculum=403 resumed=false
PASS adult inactive after context; context=200 curriculum=403 resumed=false
FAIL valid SCHOOL role TEACHER to SCHOOL_ADMIN after context; context=200 curriculum=200 resumed=true
FAIL catalog ACTIVE exact-version set expands after context; context=200 curriculum=200 resumed=true
```

The checked-in A02 role/catalog timing tests also fail against that saved client through `AIEA_PORTAL_CLIENT_SOURCE`: two expected FAILs at stale automatic display. They pass against the corrected client. The original pre-A01 source still fails the retained missing-fresh-GET regression; its original source/output were left untouched, and the supplementary rerun output was saved only in the new A02 evidence directory.

Negative-control source, native observations/screenshots and test output are separate from both independent auditors' historical evidence. Neither original FAIL was overwritten or erased.

## 5. Native role/catalog results and retained A01 behavior

The final native Chrome sequence reproduces the same timing as the independent challenge, using real local Auth/PostgREST/RLS/handlers. Authority changes occur after successful context is accepted and while the new curriculum request is held **before application processing**.

| Challenge | Final corrected result |
| --- | --- |
| SCHOOL TEACHER → SCHOOL_ADMIN | Curriculum remains correctly authorized (200). Final context detects the role change; no automatic title/instructions/reflection is displayed. The refreshed summary says School administrator. Explicit fresh navigation opens the mission successfully. |
| Catalog ACTIVE exact-version set expands | Fresh catalog remains correctly authorized (200). Final context detects the expanded set; no automatic catalog display occurs under the old summary. The refreshed entitlement summary says ACTIVE; explicit fresh My Programs navigation includes the newly ACTIVE version. |
| Unchanged entitled mission, A01 trigger | Private DOM clears at the timer boundary. Fresh exact workspace/version/mission GET and final context succeed. Mission reading resumes without a navigation click. |
| Final reconciliation held | Title/instructions/reflection remain empty even though the fresh mission response has arrived. Repeated timer ticks issue no duplicate continuation. Release permits display only after native context succeeds. |

Deterministic actual-client tests additionally verify catalog/program continuation, changed fresh title/body/reflection, catalog response/final-set disagreement, session-expiry disagreement and duplicate ACTIVE billing bases. Only new response text appears after reconciliation; no private-cache restoration occurs.

## 6. Authority, denial and stale-response adversarial results

| Boundary | Evidence / result |
| --- | --- |
| Exact-version entitlement SUSPENDED or REVOKED after context | Native fresh curriculum 404; no resume. Deterministic reconciliation also cancels if those changes occur after a curriculum 200. |
| Membership INACTIVE or REVOKED after context | Native 403; no resume. |
| Selected workspace INACTIVE after context | Native 403; no resume. |
| Adult profile INACTIVE after context | Native 403; no resume. Earlier periodic-context profile denial/cookie clearing is retained too. |
| Signout / session expiry | Native out-of-band signout makes periodic Auth/context return 401; no resume. Unchanged native curriculum suite rejects signed-out and correctly signed expired sessions. Deterministic final reconciliation checks 401/pending-signout, expired context and expiry while held. |
| Workspace identity/kind, membership role or relevant session expiry changes | Shared comparison cancels automatic display; deterministic cases. Native role transition independently confirms valid-role behavior. |
| Workspace change, new session/curriculum generation, blur, pagehide or hidden document | Held context/curriculum/reconciliation responses and JSON cannot restore the old route. Deterministic coverage includes events at the new final boundary; native old-workspace response suppression remains passing. |
| Pending-signout / cross-window coordination | Cleared state and quarantine retained; superseded responses cannot resume. Accepted A01/A02/A04/A05 native/browser and deterministic regressions pass. |
| Repeated periodic ticks | Coalesced while context, curriculum or final reconciliation is outstanding. Subsequent successful episodes and sustained pending recovery remain correct. |
| Reconciliation failure / denial | No title/body/reflection restored; existing truthful failure, denied, expired and pending-signout behavior retained. |

## 7. Regression results and execution limits

Counts overlap; do not add them into a unique-scenario total. Final foundation/client/runtime/browser groups passed with the corrected candidate. The native foundation checks execute unchanged migrations/security source; this correction changes neither.

| Group | Result |
| --- | --- |
| Accepted native foundation/security | 188 named assertions PASS; exact reviewed inventory matched |
| Accepted 01B mocked runtime, including A01 | 73 behavioral checks PASS |
| Accepted 01B deterministic A02/A04/A05 coordination | 16 tests PASS |
| 01C mocked curriculum handler/final authorization | 50 behavioral checks PASS |
| 01C actual-client lifecycle, retained A01 and new A02 | 82 tests PASS |
| Combined Node run | 223 PASS entries: 221 leaf checks/tests plus two parent containers |
| Accepted native 01B numeric/runtime/Auth | 70 checks PASS on final clean rerun |
| Accepted original 01B Chrome | 20 checks PASS |
| Accepted A01/A02 native/browser sequences | 20 checks PASS |
| Accepted A04 native/browser recovery | 27 checks PASS |
| Accepted A05 native/browser sustained/replayed pending | 16 checks PASS |
| 01C native Auth/PostgREST/RLS/handler | 44 checks PASS |
| 01C native-backed Chrome, retained A01 and new A02 | 52 checks PASS |
| Supplementary native signature-byte check | Valid session 200; genuinely changed signature bytes 401 |
| Pre-A02 native negative control | Six passing denials; two expected role/catalog continuation FAILs, preserved |
| Pre-A02 same-test client negative controls | Two expected FAILs, preserved |
| Retained pre-A01 negative control | Expected missing-fresh-GET FAIL, preserved separately |
| Syntax / whitespace | Three changed JavaScript files parse; final `git diff --check` PASS |

A held-summary-refresh test initially detected repeated timer reads after a valid mismatch. The final correction keeps that one refresh in the periodic chain without passing a resume route. The regression now passes; its intermediate failed output is preserved separately.

Accepted A01/A02/A04/A05 test sources/assertions were unchanged. Their passing native groups retain failed-signout quarantine/retry/replay, cross-adult coordination, missing-completion bounded recovery and sustained/replayed-pending protection.

One corrected-source native runtime attempt stopped at the unchanged accepted test's `real signature corruption denied by Auth` assertion. That test replaces only the last base64url signature character with `x`; a `w` → `x` replacement can preserve decoded signature bytes. The failed token was not retained, so that explanation is an input-ambiguity inference, not a verified diagnosis of its particular token. The failed log is preserved. A fresh disposable fixture rerun passed all 70 unchanged assertions. A separate native check confirmed that a mutation changing decoded signature bytes is denied (401), and independently demonstrated the last-character encoding ambiguity without printing or retaining a JWT. No Auth/runtime source or accepted assertion was changed to obtain the pass; no unrelated correction was undertaken.

Relevant Auth/expiry/RLS/security behavior was freshly exercised by native foundation, accepted runtime, curriculum and browser groups. Broader SNV01 email and SNV03 staff/TOTP investigations were not claimed rerun: their accepted source/configuration/evidence remain unchanged, and this correction adds no authentication or staff model.

Headless clock/focus/coordination delivery is controlled; the existing unavailable display remains an injected 409. Native authorization responses and between-request transitions are real local operations. These results do not establish operating-system scheduling, hosted behavior, atomic revocation or additional email-delivery guarantees.

## 8. No-write result

Operator snapshots of **all 28 Portal tables** before successful navigation/continuation and after the freshly fetched mission's final reconciliation were identical. Ordered full-row snapshot SHA-256 before and after:

`376360bec1b3b40b9473e0ae1f8adce3126369dba6f4f9c3dd6df8c4c3b35814`.

The ten learner/cohort/delivery/progress/assessment/evidence/feedback tables also remained unchanged through the entire adversarial browser sequence. The unchanged native curriculum suite independently compared those ten tables before/after browsing. No browser domain-mutation request or script error occurred. Fixture provisioning, publication, deliberate authority transitions and restoration are separate synthetic operator writes; the all-28 equality claim covers successful browsing/continuation, not those deliberate mutations. Production adds GET-only reconciliation and no write capability.

## 9. Five inherited NOTES unchanged

| ID | Retained OPEN assurance limit |
| --- | --- |
| 01B-A03 | Local proof does not establish hosted rewrite/CDN/HTTPS-cookie behavior. |
| SNV02 | Accepted inbucket configuration is deprecated in the tested CLI. |
| SNV04 | Current refresh-chain cascade invalidation remains unproven. |
| SNV05 | Same-site native redirect/path behavior does not establish exact-path-only callback guarantees. |
| SNV06 | Ordinary stateless Data API/RLS may accept an unexpired signed-out JWT; Portal Auth validation and privileged current-session/TOTP gates remain distinct. |

Exactly these five inherited NOTES remain OPEN with their accepted classifications and meanings. None was resolved, reclassified or expanded. Independently closed 01C-A01 remains retained; 01C-A02 correction acceptance remains a Human Authority decision.

## 10. Cleanup and repository state

Validation used fresh copied disposable Supabase projects, unchanged migrations and the existing copied-project-only numeric email-template overlay. All application/Auth/PostgREST requests targeted loopback; browser routing rejected other destinations. No hosted/provider environment was contacted or modified. No repository provider configuration, project link/push, deployment or production activation occurred.

Each disposable stack was stopped with `stop --no-backup`. Its containers, volumes, copied project, generated credential/fixture-reference JSON and raw startup/status credential logs were removed. Adapters and Chrome closed through cleanup paths. Final inspection found no Docker containers or volumes, only default `bridge`, `host`, `none` networks, and no port-4321 listener. A bounded scan of retained evidence text found no complete JWT, secret-key literal or TOTP URI. Existing installed tools/images and previous evidence directories were left intact.

New sanitized logs/results, negative-control source/output/screenshots, synthetic screenshots, snapshot digest and pre-A02 hash ledger remain outside the repository at:

`/var/folders/v7/9s2qngr52z798fdlhklzlhx40000gn/T/aiea-01c-a02-nst3i03l`.

Key files include `portal.pre-a02.js`, `pre-correction-hashes.json`, `between-request-negative-control.mjs`, `between-request-negative-control.log`, `independent-authority-results.json`, `between-request-client-negative-control.log`, `retained-a01-negative-control.log`, `mocked-client-handler-runtime-coordination.log`, `foundation-native.log`, `portal-entry-initial-signature-test-fail.log`, `signature-byte-check.log`, `summary-coalescing-intermediate-fail.log`, `portal-entry.log`, `portal-browser.log`, `portal-audit.log`, `portal-pending.log`, `portal-replayed.log`, `curriculum-native.log`, `curriculum-browser.log`, and `curriculum-a01-no-write.json`. The snapshot filename is inherited by the extended browser runner; this instance belongs solely to A02 evidence. Original A01 and independent audit evidence directories were not overwritten.

Branch remains `main`; HEAD remains accepted Sprint 01B; the index is empty. The pre-A02 17-path working set gains this report, making **18 unstaged/untracked paths** overall: six modified baseline paths and twelve new paths. This correction changes four existing candidate files and adds this report. No staging, commit, push, deployment, self-acceptance, architecture reopening, unrelated UX or Sprint 01D work occurred.

**STOP — bounded correction and revalidation complete for Human Authority review.**
