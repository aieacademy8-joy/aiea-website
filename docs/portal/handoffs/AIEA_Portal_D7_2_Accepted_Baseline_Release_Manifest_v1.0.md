# AIEA Portal — D7.2 Accepted-Baseline Release Manifest v1.0

Date: **2026-10-09 (America/Chicago)**. Final Human Authority: **Irene**.  
Authority: current Human D7.2 instruction authorizes **local-only documentation/artifact creation**. D7.1 is accepted as planning/evidence reconciliation only.  
Disposition: **PRODUCTION HOLD; D7.2 PENDING HUMAN REVIEW; 01D UNACCEPTED.**

## 1. Release authority and evidence boundary

The accepted-baseline source is exactly Sprint 01C commit **`079e7f2a13142e956a5766d6e9e17a1f94718f5f`**. Only M1, M2 and M3 are source-eligible database migrations for this release. Source eligibility is not execution, configuration, deployment or launch approval. M4, M5, HR03 hook activation and every 01D runtime addition or changed version are **INELIGIBLE**.

D7.2 creates a review document and a machine-readable source-identity inventory. It creates no migration, runner, executable guard, application change or hosted configuration. Production migration, configuration changes, Auth hook activation, deployment and 01D acceptance remain ON HOLD. Git commit/push/merge and automatic D7.3 continuation are not authorized.

| Evidence label | Meaning |
| --- | --- |
| VERIFIED — local | Directly inspected Git objects, file bytes, source text or local status. |
| SUPPLIED — not reverified | Human-supplied hosted facts carried from D7.1; no hosted connection or query. |
| REPORTED — not rerun | Historical implementation/independent test results recorded in repository documents. |
| UNKNOWN | Insufficient current evidence; cannot satisfy a release gate. |
| ASSUMPTION — must verify | A proposed future process or expected behavior; cannot substitute for evidence. |

## 2. Exact source identity and authority discrepancy

| Item | Verified value |
| --- | --- |
| Repository | `/Users/dosfam/Desktop/AIEAcademy/Website/2.0` |
| Branch at inspection | `main` |
| Accepted source commit | `079e7f2a13142e956a5766d6e9e17a1f94718f5f` |
| Accepted commit title | AIEA Portal: accept Sprint 01C curriculum delivery shell |
| Accepted tree object | `7cac2a07bab9ed051737dcd150e7e7edc411879a` |
| Accepted tracked-file inventory | **181 Git blobs**, all modes/IDs/byte lengths/SHA-256 values recorded in the JSON companion |
| Current HEAD | `e1b2b8b0e880e2d5a277060514e9a8dac8ffdaa0` |
| Current HEAD title | AIEA Portal: accept Sprint 01D mission status and trusted write authority |
| HEAD versus accepted source | **28 paths: 21 additions and 7 changed baseline paths** |
| Working-tree copies of accepted files | **174 identical; 7 different** |
| Entry status | No tracked modifications; empty index; three pre-existing nonignored untracked handoffs |

Acceptance of the 01C commit comes from the current Human instruction. The historical [01C final review](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_Sprint_01C_Final_Acceptance_and_Repository_Boundary_Review_v1.0.md>) remains evidence of its then-current review/commit boundary; it does not itself authorize hosted operations.

Current HEAD's title and the following records describe 01D or a five-migration release as accepted:

- [Historical 01D final acceptance record](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_Sprint_01D_Final_Acceptance_and_Repository_Boundary_Review_v1.0.md>)
- [Earlier root reconciliation handoff](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md>)
- [Earlier handoffs reconciliation document](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md>)
- [Earlier metadata preflight package](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_Hosted_Metadata_Preflight_Package_v1.0.md>)

These are **verified documentary statements, not current release authority**. D7.1/D7.2's current Human ruling controls: 01D remains unaccepted, and this release stops at the accepted 01C source. The earlier five-migration recommendations are inapplicable to this accepted-only release. Those records and their failed/passing evidence are preserved unchanged; this manifest neither rewrites them nor retroactively changes their historical statements.

## 3. Eligible database manifest — accepted Git bytes

**Required order: M1 → M2 → M3.** All three are **SOURCE ELIGIBLE / EXECUTION ON HOLD**.

