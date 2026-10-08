# Sprint 01D — HR03 correction implementation and local validation

Date: 2026-10-08. Human Authority: Irene. Authority: supplied 01D-HR03.

## Disposition and historical finding

The bounded HR03 correction is implemented and locally validated. The final clean
native HR03 run passed **605 checks**. Same-second and cross-second old tokens
were denied, while current tokens performed real mutations, in all four modes:
direct FAMILY RPC, direct SCHOOL RPC, FAMILY API POST and SCHOOL API POST.

**01D-A01 remains MAJOR / OPEN pending independent re-review and Human Authority
classification. This report does not self-accept or publish Sprint 01D.**

The independent audit's four same-second HTTP-200 mutation failures remain FAIL.
The original external artifact was located at
`/private/tmp/aiea-01d-independent-audit/independent-results.json`; it was not
rewritten. A minimized copy of the four failures, including source SHA-256 and
changed domains, is retained with this run's evidence. Earlier 01D plan,
implementation report and correction-blocker report remain byte-for-byte intact.
This report and the separately authored HR03 design are the current amendment;
earlier epoch-second limitations/PASS statements do not prove HR02 compliance.

## Exact HR03 changed-path manifest

The only additional production executable is the forward SQL migration below.
No API/client/Auth-cookie implementation changes were needed for HR03.

| HR03 change | Repository-relative path |
| --- | --- |
| New governed amendment, written first | docs/portal/AIEA_Portal_Sprint_01D_HR03_Trusted_Write_Generation_Design_v1.0.md |
| New correction evidence | docs/portal/AIEA_Portal_Sprint_01D_HR03_Correction_Implementation_and_Validation_Report_v1.0.md |
| New forward migration | supabase/migrations/20261008000200_portal_write_generation.sql |
| New synthetic SQL cases | supabase/tests/write-generation.sql |
| New independent SQL assertion inventory | supabase/tests/write-generation.assertions.json |
| New native Auth/RPC/API/race/fault cases | supabase/tests/write-generation.native.py |
| Extend separate 01D in-memory runner | scripts/portal/test-progress-database.mjs |
| Bind synthetic status fixture to trusted generation | supabase/tests/mission-status.sql |
| Replace synthetic timestamp advancement with generation advancement | supabase/tests/mission-status.native.py |
| Document current bounded write security | supabase/README.md |
| Document current Portal boundary | portal/README.md |

These are 11 HR03 paths: six new files and five edits to the previous candidate.
The other 15 pre-existing candidate paths were hash-verified unchanged, including
the original 01D migration and all three earlier 01D governance/evidence files.
The three accepted 01A migrations, frozen original architecture, accepted Auth
handler, repository Supabase/Vercel configuration and dependency files are intact.

## Schema, grants and trusted issuance

`portal_private.write_session_generation` stores only session_id, user_id and a
positive bigint generation. Session PK and managed session/user FKs enforce
identity existence; session deletion cascades registry cleanup. Nothing is added
to the 28 Portal product-domain tables. No managed Auth schema DDL is introduced.

A private noncycling bigint sequence allocates fresh values after the managed
session is locked. This avoids reuse even if a registry row is removed while its
Auth session survives. Authority is per registry session row, never per user or
global sequence position. Independent sessions do not invalidate one another.
Rollback gaps are intentional; allocation alone confers no authority.

`portal_private.issue_write_generation(event jsonb)` is SECURITY INVOKER with an
empty search_path. It derives identity from native issuance user_id, claims.sub
and claims.session_id; verifies subject equality, authenticated/non-anonymous
context and the managed session/user pair; locks that session FOR UPDATE; then
inserts/advances its registry generation. A conflicting adult identity causes an
issuance error rather than rebinding. The hook overwrites the top-level
`aiea_write_generation` claim with the authoritative canonical decimal string,
preserving other issuer claims. User metadata/body/headers are not authority.

