# AIEA Portal — Sprint 01C Independent Adversarial Audit v1.0

Date: 2026-10-07 (America/Chicago)  
Authority: Human Authority's supplied independent-audit brief.  
Repository: `/Users/dosfam/Desktop/AIEAcademy/Website/2.0`.

## A. Disposition

**BLOCKER 0; MAJOR 0; MINOR 1; inherited OPEN NOTE 5.**

**01C-A01 — MINOR:** periodic authorization revalidation terminates an otherwise authorized mission-reading view and loses its navigation context. Classification is **C — MINOR implementation defect**, requiring correction before acceptance, subject to Human Authority ruling. This independently challenges the implementation report's characterization as a bounded usability limitation. No production correction was made.

The tested selected-workspace, locale, private-state security, read-only and repository boundaries passed. Those results do not remove the product finding. Behavioral audit work stopped when the acceptance challenge confirmed the defect; only evidence recording, cleanup and repository-integrity checks followed.

## B. Independently verified baseline and candidate

- HEAD: `3c2432749e0b265a5519dd8a099ea63a9cd1cd4f`, the supplied accepted Sprint 01B baseline.
- Index: empty at reconnaissance and final verification.
- Frozen architecture SHA-256: `f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755`.
- Independently compared the bytes of all 167 baseline tracked files with HEAD. Exactly the six modified paths below differ. Frozen architecture, accepted 01A/01B evidence, migrations, grants/RLS, configuration, dependencies and prior test sources remain unchanged.
- Independently enumerated eight nonignored untracked candidate paths. The implementation candidate therefore contains exactly **14 paths: six modified and eight new**. No assumption about the implementation report's manifest was needed.

All manifest paths below are relative to the repository root stated above.

| Candidate path | State | Inspected purpose |
| --- | --- | --- |
| `lib/portal/runtime.js` | Modified | Exports the existing bounded row reader; other accepted runtime code unchanged |
| `lib/portal/shell.js` | Modified | Protected curriculum containers and navigation |
| `portal/portal.js` | Modified | Curriculum requests, literal rendering, navigation and lifecycle clearing |
| `portal/portal.css` | Modified | Curriculum presentation and responsive text wrapping |
| `portal/README.md` | Modified | Boundary, test reproduction and limitations |
| `scripts/portal/serve-local.mjs` | Modified | Local curriculum route |
| `api/portal/curriculum.js` | New | GET-only authenticated aggregation handler |
| `lib/portal/curriculum.js` | New | Selected-workspace intersection, locale selection and bounded projections |
| `scripts/portal/test-curriculum.mjs` | New | Mocked handler contracts |
| `scripts/portal/test-curriculum-client.mjs` | New | Actual-client deterministic lifecycle tests |
| `scripts/portal/test-curriculum-browser.mjs` | New | Native-backed Chrome validation |
| `supabase/tests/curriculum.native.py` | New | Disposable publication fixtures and native read checks |
| `docs/portal/AIEA_Portal_Sprint_01C_Implementation_Plan_v1.0.md` | New | Candidate plan and proposed boundary |
| `docs/portal/AIEA_Portal_Sprint_01C_Implementation_and_Validation_Report_v1.0.md` | New | Candidate claims and disclosed limitations |

This audit report is a separate, sole repository addition by the auditor. After it, the working change inventory is **15 paths: six modified and nine new**. It is not a fifteenth implementation path.

## C. Methodology and evidence provenance

Read the frozen architecture, accepted foundation/01A correction and acceptance evidence, accepted 01B contracts/correction and acceptance evidence, 01C plan/report, actual candidate diff and every new/changed production and test path. Inspected the relevant unchanged Auth/context and RLS predicates rather than accepting adult-wide curriculum visibility as selected-workspace proof.

Reran the checked-in relevant regressions on the candidate. Added temporary adversarial tests outside the repository against the actual production modules/client. Additional native probes held a real successful upstream mission-localization response while changing synthetic authorization, then released it through the unchanged handler. Browser probes exercised actual local handlers, native Auth and native PostgREST/RLS. They also verified the periodic reading interruption after successful context authorization.