| Order | Exact migration filename | Accepted SHA-256 | Effect and dependencies |
| --- | --- | --- | --- |
| M1 / 1 | [20261006000100_portal_domains.sql](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000100_portal_domains.sql>) | `f0bdbe5ed8f4f622362c0a6c149bc26644b06552b8a7358b8d792dbfe05a8464` | Creates portal and portal_private, 28 Portal tables, keys/constraints/indexes and initial privileges. Requires managed auth.users, compatible roles, UUID resolution and authorized owner CREATE/REFERENCES privileges. |
| M2 / 2 | [20261006000200_portal_security.sql](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000200_portal_security.sql>) | `b5afa539f70e34b6c22080a582de22cc484d294b8f368e11e08c141f745184d4` | Adds 8 private authorization routines, RLS and bounded authenticated reads. Requires M1, auth.uid()/auth.jwt(), managed session/TOTP factor structures and compatible definer-owner access. |
| M3 / 3 | [20261006000300_portal_guards.sql](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000300_portal_guards.sql>) | `8fababc9491321f176fcfbf5196ff44a98a41bd657d263a897f51498837bb486` | Adds 15 private guard/audit/locale routines and triggers. Requires M1 domains and M2 authorization helpers; compatible function/trigger ownership and privileges. |

Verification method: enumerate `git ls-tree -rz 079e7f2a13142e956a5766d6e9e17a1f94718f5f`, read each referenced blob with `git cat-file blob <object-id>`, calculate SHA-256 over its exact bytes without normalization, and compare to the current file bytes. The accepted tree contains **exactly these three migration files**. Each current copy is byte-identical to its accepted blob. Verification is anchored to the accepted 01C tree, not merely HEAD.

Expected accepted foundation state is 28 tables in `portal` and 23 distinct routines in `portal_private`, with accepted RLS, read grants, constraints and audit/integrity guards. Counts support detailed comparisons and are not sufficient release evidence alone. Existing mission_progress/cohort_mission_delivery tables belong to M1; their presence does not authorize 01D mutation RPCs.

### Transaction and history boundary

Each eligible SQL file has its own explicit BEGIN/COMMIT. **The three-file migration batch is not atomic.** M1 may be committed before M2's RLS; M2 may be committed before M3's full guards. A later failure can leave earlier files committed. An outer transaction or single-transaction runner must not be assumed to override the files' transaction commands.

Before any execution approval, the chosen runner must be rehearsed for file commits, error handling, migration-ledger recording and uncertain commit acknowledgement. The ledger's atomicity with these explicit transactions is **UNKNOWN**. Keep the database/API/direct-writer maintenance boundary effective before M1 and until final inspection and separately authorized release. No migration-history pre-marking or blind retry is permitted. No accepted down migrations exist.

## 4. Exact accepted 01C runtime

Every listed file is pinned to **`079e7f2a13142e956a5766d6e9e17a1f94718f5f`**. Links navigate to workspace copies; a DIFFERENT entry means that copy contains ineligible later changes. **The accepted Git blob and SHA-256 are the authority.** No accepted source copy or build was extracted during D7.2.

