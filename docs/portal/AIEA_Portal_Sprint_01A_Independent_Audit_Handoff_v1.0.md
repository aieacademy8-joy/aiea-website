**Document:** AIEA Portal Sprint 01A Independent Audit Handoff  
**Version:** v1.0  
**Document type:** Independent Technical / Security / Architecture Audit Handoff  
**Status:** REPORT ONLY — NOT AN IMPLEMENTATION AUTHORITY  
**Purpose:** Preserve the completed independent Sprint 01A audit for Human Authority review and controlled correction planning  
**Implementation authority:** NONE

**A. Executive verdict**

**C. FAIL — CORRECTION REQUIRED**

Sprint 01A contains **three MAJOR findings and two MINOR findings**. The foundation broadly follows the frozen architecture, but its privileged-authentication and commerce-integrity guards require correction before acceptance or commit.

The existing **69 database assertions and 30 offline checks pass independently**. Additional in-memory probes reproduced defects those checks do not cover. No current browser-accessible staff escalation was established.

**B. Safety-gate result**

**PASS.**

| Check | Independently observed |
|---|---|
| Repository | `aiea-website`; expected GitHub origin |
| Branch | `main` |
| HEAD | `052101670dc92b38c7ec15c88a2b07572e42d75b` |
| Working tree | Exactly the 12 expected created files and modified `.gitignore` |
| Staging | Empty |
| Sprint 01A commit | None on the current branch |
| Cached `origin/main` | Matches HEAD |
| Push/deployment | No new branch commit to push; external deployment history cannot be established from repository state |

**C. Files inspected**

Read the canonical frozen architecture, Sprint 00B history, Sprint 00C history, and Sprint 01A report in full.

Inspected every implementation file in the requested inventory:

- `.env.example`, `.gitignore`, `portal/README.md`
- `scripts/portal/validate-foundation.py`, `scripts/portal/test-database.mjs`
- `supabase/config.toml`, `supabase/README.md`
- All three ordered Portal migrations
- `supabase/tests/bootstrap.pglite.sql`, `supabase/tests/foundation.sql`

Also inspected repository guidance, package configuration, Git history, reflog, grants, policies, triggers, and the tracked-change boundary.

**D. Frozen-architecture conformance**

All **28 frozen domains** are represented. The schema preserves adult-only identity, family/school tenancy, cohort boundaries, individual learning records, exact-version relationships, locale separation, and inactive subscription fields.

Browser writes being denied throughout 01A is a reasonable foundation restriction. Unimplemented UI, bounded endpoints, commerce processing, deletion workflows, and provider configuration are acknowledged later gates.

The defects below concern implemented controls; they are not requests to expand frozen scope.

**E. Findings table**

| ID | Severity | Exact location | Problem and impact | Frozen requirement / correction direction |
|---|---|---|---|---|
| F01 | **MAJOR** | [Security migration:54](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000200_portal_security.sql:54>), `staff_has`; [Guards migration:56](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000300_portal_guards.sql:56>), `guard_version`; same file:209, `guard_staff` | With an active authorized staff user and TOTP AMR but **missing `aal`**, `staff_has` returns SQL `NULL`. Both guards use `IF NOT staff_has(...)`; `NOT NULL` remains `NULL`, so rejection is skipped. Independently reproduced successful retirement and a new `STAFF_MANAGE` grant without an AAL claim. | **§L:** privileged operations require `aal2` and must fail closed. Return a definite Boolean and reject any result other than `TRUE`; add missing/null/malformed-claim regressions. |
| F02 | **MAJOR** | [Guards migration:226](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000300_portal_guards.sql:226>), `guard_stripe_event`; same file:18, `audit_change` | An **APPLIED Stripe event** can have `billing_reference_id` changed to another workspace’s purchase when account/environment match. Reproduced school → family reassociation while retaining the same provider event ID and APPLIED status. The automatic audit payload does not preserve either billing target. This permits rewriting reconciliation history across tenants. | **§§G, M–N:** durable event-to-billing correlation and idempotent application. Permit initial resolution where necessary, then freeze the binding, especially after application. Any exceptional correction must preserve old/new correlation through a controlled audited operation. |
| F03 | **MAJOR** | [Guards migration:145](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000300_portal_guards.sql:145>), `guard_entitlement`; same file:162/188, `guard_billing` / `guard_billing_access` | Billing-state validity is checked when the entitlement changes, but not symmetrically when billing changes. Reproduced **PAID → PENDING** billing with an unchanged ACTIVE entitlement; all deferred constraints passed, `has_version` remained true, and evidence stayed readable. | **§§M–N:** active access must preserve a valid purchase basis. Enforce the compatible final billing/entitlement state from both mutation directions, and prevent invalid normalized billing regressions. |
| F04 | **MINOR** | [Guards migration:204](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000300_portal_guards.sql:204>), `guard_staff` | Authorized staff-management DML can overwrite existing `granted_by` and `granted_at`. Reproduced attribution to an ordinary customer and a fabricated historical timestamp. Revocation provenance is similarly insufficiently protected on subsequent updates. The audit retains the actual modifying actor, which limits the impact. | **§§G, L:** trustworthy grant/revoke provenance. Preserve historical fields or derive them during explicitly defined grant/reactivation/revocation transitions. |
| F05 | **MINOR** | [SQL tests:79](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/tests/foundation.sql:79>) and [runner:26](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/scripts/portal/test-database.mjs:26>) | The passing suite omits F01–F04. It also leaves several important denial branches untested. The runner accepts any nonzero assertion count, so substantial accidental test removal could still produce success. | **§§H, L, R, T:** meaningful negative coverage. Add targeted regressions and verify the expected assertion inventory, without treating assertion totals as proof of security. |