Native infrastructure used a clean copied Supabase project, first with accepted configuration and then with the documented numeric-template overlay in that copy only. Synthetic adults used `@example.invalid`. Publication fixtures used the existing guards and genuine managed TOTP. No hosted environment was contacted. Existing installed Node, PGlite, Supabase CLI, Playwright and Chrome were reused; no dependency was installed.

Private audit evidence root: `/private/tmp/aiea-01c-independent-audit`. Sanitized native/browser evidence root: `/var/folders/v7/9s2qngr52z798fdlhklzlhx40000gn/T/aiea-01c-audit-stack-wmf7gjr5`. These temporary artifacts are excluded from the candidate and are not runtime dependencies.

An initial independent expiry test advanced through periodic context clearing and incorrectly expected the old expiry timer still to redirect. The corrected probe isolates a five-second active-view expiry and passes. An initial extended snapshot query assumed an `id` column on locale tables; ordering by complete row JSON corrected that audit query. Neither was a production defect. Initial failure records are distinguished from final results. The separate product acceptance challenge below remains failing.

## D. Fresh regression and native/browser results

Counts overlap and must not be summed into a unique-scenario total. Mocked, in-memory, native and browser evidence are distinct.

| Group actually rerun | Result |
| --- | --- |
| Accepted 01A PGlite foundation | 188 named assertions PASS; exact inventory matched |
| Accepted inventory-runner self-tests | 7 PASS |
| Accepted 01A native PostgreSQL foundation/RLS | 188 named assertions PASS; exact inventory matched |
| Accepted SNV01 existing-adult email Auth | 13 PASS under accepted configuration |
| Accepted SNV03 current managed-session/TOTP protections | 100 PASS |
| Accepted 01B mocked runtime | 73 leaf behavioral checks PASS |
| Accepted 01B actual-client coordination | 16 PASS |
| Candidate 01C mocked handlers | 50 leaf behavioral checks PASS |
| Candidate 01C actual-client lifecycle | 18 PASS |
| Combined checked-in Node run | 159 PASS entries: 157 leaf checks/tests plus two parents |
| Independent extended handler suite | 60 leaf checks PASS: 50 candidate plus 10 added; 61 entries including parent |
| Independent extended client suite before acceptance challenge | 23 PASS: 18 candidate plus five added checks/observations |
| Accepted 01B native runtime/signout | 70 PASS |
| Accepted original 01B Chrome flow | 20 PASS |
| Accepted A01/A02 native/browser sequences | 20 PASS |
| Accepted A04 native/browser recovery | 27 PASS |
| Accepted A05 native/browser sustained/replayed pending | 16 PASS |
| Candidate 01C native Auth/PostgREST/RLS/handler | 44 PASS |
| Candidate 01C native-backed Chrome | 18 PASS |
| Independent extended native-backed Chrome | 21 PASS observations: 18 existing plus three periodic/reopening observations |
| Independent native held-response authorization changes | Six PASS denials; detailed below |
| Independent full-row browsing snapshots | All 16 inspected tables unchanged |
| Independent mission-reading acceptance challenge | **One FAIL — 01C-A01** |
| Syntax / whitespace | 21 relevant production/test scripts parse; `git diff --check` PASS |

The extended browser's passing periodic observations establish the interruption; they do not establish product acceptability. The independent acceptance challenge deliberately tests that separate judgment and fails. Desktop and mobile mission captures were visually inspected; literal HTML-like text and wrapping were consistent with the automated checks.

This audit does not claim to have rerun every historical 467-case 01A investigation, including its separate original concurrency/refresh/redirect probes. It reran the relevant foundation, ordinary Auth and current staff-assurance groups named above. The five inherited NOTES retain their accepted meanings.

## E. Selected-workspace isolation verdict

**PASS within the exercised local boundary.**

