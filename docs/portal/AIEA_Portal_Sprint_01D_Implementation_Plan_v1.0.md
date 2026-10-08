# AIEA Portal — Sprint 01D Implementation Plan v1.0

Date: 2026-10-08 (America/Chicago). Authority: Irene's accepted reconnaissance,
01D-HR01/HR02 and bounded implementation authorization. This plan precedes code changes.

## Objective and rulings

Explicit adult-recorded mission status only: FAMILY uses existing active learner
references and mission_progress; SCHOOL uses existing authorized active cohorts
and cohort_mission_delivery. Reading never records activity. SCHOOL delivery never
creates individual progress or asserts completion/mastery.

HR01: IN_PROGRESS is explicit. COMPLETED requires explicit published mission AND
version support for adult attestation with no additional completion mechanism.
Absent, empty, unknown, ambiguous, unsupported, assessment/evidence/artifact rules
deny completion. No reset/reopening/downgrade/delete/bulk action. Repeated achieved
actions cause no mutation/audit. SCHOOL supports STARTED then DELIVERED only.

HR02: only the new writes require a current managed Auth session, in addition to
verified JWT/adult/workspace/entitlement/subject authorization. A bare signed JWT
is insufficient. The database RPC independently checks the JWT's session_id
against the same adult's live auth.sessions record, assurance and expiry; locks
the session row against deletion/revocation during the transaction. Managed
account checks also deny banned/deleted/anonymous managed identities. A JWT issued
before the managed session's refreshed_at epoch second is stale for this path.
This is session validation, not a claim of unique/latest JWT identity within one
issuance second or a new global single-session policy. Native local
logout/expiry/revocation/downgrade and direct-RPC tests must establish the boundary.
No global 01B Auth redesign and no global SNV06 closure. If managed session state
cannot safely enforce this boundary, stop rather than weaken HR02.

## Schema, RPC and migration boundary

Add one forward migration: supabase/migrations/20261008000100_portal_mission_status.sql.
Do not rewrite the three accepted migrations, configuration or frozen architecture.
No new tables/columns. Add two narrowly granted SECURITY DEFINER functions in the
already-exposed portal schema: record_mission_progress and record_cohort_delivery.
Qualified names/empty search_path; revoke default PUBLIC/anon execution and grant
only authenticated execution. Private helpers remain unexposed/non-callable.
Direct table DML stays denied. Existing learning/audit guards remain authoritative.

RPCs validate active adult-confirmed profile, active selected workspace/membership,
exact ACTIVE entitlement, PUBLISHED/RETIRED exact version, mission/version FK,
active FAMILY learner in that workspace or active SCHOOL cohort and exact active
teacher assignment (OWNER/SCHOOL_ADMIN are school-wide). No service key/actor input.
Lock authorization rows and subject in a consistent order, then reread/check under
locks. Concurrent revocation either precedes authorization and denies the action,
or follows the authorized commit; response rechecks cannot undo a committed write.

Completion vocabulary is deliberately strict and versioned in the new write
contract: both version and mission completion_rules must exactly equal
{"method":"ADULT_ATTESTATION"}; mission evidence_expectations must exactly equal
{"required":false}. This is a proposed runtime vocabulary, not publication,
curriculum modification, or an assertion that existing curriculum uses it. All
other JSON denies completion. Synthetic local fixtures alone use this vocabulary.

## API/UI boundary

New api/portal/progress.js and lib/portal/progress.js: bounded GET subject/status
read model and strict same-origin JSON POST actions. All requests reuse current
native Auth/profile/cookie/pending-signout checks and selected-workspace isolation.
Writes forward the adult JWT with Content-Profile: portal to the fixed RPC only.
Reads have explicit projections, subject/version limits and final authorization
reconciliation. No generic mutation proxy, credential exposure or upstream errors.

Minimally extend runtime.js, shell.js, portal.js and portal.css. Select existing
learner/cohort, show statuses, explicit Start/Complete or Start/Delivered controls,
server-confirmed save/error/retry states. Empty subjects provide support guidance.
No optimistic success, automatic write, persistent private state or cached restore.
Extend the existing generation/abort/private clearing lifecycle to subject/status
and held writes, including fresh subject authorization before automatic resumption.
Extend the loopback adapter for the fixed endpoint.

## Transactions/idempotency

Use unique learner/mission and cohort/mission identities plus subject-row locking
to serialize concurrent inserts/advancement. Start creates/advances only the
appropriate initial state. Complete/Delivered requires a started state; terminal
states never regress. Already-achieved actions return current state without DML,
timestamp changes or another audit event. Existing creator identity is preserved;
audit records the actual updater. Lost acknowledgement is resolved by safe reread
and explicit idempotent retry. Aborted client fetch does not cancel DB commit.

## Privacy and exclusions

Only existing bounded learner/cohort codes, status and required context/audit data.
No child accounts, names/DOB/notes/media, observations/reflection submission,
assessment/scoring, evidence/artifacts/uploads, resources/Blob delivery,
provisioning/assignment management, individual SCHOOL progress, bulk completion,
certificates/program completion, feedback, exports/support/deletion endpoints,
commerce/provider configuration, Factory coupling/import/publishing, or Sprint 01E.
Existing curriculum text remains literal. Retention policy/launch gates persist.

## Validation and evidence

Preserve and rerun accepted 01A foundation/security, 01B runtime/coordination/native
and browser, and 01C handler/client/native/browser regressions. Add separate SQL
assertion inventory/runner, mocked API and actual-client tests, native direct-RPC
and browser tests. Disposable loopback-only Supabase with synthetic example.invalid
adults and real managed Auth; no hosted/customer data. Test grants/DML denial,
signed-out/revoked/expired/stale-managed sessions including direct RPC, all roles,
workspace/version/subject mismatch and inactive/revoked authority, RETIRED access,
rule fail-closed behavior, concurrent/idempotent requests, lost acknowledgements,
revocation races and stale UI. Snapshot all domains around reads and mutations;
only intended status/audit rows change. Native authority mutations are test-only.
Keep private credentials/logs/screenshots outside Git; dispose stack/project/secrets.
Record exact manifest, counts, limits, negative controls and cleanup in the separate
implementation/validation report. No self-acceptance; independent audit is later.

## Five inherited OPEN NOTES

- 01B-A03 — hosted rewrite/CDN/HTTPS-cookie behavior unproven.
- SNV02 — deprecated local inbucket configuration.
- SNV04 — refresh-chain cascade invalidation unproven.
- SNV05 — exact-path-only native callback guarantees unproven.
- SNV06 — ordinary stateless Data API may accept an unexpired signed-out JWT.

All remain NOTE — OPEN. Pro deployment changes no architecture assumption.
Do not stage, commit, push, deploy, change provider configuration, or self-accept.
