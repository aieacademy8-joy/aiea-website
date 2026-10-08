# AIEA Portal — Sprint 01C Implementation Plan v1.0

Date: 2026-10-07 (America/Chicago)

Authority: Human Authority's Sprint 01C implementation ruling supplied in this chat.
Baseline: accepted Sprint 01B `3c2432749e0b265a5519dd8a099ea63a9cd1cd4f`.
Governing contract: `AIEA_Portal_P0_Architecture_and_Data_Contract_v1.0_FROZEN.md`.

## Frozen objective and Human rulings

Authorized workspace → My Programs → exact program version → ordered mission list → protected mission-text shell.

This is a migration-free, read-only adult curriculum slice validated with disposable synthetic data. Human Authority approved the existing program → program_version → mission model, without a Level entity, field or hierarchy. Opening curriculum creates no progress, completion, delivery, evidence, assessment, scoring, learner or cohort record. Initial content is limited to program/version identity, published localized program title/description/guidance, ordered mission metadata, published mission title/instructions/reflection, resolved locale and contextual navigation. All instructional text is rendered literally, never interpreted as HTML. content_blocks and separate guide/resource catalogs are deferred.

The Factory publishing handoff is separately governed and deferred. The consumer reads Portal-owned published database rows. Synthetic setup uses existing publication guards; it is not an importer or production provisioning workflow. No Factory repository/file/runtime dependency is introduced. Real delivery remains subject to the frozen Section R commerce repairs and operational gates; this sprint cannot waive them.

## Exact production boundary

One GET-only `/api/portal/curriculum` endpoint supports:

1. `workspace_id` (+ optional `locale`): entitled exact-version catalog.
2. `workspace_id`, `program_version_id` (+ optional `locale`): program text and ordered mission list.
3. Those identifiers plus `mission_id`: program context and protected mission text.

Workspace is explicit. Mission requires version. UUIDs, bounded locale syntax, exact parameter names and single occurrences are validated. Omitted requested locale means the UI's `en-US`, not a version's default locale. Unknown/inaccessible versions and mismatched missions disclose no curriculum. Empty catalog/list, unavailable localization, authorization denial and upstream failure have separate truthful behavior.

Reuse the accepted protected `/portal` document and session/coordination lifecycle. Add catalog, program and mission views, contextual back navigation and loading/error/retry states within that document. No new public curriculum HTML, framework, dependency, rewrite, provider configuration or privileged runtime path is needed.

## Authorization and selected-workspace isolation

Every request reuses accepted Auth `/user`, active adult-profile, cookie expiry and pending-signout checks. Resolve the caller's own active membership in the selected active workspace through existing context logic, then only ACTIVE entitlement summaries for that workspace. Dedupe exact version IDs across billing bases. Versions must be PUBLISHED or RETIRED; valid existing RETIRED entitlement access remains supported. Curriculum reads forward the adult JWT under the `portal` profile/RLS, never a service credential.

Existing `can_version` RLS is a union across the adult's authorized workspaces. The application must additionally intersect every result with the selected workspace's active exact-version set. Do not assume a direct entitlement/version PostgREST foreign-key embedding or expose billing records. Use bounded separate SELECTs and explicit parent/result validation. Revalidate Auth and selected-workspace access before returning assembled curriculum; fail closed if authorization changed. This does not promise transactional revocation of bytes already delivered or change SNV06.

FAMILY OWNER and SCHOOL OWNER/SCHOOL_ADMIN/TEACHER use the same catalog gate. A teacher needs no cohort assignment to read workspace-entitled curriculum under existing RLS. Cohort/learner data is neither fetched nor operated on. Clear all curriculum DOM and invalidate pending reads on workspace/session/signout/coordination changes, blur/hide/navigation and errors. Superseded responses cannot restore content. Retain accepted non-renewable pending recovery behavior.

## Locale and response-field contracts

Select requested PUBLISHED program locale, else that version's explicit PUBLISHED fallback, else unavailable. Never use default_locale as an implicit fallback or translate. The private SQL locale helper remains unexposed; bounded server selection mirrors its semantics. Mission localization must match the resolved program locale and exact mission/version parent.

All responses include `workspace_id`, `requested_locale`, `session_expires_at` and a `view` discriminator.

- Catalog: `programs[]` with program_id/program_key, program_version_id/version_key, resolved_locale and title. Missing locale produces null locale/title and an unavailable catalog entry.
- Program: `program` with those identities, resolved_locale, title, description, guidance; `missions[]` with id, mission_key, sequence, title.
- Mission: the same program context plus `mission` with id, mission_key, sequence, title, instructions, reflection.

