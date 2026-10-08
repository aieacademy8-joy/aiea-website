# Sprint 01D — Final Human Authority Acceptance and Repository-Boundary Review v1.0

Date: 2026-10-08 (America/Chicago). Human Authority: **Irene**.
Repository: `/Users/dosfam/Desktop/AIEAcademy/Website/2.0`.
Authority: Irene's supplied “SPRINT 01D FINAL HUMAN AUTHORITY ACCEPTANCE +
REPOSITORY-BOUNDARY REVIEW,” conditional on Steps 1–5 passing. Those steps passed.
This document records Irene's authorized acceptance; it is not agent self-acceptance.

## Final acceptance and findings

**SPRINT 01D — ACCEPTED BY HUMAN AUTHORITY**

| Item | Final disposition |
| --- | --- |
| 01D-A01 | **MAJOR — CLOSED** by fresh independent HR03 correction re-review |
| HR01 | **SATISFIED** |
| HR02 | **SATISFIED FOR THE BOUNDED 01D WRITE PATH** |
| HR03 | **ACCEPTED AS THE BOUNDED TRUSTED-GENERATION AMENDMENT** |
| LOCAL IMPLEMENTATION/VALIDATION | **PASS** |
| INDEPENDENT RE-REVIEW | **PASS** |
| HOSTED ACTIVATION | **NOT YET AUTHORIZED / NOT YET PROVEN** |

Current findings: **BLOCKER: none; MAJOR OPEN: none; MINOR: none; NOTE OPEN: five**,
listed below. Closed historical 01D-A01 retains its MAJOR severity and original
failed evidence. Acceptance does not convert the original timestamp-only defect
or its retained negative controls into passing results.

Sprint 01D is ready for a **separately authorized controlled commit** of this exact
candidate. This review does not stage or authorize that commit. Acceptance does
not itself authorize hosted activation, deployment, push or Sprint 01E.

## Evidence reconciliation and exact candidate identity

Reviewed the frozen P0 architecture/data contract, original 01D implementation
plan and implementation/validation report, A01 correction-blocker report, HR03
trusted-write-generation design, HR03 implementation/validation report, independent
HR03 correction re-review, current production changes/migrations and Git state.

The original plan/report describe the historical timestamp-only implementation.
The blocker correctly records why that implementation did not meet HR02. Irene's
HR03 ruling and its versioned design authorize the subsequent bounded Auth
amendment without rewriting the frozen contract or accepted historical migrations.
The HR03 implementation report's then-open A01/pending-review statements are
historical. The later independent re-review closes A01 for the corrected candidate;
this acceptance record establishes the final disposition. None of those earlier
documents was edited to erase its state or failed evidence.

Independent report present:
`docs/portal/AIEA_Portal_Sprint_01D_HR03_Independent_ReReview_v1.0.md`.
Its SHA-256 is
`d91491cb8364f7e7256f7b4be1e35d24a06754f3319a27a6e368a50896489ca3`.

Independent evidence root:
`/var/folders/v7/9s2qngr52z798fdlhklzlhx40000gn/T/aiea-hr03-independent-kpbvs38w`.
Its `repository-before.json` captured all **200 Git-visible files** before the
independent review, including every implementation, test and existing evidence
file. This acceptance review compared every current file against that manifest:
**200/200 identical; zero missing or modified**. The independent report was the
sole subsequent addition (201 Git-visible files at acceptance-review entry).
Therefore the independent PASS applies to the exact current implementation;
no implementation file changed after that reviewed candidate.

Independent baseline manifest SHA-256:
`33f244af44c0efd0b485502c1667bc83784f4261fcc744951056e775f06f6f44`.

| Bound candidate artifact | SHA-256 |
| --- | --- |
| Original 01D mission-status migration | e05eb2bba019b17f4d72b40f7f7b033eef5450fcdb81f90be842a9fc8af5ba6f |
| HR03 forward correction migration | d958198cc2bb77599e593420c25cb63e33a2748af5ddeed163cdbdfbf7c1c7b0 |
| Frozen original P0 architecture/data contract | f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755 |

Historical independent failure artifact remains intact at
`/private/tmp/aiea-01d-independent-audit/independent-results.json`, SHA-256
`5150f906745d06952d5b1c175e065353f5e1d0465919250bd7e4ed6bdce2d9b7`.
Its four same-second HTTP-200 mutation failures remain historical **FAIL**.

