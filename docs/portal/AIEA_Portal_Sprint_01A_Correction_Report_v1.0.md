# AIEA Portal — Sprint 01A-C Controlled Correction Report v1.0

Date: 2026-10-06 (America/Chicago)  
Authority: Human Authority's bounded F01–F05 correction request  
Architecture: `AIEA_Portal_P0_Architecture_and_Data_Contract_v1.0_FROZEN.md`, FROZEN v1.0  
Finding source: `AIEA_Portal_Sprint_01A_Independent_Audit_Handoff_v1.0.md`

## A. Correction result

**PASS — F01–F05 CORRECTED AND READY FOR INDEPENDENT RE-AUDIT**

This is the implementation engineer's correction/validation result, not a new
independent audit or production acceptance. Only F01–F05 and their directly
necessary tests/documentation changed. Supabase setup and Sprint 01B were not begun.

## B. Pre-correction repository safety state

All required checks completed before source changes:

| Check | Observed state |
|---|---|
| Repository/origin | `aiea-website`; `https://github.com/aieacademy8-joy/aiea-website.git` |
| Branch | `main` |
| HEAD and cached origin/main | `052101670dc92b38c7ec15c88a2b07572e42d75b` |
| Latest commit/reflog | Expected architecture freeze; no subsequent local implementation commit |
| Staging | Empty |
| Working tree | Modified `.gitignore`; 12 original created files plus expected untracked independent audit handoff |
| Expected files | All present; no unexpected implementation paths detected |
| Baseline SQL suite | Original **69 PASS** reproduced before corrections |
| Baseline offline checks | **31 PASS** with the expected audit handoff added to the allowlist in memory only; original validator source unchanged at that point |
| Sources read | Frozen architecture, original implementation report, independent audit handoff and implementation sources |

Pre-correction SHA-256 fingerprints were recorded in a temporary file outside the
repository for the implementation/documentation boundary. Final comparison proves
only the six authorized existing files below changed during this pass. The audit
handoff, original implementation report, frozen artifact, domain migration, local
config and other original scaffold files retain their pre-correction fingerprints.

No commit, push or deployment was performed in this correction pass. Repository
history/staging match the stated boundary; external deployment history was not
queried or changed.

## C. F01 — fail-closed staff MFA/AAL

**Defect:** Missing AAL could produce SQL NULL in `staff_has`; `IF NOT NULL` skipped
rejection in privileged guards. Malformed AMR containers also lacked safe handling.

**Correction:** `staff_has` coalesces its complete predicate to FALSE, compares AAL
and TOTP method as exact JSON strings, and safely maps non-array AMR to an empty
array. Publication, retirement and staff-management call sites reject any result
`IS NOT TRUE`. Separate active adult/staff/capability checks remain required.
Email, domain, metadata and workspace authority confer no staff privilege.

**Regressions/result:** **65 F01 assertions PASS.** Four checks per invalid claim
case cover the definite predicate and actual staff-management, retirement and
publication denial. Cases include missing/null/aal1/unexpected/object/numeric/empty
AAL; missing/null/object/scalar/empty/phone-only/malformed-entry AMR. Positive TOTP
aal2, inactive adult, revoked staff with matching capability, missing capability,
family owner and school admin are independently covered. Existing positive staff
controls also remain in the suite. These are synthetic claims, not signed-token
or native Supabase validation.

## D. F02 — immutable Stripe event correlation

**Defect:** An APPLIED event could move to another workspace's billing basis under
the same provider account/environment; the audit lacked old/new correlation.

**Correction:** NULL correlation can resolve during PROCESSING or RETRYABLE_FAILED.
Once non-null, correlation cannot change or clear. APPLIED requires a resolved
billing basis; APPLIED/IGNORED cannot regress to a processing state. Event deletion
fails closed, preventing delete/reinsert from resetting identity/correlation.
Provider identity/idempotency fields remain immutable/unique. Audit entries now
include old/new billing-reference IDs; billing's immutable workspace relationship
and restrictive FK preserve the tenant context. No exceptional correction bypass
or Stripe handler was added; exceptional correction/retention remains controlled
future work.

**Regressions/result:** **13 F02 assertions PASS:** legitimate initial binding,
recorded old/new audit correlation, resolved-processing rebinding denial,
same-workspace and cross-workspace APPLIED rebinding denial, clearing denial,
lifecycle regression denial, deletion denial, immutable provider ID, duplicate
provider ID, identical APPLIED replay preserving one identity/binding, unresolved
APPLIED denial and retryable initial binding/application. Replay checks concern
database ledger behavior; HTTP idempotency remains a later runtime gate.

