# AIEA Portal — Sprint 01A Implementation Foundation Report v1.0

Date: 2026-10-06 (America/Chicago)  
Authority: AIEA Human Authority's Sprint 01A repository implementation request  
Governing architecture: `AIEA_Portal_P0_Architecture_and_Data_Contract_v1.0_FROZEN.md`, FROZEN v1.0

## A. Executive implementation result

**PASS WITH BLOCKERS** — the authorized repository foundation is implemented and
passes isolated PostgreSQL and offline checks. Supabase-native integration remains
an explicit next gate. No Portal UI, live account, checkout integration, customer
access, deployment, remote migration, commit or push was performed.

The existing static Vercel site is preserved. Database work is isolated under
`supabase/`; no application framework or runtime dependency was introduced.

## B. Pre-implementation safety-gate result

**PASS before any repository modification.**

| Required check | Observed result |
|---|---|
| `git status --short --branch` | `## main...origin/main`, no changes |
| Branch | `main` |
| `git log -1 --oneline` | `0521016 docs(portal): freeze P0 architecture and data contract v1.0` |
| Local HEAD and cached origin/main | Both `052101670dc92b38c7ec15c88a2b07572e42d75b` |
| Actual remote `git ls-remote origin refs/heads/main` | Same full SHA; read-only network access approved after sandbox DNS failure |
| Freeze commit in history | Present; expected message matched |
| Canonical artifact | Exists, read in full, explicitly FROZEN v1.0 |
| Supporting history | Sprint 00B inspected; Sprint 00C reconciled against full frozen text; frozen artifact governs |
| Repository/runtime review | Static HTML/CSS/JS; nine CommonJS Vercel API files; `@vercel/blob` is the sole application dependency; no existing scripts/tests/build framework |
| Commerce/provider review | Existing checkout, access, webhook and private Blob download code inspected; Vercel routes and provider environment names inspected without reading real secrets |

No AGENTS.md was found in the repository or checked ancestor paths. Repository
CLAUDE.md was reviewed. No public-content or branding changes were needed.

## C. Files created

1. `.env.example`
2. `portal/README.md`
3. `scripts/portal/validate-foundation.py`
4. `scripts/portal/test-database.mjs`
5. `supabase/config.toml`
6. `supabase/README.md`
7. `supabase/migrations/20261006000100_portal_domains.sql`
8. `supabase/migrations/20261006000200_portal_security.sql`
9. `supabase/migrations/20261006000300_portal_guards.sql`
10. `supabase/tests/bootstrap.pglite.sql`
11. `supabase/tests/foundation.sql`
12. `docs/portal/AIEA_Portal_Sprint_01A_Implementation_Foundation_Report_v1.0.md`

## D. Files modified

Only `.gitignore`: ignore local `.env` variants and Supabase CLI state, while
keeping `.env.example` versionable.

Existing public pages, JavaScript, CSS, assets, `/api`, `package.json`, Vercel
configuration and the three architecture/history artifacts remain unchanged.

## E. Packages/config changes

No repository package or lockfile changes. No application packages installed.
PGlite **0.3.14** was downloaded with lifecycle scripts disabled into
`/tmp/aiea-portal-01a-validation` solely to execute SQL locally. Its package store
cache is managed by pnpm. This is a validation dependency outside the repository,
not a website dependency. Bundled Node **v24.19.0** was used.

New TOML is local-only: `portal` API schema, private helper schema excluded,
seed disabled, Storage disabled, signup/anonymous auth disabled, localhost callback
allowlist, TOTP enabled and phone MFA disabled. No CLI link or provider setup ran.
`.env.example` contains blanks and `test` mode only; no application consumes it.

## F. Implemented database/domain foundation

All **28** frozen domains are represented:

| Area | Tables |
|---|---|
| Identity/tenancy | user_profile, workspace, workspace_membership, learner_ref |
| School | cohort, cohort_teacher_assignment, cohort_learner_assignment, cohort_mission_delivery |
| Staff | staff_authorization |
| Commerce | stripe_event, billing_reference, entitlement |
| Curriculum | program, program_version, program_version_locale, mission, mission_locale, resource_asset |
| Assessment | assessment, assessment_locale, assessment_item, assessment_item_locale |
| Individual learning | mission_progress, assessment_attempt, assessment_response, evidence_record |
| Operations | pilot_feedback, audit_event |

Migration order is domains → RLS/security → guards/audit. Each migration is
transactional. No purchase_claim, program_participation, child auth, subscription
behavior, learner storage, eight-mission constraint or deferred feature was added.

## G. RLS/security foundation

RLS is enabled on every Portal table. Anonymous grants are denied. Adult profile,
active workspace/member, role, exact-version entitlement and active cohort
intersections authorize reads. School owners/admins have explicit workspace-wide
visibility; teachers see assigned cohorts and their assigned learners only.