## Accepted final scope and user journey

An existing authenticated adult selects an authorized workspace, exact entitled
program version and mission through the accepted 01B/01C flow, opens mission
status, selects an existing authorized learner code or cohort, and explicitly
records a permitted action. Subsequent reads show saved status without recording
activity. Empty subjects provide support guidance; they do not provision records.

**FAMILY:** OWNER and an existing ACTIVE learner reference in that FAMILY workspace.
Absent/NOT_STARTED -> explicit IN_PROGRESS -> explicit COMPLETED only under HR01.
Both exact version and mission `completion_rules` must equal
`{"method":"ADULT_ATTESTATION"}` and mission `evidence_expectations` must equal
`{"required":false}`. Missing, unknown, empty, ambiguous or additional mechanisms
fail closed. Completion requires a started record. Reading, time spent and cohort
delivery never infer completion. No reset, reopen, delete, downgrade or bulk action.

**SCHOOL:** an existing ACTIVE authorized cohort, with OWNER/SCHOOL_ADMIN authority
or the exact ACTIVE teacher assignment. Absent -> STARTED -> DELIVERED.
DELIVERED records facilitation/delivery only. No individual SCHOOL learner progress,
mastery/completion inference or learner fanout occurs.

The fixed GET/POST `/api/portal/progress` boundary retains same-origin JSON,
native adult Auth/cookie checks, selected-workspace isolation, exact-version access
and final authorization reconciliation. POST selects only the two approved RPCs
from verified workspace kind and forwards the adult JWT. There is no generic DB
mutation proxy or caller-selected actor. Direct table DML remains denied.

Monotonic transitions and durable subject/mission identity remain unchanged.
Repeated achieved actions perform no status DML, timestamp change or domain audit.
Creator provenance remains fixed and actual mutations identify the authenticated
updater through existing guards/audit triggers. Uncertain acknowledgements require
a fresh read and explicit idempotent retry. The UI does not automatically retry
writes; private-state clearing and held-response suppression remain intact.

## HR02/HR03 authorization boundary

Both RPCs independently enforce native verified JWT context, the live managed
account/session and matching assurance/expiry, signed per-session generation,
locked exact adult/session/generation identity, active adult-confirmed profile,
active workspace/membership, ACTIVE exact-version entitlement, PUBLISHED/RETIRED
exact version/mission and existing FAMILY/SCHOOL subject authority.

Trusted issuance alone binds/advances `aiea_write_generation`. The private
registry binds Auth session, immutable adult identity and current generation.
Allocation never reuses authority through approved paths. Authority is per session;
refreshing one session does not invalidate another session for the same adult.
Browser roles cannot repair or alter the registry, invoke the issuance hook,
allocate/reset generations or substitute authority through body/header parameters.
Missing/malformed/obsolete claims or registry state fail closed.

After a newer generation commits, an older token cannot authorize a new 01D
mutation, including genuine same-second refresh and direct RPC calls. An already
authorized write holding the required locks may finish before concurrent refresh;
refresh-first makes a waiting stale write observe the newer generation and deny.
Native Auth's SKIP LOCKED/retry behavior was exercised; response order does not
change authoritative state. This is the bounded 01D write guarantee, not global
JWT invalidation or closure of SNV04/SNV06.

## Migration, schema and grant boundary

The three accepted historical migrations remain byte-identical to HEAD:

- `20261006000100_portal_domains.sql`
- `20261006000200_portal_security.sql`
- `20261006000300_portal_guards.sql`

01D contains exactly two forward migrations:

- `20261008000100_portal_mission_status.sql`: the two fixed write RPCs and private
  authorization/HR01 helpers; no new product table, column or browser DML grant.
- `20261008000200_portal_write_generation.sql`: private per-session registry,
  noncycling allocator, trusted invoker hook and in-place private session gate
  correction. No managed Auth schema DDL; managed Auth rows are referenced/locked.

The 28 frozen Portal product-domain tables remain unchanged. HR03's one private
security table and allocator are the explicitly approved amendment, not product
scope expansion. Registry RLS is enabled and forced. Only supabase_auth_admin
receives required SELECT/INSERT, UPDATE(generation), allocator USAGE and hook
EXECUTE; no registry DELETE/TRUNCATE/identity UPDATE or allocator reset grant.
The private schema remains unexposed. Existing read RLS, staff assurance, actor
and audit guards remain intact.