| Runtime/source input | SHA-256 from accepted 01C | Current worktree comparison |
| --- | --- | --- |
| [api/portal/auth.js](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/api/portal/auth.js>) | `2599b444f1bce7498cfac7b73e09014cc13b76841f1918e6130e9d48371c414c` | IDENTICAL |
| [api/portal/context.js](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/api/portal/context.js>) | `d86f6b9f7b2cae1741db556e9a4ac84e6b38d740372830ecf16fd9628d345bf4` | IDENTICAL |
| [api/portal/curriculum.js](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/api/portal/curriculum.js>) | `abf877f3cc53f4b5312ed182245be9f8b29d111d39ba17b98e8fcb2a1ad4e2e8` | IDENTICAL |
| [api/portal/index.js](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/api/portal/index.js>) | `f250234c26f68c19d75e4e6e738c53e5baf5bfb649634f9a7e4e3cbc4a81db32` | IDENTICAL |
| [lib/portal/curriculum.js](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/lib/portal/curriculum.js>) | `60d0ea159e029420353aba03b8e81dc52b756c79250c309f9e0a80c74ad7b727` | IDENTICAL |
| [lib/portal/runtime.js](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/lib/portal/runtime.js>) | `2c68df9e0358c215f422d0ec978025192cebafe2a9108c104bedf2cfc33295d2` | DIFFERENT — current version INELIGIBLE |
| [lib/portal/shell.js](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/lib/portal/shell.js>) | `98291cd862168084a845a0ece8b35c8375832f6e6482364276963466b5086233` | DIFFERENT — current version INELIGIBLE |
| [portal/login.html](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/portal/login.html>) | `45aac74c0aa4f61a35a7b974f688046f5f1dd6c6cea01464c1207b2f76093626` | IDENTICAL |
| [portal/portal.css](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/portal/portal.css>) | `5494930a4d8258e0af34d226867e14dabce80c25227e2a90211762fa3c7f815b` | DIFFERENT — current version INELIGIBLE |
| [portal/portal.js](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/portal/portal.js>) | `75101412b5e3992efbcb571aecf1cc641bae0e6a31238fed7e082a8eb396a1e7` | DIFFERENT — current version INELIGIBLE |
| [package.json](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/package.json>) | `5e38018d3ff9e3f8b21cb256c705fbdda385abe3ea6c08ec4e9b89ed5ccd7a86` | IDENTICAL |
| [vercel.json](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/vercel.json>) | `e537fc9aa852f0f2e183c4f51b5f365d78d436366e4d9c045015d03909965a14` | IDENTICAL |

The four changed application files are the common runtime, protected shell, Portal CSS and Portal client. They must not be taken from HEAD for an accepted-only deployment.

Accepted contract:

- Protected entry: GET /portal and /portal/, rewritten to the protected index handler.
- Auth: POST /api/portal/auth for existing-adult request/verify/signout; **exactly six-digit** email OTP; native Auth verification; active server-confirmed adult profile; expiry-bounded HttpOnly access cookie; refresh token discard; pending-signout quarantine.
- Domain delivery: GET /api/portal/context and GET /api/portal/curriculum; active membership/workspace and exact-version entitlement checks; adult JWT forwarded under RLS; bounded projections; literal text rendering; fresh authorization/reconciliation and private-state clearing.
- No Portal domain mutation endpoint, progress/status recording control, completion implementation, write-generation registry/claim enforcement or custom access-token hook is part of this runtime.
- Runtime reads PORTAL_SUPABASE_URL, PORTAL_SUPABASE_PUBLISHABLE_KEY and PORTAL_ORIGIN. No secret/service credential fallback is introduced.
- Existing public website/commerce source is preserved at the pinned full-tree baseline. Its presence does not authorize Portal commerce, entitlement processing or broader launch.

The JSON companion pins **all 181 baseline tracked files**, including non-Portal APIs, static assets, shared public-site source, accepted tests and governance evidence. This inventory defines source provenance, **not a blanket deployment-payload or execution allowlist**. Tests, synthetic bootstraps/fixtures, SQL assertions, local adapter, seeds and documentation must never be executed as production installation. Artifact packaging and any publicly served source/diagnostic files require separate review.

### Accepted support/configuration source pins

| Support artifact | SHA-256 from accepted 01C | Current worktree comparison |
| --- | --- | --- |
| [.env.example](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/.env.example>) | `966bf48a6f74662a33c74fe40c85fd45930a94925ac0266c05d6dd6fad9c59e6` | IDENTICAL |
| [supabase/config.toml](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/config.toml>) | `f8d8632bca4cea518b2ec898863598064538734e215bd26774a0e63185c94281` | IDENTICAL |
| [supabase/templates/adult-email-otp.html](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/templates/adult-email-otp.html>) | `f58970e736303b13d95216548c4aed32e250012bac2d3c8fdb98c70c868a6591` | IDENTICAL |
| [portal/README.md](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/portal/README.md>) | `2effa2820aee219153a64a753fc3800f189960b74fd5bfceb26d204f123b9c2c` | DIFFERENT — current version INELIGIBLE |
| [supabase/README.md](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/README.md>) | `94164b7762de448debe2104db40f8cac9ab3d63fd008e3b3b6b47683ec5e257b` | DIFFERENT — current version INELIGIBLE |
| [scripts/portal/serve-local.mjs](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/scripts/portal/serve-local.mjs>) | `9ad8a33bf385f0e997eae7ac938531b0f0136a8b10515c58365644afc7cce0f8` | DIFFERENT — current version INELIGIBLE |