## E. F03 — symmetric billing/entitlement integrity

**Defect:** PAID billing could regress to PENDING beneath an unchanged ACTIVE
entitlement because compatibility was enforced only on entitlement mutation.

**Correction:** The shared deferred constraint function validates the final current
state when either billing or entitlement changes. ACTIVE requires PAID,
PARTIALLY_REFUNDED, DISPUTE_OPEN or DISPUTE_WON. REFUNDED/DISPUTE_LOST requires all
corresponding entitlements REVOKED. Unresolved dispute may retain access or support
controlled SUSPENDED; partial refund has no automatic entitlement change. Non-active
states retain history. The asymmetric immediate billing-state check was removed
from the entitlement BEFORE trigger; identity/version checks and parent locks
remain. Explicit deferral allows either order of compatible atomic updates.

**Regressions/result:** **12 F03 assertions PASS**, plus the original full-refund,
final-loss and atomic-refund controls. Tests cover PAID+ACTIVE, pending/checkout
regression denial, compatible partial refund/dispute states, controlled unresolved
dispute suspension, activation on pending billing denial, activation-before-PAID
atomic success, deferred final-state rejection, atomic final-loss/revocation and
terminal billing with SUSPENDED denial. Deferred tests force validation using
`SET CONSTRAINTS ... IMMEDIATE` before the enclosing fixture rollback.

This checks normalized relational state, not external payment truth, provider
ordering or live webhook processing. Subscriptions remain disabled.

## F. F04 — staff provenance

**Defect:** Existing grant attribution/time and subsequent revocation provenance
could be arbitrarily rewritten by an authorized staff manager.

**Correction:** Original grant actor/time is immutable after insertion. Initial
grant and active→revoked transitions derive the actual adult actor/time; supplied
historical values cannot replace them. Revocation provenance is immutable on later
updates. Reactivation is deliberately unsupported in this scaffold, rather than
erasing provenance; it needs a future controlled grant lifecycle. API deletion of
staff grants fails closed, preventing delete/reinsert provenance erasure. The
existing narrow nested FK actor-nulling exception remains for the controlled
operator privacy workflow. Audit retains the actual actor via its nullable FK and
old/new grant/revocation timestamps; personal actor IDs are not duplicated in JSON.

**Regressions/result:** **11 F04 assertions PASS:** customer forgery denial, staff
forgery of historical grant actor/time denial, derived grant actor/time despite
supplied forgery, derived revocation actor/time, post-revocation actor/time/grant
forgery denial, reactivation/deletion denial and attributed audit provenance.
No staff administration UI or broad correction bypass was implemented.

## G. F05 — coverage and completeness

The suite now has **188 uniquely named assertions** against a separately checked-in
`supabase/tests/assertions.json` inventory. The runner rejects missing, unexpected
or duplicated executed names and invalid/empty/duplicate expected inventories.
Expected names are not derived from SQL at runtime. Seven database-free runner
self-tests exercise valid execution and missing/replaced/duplicated/extra names,
empty inventory and duplicate expected names.

An end-to-end temporary-copy experiment removed one original assertion while
keeping the manifest unchanged. The actual runner exited **1**, reporting exactly
`missing=["exact frozen 28-domain inventory"]`; the repository suite was untouched.
This is an expected rejection, not a failed correction test.

**19 F05 SQL assertions PASS:** incomplete localized publication, an explicitly
entitled/no-fallback locale fixture and requested-locale positive control, learner
assignment revocation, inactive adult/workspace/cohort, suspended entitlement and
history retention, unauthorized Stripe/audit reads and private-helper denials.
The formerly confounded unavailable-locale assertion was replaced with independent
entitlement, available-locale and unavailable/no-fallback checks.

The remaining **68 original assertions** retain their valid controls. Named
inventory totals are evidence of execution/completeness only; the behavioral
predicates and expected SQLSTATEs provide the regression evidence.

## H. Full regression results

