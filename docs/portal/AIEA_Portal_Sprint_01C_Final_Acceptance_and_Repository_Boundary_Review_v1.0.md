# AIEA Portal — Sprint 01C Final Acceptance and Repository-Boundary Review v1.0

Date: 2026-10-08 (America/Chicago).

Authority: Human Authority's final Sprint 01C acceptance/repository-boundary review instruction and authoritative independent dispositions: **01C-A01 CLOSED; 01C-A02 CLOSED; BLOCKER 0; MAJOR 0; MINOR 0; exactly five inherited OPEN NOTES**.

Recommendation: **ACCEPT — Sprint 01C is ready for Human Authority approval and controlled commit**.

This is a review and acceptance-artifact step only. It records readiness for Human Authority approval; it neither performs that approval/commit nor authorizes deployment, hosted activation or Sprint 01D.

## A. Accepted baseline and review method

Repository: `/Users/dosfam/Desktop/AIEAcademy/Website/2.0`.

Accepted Sprint 01B HEAD remains `3c2432749e0b265a5519dd8a099ea63a9cd1cd4f`; branch remains `main`; index was empty before review and remains empty afterward.

The frozen architecture is byte-identical to accepted HEAD and has the required SHA-256:

`f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755`.

Derived the complete candidate from actual `git diff --name-only HEAD` and nonignored untracked files, rather than adopting a historical report's count. Inspected the production additions/diffs, authorized implementation plan, accepted baseline evidence, both corrections and independent reports. All **179 files** in the latest independent re-audit's pre-review hash ledger match current bytes. Its subsequently added independent report is also preserved unchanged through this review.

Of **167 accepted tracked baseline files**, **161 remain byte-identical** to accepted HEAD. Only the six authorized baseline paths in the manifest differ. This verifies accepted 01A/01B source/evidence outside the authorized working set, including migrations, configuration, grants/RLS/guards, Auth handlers, accepted regression sources/assertion inventory, architecture, dependency files, Vercel configuration and unrelated public-site/commerce code.

This review ran only bounded inventory/hash, text/source inspection, syntax, whitespace and cleanup checks. Nine candidate JavaScript files passed `node --check`; the native fixture Python source passed AST parsing without import/execution; `git diff --check` passed. No behavioral suite, native stack, browser flow or broad implementation work was restarted.

## B. Exact final acceptance-commit manifest

Pre-artifact inventory: **19 paths — six modified accepted-baseline paths and thirteen new Sprint 01C paths**.

Post-artifact inventory, recalculated including this report: **20 paths — six modified accepted-baseline paths and fourteen new Sprint 01C paths**.

Every eventual Sprint 01C acceptance-commit path is listed below, repository-relative. The acceptance artifact is included; no external evidence directory, credential, fixture JSON, log, screenshot, copied project or ignored/generated file belongs to this manifest.

| # | Exact path | Classification | Purpose |
| --- | --- | --- | --- |
| 1 | `api/portal/curriculum.js` | New Sprint 01C path | GET-only authenticated curriculum handler; final server Auth/workspace/entitlement checks |
| 2 | `docs/portal/AIEA_Portal_Sprint_01C_A01_Correction_and_Revalidation_v1.0.md` | New Sprint 01C path | Preserved A01 correction/validation evidence |
| 3 | `docs/portal/AIEA_Portal_Sprint_01C_A01_Independent_Correction_Reaudit_v1.0.md` | New Sprint 01C path | Preserved A01 closure, historical A02 FAIL and negative-control references |
| 4 | `docs/portal/AIEA_Portal_Sprint_01C_A02_Correction_and_Revalidation_v1.0.md` | New Sprint 01C path | Preserved bounded A02 correction/validation evidence |
| 5 | `docs/portal/AIEA_Portal_Sprint_01C_A02_Independent_Correction_Reaudit_v1.0.md` | New Sprint 01C path | Independent A02 closure, retained A01 closure and final PASS |
| 6 | `docs/portal/AIEA_Portal_Sprint_01C_Final_Acceptance_and_Repository_Boundary_Review_v1.0.md` | New Sprint 01C path | Sole artifact added by this final acceptance/repository-boundary review |
| 7 | `docs/portal/AIEA_Portal_Sprint_01C_Implementation_Plan_v1.0.md` | New Sprint 01C path | Authorized pre-implementation boundary |
| 8 | `docs/portal/AIEA_Portal_Sprint_01C_Implementation_and_Validation_Report_v1.0.md` | New Sprint 01C path | Preserved original implementation and validation history |
| 9 | `docs/portal/AIEA_Portal_Sprint_01C_Independent_Adversarial_Audit_v1.0.md` | New Sprint 01C path | Preserved original independent FAIL and A01 finding |
| 10 | `lib/portal/curriculum.js` | New Sprint 01C path | Bounded selected-workspace curriculum aggregation, locale selection and explicit projections |
| 11 | `lib/portal/runtime.js` | Modified accepted-baseline path | Export of existing bounded rows reader; accepted Auth/context implementations unchanged |
| 12 | `lib/portal/shell.js` | Modified accepted-baseline path | Protected catalog/program/mission-text containers and contextual controls |
| 13 | `portal/README.md` | Modified accepted-baseline path | Runtime boundary, correction history, validation and retained assurance limits |
| 14 | `portal/portal.css` | Modified accepted-baseline path | Bounded responsive curriculum presentation |
| 15 | `portal/portal.js` | Modified accepted-baseline path | Read-only navigation, private clearing, periodic fresh continuation and final context reconciliation |
| 16 | `scripts/portal/serve-local.mjs` | Modified accepted-baseline path | Additional curriculum route in the loopback validation adapter |
| 17 | `scripts/portal/test-curriculum-browser.mjs` | New Sprint 01C path | Native-backed Chrome navigation, reconciliation, authority-transition and no-write checks |
| 18 | `scripts/portal/test-curriculum-client.mjs` | New Sprint 01C path | Actual-client deterministic lifecycle, A01/A02 regressions and negative-control source selection |
| 19 | `scripts/portal/test-curriculum.mjs` | New Sprint 01C path | Mocked handler/security/locale/response-boundary tests |
| 20 | `supabase/tests/curriculum.native.py` | New Sprint 01C path | Disposable synthetic publication/Auth/PostgREST/RLS/read-only fixture validation |

