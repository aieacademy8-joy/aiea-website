## A. Verification result

**PASS WITH REQUIRED CHANGES**

The Vercel + Supabase + Stripe architecture is technically coherent and compatible with the current repository. Supabase Auth supports email magic links and OTP, and Supabase/Postgres RLS can enforce the proposed workspace boundary. Supabase secret/service-role-equivalent credentials must remain server-only. [Supabase passwordless authentication](https://supabase.com/docs/guides/auth/auth-email-passwordless), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase data security](https://supabase.com/docs/guides/database/secure-data).

The required changes are data-contract clarifications and commerce repairs, not a vendor contradiction.

## B. Technical contradictions and unresolved boundaries

### No platform contradiction

- The existing site already targets Vercel and uses serverless `/api` functions.
- Supabase can be added as the Portal identity/database layer without moving the marketing site.
- Vercel Blob can remain the source for AIEA-published resources.
- Supabase Storage can remain unused in P0.
- MailerLite remains separate from authorization.
- Postmark remains transactional only.

### Current-code conflicts that the proposal correctly supersedes

1. **Checkout completion is treated as payment success.**  
   [check-access.js](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/api/check-access.js:64>) grants access when `payment_status === "paid"` **or** `status === "complete"`. Stripe documents that a complete Checkout Session can still have payment processing in progress. Portal access must use valid payment state, not session completion. [Stripe Checkout Session object](https://docs.stripe.com/api/checkout/sessions/object).

2. **Webhook failures are acknowledged as success.**  
   [stripe-webhook.js](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/api/stripe-webhook.js:104>) catches fulfillment failures and still returns HTTP 200. A failed entitlement transaction would therefore not receive Stripe retry behavior.

3. **No durable Portal correlation exists.**  
   [create-checkout.js](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/api/create-checkout.js:74>) records only product metadata. It does not identify an authenticated user, workspace, purchase intent, or future entitlement.

4. **Current access is a bearer-link download flow.**  
   The Checkout Session ID generates an HMAC PDF token. This is acceptable for the existing downloads but cannot authorize Portal records.

5. **Product mappings are duplicated.**  
   Server-side product registries appear in checkout, access, download, webhook, and thank-you behavior. Portal entitlement mapping needs one authoritative server-trusted source.

6. **Current code supports one-time payments only.**  
   Checkout uses `mode=payment`. Subscription event behavior is not implemented or verified. Subscription fields can be nullable in the foundation, but P0 must not claim working subscription support without separate authorization.

### Human boundary still requiring a decision

A `SCHOOL` workspace without class/cohort scoping makes the entire workspace one security boundary. Every active `TEACHER` would potentially see every learner reference and learning record in that school workspace.

P0 must explicitly choose one:

- Accept whole-school visibility for a tightly bounded founding pilot; or
- Restrict each school workspace to one teacher/classroom; or
- Add a cohort/class assignment domain.

The third choice expands P0 and should not be assumed.

## C. Missing P0-critical objects or relationships

### Required relationships

1. **Entitlement must reference an exact `program_version`.**  
   Granting only a general `program` would allow later publication changes to alter an existing purchaser’s experience.

2. **Checkout must have a trustworthy workspace correlation.**

   - If account/workspace creation occurs before checkout, Stripe metadata and `client_reference_id` can carry a server-generated correlation identifier.
   - If guest checkout remains, the object set needs a controlled `purchase_claim` or equivalent pending-claim relationship. Matching an entitlement to any account merely because the emails match is insufficiently explicit.

3. **Cross-workspace integrity must be enforced relationally, not only by RLS.**  
   For example, `mission_progress.workspace_id` and `learner_ref_id` must be protected by a composite foreign key ensuring that the learner belongs to that workspace.

4. **Mission/version integrity must be enforced.**  
   Either omit the redundant `program_version_id` from `mission_progress` because it is derivable through `mission`, or enforce a composite foreign key proving that the mission belongs to the stated version.

5. **Assessment attempt ownership must be explicit.**  
   An attempt must identify assessment, learner reference, workspace, program version, and adult actor without permitting cross-workspace combinations.

6. **Evidence must identify its governing context.**  
   `evidence_record` should link to the applicable mission, assessment attempt, or stable evidence requirement—not merely carry a free-form type.

### Additional objects or mechanisms

- **Assessment localization:** `assessment_locale` and `assessment_item_locale`, or an equivalent normalized localization mechanism, are required. Otherwise English assessment prompts become embedded in structural records.
- **Internal staff authorization:** use either a small `staff_authorization` table or server-managed Supabase `app_metadata`. It must not be represented as ordinary workspace membership or user-editable metadata.
- **Conditional `purchase_claim`:** required only if checkout can precede adult account/workspace creation.
- **Conditional cohort/class domain:** required only if teachers must not have whole-school learner visibility.

A separate `program_participation`/enrollment table is **not P0-critical** if every learner reference in a workspace may use every active workspace entitlement. It becomes useful when seat assignment or selective enrollment is required.

## D. Unnecessary proposed objects

None of the proposed objects are inherently unnecessary.

- `stripe_event` is required for durable idempotency.
- `billing_reference` separates provider billing truth from access policy.
- `entitlement` is the Portal authorization record.
- Locale tables are justified despite en-US-only P0.
- `resource_asset` should store metadata and a controlled Vercel Blob reference, not the binary.
- `audit_event` is necessary for staff corrections, revocations, exports, and privileged support operations.
- `user_profile` should remain minimal but usefully separates application identity from Supabase-managed authentication.

## E. Recommended relationship/cardinality map

```text
auth.users
  1 ── 0..1 user_profile
  1 ── N workspace_membership
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

program
  1 ── N program_version

program_version
  1 ── N program_version_locale
  1 ── N mission
  1 ── N resource_asset
  1 ── N assessment
  1 ── N entitlement

mission
  N ── 1 program_version
  1 ── N mission_locale
  1 ── N resource_asset
  1 ── N mission_progress
  1 ── N evidence_record

assessment
  N ── 1 program_version
  1 ── N assessment_item
  1 ── N assessment_attempt
  1 ── N assessment_locale

assessment_item
  N ── 1 assessment
  1 ── N assessment_response
  1 ── N assessment_item_locale

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
  1 ── N entitlement

entitlement
  N ── 1 workspace
  N ── 1 program_version
  N ── 1 billing_reference

learner_ref
  N ── 1 workspace
  1 ── N mission_progress
  1 ── N assessment_attempt
  1 ── N evidence_record
```

Key constraints:

- Unique active membership per `(workspace_id, user_id)`.
- Unique provider event ID on `stripe_event`.
- Unique Stripe Checkout Session, PaymentIntent, Subscription, and Customer identifiers where applicable.
- Unique locale per `(program_version_id, locale_code)` and `(mission_id, locale_code)`.
- Unique mission sequence within a program version.
- Unique mission progress per `(learner_ref_id, mission_id)`.
- Unique assessment response per `(assessment_attempt_id, assessment_item_id)`.
- At most one active entitlement for a workspace/program-version/billing basis unless multiplicity is explicitly needed.
- `learner_ref.workspace_id` must match the workspace on every delivery record.

## F. Recommended RLS ownership/access matrix

| Object | Anonymous | Active workspace member | Owner | Teacher | AIEA staff/server |
|---|---|---|---|---|---|
| `user_profile` | None | Self only | Self only | Self only | Bounded lookup through server |
| `workspace` | None | Read own workspace | Limited update | Read | Controlled support |
| `workspace_membership` | None | Read own membership | View; changes through server/RPC | Read own | Controlled management |
| `learner_ref` | None | Workspace scoped | CRUD | CRUD only if whole-school access approved | Controlled support |
| `entitlement` | None | Read active own-workspace rows | Read | Read | Create/update/revoke |
| Published curriculum | None | Read only when valid entitlement exists | Same | Same | Publish/manage server-side |
| `mission_progress` | None | Workspace/learner/version scoped | Read/write | Read/write | Diagnose/correct with audit |
| Assessment attempts/responses | None | Workspace scoped | Draft/write/finalize | Draft/write/finalize | Bounded support/export |
| `evidence_record` | None | Workspace scoped | Create/read; update own draft | Same | Bounded support/export |
| `pilot_feedback` | None | Create/read permitted scope | Same | Same | Export/read |
| `stripe_event` | None | None | None | None | Server only |
| `billing_reference` | None | Limited read summary if needed | Read summary | Normally none | Server only mutation |
| `audit_event` | None | Normally none | No direct insert | No direct insert | Server/trigger write; bounded staff read |
| Staff authorization | None | None | None | None | Server-controlled only |

Implementation rules:

- Enable RLS and least-privilege grants on every exposed table.
- Use the browser only with the Supabase publishable key.
- Never send a Supabase secret/service-role-equivalent key to the client; it bypasses RLS. [Supabase API-key guidance](https://supabase.com/docs/guides/getting-started/api-keys).
- Do not accept `actor_user_id` from browser input; derive it from `auth.uid()` or a trusted server operation.
- Membership must be active and not revoked at query time.
- Protected content policies must check both membership and active entitlement.
- Membership role changes, entitlement mutations, publication, exports, audit writes, and Stripe processing should be privileged server operations.
- Assessment finalization should be an RPC/server operation so completed attempts cannot be silently rewritten.
- Privileged staff endpoints must authenticate the staff user, check separate staff authorization, constrain the requested operation, and write an audit event before or atomically with the mutation.
- Test all six stated negative cases plus forged workspace IDs, forged learner IDs, revoked entitlements, and cross-version mission IDs.

## G. Stripe event → billing reference → entitlement state machine

### Event processing

```text
SIGNED EVENT RECEIVED
    ↓ verify raw-body signature and environment
RECEIVED
    ↓ insert stripe_event using UNIQUE provider_event_id
PROCESSING
    ├── unsupported but valid event → IGNORED → HTTP 2xx
    ├── already APPLIED/IGNORED    → no-op → HTTP 2xx
    ├── transient DB/provider fail → RETRYABLE_FAILED → HTTP non-2xx
    ├── permanently invalid mapping→ TERMINAL_ERROR + alert
    └── transaction succeeds      → APPLIED → HTTP 2xx
```

A Stripe event has a unique event identifier suitable for the idempotency record. [Stripe Event object](https://docs.stripe.com/api/events).

### Billing reference

For the current one-time-payment flow:

```text
PENDING
  → PAID
  → REFUNDED | DISPUTED | CANCELED/VOID
```

If subscriptions are later enabled:

```text
PENDING
  → ACTIVE
  → PAST_DUE
  → ACTIVE              (recovered)
  → CANCELED | ENDED
```

Keep the raw Stripe provider status in a separate field. Do not force every future provider state into an oversimplified local enum.

### Entitlement

```text
No entitlement
  → ACTIVE        only after verified good-standing billing truth
  → SUSPENDED     temporary non-good-standing state, if Human policy permits
  → REVOKED       controlled final removal
  → EXPIRED       when an explicit end timestamp is reached
```

Processing should occur in one database transaction:

1. Lock or insert the event.
2. Resolve the server-trusted offering.
3. Upsert the billing reference.
4. Create/update/revoke the version-pinned entitlement.
5. Record the audit event.
6. Mark the Stripe event applied.
7. Commit.
8. Return 2xx.

Do not make entitlement success depend on Postmark. A successfully committed entitlement remains valid if email delivery fails. Notification failure should be separately recorded and retried or surfaced for staff action.

Human policy is still required for refund, dispute, `past_due`, grace-period, and partial-refund effects.

## H. Program-version publication and immutability

Recommended states:

```text
DRAFT → REVIEW_READY → PUBLISHED → RETIRED
```

- `DRAFT` and `REVIEW_READY` may be edited.
- Publishing records `published_at`, publisher, version identifier, and content hash.
- After `PUBLISHED`, structural records, mission sequence, assessment definitions, completion rules, and canonical content are immutable.
- Corrections that alter meaning or evidence requirements create a new `program_version`.
- `RETIRED` prevents new entitlements but does not remove existing records or rewrite historical delivery.
- Entitlements, progress, attempts, evidence, and feedback remain pinned to the version actually delivered.
- Deleting a published version is prohibited while referenced.
- A locale may have its own readiness/publication state, but it must not change the underlying mission or assessment identity.
- Resource replacement should be versioned when it changes instructional meaning; silent Blob replacement is not acceptable for governed curriculum.

## I. Multilingual/data-model verification

The proposed locale separation is sound but incomplete.

### Conforming foundation

- `program`, `program_version`, and `mission` hold stable identifiers and structural data.
- `program_version_locale` holds localized program title, description, guidance, and other display content.
- `mission_locale` holds localized mission title, instructions, reflection language, and content blocks.
- P0 can publish only `en-US` without hard-coding English into structural tables.
- UI translations remain separate from curriculum translations.
- No runtime machine translation is needed or implied.

### Required additions/clarifications

- Add `assessment_locale` and `assessment_item_locale`, or an equivalent normalized locale layer.
- Store stable response option keys structurally; store option labels in the locale layer.
- `resource_asset` needs nullable `locale_code` or an explicit locale-neutral flag.
- Locale uniqueness and fallback behavior must be deterministic.
- Missing localization must not silently invoke machine translation.
- Evidence type codes and progress statuses remain locale-neutral enums.
- Adult-authored notes remain in the language entered and are not canonical translations.

## J. Privacy and deletion relationship risks

| Data class | Relationship requirement |
|---|---|
| Adult account data | `user_profile` may cascade from `auth.users`; operational records should use nullable/pseudonymizable actor references rather than preventing deletion. |
| Workspace data | Deactivation should precede deletion. Do not cascade workspace deletion into billing or published curriculum. |
| Learner-reference data | Keep authentication completely separate. A deletion workflow must address associated progress, assessment, evidence, and exports as one controlled operation. |
| Learning records | Do not let a learner-reference deletion leave unidentified but still sensitive free-text evidence unintentionally. Do not casually cascade-delete outcome evidence before the approved retention/export decision. |
| Billing references | Store only required Stripe identifiers/statuses and minimal reconciliation data. Do not copy card data or child information. |
| Stripe events | Avoid retaining complete raw event payloads indefinitely when bounded identifiers, status, hashes, and necessary event fields suffice. Payloads can contain adult PII. |
| Operational/audit records | Actor references should tolerate account deletion through nulling or pseudonymization while preserving the event’s integrity. Keep metadata bounded. |
| Published curriculum | Independent of users/workspaces; never cascade from customer deletion. |
| Adult notes | UI and guidance should discourage entry of full child names or unrelated sensitive information. |
| CSV exports | Treat as temporary sensitive outputs; authorize, audit, minimize, and avoid persistent public links. |

No retention duration should be frozen until Human Authority approves it.

## K. Exact commerce repairs required

Before entitlements authorize Portal access:

1. Replace `status === "complete"` authorization with explicit valid payment-state handling.
2. Remove the legacy default-product fallback from all Portal entitlement decisions.
3. Establish one authoritative server-trusted mapping from Stripe Price/Product IDs to the exact `program_version`.
4. Decide account-before-checkout versus controlled guest entitlement claiming.
5. Include a server-generated workspace/purchase correlation in Checkout metadata and `client_reference_id`.
6. Never trust a browser-submitted product key as sufficient entitlement evidence.
7. Add an idempotency key when creating Checkout Sessions so safe retries cannot create parallel purchases. Stripe supports idempotency keys for retryable POST operations. [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests).
8. Preserve raw-body signature verification and validate expected environment/account/event type.
9. Insert `stripe_event` with a unique Stripe event ID before applying effects.
10. Process billing reference, entitlement, and audit mutation atomically.
11. Return non-2xx when a required database/entitlement transaction fails.
12. Return 2xx for an already-applied duplicate without applying effects twice.
13. Do not rely on event arrival order; reconcile against current Stripe object state when transitions could be stale.
14. Persist Checkout Session, Customer, PaymentIntent, Invoice, and Subscription identifiers as applicable.
15. Add controlled handlers for refunds, disputes, cancellations, and subscription state only after Human policy is defined.
16. Decouple Postmark success from entitlement validity.
17. Ensure `/api/check-access` and the HMAC PDF flow never become a Portal authorization fallback.
18. Add tests for delayed payment, duplicates, replay, transient DB failure, unknown price, missing workspace correlation, revoked membership, refund/dispute, and cross-workspace access.

## L. Recommended P0 freeze wording

The following is suitable **after** the unresolved checkout-correlation, school visibility, internal-staff authorization, and billing revocation policies receive Human rulings:

> **AIEA Founding Pilot Portal — P0 Architecture and Data Contract Freeze**
>
> The P0 Portal uses Vercel for the existing public website, Portal UI, server APIs, verified Stripe webhook processing, and privileged integrations. Supabase is the system for adult authentication, PostgreSQL Portal data, Row Level Security, workspaces, memberships, version-pinned entitlements, curriculum delivery records, minimal learner references, progress, assessments, adult-entered evidence, feedback, and operational audit records.
>
> Authentication is adult-only through Supabase email magic link or OTP. Children do not receive accounts, email credentials, passwords, or direct authentication identities. A learner reference belongs only to a workspace and contains no required exact date of birth, email, address, phone number, password, or profile photograph.
>
> Portal authorization requires both an active workspace membership and an active entitlement to the exact published program version. Stripe remains billing truth but does not directly authorize Portal access. Only verified, idempotently processed Stripe events may create, update, suspend, or revoke entitlements. Browser redirects, Checkout completion alone, Stripe Session IDs, HMAC download tokens, MailerLite state, and Postmark delivery do not authorize Portal records.
>
> Published program versions and their mission sequence, assessment definitions, completion rules, and canonical localized content are historically stable. Material curriculum changes require a new program version. Existing entitlements and learning records remain pinned to the version delivered.
>
> Curriculum text is separated from stable structure through locale records. P0 may publish en-US only, but program, mission, assessment, item, and resource relationships must permit controlled future localization without runtime machine translation or silent rewriting of prior records.
>
> P0 evidence is structured adult-entered observation, reflection, assessment support, and mission evidence. General learner artifact upload is disabled. Supabase Storage is not used for learner-generated files unless separately authorized by Human Authority.
>
> Every exposed private table uses least-privilege grants and Row Level Security. Workspace data is accessible only through active membership; protected curriculum additionally requires active entitlement. Supabase secret/service-role-equivalent credentials remain exclusively in privileged server environments.
>
> AIEA staff authority is separate from workspace membership. Staff support, exports, entitlement corrections, and revocations occur only through authenticated, bounded, audited server-side operations. No polished enterprise administration product is required for P0.
>
> P0 excludes child login, district hierarchy, SIS/LMS/SSO, automated rostering, general uploads, rich portfolios, learner chatbots, embedded AI-provider APIs, Creation Sandbox, advanced analytics, gamification economy, community features, native apps, automated AI grading, full 15-level UX, and enterprise provisioning.
>
> This freeze establishes architecture and data-contract boundaries only. It does not authorize project creation, schema implementation, provider modification, production data migration, Portal UI work, deployment, or Sprint 01.

## Human rulings required before final freeze

1. Account/workspace-before-checkout or controlled guest purchase claiming.
2. Whether a P0 school workspace is one shared teacher visibility boundary.
3. Internal staff authorization: server-managed app metadata or a dedicated table.
4. Refund, dispute, cancellation, subscription `past_due`, and grace-period entitlement policy.
5. Whether progress/evidence is always per learner reference or may also be workspace/cohort-level.
6. Approved retention/deletion policy categories and operational owner.
7. Magic link versus numeric OTP UX; either is technically supported. Production Supabase Auth email also requires configured SMTP rather than its restricted default service—Postmark can satisfy that transactional boundary if separately configured. [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## M. Repository safety report

- Files changed: **NONE**
- Files created: **NONE**
- Packages installed: **NONE**
- Git status: **clean — `main...origin/main`**
- Commits: **NONE**
- Pushes: **NONE**
- Deployments: **NONE**