This review reconciled all **29 captured native Portal/private function bodies**
with the final current migration definitions: all match. Captured ACLs/inventory
show exactly these authenticated-callable exposed write signatures:

- `portal.record_mission_progress(uuid,uuid,uuid,uuid,text)`
- `portal.record_cohort_delivery(uuid,uuid,uuid,uuid,text)`

No old overload, additional exposed callable function or alternate mutation bypass
remains. Both RPCs reach the corrected gate before authorization and before DML.
The hook is SECURITY INVOKER; mutation helpers/RPCs retain qualified names and an
empty search_path. Captured native role privileges deny anon/authenticated/
service_role/authenticator new registry/allocator/hook/private-CREATE authority
and trusted-Auth-role membership. Native private-schema requests returned 406.
No test fault function remains in the final captured native inventory.

## Validation and independent acceptance evidence

This acceptance review inspected/reconciled retained execution evidence and current
source; it did not start another stack, create identities or repeat hosted/local
mutation tests. Fresh independent evidence is bound to unchanged source above.
Counts overlap; Node parent entries must not be summed as unique scenarios.

| Evidence | Recorded result |
| --- | --- |
| Implementation-authored final native HR03 matrix | 605 PASS |
| Separately reviewer-authored native probes | 91 PASS; all result flags inspected |
| HR03 native matrix freshly rerun by independent reviewer | 605 PASS; all result flags inspected |
| Historical timestamp gate negative controls | Four reviewer controls and four fresh matrix controls remain security FAIL; actual HR03 gate restored/source-verified |
| Native foundation under all migrations | 188 PASS |
| Native default-template OTP / staff assurance | 13 / 100 PASS |
| Hook-enabled native staff assurance | 100 PASS |
| Accepted unchanged 01B native runtime | 70 PASS in independent re-review |
| Separate native signature-byte controls | 6 PASS |
| 01B Chrome ordinary / audit / pending / replayed | 20 / 20 / 27 / 16 PASS |
| 01C native / Chrome | 44 / 52 PASS |
| Existing 01D native / Chrome | 139 / 17 PASS |
| Mocked/deterministic Node suites | 297 reported PASS entries |
| In-memory SQL foundation / generation / status | 188 / 16 / 15 PASS, exact inventories |
| Assertion-runner self-tests | 7 PASS |

Independent same-second probes verified all four FAMILY/SCHOOL direct-RPC/API
modes: stale tokens denied before and after installing the historical negative
control, current tokens made real authorized mutations, and denied requests
preserved all 28 Portal domain/audit digests. Cross-second, session independence,
concurrent refresh ordering, revocations, HR01, idempotency, zero SCHOOL learner
fanout, no-write GET and hook failure/rollback/timeout were independently reviewed
and freshly exercised. Token/cookie size remains within the accepted boundary.

Implementation authoring/harness failures and the earlier 01B last-character
signature-input ambiguity remain documented, not relabeled PASS. The independent
review passed the unchanged 01B source and separate actual-byte controls. Its own
metadata-extractor failure and corrected rerun remain recorded. Delayed-response
coverage models consumer response order rather than physical packet timing.
Local timeout measurements are availability observations, not hosted SLAs.

## Repository boundary and final pre-commit state

Branch **main**. HEAD **079e7f2a13142e956a5766d6e9e17a1f94718f5f**.
Index **empty**. Before this review: 27 candidate paths (seven tracked modifications,
20 untracked files). After creating this one acceptance document: **28 candidate
paths — seven tracked modifications and 21 untracked files**. No deletion, rename
or unexpected/non-01D candidate path exists. `git diff --check` passes.

Of 181 accepted tracked files, 174 remain byte-identical to HEAD. The seven modified
paths are the approved minimal status extensions/documentation listed below.
Accepted 01A migrations/tests, 01B Auth handler/OTP/login/coordination sources,
01C curriculum API/module/tests, frozen architecture, repository Supabase config,
Vercel config, dependency/environment scaffolds, commerce and unrelated website
sources remain byte-identical. Accepted runtime/shell/client/adapter extensions
are precisely those reviewed independently; they preserve inherited behavior.

