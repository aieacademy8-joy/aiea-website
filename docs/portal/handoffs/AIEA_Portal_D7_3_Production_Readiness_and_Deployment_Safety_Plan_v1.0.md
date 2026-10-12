# AIEA Portal — D7.3 Production Readiness and Deployment Safety Plan v1.0

Date: **2026-10-10 (America/Chicago)**. Final Human Authority: **Irene**.  
Mode: **PLANNING AND STATIC REVIEW ONLY — NO EXECUTION**.  
Accepted release source: **`079e7f2a13142e956a5766d6e9e17a1f94718f5f` (Sprint 01C)**.  
Disposition: **PRODUCTION REMAINS ON HOLD. STOP AFTER THIS DOCUMENT FOR HUMAN AUTHORITY REVIEW.**

## A. Executive disposition

The D7.2 manifest reconciles with the accepted Sprint 01C Git objects. All **181** accepted source inventory entries match their paths, modes, blob IDs, byte lengths and SHA-256 hashes. The accepted tree contains exactly **M1, M2 and M3**; their current workspace copies also match. The frozen architecture matches both the accepted tree and the original freeze commit. These are **VERIFIED local source facts**, not production readiness results.

**No production gate is declared passed.** Current hosted state, effective privileges, runner/ledger behavior, recovery and maintenance controls, compatible rehearsal, hosted security behavior and deployment provenance lack sufficient current evidence. Supplied hosted settings additionally conflict with the unchanged six-digit OTP implementation and production SMTP requirement. The three SQL files each contain an explicit transaction; the M1→M2→M3 batch must be treated as three potentially separate commits.

The Human instruction authorizes this D7.3 plan only. It supersedes D7.2's prohibition on automatic D7.3 continuation solely by explicitly requesting this planning step. It does not authorize production migration, hosted inspection/configuration, SQL execution anywhere, hook activation, tests, dependency installation, builds, deployment, Git publication or subsequent work. Approval of this document must likewise remain distinct from those actions.

The older reconnaissance/reconciliation/preflight records describe HEAD/01D and five migrations as accepted. For this release, the current Human instruction and D7.2 accepted-only boundary control: **01D is excluded; only the named 01C source is eligible**. Historical records remain intact. Their five-file execution recommendations, two write-RPC validation cases and hook activation procedures are inapplicable here.

This plan can support a future decision about a **fenced foundation installation** after its prerequisites are verified. Such installation would not authorize a usable pilot, real onboarding, curriculum publication, entitlements, commerce, staff bootstrap or general launch. Those require separately governed implementation and evidence under the frozen contract.

### Evidence vocabulary

| Classification | Meaning in this plan |
| --- | --- |
| **VERIFIED** | Directly inspected local Git objects, file bytes, static source or present Human instruction. A document's existence/content is verified; its historical behavioral claims are not thereby reproduced. |
| **SUPPLIED BUT NOT REVERIFIED** | Hosted facts carried from D7.1 through D7.2/earlier handoffs. Original complete result grids, observation context and current hosted state were not independently inspected here. |
| **REPORTED BUT NOT RERUN** | Historical local/native/browser/independent validation results recorded in accepted reports; no suite or SQL was executed in D7.3. |
| **UNKNOWN** | Missing, incomplete, stale or uninspected evidence. Cannot satisfy an operational gate. |
| **BLOCKED** | A required action cannot proceed because of a known scope/configuration conflict, an unresolved prerequisite or absent authorization. Underlying evidence retains its own classification. |

Future procedures and acceptance criteria below are **proposals**, not observations or permissions. A gate can contain VERIFIED source evidence while its operational disposition remains BLOCKED. Report individual results and provenance; do not replace missing evidence with an aggregate PASS.

## B. Accepted source and exclusions

### B1. Evidence register and source precedence

All paths are in `/Users/dosfam/Desktop/AIEAcademy/Website/2.0`. Links to tracked source navigate to workspace files; accepted Git bytes remain authoritative wherever the workspace differs.

| Ref | Evidence read | Use and boundary |
| --- | --- | --- |
| S1 | [D7.2 Markdown manifest](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.md>) | Accepted-only scope, pins, supplied D7.1 findings, G0–G10 and exclusions. Local SHA-256: `dccf26ffed4564700889e000e53aaa643d351c7adb3a107b6ef9dabfc8f53845`. |
| S2 | [D7.2 JSON manifest](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.json>) | Machine-readable identities; SHA-256 `e1149899b0dceb126a240c5441e6483d0a133f788fe62872b9652eb681f779ed`, matching S1's declared digest. Inventory is source identity, not a production payload allowlist. |
| S3 | [Root hosted reconciliation handoff](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md>) | Earlier narrow supplied observations and operational risks; five-migration/01D authority superseded for this release. |
| S4 | [Handoffs hosted reconciliation](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md>) | Fuller supplied inventory, transaction/fencing/recovery requirements; historical five-file/hook procedure excluded. |
| S5 | [Hosted metadata preflight package](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_Hosted_Metadata_Preflight_Package_v1.0.md>) | Prepared, unexecuted metadata queries and sanitized operator checklist. Its M4/M5 interpretations require accepted-only reconciliation before future use; see D and K. |
| S6 | [Frozen P0 architecture/data contract](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_P0_Architecture_and_Data_Contract_v1.0_FROZEN.md>) | Canonical architecture, security, commerce, privacy and deferred scope. SHA-256 `f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755`; original freeze commit `052101670dc92b38c7ec15c88a2b07572e42d75b`. Unchanged. |
| S7 | Accepted 01C Git tree `7cac2a07bab9ed051737dcd150e7e7edc411879a` | Exact commit/tree/blob source of migrations, application, support files and historical evidence. Title: “AIEA Portal: accept Sprint 01C curriculum delivery shell.” |
| S8 | [01C final acceptance/repository review](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_Sprint_01C_Final_Acceptance_and_Repository_Boundary_Review_v1.0.md>) | Accepted runtime boundary, historical validation inventory and five open notes. The report's pre-commit HEAD is historical, not the release source identifier. |
| S9 | [01C A01 independent correction review](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_Sprint_01C_A01_Independent_Correction_Reaudit_v1.0.md>) and [01C A02 independent correction review](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_Sprint_01C_A02_Independent_Correction_Reaudit_v1.0.md>) | Historical A01/A02 closure and negative-control evidence; REPORTED BUT NOT RERUN. Preserve earlier failures as history. |
| S10 | [01A SNV03 current assurance correction](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_Sprint_01A_SNV03_Current_Assurance_Correction_and_Revalidation_v1.0.md>) | Historical current-session/TOTP correction and retained limitations; source boundary rechecked against M2/M3. Behavioral results not rerun. |

Precedence: the present Human instruction sets task authority and accepted source; S6 governs frozen constraints; S1/S2 identify the accepted-only release; S3–S5 supply earlier evidence and proposals. Historical assertions of 01D acceptance do not expand this task. No new provider-documentation verification or live provider observation was performed; provider/version-dependent behavior remains a future verification requirement.

### B2. D7.2 reconciliation results

| Item | D7.3 finding | Classification |
| --- | --- | --- |
| Accepted commit/tree/title | Exact S7 identity confirmed. | VERIFIED |
| Complete source inventory | All 181 entries match Git path, mode, blob ID, byte length and SHA-256; no missing/extra accepted inventory path. | VERIFIED |
| Manifest subsets | All 3 migration entries, 12 runtime/build-input pins, 6 support pins and frozen artifact pin match accepted Git bytes. | VERIFIED |
| Working tree versus accepted source | 174 baseline files identical; 7 different: `lib/portal/runtime.js`, `lib/portal/shell.js`, `portal/portal.css`, `portal/portal.js`, `portal/README.md`, `supabase/README.md`, `scripts/portal/serve-local.mjs`. | VERIFIED; later versions INELIGIBLE |
| Current HEAD | `e1b2b8b0e880e2d5a277060514e9a8dac8ffdaa0`; 28-path delta versus accepted 01C: 21 additions, 7 changes. All delta entries/hashes match S2. | VERIFIED; HEAD INELIGIBLE as release source |
| Frozen artifact | Accepted blob, original freeze and current copy have identical bytes. | VERIFIED |
| MD/JSON consistency | JSON parses; source identities, order, exclusion set, authority flags and gate descriptions agree with S1; JSON digest agrees. | VERIFIED |
| Automated release enforcement | S1/S2 describe a declarative boundary, not an installed source/migration/deployment guard. No enforcement was created here. | VERIFIED documentary boundary; future enforcement UNKNOWN |
| Runtime/dependency provenance | Accepted `package.json` contains `@vercel/blob: ^2.6.1`; accepted tree has no dependency lockfile. Resolved dependencies, toolchain and deployment artifact are unpinned. | VERIFIED source gap; resulting artifact UNKNOWN |

