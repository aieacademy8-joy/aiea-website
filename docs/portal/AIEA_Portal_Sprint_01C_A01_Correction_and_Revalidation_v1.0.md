# AIEA Portal — Sprint 01C A01 Correction and Revalidation v1.0

Date: 2026-10-08 (America/Chicago)

Authority: Human Authority ruling accepting **01C-A01 = MINOR, correction required before Sprint 01C acceptance**, and authorizing only that correction and its necessary tests/documentation.

Baseline HEAD: accepted Sprint 01B `3c2432749e0b265a5519dd8a099ea63a9cd1cd4f`, with the existing uncommitted Sprint 01C candidate and independent audit.

Disposition: **Correction candidate validated; STOP for Human Authority review. No self-acceptance.** The independent audit's classification and historical FAIL are preserved.

## 1. Exact root cause

The 30-second interval called `sessionChanged()` unconditionally when no coordination recovery was outstanding. That path incremented the session generation, aborted pending requests, called `clear()` and discarded the selected workspace. `clear()` also erased curriculum navigation identifiers and instructional DOM. The resulting `load()` freshly authorized workspace context, but neither retained a route nor requested curriculum afterward. A valid adult therefore lost the current catalog/program/mission after every timer boundary, including a mission opened immediately before the boundary. With multiple workspaces, the selection was discarded too.

The clearing behavior protected privacy; the missing fresh continuation caused 01C-A01. The original implementation report records the limitation, and the independent audit records its acceptance challenge FAIL. Neither artifact was edited.

## 2. Exact correction

Only `portal/portal.js` changes production behavior:

- A successfully displayed catalog/program/mission records transient routing and authority metadata: selected workspace ID, workspace kind, membership role, session expiry, active exact-version IDs, and current version/mission IDs. It stores no curriculum body, title, instructions, reflection, resource or credential.
- At the periodic boundary, the client takes that metadata into the current request chain and immediately clears private DOM and invalidates curriculum requests. It freshly requests `/api/portal/context?workspace_id=…` for the same selected workspace.
- Fresh context must retain that workspace, kind, role and session expiry. An already expired context is rejected before resumption. Detail routes require the exact version to remain ACTIVE in the newly returned entitlement summary; catalog resumption requires the same active-version set.
- Only then does the client call the existing curriculum loader for the exact catalog/version/mission route. That loader issues a fresh `cache: 'no-store'` request and retains all existing server Auth, selected-workspace entitlement, RLS, response-boundary authorization, generation and response-shape checks. Private DOM remains empty until that fresh response succeeds.
- An outstanding periodic context/refetch chain coalesces later timer ticks instead of accumulating routes or repeatedly aborting its own work. Session/workspace/coordination/signout/hide/blur changes still invalidate it through the existing generation/abort/clear paths. Their callers supply no resume metadata. Pending recovery's existing non-renewable deadline and active-read protection remain intact.
- Denied, changed, expired or failed authority discards the automatic continuation. Existing denied/expired/unavailable/failure/retry behavior remains; no prior bytes are restored. An authority change can require explicit My Programs navigation after current context is displayed.

The 30-second interval remains active. This is a bounded continuation of the existing reading route, with no navigation redesign, private cache, persistent route, credential persistence or refresh lifecycle. There is no server/API, schema, migration, RLS/grant, dependency, framework, provider, hosted or architecture change in this correction.

## 3. Changed-path delta

Relative to the candidate immediately before this correction, exactly **five paths** belong to this correction:

| Repository-relative path | Correction delta |
| --- | --- |
| `portal/portal.js` | Transient periodic continuation, fresh-context comparison and fresh curriculum refetch |
| `scripts/portal/test-curriculum-client.mjs` | A01 regression, negative-control source selection and adversarial deterministic lifecycle checks |
| `scripts/portal/test-curriculum-browser.mjs` | Native held-context/refetch, revocation, signout and no-write checks |
| `portal/README.md` | Current periodic behavior, regression execution and test-only native fixture requirements |
| `docs/portal/AIEA_Portal_Sprint_01C_A01_Correction_and_Revalidation_v1.0.md` | This separate correction/evidence report |

Of 176 pre-existing versionable files, only the first four above changed; the other 172 remain byte-identical to the pre-correction SHA-256 ledger. The report is the sole additional file. Accepted regression sources, initial implementation plan/report, independent audit, curriculum handlers/read model, local adapter, frozen architecture, migrations/configuration and unrelated website/commerce files retain their pre-correction bytes.

Independent audit SHA-256 remains `74c06328cbf39025201afbfb586358ad28ffe095f6fe064db5a9f9f276b5476d`.