`lib/portal/curriculum.js` calls the accepted context reader for the explicit selected workspace, filters ACTIVE entitlements and deduplicates exact version IDs. It rejects a requested version outside that set before curriculum aggregation. Curriculum rows are fetched through the adult JWT/RLS and projected from that bounded set. The endpoint authenticates again and repeats selected-workspace access checks before success.

Native testing independently confirmed the crucial distinction: the same adult can directly see both family-only and school-only versions through union RLS, while the Portal API returns 404 for the family request for the school-only version and for the school request for the family-only version. This verdict is based on the API intersection, not on RLS visibility alone.

Additional checks covered duplicate billing bases, one revoked basis with another ACTIVE basis, ACTIVE/SUSPENDED/REVOKED states, multiple versions of one program, entitled RETIRED versions, exact mission/version mismatch, teachers without cohort assignments, malformed/duplicate/unsupported inputs and bounded-result failures. The existing reader rejects more than 100 returned rows; a separate 101-entitlement challenge failed closed before curriculum SELECTs.

For each independent native delayed-request probe, a real mission-localization upstream response was held before the handler's final revalidation. Fixture/operator changes were separate from product browsing:

| Synthetic change while response held | Actual final response |
| --- | --- |
| Suspend both duplicate billing-basis entitlements for the exact version | 404, error only |
| Revoke both duplicate billing-basis entitlements for the exact version | 404, error only |
| Revoke selected family membership while retaining the adult's school membership | 403, error only |
| Make selected workspace inactive | 403, error only |
| Make adult profile inactive | 403, error only |
| Complete native local-scope session signout | 401, error only |

No assembled curriculum was returned in those six cases. Synthetic state was restored for subsequent probes and ultimately removed with the disposable volumes.

The implementation remains a bounded multi-request aggregation rather than a transactional selected-workspace RLS policy. These tests establish rejection of changes visible to final checks; they do not establish atomic revocation at every possible instant, cancellation of delivered bytes or global JWT revocation. No stronger guarantee is inferred, and SNV06 is unchanged.

## F. Locale and field-exposure verdict

**PASS within the exercised boundary.**

Requested PUBLISHED locale wins; otherwise only the version's explicit PUBLISHED fallback is eligible; otherwise detail is unavailable. `default_locale` is not selected or used as an implicit fallback. Native requested/fallback/unavailable cases and added draft-requested/draft-fallback challenges support this result. Missing/unpublished mission localization and inconsistent mission parents fail closed. Catalog unavailability is explicit through null title/resolved locale.

SELECTs and output construction bound identities, program title/description/guidance, ordered mission metadata/title/instructions/reflection, locale and contextual session/workspace metadata. Literal `textContent` rendering was exercised. No billing/provider identifier, publisher identity, asset path, content_blocks, scoring/completion/evidence rule or arbitrary curriculum JSON entered the curriculum response. No Level domain was introduced.

## G. Private-state and stale-response verdict

**PASS for security clearing and stale-response rejection; product continuation FAIL under 01C-A01.**

Actual-client and native-backed browser sequences exercised workspace switching, signout, expiry, pending-signout quarantine, blur, visibility/page transitions, periodic revalidation, coordination, held replies and superseded generations. An additional response-body hold challenged switching after headers but before JSON completion. Cleared content was not restored by old responses. Successful re-opening used fresh native curriculum requests. Multi-window A01/A02/A04/A05 regressions passed without modifying their source or expectations.

No private content cache or credential persistence was added. Headless focus/visibility delivery and browser clocks were controlled; the resulting state-machine evidence is not an operating-system scheduling guarantee. Hosted CDN/rewrite/cookie behavior remains outside this audit and under 01B-A03.

## H. No-write and scope verdict

**PASS within inspected code and measured browsing sequences.**

Curriculum browsing calls only JWT-backed GETs; the endpoint accepts only GET. No product provisioning path, service-secret consumption or mutation RPC was added. POST curriculum attempts were rejected.

