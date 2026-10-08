# AIEA Portal — Sprint 01C Implementation and Validation Report v1.0

Date: 2026-10-07 (America/Chicago)

Authority: Human Authority's explicit Sprint 01C implementation ruling in this chat.
Baseline: accepted Sprint 01B `3c2432749e0b265a5519dd8a099ea63a9cd1cd4f`.
Disposition: **Implementation candidate complete; STOP for Human Authority review. Not self-accepted.**

## A. Delivered boundary

Implemented the authorized path inside the existing protected `/portal` document:

Authorized workspace → My Programs → exact program version → ordered mission list → protected mission-text shell.

The required implementation plan was created and self-checked before production edits. Its boundary required no architecture/schema/security amendment. No migration, RLS/grant change, dependency/framework, provider configuration or deployment was needed.

`GET /api/portal/curriculum` accepts an explicit selected workspace, optional exact version and then mission, and an optional bounded requested locale. It returns catalog, program or mission read models with explicit field allowlists. It exposes only approved identities, published localized titles/description/guidance, ordered mission metadata, mission instructions/reflection, resolved locale and session expiry. It does not return billing/provider IDs, publisher identities, assets, content_blocks, evidence/completion/scoring rules or arbitrary curriculum JSON.

Reads reuse accepted Auth `/user`, adult-profile, HttpOnly cookie/expiry and pending-signout protections, forwarding the adult JWT under existing `portal` RLS. The application intersects curriculum with the selected workspace's ACTIVE exact-version entitlement set, deduplicates billing bases and preserves existing entitled RETIRED versions. It validates returned parents/shapes and rechecks native Auth plus selected-workspace access before success. Expiry is checked again after final authorization. Requests/rows/text/upstream and output payloads are bounded; errors are sanitized and private responses remain no-store.

Locale choice is requested PUBLISHED locale → explicit PUBLISHED fallback → unavailable. Default locale is never an implicit fallback. The private SQL helper remains unexposed. Missing localization is explicit in catalog entries and returns 409 for localized detail. Inaccessible versions/missions return 404, workspace denial returns 403 and inconsistent/incomplete/oversized upstream data fails closed with 503.

The UI includes contextual navigation, loading/empty/unavailable/denied/expired/failure/retry behavior. Instructions and other curriculum strings render literally through textContent. New private DOM fields and pending requests participate in the accepted clearing/generation/coordination lifecycle. No browser credential persistence or private content cache was added.

FAMILY OWNER and SCHOOL OWNER/SCHOOL_ADMIN/TEACHER share the entitled curriculum read gate. A school teacher without a cohort assignment can read curriculum, as existing RLS permits; no cohort or learner records are fetched by production code. Opening/browsing creates no learning, delivery, progress, assessment or evidence records.

## B. Exact changed-path manifest

Repository root: `/Users/dosfam/Desktop/AIEAcademy/Website/2.0`.
Exactly **14 paths: six modified baseline paths and eight new paths**. Paths below are relative to that root.

| Path | State / purpose |
| --- | --- |
| `lib/portal/runtime.js` | Modified; exports the existing bounded row reader; accepted Auth/context functions unchanged |
| `lib/portal/shell.js` | Modified; bounded protected catalog/program/mission containers |
| `portal/portal.js` | Modified; read-only navigation and curriculum clearing/stale-response protection |
| `portal/portal.css` | Modified; responsive curriculum presentation using existing visual tokens |
| `portal/README.md` | Modified; separately records 01C addition, validation and retained limits |
| `scripts/portal/serve-local.mjs` | Modified; maps the additional local curriculum API route |
| `api/portal/curriculum.js` | New; GET-only authenticated curriculum handler |
| `lib/portal/curriculum.js` | New; selected-workspace authorization, bounded aggregation and locale/projection logic |
| `scripts/portal/test-curriculum.mjs` | New; mocked handler adversarial contracts |
| `scripts/portal/test-curriculum-client.mjs` | New; actual-client deterministic DOM/clock/held-response checks |
| `scripts/portal/test-curriculum-browser.mjs` | New; native-backed Chrome path and lifecycle checks |
| `supabase/tests/curriculum.native.py` | New; loopback-only synthetic publication/native API/RLS/no-write checks |
| `docs/portal/AIEA_Portal_Sprint_01C_Implementation_Plan_v1.0.md` | New; required pre-implementation boundary artifact |
| `docs/portal/AIEA_Portal_Sprint_01C_Implementation_and_Validation_Report_v1.0.md` | New; this report |