No billing/provider identifiers, publisher identity, asset path, hash, completion/evidence rules, scoring, content_blocks or arbitrary JSON is returned. SELECT projections are explicit. Reuse the existing 100-row/512-KiB upstream limits, query 101 rows to detect overflow, and bound total JSON output to 512 KiB. Invalid upstream shapes/parents/oversized text fail with sanitized unavailability. Responses are private/no-store; no tokens enter browser JSON/storage/logs.

## Proposed files

All paths are repository-relative to `/Users/dosfam/Desktop/AIEAcademy/Website/2.0`.

New production: `api/portal/curriculum.js`, `lib/portal/curriculum.js`.

Modify production: `lib/portal/runtime.js` (export existing bounded row reader), `lib/portal/shell.js`, `portal/portal.js`, `portal/portal.css`.

Modify support: `scripts/portal/serve-local.mjs` (route), `portal/README.md` (boundary and validation).

New tests: `scripts/portal/test-curriculum.mjs` (mocked handlers), `scripts/portal/test-curriculum-client.mjs` (actual-client deterministic lifecycle), `scripts/portal/test-curriculum-browser.mjs` (native-backed browser), `supabase/tests/curriculum.native.py` (disposable native fixture/HTTP/RLS/no-write checks).

New governance: this plan and `docs/portal/AIEA_Portal_Sprint_01C_Implementation_and_Validation_Report_v1.0.md`.

Preserve accepted foundation/01B tests and evidence unchanged; extend validation in separate files. Temporary orchestration, credentials, logs and screenshots remain outside the repository. No migration/schema/RLS/grant, package/dependency or hosted configuration change is allowed.

## Test matrix and evidence levels

- FAMILY owner; SCHOOL owner/admin/teacher; teacher without cohort assignment.
- Same adult, two workspaces with different entitlements; cross-workspace ID substitution and authorization changes during a read.
- Multiple versions of one program, duplicate active billing bases, three missions out of insertion order (not eight), empty catalog/list.
- PUBLISHED/DRAFT/REVIEW_READY/RETIRED; ACTIVE/SUSPENDED/REVOKED; exact-version pinning and wrong mission/version.
- Requested locale, explicit fallback, unavailable without implicit default; published locale projection only.
- Anonymous/expired/pending-signout/inactive adult/workspace/membership; Auth/upstream failure.
- Wrong method, malformed/duplicate/unsupported/oversized requests; row/payload overflow; unexpected upstream shapes/parents; field allowlist.
- Literal HTML-like text, responsive layout, navigation, clear/loading/denied/unavailable/retry behavior.
- Held responses across workspace/session/coordination/blur/hide/signout transitions; sustained pending recovery remains bounded.
- Compare learning/delivery/evidence/assessment/learner/cohort tables before/after browsing; no records added or changed.

Rerun unchanged 01A foundation/security, native email OTP and staff assurance tests and 01B mocked Auth/coordination plus native/browser regressions. Native tests use a copied clean local Supabase project and numeric-template overlay without changing repository configuration, only synthetic example.invalid adults, genuine native Auth/TOTP for fixture publication, and existing immutable publication transitions. Stop/remove disposable volumes and servers afterward. Report mocked, native and browser results separately; none establishes hosted behavior. If local execution is unavailable, report the limitation rather than invent evidence.

## Exclusions and stop conditions

No Factory coupling/publishing tooling, resource downloads/Blob, content_blocks renderer, activity execution, assessment/scoring/completion controls, cohort/learner/progress/evidence mutations, child accounts, uploads, Creation Sandbox, AI integrations, dashboards, commerce/subscription changes, SSO/SIS/LMS, hosted Supabase/Vercel/provider configuration, deployment/activation, or Sprint 01D work.

STOP for Human Authority if implementation needs a migration, schema/RLS/grant change, new dependency/framework, provider configuration or scope expansion. Do not alter frozen architecture or accepted evidence. Do not stage, commit, push, deploy or self-accept. Finish with the implementation/validation report and STOP for review.

## Exactly five retained OPEN NOTES

| ID | Unchanged OPEN observation |
| --- | --- |
| 01B-A03 | Local routing does not establish hosted Vercel rewrite/CDN/HTTPS-cookie behavior. |
| SNV02 | Accepted inbucket configuration is deprecated in the tested CLI. |
| SNV04 | Current refresh-chain cascade invalidation remains unproven. |
| SNV05 | Same-site redirect/path behavior does not establish exact-path-only native callback guarantees. |
| SNV06 | Ordinary stateless Data API/RLS may accept an unexpired signed-out JWT; Portal Auth validation and accepted privileged live-session/TOTP gate remain distinct. |

No note is resolved, removed, expanded or reclassified.

## Pre-implementation self-check

The proposed field/relationship/read behavior fits the frozen tables and existing grants. Private locale resolution can be mirrored through authorized locale SELECTs. Selected-workspace isolation is explicit in the server read model. No Level model, privileged read, new dependency, migration or architecture/security contradiction is required. Proceed only within the recorded boundary.
