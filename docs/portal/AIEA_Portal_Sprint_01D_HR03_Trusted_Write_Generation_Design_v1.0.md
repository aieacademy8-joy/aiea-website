# Sprint 01D — HR03 trusted write generation amendment

Date: 2026-10-08. Human Authority: Irene. Written before HR03 implementation.
Authority: supplied 01D-HR03 authorizes this bounded LOCAL Auth architecture
amendment, implementation and native validation. The frozen original contract and
historical 01D-A01 failure/blocker reports remain unchanged.

## Boundary

Only the two 01D status RPCs gain issuer-bound freshness authority. Existing OTP
UX, access-token HttpOnly cookie, refresh-token discard, pending-signout/private
state, 01C reads, RLS, domain authorization, HR01, monotonic/idempotent writes and
audit provenance remain unchanged. No additional browser credential or refresh
lifecycle. No hosted activation, provider production change or publication.

Add forward migration `20261008000200_portal_write_generation.sql`; retain all
earlier migrations. It adds:

- `portal_private.write_session_generation(session_id, user_id, generation)`.
  Session primary key and managed session/user foreign keys with cascading cleanup.
  The row binds one Auth session to its immutable adult identity and current
  positive bigint generation. No child/subject/curriculum information is stored.
- Private bigint `write_generation_seq`, NO CYCLE. Values are allocated only after
  locking the managed session. This supplies fresh increasing values even after a
  registry row is removed; values never reset/recur through the authorized paths.
  Allocation is global, but authority is strictly per session: advancing A changes
  only A's registry row and cannot invalidate B. Rollback can consume sequence
  values without changing authority; gaps are intentional.
- `portal_private.issue_write_generation(event jsonb) returns jsonb`, SECURITY
  INVOKER, empty search_path. Only `supabase_auth_admin` receives execution/schema
  usage and narrowly required table/sequence privileges. PUBLIC/anon/authenticated/
  service_role receive none. Registry RLS is enabled and forced; its policies allow
  only the trusted Auth role to SELECT/INSERT/update generation. No DELETE,
  TRUNCATE, identity UPDATE or sequence reset grant. Existing private function
  grants do not expand. `portal_private` stays outside exposed API schemas.
- Replace the existing private `assert_write_session()` implementation in place;
  no new exposed RPC/signature. Keep all account/session/assurance/expiry/profile
  checks. Replace the insufficient refreshed_at/iat comparison with exact locked
  generation matching. Both existing RPCs already call this helper before domain
  authorization and again before mutation.

## Trusted issuance and write transaction

The hook derives session ID from issuance `claims.session_id`, adult ID from
`event.user_id` and `claims.sub`, requires their equality and authenticated,
non-anonymous issuance, and verifies the managed session/user pair. It locks that
managed session FOR UPDATE before allocating and upserting a fresh generation.
Conflict updates only generation and requires the existing identity to match;
mismatch fails the issuance transaction. Existing issuer claims are preserved,
except `aiea_write_generation` is overwritten with the authoritative canonical
positive decimal string. Client metadata is never the source of authority.

Supabase's PostgreSQL hook runs within native token issuance's transaction;
native validation must establish visibility, rollback and timeout behavior. A
failed/rolled-back hook must not publish new authority or a usable token. Missing
hook activation yields tokens without the required claim and fails closed for
01D writes, while accepted reads retain their existing behavior.

Writes lock managed user, managed session FOR SHARE, then registry FOR SHARE;
they compare JWT subject, session ID and canonical string generation with that
locked row. Missing/malformed claim or missing/mismatched state denies. There is
no request argument/header to register, repair or substitute generation. Native
PostgREST verifies the JWT signature. Already-authorized writes retain their locks
until commit. Refresh first means a waiting stale write sees the committed newer
generation and denies. Write first means refresh waits, that write may commit,
then issuance advances. Out-of-order responses cannot change authoritative state.
Concurrent issuance serializes per managed session; no response is presumed current
just because it arrives last. All domain authority checks remain mandatory.

## Local configuration and validation

Only the copied disposable Supabase config receives:

```toml
[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/portal_private/issue_write_generation"
```

Repository and hosted Supabase/Vercel configuration stay unchanged. No remote
link/db push. Synthetic loopback identities only. Inspect all callable signatures,
owners, ACLs, role memberships, policies and exposed schemas for bypasses.

Validation must cover all 30 HR03 requirements: initial issuance; genuine same-
and cross-second old/current results in FAMILY/SCHOOL RPC/API modes; missing,
malformed, forged and mismatched claims/state; registry/hook/grant/DML isolation;
independent sessions; concurrent issuance; refresh-first/write-first/waiting-write
ordering; out-of-order responses; logout and account/domain revocations; HR01,
idempotency, zero SCHOOL learner fanout, no denied domain/audit mutations and
no-write GET; hook rollback/failure/timeout/unavailability; token/cookie bounds;
accepted 01A/01B/01C regressions and browser private-state behavior.

Keep implementation-authored SQL/mocked tests, native Auth/PostgREST, browser,
negative controls and unproven assumptions distinct. Preserve all raw failed test
results and historical independent 01D-A01 failure. Local results do not self-accept
or substitute for Irene's independent re-review. No global SNV04/SNV06 closure.

## Governance

All five inherited notes remain NOTE — OPEN: 01B-A03 (hosted routing/cookie
assurance), SNV02 (inbucket deprecation), SNV04 (global refresh-chain invalidation),
SNV05 (exact callback guarantees), SNV06 (ordinary stateless Data API behavior).
All prior product exclusions remain: provisioning, observations/reflections,
assessments, evidence/artifacts, uploads/resources, individual SCHOOL progress,
Factory coupling, commerce, child accounts and Sprint 01E. No staging, commit,
push, deployment, hosted configuration/testing or real customer data.

Sources: [Supabase hook contract/security/local configuration](https://supabase.com/docs/guides/auth/auth-hooks),
[custom access-token hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook),
[version-pinned transaction/timeout implementation](https://github.com/supabase/auth/blob/v2.197.0/internal/hooks/hookspgfunc/hookspgfunc.go).
