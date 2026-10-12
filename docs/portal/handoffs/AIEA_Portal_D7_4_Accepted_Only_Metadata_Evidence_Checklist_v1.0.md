# AIEA Portal — D7.4 Accepted-Only Metadata Evidence Checklist v1.0

Date: **2026-10-10 (America/Chicago)**. Final Human Authority: **Irene**.  
Mode: **LOCAL DOCUMENTATION ONLY — NO HOSTED ACCESS OR SQL EXECUTION**.  
Accepted source: **Sprint 01C `079e7f2a13142e956a5766d6e9e17a1f94718f5f`**.  
Disposition: **PRODUCTION HOLD. D7.4 PENDING HUMAN REVIEW. STOP AFTER THIS DOCUMENT.**

## A. Authority, scope and evidence labels

The current Human instruction authorizes exactly this new local checklist, fulfilling D7.3 checkpoint **J1**. It authorizes no production operation and no automatic continuation to **J2**. No Supabase connection, SQL execution anywhere, settings observation, dependency installation, test, application/migration edit, commit, push, merge, deployment or Auth hook activation is performed or authorized by this document.

Only **M1 → M2 → M3**, from the accepted commit above, are eligible migration inputs. This checklist interprets the existing Hosted Metadata Preflight Package's **23 labeled result sets (4 + 6 + 5 + 4 + 4)** and **D1–D9** observations against those three files. It leaves that package and both reconciliation handoffs unchanged. Their five-migration/01D acceptance rules and hook procedures do not apply to this release. Keeping a safe metadata query that names an excluded object does not make that object an installation prerequisite.

| Evidence label | Meaning here |
| --- | --- |
| **VERIFIED — local** | Inspected file/Git bytes, source text and repository state. Verifying a document's contents does not reproduce its reported hosted or behavioral results. |
| **SUPPLIED BUT NOT REVERIFIED** | Previously Human-supplied hosted observations carried through D7.2/D7.3 and earlier handoffs. Reusable context only; original complete grids, timestamp/coverage and current state are unverified. |
| **REPORTED BUT NOT RERUN** | Historical test/rehearsal claims. No new behavioral PASS follows. |
| **UNKNOWN** | Missing, unverified, denied, incomplete, stale or ambiguous evidence; cannot close its dependent gate. |
| **EXCLUDED / CONTEXT ONLY** | A returned field/object is outside M1–M3 prerequisites. Its absence is not a baseline defect; unexpected excluded installation is drift requiring review. |

All future collection instructions and expected outcomes below are **proposals for Human approval**, not observations or permission. No hosted gate is passed. G2/G3/G7 remain UNKNOWN; final G4, G8 and other operational gates require later separately authorized work. Supplied OTP/SMTP/URL conflicts block their dependent use gates, without inventing additional M1–M3 DDL prerequisites.

## B. Source references and accepted identities

The repository root is `/Users/dosfam/Desktop/AIEAcademy/Website/2.0`. Workspace links navigate to local copies; the accepted Git tree governs source identity.

| Ref | Source and use | Local SHA-256 / identity |
| --- | --- | --- |
| S1 | [D7.2 Markdown release manifest](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.md>), especially §§1–3, 6–8: accepted-only authority, migration pins, G0–G10, supplied context and frozen boundary. | `dccf26ffed4564700889e000e53aaa643d351c7adb3a107b6ef9dabfc8f53845` |
| S2 | [D7.2 JSON release manifest](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.json>): eligible_migrations, baseline_source_inventory, release_boundary, predeployment_gates and security_governance. | `e1149899b0dceb126a240c5441e6483d0a133f788fe62872b9652eb681f779ed` |
| S3 | [D7.3 Production Readiness and Deployment Safety Plan](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_3_Production_Readiness_and_Deployment_Safety_Plan_v1.0.md>), especially B3/B5, C1, D, E, F1/F2/F4, G, I, J1/J2 and K. | `b523ca34538382eb711cf6460d1a10bc68a8193f6402d99cc368c69c9564e04f` |
| S4 | [Existing Hosted Metadata Preflight Package](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_Hosted_Metadata_Preflight_Package_v1.0.md>), §§2–8: unchanged collection statements, labels, wrappers and fixed output allowlists. Its five-file interpretations are superseded for this release. | `b3f40c9446aaa10e9dffd6ab1d42eaf171e411b41c1bb5251ca59e4cf7b20fd7` |
| S5 | [Frozen P0 Architecture and Data Contract](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_P0_Architecture_and_Data_Contract_v1.0_FROZEN.md>), especially E/H/K/L/O/Q/R/T. | `f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755` |
| S6 | [Root hosted reconciliation handoff](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md>), §3: original narrow carried observations. Historical five-file authority does not control. | `7cb4ff9baa57d8a1724d5e49ca4dd25812a22c11d8ca094b22a8c4cd16bc04ef` |
| S7 | [Handoffs hosted reconciliation](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md>), §3: fuller supplied catalog context and its limits. Historical five-file authority does not control. | `93458cf3e81a85577a5330cfad91a9075358e5380f3885ce52748d581ec047a6` |
| S8 | Accepted Sprint 01C Git source; tree `7cac2a07bab9ed051737dcd150e7e7edc411879a`. | Commit `079e7f2a13142e956a5766d6e9e17a1f94718f5f` |

**VERIFIED — local:** all 181 S2 source inventory entries reconcile with S8's paths, modes, blob IDs, byte lengths and SHA-256 values. S8 contains exactly these three migrations; current copies match their accepted bytes. S5 matches S8, original freeze commit `052101670dc92b38c7ec15c88a2b07572e42d75b`, and its current copy. No accepted source was extracted or built.