### B3. Only eligible migrations

| Order | Exact accepted file | SHA-256 | Bytes | Static effect |
| --- | --- | --- | --- | --- |
| M1 | [20261006000100_portal_domains.sql](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000100_portal_domains.sql>) | `f0bdbe5ed8f4f622362c0a6c149bc26644b06552b8a7358b8d792dbfe05a8464` | 23301 | Creates two schemas, 28 Portal tables, relationships/indexes and initial grants/default revokes. |
| M2 | [20261006000200_portal_security.sql](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000200_portal_security.sql>) | `b5afa539f70e34b6c22080a582de22cc484d294b8f368e11e08c141f745184d4` | 10607 | Adds 8 private authorization helpers, RLS and bounded authenticated SELECT grants; no adult table DML grant. |
| M3 | [20261006000300_portal_guards.sql](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000300_portal_guards.sql>) | `8fababc9491321f176fcfbf5196ff44a98a41bd657d263a897f51498837bb486` | 27530 | Adds 15 private routines and integrity, audit, publication, learning, staff, billing and locale guards/triggers. |

Status for every entry: **SOURCE ELIGIBLE; EXECUTION ON HOLD**. Required order: **M1 → M2 → M3**, unchanged accepted bytes. Each file contains one top-level `BEGIN` and one top-level `COMMIT`. No accepted down migration exists.

Expected foundation: **28 tables in `portal`; 23 routines in `portal_private`; no accepted Portal views, product sequences, private generation table/sequence or exposed domain-write RPCs**. Counts are supporting checks only. Definitions, owners, effective privileges, policies, trigger bindings, constraints and indexes must match, including dynamically created policies/triggers/indexes.

### B4. Accepted application boundary

The only Portal runtime behavior eligible for later packaging is S7's protected entry, ordinary adult OTP lifecycle, workspace/context reads and read-only published curriculum delivery:

- Protected `GET /portal` and `/portal/`, rewritten to the protected index handler.
- `POST /api/portal/auth` request/verify/signout; exactly six-digit email OTP, native Auth validation, active server-confirmed adult profile, access-token cookie, refresh-token discard and pending-signout quarantine.
- `GET /api/portal/context` and `/api/portal/curriculum`; adult JWT forwarded under RLS, selected-workspace ACTIVE exact-version entitlements, bounded projections, fresh checks and literal text rendering.
- Accepted A01/A02 continuation reconciliation and private clearing, with no cached private body restored under unresolved authority.
- No completion, status recording, resource delivery/import/publication, staff UI or general domain mutation endpoint is implemented by this accepted runtime. Presence of M1 delivery tables does not change that boundary.

Use S2's full pins for packaging. In particular, later workspace versions of the shared runtime/shell/CSS/client cannot be copied into an accepted-only artifact. Production values for `PORTAL_SUPABASE_URL`, `PORTAL_SUPABASE_PUBLISHABLE_KEY` and `PORTAL_ORIGIN` are UNKNOWN; the ordinary runtime accepts a modern `sb_publishable_` key and has no secret/service-key fallback. `.env.example`'s future secret/commerce names do not authorize using them.

### B5. Explicit exclusions

**Exclude** Sprint 01D implementation and all its added/changed release bytes; M4 `20261008000100_portal_mission_status.sql`; M5 `20261008000200_portal_write_generation.sql`; `/api/portal/progress`; `lib/portal/progress.js`; progress/status controls; both `record_mission_progress` and `record_cohort_delivery` RPCs; `assert_write_session`, generation registry/allocator/claim enforcement and `issue_write_generation` hook activation. No custom access token hook is to be installed or activated for this release.

Also exclude production fixture/bootstrap/seed/test SQL, synthetic Auth records, staff bootstrap, real provisioning, unauthorized schema/policy/owner/grant changes, frozen-document edits, commerce implementation, broader product features, dependencies/builds/deployments/Git publication in this task and automatic continuation after it.

S2's 181-file source inventory includes public-site source, tests and governance documents. It does **not** approve serving those files, executing tests/seeds or deploying every API in the tree. A separate reviewed production payload must preserve approved existing public-site behavior and exclude unneeded source, SQL, tests, local adapters, reports, credentials and diagnostic artifacts. Package transformations or new build controls need separate authorization and review.

## C. Gate-by-gate readiness matrix

The gate IDs retain S1/S2's meanings. Evidence is evaluated for this planning review; closure must be bound to the exact future action, target, source and observation. **G0–G9 are not cleared for production.** S2 also has G10, retained as the cross-cutting operational authorization checkpoint in J; it is not silently removed or renumbered.

| Gate | Evidence now | Operational disposition | Required closure evidence / accountable reviewer |
| --- | --- | --- | --- |
| **G0 — Human review and release scope** | VERIFIED: Human authorized D7.3 planning and named accepted 01C. S1/S2 record D7.2 pending review; separate digest-bound acceptance of those final artifacts is not supplied here. | **BLOCKED for operations**. Planning authority is sufficient for this document only. | Irene accepts reviewed S1/S2/D7.3 identities, exact 01C scope/exclusions and remaining notes. Each next action receives its own explicit authorization. No inferred migration/launch approval. |
| **G1 — Source/input integrity** | VERIFIED: all accepted pins/order/tree and complete HEAD delta reconcile. Accepted runtime differs from HEAD in four application files. Future extraction/runner/artifact not prepared. | **VERIFIED locally; BLOCKED pending action-specific recheck**. | Release engineer and independent reviewer verify accepted source, modes/hashes, reviewed manifest digests, exactly three ordered migration inputs and no 01D/generated overlay/default HEAD fallback. Recheck immediately before each approved use. |
| **G2 — Target/catalog/history/privileges** | SUPPLIED BUT NOT REVERIFIED: PG17.11, query role `postgres`, Portal/ledger absent; Auth structures/helpers/roles reported present. Effective owner, permissions, default ACLs/event triggers, provenance and runtime compatibility UNKNOWN. | **BLOCKED**. Presence/name matching is insufficient. | Designated operator supplies current sanitized metadata, target/time/role/runner identity; database/security reviewer reconciles exact M1–M3 requirements in F1–F2, collisions/other consumers and ledger state. No grant/owner/managed-schema repair by implication. |
| **G3 — Transactions/ledger/maintenance** | VERIFIED: separate explicit file commits and intermediate unguarded states. Chosen runner/version, ledger atomicity, failure/acknowledgement handling and effective fencing UNKNOWN. | **BLOCKED**. | Release engineer demonstrates E's success/fault/disconnect/ledger cases in isolation; operations owner proves API, direct SQL, job/service and automation fencing while preserving unrelated consumers. Numeric timeout/window limits approved from rehearsal evidence. |
| **G4 — RLS/ACLs/guards/API exposure** | VERIFIED: accepted static 28-table/23-routine model and no exposed domain-write RPC. SUPPLIED BUT NOT REVERIFIED: Data API disabled. Actual installed state/exposure/loaded search path UNKNOWN. | **BLOCKED**. Disabled Data API is not a complete maintenance or deployment proof. | Security reviewer approves expected matrix before installation; after separately approved installation, verifies complete final definitions, effective ACLs/RLS/guards and absence of alternate writes. Approved exposure permits only required Portal access; `portal_private` remains unexposed. Native positive/negative proof required. |
| **G5 — OTP/SMTP/Auth policy** | VERIFIED: six-digit accepted client/server and numeric Token template. SUPPLIED BUT NOT REVERIFIED: eight-digit OTP, link template, no custom SMTP and 2 emails/hour. Signup/anonymous/TOTP/consumer compatibility incomplete. | **BLOCKED by supplied configuration**; current actual state UNKNOWN. | Auth/email owner presents approved six-digit numeric template/settings, existing-adult policy, compatible TOTP boundary, sender/recipient/SMTP setup, rate-limit capacity and real bounded delivery/expiry/replay results. Config changes and email tests require separate permission. |
| **G6 — Production URLs/environment/hosting** | VERIFIED: local TOML and accepted rewrites/cookie/header source. SUPPLIED BUT NOT REVERIFIED: localhost:3000 Site URL and empty redirect allowlist. Exact HTTPS origin, environment custody and hosted behavior UNKNOWN. | **BLOCKED**. | Hosting/Auth owners approve exact URLs/redirect purpose, production environment association and F5 criteria; demonstrate actual HTTPS cookies, rewrites, same-origin POST rejection, no-store/CDN behavior and no secret leakage under approved validation. |
| **G7 — Backup/restore/abort custody** | VERIFIED: no accepted down migrations. Backup/PITR availability, coverage, recovery point, restore rehearsal, RPO/RTO and operators UNKNOWN. Free plan is supplied context, not recovery evidence. | **BLOCKED**. | Recovery owner establishes G's recoverable coverage and restore proof, approved recovery objectives/blast radius, stop/abort custody and contingency authorization before any production DDL. |
| **G8 — Compatible rehearsal/hosted validation** | REPORTED BUT NOT RERUN: accepted foundation/Auth/staff/01C and independent A01/A02 results. PG15 local scaffold VERIFIED; representative PG17.11/Auth/PostgREST rehearsal and bounded hosted proof UNKNOWN. | **BLOCKED**. | Separately approved disposable synthetic rehearsal of exact source/runner and H's matrix; independent reproduction and failure controls. Later authorized hosted metadata/read/Auth/browser validation only; no production fixtures/bootstrap or domain writes. |
| **G9 — Packaging/dependency provenance** | VERIFIED: source pins, no accepted lockfile and semver dependency range. Extracted production payload, resolved dependencies/toolchain and deployment output UNKNOWN; no automated exclusion guard demonstrated. | **BLOCKED**. | Release engineer supplies separately approved artifact input/output hashes, source/dependency/toolchain/packaging evidence, route/static-payload inspection and no HEAD/branch fallback. Independent reviewer approves exact deployable artifact and promotion/rollback association. |