Only supabase_auth_admin receives hook execution and required schema usage,
registry SELECT/INSERT/UPDATE(generation), and allocator USAGE. Registry RLS is
enabled and forced, with only trusted-Auth SELECT/INSERT/UPDATE policies. That
role receives no registry DELETE/TRUNCATE/identity UPDATE or allocator reset grant.
PUBLIC/anon/authenticated/service_role have no new registry/allocator authority
or hook execution. Native authenticated SQL attempts to read/insert/update/
delete/truncate the registry, invoke the hook or allocate/reset its sequence were
denied. Native ACL/membership checks also cover the Data API login role and private
schema CREATE privileges. The registry and hook remain outside exposed schemas;
an explicit private-schema Data API request returned HTTP 406.

## RPC and transaction semantics

The migration replaces `portal_private.assert_write_session()` in place. Both
existing five-argument RPCs continue to call it before domain authorization and
again before mutation. No exposed signature, generation parameter or repair RPC
is added. The insufficient refreshed_at/iat comparison is replaced, not retained
as a fallback. Native signature validation remains Auth/PostgREST's responsibility.

The common gate preserves account anonymity/deletion/ban checks, JWT role/iat/exp,
managed session ownership/AAL/not_after and active adult-confirmed profile checks.
It locks the managed user/session and authoritative generation, and requires exact
signed subject/session/generation matching. Missing/malformed claims/state and
identity mismatches fail closed. Existing workspace, membership, exact-version
entitlement, learner/cohort and teacher-assignment authorization remains intact.

Registry advancement is in native token issuance's transaction. A refresh that
commits first causes waiting stale writes to see newer authority and deny. A write
that establishes all authority locks first can commit; refresh follows. Native
Auth uses SKIP LOCKED with API-level retries when those session locks are held,
rather than necessarily exhibiting a persistent database lock wait. The tests
observe actual retry SELECT counts and unchanged generation while the write holds
authority. They then prove the write and refresh complete in the permitted order.
Concurrent refreshes produce distinct serialized generations; only the currently
registered generation authorizes writing, regardless of response-consumer order.

HR01 is unchanged: explicit FAMILY start; completion only under the exact supported
published mission/version attestation vocabulary without additional required
mechanisms; SCHOOL delivery only, without learner fanout. No reset/downgrade/delete/
bulk action. Achieved actions perform no status DML or additional domain audit.
Existing actor provenance, exact-row writes and audit triggers remain authoritative.

## Native local activation boundary

Only the copied disposable config enabled:

```toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/portal_private/issue_write_generation"
```

Repository and hosted configuration were not changed. Accepted OTP UX, access JWT
HttpOnly cookie, refresh-token discard, pending-signout/private-state behavior,
ordinary RLS and 01C curriculum reads remain unchanged. The hook runs at access-
token issuance; only the two 01D mutation RPCs consume its claim as authority.
No second browser credential, refresh-token lifecycle, service credential in the
browser or generic mutation proxy was added.

## Validation results and evidence separation

Evidence root: `/private/tmp/aiea-hr03-mpuzf4ic` (private local directory).
Counts overlap and Node includes parent entries; these are not a summed count of
unique scenarios. All identities/data were synthetic and all infrastructure local.

| Evidence category | Result |
| --- | --- |
| Authored in-memory SQL | Unchanged foundation 188; new generation 16; status 15; exact inventories matched under all forward migrations |
| Authored Node mocked/deterministic runtime/client tests | 297 reported entries PASS; inventory runner's seven self-tests PASS |
| Native PostgreSQL foundation | 188 assertions PASS under all forward migrations |
| Native default-template/email and staff assurance regressions | 13 and 100 checks PASS |
| Accepted 01B native runtime | Initial unchanged-source run 70 PASS; clean unchanged-source run hit the signature-input alias defect described below; temporary input-only byte correction 70 PASS |
| Separate native signature-byte controls | Six PASS; equivalent bytes accepted, actual changed bytes denied by Auth and Portal |
| Accepted 01B Chrome | Ordinary 20; A01/A02 20; A04 27; A05 16 PASS |
| Accepted 01C native / Chrome | 44 / 52 PASS, including final clean fixture run |
| Existing 01D native / Chrome | 139 / 17 PASS, including final clean fixture run |
| New HR03 native Auth/PostgREST/API | Final clean run: 605 PASS; see write-generation-native-results.json and write-generation-native.attempt3.log |
| Original-gate negative controls | Four expected security FAIL results, each HTTP 200 with status/audit mutation; current generation gate restored and the same old token denied |
| Final native schema/grant evidence | Restored hook/gate bodies exactly match the new forward migration; full Portal/private function inventory and restrictive role checks captured |