| Input | Accepted file | Accepted SHA-256 | Source prerequisite/effect |
| --- | --- | --- | --- |
| M1 | [20261006000100_portal_domains.sql](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000100_portal_domains.sql>) | `f0bdbe5ed8f4f622362c0a6c149bc26644b06552b8a7358b8d792dbfe05a8464` | Creates two schemas and 28 tables, keys/indexes/constraints and initial grants. Requires compatible `auth.users(id)`, roles, UUID resolution and executor creation/FK rights. |
| M2 | [20261006000200_portal_security.sql](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000200_portal_security.sql>) | `b5afa539f70e34b6c22080a582de22cc484d294b8f368e11e08c141f745184d4` | Requires M1, `auth.uid()`/`auth.jwt()` and managed session/TOTP structures read by `staff_has`; installs 8 private helpers, RLS and bounded reads. |
| M3 | [20261006000300_portal_guards.sql](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000300_portal_guards.sql>) | `8fababc9491321f176fcfbf5196ff44a98a41bd657d263a897f51498837bb486` | Requires M1 domains and M2 helpers, owner/trigger/Portal-lock compatibility and `auth.users.id` reads for controlled actor deletion; adds 15 routines and guard/audit/touch/constraint triggers. |

Each file has its own explicit transaction. The three-file batch is **not atomic**; M1 may commit before M2 RLS and M2 before M3 full guards. Runner/ledger atomicity is UNKNOWN. No accepted down migration exists. Current HEAD `e1b2b8b0e880e2d5a277060514e9a8dac8ffdaa0` contains unaccepted 01D changes and is not an eligible release source.

## C. Evidence checklist by category

Each unchecked item requires affirmative, current evidence for its dependent action. Catalog predicates alone do not prove execution, RLS outcomes, native Auth behavior, maintenance denial or recovery.

### C1. Required foundation metadata — G1/G2

- [ ] **UNKNOWN — target/catalog:** confirm exact private project/environment/database association, observation times, operator/session/effective role and approved freshness window (B1.1, D1). Database name `postgres` is not unique project identity.
- [ ] **UNKNOWN — initial-install premise:** reconcile both Portal namespaces, exact relation/routine names, collisions across other schemas, ledger existence and prior manual attempts/removal (B1.2–B1.4, D7/D8). Name scans cannot detect renamed/dynamic/external wrappers.
- [ ] **UNKNOWN — primitives:** usable `auth.users.id` UUID/non-null/immediate unique target, trusted zero-argument UUID resolution under the intended runner search path, and usable SQL/PLpgSQL languages (B2.1/B2.2/B2.4, B5.1–B5.3).
- [ ] **UNKNOWN — expected-state review:** reviewers use the accepted 28-table/23-routine inventory below; counts never substitute for definitions, constraints/indexes, policies, ACLs, ownership or trigger bindings. S4 does not collect a complete installed-state comparison. Discovery of existing Portal objects needs a separately scoped reconciliation before any replay.

M1's 28 tables, all in `portal`: `user_profile`, `workspace`, `workspace_membership`, `staff_authorization`, `learner_ref`, `cohort`, `cohort_teacher_assignment`, `cohort_learner_assignment`, `program`, `program_version`, `program_version_locale`, `mission`, `mission_locale`, `resource_asset`, `assessment`, `assessment_locale`, `assessment_item`, `assessment_item_locale`, `billing_reference`, `stripe_event`, `entitlement`, `cohort_mission_delivery`, `mission_progress`, `assessment_attempt`, `assessment_response`, `evidence_record`, `pilot_feedback`, `audit_event`.

M2's 8 routines, all in `portal_private`: `is_adult() → boolean`, `member_role(uuid) → text`, `can_cohort(uuid,uuid) → boolean`, `can_learner(uuid,uuid) → boolean`, `has_version(uuid,uuid) → boolean`, `can_version(uuid) → boolean`, `can_attempt(uuid) → boolean`, `staff_has(text) → boolean`.

M3's 15 routines, all in `portal_private`: 14 zero-argument trigger functions `touch_updated_at`, `audit_change`, `audit_append_only`, `guard_version`, `guard_curriculum`, `guard_program`, `guard_option_keys`, `guard_entitlement`, `guard_billing`, `guard_billing_access`, `guard_staff`, `guard_stripe_event`, `guard_learning`, `guard_response`; plus `resolve_locale(uuid,text) → text`. `touch_updated_at` is SECURITY INVOKER; the other M3 routines and all M2 routines are SECURITY DEFINER. All set an empty routine search path. M1–M3 create no product views, product sequences or private registry table. These are future expected-state criteria, not hosted findings.

### C2. Auth compatibility — G2/G8

- [ ] **UNKNOWN — exact managed columns:** M1/M3 use `auth.users.id`; M2 `staff_has` uses `auth.sessions.id,user_id,aal,not_after,factor_id` and `auth.mfa_factors.id,user_id,factor_type,status` (B2.1). IDs and relationships must be compatible UUID representations; deadline compatible timestamp; assurance/factor labels compatible with `aal2`, `totp`, `verified` (B2.3). Null deadline is permitted by the accepted helper.
- [ ] **UNKNOWN — helper identities:** `auth.uid() → uuid`, `auth.jwt() → jsonb`, correct signatures/kinds/owners and required effective EXECUTE (B2.4/B3.5). Do not invoke them during collection.
- [ ] **UNKNOWN — managed policies/triggers/runtime:** owners/RLS flags, policy role/command metadata, noninternal triggers and provider Auth/PostgREST versions/provenance (B2.5/B2.6, D6). No managed-object change is authorized. Current exact-session/same-user verified TOTP semantics need later native rehearsal.

The four extra S4 B2.1 fields — `users.is_anonymous`, `users.deleted_at`, `users.banned_until`, `sessions.refreshed_at` — are context, not M1–M3 SQL column prerequisites. Accepted runtime non-anonymous/adult checks remain required, but do not make these table fields M1–M3 dependencies. M2 reads session identity; it creates no session FK. `sessions.id` uniqueness metadata is useful compatibility context, not an M5 FK-installation gate. Do not import M4/M5's all-column reads, managed-session locks or issuance behavior.

### C3. Privileges and ownership — G2/G4

