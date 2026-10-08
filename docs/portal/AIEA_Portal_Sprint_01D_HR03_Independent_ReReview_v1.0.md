# Sprint 01D HR03 — Independent Correction Re-Review v1.0

Date: 2026-10-08 (America/Chicago). Reviewer role: independent correction reviewer.
Authority: supplied “AIEA PORTAL — SPRINT 01D INDEPENDENT HR03 CORRECTION RE-REVIEW.”
Scope: complete current working-tree candidate; disposable LOCAL infrastructure and synthetic data only.

## Verdict and classification

**PASS — 01D-A01 CLOSED; candidate ready for final Human Authority acceptance/repository-boundary review.**

The HR03 candidate independently denies genuinely superseded same-second tokens
across direct FAMILY RPC, direct SCHOOL RPC, FAMILY API and SCHOOL API. Current
tokens perform actual authorized mutations. No new BLOCKER, MAJOR or MINOR defect
was identified. This is a bounded local correction review, not Human Authority
acceptance, hosted activation, launch approval or a global JWT-invalidation claim.

| Finding | Current disposition |
| --- | --- |
| 01D-A01 | MAJOR — CLOSED for this HR03 candidate by fresh independent native evidence |
| New BLOCKER / MAJOR / MINOR | None identified |
| Five inherited notes | NOTE — OPEN, unchanged; listed below |

The original four same-second HTTP-200 mutation failures remain **historical FAIL**.
Neither their evidence nor the previous blocker/implementation reports was edited
or relabeled. The historical independent JSON at
`/private/tmp/aiea-01d-independent-audit/independent-results.json` has SHA-256
`5150f906745d06952d5b1c175e065353f5e1d0465919250bd7e4ed6bdce2d9b7`.
A minimized, hash-bound copy of its four failed rows is in the new evidence corpus.

## Candidate and independent method

Reviewed the HR03 design and implementation report as claims to verify, the two
01D migrations, both write RPCs and private helpers, native hook/registry/sequence,
existing grants/RLS/guards, API/runtime/Auth-cookie interaction, status client and
browser lifecycle, HR01 rules, and historical A01/blocker evidence. The native
function inventory and ACLs were inspected rather than inferred from documentation.

The candidate was on `main`, HEAD
`079e7f2a13142e956a5766d6e9e17a1f94718f5f`, with seven tracked modifications and
19 untracked candidate files. All 200 Git-visible files were hashed before review.
No implementation or existing repository file was changed during this review.

Auditor-owned evidence root:
`/var/folders/v7/9s2qngr52z798fdlhklzlhx40000gn/T/aiea-hr03-independent-kpbvs38w`.
The new `independent.py` contains reviewer-authored HTTP probes. It shares inspected
synthetic fixture and domain-hash utilities with the existing tests; its issuance,
RPC/API requests, same-token negative controls and assertions are separately authored.
The implementation-authored native matrix was also inspected and freshly executed
on the reviewer-owned stack. Prior implementation results were not reused as PASS
evidence. Mocked/in-memory tests are identified separately below.

Local versions: GoTrue `v2.197.0`, PostgREST `v16.4`, PostgreSQL `15.19`
(`postgres:15.19.0.004`), with `read committed` transaction isolation. Only the
temporary copied Supabase config enabled the custom access-token hook and numeric
email template. Repository Supabase/Vercel/provider configuration remained intact.

Candidate SHA-256 values:

| File | SHA-256 |
| --- | --- |
| Original 01D mission-status migration | `e05eb2bba019b17f4d72b40f7f7b033eef5450fcdb81f90be842a9fc8af5ba6f` |
| HR03 forward generation migration | `d958198cc2bb77599e593420c25cb63e33a2748af5ddeed163cdbdfbf7c1c7b0` |
| Frozen P0 architecture | `f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755` |

## Original same-second case and negative controls

Each pair below came from native Auth verification followed by a genuine refresh
within the same epoch second. No JWT issuance timestamp was manufactured. The
session and adult remained the same; Auth signed distinct advancing generations.