Frozen architecture SHA-256 remains `f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755`.

## 4. New regression and retained historical FAIL

The actual-client regression `01C-A01 entitled mission automatically refetches fresh bytes after periodic authorization` advances to 29.999 seconds, opens an entitled mission, crosses the timer boundary, and confirms immediate clearing. It then supplies fresh successful context and requires a new exact-workspace/version/mission GET without any navigation click. Instructions stay empty while that response is held. The new response contains different instructional text, and only that fresh text is displayed.

Running that same regression with `AIEA_PORTAL_CLIENT_SOURCE` pointing to the saved pre-correction production client yields the expected **FAIL**: no fresh curriculum GET (`5 !== 6` requests). Running the current client passes. The negative control and output remain outside the repository, separate from the independent audit's original failing test/output; the original evidence was not overwritten or erased.

Native-backed Chrome independently opens the real synthetic mission, holds an actual successful context response at the timer boundary, and then holds the newly requested native mission response. It proves empty private DOM during both holds, exact selected-workspace/version/mission addressing, no duplicate requests across repeated ticks, and automatic display after the new native reply without a navigation click. Context and curriculum authorization remain real local Auth/PostgREST/RLS/handlers; only response delivery and browser clock are controlled.

## 5. Adversarial revalidation

| Challenge | Result / evidence |
| --- | --- |
| Selected exact-version entitlement revoked during revalidation | No resume; deterministic and native browser. Native operator revokes both independent billing bases for the synthetic version. |
| Selected membership revoked | No resume; deterministic and native browser against current membership state. |
| Selected workspace inactive | No resume; deterministic and native browser. |
| Adult profile inactive | No resume; deterministic and native browser. Accepted context handler clears the cookie; restoration requires explicit fixture sign-in. |
| Signed-out session | No resume; deterministic 401 and native out-of-band app signout followed by periodic Auth/context 401, without a coordination signal. |
| Expired session | No resume; deterministic expired fresh context and expiry during held context/curriculum; unchanged native curriculum suite also rejects a correctly signed expired local JWT. |
| Workspace changed while periodic context or curriculum is held | Old route suppressed by existing generation checks; deterministic tests and native old-workspace reply hold. |
| Membership role, workspace kind, session expiry or selected context changed | Automatic route discarded; deterministic tests. |
| Catalog active-version set changed | Obsolete catalog not resumed; deterministic test. |
| Old response or response JSON delayed across a newer generation | No restoration or new resume request; deterministic context/curriculum cases, plus native held curriculum across workspace switching. |
| Pending-signout, revalidation signal, blur or signout during held periodic work | Private state stays cleared; obsolete reply cannot resume. Accepted native A01/A02/A04/A05 groups also pass. |
| Repeated timer boundaries while context/refetch is held | One continuation chain, no queue or duplicate refetch; deterministic and native browser. Repeated successful cycles and subsequent sustained pending recovery also pass. |
| Fresh context failure or fresh curriculum 401/403/404/503 | No old instructional bytes restored; truthful failure/denial/expiry behavior retained. A context failure does not retain an automatic route for retry. |

## 6. Regression results

All final groups below passed. Counts overlap and must not be summed into a unique-scenario total. Mocked/deterministic evidence is distinct from native proof.

| Evidence group | Final result |
| --- | --- |
| Accepted 01A native PostgreSQL foundation/security | 188 named assertions PASS; exact reviewed inventory matched |
| Accepted SNV01 native existing-adult email Auth | 13 checks PASS with accepted configuration |
| Accepted SNV03 native staff/current managed TOTP assurance | 100 checks PASS |
| Accepted 01B mocked runtime, including A01 | 73 behavioral checks PASS |
| Accepted 01B deterministic coordination, including A02/A04/A05 | 16 tests PASS |
| 01C mocked curriculum handlers and final-response authorization | 50 behavioral checks PASS |
| 01C actual-client lifecycle including A01 correction | 54 tests PASS |
| Accepted 01B native numeric/runtime | 70 checks PASS |
| Accepted original 01B Chrome flow | 20 checks PASS |
| Accepted A01/A02 native/browser sequences | 20 checks PASS |
| Accepted A04 native/browser recovery | 27 checks PASS |
| Accepted A05 native/browser sustained/replayed pending | 16 checks PASS |
| 01C native Auth/PostgREST/RLS/handler | 44 checks PASS |
| 01C native-backed Chrome, including A01 correction | 37 checks PASS |
| Pre-correction client negative control | Expected FAIL at missing automatic fresh curriculum GET; preserved |
| Changed JavaScript syntax and whitespace | Three `node --check` checks and final `git diff --check` PASS |

