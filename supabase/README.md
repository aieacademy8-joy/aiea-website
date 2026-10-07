# AIEA Portal database foundation — Sprint 01A

Authority: [FROZEN P0 v1.0](../docs/portal/AIEA_Portal_P0_Architecture_and_Data_Contract_v1.0_FROZEN.md).
No remote project is linked. No migration has been sent to Supabase. No seed or
real user account is created. All public website and `/api` files are unchanged.

## Structure and order

1. `20261006000100_portal_domains.sql`: 28 frozen domains, keys, relationships,
   constraints, timestamps, indexes, locale-neutral identities and locale rows.
2. `20261006000200_portal_security.sql`: RLS on all 28 tables, least-privilege
   read grants, column-limited entitlement summaries, scoped authorization helpers.
3. `20261006000300_portal_guards.sql`: publication/content locks, structural
   option-key validation, authenticated learning actors, immutable submitted
   evidence/finalized attempts, audit triggers, staff gate and billing guards.

`portal` is the future exposed schema; `portal_private` must never be exposed by
PostgREST. Helpers use qualified names and a fixed empty search path. SQL migration
owner owns the security definers. Ordinary adults receive SELECT only in 01A.
Raw billing, Stripe events, staff authorization and audit have no browser grants.
`entitlement` exposes only id/workspace/version/status/timestamps. Billing summaries
remain server-only until an approved bounded summary API exists.

The service role has server-only domain DML, bypassing RLS as Supabase intends;
it has no direct audit DML. Staff authorization alone grants no browser access.
`staff_has` requires an active adult profile, active authorization, exact capability,
JWT `aal2` and `amr.method=totp`, plus the JWT's current managed Auth session:
same adult, managed `aal2`, no elapsed `not_after`, and its bound factor still a
verified TOTP belonging to that adult. Missing/malformed session IDs deny access.
No Auth tables or private helpers are granted to browser roles by this check.
Publication/retirement and staff-management triggers
reinforce this gate. **These are not complete staff endpoints.** Every future
support/export/entitlement/privacy endpoint must independently authenticate, use
this gate, validate targets, constrain reads/mutations, and audit the operation.
Read/export audit endpoints are not implemented. There is no production staff path.

Sprint 01A-C corrections F01–F05 preserve this boundary: the staff predicate returns
only TRUE/FALSE, malformed/missing AAL or AMR denies access, and all staff guard
call sites require explicit TRUE. Original grant provenance is immutable;
revocation derives its actor/time and is immutable thereafter. Reactivation and
API deletion of staff grants fail closed pending a separately controlled lifecycle.
Narrow FK-driven actor nulling remains available to the controlled operator privacy
workflow. Audit entries retain the actual actor through the nullable actor FK and
grant/revocation timestamps, without duplicating personal actor IDs in JSON.

The tests simulate a trusted JWT/session at SQL level. Do not copy `set_config`
or a browser-provided actor into a production service client. Future ordinary write
RPCs should run with the validated adult JWT and bounded SECURITY DEFINER logic;
no write RPC or API handler is granted here. A service key alone supplies no adult
identity and fails the learning/billing actor guards. Trigger actors derive from
`auth.uid()` and never from a supplied record actor value.

## Reproducible offline checks

From the repository root, with Python 3 and Node available:

```sh
python3 scripts/portal/validate-foundation.py
node --check scripts/portal/test-database.mjs
node scripts/portal/test-database.mjs --self-test
git diff --check
```

The Python script validates the repository boundary and obvious credential
patterns. It is not a SQL parser or a proof that all secrets are absent. No existing
test/lint/build commands exist in `package.json`; syntax-check the unchanged API
and `js/main.js` with `node --check` as an additional offline runtime check.

For actual isolated SQL execution, install the pinned test-only runtime outside
the repository, with lifecycle scripts disabled (network/package installation may
require approval). No repository package or lockfile changes are needed:

```sh
npm install --prefix /tmp/aiea-portal-01a-validation --ignore-scripts --save-exact @electric-sql/pglite@0.3.14
node scripts/portal/test-database.mjs /tmp/aiea-portal-01a-validation/node_modules/@electric-sql/pglite/dist/index.js
```