### C1. Supplied hosted context carried forward

| Context from S1/S2 and earlier handoffs | Classification and remaining gap |
| --- | --- |
| AIEA Curriculum Platform; main/PRODUCTION; Free/us-east-2/t4g.nano; PG17.11; no replicas; 2 GB provisioned | SUPPLIED BUT NOT REVERIFIED. Exact private target reference, fresh observation timestamp, current limits/load/disk headroom and existing workloads UNKNOWN. “main” here does not make repository HEAD an accepted source. |
| `public` exists, owned by `pg_database_owner`; `portal`/`portal_private` absent; no inspected tables/views/sequences; no expected Portal functions; ledger relation absent; public `rls_auto_enable()` present | SUPPLIED BUT NOT REVERIFIED. Does not establish the whole project is empty, never-attempted SQL, complete absence of equivalents/wrappers, safe event-trigger effects or effective privileges. Absent ledger differs from an empty existing ledger. |
| Managed Auth structures/helpers/roles reported present; no hook; Data API disabled | SUPPLIED BUT NOT REVERIFIED. Original complete sanitized results, exact types/ACLs/ownership/RLS, Auth/PostgREST versions, existing consumers and actual loaded configuration UNKNOWN. |
| Email enabled; OTP eight digits/3600 seconds; link template; no custom SMTP; 2 emails/hour; Site URL localhost:3000; redirects empty | SUPPLIED BUT NOT REVERIFIED. Conflicts with accepted six-digit/numeric-template and production SMTP/URL prerequisites. Actual current configuration/delivery UNKNOWN. |
| JWT lifetime 3600 seconds; refresh replay detection enabled; reuse interval 10 seconds | SUPPLIED BUT NOT REVERIFIED. Does not prove current-session assurance, global signout invalidation, refresh-chain cascade or hosted token/cookie compatibility. |

### C2. Remaining blockers beyond source reconciliation

Every gate closure gap above is a blocker to its dependent action. Additional launch prerequisites remain: approved existing adult/profile/membership/workspace/content/entitlement availability; a governed real-data provisioning and publication process; frozen Section R commerce requirements **before any Portal entitlement authorizes access**; staff enrollment/recovery/first-grant custody for any privileged operations; resource/privacy/deletion controls and an approved retention-duration policy before broader launch. Their production readiness is **UNKNOWN**. Empty-table installation supplies none of them.

Do not interpret the historically closed implementation findings as new open code defects. The accepted five NOTES stay OPEN with their original classification; operational gates can remain blocked without changing those audit classifications. See F6.

## D. Dependency-ordered verification sequence

Every step is proposed future work requiring J's authorization. This task performs only local reading/static reconciliation and creates this document. Evidence records must identify gate/subcheck, target/environment, source/manifest digest, runner/artifact version, observation time, operator/reviewer, expected versus actual result, completeness, sanitized error and decision. Recheck evidence after any relevant source, role, provider/runtime/configuration or workload change; Irene approves its freshness window rather than assuming an arbitrary duration.

| Sequence | Required work and dependency | Output / next eligible decision |
| --- | --- | --- |
| **D0** | Human review of this plan and accepted-only source/exclusions. | G0 scope disposition and explicit authorization for a narrowly defined next local preparation or metadata review. STOP after this task. |
| **D1** | Prepare/review an accepted-only metadata interpretation packet without altering S3–S5. Map existing safe query labels to M1–M3, identify extra drift checks and remove M4/M5/hook acceptance assumptions. | Reviewable G2 evidence checklist; no SQL execution or provider permission implied. Recommended next step in K. |
| **D2** | After separate metadata-only authorization, designated Human operator collects fresh target/catalog/history/Auth types/roles/defaults/event-trigger/configuration facts and existing-consumer/writer/recovery inventory. | Complete sanitized results with UNKNOWNs; choose initial-install versus drift reconciliation. No automatic mutation. |
| **D3** | Review G2 and scope exact ownership/runner, timeout proposals, fences, recovery coverage, compatible isolated environment and synthetic validation matrix. Resolve gaps by proposals, never ad hoc grants/schema changes. | Irene can authorize isolated rehearsal and local source/runner preparation. Unresolved prerequisites block production execution. |
| **D4** | Under isolated-only authorization, verify/extract exact S7 input, prove three-file rejection guards and run E/H rehearsal, including failures, uncertain acknowledgements, ledger mismatches, provider ACL/event-trigger effects and recovery. | G1/G2/G3/G7/G8-pre evidence; independent review. No production data/credentials or hook/M4/M5. |
| **D5** | Assemble concrete fenced-production installation package: exact target/owner/runner/hash set, prerequisite results, recovery point, fence/abort owners, permitted metadata checks and contingency scope. Refresh G2 immediately before the window. | Human migration/fencing authorization may cover exactly M1–M3; it does not cover Auth changes, exposure, application deployment or launch. |
| **D6** | After explicit authorization, prove recovery point/fencing, apply M1→M2→M3 and reconcile each commit/ledger. Stop on any uncertainty. Compare final state while fenced. | G4-post catalog/ACL/guard evidence and truthful ledger; database remains fenced pending later decisions. |
| **D7** | Separately prepare/review exact OTP/SMTP/Auth/HTTPS environment changes, existing-consumer impact, bounded validation access and deployable artifact. Approved isolated builds/tests can establish G5/G6/G9 prerequisites. | Separate configuration/exposure/hosted-test/deployment decisions with reviewable settings diffs and artifact digest. No custom access-token hook. |
| **D8** | Under exact scoped approvals, apply approved settings and deploy/promote only the approved artifact; permit necessary Portal API access for bounded validation, keep public Portal access controlled, retain direct-writer fence. Execute only approved hosted checks. | G4/G5/G6/G8-post/G9 evidence and independent final review. A temporary API availability change is itself an exposure decision, not an automatic test prerequisite. |
| **D9** | Present all action-specific gate closures, notes, real-data/commerce/privacy prerequisites, monitoring/abort custody and accepted artifact association. | Irene may separately authorize release scope. If positive hosted delivery cannot be demonstrated without unapproved provisioning, launch remains ON HOLD. |

G4's **expected-state design and isolated proof** precede production migration; G4's **actual final hosted comparison** follows it. G8 similarly separates rehearsal from later hosted validation. This prevents requiring nonexistent post-install objects as proof before an initial installation, while preserving a separate release gate. G5/G6 and the application part of G9 need not be implemented to install a separately approved, fully fenced foundation; they remain mandatory before their dependent exposure/deployment/use. Exact migration-package provenance is required before D6 regardless.

S5 contains **23 labeled metadata SELECT results** in five proposed batches (4+6+5+4+4) and D1–D9 operator checks. No complete execution-output bundle is present in the inspected handoffs. Future use must retain read-only wrappers, absence-safe catalog checks, fixed metadata/configuration allowlists, all result labels and completeness. A missing/error/denied grid is UNKNOWN, never proof of absence. Name-only scans cannot exclude renamed/dynamic/external wrappers; supplement with the operator's inventory.