Beyond the candidate's learning-table snapshots, an independent before/after full-row comparison surrounded real native-backed browser navigation, periodic revalidation/reopening and signout. These 16 tables were identical: `learner_ref`, `cohort`, `cohort_teacher_assignment`, `cohort_learner_assignment`, `mission_progress`, `cohort_mission_delivery`, `assessment_attempt`, `assessment_response`, `evidence_record`, `pilot_feedback`, `entitlement`, `program`, `program_version`, `program_version_locale`, `mission`, `mission_locale`. Full-row ordering used JSON, so locale composite keys were supported. The retained summary contains equality and a snapshot digest; raw fixture snapshots were removed.

Fixture creation, staff bootstrap/publication and deliberate revocation probes were separate explicit synthetic test operations. Their writes are not product browsing behavior and were not included in the no-write comparison.

Byte comparison and production-path inspection found no migration/schema/RLS/grant, dependency/framework, Vercel/Supabase/provider configuration or accepted-evidence change. No Factory runtime/importer coupling, production provisioning, resources/Blob delivery, content_blocks renderer, activity execution, assessment/scoring/completion control, learner/cohort/progress/evidence mutation, child account, upload, AI integration, dashboard, commerce/subscription, SSO/SIS/LMS or Sprint 01D feature entered the candidate.

## I. Finding 01C-A01 and usability classification

| Field | Independent finding |
| --- | --- |
| ID | **01C-A01** |
| Severity | **MINOR** |
| Classification requested by brief | **C — MINOR implementation defect** |
| Exact affected production path | `/Users/dosfam/Desktop/AIEAcademy/Website/2.0/portal/portal.js` |
| Relevant locations | Lines 79–93 clear curriculum and route; lines 247–248 discard selection/reload context; lines 255–258 invoke this every 30 seconds |
| Supporting candidate evidence | `scripts/portal/test-curriculum-client.mjs:42` asserts clearing; implementation/validation report line 97 discloses reopening without a resumable route |
| Product impact | An authorized adult loses the current mission, instructions/reflection and navigation on a timer unrelated to when the mission opened. In a multi-workspace account, the adult must choose the workspace again and navigate through catalog/version/mission. Successful authorization does not resume or freshly refetch the reading view. |
| Security impact | Availability/usability defect; no demonstrated unauthorized disclosure, domain write or authorization bypass |
| Correction required before acceptance | **YES, pending Human Authority ruling.** No correction is authorized by this audit. |

### Reproduction and preserved failing evidence

1. Use the actual candidate client with a valid adult and selected workspace.
2. Advance its executing page clock to 29.999 seconds after initialization.
3. Open catalog, exact version and mission through successful responses.
4. Advance one millisecond to the existing 30-second periodic boundary.
5. Complete fresh context authorization successfully.
6. Observe that the curriculum panel remains hidden, instructional fields are empty and the current mission is neither resumed nor freshly requested.

The extended native-backed Chrome run separately confirmed visible mission text immediately before the boundary, cleared text/discarded multi-workspace selection afterward, and successful reopening only through new native requests.

Preserved independent test: `/private/tmp/aiea-01c-independent-audit/usability-acceptance-challenge.mjs`. Output: `/private/tmp/aiea-01c-independent-audit/usability-acceptance-challenge.tap`.

Reproduction command using the installed runtime:

```sh
/Users/dosfam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test --test-name-pattern='Independent acceptance challenge' /private/tmp/aiea-01c-independent-audit/usability-acceptance-challenge.mjs
```

Preserved result:

```text
tests 1
pass 0
fail 1
AssertionError: Mission disappears after 1ms and is not reopened/refetched after successful authorization
true !== false
```

This is an independent product acceptance challenge, not a claim that an existing checked-in test failed or that the frozen architecture explicitly mandates a particular continuation implementation. The brief explicitly requests a judgment between A/B/C/D. The auditor selects C because reading mission instructions is this sprint's central product task, and an unconditional recurring reset can interrupt it almost immediately despite continued authorization. A passing test that expects clearing does not resolve that product problem. It is not classified as MAJOR because the exercised authorization and privacy boundaries remain intact.

