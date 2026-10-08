# Sprint 01D — 01D-A01 correction investigation: STOP / BLOCKED

Date: 2026-10-08. Human Authority: Irene. Scope: only 01D-A01.

## Disposition

**01D-A01 remains MAJOR / OPEN. No compliant correction was implemented.**
The explicit instruction to stop when the accepted managed-session architecture
cannot reliably distinguish same-second pre-refresh and current access tokens
applies. The current 01D candidate does not satisfy HR02 and is not ready for
acceptance or publication. This addendum supersedes any interpretation of the
earlier implementation report as proof of complete HR02 compliance.

No production code, migration, authentication, grants, configuration or existing
test was changed during this investigation. HR01 and domain authorization were
left unchanged. No workaround that denies both tokens or trusts caller-supplied
freshness information was implemented.

## Historical failed independent audit

Irene's correction request reports the independent adversarial audit reproduced:

| Genuine refresh case | Reported independent result |
| --- | --- |
| Same-second old token, direct FAMILY RPC | HTTP 200; mutation succeeded |
| Same-second old token, direct SCHOOL RPC | HTTP 200; mutation succeeded |
| Same-second old token, FAMILY API write | HTTP 200; mutation succeeded |
| Same-second old token, SCHOOL API write | HTTP 200; mutation succeeded |
| Same-second stale requests | Status rows and audit rows created |
| Cross-second old tokens | Correctly denied |

These are attributed independent findings supplied by Human Authority, not new
native reproductions by this investigation. The user also reports that the audit
environment was subsequently stopped by a cybersecurity boundary. No attempt was
made to resume that environment or bypass that boundary. No separate independent
01D audit artifact was present in this repository. The finding remains FAIL;
earlier implementation/validation evidence was preserved byte-for-byte.

## Cause and missing trusted information

`supabase/migrations/20261008000100_portal_mission_status.sql:4` defines the common
`assert_write_session()` gate. Its refresh check at line 28 rejects only JWT iat
values less than the whole-second floor of managed refreshed_at. Both RPCs call
this gate, including after waiting for subject locks. The API forwards the same
adult JWT to these RPCs. The shared predicate explains all four failures.