For each mode the separate reviewer test ran this sequence: HR03 denies old token;
temporarily install the exact historical timestamp-only gate in the disposable DB;
the same old token/request mutates; restore HR03; the identical old token/request
is denied again; current token performs a real terminal mutation, and also starts
another fresh subject row. Restoration ran in `finally` and was source-verified.

| Mode | Equal native old/new `iat` | Generations | HR03 stale before / after control | Historical stale control | Current token |
| --- | --- | --- | --- | --- | --- |
| FAMILY RPC | 1791497355 | 69 → 70 | 403 / 403 | 200; mission_progress + audit_event changed | 200; actual mutation |
| SCHOOL RPC | 1791497361 | 77 → 78 | 403 / 403 | 200; cohort_mission_delivery + audit_event changed | 200; actual mutation |
| FAMILY API | 1791497368 | 85 → 86 | 403 / 403 | 200; mission_progress + audit_event changed | 200; actual mutation |
| SCHOOL API | 1791497376 | 93 → 94 | 403 / 403 | 200; cohort_mission_delivery + audit_event changed | 200; actual mutation |

Every denied probe compared hashes of all 28 Portal domain tables, including
`mission_progress`, `cohort_mission_delivery` and `audit_event`: **zero changes**.
Successful probes required the exact target status row, only its domain plus audit
to change, and exact authenticated audit-actor provenance. Negative-control
HTTP-200 mutations are retained as expected security **FAIL**, separate from
positive candidate results. The native regression matrix independently repeated
all four negative controls and restored the actual candidate.

Primary artifacts: `independent-results.json`, `independent-negative-controls.json`,
`independent.py`, `write-generation-native-results.json`,
`write-generation-negative-control-results.json`, `schema-after-adversarial.json`.

## Required security review

| Requirement | Independent disposition and evidence |
| --- | --- |
| 1. Authoritative session identity | PASS. Session PK and managed session/user FKs; hook locks the exact managed session/user pair. Gate requires registry user = JWT subject and registry session = owned managed session. Operator-only registry identity corruption denied writes and issuance rather than silently rebinding. |
| 2. Trusted advancement | PASS. Native issuance alone invokes the invoker hook, locks the session before allocating, and writes a fresh noncycling sequence value. Ordinary callers cannot execute the hook, allocate/reset the sequence, or mutate the registry. Reissuance after operator removal never reused a generation. |
| 3. Signed claim authority | PASS. Canonical top-level string claim is overwritten by trusted issuance. Header/body substitution and unsigned payload replacement failed in all modes. Separate ordinary authenticated metadata updates succeeded as untrusted data but could neither repair stale tokens nor replace the authoritative issued claim. |
| 4. Both RPCs | PASS. Each five-argument RPC reaches the common locked subject/session/generation gate through lock_status_authority and checks again before DML. Each path was tested directly and through its API, including actual permitted mutations. |
| 5. No alternate bypass | PASS. Native inventory has exactly the two intended exposed write signatures and no other authenticated-callable Portal function. Existing callable private helpers are read/authorization helpers; mutation helpers and hook are denied/unexposed. Native restored hook/gate bodies exactly match the forward migration. |
| 6. Direct DML | PASS. Authenticated direct table INSERT/UPDATE/DELETE grants remain absent across Portal tables; actual signed-adult INSERT attempts against both status tables returned 403 without changes. No new write policy was added. |
| 7. Private privileges | PASS. anon/authenticated/service_role/authenticator have no registry, allocator, hook-execution, private-schema CREATE, or trusted-Auth-role membership authority. Actual authenticated SQL read/insert/update/delete/truncate/hook/nextval/setval probes were denied. Explicit private-schema Data API request returned 406. Existing private-schema USAGE for read-policy helpers is unchanged and grants no new state authority. |
| 8–9. Same second; denied effects | PASS. Separate native comparison above covers all four modes with actual current mutations, exact same-token controls and zero denied domain/audit mutations. |
| 10. Cross second | PASS. Genuine cross-second pairs denied old and allowed current tokens in all four modes, with exact permitted changes. |
| 11. Independent sessions | PASS. Same adult, distinct native sessions: advancing A preserved B's registry and authorized B writes in all four modes; A's old token remained denied. The sequence's global position is not an authorization comparison. |
| 12. Concurrency | PASS. Controlled native barriers prove refresh-first commits then waiting stale write denies with no changes; write-first obtains authority locks then commits its bounded mutation before refresh; subsequent old writes deny. Three concurrent refreshes per FAMILY/SCHOOL produced distinct serialized generations, with only the authoritative one accepted through RPC/API. Delayed older response replay could not restore authority. |
| 13. Revocation | PASS. Native logout removes session/registry. Expired JWT/session, deleted session/account, ban, changed assurance, inactive profile/workspace/subject and revoked membership/entitlement deny. Existing status suite also retained teacher assignment, ownership, version and revocation-race controls. |
| 14. HR01 | PASS. Unsupported/absent/additional completion requirements deny; explicit start precedes completion. No inferred completion, SCHOOL learner fanout, reset/downgrade/delete/bulk action. Native status suite and browser tests passed under HR03. |
| 15. Idempotency/audit | PASS. Duplicate start, duplicate terminal, late start and lost-acknowledgement retry preserve domain/audit hashes. Actual permitted writes affect exact rows; authenticated audit actor is verified and creator provenance remains preserved by existing guards. |
| 16. Reads | PASS. Authorized status/curriculum GET preserves all 28 domain hashes, audit and generation state. Read paths contain no status mutation invocation. |
| 17. Accepted regressions | PASS. Fresh native foundation, OTP, staff assurance, unchanged 01B runtime, 01C curriculum, 01D status, runtime/client and Chrome suites passed. Staff assurance was also rerun with the hook enabled. Counts are separated below. |
| 18. Hook failures | PASS. Post-allocation error/timeout and unavailable execution privilege return no token and roll back authority/managed-session changes. Initial issuance failure rolls back the new session and registry. Recovery advances authority and denies the formerly current token. |
| 19. Token/cookie bound | PASS. HR03 matrix tokens were 971 characters, including deliberately added metadata; final fresh native sample was 862 characters. Both remain within the unchanged 3800-character token limit. Real cookie/browser verification passed. |
| 20. Bounded architecture | PASS. No additional browser credential or Portal refresh-token lifecycle; accepted access-token cookie/refresh-token discard remain unchanged. No browser service credential, generic DB proxy, product expansion, hosted operation or Sprint 01E work. |