Browser reads expose column-limited entitlement summaries, not raw billing/event,
staff or audit data. All browser mutations fail closed in 01A. Future write RPCs
and endpoints require separate implementation; read-only scaffolding is a phase
restriction, not a change to final P0 role semantics.

Staff authority is independent of email/domain and membership. The server-only
capability helper requires active staff + adult profile + TOTP AMR + aal2. Staff
grants, publication and retirement reinforce the gate. No broad staff browser
policy exists. Complete support/export/correction/privacy endpoints remain absent.

Trigger actors derive from `auth.uid()`. Test JWT claims are synthetic; production
code must validate tokens and use bounded RPCs rather than accepting claim/actor
values. Service credentials remain a trusted server boundary and bypass RLS;
no production service client or route was introduced. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[JWT/AMR reference](https://supabase.com/docs/guides/auth/jwt-fields),
[TOTP](https://supabase.com/docs/guides/auth/auth-mfa/totp).

## H. Integrity constraints

- Primary/foreign/composite keys, status checks, timestamps, tenant/access indexes.
- FAMILY OWNER-only roles; SCHOOL roles bounded; SCHOOL-only cohorts.
- Active membership/assignment uniqueness; relational cohort/member/learner tenancy.
- Exact mission/version, assessment/version, attempt/learner/workspace/version,
  response/item/assessment and entitlement/billing/workspace/version consistency.
- Unique cohort mission delivery, learner mission progress, attempt/item response,
  mission sequence, parent/locale and active entitlement/billing basis.
- Stable option keys and exact localized label-key correspondence; no translated
  label used as response/scoring identity.
- Authenticated purchasing authority and immutable server-trusted billing basis;
  unique provider event and applicable one-to-one Stripe identifiers.
- New purchases/entitlements require published non-retired versions. Deferred
  guards require full refund/final dispute loss and revocation to commit together.
- Publication records actor/time/digest, validates locales, locks content against
  concurrent publication, and freezes both old/new parents against reparenting.
- Finalized attempts/responses and submitted evidence cannot be silently rewritten.
- Privileged table mutations generate bounded audit entries; audit is append-only
  with a narrow FK-driven actor-nulling exception.

The canonical digest must be computed/verified by the future publication service.
The database cannot authenticate Stripe payment truth or prevent replacement of
an external Blob object; those remain mandatory integration gates.

## I. Multilingual foundation

Structural keys/rules are language-neutral. Four canonical locale relations are
included. Resources have an explicit locale or neutral flag. Default/fallback
locales reference actual locale rows. Requested published locale → explicit
published fallback → unavailable is deterministic. Assessment attempts require a
published assessment locale. Adult notes retain entered language. No runtime
translation is implemented; en-US is a profile/config default, not structural text.

## J. Privacy/retention notes

Learner references store only code/nickname, nullable broad age/grade band, status
and timestamps. No auth identity, DOB, required full name, child email or media.
Adult confirmation is an onboarding marker, not an age-verification claim.

Customer-domain FKs use RESTRICT; actor references use SET NULL where appropriate.
Deletion requires an ordered controlled workflow. An operator-level test proves
adult deletion can retain finalized learning, billing and audit while nulling
actors. This is not a shipped deletion endpoint. Learner deletion/correction,
exports and retention execution remain gated. No durations or automated purge
were invented. Published curriculum is independent of customer deletion.

## K. Commerce implemented vs deferred

Implemented: pending authenticated billing context, exact-version entitlement,
event identity/account/environment/hash/state, minimal provider identifiers,
notification state separated from access, immutable correlation, inactive nullable
subscription/invoice columns, and refund/final-loss revocation transaction guards.
Customer IDs may recur across one-time purchases; latest refund/dispute summary
IDs are unique and the event ledger retains multiple provider object histories.

Deferred: every runtime repair in **FROZEN §R (all 20 items)**. In particular,
valid payment truth, trusted offer map, account/workspace checkout, idempotent
transactional event processing, retries/order reconciliation, refund/dispute policy
handlers and Postmark retry separation are not wired. Existing download checkout,
Session/HMAC access and live webhook remain unchanged and cannot authorize Portal
data. No Portal payment or customer access is enabled.

## L. Validation run and exact results

| Check | Final result |
|---|---|
| Required initial Git/remote/freeze gate | PASS; full SHA matched actual remote |
| Three ordered migrations on isolated PGlite PostgreSQL **17.5** | PASS; all applied from an empty in-memory database |
| Transactional SQL assertion suite | **69 PASS, 0 FAIL** in final run |
| `python3 scripts/portal/validate-foundation.py` | **30 PASS, 0 FAIL** |
| Node syntax: nine existing API files, `js/main.js`, new database runner | PASS; **11 files** |
| New validator Python AST parse | PASS |
| Local TOML parsing/safety checks | PASS; parser accepts syntax and checked local-only flags |
| `git diff --check` | PASS |
| Existing npm test/lint/build | Not available; none defined in package.json |
| Frozen artifact and live tracked-file comparison | PASS; only tracked modification is .gitignore |
| Migration ordering, environment placeholders, ignored secrets/CLI state, credential-pattern scan | PASS; included in offline checks and manual diff review |
| Production provider/config changes | NONE |

Database assertions cover all six requested security cases, plus revocation,
family/admin scope, forged actor/metadata, stable option keys, immutable finalized
records, audit permissions, subscriptions disabled, billing/event integrity,
retirement, locale fallback and actor-nulling retention. They execute actual SQL,
RLS and role grants, not text-only schema assertions. The isolated runner accepts
no database URL. [PGlite execution model](https://pglite.dev/docs/).

Development iterations corrected a deferred-trigger record-field error before the
passing final run. Docker inspection found no running daemon; native psql,
PostgreSQL and Supabase CLI were unavailable. No Docker/CLI installation or remote
connection was attempted. PGlite execution does not claim Supabase integration.

## M. Tests requiring real Supabase/native environment

Not executed/passed here: local config startup and PostgreSQL 15 compatibility;
managed Auth schema and actual signed JWT/TOTP claims; PostgREST schema/column
permissions; SMTP/allowlist/account lifecycle; stale/revoked sessions and recovery;
two-session publication/assignment/idempotency races; bounded staff support/export
auditing; controlled privacy/correction operations; private Blob retrieval; all
Stripe §R end-to-end cases. `supabase/README.md` contains the explicit gate matrix
and local-only rerun commands. Synthetic Auth claims are not a production recipe.

## N. External Human Authority setup required next

No external setup was performed. Human approval is required for an isolated
non-production Supabase project, organization/region, migration review/application,
exposed schema `portal` (exclude `portal_private`), adult-controlled onboarding,
explicit magic-link/OTP URL allowlist, transactional SMTP, application TOTP and
recovery, and an audited first-staff database-operator bootstrap.

Eventually required values, **names/types only, no real values**:

- `PORTAL_SUPABASE_URL`, `PORTAL_SUPABASE_PUBLISHABLE_KEY` — browser-safe project values.
- `PORTAL_SUPABASE_SECRET_KEY` — trusted server only.
- Project reference, database password/connection URL and CLI access token —
  authorized migrations/CI only, outside static sources.
- SMTP host, port, username, password/token, sender email/name and approved
  sender/domain — transactional authentication configuration only.
- Future test Stripe API secret, `PORTAL_STRIPE_WEBHOOK_SECRET`,
  `PORTAL_STRIPE_ACCOUNT_ID`, `PORTAL_STRIPE_ENVIRONMENT`, approved internal
  offer/Product/Price/exact-version mapping — server only.
- Future private Vercel Blob server access and notification credentials — preserve
  existing isolated download configuration; separate approval for changes.

Production Vercel variables, Stripe products/prices/webhooks, Postmark, MailerLite,
DNS and live customer access remain outside this phase. Exact retention durations
need policy approval before broader launch. `supabase/README.md` specifies the
ordered Human actions and remaining implementation gates.

## O. Frozen-architecture conformance

**Preserved; no material deviation or architecture amendment required.**
Frozen §§E–G map to the 28 tables/keys; §§H–L to scoped RLS/adult/staff foundations;
§§M–N to billing/event/entitlement context; §§O–P to immutable version/localization
guards; §Q to controlled restrictive relationships and actor nulling; §R remains
an explicit future runtime gate. No freeze/history document was edited.

## P. Deviations or blockers

No architecture contradiction found. Implementation choices (custom `portal`
schema, unexposed helpers, text status checks and read-only browser grants) preserve
the frozen contract. Full authorized user actions are not claimed implemented.

Blockers to production/integration: no Supabase project/native runtime configured,
Supabase/PG15/API/concurrency tests unexecuted, no bounded write/admin/privacy RPCs,
no commerce runtime repairs, no SMTP/MFA onboarding/recovery, no approved retention
durations. These are later execution gates, not new architecture decisions.

## Q. Git status

Expected final short status, all changes uncommitted:

```text
## main...origin/main
 M .gitignore
?? .env.example
?? docs/portal/AIEA_Portal_Sprint_01A_Implementation_Foundation_Report_v1.0.md
?? portal/
?? scripts/
?? supabase/
```

HEAD remains `0521016`. No staging, commit, push or deployment was performed.

## R. Recommended Sprint 01B boundary

Human review/approval of this uncommitted scaffold, then a separately authorized
isolated Supabase setup and native validation sprint: confirm CLI/PG version,
apply reviewed migrations in non-production only, verify real Auth/PostgREST/RLS,
TOTP and concurrent transactions, and define/review bounded onboarding/write RPCs.
Keep production deployment, live commerce/customer access and §R runtime wiring
behind their own later controlled gates. **Sprint 01B was not begun.**