The 605-check run covers all 30 HR03 requirements:

| Requirements | Executed proof |
| --- | --- |
| 1–4 | Initial exact session/adult binding; genuine same-epoch-second and cross-second issuance; old denied/current actual start and terminal mutation in all four modes |
| 5–7 | Missing, null, wrong-type, noncanonical, invalid/oversized and incorrect generations; same-adult wrong session/generation; unsigned payload substitution; missing/corrupt registry identity |
| 8–10, 29–30 | Native role ACL/membership and functional SQL denials; valid signed adults cannot directly INSERT either status table; private RPCs/tables unexposed; exactly the two expected callable Portal signatures, no additional authenticated-callable Portal function |
| 11–12 | Two independent sessions for the same adult; refresh A leaves B's registry and authorized mutations intact, in all modes |
| 13 | Three concurrent native refreshes for FAMILY and SCHOOL; distinct generations; only committed authoritative generation mutates through either RPC/API mode |
| 14–16 | Native refresh-first/waiting-write and write-first ordering in all four modes, using controlled test-only transaction barriers |
| 17 | Native response A withheld from the simulated consumer until after B; installing/replaying A after B cannot restore write authority. This models consumer delivery order, not physical network packet timing |
| 18–19 | Genuine logout removes managed session/registry; expired JWT/managed session, deleted session/account, ban, assurance change and inactive profile/workspace/subject or revoked membership/entitlement deny; original 139-check suite retains teacher/ownership/exact-entitlement controls and revocation races |
| 20–23 | HR01 fail-closed rules; actual duplicate/terminal no-op snapshots; exact permitted status/audit changes only; zero SCHOOL learner progress; denied requests preserve all 28 product-domain digests |
| 24–25 | Successful authorized status/curriculum GET preserves domain/audit and generation state; accepted regressions above |
| 26–27 | Native post-allocation hook errors, initial issuance failure, timeout and unavailable execution grant return no token and roll back authority/session state; recovery succeeds |
| 28 | Native access tokens 862–863 characters, within unchanged 3800-character cookie-token boundary; real API and browser cookie flows succeed |

Hook timeout measured **2.051 seconds** locally, returned HTTP 500 with no token,
and preserved prior authority. The previous current token could still perform an
authorized mutation after the failed refresh. Recovery advanced generation and
denied that old token. Sequence allocation consumed by rollback was never reused.
This characterizes the tested local default; it is not a hosted availability SLA.

Successful actions were checked against exact subject/mission row digests and
permitted status/audit domain sets. Denied/duplicate requests compare all 28 Portal
table digests, including audit_event. Deliberate operator fixture/revocation changes
precede those snapshots and are not product mutations. Raw personal-domain rows
or tokens were not retained as proof; minimized results/hashes were retained.

Native Chrome screenshots were retained and the FAMILY mobile status view inspected.
No HR03 UI change was made. Existing subject/workspace clearing, no automatic write
retry, held acknowledgements and pending-signout protections remain covered.

## Failed runs and negative controls remain historical evidence

No failed run was relabeled PASS. Retained records distinguish:

1. Original independent same-second failures and the earlier blocker report.
2. Initial HR03 partial run: 346 successful predicates, then a harness barrier
   incorrectly expecting a persistent Auth DB wait. Source/native evidence showed
   SKIP LOCKED/API retries; only the harness changed. A separate 72-check race/fault
   diagnostic passed before the full clean rerun.