- [ ] **UNKNOWN — executor and definer identity:** future runner/session/effective owner is explicitly named and matches observed metadata, or requires separately approved collection for that owner (B1.1/B3.1/B4.1). Migrations do not assign owners explicitly. Hosted `postgres` is not assumed superuser.
- [ ] **UNKNOWN — effective prerequisites:** database/schema/object creation, `auth` USAGE, `REFERENCES` on `users.id`, SELECT on managed columns actually used by M2/M3, helper EXECUTE, language USAGE and owner access to Portal tables/audit/trigger operations (B3.4/B3.5/B4.1/B5.3). Positive broad predicates may support narrower requirements; false broad predicates may need scoped column evidence rather than new grants.
- [ ] **UNKNOWN — escalation/defaults:** role flags, recursive membership/USAGE/SET paths, direct membership options, global defaults plus additive schema defaults and custom grantees (B3.1–B3.3/B4.2/B4.3). Ordinary callers must not acquire owner/trusted Auth/superuser/BYPASSRLS authority. Provider-managed authenticator membership needs interpretation, not automatic revocation.
- [ ] **UNKNOWN — Portal locks:** M3 locks `program_version`, `billing_reference` and `assessment_attempt` rows in guard paths; actual owner rights, ordering/visibility/timeouts remain for isolated rehearsal. No locks are attempted in metadata collection.

There is **no M1–M3 requirement for managed-session UPDATE, Auth-role hook EXECUTE, registry grants, sequence authority or forced-RLS generation-owner access**. S4 B3.4's `any_column_update` and `all_columns_select` are contextual output, not instructions to grant broad managed-table access. Owner status does not by itself prove all policy/trigger outcomes.

### C4. Migration ledger/history — G2/G3

- [ ] **UNKNOWN — existence/provenance:** distinguish absent namespace, absent ledger relation, empty existing ledger and recorded versions. B1.2 reports namespace/relation existence only; it reads no ledger rows. Prior absence is supplied context, not current history proof.
- [ ] **UNKNOWN — runner semantics:** intended runner/version, bookkeeping format, per-file commits, uncertain acknowledgement handling, ledger failure behavior, serialization and abort custody (D8). These require later approved isolated rehearsal, not a provider CLI invocation under collection scope.
- [ ] **UNKNOWN — drift disposition:** if any ledger or Portal installation appears, stop the initial-install premise and propose exact additional metadata/history reconciliation. Do not expand these 23 SELECTs into ledger-content or statement exports.

Only future successful M1/M2/M3 versions `20261006000100`, `20261006000200`, `20261006000300`, once and in order, belong in the accepted installation record, with external target/runner/source-hash evidence. Version numbers alone prove neither bytes nor installation. No pre-marking, repair, history deletion or blind retry; catalog and history are separate evidence.

### C5. Event-trigger effects — G2/G3/G4

- [ ] **UNKNOWN — attachment/provenance:** reconcile `public.rls_auto_enable()` signature/owner/SECURITY flag (B1.4) with every event trigger's attachment, owner, event, mode and command tags (B4.4).
- [ ] **UNKNOWN — behavior:** obtain a sanitized provider/operator explanation of relevant DDL effects. Names/flags do not prove harmlessness or equivalence to M2's RLS. Modes O/D/R/A and NULL tags require interpretation; NULL tags mean unrestricted tags, not disabled.
- [ ] **UNKNOWN — execution effects:** representative provider DDL behavior, default/grant interaction and unrelated-consumer impact remain for later isolated rehearsal.

An optional, separately named J2 sub-scope may permit the designated Human to privately inspect **only the already identified `public.rls_auto_enable()` definition** through an existing read-only object viewer and report a sanitized behavior/provenance summary. It permits no invocation, shared body/argument dump or wider source inspection. If safe private review is unavailable or other event helpers need review, leave UNKNOWN and return for a bounded provider/review proposal. No disable/replace/ACL repair is authorized.

### C6. RLS and API exposure — G4

- [ ] **UNKNOWN — actual exposure:** record Data API enabled state, exposed schemas, extra search path and catalog-versus-loaded configuration discrepancies (B5.2, D2). `portal_private` must remain unexposed; private-schema SQL USAGE is a distinct policy dependency.
- [ ] **UNKNOWN — final installed comparison:** after separately authorized installation, compare all 28 tables' RLS, exact policies/constraints/guards/ACLs and 23 routine signatures/definitions/owners/search paths. S4's managed-table policy/trigger queries do not inspect Portal policies or final Portal grants. Do not label these future facts PASS before objects exist.
- [ ] **UNKNOWN — alternate access:** operator inventory covers views, overloads/public wrappers, definer gateways, jobs/service paths and competing releases (B1.3/B1.4 plus D7). Names alone do not prove absence.

Expected accepted bounds: no anon Portal records; no ordinary domain DML; authenticated SELECT policies and exactly seven read-helper EXECUTE grants; ordinary denial of `staff_has` and M3 routines. Entitlement SELECT is limited to `id,workspace_id,program_version_id,status,created_at,updated_at`; raw billing/Stripe/staff/audit access stays denied to ordinary adults. M2 grants service-role domain SELECT/INSERT/UPDATE/DELETE but removes direct audit INSERT/UPDATE/DELETE; privileged custody/fencing remain mandatory. Positive/negative RLS and API proofs require later isolated/bounded validation, not production DML probes now.

### C7. Maintenance/fencing — G3

- [ ] **UNKNOWN — all paths and consumers:** inventory Portal entry/Data API, direct SQL, service clients, jobs/integrations, release automation, alternate wrappers and unrelated Auth/public/Storage/API consumers (D7).
- [ ] **UNKNOWN — planned fence and custody:** name maintenance owner, migration/abort operators and independent reviewer; define quiescence, competing-runner exclusion, approved numeric window/timeouts/abort limits and unrelated-workload impact (B5.1/B5.2, D7/D8).
- [ ] **UNKNOWN — effective denial:** later authorized rehearsal/proof must cover before M1, between files, after M3, failures and recovery. Metadata collection neither establishes nor probes a fence.

Data API-disabled context, schema absence, an application maintenance page or RLS alone is insufficient to fence privileged/direct writers. Keep the later approved fence until independent final review and separate reopening approval. Do not pause jobs, alter exposure or acquire locks in J2 collection.

### C8. Backup and recovery — G7

- [ ] **UNKNOWN — availability/point/coverage:** operator records actual backup/PITR availability and recovery-point metadata; database/ledger/roles/ACL/defaults/managed Auth coverage and provider-supported boundaries (D8). Supplied Free plan proves neither availability nor absence of backups.
- [ ] **UNKNOWN — separate assets/settings:** identify secure recovery custody for provider Auth/API/SMTP/URL configuration, environment/hosting artifacts and relevant Blob/Storage assets. No sensitive backup/settings export to this checklist.
- [ ] **UNKNOWN — restore readiness:** existing isolated restore evidence, RPO/RTO, downtime/data-loss/blast-radius bounds, operators/access and dependency-aware forward recovery; record absent evidence as UNKNOWN (D8/D9).