Human Authority should rule on this classification before any correction. A correction must preserve fresh authorization, clearing on access/session changes, stale-generation rejection, no private cache restoration and accepted A01/A02/A04/A05 protections. The audit does not authorize a redesign or prescribe retaining curriculum bytes without authorization.

## J. Exact findings table and five inherited OPEN NOTES

The sole new finding is 01C-A01. The five inherited NOTES remain OPEN with their original severities and meanings; none was resolved, promoted, demoted or rewritten.

| ID | Severity / status | Exact affected or governing paths, repository-relative | Evidence and impact | Correction before 01C acceptance |
| --- | --- | --- | --- | --- |
| 01C-A01 | **MINOR — OPEN** | `portal/portal.js` | Deterministic acceptance challenge FAIL and native-backed periodic observation; authorized mission reading interrupted | **Required; Human ruling first** |
| 01B-A03 | NOTE — OPEN, inherited | `vercel.json`; `scripts/portal/serve-local.mjs`; `docs/portal/AIEA_Portal_Sprint_01B_Final_Acceptance_and_Repository_Boundary_Review_v1.0.md` | Local routing/browser proof does not establish hosted Vercel rewrites/CDN/HTTPS cookies; no hosted audit performed | No new 01C correction; inherited assurance boundary |
| SNV02 | NOTE — OPEN, inherited | `supabase/config.toml`; `docs/portal/AIEA_Portal_Sprint_01A_SNV01_Correction_and_Native_Revalidation_v1.0.md` | Accepted inbucket configuration is deprecated; unchanged configuration used for fresh native Auth regression | No; unchanged |
| SNV04 | NOTE — OPEN, inherited | `supabase/config.toml`; `docs/portal/AIEA_Portal_Sprint_01A_SNV03_Current_Assurance_Correction_and_Revalidation_v1.0.md` | Current refresh-chain cascade invalidation remains unproven; this audit makes no new cascade claim | No; unchanged |
| SNV05 | NOTE — OPEN, inherited | `supabase/config.toml`; `docs/portal/AIEA_Portal_Sprint_01A_SNV01_Correction_and_Native_Revalidation_v1.0.md` | Same-site native redirect/path behavior does not establish exact-path-only callback guarantees; config unchanged | No; unchanged |
| SNV06 | NOTE — OPEN, inherited | `supabase/migrations/20261006000200_portal_security.sql`; `lib/portal/runtime.js`; `docs/portal/AIEA_Portal_Sprint_01A_SNV03_Current_Assurance_Correction_and_Revalidation_v1.0.md` | Ordinary stateless Data API/RLS may accept an unexpired signed-out JWT. Native 01B regression retains this distinction; Portal Auth validation and privileged current-session/TOTP protections remain separate | No; unchanged |

## K. Cleanup and final repository state

Both copied local stacks were stopped with CLI `stop --no-backup`. Disposable containers, volumes, synthetic Auth/database/mail/session fixtures and copied project were removed. Private CLI credentials, fixture-reference JSON, raw startup/status credential logs, raw full-row snapshots and temporary upstream hold hook were removed. Application servers and Chrome closed through cleanup paths. Final Docker inspection found no containers or volumes and only default `bridge`, `host`, `none` networks; no port-4321 listener remained.

Sanitized logs/results, screenshots, the failing acceptance test/output, temporary nonsecret test/orchestration sources, snapshot digest and pre-audit source hash ledger remain outside the repository as evidence. A bounded credential-pattern scan of retained text found no complete signed JWT, secret-key literal or TOTP URI. No downloaded tool/image or unrelated pre-existing audit directory was removed.

The audit's only repository write is this report. All 175 pre-existing versionable files retain their pre-audit SHA-256 values. HEAD remains the accepted Sprint 01B commit; index remains empty. The 14-path implementation candidate is unchanged and unstaged, with this report as the fifteenth working change. No staging, commit, push, deployment, hosted/provider configuration, production provisioning, correction or Sprint 01D work was performed. Local Git verification does not purport to audit arbitrary out-of-band provider activity.

**STOP — preserved evidence and returned for Human Authority ruling on 01C-A01.**

FAIL — correction required before acceptance