The local TOML is a development scaffold: PostgreSQL 15, local origins, local mail and portal API exposure. It is not a hosted configuration specification. Numeric template installation, real environment values and hosted settings require separate approval. The local adapter and synthetic test sources are validation-only, never production entry points.

The accepted package file contains `@vercel/blob: ^2.6.1`; the accepted tree contains no dependency lockfile. Source hashes therefore do not pin resolved dependencies, toolchain or build outputs. Future resolution/build provenance must be recorded and reviewed before deployment; D7.2 changes none of them.

## 5. Explicit ineligible set

| Candidate item | Identity | Accepted-baseline disposition |
| --- | --- | --- |
| M4 | [20261008000100_portal_mission_status.sql](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261008000100_portal_mission_status.sql>); current hash `e05eb2bba019b17f4d72b40f7f7b033eef5450fcdb81f90be842a9fc8af5ba6f` | **INELIGIBLE** |
| M5 | [20261008000200_portal_write_generation.sql](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261008000200_portal_write_generation.sql>); current hash `d958198cc2bb77599e593420c25cb63e33a2748af5ddeed163cdbdfbf7c1c7b0` | **INELIGIBLE** |
| HR03 activation | portal_private.issue_write_generation(jsonb); reference URI `pg-functions://postgres/portal_private/issue_write_generation` | **INELIGIBLE; no installation/activation approval** |
| HR03 state/authority | write_session_generation, write_generation_seq, aiea_write_generation claim and candidate gate replacement | **INELIGIBLE** |
| 01D write RPCs | portal.record_mission_progress(uuid,uuid,uuid,uuid,text); portal.record_cohort_delivery(uuid,uuid,uuid,uuid,text) | **INELIGIBLE** |

Candidate hashes identify excluded bytes; **they are not eligible migration entries**. M4 contains the historical same-second timestamp vulnerability. M5's local correction evidence does not authorize adding either file to this release. The accepted-only baseline needs neither M4 nor M5 nor hook activation.

Every 01D runtime delta is excluded:

| Path | HEAD delta | Disposition |
| --- | --- | --- |
| [api/portal/progress.js](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/api/portal/progress.js>) | Added; absent from accepted 01C | INELIGIBLE; exclude entirely |
| [lib/portal/progress.js](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/lib/portal/progress.js>) | Added; absent from accepted 01C | INELIGIBLE; exclude entirely |
| [lib/portal/runtime.js](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/lib/portal/runtime.js>) | Changed after accepted 01C | INELIGIBLE; use only the accepted commit's pinned version in a later approved extraction |
| [lib/portal/shell.js](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/lib/portal/shell.js>) | Changed after accepted 01C | INELIGIBLE; use only the accepted commit's pinned version in a later approved extraction |
| [portal/portal.css](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/portal/portal.css>) | Changed after accepted 01C | INELIGIBLE; use only the accepted commit's pinned version in a later approved extraction |
| [portal/portal.js](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/portal/portal.js>) | Changed after accepted 01C | INELIGIBLE; use only the accepted commit's pinned version in a later approved extraction |
| [scripts/portal/serve-local.mjs](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/scripts/portal/serve-local.mjs>) | Changed after accepted 01C | INELIGIBLE; use only the accepted commit's pinned version in a later approved extraction |

The two changed READMEs and all new 01D reports/tests/SQL inventories are recorded in the JSON's complete 28-path HEAD delta. Their current versions/additions are not accepted release inputs. Historical documents may be read as evidence, while their content must not be interpreted as operational approval. No current 01D source is deleted or rewritten.

## 6. Fail-closed release boundary

This is a **documented declarative boundary**, not an installed automated enforcement mechanism. No deployment wrapper, CI rule or runtime gate was created. Future runner/packaging enforcement requires separately approved work and demonstration. Documentation alone cannot prevent an operator from issuing a command.

A future accepted-baseline release is eligible for review only when all of the following are established:

1. The source is the exact accepted commit/tree, or a separately reviewed extraction whose full source identity and file modes match the JSON pins. **Current HEAD/current checkout is not an eligible deployment source.**
2. The database input directory contains exactly the three pinned eligible SQL files, once each, in M1→M2→M3 order. Reject missing, duplicate, renamed, extra or hash-mismatched migrations.
3. No M4/M5, progress endpoint/control, candidate shared-file version, write registry/allocator, HR03 hook configuration or claim enforcement can enter through copied files, overlays, generated outputs, an alternate directory, build output or deployment fallback.
4. Full source pins are verified separately from the production-payload allowlist. D7.2 documents may accompany review outside the deployment payload; their existence does not authorize adding files to accepted source.
5. Every relevant verification gate has affirmative evidence; UNKNOWN, stale, incomplete or failed evidence means **STOP**. Source verification alone never changes HOLD.
6. Human approval identifies the exact target, source/manifests, migration runner/version, effective owner, maintenance/abort/recovery custody, configuration scope and deployment artifact.

**Default migration deployment from current HEAD is INELIGIBLE.** Its migration directory contains five files. Do not run a default db push, Dashboard paste batch, glob/directory execution or automated branch deploy from that checkout and call it an accepted-only release. A default deployment process that cannot prove the exact input set is a blocker. No provider command is authorized by this document.

Future database state must also be reconciled: an M1–M3 file allowlist is insufficient if unaccepted write RPCs or alternate wrappers already exist hosted. Do not automatically drop or repair discovered objects; stop for a separately approved disposition.

On any discrepancy: stop before mutation/deployment; report it; obtain a Human decision. Do not silently edit accepted SQL, repair history, broaden grants, weaken RLS/HR01/HR02, expose private schemas, add hooks, or fall back to HEAD.

## 7. Required verification and approval gates

**No production gate is marked passed by D7.2.** Local source verification is evidence for review only.

| Gate | Required evidence before the relevant next action | Current state |
| --- | --- | --- |
| G0 — Human manifest review | Review exact accepted source/pins, exclusions, discrepancy and artifact scope. Separate approval is required for any subsequent work. | PENDING HUMAN REVIEW |
| G1 — Source/input integrity | Recheck accepted commit/tree, all runtime/config pins, reviewed JSON digest, exactly three migration inputs/order and absence of 01D content in resulting artifacts. | LOCAL PINS VERIFIED; future recheck required |
| G2 — Target/privileges | Confirm project/database/operator/time; catalog and ledger provenance; compatible Auth types/indexes/helpers; owner CREATE/REFERENCES/read/lock rights; role memberships/default ACLs; definer/trigger ownership; event-trigger effects and alternate paths. | UNKNOWN; supplied structural findings are not privilege/runtime proof |
| G3 — Atomicity/maintenance | Rehearse the exact runner with explicit per-file transactions, ledger/error/partial-commit behavior, uncertain acknowledgements and abort handling. Prove a maintenance fence for Data API, direct SQL, jobs and service writers before M1, preserving unrelated consumers. | UNKNOWN |
| G4 — RLS/API exposure | Inspect final 28 tables/23 routines, policies, ACLs, constraints/guards/audit and entitlement column grants. Verify denied anon/adult DML, no domain-write RPC or bypass wrapper. Enable/expose only approved portal API access; portal_private stays unexposed. Reconcile search path and actual loaded configuration. | UNKNOWN; Data API supplied disabled |
| G5 — OTP/SMTP/Auth policy | Match the unchanged **six-digit** client/server to configured OTP; install/review numeric Token template under separate approval; verify expiry/replay, existing-adult-only signup/anonymous policy, approved SMTP sender/recipients/delivery and sustainable rate limits. Preserve staff TOTP boundary. | BLOCKED by supplied 8-digit/link-template/no-SMTP configuration; remaining policy UNKNOWN |
| G6 — Production URLs/environment | Approve actual HTTPS origins, Site URL and redirect policy, environment custody, same-origin behavior, host-only Secure/HttpOnly cookies, logout quarantine, rewrites/CDN/no-store and no credential exposure. Local callback TOML does not implement a product magic-link callback route. | UNKNOWN; supplied localhost:3000 and empty redirect allowlist |
| G7 — Rollback/recovery | Confirm backup/coverage/recovery point, restore readiness, dependency/data impact, approved forward recovery/abort plan and operator custody. No accepted down migration; no reset/drop/history-repair shortcut. Preserve unrelated data and audit/learning history. | UNKNOWN |
| G8 — Compatible rehearsal/hosted validation | Separately approve disposable synthetic validation against compatible PG17.11/managed Auth/PostgREST semantics and accepted regressions. Define bounded hosted post-install validation for grants/RLS, OTP/session/staff assurance and curriculum/no-write behavior. No production fixture/bootstrap/reset runs. | UNKNOWN; prior local results REPORTED only |
| G9 — Packaging/build provenance | Prove source selection, dependency resolution/toolchain, build input/output hashes, exclusion of 01D endpoints/assets and unwanted source/test payload, and absence of default HEAD/branch fallback. | UNKNOWN; no reproducible deployment artifact built |
| G10 — Operational approvals | Separate explicit authorization for migrations, configuration/API exposure, bounded hosted tests, application deployment and release. Any recovery write needs its authorized scope. HR03 activation and 01D acceptance remain excluded. | ON HOLD |