No backup download, creation, restore or recovery write is in the metadata scope. Earlier file commits survive a later rollback. Restore must reconcile managed Auth/session dependencies and unexpired tokens without claiming global invalidation; SNV04/SNV06 remain open. There is no HR03 generation-recovery requirement in this release. Any discovered generation/hook state is excluded drift requiring a Human disposition.

### C9. Configuration observations — G2/G5/G6/G8

- [ ] **UNKNOWN — current settings:** collect only the B5 allowlist and sanitized D1–D9 facts in Section F. Do not copy local TOML or infer active provider settings from catalog defaults.
- [ ] **UNKNOWN — accepted runtime compatibility:** six-digit numeric email OTP, existing-adult-only request behavior, production SMTP/recipient capacity, explicit HTTPS origins/redirect purposes, session/TOTP settings and Auth/PostgREST version evidence. Observations are not delivery/browser/native tests.
- [ ] **UNKNOWN — provider confirmation:** if versions/semantics are not displayed or available in an existing sanitized record, record UNKNOWN and identify the owner of a future bounded confirmation. No logs, management API, credential or secret retrieval.

Supplied eight-digit OTP, link template, no custom SMTP, 2 emails/hour, localhost Site URL and empty redirects are reusable conflict context. They require current observation and a separate reviewed change/validation proposal before use. They do not authorize changing code, template, SMTP, redirects, timeouts, hooks or API exposure.

## D. Exact mapping of all 23 existing result sets

Labels and SELECT definitions remain those in **S4 §§3–7**. The following table replaces their five-file acceptance interpretation only. **Every current hosted result is UNKNOWN**: a complete original execution bundle is not present in the inspected documents. Context in Section E is not a substitute. An explicitly empty, complete, successful grid differs from a missing grid.

| Result label | Collected metadata and category | Actual M1–M3 requirement / acceptance interpretation | Excluded/context fields and remaining limit | Current evidence |
| --- | --- | --- | --- | --- |
| **B1.1** | Time, database, session/effective role, engine and read-only guard; foundation/ownership. | Bind target/time/identity with D1; guard must be on. Owner must match the intended later runner for its privilege claims. | PG17.11/`postgres` alone do not identify project or prove runtime compatibility; five batches are separate snapshots. | UNKNOWN |
| **B1.2** | `public`, `portal`, `portal_private`, `supabase_migrations` existence/owners/counts and ledger existence; foundation/history. | Fresh reconciliation of initial-install premise; distinguish missing namespace/relation. Existing product state or ledger requires review. | Counts omit detailed definitions/ACLs/history rows; no whole-project empty-state claim. No private registry is expected. | UNKNOWN |
| **B1.3** | Exact relation-name matches across non-system schemas; foundation/drift. | Compare the 28 M1 table names, owners/kinds/location; investigate any pre-existing match before installation. | `write_session_generation` and `write_generation_seq` are excluded drift sentinels only. Name-only scan misses renamed/equivalent paths. | UNKNOWN |
| **B1.4** | Routine signatures/kinds/owners/languages/SECURITY/volatility; foundation/event effects/drift. | Compare 8 M2 + 15 M3 routines and separately reconcile known `public.rls_auto_enable()`. Unexpected overload/location requires review. | `assert_write_session`, `lock_status_authority`, `attestation_allowed`, both record RPCs and `issue_write_generation` are excluded sentinels, never prerequisites. No invocation/body/ACL proof. | UNKNOWN |
| **B2.1** | Fourteen managed columns, types/nullability/owners/RLS flags; Auth. | Required subset: `users.id`; five session fields and four factor fields in C2. Check real managed table kinds and compatible types, including nullable `not_after`. | Account flags and `sessions.refreshed_at` are context only; absent extras do not fail M1–M3. RLS flags do not prove owner read outcomes. | UNKNOWN |
| **B2.2** | Immediate valid nonpartial single-column ID uniqueness for users/sessions; Auth/FKs. | `users.id` usable uniqueness plus B2.1 UUID/non-null and B3.4 REFERENCES supports M1's target prerequisite. | `sessions.id` flag is identity context; no M1–M3 FK targets sessions. No attempted FK creation proof. | UNKNOWN |
| **B2.3** | Enum labels for session AAL and factor type/status; Auth. | M2 staff checks require compatible `aal2`, `totp`, `verified` values/semantics; `aal1` is ordinary runtime context. | If text/non-enum fields return no enum rows, do not presume incompatibility or compatibility; scoped type/constraint clarification may be needed. | UNKNOWN |
| **B2.4** | Zero-argument helper and UUID routine resolution; Auth/foundation. | `auth.uid` UUID, `auth.jwt` JSONB and trusted UUID return/resolution; cross-check privileges and actual runner search path. | No calls; Editor UUID resolution does not establish every runner's resolution. Shadow helper/generator requires STOP. | UNKNOWN |
| **B2.5** | Managed policy names/commands/permissiveness/role OIDs; Auth/RLS context. | Review users/sessions/factors policy effects on intended M2/M3 definer access without changing managed RLS. Cross-reference roles. | No expressions; empty rows do not prove access. Not a Portal-policy inventory and not hook compatibility proof. | UNKNOWN |
| **B2.6** | Noninternal managed triggers, enabled modes/events and function identity/SECURITY; Auth/lifecycle context. | Reconcile custom/provider lifecycle behavior and new users FK deletion effects with existing consumers. | No trigger bodies/args/invocation; neither empty nor populated metadata proves runtime effects. No generation cascade prerequisite. | UNKNOWN |
| **B3.1** | Relevant role existence/flags including current identity; privileges. | Confirm SQL-named `anon`, `authenticated`, `service_role` and intended owner; inspect ordinary/trusted separation. | `authenticator`, `supabase_auth_admin`, `pg_database_owner`, historical `postgres` remain provider/trust context. No new hook-specific role/grant demand. PUBLIC is ACL pseudo-role, not a required pg_roles row. | UNKNOWN |
| **B3.2** | Effective/transitive MEMBER/USAGE/SET predicates; privileges. | Evaluate ordinary-role paths into owner/trusted/superuser/BYPASSRLS authority and intended owner's effective rights. | Provider authenticator switching can be expected; special database-owner/superuser semantics need interpretation. No role switch performed. | UNKNOWN |
| **B3.3** | Direct membership admin/inherit/set options with custom names masked; privileges. | Explain direct/custom grants together with B3.1/B3.2; unknown custom paths cannot be dismissed. | OID masking protects identifiers but does not prove custom roles harmless. Missing direct pg_database_owner membership is not itself failure. | UNKNOWN |
| **B3.4** | Auth USAGE, SELECT/all-column SELECT, any-column UPDATE, ID REFERENCES by role; privileges/Auth. | Owner needs users ID REFERENCES (M1), used-column reads on sessions/factors (M2), users ID reads (M3), and auth USAGE. | Session REFERENCES/UPDATE and all-column reads are not required. Broad false predicates may leave used-column privileges UNKNOWN; no grant shortcut. Absent targets omit rows: cross-check B2/B3.1. | UNKNOWN |
| **B3.5** | Effective EXECUTE on zero-argument Auth helpers; privileges/Auth. | Confirm owner/accepted policy-execution callers have required helper execution without calling helpers. | Missing targets/roles can omit rows; cross-check completeness. No issuance hook or Auth-admin hook EXECUTE prerequisite. | UNKNOWN |
| **B4.1** | Database CREATE and existing public/Portal/Auth schema USAGE/CREATE; privileges/foundation. | Owner needs database CREATE for absent schemas and relevant existing object/namespace authority; M1 owns newly created schemas. | No Portal row when schema absent is expected. Do not demand CREATE on managed Auth or public to repair compatibility. No full future-object privilege proof. | UNKNOWN |
| **B4.2** | Current owner's global/built-in table/routine/sequence/schema default ACLs; privileges. | Assess additive exposure during M1→M2→M3, including custom grantees and global routine EXECUTE; compare accepted revokes. | Sequence defaults are context; no product sequence required. Editor owner defaults do not prove another runner's defaults or final ACLs. | UNKNOWN |
| **B4.3** | Current owner's existing schema-specific additive defaults; privileges. | Combine with global defaults for public/Portal/private; review unexplained custom grants and intermediate states. | Empty result/future schema absence does not eliminate global grants or prove future final rights. No defaults changed. | UNKNOWN |
| **B4.4** | All event-trigger names/events/modes/tags/owners/attached routine identity; event effects. | Reconcile relevant enabled migration-DDL effects and known RLS helper with C5/provider evidence. | Metadata-only; NULL tags do not mean inactive. No function body, ACL or execution-effect proof. | UNKNOWN |
| **B5.1** | Ten allowlisted Editor pg_settings values/units/sources; configuration/fencing. | Review engine, search path, row_security, replication role and isolation/timeouts for later runner/guard rehearsal and limits. | Snapshot wrapper uses REPEATABLE READ deliberately; it is not the later write execution setting. No hook timeout/issuance requirement or settings mutation. | UNKNOWN |
| **B5.2** | Selected role/database overrides only; configuration/API. | Reconcile owner/service path/isolation/timeouts and selected PostgREST schemas/search path with D2/D6 and intended runner. | Empty means no selected overrides, not no provider settings; catalog is not active loaded API state. No unrestricted config arrays or secret values exported. | UNKNOWN |
| **B5.3** | SQL/PLpgSQL existence/trust and current owner USAGE; foundation/privileges. | Both accepted languages must exist and be usable by the intended owner. | Editor identity must match owner or evidence is incomplete. No language installation authorized. | UNKNOWN |
| **B5.4** | Installed extension names/versions/schemas; configuration context. | Explain environment/UUID provenance together with B2.4; no accepted extension-install statement. | Extension inventory is contextual; do not require pgcrypto installation or infer Auth/PostgREST/hook compatibility. | UNKNOWN |