| Validation | Result |
|---|---|
| Migrations reapplied from empty isolated database | All **3 PASS**, original order |
| Full SQL suite on existing temporary PGlite 0.3.14 / PostgreSQL 17.5 | **188 PASS, 0 FAIL**; exact named inventory matched |
| F01/F02/F03/F04 targeted regressions | **65 / 13 / 12 / 11 PASS** |
| F05 denial/locale assertions | **19 PASS** |
| Preserved original valid assertions | **68 PASS**; original ambiguous locale check replaced |
| Runner inventory self-tests | **7 PASS** |
| Actual assertion-removal experiment | PASS: runner rejected missing assertion, exit 1 |
| Offline foundation validator | **35 PASS, 0 FAIL** |
| Node syntax checks | **11 files PASS**: nine unchanged APIs, public main.js and runner |
| Python AST / assertion JSON / local TOML syntax and safety flags | PASS |
| `git diff --check` | PASS |
| Pre-correction fingerprint comparison | Exactly six authorized files changed; other baseline files unchanged |
| Tracked public website/checkout/API/package/Vercel/frozen-artifact diff | No changes |
| Staging / HEAD | Empty; unchanged freeze SHA |
| Credential pattern scan + placeholder/config inspection | No real secret values found in correction/scaffold files |

No new download, package installation, repository dependency or lockfile change
was needed. The pre-existing temporary runtime was reused. No Supabase/native
provider tests or independent re-audit were performed.

Reproduce local checks using the commands in `supabase/README.md`, including the
database runner's `--self-test` option and full in-memory SQL suite.

## I. Frozen-architecture conformance

**YES.** FROZEN §§G/H/L enforce separate staff authority and fail-closed privilege;
§§M/N require durable event correlation and a compatible one-time billing/access
basis; grant/revoke attribution and auditability remain within §§G/L/Q. No domain,
relationship, authentication model, product scope or retention duration was
redesigned. All 28 domains, restrictive tenant relationships, locale separation,
publication/finalized-evidence immutability and browser read-only grants remain.

The domain migration, bootstrap, local configuration, environment contract, frozen
architecture, original report and independent handoff were not modified.

## J. Files created in this correction pass

1. `supabase/tests/assertions.json`
2. `docs/portal/AIEA_Portal_Sprint_01A_Correction_Report_v1.0.md`

## K. Files modified in this correction pass

1. `supabase/migrations/20261006000200_portal_security.sql`
2. `supabase/migrations/20261006000300_portal_guards.sql`
3. `supabase/tests/foundation.sql`
4. `scripts/portal/test-database.mjs`
5. `scripts/portal/validate-foundation.py`
6. `supabase/README.md`

Existing uncommitted migration files were corrected in place because none have
been applied to an external database. `.gitignore` remains the original Sprint 01A
tracked modification and was not changed during this pass.

## L. External provider state

**UNCHANGED.** No Supabase connection/project/configuration/migration, Stripe,
Vercel, Blob, Postmark, MailerLite, SMTP, DNS, live customer account/access or
deployment change occurred. No real authentication email was sent. Public website,
checkout, webhook, access/download APIs and production configuration are untouched.

## M. Git status

`main`; HEAD/cached origin remain
`052101670dc92b38c7ec15c88a2b07572e42d75b`. Staging empty. All implementation,
audit-handoff and correction artifacts remain uncommitted: one tracked modified
file (`.gitignore`) and 15 untracked files.

```text
## main...origin/main
 M .gitignore
?? .env.example
?? docs/portal/AIEA_Portal_Sprint_01A_Correction_Report_v1.0.md
?? docs/portal/AIEA_Portal_Sprint_01A_Implementation_Foundation_Report_v1.0.md
?? docs/portal/AIEA_Portal_Sprint_01A_Independent_Audit_Handoff_v1.0.md
?? portal/
?? scripts/
?? supabase/
```

Files staged: **NO**. Commits: **NO**. Pushes: **NO**. Deployments: **NO**.

## N. Remaining Supabase-native validation

Unchanged future gates: PostgreSQL 15 versus tested 17.5; managed Auth schema;
real signed JWT/TOTP AMR/AAL, expiry and recovery; PostgREST custom-schema exposure;
effective grants/default privileges/function ownership/helper exposure;
concurrent publication, billing/entitlement, assignment and event behavior; SMTP,
redirect allowlists and adult onboarding. Provider payment truth, trusted offer
mapping and all frozen §R commerce runtime repairs remain deferred. No native
setup question was attempted in this pass.

## O. Recommended next gate

**Independent re-audit of the uncommitted F01–F05 correction diff**, with this report
and the preserved independent handoff. Human acceptance comes after that review.
Only a later separate authorization may begin Supabase-native validation. Do not
stage, commit, push, deploy, set up Supabase or begin Sprint 01B at this gate.