No other path belongs to the candidate. Do not sweep ignored or future files into a later commit.

## C. Validation results

All final groups passed. Groups overlap; their counts must not be added into a unique-scenario total. Mocked results do not substitute for native or browser proof.

| Evidence group | Final result |
| --- | --- |
| Accepted 01A in-memory PGlite foundation | 188 named assertions PASS; exact inventory matched |
| Accepted 01A native PostgreSQL foundation | 188 named assertions PASS; exact inventory independently matched |
| Accepted SNV01 native existing-adult email Auth | 13 checks PASS under unchanged accepted config |
| Accepted SNV03 native staff/current managed TOTP assurance | 100 checks PASS |
| Accepted 01B mocked runtime | 73 behavioral checks PASS |
| Accepted 01B actual-client deterministic coordination | 16 tests PASS |
| New 01C mocked curriculum handlers | 50 behavioral checks PASS |
| New 01C actual-client deterministic lifecycle | 18 tests PASS |
| Accepted 01B native numeric/runtime | 70 checks PASS |
| Accepted original 01B Chrome flow | 20 checks PASS |
| Accepted A01/A02 native/browser sequences | 20 checks PASS |
| Accepted A04 native/browser recovery | 27 checks PASS |
| Accepted A05 native/browser sustained/replayed pending | 16 checks PASS |
| New 01C native Auth/PostgREST/RLS/handler | 44 checks PASS |
| New 01C native-backed Chrome | 18 checks PASS |
| Syntax | Nine JavaScript files and one Python file PASS |
| Whitespace | `git diff --check` PASS |

The combined final Node run reports 159 passing test entries: 157 leaf checks/tests plus two parent containers. The table above reports the meaningful leaf group sizes separately.

The new checks cover family owner; school owner/admin/teacher and teacher without cohort assignment; dual-workspace isolation; multiple versions; duplicate billing bases; non-eight ordering; published/draft/review-ready/retired visibility; active/suspended/revoked entitlements; requested/fallback/unavailable locales; anonymous/expired/pending-signout/inactive states; wrong mission/version; malformed/duplicate/unsupported/method/overflow handling; strict fields and literal text; failures/retry; stale replies; and clearing across workspace/session/signout/coordination/blur/hide/periodic changes.

Native proof specifically established that the same adult's direct RLS reads could see the family-only and school-only versions, while the Portal API denied each version when requested through the other selected workspace. This challenges the RLS-union distinction directly.

Native before/after row snapshots were identical for learner_ref, cohort, cohort assignments, mission_progress, cohort_mission_delivery, assessment_attempt, assessment_response, evidence_record and pilot_feedback. The browser also observed no domain-mutation request. Fixture provisioning/publication is separate, explicit test setup, not browsing or a production product capability.

The browser navigated the full actual local path, checked three missions in order, verified literal HTML-like text, held an actual native response across a workspace switch, checked native API isolation, exercised coordination clearing and native signout, and found no script errors. Desktop/mobile overflow checks passed. Desktop mission, mobile mission panel, program and catalog screenshots were visually inspected. The final mobile mission capture is scoped to the panel after viewport rendering settles.

## D. Validation corrections and evidence limits

An initial mocked locale test omitted the Spanish mission localization required by the publication contract. The fixture was corrected; production completeness checks were retained. The final mocked group passed.

An initial native fixture attempt tried enrolling another TOTP factor through the previously enrolled 01B publisher's ordinary session and was refused. No curriculum rows had been published by that failed attempt. The fixture now uses a dedicated synthetic publisher, an explicit test-only database-operator bootstrap through the accepted audited staff guard, and genuine native managed TOTP. No security predicate was weakened and no production staff path was added. The final native group passed.

The browser group was rerun after replacing an unreliable paused-clock/full-page mobile capture with a settled mission-panel capture. Both final behavioral checks and the inspected capture passed. The initial failed attempts are not claimed as passing evidence.