## E. Previously supplied hosted observations reusable as context

All rows below are **SUPPLIED BUT NOT REVERIFIED**. They are preserved with provenance, not relabelled current VERIFIED evidence. S6 supplied narrow absence observations; S7/S4 carried fuller catalog observations; S1/S3 carry later supplied project/Auth/settings context. Repeated descriptions are not independent observations. Original complete grids, exact observation timestamps, query coverage and evidence freshness remain UNKNOWN.

| Supplied observation | Reuse | Cannot establish |
| --- | --- | --- |
| AIEA Curriculum Platform; main/PRODUCTION; Free/us-east-2/t4g.nano; PG17.11; no replicas; 2 GB provisioned (S1/S3 C1). | Candidate target/environment and capacity context for D1/D6/D8. | Unique target, current load/headroom, supported recovery or native runtime semantics. Hosted “main” does not authorize Git HEAD. |
| Query role `postgres`; public owned by `pg_database_owner` (S7 §3, S4 §1). | Comparison context for B1.1/B1.2 and owner review. | Intended runner identity, unrestricted superuser or creation/FK/read rights. |
| `portal`/`portal_private` absent; no inspected tables/views/sequences; no expected Portal functions (S6/S7/S4). | Initial-install hypothesis for B1.2–B1.4. | Entire project empty, no Auth/Storage data, no earlier attempt/removal, no wrappers/equivalents or current absence. |
| Ledger relation absent (S6/S7/S4); S1/S3 also carry migration-schema absence. | History-reconciliation context; request separate schema and relation observations. | Empty existing ledger, known migration history, never-attempted SQL or permission to pre-mark versions. |
| `public.rls_auto_enable()` present (S7/S4). | Specific event-helper identity to reconcile via B1.4/B4.4/C5. | Attachments, enabled effects, safe behavior, grants or substituted M2 security. |
| Managed Auth structures/helpers/roles reported present (S1/S3). | Compare with B2/B3 and accepted used-column subset. | Exact current types/nullability/uniqueness, effective owner privileges, RLS/trigger outcomes or native staff assurance. |
| No Auth hook; Data API disabled (S1/S3). | D2/D3 context and baseline drift comparison. No custom hook needed. | A durable full fence, loaded exposure/search path, no direct writer or every future hook/consumer state. |
| Email enabled, OTP 8 digits/3600-second expiry, link template, no custom SMTP, 2 emails/hour (S1/S3). | Known conflict context for accepted six-digit numeric OTP/SMTP/recipient-capacity readiness. | Current settings, delivered mail, verification/replay behavior or approval to change anything. |
| Site URL localhost:3000; redirect allowlist empty (S1/S3). | Production URL/consumer review context for D4. | Approved production HTTPS origin/redirect purposes or hosted cookie/callback guarantees. |
| JWT lifetime 3600 seconds; replay detection enabled; reuse interval 10 seconds (S1/S3). | Auth policy context for D4/native validation planning. | Live session assurance for every write, global token invalidation, refresh-chain cascade or closure of SNV04/SNV06. |