3. Clean accepted 01B raw test failure: its last-character base64url substitution
   can leave signature bytes identical. Six actual-byte/alias controls passed; a
   temporary input-only copy passed all 70 predicates. Accepted source is intact.
4. Reset-orchestrator stale progress-fixture marker: a new empty database skipped
   fixture setup. The GET expectation failed. Marker cleanup was corrected; that
   failure is retained, followed by clean-fixture execution.
5. Intermediate 541-check HR03 run: an API entitlement revocation correctly returned
   404, while the new test expected 401/403. Only concealed version/subject denial
   expectations were corrected. Generation/session denial expectations were not
   broadened. A separate 136-check remaining-control diagnostic passed.
6. Initial metadata-extractor SQL aggregation syntax failed; corrected extraction
   passed. A bytecode syntax-check attempt also hit macOS cache permissions;
   in-memory syntax compilation succeeded without changing the runtime/code.

Original-gate negative controls are stored separately as expected FAIL, never
folded into security PASS. They intentionally installed the old helper only in
the disposable database, then restored the actual migration helper. Final native
source matching and function inventory confirm restoration. Test-only fault
triggers/functions and temporary hook EXECUTE revocation were removed/restored.

## Limits, exclusions and inherited notes

Hosted activation, managed-schema compatibility/grants on the hosted project,
production HTTPS/cookie/routing behavior and operational load/availability remain
unproven. Hook availability becomes a dependency of access-token issuance: local
failures deny new issuance rather than weakening write authority. No existing
token is backfilled. Without hook activation or a new valid issuance, 01D writes
fail closed. Reauthentication uses the accepted OTP flow; no Portal refresh feature
was added. Any future hosted activation needs separate Human Authority approval.

This is bounded local evidence, not exhaustive concurrency/model verification,
launch readiness or global JWT invalidation. No global SNV04/SNV06 closure.

| Inherited ID | Unchanged classification |
| --- | --- |
| 01B-A03 | NOTE — OPEN: hosted rewrite/CDN/HTTPS-cookie behavior unproven |
| SNV02 | NOTE — OPEN: deprecated local inbucket configuration |
| SNV04 | NOTE — OPEN: refresh-chain cascade invalidation unproven |
| SNV05 | NOTE — OPEN: exact-path-only native callback guarantees unproven |
| SNV06 | NOTE — OPEN: ordinary stateless Data API may accept an unexpired signed-out JWT |

No child accounts, provisioning, observations/reflections, assessments, evidence/
artifacts, resources/uploads, individual SCHOOL learner progress, commerce,
Factory coupling, generic publishing/import pipeline or Sprint 01E work. Vercel
Pro changes no architectural assumption. No real customer or production data.

## Cleanup and repository state

The earlier local audit runtime/adapter was still running at inspection; it was
stopped for fresh validation without executing or modifying the audit's code or
historical artifacts. Validation stacks were disposable copies. Final cleanup
stopped the stack with --no-backup and removed its copied project, generated
credentials, fixture-reference JSON and raw startup/status credential logs,
including retry variants. Sanitized evidence, failed runs, screenshots and test
input-control sources remain outside Git. Pre-existing audit artifacts remain
untouched. Installed tooling/images are retained.

Final checks verify no local stack containers/volumes or port-4321 adapter remain,
no test fault function remains in captured pre-cleanup metadata, and retained new
evidence has no complete JWT/modern secret-key/TOTP-URI match in a bounded scan.
The scan is not a proof against every possible secret format.

Branch **main**, HEAD **079e7f2a13142e956a5766d6e9e17a1f94718f5f**.
Working tree contains 26 candidate paths: seven tracked modifications and 19
untracked files. Index is empty; `git diff --check` passes. Frozen original
contract SHA-256 remains
f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755.
No stage, commit, push, deployment or hosted/provider production change occurred.

Full candidate working-tree manifest (includes the 15 unchanged earlier candidate
paths; the HR03-only changes are identified above):

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
```

**STOP: return this correction candidate to Irene for independent re-review.**