The runner creates an in-memory PostgreSQL instance, loads the test-only synthetic
Auth bootstrap, applies migrations in order, executes transactional assertions and
destroys the instance. It accepts no database URL and cannot connect to a provider.
The complete suite has 188 named assertions. `supabase/tests/assertions.json` is a
separately checked-in expected inventory; the runner rejects missing, unexpected
or duplicated executed labels and invalid expected inventories. Do not generate
that inventory from the SQL at runtime. Intentional changes to assertions require
review of both files. The `--self-test` path checks seven inventory validation
cases without loading a database. Counts are not evidence of correctness on their
own; the assertion predicates and expected SQLSTATEs are the behavioral evidence.
PGlite 0.3.14 uses PostgreSQL 17.5; the planned Supabase local config uses 15.
This validates SQL behavior, not Supabase Auth, PostgREST, PG15 compatibility or
multiple concurrent sessions. [PGlite documentation](https://pglite.dev/docs/).

The separately authorized SNV03 native regression is
`supabase/tests/staff-assurance.native.py`. After starting a disposable local
stack with these migrations, supply its private CLI JSON credential-file path
in `AIEA_LOCAL_CREDENTIALS` and run the script with Python 3. It accepts only
`http://127.0.0.1:54321` and the local `supabase_db_aiea-portal-local` container.
It creates synthetic adult/session/factor/curriculum fixtures, verifies genuine
TOTP, and tests all three privileged guard paths. Dispose of the entire local
stack afterward; it is not a cleanup tool or a hosted-project test.

After separate authorization and installation of Supabase CLI + Docker, a future
local Supabase validation can use:

```sh
supabase start
supabase db reset --local --no-seed
psql -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p 54322 -U postgres -d postgres -f supabase/tests/foundation.sql
```

Use the **local** stack only. The test SQL rolls back all synthetic identities and
fixtures. `bootstrap.pglite.sql` is exclusively for the in-memory runner and must
never run against Supabase. CLI config remains unverified in 01A. Do not run
`supabase link`, remote `db push`, or apply SQL to any external project in 01A.

## Integrity and lifecycle boundaries

- Role/workspace compatibility is relational. SCHOOL-only cohorts and composite
  workspace/learner, workspace/cohort and membership relationships prevent tenant
  mismatch even for server DML. Membership and assignments use active partial
  uniqueness. Revocation changes visibility without deleting history.
- Exact-version composite relationships bind missions, attempts, responses,
  evidence and billing bases. Feedback with both learner and cohort checks the
  active relationship. Cohort delivery and individual progress remain separate.
- Billing creation requires a current authenticated purchasing member; actor is
  derived and correlation is immutable. A new billing basis or entitlement
  requires PUBLISHED, never RETIRED. Existing entitled access survives retirement.
- The database cannot verify Stripe signatures or provider payment truth. Pending
  billing is the default; verified event processing and trusted offer mapping
  remain mandatory before access can be enabled. `stripe_event` stores bounded
  identifiers/hash/state, not raw PII-rich payloads. Its ID is globally unique.
- Stripe correlation may resolve from NULL during PROCESSING/RETRYABLE_FAILED;
  once resolved it cannot be rebound or cleared. APPLIED requires a billing basis;
  APPLIED/IGNORED cannot regress to another processing state. Event deletion fails
  closed so identity/correlation cannot be reset by delete/reinsert. Initial
  resolution records old/new billing correlation in the audit. Exceptional future
  corrections/retention need a separately reviewed controlled operation.
- Customer IDs may recur across purchases. Checkout/PaymentIntent/Charge/latest
  Refund/latest Dispute IDs are unique when present. Event object IDs preserve
  multiple refund/dispute histories; uniqueness of an object ID is not imposed on
  the event ledger because several event types may describe the same object.
  Nullable subscription/invoice columns are constrained to NULL in P0.
- Deferred constraint triggers check BOTH billing and entitlement mutations.
  ACTIVE requires PAID, PARTIALLY_REFUNDED, DISPUTE_OPEN or DISPUTE_WON; pending
  checkout states cannot support ACTIVE access. Unresolved disputes may retain
  access or be SUSPENDED by the later controlled policy. REFUNDED/DISPUTE_LOST
  requires every corresponding entitlement REVOKED. Both orders of compatible
  atomic billing/entitlement updates are supported when these constraints are
  deferred; callers must validate the final state before committing.
  No automatic partial-refund transition is implemented. Provider ordering,
  retries, payment reconciliation and notification retry workers remain deferred.
- Publication requires staff/TOTP, publisher/time/hash, published default/explicit
  fallback locales and complete localized children for approved published locales.
  Child mutations lock both parent versions and cannot move published content.
  The publication API must compute/verify a canonical content manifest hash; SQL
  records/checks the digest shape and does not compute instructional truth.
- Response identity uses unique stable keys; localized option labels must match.
  Fallback selects requested published locale, then explicit fallback, then NULL.
  Default locale is not silently substituted. No runtime translation is present.
- Blob metadata stores versioned private paths and content hashes; actual Blob
  immutability/retrieval verification remains a server/storage integration gate.
- Child records contain no auth link. Adult confirmation is a server onboarding
  marker, not age verification. There is no authentication/UI account flow yet.
- Customer-domain FKs are RESTRICT; personal actor references use SET NULL where
  appropriate. Profile/staff subject rows must be handled before Auth deletion.
  Finalized/submitted/audit actor nulling is restricted to FK-driven deletion,
  preserving history. No uncontrolled CASCADE or automatic retention purge exists.
- Finalized attempt/evidence edits and learner-record deletion currently fail
  closed, including for service callers. Reviewed correction/privacy RPCs and
  accompanying guard changes are required later. No permanent deletion/export API
  is implemented. Exact retention durations remain a Human policy gate.

## Next-gate integration tests — not passed in 01A

| Gate | Required validation |
|---|---|
| Supabase local/project runtime | Apply cleanly on configured PostgreSQL version; validate CLI TOML and real managed Auth schema/privileges; rerun all SQL assertions. |
| Data API | Expose only `portal`; verify actual anon/adult/service JWT requests, column-limited entitlement summaries, denied writes, private helper non-exposure, and absence of public-schema side channels. |
| Adult onboarding | Disable anonymous/child signup; server-recorded adult confirmation; allowlisted magic-link/OTP callbacks; SMTP delivery and rate limiting in isolated test environment. |
| Staff MFA | Validate signed/expired/stale JWTs; TOTP AMR on issued tokens; phone-only aal2 denial; active/revoked capability checks, factor removal/recovery and ordinary MFA users; no staff authority from email/domain. |
| Concurrency | Two-session content-write/publication and retirement/new-purchase races; duplicate checkout/event/entitlement transactions; assignment revocation and in-flight reads/writes; retry/deadlock behavior. |
| Privileged operations | Bound targets/read limits and audit read/export/correction operations; no trusted actor input; no unguarded service bypass route. |
| Commerce | Every mandatory test/repair in FROZEN §R, including unpaid-complete, delayed payment, duplicate/replay, out-of-order provider truth, transient failures, unknown price, forged correlation, inactive member, full/partial refund, disputes and Postmark failure. |
| Privacy | Reviewed account/workspace/learner deletion and corrections across all linked data/exports; approved retention policy; null/pseudonymous actor preservation. |
| Resource delivery | Private versioned Blob authorization/hash checks and no learner upload/storage path. |

## Human setup required next — no action taken

The immediate gate after Sprint 01A-C is **independent re-audit**, before any
Supabase setup. The following setup actions remain later, separately authorized
work and were not begun during the correction pass.

1. Approve an isolated non-production Supabase project, owning organization,
   region and environment; retain database password securely outside this repo.
2. Approve migration review and explicit application in that environment only.
   Configure Data API exposed schema `portal`; exclude `portal_private`.
3. Approve adult-only onboarding, exact auth Site URL/callback allowlist, email
   magic link/OTP, disabled anonymous/phone login, disabled public signup until
   controlled onboarding exists, and application TOTP enrollment/verification.
4. Arrange transactional SMTP in a separate authorized provider step: SMTP host,
   port, username, password/token, sender email/name and verified sender/domain.
   No Postmark or DNS configuration was changed here. Test recipients must be
   explicitly approved. Staff factor recovery and first-grant procedure need review.
5. First staff authorization requires an explicit Human database-operator bootstrap
   for an already authenticated/onboarded adult, with a recorded actor and audit
   event. No automatic bootstrap RPC, email-domain grant or seed is provided.
6. Supply later browser-safe project URL/publishable key and **server-only** secret
   key via approved environment management. `.env.example` names are a future
   contract, not connected runtime config. Never put credentials in static sources.
7. A later commerce sprint also needs test Stripe secret API key, webhook signing
   secret, expected Stripe account/environment and approved Product/Price/internal
   offer -> exact published version map. These do not reuse live download access.
8. Direct database password/URL, project reference and CLI access token may be
   needed for authorized migrations/CI only; keep them out of browser/deploy files.
   Vercel Blob server access and SMTP credentials remain server-only. MailerLite
   has no Portal authorization role. No production env change is part of 01A/01B
   without separate approval.

Sources for security assumptions: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[JWT claims/AMR](https://supabase.com/docs/guides/auth/jwt-fields),
[TOTP](https://supabase.com/docs/guides/auth/auth-mfa/totp). These supplement the frozen
contract; they do not replace it or expand the authorized sprint.