**Unauthorized-path check: PASS.** The actual modified/untracked inventory exactly matches these paths. The initial authorized implementation boundary accounts for the runtime/read model/tests; the authorized correction and independent review sequence accounts for its separate evidence reports. This acceptance report is the only repository artifact created during the present step. No pre-existing file changed during review.

All candidate files are regular UTF-8 text files, not symlinks or binary/generated private artifacts. A bounded candidate scan found no complete signed JWT, literal provider publishable/secret key, private-key block or TOTP secret URI. Test identifiers, synthetic signatures, environment-variable names and credential-reading test code are not issued credentials. The candidate adds no persistent credential, private curriculum cache or persistent route/session store.

## C. Final production scope

Verified exactly this path inside the existing protected Portal document:

**Authorized workspace → My Programs → exact program version → ordered mission list → protected mission-text shell.**

The new endpoint exposes a read-only catalog/program/mission model. It returns bounded published localized identity/text metadata, program description/guidance, ordered mission metadata, mission instructions/reflection and session expiry. Guidance is the existing inline program string; no separate guide/resource catalog is implemented. Mission ordering uses actual sequence values, not an assumed fixed mission count. Existing authorized RETIRED-version access remains supported.

FAMILY OWNER and SCHOOL OWNER/SCHOOL_ADMIN/TEACHER use the existing active-membership/workspace-entitlement gate. A teacher can read entitled curriculum without a cohort assignment; production does not query learner or cohort records. No Level entity/field/hierarchy was added.

The consumer reads Portal-owned published rows through existing database contracts. The controlled handoff remains **Curriculum Factory → validated package → separately governed Portal ingestion/publishing → learner experience**. Sprint 01C implements only the published-row consumer; it does not define a package/importer/publishing pipeline or couple either repository's runtime/files.

## D. Authorization, privacy and continuation

The protected entry and curriculum API reuse native Auth validation, active adult-confirmed profile, host-only HttpOnly cookie/expiry and pending-signout protections. Reads forward the adult JWT through existing Portal RLS; production does not use a service credential. Because curriculum RLS permits a union of authorized workspaces, the API additionally intersects results with the explicitly selected workspace's ACTIVE exact-version entitlements, deduplicates billing bases, validates parents/shapes and rechecks Auth/workspace/entitlement access before success.

Responses remain private/no-store with existing bounded rows/text/payloads and sanitized failures. The shell embeds no private payload; curriculum renders as literal `textContent`. Unsupported, duplicate and malformed parameters are rejected; mission requires the exact version. No arbitrary HTML, content_blocks, asset execution, billing/provider identifiers or credentials are returned.

Private curriculum clears while reauthorization is unresolved and on workspace/session/signout/coordination/hide/blur/page lifecycle changes. Generation/abort checks suppress obsolete fetch and JSON responses. Accepted A01/A02/A04/A05 quarantine, cross-adult clearing and non-renewable pending recovery remain intact.