For this baseline, account flags and `sessions.refreshed_at`, session FK uniqueness, managed-session row-lock UPDATE rights, forced-RLS generation-owner access and hook issuance semantics are **not M1–M3 installation requirements**. They may remain contextual metadata or excluded-object drift checks. They cannot trigger unapproved grants or require installing M4/M5. S5's old five-file approval/activation instructions must not be followed.

## E. Future migration safety procedure

**This is a proposed future procedure, not an executable runbook or permission to run SQL.** No migration command, runner, guard script or ledger implementation is supplied or installed by D7.3.

### E1. Input, runner and target controls

1. Select one reviewed, version-pinned runner with secure operator-controlled target selection and logs. A normal Supabase migration runner is a candidate only after its exact version/behavior is proven; a custom or `psql` alternative requires its own reviewed error/ledger/recovery design. No emergency fallback to Dashboard paste or an unrehearsed tool.
2. Prepare source from S7 in a separately authorized isolated location. Verify S2's full inventory, modes/hashes and final reviewed manifest digests. Build the migration input directory from **exactly the three B3 paths**, once each, in timestamp/order M1→M2→M3. Reject missing, duplicate, renamed, reordered, extra or hash/mode-mismatched inputs.
3. Prove no default directory, branch integration, generated overlay, alternate path or provider discovery step can pull in current HEAD, M4/M5, seeds/tests/bootstrap or unrelated migrations. A flag labelled “dry run” is not proof of read-only behavior; inspect version-specific side effects before approving its use.
4. Bind exact target reference/environment/database, session/effective owner, runner/version and source to the signed execution package. A database named `postgres`, role `postgres`, engine version or project display name alone is not unique target proof. Never put credentials, connection strings, keys or JWTs into the plan/evidence logs.
5. Set reviewed error-stop behavior, lock/statement/idle limits, expected duration bounds and monitoring/abort thresholds from rehearsal. Values are **UNKNOWN until approved**. No unattended retry or continuation after a failed/ambiguous file. Serialize releases and establish competing-runner exclusion; a ledger table alone is not a release lock.

### E2. Atomicity and ledger prerequisites

The accepted files have internal transaction control. **Do not claim an outer transaction or single-transaction option makes the unchanged three-file batch atomic.** Removing transaction commands, concatenating/squashing or otherwise repackaging SQL changes accepted execution semantics and requires separate review/authority; it is excluded from this procedure.

The intended guarantee is that each file's own DDL/ACL/policy/trigger changes commit together **as demonstrated with the chosen runner/environment**. Ledger recording may occur outside that file commit. The actual guarantee is currently UNKNOWN. Rehearsal must establish file-boundary behavior, DDL event-trigger effects, error-stop behavior and whether commit and ledger bookkeeping can diverge.

| Reconciled state before execution/retry | Required disposition |
| --- | --- |
| Both Portal schemas/objects absent; ledger absent or empty with reconciled provenance | Initial-application candidate for M1–M3 only. Ledger absence is not permission to pre-mark anything. Runner-owned ledger initialization must be separately included in the approved package. |
| Portal objects exist; ledger absent/empty | STOP automatic installation; compare exact definitions/owners/ACLs/RLS/guards/dependencies and prior attempts. No blind replay, drop or history repair. |
| Ledger entries exist; expected objects absent/different | STOP inconsistent history. A version/timestamp is not a checksum or installation proof. |
| Exact earlier M1/M2 state and truthful ledger exist after a known failed attempt | Remains fenced. Human reviews recovery package and identifies the first genuinely pending file; resume only within explicit contingency authorization or new approval. |
| Any excluded object/write RPC/generation/hook, partial file state, unexplained wrapper or drift | STOP accepted-only premise; separately reconcile. Do not install M4/M5, drop objects or alter history to force conformity. |
| Commit acknowledgement or ledger update uncertain | STOP; reconcile actual catalog and ledger before deciding. Neither rollback nor success may be presumed from a disconnected client. |

A future normal ledger must record only successfully applied versions `20261006000100`, `20261006000200`, `20261006000300`, in order and once, with an external execution record binding their exact hashes/runner/target. Inspect the selected ledger format and semantics; do not assume it stores source checksums or has the same transaction boundary as the SQL. No “mark applied” or deletion/reversion of history as a substitute for installation/rollback.

Rehearse failure before commit, commit-time failure, interruption before/after acknowledgement, ledger-write failure, duplicate/pending discovery, concurrent-runner rejection and reconnect reconciliation. Faults/injections occur only in an approved disposable environment and never by editing accepted production migration bytes. Retain every intermediate result and prove the system cannot continue to later files or exposure on uncertainty.

### E3. Recovery point and maintenance before M1

Require G7 evidence and the exact fresh recovery point before mutation. Then establish and demonstrate the **approved** maintenance controls across every access path:

- Portal entry/application deployment and direct Data API access remain unavailable to unapproved callers. `portal_private` is never exposed. Supplied Data API-disabled state must be rechecked, including actual loaded schemas/search path and future changes.
- Pause/fence Portal direct SQL writers, service clients, jobs, privileged integrations and release automation; inventory alternate/public wrappers and overloads. Owner/service authority can bypass ordinary RLS, so an application maintenance page or browser DML denial is insufficient.
- Preserve unrelated Auth/API/commerce/Storage workloads under a reviewed dependency plan. If the only available fence would disrupt them, STOP for a concrete Human-approved maintenance proposal.
- Rehearsal proves denied access at each intermediate state. Any production fence probe must be separately approved and non-mutating within its scope; do not try production inserts/deletes “just to see whether denied.”
- Record named fence owner, migration operator, abort authority and independent observer; evidence of writer quiescence and competing-release exclusion; start/end timestamps and reversal custody. Reprove after any configuration change. Fence duration covers partial failure, recovery and all post-install review.

### E4. Ordered execution after separate authorization

| Stage | Future required evidence before continuing | Intermediate risk retained under fence |
| --- | --- | --- |
| **Before M1** | Fresh G1/G2 checks, ledger/catalog reconciliation, G3/G7/G8-pre evidence, approved window/owner/runner/recovery scope, effective maintenance. | No production mutation until every prerequisite for this stage is satisfied. |
| **Apply M1** | Confirm successful file commit, exact schemas/28 tables/relationships/initial ACLs/defaults/owners and truthful M1 ledger entry. | M2 RLS not yet installed by accepted SQL. Effective default/custom grants or privileged writers could expose unguarded tables. Event-trigger RLS is not assumed to substitute. |
| **Apply M2** | Confirm file commit, 8 exact helpers, RLS on all 28 tables, expected SELECT policies/grants, explicit ordinary DML denial, routine ACLs/owners/search paths and M2 ledger entry. | M3's full audit/integrity guards remain pending; service DML exists. Keep every writer fenced. |
| **Apply M3** | Confirm file commit, final 23 private routines, all guard/audit/touch/constraint-trigger bindings, final ACLs/search paths, exact indexes/constraints and M3 ledger entry. | Installed foundation remains unproven for hosted native behavior and unavailable for unapproved production use. |
| **Final fenced review** | Reconcile full definitions and effective privileges, not just counts; exactly three truthful migration records; no 01D write/hook/state or alternate mutation surface; safe actual exposure and unchanged unrelated objects/configuration. | No API opening, Auth setting change, application deployment, provisioning or launch follows automatically. |

After any failure or unknown outcome: stop the runner, preserve maintenance and sanitized logs, determine open transaction/actual commit state using approved methods, invoke only the approved abort/contingency scope and return the discrepancy to Irene. Earlier committed files may survive. Do not advance merely because a later file parses, and do not retry because a file is labelled a migration.

## F. Security and Auth readiness requirements

### F1. PostgreSQL roles, ownership, privileges and DDL effects

**Required future evidence, currently UNKNOWN:**

