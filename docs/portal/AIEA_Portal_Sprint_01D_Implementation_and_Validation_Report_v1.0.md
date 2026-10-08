# AIEA Portal — Sprint 01D Implementation and Validation Report v1.0

Date: 2026-10-08 (America/Chicago). Human Authority: Irene.

Status: **IMPLEMENTED CANDIDATE — local validation complete; independent adversarial
audit and Human acceptance pending.** This report does not self-accept the sprint.

## A. Authority, baseline and delivered scope

Irene accepted the reconnaissance and authorized explicit adult-recorded mission
status, HR01 completion semantics, HR02 managed-session write security, one bounded
forward migration, minimal API/UI changes, and synthetic local validation only.
The implementation plan was saved before implementation.

Baseline: branch main, HEAD 079e7f2a13142e956a5766d6e9e17a1f94718f5f; initially clean
with an empty index. The accepted 01A/01B/01C boundaries remain intact apart from
explicitly authorized extensions. All 174 accepted tracked paths outside the seven
modified paths remain byte-identical to HEAD, including accepted migrations,
configuration, tests/inventories, Auth handlers, historical reports, dependency
files, Vercel configuration and unrelated website/commerce code.

Frozen architecture remains unchanged, SHA-256:
`f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755`.

Delivered:

- FAMILY: select an existing active learner code and explicitly Start or, where
  supported, Mark completed for the exact entitled mission/version.
- SCHOOL: select an existing authorized active cohort and explicitly Start or
  Mark delivered. Delivery does not assert individual completion or mastery.
- Read saved status across later visits. Opening curriculum or status writes nothing.
- Keep only transient subject IDs during same-workspace/version navigation and
  periodic continuation, then refetch current subject authorization and status.
- Empty/denied/unavailable states, private clearing, pending-save feedback and
  explicit reload after uncertain acknowledgement. No automatic mutation retry.

## B. Exact changed-path manifest

Repository root: `/Users/dosfam/Desktop/AIEAcademy/Website/2.0`.
Paths below are repository-relative. **19 paths: seven modified, twelve new.**
Nothing is staged. No temporary credential, database, log or screenshot is included.

| Path | State | Purpose |
| --- | --- | --- |
| api/portal/progress.js | New | Fixed bounded GET/POST status handler |
| lib/portal/progress.js | New | Explicit read projections, scope checks and fixed RPC selection |
| lib/portal/runtime.js | Modified | Content-Profile: portal on data POSTs only |
| lib/portal/shell.js | Modified | Subject selector, status list and explicit action controls |
| portal/portal.js | Modified | Status navigation/actions and inherited private lifecycle extension |
| portal/portal.css | Modified | Minimal responsive status presentation |
| supabase/migrations/20261008000100_portal_mission_status.sql | New | Bounded RPCs and current managed-session/authorization locks |
| scripts/portal/serve-local.mjs | Modified | Fixed local progress route |
| scripts/portal/test-progress.mjs | New | Mocked API/security/completion contracts |
| scripts/portal/test-progress-client.mjs | New | Actual-client held replies, lifecycle and fresh continuation |
| scripts/portal/test-progress-database.mjs | New | Separate in-memory SQL runner/inventory validation |
| scripts/portal/test-progress-browser.mjs | New | Native-backed Chrome status/action/clearing checks |
| supabase/tests/mission-status.sql | New | Transactional synthetic status/security assertions |
| supabase/tests/mission-status.assertions.json | New | Separately checked-in 15-name expected inventory |
| supabase/tests/mission-status.native.py | New | Native Auth/direct RPC/concurrency/revocation and snapshots |
| portal/README.md | Modified | Runtime, rules, session and validation documentation |
| supabase/README.md | Modified | New migration, grants, locks and assurance limits |
| docs/portal/AIEA_Portal_Sprint_01D_Implementation_Plan_v1.0.md | New | Pre-implementation governed boundary |
| docs/portal/AIEA_Portal_Sprint_01D_Implementation_and_Validation_Report_v1.0.md | New | This implementation/validation record |

## C. Migration and RPC behavior

The forward migration adds no tables, columns, direct table-DML grants or write
RLS policies. It does not rewrite any accepted migration. The 28 frozen domains
remain the domain inventory.

Only authenticated receives EXECUTE on:

- portal.record_mission_progress(workspace_id uuid, program_version_id uuid,
  mission_id uuid, learner_ref_id uuid, action text).
- portal.record_cohort_delivery(workspace_id uuid, program_version_id uuid,
  mission_id uuid, cohort_id uuid, action text).