Historical local PASS claims are **REPORTED BUT NOT RERUN**, not hosted metadata evidence. Preserve the five **NOTE — OPEN** findings `01B-A03`, `SNV02`, `SNV04`, `SNV05`, `SNV06` with their existing meanings; this checklist closes none.

## F. Accepted-only D1–D9 operator observations

These are read-only observation proposals, all **UNKNOWN currently**. Screenshots must be cropped/redacted; record configured/not configured rather than credentials. No Users/session/table-data pages, API-key/password panels, secret managers or raw logs are needed.

| Check | Exact future observation scope | Accepted-only interpretation / gap |
| --- | --- | --- |
| **D1** | Nonsensitive project/environment/database label; privately match approved unique target reference; time, Human operator, SQL Editor role. | G2 target binding for every result batch. UNKNOWN until current evidence. |
| **D2** | Data API enabled state, exposed schemas, extra search path, selected catalog override conflicts and provenance of loaded-state evidence. | G4; private schema excluded permanently. Observation does not open/disable API or prove a full fence. |
| **D3** | Existing hook kinds/type and sanitized target identity; operator-owned consumer/claim dependencies. | Context/drift only. **No future hook target requirement**. Any existing HR03/excluded hook needs STOP/reconciliation; unrelated hooks need compatibility review, not automatic removal. |
| **D4** | Auth signup/anonymous/phone/provider methods; sanitized Site URL/redirect purposes; JWT/session/replay settings and relevant MFA/TOTP configuration. | G5/G6 and existing-consumer compatibility; adult/TOTP boundary preserved. No login/logout/session/factor test or changes. |
| **D5** | Email enabled state; OTP length/expiry; numeric Token versus link template; SMTP configured state; approved sender/recipient policy and documented quotas/rate limits. | Six-digit accepted implementation and production SMTP prerequisite. No email send, token/credential capture or template edit. |
| **D6** | Auth/GoTrue and PostgREST versions/semantics only if displayed or in an existing sanitized provider record; identify confirmation owner otherwise. | G2/G8. PG version is not service-version proof; leave undisplayed versions UNKNOWN. No management API/log retrieval. |
| **D7** | Existing operator-owned inventory of other Auth/API/public/Storage consumers, claims, direct/service/job/integration writers, release automation and concurrent releases; nonsensitive dependency summary. | G3 fence design and impact review. No job payloads, query text, source/secret dumps, writer pause or denial probes. |
| **D8** | Backup/PITR availability and recovery-point metadata; existing coverage/restore-evidence references; proposed runner/version/owner, accepted three-file manifest, fence/abort/recovery custody, proposed RPO/RTO/window. | G2/G3/G7; no backup download/restore, runner launch, ledger read/repair, grant or configuration change. No generation recovery/issuance requirement. |
| **D9** | Existing separately approved isolated-environment availability and representative PG/Auth/PostgREST coverage; proposed synthetic rehearsal owner and known gaps. | G8 preparation only. No environment creation/tests here. Exclude M4/M5, forced-RLS registry and hook issuance tests. |

Frozen adult/tenant/cohort/exact-version boundaries, current verified TOTP staff assurance, immutable curriculum, audit/privacy and Section R commerce gates remain intact. HR01 requires explicit adult attestation, no mandatory evidence and idempotent completion; this release implements no completion capability. HR02 remains mandatory for protected writes; accepted 01C provides no Portal domain-write endpoint and no new universal session guarantee from read policies. Foundation installation is not provisioning, publication, entitlement creation, staff bootstrap or launch approval.

## G. Safe collection boundaries and exact future Human-operated scope

**No collection is authorized now.** The proposed J2 scope is limited to the following, only after Irene binds the final D7.4 digest and unchanged S4 digest to a written action decision:

1. **Target/operator:** one exact production project/environment/database, privately identified; one designated Human using an existing authenticated Dashboard SQL Editor session. Name SQL Editor session/effective role and intended future runner/owner. If different, do not switch roles or assume equivalence: owner-specific evidence stays UNKNOWN until a separately reviewed scope is approved. Record approved freshness/window and numeric collection/abort limits; values are not invented here.
2. **SQL allowlist:** only S4's unchanged five metadata batches, containing exactly B1.1–B1.4, B2.1–B2.6, B3.1–B3.5, B4.1–B4.4 and B5.1–B5.4. Preserve fixed literals, filters, output masks/allowlists and qualified built-in metadata/privilege/formatting functions. Keep each original REPEATABLE READ READ ONLY transaction and ending ROLLBACK. This checklist supplies no new SQL or execution command. S4's M4/M5 names/extra fields are harmless catalog context/drift checks with D's revised interpretation, never hook/registry requirements.
3. **Execution handling:** review complete original statement text before each batch. Human runs separately in order, with no concurrent release/configuration work. If Editor exposes only one grid, each unchanged labeled SELECT may be collected individually with the same original read-only snapshot wrapper and ROLLBACK; record separate attempt/snapshot times. Never imply a single common snapshot across batches/individual statements. No wrapper removal or query substitution. On error, only transaction ROLLBACK if needed; record sanitized error and stop that batch. Any new/revised SELECT requires separate preparation/review/approval.
4. **Settings/operator allowlist:** only Section F's D1–D9 sanitized observations, using settings panels and existing operator-owned records. No consumer outreach/messages are authorized by this checklist. The optional C5 private review of the single known event-helper definition must be explicitly included or omitted in J2; omitted/unavailable means behavior UNKNOWN. New provider contact/inspection is a separate bounded scope.
5. **Output:** all 23 result labels, column headers, complete grids or explicit UNKNOWN/error records; D1–D9 records; target/time/role/query-package digest/attempt provenance; expected-versus-actual discrepancy table with category, M1/M2/M3/context classification, sanitized evidence reference, reviewer and decision. Record observation age and intervening-change uncertainty. Redact unusual names/paths containing personal identifiers or secret material. No credentials are required from or delivered to the agent. Operator retains sensitive target references and any permitted private review in secure custody.
6. **Close collection:** ROLLBACK each metadata transaction, preserve sanitized evidence and return it to Irene for reconciliation. Unexpected objects/ledger are reported, not inspected with improvised new queries or repaired. No automatic rehearsal, installation, API exposure, configuration or deployment follows clean metadata.