The issuance hook is SECURITY INVOKER with an empty search path. Only
supabase_auth_admin receives the necessary registry SELECT/INSERT,
UPDATE(generation), sequence USAGE and hook execution. It receives no registry
DELETE/TRUNCATE, identity UPDATE or sequence reset authority. Registry RLS is
enabled and forced. Write helpers/RPCs use qualified names and an empty search
path; the native inventory confirms their owners and execution grants.

Writes retain managed-user/session/registry authorization locks until transaction
end. Native Auth uses session SKIP LOCKED/retries when a write holds authority;
the race tests observed those retries and unchanged generation while blocked.
They did not assume refresh must exhibit a persistent PostgreSQL lock wait.
The relevant isolation behavior is consistent with the
[PostgreSQL 15 transaction-isolation documentation](https://www.postgresql.org/docs/15/transaction-iso.html).

## Fresh execution results

Counts overlap across suites and Node includes parent test entries; they must not
be summed as unique scenarios. All PASS rows below were produced during this review.

| Evidence category | Result |
| --- | --- |
| Separately reviewer-authored native probes | 91 checks; 0 failed; four historical security-FAIL controls separately retained |
| Inspected implementation-authored HR03 native suite, freshly rerun | 605 checks; 0 failed; four additional historical security-FAIL controls separately retained |
| Native foundation under all migrations | 188 assertions; exact accepted inventory |
| Default-template native OTP / staff assurance | 13 / 100 checks |
| Hook-enabled native staff assurance | 100 checks |
| Unchanged 01B native runtime source | 70 checks; no input correction used |
| Separate native signature-byte controls | 6 checks; identical-byte alias accepted, actually changed bytes denied |
| 01B Chrome ordinary / audit / pending / replayed | 20 / 20 / 27 / 16 checks |
| 01C native / Chrome | 44 / 52 checks |
| Existing 01D native / Chrome | 139 / 17 checks |
| Mocked/deterministic Node runtime/client suites | 297 reported test entries; 0 failed |
| In-memory SQL under all migrations | Foundation 188; generation 16; status 15; exact inventories |
| Assertion-runner self-tests | 7 passed |

FAMILY mobile and SCHOOL desktop status screenshots from this review were inspected.
Native Auth/PostgREST evidence is distinct from browser timing simulations and
mocked upstreams. The accepted 01B source's signature test passed unchanged on
this run; the separate six-byte controls corroborate its underlying security
property without claiming alternate encodings are signature corruption.

One final metadata-extractor attempt failed after the intentional fresh-stack
reset because it imported a status utility requiring the removed curriculum
fixture JSON. Its traceback and parent failure log remain retained. The temporary
extractor alone was changed to use the accepted entry utility directly; rerun
passed. This failure occurred before its database probes, did not change the
candidate, and was not relabeled PASS. The earlier successful post-adversarial
capture and final fresh-stack capture are both retained.

## Availability and limits

The injected native hook timeout returned HTTP 500 without a token after
**2.058 seconds**. Managed session and registered generation rolled back; no Portal
domain/audit changed. The old token remained current and could write after the
failed refresh. Successful recovery advanced generation and then denied it.
Rolled-back sequence allocation was consumed without reusing authority.
The local default timeout and transactional dispatch are consistent with the
[pinned GoTrue hook implementation](https://github.com/supabase/auth/blob/v2.197.0/internal/hooks/hookspgfunc/hookspgfunc.go).

Hook/database availability becomes an access-token issuance dependency. Failure
denies new issuance rather than weakening the write gate. An absent hook or token
without its claim fails closed for 01D writes. Hosted hook compatibility, grants,
activation, HTTPS/CDN/cookies and load/availability remain outside this review;
the measured timeout is not a hosted SLA. The
[custom-access-token-hook contract](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook)
is supplemental context; the security verdict rests on inspected code and native
local execution. These are bounded adversarial tests, not exhaustive model checking.

## Inherited notes — unchanged

| ID | Classification and disposition |
| --- | --- |
| 01B-A03 | NOTE — OPEN: hosted rewrite/CDN/HTTPS-cookie behavior unproven |
| SNV02 | NOTE — OPEN: deprecated local inbucket configuration |
| SNV04 | NOTE — OPEN: refresh-chain cascade invalidation unproven |
| SNV05 | NOTE — OPEN: exact-path-only native callback guarantees unproven |
| SNV06 | NOTE — OPEN: ordinary stateless Data API may accept an unexpired signed-out JWT |

No inherited note is reclassified. Generation authority is consumed only by the
two bounded 01D writes; this review does not close SNV04/SNV06 globally.

## Repository boundary and cleanup

This report is the **only repository file created or modified by the re-review**:
`docs/portal/AIEA_Portal_Sprint_01D_HR03_Independent_ReReview_v1.0.md`.
All 200 initially hashed Git-visible files remain byte-identical, including
implementation files, accepted source/configuration and historical reports.
The historical independent-results JSON hash also remains unchanged. The index is
empty and `git diff --check` passes. The pre-existing 26-path candidate is preserved,
with this report as the sole additional path.

The reviewer-owned stack was stopped with `--no-backup`; its containers/volumes,
copied project, generated credentials, fixture-reference JSON and raw startup/status
credential logs (including retry variants) were removed. No port-4321 adapter
remains. Restored native function sources, role privileges and absence of test
fault functions were verified before disposal. Sanitized logs/results/screenshots,
harness sources, hashes and cleanup evidence remain at the external evidence root.
A bounded scan found no complete JWT, modern key or TOTP URI in retained text;
this is not a proof against every secret format. Pre-existing external audit
artifacts were left untouched.

No hosted Supabase, Vercel/provider configuration, real customer data, deployment,
stage, commit, push or Sprint 01E operation occurred.

**PASS — 01D-A01 CLOSED; candidate ready for final Human Authority acceptance/repository-boundary review.**

**STOP.**