Source inspection of Supabase Auth v2.197.0 found that standard access-token
generation sets session_id, iat/exp, assurance and authentication claims, but sets
neither jti nor a refresh-generation claim. Refresh updates managed refreshed_at
after generating the access token. The session model contains a refresh-token
counter/key, but no current access-token fingerprint. The counter is not signed
into standard access-token claims. See the version-pinned
[token service](https://github.com/supabase/auth/blob/v2.197.0/internal/tokens/service.go#L545-L696)
and [session model](https://github.com/supabase/auth/blob/v2.197.0/internal/models/sessions.go#L74-L95).
Prior local startup evidence names gotrue:v2.197.0; no hosted version is assumed.

Engineering consequence: unchanged identity/assurance/metadata and same-second
issuance can leave old and new tokens with identical verified claims. Different
signature bytes, when present, do not indicate issuance order, and managed state
does not identify which signature is current. A session's current refresh counter
alone cannot prove which generation produced a presented access token.

The accepted 01B `api/portal/auth.js` deliberately discards refresh tokens, stores
only the verified access JWT in its HttpOnly cookie, and implements no refresh
exchange. A database-only timestamp adjustment cannot manufacture the missing
trusted binding. More precise refreshed_at comparisons, strict greater-than
comparisons, or waiting until a later wall-clock second reject the current token
too, or continue admitting the old token. API-only checks leave direct RPCs open.
Client headers/counters, user metadata, or registration authenticated solely by
the indistinguishable access token cannot establish freshness.

A compliant solution needs a trusted issuance/refresh binding independently
verifiable by the RPC. For example, an issuer-managed generation claim with
matching transactional state would require a separately reviewed Auth integration
and provider configuration. An application-managed credential alternative would
require a separately reviewed issuance/refresh/revocation lifecycle beyond 01B's
existing access-token cookie. Neither was authorized or implemented here. This is
a blocker within the present constraints, not a claim that HR02 is impossible
under every future architecture.

## Bounded validation and limits

Read-only inspection covered both write RPCs, their common gate, API/module,
accepted Auth cookie/verification flow, frozen contract, migration inventory and
the existing validation/report coverage. `mission-status.native.py:199` explicitly
waits until old iat + 1.1 seconds before genuine refresh; that test covers only a
cross-second case. Its earlier PASS does not prove the same-second requirement.

Four local arithmetic assertions passed as counterexample checks:

1. For old/current iat = 1800000000 and refreshed_at = 1800000000.750000, the
   existing floor comparison admits both tokens.
2. A strict comparison against that floor rejects both tokens.
3. Comparing the valid current integer iat to unrounded refreshed_at rejects it.
4. With old iat = 1799999999, the existing gate rejects old and admits current.

These checks establish the timestamp ambiguity only. They are **not** native
managed-Auth, RPC/API, authorization, race, audit or regression PASS results.
No new local stack, synthetic user, refresh exchange, domain mutation or audit
event was created. No hosted testing occurred. No post-correction validation
matrix was run because there is no correction. Same-/cross-second native tests
for all four modes, signout/expiry/revocation, denied-request domain/audit snapshots,
HR01/idempotency/authorization and accepted 01A/01B/01C regressions remain required
after a compliant design is authorized and implemented. Earlier test counts are
historical results and are not renewed by this investigation.

## Repository boundary and changed paths

Investigation change: exactly one new documentation path:

`docs/portal/AIEA_Portal_Sprint_01D_A01_Correction_Blocker_Report_v1.0.md`.

The pre-existing 19 candidate paths were hash-recorded before this addendum and
verified unchanged afterward:

```text
api/portal/progress.js
lib/portal/progress.js
lib/portal/runtime.js
lib/portal/shell.js
portal/README.md
portal/portal.css
portal/portal.js
scripts/portal/serve-local.mjs
scripts/portal/test-progress-browser.mjs
scripts/portal/test-progress-client.mjs
scripts/portal/test-progress-database.mjs
scripts/portal/test-progress.mjs
supabase/README.md
supabase/migrations/20261008000100_portal_mission_status.sql
supabase/tests/mission-status.assertions.json
supabase/tests/mission-status.native.py
supabase/tests/mission-status.sql
docs/portal/AIEA_Portal_Sprint_01D_Implementation_Plan_v1.0.md
docs/portal/AIEA_Portal_Sprint_01D_Implementation_and_Validation_Report_v1.0.md
```

Branch main; HEAD 079e7f2a13142e956a5766d6e9e17a1f94718f5f. Final working tree:
20 candidate paths (7 modified, 13 untracked), none staged. `git diff --check`
passes. Frozen contract SHA-256 remains
f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755.
Accepted tracked migrations, Auth/provider/Vercel configuration and historical
accepted/audit reports remain unchanged. No stage, commit, push, deployment,
hosted operation, product expansion, Factory integration or Sprint 01E work.

## Inherited notes and Human Authority decision

All five inherited notes retain their existing disposition:

| ID | Disposition |
| --- | --- |
| 01B-A03 | NOTE — OPEN: hosted rewrite/CDN/HTTPS-cookie behavior unproven |
| SNV02 | NOTE — OPEN: deprecated local inbucket configuration |
| SNV04 | NOTE — OPEN: refresh-chain cascade invalidation unproven |
| SNV05 | NOTE — OPEN: exact-path-only native callback guarantees unproven |
| SNV06 | NOTE — OPEN: ordinary stateless Data API may accept an unexpired signed-out JWT |

**STOP.** A separate Human Authority ruling is needed to authorize design of the
missing trusted issuance binding and any consequent change to the frozen Auth
integration/configuration boundary. HR02 must remain intact. No such design or
change has been started, and no finding or inherited note is closed.