Supplied hosted context from D7.1: AIEA Curriculum Platform, main/PRODUCTION, Free/us-east-2/t4g.nano, PostgreSQL 17.11, no replicas, 2 GB provisioned; Portal schemas/objects and migration schema absent; Auth structures/helpers/roles reported present; no hook; disabled Data API; enabled email with 8-digit OTP/3600-second expiry, link template, no custom SMTP, 2 emails/hour; localhost:3000 Site URL, empty redirects; 3600-second JWT lifetime, replay detection enabled and 10-second reuse interval. These are **SUPPLIED, not reverified**, and do not establish an empty project, never-attempted SQL, effective permissions or readiness. OTP/token lifetimes and refresh replay controls do not fix the M4 same-second defect.

No missing hosted object is assumed applied. Ledger absence does not authorize pre-marking versions. Current load/capacity, existing consumers, plan/runtime support, other schemas, recovery readiness and observation completeness remain UNKNOWN.

## 8. Frozen governance and security preservation

[Frozen P0 Architecture and Data Contract v1.0](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_P0_Architecture_and_Data_Contract_v1.0_FROZEN.md>) is pinned to SHA-256 **`f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755`**. Its accepted 01C blob equals original freeze commit **`052101670dc92b38c7ec15c88a2b07572e42d75b`**; its current copy also matches. No architecture amendment or weakening is performed.

HR01 remains: explicit adult attestation, no required evidence, idempotent completion. This accepted-only release implements no completion capability. HR02 remains: every protected write requires a live/current managed Auth session. This release exposes no Portal domain-write endpoint; it does not claim a new universal write-session guarantee from accepted read policies. Existing Auth request/verify/signout operations remain the accepted managed-Auth lifecycle.

Preserve adult-only authority, active membership/workspace/exact-version entitlement checks, no browser service credentials or actor overrides, least-privilege grants/RLS, current managed staff session and verified TOTP-backed aal2/capability gate, immutable curriculum, private-state clearing and audit provenance.

The five inherited notes remain **NOTE — OPEN** with unchanged meanings: 01B-A03 hosted routing/CDN/HTTPS-cookie assurance; SNV02 deprecated local inbucket; SNV04 global refresh-chain cascade unproven; SNV05 exact-path-only callbacks unproven; SNV06 ordinary stateless Data API may accept unexpired signed-out JWTs. No note is closed/reclassified.

Frozen Section R commerce requirements and governed provisioning/publication/privacy/resource workflows remain separate gates for real delivery. Installing the foundation does not provision adults, memberships, curriculum, entitlements or staff, and does not authorize synthetic production fixtures, commerce changes, Factory coupling or deferred product scope.

## 9. Artifact identity and verification method

JSON companion: [AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.json](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.json>).

Its exact file-byte SHA-256 is:

```text
e1149899b0dceb126a240c5441e6483d0a133f788fe62872b9652eb681f779ed
```

The JSON contains the three eligible migrations, 12 runtime/build-input pins, six support pins, frozen artifact pin, all 181 baseline source pins, seven current-versus-baseline differences, complete 28-path ineligible delta, evidence labels, predeployment gates and declarative HOLD policy. Relative paths inside JSON are explicitly repository-root-relative for portable tooling; Markdown navigation links are absolute workspace references.

