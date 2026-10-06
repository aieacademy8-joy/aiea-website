# AIEA Portal — Sprint 00C Final P0 Architecture Freeze Candidate v1.0

## A. Executive reconciliation result

**RECONCILED — ELIGIBLE FOR FINAL P0 FREEZE**

The seven Human Authority rulings resolve every Human decision identified by Sprint 00B sufficiently to freeze the P0 architecture and data-contract boundary. The rulings create no platform, security, or vendor contradiction. They require four bounded architecture additions:

1. a minimal school cohort/class domain;
2. teacher-to-cohort and learner-to-cohort assignments;
3. cohort-level mission-delivery records kept separate from individual learner evidence; and
4. a dedicated, server-managed `staff_authorization` domain with stronger privileged authentication.

The rulings also remove guest entitlement claiming from P0, retain one-time purchase commerce only, define entitlement outcomes for full refunds and final dispute losses, and establish retention categories without inventing durations.

The current website remains a static Vercel site with serverless commerce/download functions. No current Portal identity, database, RLS, workspace, cohort, entitlement, curriculum-delivery, assessment, or evidence implementation exists. This document is therefore an architecture freeze candidate, not an implementation assertion.

Supabase remains technically suitable for adult passwordless authentication, PostgreSQL, and RLS. Official Supabase documentation confirms that application MFA supports authenticator-app TOTP and phone factors and exposes session assurance through `aal1` and `aal2`. The P0 privileged-admin boundary defined here uses TOTP-backed `aal2`, not email possession alone. See [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa), [Supabase TOTP MFA](https://supabase.com/docs/guides/auth/auth-mfa/totp), and [Supabase JWT claims](https://supabase.com/docs/guides/auth/jwt-fields).

## B. Seven Human Authority rulings — exact disposition

| Ruling | Disposition | Reconciled consequence |
|---|---|---|
| 1. Portal purchase/account order | **RESOLVED WITH ARCHITECTURE CHANGE** | Adult account, active membership, and workspace must precede Portal checkout. `purchase_claim` is excluded. Existing non-Portal download checkout remains separate. |
| 2. School class/cohort privacy boundary | **RESOLVED WITH ARCHITECTURE CHANGE** | Add `cohort`, `cohort_teacher_assignment`, and `cohort_learner_assignment`. Teachers are cohort-scoped; school owners/admins may have workspace-wide authority. |
| 3. AIEA internal staff authorization | **RESOLVED WITH ARCHITECTURE CHANGE** | Add dedicated `staff_authorization`. It is server-managed, independent of workspace membership and email domain, and required for privileged staff operations. |
| 4. Billing/entitlement policy | **RESOLVED WITH ARCHITECTURE CHANGE** | P0 is one-time purchase only. Paid grants `ACTIVE`; full refund and final dispute loss produce `REVOKED`; unresolved dispute can produce `SUSPENDED`; partial refund requires authorized Human/staff action. Historical learning data is retained independently. |
| 5. Cohort delivery vs individual evidence | **RESOLVED WITH ARCHITECTURE CHANGE** | Add `cohort_mission_delivery`. Keep `mission_progress`, assessments, and learner evidence individually learner-referenced when the approved specification requires it. |
| 6. Privacy, retention, deletion | **RESOLVED** | Retention categories and controlled deletion relationships are frozen. Exact durations are **DEFERRED BY HUMAN AUTHORITY** to an approved privacy/retention policy before broader launch. |
| 7. Authentication and privileged security | **RESOLVED WITH ARCHITECTURE CHANGE** | Ordinary adults use passwordless email at `aal1`. Active staff authorization plus TOTP-verified `aal2` is required for privileged staff operations. Production SMTP remains a prerequisite. |

No ruling is **STILL BLOCKING** at the architecture-freeze level.

## C. Final P0 scope

P0 includes only:

- Vercel-hosted public website, Portal UI, server APIs, verified Stripe webhook processing, and privileged integration operations.
- Supabase-managed adult authentication, PostgreSQL Portal records, and Row Level Security.
- Passwordless email magic-link or email OTP for ordinary adult users.
- Family and school workspaces.
- Workspace memberships with bounded P0 roles.
- Minimal learner references with no authentication identity.
- Minimal school cohorts/classes and active teacher/learner assignments.
- One-time Portal purchases initiated only for an authenticated, authorized workspace.
- Durable Stripe event, billing reference, and exact-program-version entitlement records.
- Versioned, historically stable programs, missions, assessments, localized content, and resource metadata.
- Cohort-level mission delivery for school contexts.
- Individual mission progress, assessments, adult-entered evidence, observations, reflections, and pilot feedback where required.
- AIEA staff support, bounded exports, diagnosis, and controlled entitlement correction/revocation through authenticated, audited server operations.
- Data minimization, controlled deletion support, and distinct retention categories.
- Vercel Blob for AIEA-published resources.
- Supabase Storage reserved and unused for learner artifacts unless separately approved.

Eight missions is a Founding Pilot configuration, not a schema constraint.

## D. Explicit deferred scope

The following remain outside P0:

- guest Portal checkout and purchase claiming;
- child accounts, email, passwords, or login;
- subscriptions and subscription entitlement policy;
- district hierarchy;
- SIS, LMS, SSO, automated rostering, and enterprise provisioning;
- classes/cohorts beyond the minimum privacy and delivery boundary;
- rich portfolios and general learner uploads;
- child photos, audio, video, or artwork collection by default;
- learner chatbot or direct general-purpose AI access;
- embedded AI-provider APIs and Creation Sandbox;
- advanced analytics, mastery engines, and automated AI grading;
- gamification economy and community/social features;
- native applications and full 15-level Portal UX;
- translation-management dashboard and runtime machine translation;
- polished enterprise staff/admin dashboard;
- exact retention durations, pending a separately approved policy.

## E. Final domain/object inventory

### Supabase-managed authentication

- `auth.users`

### Identity and tenancy

- `user_profile`
- `workspace`
- `workspace_membership`
- `learner_ref`

### Minimal school cohort/class boundary

- `cohort`
- `cohort_teacher_assignment`
- `cohort_learner_assignment`
- `cohort_mission_delivery`

### AIEA internal authority

- `staff_authorization`

### Commerce and access

- `stripe_event`
- `billing_reference`
- `entitlement`

### Curriculum

- `program`
- `program_version`
- `program_version_locale`
- `mission`
- `mission_locale`
- `resource_asset`

### Assessment and localization

- `assessment`
- `assessment_locale`
- `assessment_item`
- `assessment_item_locale`

### Individual delivery and evidence

- `mission_progress`
- `assessment_attempt`
- `assessment_response`
- `evidence_record`

### Pilot and operations

- `pilot_feedback`
- `audit_event`

`purchase_claim` is explicitly excluded. A separate learner `program_participation` object is not required in P0 because an active workspace entitlement authorizes the program version and learner access is constrained through workspace/cohort relationships. Selective learner enrollment may be added only if later required.

## F. Final relationship/cardinality map

```text
auth.users
  1 ── 0..1 user_profile
  1 ── N workspace_membership
  1 ── 0..1 active staff_authorization
  1 ── N audit_event.actor_user_id

workspace
  1 ── N workspace_membership
  1 ── N learner_ref
  1 ── N billing_reference
  1 ── N entitlement
  1 ── N mission_progress
  1 ── N assessment_attempt
  1 ── N evidence_record
  1 ── N pilot_feedback
  1 ── N cohort                  [SCHOOL only]

workspace_membership
  N ── 1 workspace
  N ── 1 auth.users
  1 ── N cohort_teacher_assignment

cohort
  N ── 1 SCHOOL workspace
  1 ── N cohort_teacher_assignment
  1 ── N cohort_learner_assignment
  1 ── N cohort_mission_delivery

learner_ref
  N ── 1 workspace
  1 ── N cohort_learner_assignment
  1 ── N mission_progress
  1 ── N assessment_attempt
  1 ── N evidence_record

program
  1 ── N program_version

program_version
  N ── 1 program
  1 ── N program_version_locale
  1 ── N mission
  1 ── N resource_asset
  1 ── N assessment
  1 ── N entitlement

mission
  N ── 1 program_version
  1 ── N mission_locale
  1 ── N resource_asset
  1 ── N cohort_mission_delivery
  1 ── N mission_progress
  1 ── N evidence_record

assessment
  N ── 1 program_version
  1 ── N assessment_locale
  1 ── N assessment_item
  1 ── N assessment_attempt

assessment_item
  N ── 1 assessment
  1 ── N assessment_item_locale
  1 ── N assessment_response

assessment_attempt
  N ── 1 assessment
  N ── 1 workspace
  N ── 1 learner_ref
  N ── 1 adult actor
  1 ── N assessment_response

stripe_event
  N ── 0..1 billing_reference

billing_reference
  N ── 1 workspace
  1 ── N stripe_event
  1 ── N entitlement

entitlement
  N ── 1 workspace
  N ── 1 exact program_version
  N ── 1 billing_reference
```

For a family workspace, individual delivery records link directly to its learner references. For a school workspace, teacher access to those learner references is additionally mediated by active cohort assignments.

## G. Final integrity and uniqueness constraints

### Identity and membership

- `user_profile.user_id` is unique and references `auth.users.id`.
- At most one active `workspace_membership` exists per `(workspace_id, user_id)`.
- Permitted role/workspace combinations are constrained:
  - `FAMILY`: `OWNER` only in P0.
  - `SCHOOL`: `OWNER`, `SCHOOL_ADMIN`, `TEACHER`.
- Inactive or revoked membership cannot authorize reads or writes.

### Cohorts and assignments

- A `cohort` may belong only to a `SCHOOL` workspace.
- A teacher assignment references `workspace_membership`, not an arbitrary user ID.
- The assigned membership and cohort must belong to the same workspace.
- The assigned membership must carry an allowed school role and be active for authorization.
- A learner assignment and learner reference must share the cohort workspace.
- At most one active assignment exists for each `(cohort_id, workspace_membership_id)` and `(cohort_id, learner_ref_id)` pair.
- Removing an assignment removes future authorization but does not delete historical delivery/evidence.

### Cohort delivery and learner records

- `cohort_mission_delivery` requires a cohort and mission and records the authenticated adult actor.
- The actor must have an active assignment to that cohort or active school owner/admin authority.
- The cohort workspace must have an active entitlement to the mission’s exact `program_version`.
- One current delivery record exists per `(cohort_id, mission_id)` unless a future approved requirement explicitly introduces multiple delivery instances.
- `mission_progress` remains unique per `(learner_ref_id, mission_id)`.
- `mission_progress.workspace_id` must match `learner_ref.workspace_id` through a composite relationship.
- A mission’s `program_version_id` is derived through the mission or protected by a composite foreign key; contradictory mission/version pairs are prohibited.

### Assessments and evidence

- `assessment` belongs to exactly one program version and carries a controlled phase such as `PRE` or `POST`.
- `assessment_attempt` must bind one assessment, learner reference, workspace, adult actor, and program version consistently.
- One response exists per `(assessment_attempt_id, assessment_item_id)`.
- Response values use stable structural keys; localized labels are not stored as scoring identity.
- An `evidence_record` must identify its learner and governing mission and/or assessment context; evidence type alone is insufficient.
- Finalized assessment attempts and submitted evidence cannot be silently rewritten; corrections use controlled, audited operations.

### Commerce

- Stripe event ID is globally unique within the integration environment.
- Stripe Checkout Session, PaymentIntent, Charge, Customer, Refund, Dispute, and nullable Subscription/Invoice identifiers are uniquely constrained where one-to-one semantics apply.
- `billing_reference` is created for an authenticated workspace purchase context before or atomically with Checkout creation.
- Entitlement always references an exact `program_version` and billing reference.
- No more than one active entitlement exists for the same workspace, exact program version, and billing basis unless later explicitly authorized.
- Entitlement suspension or revocation never cascades into historical learning-record deletion.

### Curriculum and locales

- Program-version identifiers are unique within a program.
- Mission sequence is unique within a program version but is not fixed to eight.
- Locale rows are unique per parent and locale code.
- Published structural and localized curriculum records are immutable under the contract in Section O.

### Operations

- `staff_authorization.user_id` is unique for the active authorization domain.
- Staff grant/revoke events identify the authorizing staff actor and are audited.
- `audit_event` is append-only through privileged operations; browser clients cannot fabricate audit records.

## H. Final RLS and authorization matrix

| Domain/object | Anonymous | Family owner | School teacher | School owner/admin | AIEA staff |
|---|---|---|---|---|---|
| `user_profile` | None | Self only | Self only | Self only | Bounded server lookup |
| `workspace` | None | Own active workspace | Assigned active workspace | Own active workspace | Bounded server support |
| `workspace_membership` | None | Read own/household scope; mutation via server | Read own membership | Read school memberships; mutation via server | Bounded server management |
| `learner_ref` | None | Own family workspace | Only learners actively assigned to an assigned cohort | All learners in authorized school workspace | Bounded server support |
| `cohort` | None | None | Assigned cohorts only | All cohorts in authorized school workspace | Bounded server support |
| Teacher/learner cohort assignments | None | None | Read own relevant assignments | Read/manage through bounded server operation | Bounded server support |
| `cohort_mission_delivery` | None | None | Read/write assigned cohort only | Read/write school workspace | Bounded diagnosis/correction |
| `entitlement` | None | Read permitted summary for own workspace | Read permitted summary for assigned workspace | Read permitted summary for school workspace | Server create/suspend/revoke/correct |
| Published curriculum | None | Read through active membership + entitlement | Read through active membership + entitlement | Same | Publish/manage server-side only |
| `mission_progress` | None | Own workspace learners | Assigned-cohort learners only | School workspace learners | Bounded audited support |
| Assessments/responses | None | Own workspace learners | Assigned-cohort learners only | School workspace learners | Bounded audited support/export |
| `evidence_record` | None | Own workspace learners | Assigned-cohort learners only | School workspace learners | Bounded audited support/export |
| `pilot_feedback` | None | Permitted own-workspace operations | Permitted own/assigned context | Permitted school context | Bounded read/export |
| `stripe_event` | None | None | None | None | Privileged server only |
| `billing_reference` | None | Minimal own-workspace summary if exposed | Normally none | Minimal school summary if authorized | Privileged server only mutation |
| `staff_authorization` | None | None | None | None | Server-managed; bounded self/status read if needed |
| `audit_event` | None | None by default | None | None by default | Server/trigger write; bounded authorized read |

Foundational rules:

- Every exposed private table uses least-privilege grants and RLS.
- Anonymous access to Portal-private records is denied.
- Ordinary authenticated operations require an active membership.
- Protected curriculum and delivery operations additionally require an active exact-version entitlement.
- Teacher learner-data access additionally requires an active teacher-to-cohort assignment and active learner-to-cohort assignment for the same cohort.
- School owner/admin authority is workspace-wide only while its membership is active and carries the explicit role.
- Client input cannot select or forge actor identity; actor identity is derived from the authenticated session.
- Membership, cohort assignment, staff authorization, entitlement, publication, export, and correction mutations use bounded server operations or controlled RPCs.
- Supabase secret/service-role-equivalent credentials never enter browser code. Supabase documents that secret/service-role access bypasses RLS and must remain in trusted server environments. See [Supabase data security](https://supabase.com/docs/guides/database/secure-data).

## I. School cohort/class privacy model

The P0 school model is deliberately narrower than an SIS or LMS:

```text
SCHOOL workspace
  ├── OWNER / SCHOOL_ADMIN memberships
  ├── TEACHER memberships
  ├── cohorts
  │    ├── active teacher assignments
  │    └── active learner assignments
  └── workspace-level exact-version entitlements
```

- A teacher’s membership alone does not authorize access to every school learner.
- Teacher access is the intersection of active workspace membership, active cohort assignment, active learner assignment, and valid workspace entitlement.
- An owner or `SCHOOL_ADMIN` has explicit school-wide authority within that workspace.
- Cohort assignment revocation removes future access immediately under RLS while retaining historical records.
- P0 cohorts require only a stable ID, workspace ID, bounded display name/code, status, and timestamps.
- P0 does not model periods, schedules, subjects, buildings, districts, grades, SIS IDs, or automated rosters unless separately approved.

## J. Cohort delivery vs learner evidence model

`cohort_mission_delivery` answers: **Was this mission delivered to this assigned cohort, by whom, and when?**

It may contain:

- cohort;
- mission;
- delivery status;
- started/delivered timestamps;
- adult actor;
- bounded implementation note if approved; and
- audit timestamps.

It does not assert that every learner completed the mission or demonstrated an outcome.

Individual records answer separate questions:

- `mission_progress`: the learner’s required progress state;
- `assessment_attempt` and `assessment_response`: learner-referenced pre/post or other approved assessment evidence;
- `evidence_record`: learner-referenced observation, reflection, assessment support, or mission evidence where the approved specification requires it.

No individual entry is required merely because a cohort mission was delivered. Required evidence density is governed by the approved curriculum/evidence specification, not by the existence of database tables.

Family workspaces do not use the cohort delivery layer in P0; their delivery and evidence remain learner-referenced.

## K. Adult authentication model

- Only adults authenticate.
- Ordinary parents and teachers use Supabase passwordless email magic link or email OTP as the primary experience.
- Magic-link/OTP redirect destinations must use an explicit allowlist.
- Adult account and workspace membership must exist before Portal checkout.
- Authentication proves adult identity; membership and RLS determine authorization.
- Email or email-domain possession does not create workspace roles or staff authority.
- Production authentication email must use an appropriately configured transactional SMTP service. Supabase states that its default SMTP service is restricted and not intended for production delivery to general users. See [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
- Children do not map to `auth.users`; `learner_ref` remains a non-authenticated workspace record.

## L. AIEA staff/admin authorization and MFA boundary

### Official Supabase verification

Current official Supabase documentation states:

- application MFA supports authenticator-app TOTP and phone-message factors;
- normal login methods, including magic links and email OTP, establish `aal1`;
- successful additional-factor verification establishes `aal2` in the JWT;
- applications must enforce the assurance requirement in the frontend, backend, APIs, and/or RLS—not merely display an MFA screen;
- TOTP enrollment, challenge, and verification are supported through Supabase Auth APIs; and
- phone MFA is supported but Supabase explicitly notes SIM-swap exposure.

Sources: [Supabase MFA overview](https://supabase.com/docs/guides/auth/auth-mfa), [TOTP MFA](https://supabase.com/docs/guides/auth/auth-mfa/totp), [Phone MFA security note](https://supabase.com/docs/guides/auth/auth-mfa/phone), [AAL API reference](https://supabase.com/docs/reference/javascript/auth-mfa-getauthenticatorassurancelevel).

### Recommended P0 privileged boundary

A privileged AIEA staff operation is authorized only when all conditions are true:

1. the requester is an authenticated Supabase adult user;
2. an active `staff_authorization` row exists for that exact user;
3. the current authenticated session carries `aal2`;
4. the staff authorization includes the required bounded capability;
5. the server validates the target and requested action independently;
6. the operation is executed server-side; and
7. the operation writes an audit event.

P0 recommends authenticator-app **TOTP** as the required second factor for privileged staff. Phone MFA is supported but is not the default because of its documented SIM-swap risk. A magic link or email OTP remains only the first factor and is insufficient for privileged operations.

`staff_authorization` should minimally carry:

- user ID;
- bounded staff role or capability set;
- status;
- granted by and granted at;
- revoked by and revoked at; and
- timestamps.

No email address or domain automatically creates this record. Clients cannot insert, update, or reactivate it.

Implementation prerequisites, not performed in Sprint 00C:

- enable and configure Supabase Auth TOTP MFA;
- implement staff enrollment, challenge, verification, factor-management, and controlled recovery flows;
- require `aal2` at every privileged server endpoint;
- optionally reinforce `aal2` with restrictive RLS for any staff-readable database path;
- test expired/stale sessions, missing factors, revoked staff authorization, lost-factor recovery, and ordinary users who independently enroll MFA; and
- ensure MFA enrollment alone never grants staff authority.

Supabase-hosted organization/dashboard MFA is separate from application-level Portal staff MFA and does not replace this boundary.

## M. Stripe → billing_reference → entitlement state machine

### Verified event processing

```text
SIGNED STRIPE EVENT
  → verify raw-body signature, account/environment, and expected event type
  → insert stripe_event using UNIQUE provider_event_id
  → PROCESSING
      ├── already APPLIED/IGNORED → no-op, HTTP 2xx
      ├── unsupported valid event → IGNORED, HTTP 2xx
      ├── retryable DB/provider failure → RETRYABLE_FAILED, HTTP non-2xx
      ├── permanent mapping error → TERMINAL_ERROR + alert
      └── atomic transaction succeeds → APPLIED, HTTP 2xx
```

### P0 one-time billing reference

```text
CHECKOUT_CREATED / PENDING
  → PAID
  → PARTIALLY_REFUNDED
  → REFUNDED
  → DISPUTE_OPEN
  → DISPUTE_WON | DISPUTE_LOST
```

Provider status remains separately recorded so Stripe truth is not lost through local normalization.

### P0 entitlement effects

```text
verified successful payment
  → entitlement ACTIVE

full refund
  → entitlement REVOKED

confirmed/final dispute loss or chargeback
  → entitlement REVOKED

unresolved dispute
  → entitlement may become SUSPENDED through the authorized policy path

partial refund
  → no automatic entitlement transition
  → bounded staff/policy review and audited decision
```

`SUSPENDED` and `REVOKED` deny new access but do not delete historical progress, assessments, evidence, feedback, billing, or audit records.

Subscriptions remain architecturally nullable but inactive. No subscription event grants, cancellations, recovery, grace period, or revocation logic is authorized in P0.

## N. Account-before-checkout correlation contract

For every Portal product purchase:

1. The adult authenticates through Supabase.
2. The server verifies an active membership with purchasing authority:
   - family `OWNER`; or
   - school `OWNER`/`SCHOOL_ADMIN` as approved.
3. The workspace already exists.
4. The server resolves a trusted internal offer mapping to a Stripe Price/Product and exact published `program_version`.
5. The server creates or prepares a `billing_reference` in a pending state with:
   - internal billing reference ID;
   - workspace ID;
   - exact program-version ID;
   - initiating adult user ID;
   - trusted offering key;
   - environment; and
   - stable idempotency key/request identity.
6. The server creates Stripe Checkout and places only server-generated correlation identifiers into `client_reference_id` and/or Stripe metadata.
7. The verified webhook resolves the internal billing reference, verifies expected Stripe Price/Product and payment truth, and atomically creates the entitlement.
8. The browser success redirect may show pending/confirmed status but cannot grant access.

No guest Portal checkout, email-only claim, `purchase_claim`, or client-selected workspace/program metadata is permitted.

Existing non-Portal digital-download products may continue using their current isolated Stripe Session/HMAC download flow, but that flow never authorizes Portal records.

## O. Program-version publication and immutability contract

```text
DRAFT → REVIEW_READY → PUBLISHED → RETIRED
```

- `DRAFT` and `REVIEW_READY` may change under the approved governance process.
- Publication records publisher, timestamp, version identity, and content hash.
- A published program version’s structural curriculum, mission sequence, evidence expectations, assessment definitions, scoring keys, completion rules, and canonical localized content are immutable.
- Material correction or curriculum change produces a new `program_version`.
- Retirement prevents new entitlement assignment but preserves existing entitlement and historical access policy as approved.
- Entitlements, cohort delivery, mission progress, assessment attempts/responses, evidence, and feedback remain pinned to the version actually delivered.
- A referenced published version cannot be hard-deleted.
- Resource replacement is versioned when it changes instructional meaning; governed resources cannot be silently replaced at the same pointer.
- Eight missions is configuration for the Founding Pilot, not a database constraint.

## P. Multilingual/localization contract

- `program`, `program_version`, `mission`, `assessment`, and `assessment_item` contain stable structural identities and locale-neutral rules.
- `program_version_locale` contains localized program title, description, guidance, and other program-level canonical text.
- `mission_locale` contains localized mission title, instructions, reflection language, and learner/adult content blocks.
- `assessment_locale` contains localized assessment title and instructions.
- `assessment_item_locale` contains localized prompt text and response-option labels.
- Response option identity and scoring use stable structural keys, never translated labels.
- `resource_asset` declares a locale code or an explicit locale-neutral designation.
- Every locale relation is unique for its parent and locale code.
- `program_version` declares an approved default locale.
- Fallback is deterministic: use the requested approved locale when published; otherwise use the explicitly configured approved fallback, or report unavailable. Never translate silently.
- Runtime machine translation is not canonical publication.
- UI localization remains separate from canonical curriculum localization.
- Adult-entered notes retain the entered language and are not treated as canonical translations.

P0 may publish only `en-US`, but no English instructional string should be required in locale-neutral structural records.

## Q. Privacy, retention, and deletion contract

| Category | P0 contract |
|---|---|
| Adult account/profile | Minimize application profile data. Account deletion disables access and addresses profile/membership references through a controlled workflow. |
| Learner-reference data | No authentication identity. Store only nickname/initials/generated code, nullable broad age/grade bands, status, and timestamps. |
| Learning/progress/assessment/evidence | Keep separate from authentication and billing. Authorized deletion must address all associated individual records and relevant exports coherently. |
| Billing/reconciliation | Store minimum provider identifiers and reconciliation state. Access removal does not automatically delete required billing records. No card data is stored in Portal tables. |
| Audit/security/operational | Append-only or tightly controlled. Retained records should permit nulling or pseudonymizing personal actor references where appropriate without destroying event integrity. |
| Published curriculum | Independent of customers and never cascades from account, workspace, learner, membership, entitlement, or billing deletion. |
| Temporary exports | Authorized, audited, minimized, time-bounded, and never exposed through persistent public links. |

Additional rules:

- Children do not authenticate.
- UI guidance discourages full child names and unrelated sensitive information in notes.
- Learner deletion is a server-side controlled workflow covering cohort assignments, progress, assessments, evidence, feedback associations where applicable, and known temporary exports.
- Workspace/account deletion does not cascade into published curriculum, billing truth, or required audit/security history.
- Entitlement suspension/revocation changes authorization only; it does not delete learning history.
- Cohort or teacher-assignment removal revokes access but preserves historical delivery and audit records.
- Exact retention durations are intentionally not frozen here. They require an approved AIEA privacy/retention policy before broader production launch.
- AIEA platform administration owns retention/deletion execution through authenticated, bounded, audited server operations.

## R. Exact pre-implementation commerce repairs

Before any Portal entitlement authorizes access:

1. Replace `status === "complete"` authorization with valid payment-state handling.
2. Remove the legacy default-product fallback from Portal entitlement logic.
3. Establish one authoritative server-side offer map from internal offer and Stripe Price/Product to the exact published program version.
4. Require authenticated account, active workspace, and authorized membership before Portal Checkout.
5. Establish the pending `billing_reference` correlation contract in Section N.
6. Add stable idempotency for Checkout creation and reuse it during safe retries.
7. Do not trust browser-submitted product, price, workspace, program, version, role, or entitlement values.
8. Preserve raw-body Stripe signature verification and validate environment/account/event type.
9. Insert `stripe_event` using the unique Stripe event ID before applying effects.
10. Atomically update event state, billing reference, exact-version entitlement, and audit event.
11. Return non-2xx for retryable database or entitlement-processing failure.
12. Return 2xx for already-applied duplicates without repeating effects.
13. Reconcile current provider object state when event ordering could otherwise regress local state.
14. Persist relevant Checkout Session, Customer, PaymentIntent, Charge, Refund, and Dispute identifiers; leave subscription/invoice identifiers nullable and inactive unless later authorized.
15. Implement the one-time payment, full-refund, dispute, final-loss, and partial-refund behavior in Section M.
16. Separate Postmark notification success from entitlement transaction success.
17. Record notification failure for retry or staff action without undoing a committed entitlement.
18. Prevent `/api/check-access`, Stripe Session IDs, and HMAC PDF tokens from becoming Portal authorization fallbacks.
19. Keep current non-Portal digital-download behavior isolated from Portal entitlement code.
20. Add tests for paid, unpaid-complete, delayed payment, duplicate/replayed event, out-of-order event, transient database failure, unknown price, forged workspace correlation, inactive membership, refunded payment, dispute states, and cross-workspace/cohort access.

These are mandatory implementation gates. Sprint 00C does not perform them.

## S. Sprint 00B issue-by-issue disposition matrix

| Sprint 00B issue or required change | Disposition | Sprint 00C resolution |
|---|---|---|
| Vercel + Supabase + Stripe platform fit | **RESOLVED** | No technical contradiction found. |
| Checkout `complete` treated as paid | **RESOLVED WITH ARCHITECTURE CHANGE** | Valid payment truth is mandatory; repair retained as pre-implementation gate R1. |
| Webhook catches failure and returns 200 | **RESOLVED WITH ARCHITECTURE CHANGE** | Retryable entitlement/DB failures must return non-2xx; duplicate applied events return 2xx. |
| No durable checkout/workspace correlation | **RESOLVED WITH ARCHITECTURE CHANGE** | Account/workspace precedes checkout; pending billing reference supplies server correlation. |
| Guest purchase claim decision | **RESOLVED** | Guest Portal checkout and `purchase_claim` are excluded by Human Authority. |
| Session/HMAC bearer flow could be reused | **RESOLVED** | Explicitly prohibited as Portal authorization; retained only for isolated non-Portal downloads. |
| Duplicated product registries | **RESOLVED WITH ARCHITECTURE CHANGE** | One authoritative server-side offer map is required. |
| Current code supports one-time payment only | **RESOLVED** | P0 is expressly one-time purchase; subscriptions are deferred. |
| Subscription policy undefined | **DEFERRED BY HUMAN AUTHORITY** | Nullable readiness only; no subscription functionality or claim. |
| Entitlement not pinned to exact program version | **RESOLVED WITH ARCHITECTURE CHANGE** | Exact `program_version` foreign key is mandatory. |
| Cross-workspace learner integrity | **RESOLVED WITH ARCHITECTURE CHANGE** | Composite workspace/learner integrity is mandatory. |
| Mission/version mismatch risk | **RESOLVED WITH ARCHITECTURE CHANGE** | Version is derived or composite-FK enforced. |
| Assessment attempt ownership incomplete | **RESOLVED WITH ARCHITECTURE CHANGE** | Attempt binds assessment, version, workspace, learner, and adult actor. |
| Evidence context could be free-form | **RESOLVED WITH ARCHITECTURE CHANGE** | Evidence must reference governing mission and/or assessment context and stable requirement key where used. |
| Assessment localization missing | **RESOLVED WITH ARCHITECTURE CHANGE** | `assessment_locale` and `assessment_item_locale` are included. |
| Resource localization ambiguous | **RESOLVED WITH ARCHITECTURE CHANGE** | Every asset is locale-specific or explicitly locale-neutral. |
| Staff authority mechanism unresolved | **RESOLVED WITH ARCHITECTURE CHANGE** | Dedicated `staff_authorization` is mandatory. |
| Staff email domain could imply authority | **RESOLVED** | Explicitly prohibited. |
| Privileged authentication strength unresolved | **RESOLVED WITH ARCHITECTURE CHANGE** | TOTP-backed `aal2` plus active staff authorization is required. |
| School teacher visibility unresolved | **RESOLVED WITH ARCHITECTURE CHANGE** | Minimal cohort assignments constrain teacher access. |
| Cohort/class domain previously conditional | **RESOLVED WITH ARCHITECTURE CHANGE** | Now mandatory in P0 for school workspaces. |
| Cohort delivery overloaded with individual progress | **RESOLVED WITH ARCHITECTURE CHANGE** | `cohort_mission_delivery` is separate from individual records. |
| Program participation/enrollment table question | **RESOLVED** | Not required for P0 while workspace entitlement covers all eligible learner refs under cohort boundaries. |
| General learner uploads | **DEFERRED BY HUMAN AUTHORITY** | Disabled; future artifact requirement needs separate product/privacy approval. |
| Child authentication | **DEFERRED BY HUMAN AUTHORITY** | Explicitly outside P0. |
| Adult passwordless mode | **RESOLVED** | Email magic link or OTP at `aal1`; production SMTP required. |
| RLS negative cases | **RESOLVED WITH ARCHITECTURE CHANGE** | Workspace, membership, entitlement, cohort-teacher, and cohort-learner predicates are all mandatory. |
| Client service-role exposure | **RESOLVED** | Prohibited; privileged credentials remain server-only. |
| Stripe event uniqueness/idempotency | **RESOLVED WITH ARCHITECTURE CHANGE** | Unique provider event ID and atomic processing state are mandatory. |
| Full refund entitlement behavior | **RESOLVED** | Entitlement becomes `REVOKED`. |
| Final dispute loss behavior | **RESOLVED** | Entitlement becomes `REVOKED`. |
| Unresolved dispute behavior | **RESOLVED** | Architecture supports controlled `SUSPENDED`; action is recorded and audited. |
| Partial refund behavior | **RESOLVED** | No automatic entitlement change; authorized review required. |
| Revocation could delete learning history | **RESOLVED** | Authorization transition is separated from record retention/deletion. |
| Published-version mutability | **RESOLVED WITH ARCHITECTURE CHANGE** | Published records are immutable; material change creates a new version. |
| Eight missions could become schema constraint | **RESOLVED** | Explicitly configuration only. |
| Locale fallback ambiguity | **RESOLVED WITH ARCHITECTURE CHANGE** | Deterministic approved fallback or unavailable; no silent translation. |
| Runtime machine translation | **DEFERRED BY HUMAN AUTHORITY** | Not part of canonical P0 delivery. |
| Retention categories | **RESOLVED** | Six categories and controlled relationships are frozen. |
| Exact retention durations | **DEFERRED BY HUMAN AUTHORITY** | Must be approved before broader production launch; no duration invented. |
| Learner deletion workflow | **RESOLVED WITH ARCHITECTURE CHANGE** | Server-side controlled deletion covers related individual records and exports. |
| Temporary CSV export risk | **RESOLVED WITH ARCHITECTURE CHANGE** | Authorized, audited, minimized, time-bounded, and non-public. |
| Postmark failure coupled to access | **RESOLVED WITH ARCHITECTURE CHANGE** | Notification is separate from committed entitlement truth. |
| Commerce regression-test coverage | **RESOLVED WITH ARCHITECTURE CHANGE** | Exact mandatory test cases retained in Section R. |

## T. Remaining blockers

### Human Authority blockers to final P0 architecture freeze

**NONE**

### Preconditions before implementation or launch

These are execution gates, not unresolved architecture rulings:

- explicit Human approval of this final freeze candidate;
- Sprint 01 authorization before any schema, migration, provider, auth, or code work;
- implementation and testing of all Section R commerce repairs;
- Supabase project/configuration approval;
- RLS and relational-integrity tests covering every negative case;
- production transactional SMTP configuration;
- TOTP enrollment/challenge/recovery design and `aal2` enforcement for staff;
- approved privacy/retention durations before broader production launch; and
- no Portal payment acceptance until entitlement reconciliation has passed controlled end-to-end testing.

## U. Final freeze eligibility verdict

**ELIGIBLE FOR FINAL P0 FREEZE**

The reconciled architecture now has:

- a bounded final P0 object set;
- account-before-checkout correlation;
- exact-version entitlement pinning;
- idempotent Stripe event and entitlement semantics;
- cohort-scoped school privacy;
- separate cohort delivery and individual evidence;
- adult-only authentication;
- dedicated staff authority with TOTP-backed `aal2` privileged access;
- complete localization foundations;
- controlled privacy/deletion relationships; and
- explicit deferred scope.

Final freeze eligibility does not authorize implementation. This candidate becomes the active P0 freeze only upon explicit Human Authority approval.

## V. Repository safety report

- File created in Sprint 00C: `docs/portal/AIEA_Portal_Sprint_00C_Final_P0_Architecture_Freeze_Candidate_v1.0.md`
- Existing Sprint 00B report modified: **NO**
- Application files modified: **NONE**
- Other files created in Sprint 00C: **NONE**
- Schemas or migrations created/run: **NONE**
- Packages installed: **NONE**
- Supabase resources created/configured: **NONE**
- Stripe, Vercel, Vercel Blob, Postmark, MailerLite, environment, DNS, or deployment modified: **NO**
- Commits: **NONE**
- Pushes: **NONE**
- Deployments: **NONE**
- Sprint 01 begun: **NO**
- Pre-existing untracked documentation at Sprint 00C start: `docs/portal/AIEA_Portal_Sprint_00B_P0_Architecture_Data_Contract_Verification_v1.0.md`
- Only repository change made during Sprint 00C: the Sprint 00C Markdown report above.