F01 was reproduced using synthetic SQL claims. Supabase documents `aal` as a required issued-token claim, so this does **not** establish that an ordinary valid Supabase JWT can omit it. It establishes that the implemented database guards fail open when the claim is absent. Native token validation remains essential. [Supabase JWT claims reference](https://supabase.com/docs/guides/auth/jwt-fields)

**F. RLS / authorization audit**

The inspected implementation has several sound controls:

- RLS is enabled on all 28 Portal tables.
- Anonymous users lack Portal access.
- Authenticated browser clients receive read permissions only.
- Entitlement reads use column-limited summaries.
- Billing references, Stripe events, staff authorization, and audit records have no browser read grants.
- Workspace access requires active adult profile, membership, and workspace status.
- Teacher learner access intersects active teacher assignment, active cohort, and active learner assignment.
- Learning records require exact-version entitlement.
- Staff authorization grants no broad browser visibility.

The supplied tests exercise actual roles and RLS, including family/admin scope, teacher assignment revocation, membership revocation, and entitlement revocation.

Helpers use qualified names and fixed empty `search_path`. Granted browser helpers are composable predicates rather than complete authorization gates: for example, `can_learner` alone does not check entitlement. That separation is acceptable while these helpers remain outside the exposed API schema and policies retain their complete predicates.

Service-role access remains a trusted server boundary. RLS cannot constrain a role with `BYPASSRLS`; future endpoints must independently bound its use. [PostgreSQL RLS documentation](https://www.postgresql.org/docs/15/ddl-rowsecurity.html)

**G. Relational-integrity audit**

Composite relationships correctly protect:

- Learner/workspace and cohort/workspace consistency.
- Teacher membership/cohort tenancy.
- Mission/version and assessment/version consistency.
- Attempt/learner/workspace/version consistency.
- Response/item/assessment consistency.
- Evidence/attempt/learner consistency.
- Entitlement/billing/workspace/version consistency.

Evidence requires a governing mission or assessment attempt. Mission ordering, locale identity, active membership/assignment uniqueness, and active entitlement uniqueness are constrained.

**F02 and F03 remain material integrity gaps:** a valid FK does not prevent historical event reassociation, and the billing guards permit an invalid authorization state.

**H. Staff/MFA audit**

Staff authority is separate from membership, email domain, and editable user metadata. Ordinary MFA enrollment does not grant staff authority. The capability predicate checks active staff, adult status, TOTP AMR, and AAL.

However, **F01 defeats fail-closed enforcement for a missing AAL claim**, and **F04 weakens stored authorization provenance**.

No ordinary customer self-promotion path was demonstrated through current browser grants. Enrollment, recovery, stale-session handling, factor removal, and privileged endpoints remain unimplemented native/integration gates.

**I. Publication / immutability audit**

The implementation enforces the publication transition sequence, publisher/time/hash fields, published locale completeness, and published/retired child immutability. Child guards inspect both old and new version parents, preventing straightforward reparenting.

Finalized attempts and their responses, and submitted evidence, resist ordinary edits and deletion. Narrow FK-driven actor nulling preserves retained history.

Remaining limitations:

- Publication/retirement relies on the defective F01 predicate.
- The digest is shape-checked; canonical computation remains a future service responsibility.
- External Blob replacement is not prevented by database metadata.
- Multi-session publication/finalization races remain unverified.

**J. Privacy / retention audit**

Learner references remain minimal and have no authentication identity, required DOB, child email/password, or media fields. Notes are bounded. Stripe events avoid raw payload storage.

No `ON DELETE CASCADE` appears in the migrations. Restrictive customer relationships and nullable actor references preserve learning, billing, curriculum, and audit history. The supplied account-deletion simulation passed independently.

Controlled learner/workspace deletion, export cleanup, corrections, and retention execution are still absent. These are acknowledged future operations, not verified functionality.

**K. Commerce-foundation audit**

The foundation includes authenticated purchasing context, immutable billing offer/workspace/version correlation, unique Stripe event identity, exact-version entitlements, inactive subscription/invoice fields, and notification state separated from authorization.

Full refund and final dispute loss require revocation at transaction completion; those tests passed. Unresolved disputes can retain or suspend access under later policy. Partial refunds have no automatic transition.

**F02 and F03 require correction.** Provider signature verification, payment truth, replay handling, out-of-order reconciliation, trusted offers, and notification retries remain deferred.

The tracked-change boundary confirms that current checkout, webhook, download, and HMAC access code was not altered or connected to Portal authorization.

**L. Multilingual audit**

The four locale tables, locale-neutral structural identities, explicit resource locale/neutral distinction, stable response keys, and deterministic requested-locale/fallback resolution are present.

Publication validates localized child completeness and option-key correspondence. Adult notes preserve entered language. No machine translation behavior was introduced.

The unavailable-locale test is incomplete: its fixture is also unentitled, so it does not independently prove the entitled/no-fallback branch.

**M. Test-quality audit**

Independently rerun:

| Check | Result |
|---|---|
| Three migrations on existing in-memory PGlite | PASS |
| Supplied SQL assertions | **69 PASS** |
| Offline validator | **30 PASS** |
| Database-runner syntax | PASS |
| TOML syntax parsing | PASS |
| `git diff --check` | PASS |

Additional probes reproduced F01–F04 without creating files.

Important missing coverage includes staff revocation, missing/null assurance claims, learner-assignment revocation, inactive profile/workspace/cohort branches, suspended entitlements, broader per-table read denials, publication rejection for incomplete locales, applied-event reassociation, and billing regression beneath an existing entitlement.

The PGlite bootstrap supplies synthetic Auth functions and roles. These results do not validate signed tokens, PostgREST, or native Supabase permissions.

**N. Supabase-native residual risks**

**OBSERVATIONS requiring the separately authorized native gate:**

- PostgreSQL **15** configuration versus tested PGlite PostgreSQL **17.5**.
- Actual CLI configuration acceptance and managed Auth schema behavior.
- Signed JWT validation, real TOTP AMR, expiry, recovery, and stale sessions.
- PostgREST exposure of `portal` only and entitlement column permissions.
- Effective role inheritance, default privileges, function ownership, and helper non-exposure.
- Multi-session publication, entitlement, assignment, and duplicate-event races.
- SMTP, redirect allowlists, and controlled adult onboarding.

Custom-schema exposure and SQL permissions must be validated together; exposure configuration alone does not establish access safety. [Supabase custom schemas](https://supabase.com/docs/guides/api/using-custom-schemas)

These residual questions do not excuse the locally reproduced repository defects.

**O. Secret / environment audit**

No real secrets, database connection strings, production project endpoints, or client-prefixed server credentials were found in the inspected Sprint files.

The environment example contains blanks and test mode. Local environment files and Supabase CLI state are ignored. Configuration uses localhost redirects, disables signup/anonymous sign-in and Storage, and enables TOTP.

The database runner accepts a local runtime module path and creates an in-memory database; it has no provider connection parameter.

**P. Scope-control audit**

No child accounts, learner uploads/Storage, active subscriptions, district hierarchy, SIS/LMS/SSO, rostering, chatbot, gamification, advanced analytics, native apps, Creation Sandbox, enterprise provisioning, Portal UI, or live customer-access path was introduced.

No existing application, commerce, or deployment configuration file changed.

**Q. Exact recommended next gate**

Authorize a **bounded repository correction pass for F01–F05**, followed by another independent audit.

Acceptance criteria: fail-closed staff guards, protected event correlation, symmetric billing/entitlement integrity, protected staff provenance, and targeted regression coverage. Do not accept or commit Sprint 01A yet.

Only after that audit passes should Human Authority consider authorizing isolated Supabase-native validation. This audit starts neither corrections nor Sprint 01B.

**R. Git status / repository safety statement**

Final Git inspection matches the initial expected inventory. HEAD and cached `origin/main` remain at the frozen commit; staging remains empty. The canonical architecture is unchanged.

The following describe actions performed **during this audit**:

- files modified: **NONE**
- files created: **NONE**
- files staged: **NONE**
- commits: **NONE**
- pushes: **NONE**
- deployments: **NONE**
- external provider changes: **NONE**