| Area | M1–M3-specific prerequisite and acceptance boundary |
| --- | --- |
| Effective identity/ownership | Record session/effective runner role and resulting schema/table/routine owners. Migrations do not explicitly assign owners; definer behavior and default ACLs depend on the executor. Do not assume hosted `postgres` is an unrestricted superuser or matches the prior query role. No ordinary caller may assume owner/trusted Auth/bypass-RLS authority. |
| Creation/FK/languages | Demonstrate intended owner can CREATE schemas/objects, use SQL/PLpgSQL, reference managed `auth.users(id)` and create accepted internal FKs/indexes/triggers/routines. Verify usable UUID FK target uniqueness/type, `auth` USAGE, helper EXECUTE and actual UUID resolution/search path. M1 contains no extension installation; no automatic extension install. |
| Definer/trigger access | Justify owner access to Portal tables/audit writes and managed Auth columns read by M2/M3. Rehearse owner/RLS interactions and real trigger execution. Preserve accepted SECURITY DEFINER/INVOKER flags and empty routine search paths; trusted request context, not arbitrary SQL-set claims, supplies Auth identity. |
| Locks | M3 locks Portal parent rows to serialize publication/content, billing/entitlement and assessment response changes. Verify necessary Portal privileges, lock order/visibility and timeouts in isolation. M1–M3 do **not** use M4/M5's managed-session `FOR UPDATE` or generation registry; do not demand managed-session UPDATE grants for an excluded hook. |
| Role inheritance/defaults | Inspect ordinary/trusted API roles, recursive memberships/SET options, database and schema ACLs, global plus schema-specific defaults and custom grantees. Accepted revokes name PUBLIC/anon/authenticated; unexplained custom grants may survive. No schema-local revoke is assumed to erase additive/global defaults. Verify final effective table/column/function rights. |
| Event triggers | Reconcile existing `public.rls_auto_enable()` owner/provenance/attachments/enabled modes/command tags and privately reviewed behavior. Metadata names/flags do not establish harmless effects. Do not execute, replace or disable it in this task or as an unapproved repair. Rehearse relevant provider DDL behavior. |
| Managed objects | Do not alter Auth definitions, ownership, RLS or policy to make migrations work. Review lifecycle impact of new `auth.users` FKs: RESTRICT profile/staff references and SET NULL historical actors. Any incompatible provider state requires a separate proposal, not broadened grants. |

Roles named by accepted SQL are `anon`, `authenticated`, `service_role` plus PUBLIC; managed Auth/API identities such as `authenticator`/`supabase_auth_admin` remain relevant to exposure and trust review. Presence of those provider roles does not require adding any hook-specific grant. Ordinary adult runtime uses no service credential. M2 grants service_role SELECT/INSERT/UPDATE/DELETE on Portal domains, then removes direct audit INSERT/UPDATE/DELETE; service custody and fencing remain necessary because browser RLS is not a universal service-write control.

### F2. Managed Supabase Auth compatibility

Verify actual managed structure/types, helper identities, runtime versions and semantics without exporting personal rows or secrets:

- M1 FK target: `auth.users.id` UUID, usable immediate unique key and authorized REFERENCES.
- M2 current staff assurance: `auth.sessions.id`, `user_id`, `aal`, `not_after`, `factor_id`; `auth.mfa_factors.id`, `user_id`, `factor_type`, `status`. Verify compatible UUID/timestamp/AAL representations, `aal2`, `totp`, `verified`, matching session/factor/user relationships and owner SELECT rights.
- M3 actor-deletion exceptions read `auth.users.id`; do not treat nested FK-only nulling as ordinary actor/provenance override.
- `auth.uid()` must resolve to UUID and `auth.jwt()` to JSONB; preserve empty definer search paths and qualify trusted objects. The signed Auth/PostgREST request context and corresponding cryptographic validation must be proven in native rehearsal.
- Portal runtime needs compatible OTP request/verify, `/auth/v1/user`, local logout, JWT issuer/audience/role/subject/expiry/non-anonymous flags and error/rate-limit behavior. Local claim decoding performs shape/expiry checks, not authentication; native `/user` validation plus active adult profile is required.
- Verify active service versions/configuration and existing Auth consumers. Hosted PG17.11 metadata and the local PG15 TOML do not identify Auth/PostgREST versions or prove equivalent runtime behavior. Resolve differences through representative rehearsal/provider evidence, never fake managed Auth tables in production.

The earlier preflight's `users.is_anonymous/deleted_at/banned_until`, `sessions.refreshed_at`, session FK and lock/hook requirements partly support excluded M4/M5. Keep extra observations attributed as context/drift checks; do not convert them into new baseline code, grants, forced-RLS registry requirements or a hook prerequisite.

### F3. HR01, HR02, staff assurance and frozen constraints

**HR01 is preserved:** any future completion requires explicit adult attestation, no required evidence and idempotency. This release implements **no completion capability**. A mission-text read, existing progress table or cohort delivery cannot imply individual completion or collect mandatory evidence. No production completion/attestation fixture is authorized.

**HR02 is preserved:** every protected write requires a live/current managed Auth session. The accepted 01C runtime exposes **no Portal domain-write endpoint**; accepted read policies/learning triggers must not be advertised as universal current-session validation for all writes. Do not reopen direct SQL/service/jobs, add write RPCs or use M4/M5/hook to make that claim. Existing request/verify/signout are the accepted managed-Auth lifecycle; validate those separately. If any planned protected domain write cannot meet HR02, STOP for a separately authorized design rather than weakening it.

**Staff assurance is preserved:** active adult profile; exact active `staff_authorization` and required capability; cryptographically validated JWT `aal2` with TOTP AMR; exact current managed session for the same adult, unexpired `not_after` if set and managed `aal2`; bound same-user verified TOTP factor; independently validated target/action and audit provenance. M2/M3 source checks these conditions for accepted guarded privileged operations. Historical results are REPORTED BUT NOT RERUN; native hosted compatibility remains UNKNOWN. JWT `aal2` alone, another session's factor, phone-only MFA, email/domain possession or Dashboard MFA cannot supply Portal staff authority. First grant/enrollment/recovery remains separately controlled and excluded from this installation.

Preserve S6's adult-only authority, child references without Auth accounts, active workspace/membership, teacher-to-cohort and learner-to-cohort intersection for learner data, exact-version entitlement, no browser actor/role overrides or service credentials, immutable published curriculum, deterministic approved locale fallback, separated cohort delivery/individual history, append-only audit and controlled deletion. An entitled teacher's curriculum read does not require a cohort assignment in 01C; that does not authorize school-wide learner reads. Do not silently change this accepted distinction.

S6 Sections M/N/R require account-before-checkout, trusted correlation/payment truth, atomic durable event/billing/entitlement/audit processing, refund/dispute policy, idempotency and separation from legacy download authorization. S6 Q/T preserve retention/privacy/launch gates. Installing tables/guards is not implementing these workflows; no production entitlement or fixture may bypass them. Deferred features and architecture amendments remain unauthorized.

### F4. RLS, ACL and API exposure

Before exposure, independently compare all 28 tables and 23 routine signatures/definitions, owners, SECURITY flags/search paths, constraints/indexes, static/dynamic policies/triggers and effective grants. Verify RLS enabled on all product tables; exact authenticated SELECT policies; no anon access or ordinary INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER authority; no browser raw billing/Stripe/staff/audit access; entitlement SELECT limited to `id,workspace_id,program_version_id,status,created_at,updated_at`. Test broader column/projection requests deny in isolation.

Authenticated private-schema USAGE and EXECUTE on exactly the seven accepted read authorization helpers are policy dependencies, **not Data API exposure**. `staff_has` and M3 guard/audit/locale routines must retain accepted ordinary-role denial. `resolve_locale`'s accepted service EXECUTE does not authorize exposing private routines. Review inherited/custom ACLs rather than assuming named revokes close every path.

Keep `portal_private` outside actual exposed schemas permanently. Approve only the required `portal` exposure, authenticated reads, row limits and loaded search path/configuration, preserving unrelated consumers. No generic custom-schema broad-grant recipe. Confirm no view, overload, public wrapper, security-definer gateway or fallback opens domain writes. Even absent M4/M5 files, unexpected hosted write surfaces block this release.

Use native positive and negative cases: adult self/profile; family and school workspace boundaries; assigned-teacher learner/cohort limits; owner/admin limits; exact-version ACTIVE versus SUSPENDED/REVOKED entitlements; published/retired access; locale rules; private-schema denial. Positive controls prevent universal denial from being mislabelled secure success. GETs must cause no progress/domain audit mutation; permitted Auth infrastructure activity is distinct from Portal domain mutation.

### F5. OTP, SMTP, URLs and secure cookies