The collection never reads records from managed Auth tables, Portal tables, Storage, Vault or migration-ledger contents; password catalogs; raw policy/view/routine definitions or trigger arguments; unrestricted configuration arrays; activity query text; connection strings, JWTs, API keys, SMTP/hook secrets or customer data. The sole optional private event-helper definition review is narrowly scoped above and is never a shared source export. Catalog relation counts count catalog objects, not application data rows.

No DML/DDL, DO/dynamic SQL, COPY, SELECT INTO, EXPLAIN ANALYZE, row lock, role switch, set_config, sequence allocation/reset, application/helper/hook invocation, network function, ledger repair, tests/fixtures/bootstrap, CLI linking/push/pull/dry run or configuration mutation is included. **Read-only wrappers are necessary but do not make arbitrary function calls safe**; the exact statement/function allowlist remains controlling. Ordinary catalog read locks/load and normal provider query logging can occur; approved limits/STOP handling must account for them.

## H. Missing evidence and what the 23 results cannot close

| Gap | Current classification | Required next evidence / decision |
| --- | --- | --- |
| Complete original 23-result bundle with query text identity, target/time/role/headers/completeness | UNKNOWN | J2 fresh Human collection, or originals with sufficient provenance/freshness. Carried summaries alone do not qualify. |
| Unique target, current catalog/history/previous-attempt provenance | UNKNOWN | D1/B1 and D7/D8; newly found objects/ledger require separately approved detailed reconciliation. No ledger rows in this scope. |
| Used-column types/constraints/helpers and effective owner rights | UNKNOWN | B2/B3/B4/B5; if broad predicates cannot answer used-column rights or text-type compatibility, propose a narrow follow-up rather than grants. |
| Final Portal ACLs/column grants/RLS/policies/constraints/indexes/triggers/definitions; renamed/dynamic/alternate writers | UNKNOWN | Operator inventory now; separate detailed existing-state review on discovery or post-install comparison later. B1 counts/names and Auth policy grids do not cover this. |
| Exact event-helper behavior/ACL impact and custom default/membership consequences | UNKNOWN | C5 sanitized provider/operator review, narrowly approved private review if applicable, then isolated representative proof. |
| Active Auth/PostgREST configuration/versions and actual staff/Auth semantics | UNKNOWN | D2/D4/D6 plus later separately approved native rehearsal. Catalog defaults/flags do not prove service behavior. |
| Owner/runner version, three-file commits/ledger/error/disconnect/concurrent-runner behavior | UNKNOWN | D8 proposal, then approved isolated rehearsal under D7.3 J3. No production trial or blind retry. |
| Effective maintenance, unrelated-consumer impact, numeric thresholds and abort custody | UNKNOWN | D7/D8 proposal and later independently verified fence under the applicable approval. Disabled API alone is insufficient. |
| Usable backup/coverage/point, restore proof, RPO/RTO/access/custody | UNKNOWN | D8 existing evidence and approved isolated recovery proof before production DDL. Free-plan context cannot close G7. |
| Current OTP/SMTP/URLs/capacity and hosted delivery/security behavior | UNKNOWN; dependent readiness BLOCKED by supplied conflicts | Observe D4/D5; separately review setting changes and bounded tests. No widening accepted OTP code or live Auth tests in J2. |
| Deployable accepted artifact/dependencies/toolchain, native hosted/browser proof, governed real delivery/commerce/privacy | UNKNOWN | Outside metadata scope; retain D7.3 G5–G9 and separate approvals. No tests/build/provisioning in this task. |

Absence of post-install evidence is expected before an initial installation, but must remain explicitly pending for later use. Metadata can support a decision about isolated rehearsal; it cannot alone authorize production DDL or launch. An absent excluded account field/session UPDATE grant/registry/hook is **EXCLUDED / CONTEXT ONLY**, not a missing accepted prerequisite.

## I. Explicit exclusions and STOP conditions

**Exclude completely from accepted prerequisites and installation:** M4 `20261008000100_portal_mission_status.sql`; M5 `20261008000200_portal_write_generation.sql`; HR03 `write_session_generation`, `write_generation_seq`, `aiea_write_generation` claim and generation gate/allocator; custom Auth hook `portal_private.issue_write_generation(jsonb)` requirements/activation; `assert_write_session`, `lock_status_authority`, `attestation_allowed`; `portal.record_mission_progress(...)` and `portal.record_cohort_delivery(...)`; all unaccepted 01D runtime endpoints/controls/shared-file versions. No five-file manifest, 29-routine/private-registry expected state, managed-session UPDATE/row-lock requirement, forced-RLS registry-owner proof, issuance atomicity or hook timeout/grant requirement carries into M1–M3.

An excluded name returned by a safe catalog query is a **drift finding**, not permission to drop it or install its dependencies. Unrelated existing hooks/objects must be reconciled for consumer/security impact; do not delete or replace them automatically. `mission_progress` and `cohort_mission_delivery` are accepted M1 tables; exclude their later write RPCs, not those tables.