PUBLIC/anon/service_role execution is revoked. Private helpers have no caller
execution grant and remain in unexposed portal_private. SECURITY DEFINER functions
use qualified names and an empty search_path. Existing learning/actor/audit guards
remain in effect. There is no service credential or generic mutation proxy.

Both RPCs independently check active adult-confirmed profile, active workspace and
membership, ACTIVE exact-version entitlement, PUBLISHED/RETIRED version and exact
mission parent. FAMILY additionally requires OWNER and an active learner belonging
to that FAMILY workspace. SCHOOL requires an active cohort and OWNER/SCHOOL_ADMIN,
or the exact active teacher assignment. Authorized SCHOOL owners cannot use the
individual progress RPC; FAMILY owners cannot use the cohort RPC.

HR01 uses a deliberately strict execution vocabulary: BOTH version and mission
completion_rules must equal `{"method":"ADULT_ATTESTATION"}` exactly, and mission
evidence_expectations must equal `{"required":false}` exactly. Empty, absent,
unknown, extra or unsupported requirements deny completion. This vocabulary does
not publish, change or infer requirements for existing curriculum. Only synthetic
fixtures were populated with it. Start remains available independently; completion
requires a started record. No completion follows from opening/reading/time spent.

FAMILY: absent/NOT_STARTED → IN_PROGRESS → COMPLETED.
SCHOOL: absent → STARTED → DELIVERED. No learner progress fan-out.

Subject UPDATE locks serialize absent-row insertion and concurrent advancement.
Unique subject/mission constraints supply durable request identity. An achieved
state returns without DML, timestamp changes or an additional audit event; late
Start cannot downgrade a terminal state. There is no reset/reopening/delete/bulk
operation. Existing creator identity remains fixed; audit identifies actual later
mutation actors. SCHOOL delivered_at is server-generated.

## D. Exact HR02 write-session boundary

A bare unexpired JWT is insufficient. The database independently requires:

1. Native authenticated/non-anonymous JWT context with valid iat/exp.
2. The same managed Auth account, not anonymous, soft-deleted or currently banned.
3. The JWT session_id to identify that adult's still-existing auth.sessions row.
4. JWT AAL to match current managed AAL, and not_after to remain unelapsed.
5. JWT iat not to predate the managed refreshed_at epoch second.
6. An active adult-confirmed application profile plus all domain authority above.

Auth account/session and authorization rows are locked against concurrent mutation.
Session/expiry is checked again after waiting for subject locks. Direct native RPC
invocation cannot omit these checks. The API also retains native Auth /user checks,
host-only HttpOnly cookies, pending-signout quarantine, same-origin JSON input,
selected-workspace isolation and final Auth/subject reconciliation. Client actor
input is never accepted or installed as trusted claims.

This strengthens only new ordinary mutations. It neither redesigns 01B nor closes
SNV06 globally. It does not require staff authority/MFA for ordinary adults, select
the latest login across independent sessions, or distinguish multiple JWTs issued
within the same epoch second of the same current managed session. Native JWT
signature validation remains PostgREST's responsibility. Hosted managed-schema
compatibility/privileges remain unverified by these local tests.

Revocation committed before a waiting authorization check denies the mutation.
A revocation arriving behind an already-authorized, locked transaction can follow
that commit. Six revocation-first races were exercised; this is not an exhaustive
concurrency proof or recall of committed actions. Final response checks can suppress
acknowledgement, not undo a committed write. Fetch abortion has the same limit.

## E. Validation results and evidence separation

All infrastructure was disposable loopback Supabase/Docker/Chrome, with synthetic
example.invalid adults and genuine managed Auth/TOTP. No hosted/customer data,
provider configuration or deployment was used. Counts overlap and include Node
parent entries; they are not a unique-scenario total.