The final combined Node run reports **195 passing entries**: 193 leaf checks/tests and two parent containers. Accepted A01/A02/A04/A05 test sources were not altered to obtain these passes. Their native suites retain failed-signout quarantine/retry/replay, cross-adult coordination, lost-completion bounded recovery and sustained/replayed-pending protection.

One initial extended browser run passed resumption and all four native authority-revocation challenges, then stopped because the fixture tried to reuse the access cookie after adult-profile denial. The accepted context handler intentionally clears that cookie. Only the test setup was corrected to sign the synthetic adult in explicitly after profile restoration. Its failed log remains preserved; the complete final 37-check run passed. No production weakening was made to accommodate the fixture.

Headless clock/focus/coordination delivery is controlled, and the unavailable display remains an injected 409. These do not establish operating-system scheduling or hosted behavior. The unchanged native groups separately establish actual authorization/expiry/unavailable behavior. Native browser synthetic codes do not add a mail-delivery claim.

## 7. No-write guarantee

Test-only database-operator snapshots of **all 28 Portal tables** before successful navigation/periodic continuation and after the freshly refetched mission were identical. SHA-256 of the ordered full-row snapshot representation before and after:

`72e23bf5067f72b070bcda40e67b4a36ea861df003bb3a67c597493a7b91c1e6`.

The ten learner/cohort/delivery/progress/assessment/evidence/feedback tables were also unchanged across the entire extended adversarial browser sequence. The unchanged 44-check native curriculum suite independently compared those ten tables before/after browsing. The browser observed no domain mutation request and no script error. Operator fixture provisioning, revocation and restoration are explicit synthetic test operations, separate from Portal browsing. No production write path was added.

## 8. Five inherited OPEN NOTES unchanged

| ID | Unchanged assurance limit |
| --- | --- |
| 01B-A03 | Local proof does not establish hosted rewrite/CDN/HTTPS-cookie behavior. |
| SNV02 | Accepted inbucket configuration is deprecated in the tested CLI. |
| SNV04 | Current refresh-chain cascade invalidation remains unproven. |
| SNV05 | Same-site native redirect/path behavior does not establish exact-path-only callback guarantees. |
| SNV06 | Ordinary stateless Data API/RLS may accept an unexpired signed-out JWT; Portal Auth validation and privileged live-session/TOTP gates remain distinct. |

All five remain OPEN with their inherited classifications and meanings. None is resolved, reclassified or expanded by this correction. 01C-A01 remains subject to Human Authority review; this report does not self-accept it or Sprint 01C.

## 9. Disposable evidence, cleanup and repository state

Fresh copied local Supabase projects used accepted migrations/configuration for native foundation/email/staff validation, followed by a copied-project-only numeric email-template overlay for accepted runtime/browser fixtures. Application/Auth/PostgREST requests targeted loopback only. Browser routing rejected other destinations. No hosted/provider environment was contacted, configured or changed; no hosted CLI link/push/deployment was performed.

Both stacks were stopped with `stop --no-backup`. The copied project, generated credentials/fixture-reference JSON and raw startup/status credential logs were removed. Application adapters and Chrome closed through cleanup paths. Final inspection found no Docker containers or volumes, only default `bridge`, `host`, `none` networks, and no port-4321 listener. A bounded scan of retained evidence text found no complete JWT, secret-key literal or TOTP URI. Existing installed tools/images and unrelated evidence directories were left alone.

Sanitized logs/results, synthetic screenshots, negative-control source/output, snapshot digest and pre-correction hash ledger remain outside the repository at:

`/var/folders/v7/9s2qngr52z798fdlhklzlhx40000gn/T/aiea-01c-a01-s8j590ni`.

Key evidence files: `a01-negative-control.log`, `mocked-client-handler-runtime-coordination.log`, `foundation-native.log`, `snv01.log`, `snv03.log`, `portal-entry.log`, `portal-browser.log`, `portal-audit.log`, `portal-pending.log`, `portal-replayed.log`, `curriculum-native.log`, `curriculum-browser-initial-fixture-fail.log`, `curriculum-browser.log`, `curriculum-a01-no-write.json`, and `pre-correction-hashes.json`. The independent audit and its separate original failing evidence remain untouched.

Branch remains `main`; HEAD remains accepted Sprint 01B. The index is empty. The existing 15-path candidate/audit working set gains this report, for **16 unstaged/untracked paths** overall (six modified baseline paths, ten new paths). This correction changes four existing candidate files and adds this report. No staging, commit, push, deployment, production activation, frozen architecture edit or Sprint 01D work occurred.

**STOP — correction and validation complete for Human Authority review.**