| STOP | Trigger and required disposition |
| --- | --- |
| **STOP-01 — authority** | J2 absent, wrong operator/target/session, unapproved query/settings/private-definition scope or automatic next action. Stop the proposed action and return to Irene. Current D7.4 ends before collection. |
| **STOP-02 — evidence integrity** | Wrong/stale target, changed source/package digest, missing/truncated/denied grid, failed wrapper, error/timeout, or intervening catalog/configuration change. Mark affected evidence UNKNOWN; only scoped transaction cleanup, no query weakening/role switch. |
| **STOP-03 — installation/history drift** | Portal state, ledger, excluded object/hook/write RPC, collision/overload/wrapper, partial state or unexplained earlier application/removal appears. Stop initial-install assumptions; request a bounded reconciliation. No replay/pre-mark/drop/repair. |
| **STOP-04 — compatibility/privileges** | Required used-column/type/key/helper/language/creation/FK/read rights incompatible or unresolved, owner mismatch, shadow UUID resolution, ordinary escalation, unexplained custom defaults or event effects. Propose review; no managed-schema/owner/RLS/grant change. Context-only missing extras do not trigger this prerequisite STOP. |
| **STOP-05 — exposure/security** | Private schema exposed, unintended ordinary/raw billing/staff/audit/entitlement-column access, alternate domain-write path or weakened adult/tenant/TOTP/audit/frozen HR01/HR02 requirements. Stop dependent exposure/use; no new hook or excluded migration to compensate. |
| **STOP-06 — maintenance/runner** | Writer/concurrent release cannot be reconciled, proposed fence harms unrelated consumers without approval, per-file/ledger/abort semantics or thresholds unproven. Further production execution remains blocked; metadata does not activate or prove a fence. |
| **STOP-07 — recovery** | Backup/point/coverage/restore/access/RPO/RTO/custody unresolved or unusable. Production DDL remains blocked. No reset/drop/CASCADE/history deletion/restore as an improvised remedy. |
| **STOP-08 — configuration/use** | Current OTP/template/SMTP/recipient/URL/TOTP or runtime settings conflict with accepted use; required native/positive validation unavailable. Block dependent configuration/exposure/use approval; produce a reviewed proposal. No Auth tests, provisioning or settings repair during collection. |
| **STOP-09 — scope/sensitive data** | Obtaining evidence would require customer rows, secrets, broad definitions/logs/config dumps, credentials to agent, new SQL, locks, application-function calls, dependency/test/code work or production side effects. Leave UNKNOWN and request the smallest separate review scope. |

STOP does not authorize an emergency repair. Retain any already established approved fence; do not claim one exists from this document. Preserve sanitized evidence, stop the dependent action and return the discrepancy to Irene. Do not relabel UNKNOWN as PASS or import M4/M5 requirements to close a gap.

## J. Next Human approval checkpoint

**Recommended next decision: review/accept or revise D7.4, then decide whether to authorize D7.3 J2 — Human-operated metadata collection only.** Before any J2 use, Irene's decision must bind:

- The final reviewed D7.4 file digest, unchanged S4 digest, exact 23 SELECT labels/wrappers and D1–D9 allowlist; include/omit the optional single-function private review explicitly.
- Exact unique target/environment/database, designated Human operator/session/effective role, intended runner/owner comparison and reviewer.
- Observation window/freshness, collection limits/abort handling, sensitive-data custody/redaction, complete result/error evidence and STOP criteria.
- No migration, ledger-content expansion/repair, Auth hook activation, grant/RLS/owner change, API/configuration change, test/provisioning, dependency/build, deployment or Git publication; no automatic continuation.

Fresh accepted-only metadata is returned for discrepancy review. Irene may then consider **J3 isolated preparation/rehearsal** under its own concrete approval. **J4 M1–M3 production installation** remains a later independent checkpoint requiring source, privilege, runner/fencing, recovery and rehearsal proof. J5–J8 configuration/exposure/validation/deployment/release approvals remain separate. A clean metadata bundle does not combine or clear these decisions. No new approval is inferred from this recommendation.

## K. Local artifact and repository preservation

The only authorized new path is [this D7.4 checklist](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_4_Accepted_Only_Metadata_Evidence_Checklist_v1.0.md>).

Entry snapshot: branch `main`; HEAD `e1b2b8b0e880e2d5a277060514e9a8dac8ffdaa0`; **202 tracked files**, empty tracked/staged diffs and **six pre-existing nonignored untracked documents**. Their byte hashes are S1–S4/S6/S7 in Section B. Exact index SHA-256 at entry: `31037a7b891f11a5369b5f94a4b0ef187c8e1e7d0738b68f9ed3d805fe3c7e5e`.

**VERIFIED — local preservation and static artifact checks:**

- All **202 tracked files** and **six pre-existing nonignored untracked documents** retain their entry SHA-256 values. The sole new nonignored file is D7.4 at the authorized path. Existing metadata/reconciliation packages, application code, migrations, configuration and frozen artifacts are unchanged.
- HEAD, branch and the exact index SHA-256 remain unchanged. Tracked working-tree diff and staged diff remain empty; no staging, commit, push, merge or fetch occurred.
- Section D contains exactly all **23 distinct original result labels**, grouped 4/6/5/4/4, each with accepted-only interpretation and current UNKNOWN status. Section F covers all D1–D9 checks; Section C separates the nine requested categories. All **11 local Markdown file links** resolve.
- Source/manifest/frozen hashes reconcile with the inspected bytes and accepted Git source. No SQL blocks or execution commands were added. Verification is static file/status inspection, not a test suite, SQL parser/executor or production gate validation.
- No Supabase/hosted access, SQL execution, Auth hook/configuration change, dependency installation, tests, build, application/migration edit or deployment occurred. Only this new Markdown document was created/edited.

Final Git status (cached local origin comparison; no network fetch):

```text
## main...origin/main
?? docs/portal/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md
?? docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.json
?? docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.md
?? docs/portal/handoffs/AIEA_Portal_D7_3_Production_Readiness_and_Deployment_Safety_Plan_v1.0.md
?? docs/portal/handoffs/AIEA_Portal_D7_4_Accepted_Only_Metadata_Evidence_Checklist_v1.0.md
?? docs/portal/handoffs/AIEA_Portal_Hosted_Metadata_Preflight_Package_v1.0.md
?? docs/portal/handoffs/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md
```

The seven untracked paths comprise six pre-existing documents plus this single D7.4 addition. Human review must bind the final file bytes/digest; any subsequent edit requires refreshed verification/review. No production readiness follows from repository preservation.

**PRODUCTION REMAINS ON HOLD. STOP FOR HUMAN AUTHORITY REVIEW.**