The new browser unavailable-state display is an injected 409; native unavailable-locale behavior is separately proven by the native group. Browser clock and focus/coordination events are controlled in headless Chrome. These are not operating-system scheduling or hosted-platform guarantees. Existing native email tests and numeric-overlay tests remain distinct. The new browser's fixture code uses native admin-generated synthetic codes and does not claim additional email-delivery proof.

The read model uses bounded multi-request aggregation, not a transactional selected-workspace RLS policy. Final checks protect assembled responses against observed access changes; this does not promise cancellation of already delivered bytes or a new global revocation mechanism.

The accepted session lifecycle clears curriculum on periodic revalidation as well as relevant focus/session/coordination changes. After fresh context, the adult reopens My Programs; the UI does not restore cached mission content or retain a resumable route. This deliberately retains the current bounded lifecycle and is a usability limitation of this slice.

## E. Publishing, scope and unchanged governance

Production consumes Portal-owned published database rows. No Factory package schema, importer, ingestion API, filesystem dependency, repository fetch, shared runtime or publishing pipeline exists in this candidate. Publishing handoff remains separately governed. Synthetic fixtures exercise existing immutable version/locale publication guards; they are not production provisioning or a package-validation implementation.

No separate Level entity/field/hierarchy was introduced. No resources/Blob downloads, content_blocks rendering, lesson activity execution, assessments/scoring/completion controls, cohort/learner/progress/evidence operations, child accounts, uploads, Creation Sandbox, AI integrations, dashboards, commerce/subscription changes, SSO/SIS/LMS or Sprint 01D functionality was implemented.

All 167 accepted tracked baseline files were compared with the accepted HEAD hashes. Only the six explicitly listed baseline paths differ. Frozen architecture, accepted 01A/01B evidence, foundation migrations/config/grants/RLS/guards, accepted test sources/assertion inventory, Auth handlers, Vercel configuration, package/dependency files and unrelated public-site/commerce code remain byte-identical to baseline.

Frozen architecture SHA-256 remains:
`f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755`.

Exactly five NOTES remain OPEN, unchanged:

| ID | Retained observation / assurance limit |
| --- | --- |
| 01B-A03 | Local routing does not establish hosted Vercel rewrite/CDN/HTTPS-cookie behavior. |
| SNV02 | Accepted inbucket configuration is deprecated in the tested CLI. |
| SNV04 | Current refresh-chain cascade invalidation remains unproven. |
| SNV05 | Same-site redirect/path behavior does not establish exact-path-only native callback guarantees. |
| SNV06 | Ordinary stateless Data API/RLS may accept an unexpired signed-out JWT; application Auth validation and privileged live-session/TOTP gates remain distinct. |

No NOTE was resolved, removed, expanded or reclassified. Frozen Section R commerce repairs and operational/privacy/production prerequisites remain gates before real delivery. Synthetic local success does not authorize customer access or hosted activation.

## F. Disposable infrastructure and repository state

Validation used copied local Supabase projects with the accepted configuration, followed by a copied-project-only numeric template overlay. The repository config was not edited and CLI operations did not run against its source Supabase directory. No hosted project was linked, configured, pushed or deployed.

The local stack was stopped with `stop --no-backup`; disposable volumes and copied project were removed. Local adapters and browsers closed. Generated credential JSON, raw startup/status credential logs, synthetic user-reference files and test-only hooks/flags were removed. Sanitized check logs/results, screenshots and the accepted-baseline hash inventory remain outside the repository in the private temporary validation directory. They are excluded from the candidate and are not runtime dependencies.

Repository state: branch `main`; HEAD remains `3c2432749e0b265a5519dd8a099ea63a9cd1cd4f`; index empty; six modified and eight new candidate paths. No staging, commit, push, deployment, hosted activation, provider/environment configuration or production account/curriculum provisioning was performed. Existing ignored state is excluded.

## G. Human Authority gate

Review this candidate, test evidence, retained limitations and exact manifest. This report records implementation and local validation, not independent acceptance or production assurance.

**STOP — Sprint 01C is not self-accepted. No stage/commit/push/deploy action is authorized by this report.**