| Requirement | Future verification and approval criterion |
| --- | --- |
| OTP contract/template | Configure/review exactly six-digit OTP compatible with unchanged client/server and the accepted numeric `{{ .Token }}` template. Do not broaden code to eight digits or add magic-link callback handling under this plan. Approve expiry/request intervals and test successful single use, wrong length, wrong/replayed/expired code and sanitized 429 behavior in isolation, followed by bounded authorized delivery. |
| Adult-only policy | Preserve `create_user:false`, no implicit Portal signup, no child/anonymous authority, native server-confirmed adult profile and unknown-account non-enumerating response. Verify actual signup/email/anonymous settings and other consumers before any project-wide change; do not copy local TOML wholesale. Adult confirmation is not age verification. |
| SMTP readiness | Approved transactional SMTP provider/sender, credential custody, domain authentication/deliverability, permitted recipients, quotas/rate limits, failure/monitoring owner and recovery. Actual delivered numeric email and successful verification are required; configured/not-configured screenshots alone are insufficient. Supplied 2/hour limit requires capacity reconciliation. No credentials or message tokens in shared evidence. |
| URLs/redirect policy | Irene approves exact HTTPS Portal origin, Supabase project origin, Site URL and necessary redirects by purpose/environment. Accepted OTP requires no new magic-link callback; local TOML callback is not an implemented product route. Review existing consumers before modifying redirects; no wildcard additions or invented production URLs. Exact-path-only provider callback behavior remains unproven unless specifically demonstrated. |
| Runtime environment | Securely associate the three accepted variables with the exact production deployment/environment; valid root origins with no credentials/path/query/hash; modern publishable key; no secret fallback or public secret injection. Explicitly reject production loopback/local cookie mode. Values/custody/association remain UNKNOWN until operator evidence. |
| Cookies/session | Actual HTTPS must issue host-only `__Host-aiea_portal` and logout-quarantine cookie with `Secure`, `HttpOnly`, `Path=/`, `SameSite=Lax`, no Domain and expiry-bounded Max-Age. Confirm platform header handling, duplicate/malformed cookie denial, token size ≤3800 characters and claim expansion compatibility. Refresh tokens are discarded, never returned/stored in browser or cache. No cookie values in logs/screenshots. |
| Origin/cache/hosting | Prove exact same-origin JSON POST enforcement and cross-site rejection; protected rewrites for both Portal entry forms; API method bounds; sanitized failure; actual CSP/no-referrer/noindex/no-store and Vary behavior across CDN/cache/browser lifecycle. No private/token payload in static shell or shared cache. Replayed pending-signout, network failure, multiple tabs, hide/blur/focus/expiry and A01/A02 automatic continuation retain accepted clearing/reauthorization. |
| Availability/capacity | Approve acceptable Auth/Data API/deployment error/latency, mail throughput, DB load/locks/disk limits and abort thresholds using representative evidence. Measure within approved scope; supplied plan/instance size is not capacity proof. No assumed provider SLA or guessed timeout value. |

### F6. Five retained NOTES — unchanged

| ID | Preserved classification and meaning | Release treatment |
| --- | --- | --- |
| 01B-A03 | **NOTE — OPEN**: hosted routing/CDN/HTTPS-cookie assurance unproven. | G6 requires actual approved hosted evidence; this plan does not close it. |
| SNV02 | **NOTE — OPEN**: deprecated local inbucket configuration. | Do not copy it into production. It is not evidence that hosted SMTP works or fails. |
| SNV04 | **NOTE — OPEN**: global refresh-chain cascade invalidation unproven. | No global invalidation claim; ordinary runtime discards refresh tokens. Preserve limitation for Human review. |
| SNV05 | **NOTE — OPEN**: exact-path-only callback guarantees unproven. | Review real redirect requirements and provider behavior; no new callback route assumed. |
| SNV06 | **NOTE — OPEN**: ordinary stateless Data API may accept an unexpired signed-out JWT. | Preserve distinction between stateless reads, Portal Auth validation/quarantine and current staff checks. No hook/M4/M5 or undocumented policy change to conceal it. |

Historical A01/A02 and SNV01/SNV03 closure are retained as documentary dispositions. D7.3 reruns none of their tests and changes no note severity/status. Irene must review the bounded limitations for the exact future use; an operational decision cannot claim a stronger security guarantee than the accepted source supplies.

## G. Rollback and recovery requirements

**Recovery readiness is UNKNOWN and blocks production DDL.** No accepted down migrations exist. A runner rollback cannot reverse earlier committed files, configuration changes, sent email or deployments. Migration-history repair is not rollback.

Before production approval, recovery owner must provide:

- A usable backup/recovery point and verified coverage of Portal/public/other database schemas, ledger, roles/ACL/defaults, managed Auth users/session/factor dependencies and provider-supported restore boundaries. Confirm actual plan/backup/PITR capability; supplied Free plan does not prove availability or absence.
- Separate recovery custody for provider Auth/API/SMTP/URL settings, environment values, deployment artifact/routing and relevant external Blob/Storage assets. A database backup alone does not establish project recovery. Keep sensitive captures in secure operator custody; sanitized evidence only in handoffs.
- Demonstrated isolated restore and post-restore catalog/ledger/ACL/Auth validation, with approved recovery point objective (RPO), recovery time objective (RTO), downtime/data-loss bounds and unrelated-workload impact. Values and proof remain UNKNOWN.
- Named migration/maintenance/abort/recovery operators and decision owner, access availability, stop/escalation channel, approved contingency scope and dependency-aware forward-recovery plan. No unapproved destructive action merely because the deployment window is expiring.
- A restore/session strategy that reconciles managed Auth state with unexpired JWTs and staff assurance, preserving HR02/no-domain-write boundary and open SNV04/SNV06 limitations. Do not assume restore or signout globally invalidates every token. Unexpected generation/hook state is excluded drift requiring STOP; this release does not implement generation recovery.
- Evidence retention and a reconciliation plan for unrelated transactions after the backup point, audit/learning/billing history and any external side effect. Do not fabricate/delete audit or ledger evidence to make an attempt appear successful.

| Failure point | Required future response under approved custody |
| --- | --- |
| Before a file commits | Stop; determine transaction/rollback status, catalog and ledger. Verify earlier committed files remain fenced. |
| M1 committed, M2 fails | Preserve fence: accepted RLS installation incomplete. Diagnose/rehearse approved forward recovery; no API opening or broad grant workaround. |
| M2 committed, M3 fails | Preserve fence: full guards/audit incomplete despite RLS. Diagnose/rehearse approved forward recovery; no privileged writer reopening. |
| Commit/ledger outcome ambiguous | Inspect actual state under authorized read-only reconciliation; classify catalog versus ledger separately. No blind retry, pre-marking or guessed history deletion. |
| Final definitions/ACLs/exposure differ | Preserve maintenance; return discrepancy and source/provider impact to Irene. No automatic schema/policy/owner/role/event-trigger repair. |
| Auth/SMTP/URL configuration breaks existing consumers | Within separately approved contingency, restore the recorded prior settings and verify continuity. No new hook activation or unrelated setting changes. |
| Wrong application artifact/routing/cache behavior | Keep Portal unavailable and restore/promote only a previously reviewed compatible artifact under deployment-recovery authorization. Reconcile its DB/config association. Application rollback does not undo M1–M3. |
| Data appeared or unrelated writes continued | STOP destructive reversal; preserve evidence and prepare a forward repair/data-aware recovery proposal. Whole-project restore may discard unrelated transactions and needs explicit approval. |

No remote reset, schema drop/CASCADE, synthetic fixture/bootstrap, seed, Auth deletion, broad grant, policy weakening or migration-history repair is a routine shortcut. Any required correction/reversal needs a concrete independently reviewed package and explicit Human authorization. Even an apparently empty Portal does not justify deleting managed/unrelated data.

## H. Independent validation requirements

The present review independently reconciles local source identities and SQL/runtime text against the D7.2 assertions. It is **not an independently rerun behavioral audit or a second-person operational signoff**. Future reviewer must be distinct from the release operator/implementer and inspect raw sanitized evidence, expected failures and positive controls rather than accepting an implementation summary.

### H1. Isolated synthetic rehearsal — separate authorization required

Use a disposable environment with no production credentials/customer records and no linkage/deploy path to production. Represent hosted PG17.11 and actual managed Auth/PostgREST semantics, owner/default ACL/event-trigger effects and exact selected runner. If exact versions are unavailable, document differences and justify coverage; unresolved material differences leave G8 BLOCKED. PGlite/mock Auth alone cannot establish managed native behavior.