| Group | Measured result |
| --- | --- |
| Accepted 01A in-memory foundation | 188 exact-inventory assertions PASS |
| Accepted runner inventory self-tests | 7 PASS |
| Accepted foundation on final clean native migration stack | 188 exact-inventory assertions PASS |
| Unchanged native SNV01 email regression | 13 PASS |
| Unchanged native SNV03 current staff/TOTP regression | 100 PASS |
| Accepted mocked/runtime/coordination/01C client-handler groups | 223 PASS entries |
| New 01D API/completion contracts | 52 PASS entries |
| New actual-client lifecycle/status tests | 22 PASS |
| Combined final Node execution | 297 PASS / 0 FAIL |
| Separate 01D in-memory SQL suite | 15 exact-inventory assertions PASS |
| Accepted 01B native runtime, with temporary signature-byte test input repair | 70 PASS; see Section F |
| Accepted original native-backed Chrome flow | 20 PASS |
| Accepted A01/A02 browser sequence | 20 PASS |
| Accepted A04 missing-completion recovery | 27 PASS |
| Accepted A05 sustained/replayed pending | 16 PASS |
| Accepted native 01C curriculum | 44 PASS |
| Accepted native-backed 01C browser | 52 PASS |
| Final 01D native Auth/RPC/transactions | 139 PASS |
| Final 01D native-backed Chrome | 17 PASS |
| Source checks | 10 changed/new JavaScript syntax checks, native Python AST, whitespace and bounded credential-pattern scan PASS |

Native 01D cases include direct table-DML denial and RPC grants; anonymous, forged
actor and wrong-kind denial; active FAMILY ownership; SCHOOL teacher/admin/owner;
unassigned/revoked teachers; inactive subjects/cohorts/workspace/adults; absent
adult profiles; suspended/revoked entitlements; mismatched version/workspace; and
entitled RETIRED versions. Completion denies empty/unknown/extra/evidence-required
contracts. Eight concurrent starts and eight concurrent terminal actions in EACH
mode create exactly one audit per actual transition. Learner, teacher assignment,
membership, entitlement, profile and managed-session revocations held uncommitted
cause waiting writes to deny after revocation commits.

Managed-session cases include genuinely signed-out tokens, absent/wrong-adult
session IDs, JWT/managed expiry, changed assurance, managed refresh timestamp,
banned/deleted accounts, and a GENUINE native refresh: the pre-refresh token is
denied and the freshly issued token can write. The signed-out-token negative
control still succeeds on ordinary stateless curriculum SELECT but fails on the
new write RPC with no domain mutation. SNV06 therefore remains OPEN.

Actual-client tests cover held reads/writes across subject/workspace/session and
private lifecycle changes, duplicate clicks, uncertain acknowledgement, expired/
denied states, truthful empty subjects, periodic coalescing, revoked subject during
continuation, and subject-ID-only fresh same-version navigation. Browser tests
confirm native FAMILY completion/SCHOOL delivery, exact permitted domain changes,
held acknowledgement suppression after subject switch, fresh recovery of committed
status, literal subject codes, mobile overflow check, blur clearing and unassigned
teacher's curriculum access with an empty cohort selector. Mobile/desktop
screenshots were visually inspected. Clock/focus/held replies are controlled tests,
not hosted or operating-system scheduling proof.

## F. Test-input corrections, failures and limits

Historical accepted sources/reports were not edited. The checked-in 01B native
signature challenge changes only the last base64url character. Three final-stack
attempts failed there. Its previously documented ambiguity was independently
reproduced: an alternate final character can encode identical signature bytes,
while an actual decoded-byte change is rejected by BOTH native Auth and Portal.
The particular failed tokens were not retained, so attributing each failed attempt
to that ambiguity is an inference, not a reconstruction of those exact tokens.

To avoid treating repeated sampling as validation, a temporary copy of the accepted
native test changed only that challenge's input to flip a decoded signature byte,
plus the temporary script's repository-root locator. All 70 predicates/names stayed
the same and passed. The checked-in accepted source remains byte-identical. One
intermediate attempt immediately after the independent control failed its synthetic
OTP request because that control renewed the same fixture's cooldown; that output
is retained separately. The original unchanged 70-check test also passed on the
first disposable stack before the final bounded account/refresh gate refinement.
These are distinct execution claims; the final raw checked-in failures are not
represented as passing.

Other authoring/orchestration failures: the initial separate SQL fixture inserted
completion rules inside an expected-denial block, so completion correctly failed;
the fixture anchor was corrected (initial raw output was not retained). A native
grant probe incorrectly constructed portal-qualified names before schema filtering;
its test query was corrected to use each row's actual schema. A prematurely
dispatched browser invocation preceded creation of its test file. The latter two
failure logs are retained. None required weakening production authorization.

Evidence roots (outside Git):

- Initial: `/var/folders/v7/9s2qngr52z798fdlhklzlhx40000gn/T/aiea-01d-7jhz0_b_`.
- Final: `/var/folders/v7/9s2qngr52z798fdlhklzlhx40000gn/T/aiea-01d-final-u1cwkkvo`.