The before-review snapshot captured all 201 existing Git-visible paths. Post-write
verification confirms all 201 remain byte-identical and the acceptance record is
the **only repository addition/change caused by this review**. Final total is
202 Git-visible files. No implementation change or acceptance-blocking defect
was discovered; no implementation fix was made.

Complete final candidate manifest (` M` = tracked modification; `??` = untracked):

```text
 M lib/portal/runtime.js
 M lib/portal/shell.js
 M portal/README.md
 M portal/portal.css
 M portal/portal.js
 M scripts/portal/serve-local.mjs
 M supabase/README.md
?? api/portal/progress.js
?? docs/portal/AIEA_Portal_Sprint_01D_A01_Correction_Blocker_Report_v1.0.md
?? docs/portal/AIEA_Portal_Sprint_01D_HR03_Correction_Implementation_and_Validation_Report_v1.0.md
?? docs/portal/AIEA_Portal_Sprint_01D_HR03_Independent_ReReview_v1.0.md
?? docs/portal/AIEA_Portal_Sprint_01D_HR03_Trusted_Write_Generation_Design_v1.0.md
?? docs/portal/AIEA_Portal_Sprint_01D_Implementation_Plan_v1.0.md
?? docs/portal/AIEA_Portal_Sprint_01D_Implementation_and_Validation_Report_v1.0.md
?? lib/portal/progress.js
?? scripts/portal/test-progress-browser.mjs
?? scripts/portal/test-progress-client.mjs
?? scripts/portal/test-progress-database.mjs
?? scripts/portal/test-progress.mjs
?? supabase/migrations/20261008000100_portal_mission_status.sql
?? supabase/migrations/20261008000200_portal_write_generation.sql
?? supabase/tests/mission-status.assertions.json
?? supabase/tests/mission-status.native.py
?? supabase/tests/mission-status.sql
?? supabase/tests/write-generation.assertions.json
?? supabase/tests/write-generation.native.py
?? supabase/tests/write-generation.sql
?? docs/portal/AIEA_Portal_Sprint_01D_Final_Acceptance_and_Repository_Boundary_Review_v1.0.md
```

HEAD/reflog and empty-index checks show no candidate commit/staging occurred.
Repository provider configuration is unchanged. Implementation and independent
records attest local synthetic operations only, no push, deployment, hosted
Supabase/provider change or real customer/production data operation. This review
performed only local inspection/hash checks and created this document; it made
none of those external operations and did not query hosted providers to manufacture
an additional assurance claim.

Both validation reports record disposal of local stacks, copied projects,
credentials/fixtures and raw secret logs. Independent cleanup evidence records
no stack containers/volumes or port-4321 adapter, restored source and no fault
function. Sanitized external historical/validation evidence remains retained.

## Inherited NOTES and hosted activation boundary

| ID | Current classification and disposition |
| --- | --- |
| 01B-A03 | NOTE — OPEN: hosted rewrite/CDN/HTTPS-cookie behavior unproven |
| SNV02 | NOTE — OPEN: deprecated local inbucket configuration |
| SNV04 | NOTE — OPEN: refresh-chain cascade invalidation unproven |
| SNV05 | NOTE — OPEN: exact-path-only native callback guarantees unproven |
| SNV06 | NOTE — OPEN: ordinary stateless Data API may accept an unexpired signed-out JWT |

No inherited note is reclassified. HR03 does not globally close SNV04/SNV06.
Hosted hook compatibility/grants/activation, production HTTPS/CDN/cookies and
operational load/availability remain unproven. Hook availability is an issuance
dependency; failures deny issuance rather than weakening authority. Without hook
activation and valid new issuance, missing-generation tokens cannot perform 01D
writes. No existing token is backfilled, and no browser repair/refresh flow exists.

**Hosted activation requires separate Human Authority authorization and controlled
validation. This acceptance is not production-readiness or deployment approval.**
Vercel Pro does not change the accepted architectural allocation.

Excluded scope remains: child accounts, learner provisioning, observations/
reflections, assessments, evidence/artifacts, resource/upload expansion,
individual SCHOOL learner progress, commerce, Factory coupling, generic publishing/
import pipeline and Sprint 01E. No second browser credential, Portal refresh-token
lifecycle, browser service-role credential or generic DB mutation proxy was added.

No stage, commit, push, deployment, hosted Supabase hook activation, provider
configuration change or Sprint 01E action is authorized or performed by this review.

**STOP — return control to Irene for separately authorized next steps.**