The companion is **data, not a deployment tool**. It does not execute Git, SQL, migrations, network access or provider operations. Its source-eligibility entries must not be interpreted as approval booleans. Human review must bind the JSON digest and this review document's final bytes; editing an artifact requires fresh verification/review.

Local-only creation verification reads Git objects and file bytes. No repository test runner, SQL parser/executor, native stack, browser test, build or provider command is used. Historical PASS counts are not revalidated by hashing.

## 10. Repository preservation and exact write scope

Only these two new paths are authorized/created for D7.2:

- [docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.md](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.md>)
- [docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.json](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.json>)

No pre-existing path, accepted migration, application source, local TOML, frozen contract or historical acceptance record is authorized for modification. No Git staging/commit/push/merge, hosted operation, deployment or automatic D7.3 follows.

The entry snapshot recorded 205 tracked/nonignored-untracked files. The three pre-existing untracked documents were hash-recorded:

| Pre-existing untracked file | Entry SHA-256 | Required preservation |
| --- | --- | --- |
| [docs/portal/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md>) | `7cb4ff9baa57d8a1724d5e49ca4dd25812a22c11d8ca094b22a8c4cd16bc04ef` | PRE-EXISTING; preserve byte-for-byte |
| [docs/portal/handoffs/AIEA_Portal_Hosted_Metadata_Preflight_Package_v1.0.md](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_Hosted_Metadata_Preflight_Package_v1.0.md>) | `b3f40c9446aaa10e9dffd6ab1d42eaf171e411b41c1bb5251ca59e4cf7b20fd7` | PRE-EXISTING; preserve byte-for-byte |
| [docs/portal/handoffs/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md>) | `93458cf3e81a85577a5330cfad91a9075358e5380f3885ce52748d581ec047a6` | PRE-EXISTING; preserve byte-for-byte |

### Final local creation verification

**PASS — local static artifact verification only.** Independently reread the accepted Git tree and validated:

- All **181** source entries against their Git blob IDs, file modes, byte lengths and SHA-256 hashes; exact commit/tree identity.
- Exactly **3** eligible migrations in the stated order, identical accepted-tree/current bytes, with one explicit BEGIN and COMMIT each; no SQL execution.
- All **12** runtime/build-input pins and **6** support pins; complete **28-path** HEAD delta; M4/M5 identification hashes and INELIGIBLE labels; no operational-authorization flag set true.
- Frozen artifact equality to original freeze commit and current copy.
- JSON parsing, its pinned digest, all **42** Markdown local-file links and source/hash references.
- All **205** pre-existing tracked/nonignored-untracked files preserved byte-for-byte; all **3** pre-existing untracked handoffs untouched; the only new files are the two D7.2 artifacts.
- HEAD/branch unchanged, no tracked diff and empty index. Final status has **5 untracked files: 3 pre-existing + 2 D7.2**.

Final Git status (local snapshot; cached origin comparison only, no network fetch):

```text
## main...origin/main
?? docs/portal/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md
?? docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.json
?? docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.md
?? docs/portal/handoffs/AIEA_Portal_Hosted_Metadata_Preflight_Package_v1.0.md
?? docs/portal/handoffs/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md
```

Only this new review document and its new JSON companion were created/edited. No application source, accepted migration, local configuration or historical record changed. No behavioral test, SQL/migration execution, hosted access, configuration/hook operation, build, deployment or Git publication was performed. These creation checks do not satisfy the pending hosted/operational gates.

## 11. Remaining blockers and Human decision

Production remains blocked on operational authorization; missing hosted foundation; privileges/owner/default-grant/event-trigger evidence; transaction/history/maintenance behavior; final RLS/API exposure proof; OTP/template/SMTP/production URL compatibility; recovery custody; compatible rehearsal and hosted validation; and deployment source/packaging/dependency provenance.

Acceptance-status disagreement is documented for this release without rewriting history. M4/M5 and all 01D features remain outside eligibility, even if their source hashes or recorded local tests match.

**Requested Human Authority review:** review D7.2's exact source pins, accepted-only scope, exclusions, fail-closed boundary, evidence labels and pending gates. Approval of this artifact alone must not be treated as migration, configuration, hook, deployment or 01D acceptance authorization.

**STOP. Do not proceed to D7.3 automatically.**