Final sanitized artifacts include all-node-final.log, foundation-final.log,
foundation-pglite.log, snv01-native.log, snv03-native.log,
portal-entry-signature-byte-input.log, signature-control.log,
accepted-entry-signature-byte-input.py, portal-browser.log, portal-audit.log,
portal-pending.log, portal-replayed.log, curriculum-native.log,
curriculum-browser.log, curriculum-a01-no-write.json, progress-native.log,
progress-native-results.json, progress-browser.log, progress-browser-results.json,
progress-family-mobile.png, progress-school-desktop.png and final-candidate-hashes.json.
The separate 15-assertion final SQL result is progress-database-final.log in the
initial root. Failure logs remain separately named; private setup/status logs do not.

## G. No-write/domain and exact-row snapshots

Accepted final curriculum browsing/continuation compared all 28 Portal tables:

before = after = `76c84d704a050e89e0ce7f94000232eef77e10563efea2262c57c49130b3cb0c`.

Final native 01D GET compared all 28 table digests in memory and changed none.
Denied and duplicate actions likewise preserved all domain digests. Successful
FAMILY actions changed only mission_progress/audit_event; SCHOOL actions changed
only cohort_mission_delivery/audit_event. Additional row-digest comparisons prove
that selected FAMILY start/completion and each SCHOOL role's delivery changed only
the exact subject/mission status row. Concurrent absent-row and terminal requests
assert one audit per transition. Browser snapshots independently verify the same
permitted domain sets. SCHOOL has zero learner progress rows after delivery.

These snapshots exclude deliberate test-operator fixture/authority mutations,
which are separately performed to exercise denial. No product action mutated
learners, cohorts, assignments, assessments, evidence, resources, billing or
entitlements. Raw personal-domain snapshots were not retained; hashes/results
supply minimized evidence.

## H. Privacy, exclusions and inherited notes

Only existing bounded learner/cohort codes, exact curriculum context, status and
necessary audit metadata are used. No child accounts, full-name/DOB collection,
notes, uploads or persistent browser private cache were added. Code/status fields
render literally. Actor/provider identifiers and arbitrary completion JSON are
not projected to the UI.

Observations/reflection submission, assessments/scoring, evidence/artifacts,
resources/Blob delivery, provisioning/assignment management, individual SCHOOL
progress, reset/reopening/deletion/bulk actions, program completion/certificates,
feedback, support/export/privacy interfaces, commerce, Factory coupling/import/
publishing and Sprint 01E remain excluded. No real curriculum or production data
was provisioned. Vercel Pro changes no architectural assumption or launch gate.

| Inherited ID | Unchanged disposition and meaning |
| --- | --- |
| 01B-A03 | NOTE — OPEN: hosted rewrite/CDN/HTTPS-cookie behavior unproven |
| SNV02 | NOTE — OPEN: deprecated local inbucket configuration |
| SNV04 | NOTE — OPEN: refresh-chain cascade invalidation unproven |
| SNV05 | NOTE — OPEN: exact-path-only native callback guarantees unproven |
| SNV06 | NOTE — OPEN: ordinary stateless Data API may accept an unexpired signed-out JWT |

The genuine refresh test proves only this new write gate, not global refresh-chain
cascade behavior. No inherited note was closed, removed or reclassified. No new
product blocker was observed within executed local scope; independent audit may
identify additional findings. Strict rules/provisioning dependencies and hosted
assurance remain explicit limits, not claims of pilot launch readiness.

## I. Cleanup and final repository state

Both disposable stacks were stopped with --no-backup. All containers and volumes
are absent; Docker has only bridge/host/none networks. No port-4321 listener remains.
Both copied projects, private credential/fixture-reference JSON and raw startup/
status credential logs were removed. Native browser contexts/Chrome and adapters
closed. Existing installed tools/images and earlier accepted evidence were retained.
A bounded scan of retained evidence found no complete JWT, secret-key literal or
TOTP URI; it is not a proof against every possible secret format.

Final branch main; HEAD remains 079e7f2a13142e956a5766d6e9e17a1f94718f5f.
Working tree contains exactly the 19-path unstaged/untracked manifest above;
index remains empty. Frozen contract, accepted migrations, Auth configuration,
Vercel configuration, dependencies and historical evidence remain unchanged.

No staging, commit, push, deployment, hosted test, real-user/customer provisioning,
provider configuration change, Factory operation or self-acceptance occurred.

**STOP — implementation and local validation complete. Return to Irene for the
separately ordered independent adversarial audit.**