Periodic reauthorization remains active. A01 retains only transient route/authority IDs and metadata, then obtains fresh curriculum without manual navigation under unchanged authority. A02 performs final fresh authoritative context reconciliation before automatic display, checking workspace identity/kind, membership role, session/expiry, exact-version authorization and catalog ACTIVE set/content consistency. Changed valid context cancels continuation and refreshes the summary without treating SCHOOL_ADMIN as unauthorized or suppressing newly ACTIVE versions from explicit fresh navigation. Repeated ticks coalesce through context, curriculum, reconciliation and the single mismatch summary refresh.

No old private body/title/instructions/reflection is restored from a cache. Fresh data held in an outstanding async request is displayed only after current reconciliation; superseded/denied/failed results cannot restore it. This is a bounded fresh-read/generation guarantee, not a transactional recall of already delivered bytes.

## E. Locale review

Verified **requested PUBLISHED locale → explicit PUBLISHED version fallback → unavailable**. The UI's omitted/default request is `en-US`; `default_locale` does not become an implicit fallback. No translation is introduced. Mission locale must match the resolved published program locale and exact mission/version parent.

Unavailable catalog localization is explicit with null title/resolved locale; unavailable localized detail returns 409. Inaccessible version/mission returns 404; inaccessible workspace returns 403; malformed/incomplete/oversized upstream data and provider failures fail closed with sanitized unavailability. Existing empty/retry/expired/denied behavior remains truthful.

## F. Read-only and exclusion review

**PASS: read-only curriculum delivery, migration-free.** No schema, migration, RLS/grant, guard, dependency/framework or provider configuration changed. Production adds only GET-based curriculum/reconciliation reads; it creates no product-domain records.

No learning/progress/evidence/delivery write, activity execution, assessment/scoring/completion implementation, learner/cohort management, child accounts, resource/Blob execution/download integration, content_blocks renderer, uploads, Creation Sandbox, AI integration, dashboard expansion, commerce/subscription expansion, SSO/SIS/LMS, Factory coupling/importer, hosted activation, deployment or Sprint 01D work belongs to the candidate.

Native fixture publication/provisioning and deliberate synthetic authority changes are test-operator operations, not Portal product capabilities. Independent all-28 Portal-table snapshots stayed unchanged across successful navigation/continuation. The latest checked-in native browser run recorded equal before/after digest:

`56c6c496629d3afc073583d09cd159fc713d3b9cae6b2be8ebb40744c2f3275d`.

Ten learner/cohort/delivery/progress/assessment/evidence/feedback tables also remained unchanged across adversarial browsing; native curriculum tests retain their separate no-write check. Browser evidence records no domain-mutation request or script error. Equality across all 28 tables is claimed for browsing/continuation controls, not deliberate fixture mutations.

## G. Closed findings and preserved correction history

| Finding | Current authoritative disposition | Retained evidence |
| --- | --- | --- |
| 01C-A01 | **CLOSED** | Original timer-loss FAIL remains in the original independent audit. Verified old-client missing-fresh-GET negative control remains preserved. Corrected fresh exact-route automatic continuation, clearing and coalescing passed independently. |
| 01C-A02 | **CLOSED** | The A01 re-audit's historical role/catalog consistency FAIL remains intact. Verified pre-A02 native/deterministic controls still reproduce both failures. Final independent two-boundary tests pass, including changes before curriculum processing and after curriculum 200 but before final context processing. |

Current implementation findings: **BLOCKER 0; MAJOR 0; MINOR 0**.

The original independent audit, A01 independent correction re-audit, both implementation correction reports and original implementation report retain their historical bytes. Their then-current FAIL/pending-review dispositions have not been rewritten into acceptance. This artifact records the later authoritative closures separately.

Verified original audit SHA-256: `74c06328cbf39025201afbfb586358ad28ffe095f6fe064db5a9f9f276b5476d`.

Verified A01 independent re-audit SHA-256: `f32486d3aa6d5d2a234922b6882f021535703d90a79e4478b5adcb8334eb95bb`.

Negative-control evidence remains outside the repository, including the original `usability-acceptance-challenge.tap`, A01 re-audit's `browser-authority-transition.mjs`/`.log`, and final re-audit's `negative-client.log`, `retained-a01-negative.log` and `independent-negative.log`. These were inspected read-only; none was overwritten, replaced or erased.

## H. Regression/evidence summary

The latest independent A02 re-audit and its preserved result logs establish the following. Counts overlap and are not a unique-scenario total. **These are reviewed prior execution results, not tests rerun by this acceptance step.**