| Validation area | Required independent evidence |
| --- | --- |
| Source rejection | Accepted full-tree/migration input identity; rejection of M4/M5, extra/renamed/duplicate/missing/hash-mismatched files, HEAD overlays and default-branch fallbacks without mutation. |
| Ordered installation/ledger | M1→M2→M3 success; exact final definitions/ACL/owners/RLS/guards; truthful ledger; every E2 fault/disconnect/partial-commit case; competing-runner rejection and recovery from each known boundary. |
| Privileges/fencing | Effective owner/FK/helper/Portal-lock rights; inheritance/default/custom grant effects; event-trigger behavior; actual denial before/between/after files for unapproved API/direct/service/job paths. Failures cannot be “fixed” through unrehearsed grants. |
| Native foundation/security | Accepted integrity/RLS/audit/immutability/entitlement-column regressions with active/inactive/revoked profiles, memberships, assignments and exact-version entitlements; cross-tenant/cohort, metadata/actor forgery and anon/adult DML denial. Confirm positive permitted reads. |
| Native Auth/staff | Existing-adult OTP, implicit signup/anonymous denial, replay/expiry/tamper/logout; current exact-session verified TOTP/capability positive controls; no staff grant, old aal1, phone-only/malformed claims, factor removal/downgrade, missing/expired session and another-session assurance denial. No production bootstrap. |
| Accepted 01C lifecycle | Auth/context/curriculum handler/client/native browser cases; selected-workspace intersection, versions/locales, retired entitlement, bounded projections/text/no writes; private clearing and stale-response cancellation; A01 fresh reading-route continuation and A02 final role/catalog reconciliation; pending-signout/cross-adult controls. |
| Negative-control validity | Preserve historical failed-source controls separately in isolation, never package them. Show the relevant regressions fail for the old defective behavior and pass for exact accepted source; universal denial is not security proof. |
| Recovery/hosting | Restore/forward-recovery drills, compatible deployable payload/route proof, actual HTTPS/header/cookie behavior in approved test hosting and reviewed provider-setting rollback. Record evidence limits. |

Use only accepted test sources applicable to 01C and reviewed isolated harness adaptations. M4/M5/progress/write-generation/hook tests are excluded. Historical counts in S8/S10 remain REPORTED BUT NOT RERUN in D7.3; do not count them as new passes, combine parent/leaf counts into inflated totals or import 01D's 605 HR03 results as accepted-only proof.

### H2. Bounded hosted validation — later explicit authorization required

Define exact target/operator, approved existing adult accounts, permitted metadata/read/Auth/browser cases, recipient policy, rate limits, data handling and rollback scope. Do not run repository native fixture scripts, mutating assertions, bootstrap, seed, staff grants, publication, entitlement creation or domain DML probes in production. Read-only SQL wrappers do not make arbitrary functions, sequences or side-effecting tests safe.

Required hosted evidence after approved installation/configuration/deployment:

1. Complete final catalog/definition/owner/ACL/RLS/trigger/constraint/index and three-entry ledger comparison while fenced; source hashes bound to the attempt; no excluded objects/alternate writes or unintended unrelated changes.
2. Actual loaded Data API/exposed-schema/search-path state; private-schema exclusion; expected role/column/method bounds. Destructive/adversarial mutation attempts remain isolated unless separately proposed and explicitly authorized.
3. Delivered numeric OTP and successful one-time verification for approved existing adult access, expiry/replay/rate-limit behavior within scope and existing-consumer continuity. Emails/logout/session creation are side effects and need explicit test authorization.
4. Protected HTTPS entry/context/curriculum and no-write behavior, secure cookies/no-store/CDN/same-origin checks and accepted clearing/reauthorization. Approved missing-profile/entitlement cases must deny safely. Do not access customer data to invent positive controls.
5. Positive staff/curriculum/tenant proofs only where pre-existing authorized records and permitted observations exist. Staff mutations/factor-management/publication stay in isolation or a separately approved scope. Empty tables establish fail-closed denial, not successful real delivery.
6. Independently reviewed availability, fence recovery, abort custody, artifact/environment association and all unresolved observations. Report each case VERIFIED only when current evidence actually supports it; preserve UNKNOWN and REPORTED labels elsewhere.

If required positive hosted validation lacks adult profiles, memberships, lawful entitlements, published content or staff setup, record **BLOCKED: governed provisioning/validation scope absent**. Do not seed a production “test” workspace or bypass S6 Section R. Return to Irene for a separate scope decision; installation can remain fenced.

### H3. Deployment packaging and provenance

Before any deployment permission, provide a reviewable artifact with:

- Exact accepted source commit/tree and S2 source pin checks; source origin/extraction evidence; original modes/bytes preserved. D7.2/D7.3 review documents remain outside the production payload.
- Separate allowlists for migration inputs, server runtime and public static payload. Inventory every callable API and served file; preserve approved public-site behavior while proving no 01D endpoints/shared-file versions, source/tests/SQL/local adapter/debug payload, credential or generated private data enters.
- Actual dependency resolution with versions/integrity/source, runtime/toolchain/package-manager/platform versions, build/package settings and input/output hashes. No accepted lockfile exists; future resolution/lock/tooling additions require separate approval. Do not call source hash verification a reproducible build.
- Demonstrated build/promotion source selection with automatic deployment disabled or explicitly controlled; no default HEAD/branch fallback, ambient checkout overlay, unrelated generated content or unreviewed provider cache affecting the payload.
- Exact deployment ID/artifact digest, production environment/URL/route configuration association, reviewed settings diff, credential custody without credential values, independent approval and compatible rollback artifact. Rebuilding after approval requires fresh provenance/review unless an approved process proves identical output.

No artifact was extracted/built, dependency installed, provider project inspected or deployment performed in D7.3. G9 remains UNKNOWN/BLOCKED beyond local source pins.

## I. Precise STOP conditions

The operator/reviewer must STOP the dependent action, retain the effective fence, preserve sanitized evidence and return to Irene on any condition below. Recovery writes occur only within a previously explicit contingency scope or after a new decision.

| STOP ID | Trigger |
| --- | --- |
| **STOP-01 — authority/scope** | No explicit approval for the particular next action; approval names only planning/review; target/source/runner/artifact/configuration scope absent; automatic continuation proposed. |
| **STOP-02 — source/artifact mismatch** | Any commit/tree/path/mode/byte/hash/manifest digest mismatch; extra/missing/duplicate/renamed/reordered migration; HEAD/01D/M4/M5/hook/test/fixture overlay or default fallback; payload/dependency provenance incomplete. |
| **STOP-03 — wrong/stale/incomplete target evidence** | Exact project/environment/database/operator/owner uncertain; permission error mistaken for absence; missing/truncated result grid; relevant changes between observations; freshness or query coverage cannot be established. |
| **STOP-04 — catalog/history drift** | Unexpected Portal objects/ledger/excluded state/wrapper, unexplained manual application/removal, partial definitions or objects/history disagreement; proposed pre-marking, repair or replay without reconciliation. |
| **STOP-05 — privilege/provider incompatibility** | Missing creation/FK/helper/owner rights; incompatible Auth type/helper/version/semantics; shadow UUID resolution; unsafe inherited/default/custom grants; ordinary trusted-role escalation; unexplained event-trigger effects; managed-schema/owner/policy change needed. |
| **STOP-06 — transactions/runner uncertainty** | Unrehearsed runner/version/ledger semantics; error or timeout; commit/ledger acknowledgement unknown; unexpected continuation or transaction boundary; concurrent release; numeric limits/abort custody unset. |
| **STOP-07 — maintenance failure** | Any unapproved API/direct SQL/service/job/wrapper path remains usable, writer quiescence cannot be demonstrated, fence changes unexpectedly, or unrelated-consumer impact is unapproved. M1/M2 intermediate states never justify reopening. |
| **STOP-08 — recovery gap** | Backup/recovery point/coverage unusable or unverified; restore/forward-recovery proof absent; operators/access/RPO/RTO/blast radius unknown; proposed reset/drop/CASCADE/history repair without explicit recovery approval. |
| **STOP-09 — security regression** | Private schema exposed; anon/raw billing/staff/audit access; broader entitlement column rights; domain-write RPC or service/job path enabled contrary to scope; HR01/HR02/staff/tenant/version/immutability/audit/privacy requirements weakened. |
| **STOP-10 — Auth/delivery/URL mismatch** | OTP length/template differs from accepted six-digit contract; SMTP/delivery/recipient/rate capacity unproven; unsafe signup/anonymous/staff assurance; existing-consumer impact unresolved; production origins/redirect purpose unknown or local-cookie mode active. |
| **STOP-11 — hosting/validation failure** | Wrong artifact/environment/routes; missing Secure/HttpOnly/host-only cookie or inappropriate expiry/token size; private caching/leakage; same-origin rejection fails; accepted lifecycle regressions; failed/unknown required native/hosted case or misleading universal denial. |
| **STOP-12 — unsupported real launch** | Positive delivery requires unapproved profiles/memberships/entitlements/content/staff/bootstrap; frozen commerce/privacy/resource prerequisites incomplete; test fixture or legacy download/payment token used as Portal authority; stronger global signout/refresh claims asserted without proof. |
| **STOP-13 — unavailable capacity/threshold breach** | Approved mail/error/latency/lock/load/disk/window thresholds exceeded, unrelated workload degraded or recovery cannot complete within approved bounds. Unknown thresholds block start. |