| Evidence group | Reviewed result |
| --- | --- |
| Accepted mocked runtime, including A01 | 73 behavioral checks PASS |
| Accepted deterministic A02/A04/A05 coordination | 16 tests PASS |
| Sprint 01C mocked curriculum handler/security | 50 behavioral checks PASS |
| Current actual-client lifecycle, retained A01/A02 | 82 tests PASS |
| Combined checked-in Node run | 223 PASS entries; 221 leaf checks/tests and two parents |
| Additional independent actual-client stale-response/failure suite | 56 PASS |
| Independent original role/catalog controls on current source | 2 PASS |
| Accepted native 01B runtime/Auth | 70 checks PASS |
| Accepted original Chrome flow | 20 checks PASS |
| Accepted A01/A02 native/browser sequence | 20 checks PASS |
| Accepted A04 missing-completion recovery | 27 checks PASS |
| Accepted A05 sustained/replayed pending | 16 checks PASS |
| Sprint 01C native curriculum/Auth/PostgREST/RLS | 44 checks PASS |
| Current Sprint 01C native-backed browser | 52 checks PASS |
| Independent corrected-client native two-boundary probe | 84 assertions PASS |
| Verified pre-A02 native/deterministic controls | Two role/catalog failures reproduced as expected |
| Verified pre-A01 negative control | Missing-fresh-GET failure reproduced as expected |
| This final acceptance review | Nine JavaScript syntax checks, one Python AST check, diff/hash/inventory and cleanup checks PASS |

Initial implementation/A01 reports separately preserve foundation, native email and managed-TOTP/staff assurance evidence; their sources/configuration/evidence remain unchanged. No broader foundation/Auth/staff suite was restarted for this review.

Native responses/authority transitions used disposable loopback fixtures. Headless clock/focus/coordination events are controlled, and the named unavailable display uses an injected 409. Local success does not close hosted or operating-system scheduling assurance limits. Previously recorded fixture/test-input and intermediate correction failures remain historical evidence rather than being counted as final passes.

## I. Exactly five inherited OPEN NOTES

| ID | Status | Unchanged retained meaning |
| --- | --- | --- |
| 01B-A03 | **NOTE — OPEN** | Local routing/browser proof does not establish hosted rewrite/CDN/HTTPS-cookie behavior. |
| SNV02 | **NOTE — OPEN** | Accepted inbucket configuration is deprecated in the tested CLI. |
| SNV04 | **NOTE — OPEN** | Current refresh-chain cascade invalidation remains unproven. |
| SNV05 | **NOTE — OPEN** | Same-site native redirect/path behavior does not establish exact-path-only callback guarantees. |
| SNV06 | **NOTE — OPEN** | Ordinary stateless Data API/RLS may accept an unexpired signed-out JWT; Portal Auth validation and privileged current-session/TOTP gates remain distinct. |

Exactly these five remain OPEN with inherited classifications and meanings. None was resolved, removed, expanded or reclassified; no sixth NOTE was introduced.

## J. Cleanup and repository state

Fresh read-only inspection found **no Docker containers or volumes**, only default `bridge`, `host`, `none` networks, and **no port-4321 listener**. No local stack/server/browser was started by this review.

Checked all six recorded Sprint 01C implementation/audit stack evidence roots:

- `aiea-01c-xoa7ar11`
- `aiea-01c-audit-stack-wmf7gjr5`
- `aiea-01c-a01-s8j590ni`
- `aiea-01c-a01-reaudit-stack-t8gfpgo7`
- `aiea-01c-a02-nst3i03l`
- `aiea-01c-a02-reaudit-stack-ol0sm9hs`

These are under `/var/folders/v7/9s2qngr52z798fdlhklzlhx40000gn/T/`. No copied disposable Supabase project, generated local credential/fixture-reference JSON or raw startup/status credential log intended for deletion remains there. Sanitized evidence, negative-control sources/results/screenshots and hash ledgers remain intentionally outside the candidate.

Before and after this review: branch `main`; HEAD `3c2432749e0b265a5519dd8a099ea63a9cd1cd4f`; empty index. Candidate changes remain unstaged/untracked only. After writing this artifact, actual Git inventory was recalculated and confirmed **20 paths: six modified baseline paths and fourteen new Sprint 01C paths**, exactly as listed in Section B. All **180 pre-existing versionable files** retain their pre-review SHA-256 values; this report is the sole addition.

No production code or prior evidence was changed. Nothing was staged, committed, pushed, deployed or activated during this review, and the implementation/independent records likewise preserve their no-push/no-deployment boundary. No hosted/provider environment was contacted to perform this local review. Frozen Section R commerce and operational gates remain prerequisites for real delivery; this acceptance recommendation does not waive them.

## K. Final Human Authority recommendation

The final candidate matches the authorized Sprint 01C scope and exact repository boundary, both implementation findings are independently CLOSED, the five inherited NOTES remain unchanged, and cleanup/Git state satisfy this review.

**ACCEPT — Sprint 01C is ready for Human Authority approval and controlled commit**

STOP for Human Authority. No staging, commit, push, deployment or Sprint 01D action follows this artifact.