No STOP is resolved by weakening a gate, relabelling UNKNOWN as PASS, editing accepted SQL/frozen documents, installing excluded migrations, activating a hook, broadening grants, exposing private schema or choosing current HEAD. Present the exact discrepancy and smallest concrete proposal; obtain the applicable Human decision.

## J. Human approval checkpoints

**Irene retains final authority.** S2's G10 remains **ON HOLD** as these separate action approvals. Approval must bind the concrete reviewed package and its final digest, environment/target, operator/reviewer, permitted actions/side effects, limits/fence, abort/recovery custody, evidence handling and STOP criteria. No general “proceed” should silently combine unrelated operations.

| Checkpoint | Precise Human decision required | What that approval would authorize |
| --- | --- | --- |
| **J0 — current review** | Accept/revise D7.3, source/exclusions/evidence labels and recommended next scope; clarify digest-bound S1/S2 review disposition. | Document acceptance only; current task ends here. |
| **J1 — accepted-only metadata preparation** | Approve one new local M1–M3 metadata interpretation/checklist artifact, its path and read-only boundaries. | Local preparation only; preserve existing untracked S3–S5. No SQL/provider use. |
| **J2 — metadata collection** | Approve exact reviewed queries/checklist, target, designated Human operator/session, sanitization and observation scope; any necessary provider confirmation separately bounded. | Read-only metadata/settings observation only. No data/secret export, test/migration/grant/config change. |
| **J3 — isolated preparation/rehearsal** | Approve disposable representative environment, exact source/runner/fixtures, tests/faults/restore, required dependency/build work and cleanup/evidence custody. | Isolated-only writes/tests/builds expressly listed; no production connection, M4/M5 or hook. |
| **J4 — production foundation installation** | Approve concrete M1–M3 package after pre-install G1/G2/G3/G7/G8 proof and independent review; exact fence establishment changes, backup point, window, owner, runner, checks and contingency. | Exactly ordered accepted migrations plus explicitly scoped runner ledger bookkeeping/fencing/checks. No Auth change, exposure reopening, fixtures, provisioning or deployment. |
| **J5 — Auth/email/URL/environment configuration** | Approve exact setting/value identities without secret disclosure, before/after diff, existing-consumer effects, custody and rollback. | Only listed configuration changes; no custom token hook, implicit signup/provisioning or API opening. |
| **J6 — API exposure and bounded hosted validation** | Approve precise Portal exposure/testing access, private-schema exclusion, permitted existing accounts/recipients/Auth side effects, read/metadata/browser cases, rate limits and re-fencing. | Only specified exposure and checks. No repository fixture/bootstrap or protected domain-write test. |
| **J7 — application deployment/promotion** | Approve exact independently reviewed artifact/dependency/toolchain/output digests, hosting/environment association, routes and rollback artifact. | Only named artifact deployment/promotion. No current-HEAD deployment or launch by implication. |
| **J8 — release/use** | Review G0–G9 closures and remaining NOTES, governed real-data/commerce/privacy prerequisites, monitoring/capacity and recovery; choose exact authorized audience/features/window. | Only explicitly bounded release. Missing real-delivery evidence retains HOLD. Broader launch is a separate decision. |
| **J9 — discrepancy/recovery** | Approve concrete forward repair, history reconciliation, destructive reversal, config/deployment recovery or restore outside previously approved contingency. | Only reviewed recovery actions; does not retroactively authorize the failed/excluded scope. |

Required unresolved decisions: exact target/owner/runner/version; approved evidence freshness; how to prove maintenance without harming unrelated consumers; actual backup/restore capability and RPO/RTO; representative runtime/rehearsal environment; numeric operation/abort limits; OTP/SMTP/production origins and recipient capacity; payload/dependency provenance; governed positive-validation/real-data scope; bounded acceptance of inherited limitations. No values or decisions are invented by this plan.

## K. Recommended smallest safe next step

**After Irene reviews this document, recommend J1: separately authorize one local, documentation-only M1–M3 metadata interpretation and evidence checklist derived from S5.** This is the smallest next step because S5 is prepared against five migrations/01D; using its old acceptance rules would incorrectly demand generation/hook privileges and could lead to excluded installation/activation.

The proposed checklist should preserve safe query/result labels and wrappers, distinguish M1–M3 requirements from contextual/excluded-object drift detection, map the 23 result sets and D1–D9 settings checks to G2/G3/G7, identify sanitized evidence already supplied versus missing original grids, and define the exact later operator-only metadata scope. It should explicitly replace the five-file expected-state/hook/forced-RLS/session-lock interpretations with B3/F1/F2 and leave both existing reconciliation handoffs and S5 unchanged.

Completion criterion for that future step: a separately reviewed accepted-only checklist with no execution commands, no broad data/secret collection, no production credentials required from this agent and an explicit J2 decision boundary. Then Irene can decide whether to authorize Human-operated fresh metadata collection. Do not begin that checklist, SQL collection, runner implementation, rehearsal, configuration or deployment under D7.3. **No next action is authorized by this recommendation.**

## L. Local artifact and repository preservation verification

The sole permitted new path is this document:

[AIEA_Portal_D7_3_Production_Readiness_and_Deployment_Safety_Plan_v1.0.md](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_3_Production_Readiness_and_Deployment_Safety_Plan_v1.0.md>).

Entry snapshot: branch `main`; HEAD `e1b2b8b0e880e2d5a277060514e9a8dac8ffdaa0`; **202 tracked files**, no tracked changes, no staged changes, and **five pre-existing nonignored untracked handoffs**. Their entry hashes are preserved below; none belongs to this task's creation scope.

| Pre-existing untracked path (repository-relative) | Entry SHA-256 |
| --- | --- |
| `docs/portal/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md` | `7cb4ff9baa57d8a1724d5e49ca4dd25812a22c11d8ca094b22a8c4cd16bc04ef` |
| `docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.json` | `e1149899b0dceb126a240c5441e6483d0a133f788fe62872b9652eb681f779ed` |
| `docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.md` | `dccf26ffed4564700889e000e53aaa643d351c7adb3a107b6ef9dabfc8f53845` |
| `docs/portal/handoffs/AIEA_Portal_Hosted_Metadata_Preflight_Package_v1.0.md` | `b3f40c9446aaa10e9dffd6ab1d42eaf171e411b41c1bb5251ca59e4cf7b20fd7` |
| `docs/portal/handoffs/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md` | `93458cf3e81a85577a5330cfad91a9075358e5380f3885ce52748d581ec047a6` |

### Final local verification

**VERIFIED — local artifact and repository preservation only:**

- All **202 tracked files** and **five pre-existing nonignored untracked handoffs** retain their entry SHA-256 values. The only added nonignored untracked path is this requested D7.3 document.
- Tracked working-tree diff and staged diff remain empty. The Git index's exact SHA-256 remains `31037a7b891f11a5369b5f94a4b0ef187c8e1e7d0738b68f9ed3d805fe3c7e5e`; HEAD and branch remain unchanged.
- Document sections A–K are present, G0–G9 each have an individual matrix row, all 14 local Markdown file links resolve, and source/manifest/migration/frozen hashes match the inspected evidence. No execution or production PASS is inferred.
- Only this new Markdown document was created/edited. No existing handoff, application code, migration, local/hosted configuration or frozen artifact changed. No SQL, migration, test suite, hosted connection, hook activation, dependency installation, build, deployment, stage, commit, push or merge occurred.

Final Git status (local cached origin comparison; no fetch):

```text
## main...origin/main
?? docs/portal/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md
?? docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.json
?? docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.md
?? docs/portal/handoffs/AIEA_Portal_D7_3_Production_Readiness_and_Deployment_Safety_Plan_v1.0.md
?? docs/portal/handoffs/AIEA_Portal_Hosted_Metadata_Preflight_Package_v1.0.md
?? docs/portal/handoffs/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md
```

The five pre-existing paths are listed separately in the preservation table above; the sixth is this task's sole new file. Source/hash checks are static artifact checks only and do not close any production gate. Human review should bind this document's final bytes/digest; a subsequent edit requires fresh review.

**PRODUCTION REMAINS ON HOLD. STOP FOR HUMAN AUTHORITY REVIEW. No automatic continuation.**
