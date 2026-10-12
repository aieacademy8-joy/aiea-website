# AIEA Portal — D7.5 J2 Read-Only Collection Authorization Packet v1.0

Date: **2026-10-10 (America/Chicago)**. Repository: **aiea-website**.  
Human Authority: **Irene — Founder, AI Explorers Academy**.  
Mode: **LOCAL DOCUMENTATION ONLY**. Authority: **HUMAN APPROVAL REQUIRED**.  
**PRODUCTION: HOLD. J2 EXECUTION AUTHORIZATION: NOT GRANTED.**

## A. Authority and scope

This is a **proposed authorization packet** for D7.3 checkpoint **J2**, prepared under the Human instruction to create this one local document. It is not an execution authorization. **J2 execution remains unauthorized until Irene separately approves the completed packet**, binds its final bytes and source hashes, and completes the target, operator, reviewer, custody and collection-limit fields below. Document review alone does not grant J2 permission.

The exact accepted-only baseline is Sprint 01C commit **`079e7f2a13142e956a5766d6e9e17a1f94718f5f`**, tree **`7cac2a07bab9ed051737dcd150e7e7edc411879a`**, titled “AIEA Portal: accept Sprint 01C curriculum delivery shell.” Only **M1 → M2 → M3** are source-eligible migrations; none may be executed under J2. The accepted application boundary is protected adult entry and read-only context/curriculum delivery. Source eligibility does not authorize installation, exposure, configuration, deployment or launch.

**M4, M5, all 01D runtime additions/changed versions and HR03 are excluded.** This includes the generation registry/sequence/claim, generation allocator, `issue_write_generation` hook, `assert_write_session`, `lock_status_authority`, `attestation_allowed`, both later recording RPCs and progress/status endpoints or controls. Accepted M1 tables `mission_progress` and `cohort_mission_delivery` remain part of the baseline; their later write RPCs do not. There is no five-file, private-registry, managed-session UPDATE/lock or hook-issuance prerequisite for this release.

If separately authorized, the proposed J2 scope is one designated Human collecting the existing **23 labeled metadata results in five batches (4 + 6 + 5 + 4 + 4)** and **D1–D9** sanitized observations from one privately verified project/environment/database. Section F separately identifies the optional, single-function private review. All **D7.4 STOP-01 through STOP-09** remain controlling and are preserved verbatim in Section H.

No hosted gate is cleared here. Local byte/Git checks are **VERIFIED — local**; earlier hosted descriptions are **SUPPLIED BUT NOT REVERIFIED**; historical tests are **REPORTED BUT NOT RERUN**; missing, denied, stale or incomplete evidence is **UNKNOWN**. No UNKNOWN becomes PASS through document acceptance or a complete-looking summary.

Frozen adult/tenant/cohort/exact-version boundaries, current managed staff session with verified TOTP-backed `aal2` and capability, immutable curriculum, audit/privacy and Section R commerce gates remain intact. HR01 preserves explicit adult attestation, no mandatory evidence and idempotent completion; the accepted runtime implements no completion capability. HR02 remains mandatory for protected writes; accepted read policies do not establish a universal write-session guarantee. The existing notes `01B-A03`, `SNV02`, `SNV04`, `SNV05`, `SNV06` remain **NOTE — OPEN**.

## B. Source integrity

SHA-256 values below were calculated over the current, unmodified local file bytes, without newline or other normalization. The six requested source documents were inspected; none was edited.

| Ref | Local source | Current file-byte SHA-256 |
| --- | --- | --- |
| S1 | [D7.4 Accepted-Only Metadata Evidence Checklist](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_4_Accepted_Only_Metadata_Evidence_Checklist_v1.0.md>) | `f55bb500669544d7e87db97b80719ff2907e44b3c1c46eb811c324cf07d1ac3c` |
| S2 | [D7.3 Production Readiness and Deployment Safety Plan](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_3_Production_Readiness_and_Deployment_Safety_Plan_v1.0.md>) | `b523ca34538382eb711cf6460d1a10bc68a8193f6402d99cc368c69c9564e04f` |
| S3 | [Unchanged Hosted Metadata Preflight Package](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_Hosted_Metadata_Preflight_Package_v1.0.md>) | `b3f40c9446aaa10e9dffd6ab1d42eaf171e411b41c1bb5251ca59e4cf7b20fd7` |
| S4 | [D7.2 Markdown release manifest](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.md>) | `dccf26ffed4564700889e000e53aaa643d351c7adb3a107b6ef9dabfc8f53845` |
| S5 | [D7.2 JSON release manifest](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.json>) | `e1149899b0dceb126a240c5441e6483d0a133f788fe62872b9652eb681f779ed` |
| S6 | [Frozen P0 Architecture and Data Contract](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_P0_Architecture_and_Data_Contract_v1.0_FROZEN.md>) | `f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755` |

### Accepted migration identities — reference only, no execution

| Order | Exact accepted path | Accepted/current SHA-256 | Accepted Git blob / mode / bytes |
| --- | --- | --- | --- |
| M1 | [supabase/migrations/20261006000100_portal_domains.sql](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000100_portal_domains.sql>) | `f0bdbe5ed8f4f622362c0a6c149bc26644b06552b8a7358b8d792dbfe05a8464` | `636b7249d0567b303ae224b5bdb7be948563fc06` / `100644` / 23301 |
| M2 | [supabase/migrations/20261006000200_portal_security.sql](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000200_portal_security.sql>) | `b5afa539f70e34b6c22080a582de22cc484d294b8f368e11e08c141f745184d4` | `fb92aedf05064b6643ee6b02bd582407160a0b64` / `100644` / 10607 |
| M3 | [supabase/migrations/20261006000300_portal_guards.sql](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000300_portal_guards.sql>) | `8fababc9491321f176fcfbf5196ff44a98a41bd657d263a897f51498837bb486` | `8c09466bc685946b2e6cbeffc5cb2bb2ca3ab619` / `100644` / 27530 |

**VERIFIED — local source identity:** read the existing accepted commit/tree with local Git object inspection and compared all **181** S5 inventory entries to their paths, file modes, blob IDs, byte lengths and SHA-256 values. The accepted tree contains exactly the three migration paths above. Each current M1–M3 copy equals its accepted blob. S6 equals the accepted blob and original freeze commit **`052101670dc92b38c7ec15c88a2b07572e42d75b`**. S2–S6 hashes agree with S1's recorded source pins. The accepted commit is available in local history and is an ancestor of the present HEAD. No fetch or source extraction occurred. These checks establish bytes, not hosted compatibility or permissions.

**Known authority discrepancy — STOP on use:** the unchanged preflight's historical header names HEAD/01D and its prose proposes five migrations and HR03. Present HEAD **`e1b2b8b0e880e2d5a277060514e9a8dac8ffdaa0`** is not the accepted release source. Those historical assertions remain preserved; they supply no current authority. Use only S3's existing SQL collection blocks under S1's accepted-only interpretation and this separately approved scope. Following S3's five-file/hook procedures, defaulting to HEAD or importing M4/M5 prerequisites triggers STOP-01/STOP-03. No unexpected local pin discrepancy was found.

**Any discrepancy is STOP:** missing/changed source bytes, hash/mode/blob/path mismatch, a different accepted commit/tree, modified SQL/wrapper/allowlist, unknown extra input or unreconciled authority claim requires STOP-02 and return to Irene. Do not repair documents, SQL, permissions or history to make evidence fit. Recheck all Section B source hashes against the final approval immediately before any future collection; later edits invalidate the prior digest-bound review.

## C. Human operator checklist — incomplete, execution blocked

The supplied candidate target is **AIEA Curriculum Platform — main / PRODUCTION**. Supplied Free/us-east-2/t4g.nano/PG17.11 context is not current unique identity proof. Hosted “main” describes the candidate environment, not authorization to use Git HEAD. The source documents do not supply a verified unique project reference, current operator or independent reviewer. Irene is the decision authority; she is not assumed to be the collector, runner or reviewer.

| Required field / private check | Current value and completion requirement |
| --- | --- |
| Project display label | **AIEA Curriculum Platform — SUPPLIED BUT NOT REVERIFIED**; designated Human confirms the current label. |
| Exact hosted environment/branch | **main / PRODUCTION — SUPPLIED BUT NOT REVERIFIED; TO BE CONFIRMED** against Irene's intended target. |
| Organization and unique project reference | **TO BE CONFIRMED privately**. Match the existing Dashboard project reference/URL identity to Irene's separately approved reference in operator custody; match the selected environment/branch too. Record only a sanitized custody reference and confirmation outcome here. A display name, `postgres` or PG version alone is insufficient. |
| Intended database and Dashboard connection target | **TO BE CONFIRMED**. Historical context suggests database `postgres`; bind the actual selected database to the private project/environment and B1.1. |
| Designated Human collector | **TO BE CONFIRMED**: name, responsibility and existing authority to observe this target. No account creation, permission elevation or credentials supplied to the agent. |
| Dashboard access role and permission scope | **TO BE CONFIRMED** by the Human from existing access. Do not invent administrator status or change access. |
| SQL Editor session role / expected effective role | **TO BE CONFIRMED** separately. Historical query role `postgres` is context only; inspect the Editor's displayed connection/role and later compare B1.1 `session_role` and `effective_role`. No role switching. |
| Intended future migration runner / version | **TO BE CONFIRMED**; documentary identification only. Do not launch/link a runner or CLI in J2. |
| Intended future migration executor / object owner | **TO BE CONFIRMED**. Explicitly compare with Editor effective role; no assumed owner, superuser, BYPASSRLS or creation/FK/read rights. If different, owner-specific evidence remains UNKNOWN and needs a separately reviewed scope. |
| Independent reviewer | **TO BE CONFIRMED**: named person distinct from collector and future release operator/implementer; reviews sanitized complete evidence and discrepancies. This packet's static checks are not that person's signoff. |
| Approved collection window / freshness | **TO BE CONFIRMED**: start/end with timezone, maximum evidence age and change-recheck rule. No concurrent migration/configuration/release work; if serialization cannot be confirmed, STOP. |
| Numeric collection and abort limits | **TO BE CONFIRMED**: maximum per-batch/total elapsed time, statement/lock/idle stop thresholds, maximum attempts, result/export completeness limits and workload-degradation trigger. Observe existing timeout values; no timeout changes, lock probes or added monitoring queries. Unset limits block start. |
| Collection mode | Proposed: **five complete original batches, individually in order**. **TO BE CONFIRMED** by Irene. Individual-SELECT fallback from S1 §G/S3 §2 is allowed only if explicitly included in the final authorization; it uses identical statements and original wrapper and records separate snapshots. |
| Optional private review | Proposed: **OMITTED / NOT AUTHORIZED**. Irene must explicitly include or omit the one-function scope in Section F. |
| Evidence custodian, private target custody and sanitized handoff location | **TO BE CONFIRMED**: named custodian, access/retention/redaction rules, private identity-verification record reference and local Markdown destination. No secrets/customer records/logs are required. |
| STOP / cleanup custody | **TO BE CONFIRMED**: collector responsible for scoped transaction cleanup, person receiving the sanitized STOP report and explicit attempt/retry limits. Return to Irene; no emergency repair or automatic retry. |

Complete and independently review these fields before a J2 decision. Evidence may be UNKNOWN, but authorization-critical identities, scope, custody and numeric limits cannot remain UNKNOWN at execution start. Missing recovery/rehearsal/use evidence may be documented by D8/D9 without being invented; it keeps later dependent production actions blocked.

## D. Approved-query proposal — existing package only

**Proposed, not yet approved:** use only the unchanged SQL blocks in **S3 §§3–7**, with result interpretation from **S1 §D**. This packet contains no replacement SQL, new SELECT, expanded filter or rewritten query. All **23 original labeled SELECT statements** remain in S3 byte-for-byte, including nested catalog SELECTs, CTEs, literals, qualification, ordering, column projections, fixed allowlists and masking. Do not copy SQL from migration files or follow S3's historical installation/hook advice.

Every original block begins with **`BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;`** and ends with **`ROLLBACK;`**. Preserve both unchanged. Keep the fixed schema/object/role/column/function/settings allowlists and custom-role OID masking. B5.1's ten selected settings and B5.2's selected override keys must not become unrestricted configuration output. An excluded name returned by a catalog scan is a drift sentinel, not an installation requirement or permission to invoke it.

| Batch / existing source section | Required result label | Metadata covered; S1 accepted-only interpretation controls |
| --- | --- | --- |
| Batch 1 / S3 §3 | B1.1 | Observation time, database, session/effective role, engine, read-only guard. |
| Batch 1 / S3 §3 | B1.2 | Fixed namespace existence/owners/object counts and ledger relation existence only. |
| Batch 1 / S3 §3 | B1.3 | Exact relation-name matches across non-system schemas; excluded generation names are drift sentinels. |
| Batch 1 / S3 §3 | B1.4 | Routine identities/signatures/owners/security and known event helper; no body or invocation. |
| Batch 2 / S3 §4 | B2.1 | Fourteen managed-column metadata rows; only S1's ten used columns are M1–M3 prerequisites. |
| Batch 2 / S3 §4 | B2.2 | ID uniqueness metadata; users ID is the accepted FK target, session uniqueness is context. |
| Batch 2 / S3 §4 | B2.3 | Managed enum labels; no enum rows alone prove neither compatibility nor incompatibility. |
| Batch 2 / S3 §4 | B2.4 | Zero-argument helper/UUID resolution metadata; no helper or generator invocation. |
| Batch 2 / S3 §4 | B2.5 | Managed Auth policy metadata only; no expressions or Portal-policy completeness claim. |
| Batch 2 / S3 §4 | B2.6 | Noninternal managed trigger metadata only; no arguments/body or lifecycle proof. |
| Batch 3 / S3 §5 | B3.1 | Fixed relevant role existence/flags and current identity. |
| Batch 3 / S3 §5 | B3.2 | Effective/transitive membership predicates; no role switch. |
| Batch 3 / S3 §5 | B3.3 | Direct membership options with custom identities masked to OIDs. |
| Batch 3 / S3 §5 | B3.4 | Auth/schema/table/column privilege predicates; broad SELECT/UPDATE/session REFERENCES fields are context where not required. |
| Batch 3 / S3 §5 | B3.5 | Auth-helper effective EXECUTE predicates; no calls and no hook grant prerequisite. |
| Batch 4 / S3 §6 | B4.1 | Database CREATE and existing fixed-schema privilege predicates; no creation. |
| Batch 4 / S3 §6 | B4.2 | Current effective owner's global/built-in defaults; masked custom grantees. |
| Batch 4 / S3 §6 | B4.3 | Same owner's existing schema-specific additive defaults; empty does not remove global defaults. |
| Batch 4 / S3 §6 | B4.4 | Event-trigger attachment, mode/tags/owner/function identity; no event helper invocation. |
| Batch 5 / S3 §7 | B5.1 | Ten fixed current Editor settings; snapshot isolation is not future runner isolation. |
| Batch 5 / S3 §7 | B5.2 | Selected role/database overrides only; catalog does not prove active loaded API state. |
| Batch 5 / S3 §7 | B5.3 | SQL/PLpgSQL metadata and current effective owner's usage predicates. |
| Batch 5 / S3 §7 | B5.4 | Extension names/versions/schemas only; no extension installation/function call. |

Count: **23 distinct required result sets — 4 / 6 / 5 / 4 / 4**. Current evidence for every label is **UNKNOWN / NOT COLLECTED IN D7.5**. Expected foundation remains 28 M1 tables and 23 M2/M3 routines; those counts are distinct from the 23 metadata result labels and do not prove final installation.

## E. Future Human execution instructions — only after authorization

**These are future instructions, NOT permission to execute now.** No navigation, hosted observation or SQL was performed while preparing this packet. The navigation describes the existing Dashboard workflow; current panel availability/labels have not been verified live. If the intended connection, role, read-only viewing or results controls cannot be identified safely, STOP and report UNKNOWN.

1. **Confirm authorization before opening collection.** Read Irene's separate signed/dated J2 action decision and compare the final packet/source hashes, operator, reviewer, target, approved mode/window/limits and optional scope. Verify the six Section B document hashes locally. Verify the unique project identity privately; do not put the project reference or credentials into chat. Approval of DOCUMENT REVIEW in Section I alone is insufficient.
2. **Navigate to the approved project.** In the Human's existing authenticated Supabase Dashboard, use the project selector to select **AIEA Curriculum Platform**, privately match its unique reference and organization, and confirm **main / PRODUCTION** and the approved database/connection target. Do not select another branch or create an environment. Record D1's sanitized confirmation and timestamp. Do not open Users, sessions, table-data, API-key, connection-password or secret panels.
3. **Open the query workspace.** In that selected project's sidebar choose **SQL Editor**, then its **New query** action to open an empty editor. Inspect the displayed database/connection and execution role without changing roles. A provider example/template, existing saved query or migration file is not an approved input. If the displayed role/connection disagrees with Section C, STOP before Run.
4. **Inspect one complete original batch before execution.** Open the local S3 document, locate the relevant §3–7 SQL block and review all of it. Copy only that block into the empty Editor, preserving comments, every labeled statement, all predicates/allowlists/masks and both transaction endpoints. Compare the pasted text with S3 from first line through final ROLLBACK; confirm the expected label count for that batch. Check the editor has no appended template, extra statement, migration or selected-text execution scope. Do not rewrite a failed query, remove wrappers, add a row limit, change role/timeouts or use an AI query generator.
5. **Run one approved metadata batch.** Only after steps 1–4 and within the approved limits, use the Editor's **Run** control for the entire reviewed block, including its opening READ ONLY transaction and ending ROLLBACK. Do not execute highlighted fragments accidentally. Start with Batch 1; validate B1.1's database/session/effective role and `read_only_guard = on` against the authorization before proceeding. A wrong identity/guard or any other STOP finding ends collection. Never run all five blocks as one combined transaction or mix in another query.
6. **Capture every result before replacing the editor contents.** Inspect every SELECT result grid/tab in order and associate it with its unchanged B-label. Copy each complete grid with its exact column headers into the local Markdown handoff, or reference a complete sanitized local text capture held under approved custody. Inspect all rows/pages; use a results export only if it contains the complete approved metadata grid and no extra diagnostic material. Record actual row count or UNKNOWN, capture method and complete/truncated/unavailable status. Record **EMPTY — 0 rows** with headers for a successful empty result; record **ERROR / NOT RETURNED / UNKNOWN** separately for failed or missing grids. A ROLLBACK command status is not a SELECT result set. Do not treat the last visible grid as evidence for all labels.
7. **If only one grid is available, do not infer the others.** Stop the incomplete batch and mark uncaptured labels UNKNOWN. S1 §G/S3 §2 permit the existing individual-SELECT method: each unchanged labeled SELECT with its comment uses the same original opening READ ONLY wrapper and closing ROLLBACK. Use that method only when Irene's final decision explicitly includes it and any required additional attempts fit the approved limits. Do not generate or modify SELECTs. Each individual collection is a separate attempt/snapshot; preserve all 23 labels and their own times/roles. Otherwise return the limitation for a bounded decision.
8. **Handle STOP, errors and cleanup.** On error, timeout, denial, truncation, drift, role/guard mismatch, intervening changes or exceeded limits, stop further batches; capture a sanitized error, affected label(s), timestamp and observed transaction outcome. If the same session is known to have an open or aborted transaction, the only additional SQL permitted is the existing **`ROLLBACK;`** cleanup. Do not execute it in a guessed/different session. Record cleanup as confirmed or UNKNOWN. On disconnect or uncertain session continuity, STOP and leave the outcome UNKNOWN for the Human; do not reconnect and blindly replay, COMMIT, repair or assume rollback. No automated retry; any approved unchanged retry has a new attempt ID and snapshot and retains the failed evidence.
9. **Close one batch, then consider the next.** Confirm the block's ending ROLLBACK/transaction closure and the batch's complete result inventory before any next approved batch. Check target/role/window/change uncertainty again. The proposed order is Batch 1 → 2 → 3 → 4 → 5, each separately, with no concurrent release/configuration work. Five batches are five snapshots; never claim a single snapshot across them. A later ROLLBACK neither repairs a prior error nor reverses any pre-existing committed migration.
10. **Observe and hand off.** Collect only Section F's permitted read-only facts within the approved scope, then review/redact all outputs before placing them in the approved local Markdown destination. Keep sensitive target/operator context privately. Return the sanitized package and discrepancy table to Irene and the designated reviewer. Stop after collection; no J3/J4 or operational continuation follows, even if every returned grid looks satisfactory.

No screenshots are required. Do not reveal/copy secret fields; configured/not configured is enough. Do not share passwords, connection strings, API/publishable/service keys, JWTs, SMTP credentials, hook secrets, personal identifiers, signed URLs, customer rows or raw logs. Preserve custom-role OID masks; redact unusual returned catalog identifiers containing personal/secret material without guessing a replacement. Label the redaction and retain only permitted private context under the named custodian. If complete safe evidence cannot be obtained, use UNKNOWN and STOP-09.

The original wrappers are necessary but do not make arbitrary SELECT/function calls safe. Ordinary catalog read locks, load and normal provider query logging may occur; collection limits apply. This proposal does not require logs, active-query inspection or new load/lock/monitoring SQL.

## F. Dashboard observations — D7.4 D1–D9 mapping

**Required observation/report entries:** all D1–D9 below must be present in the proposed evidence handoff, with source/time/operator and VERIFIED by the named Human, REPORTED with provenance, or UNKNOWN. UNKNOWN is acceptable when a noncritical fact is not safely displayed or available; it never closes its dependent gate. Required identity/authorization fields in Section C must be confirmed before execution. Use only read-only settings panels and existing operator-owned sanitized records. Panel labels may vary; unavailable facts remain UNKNOWN. **Do not change, save, toggle, activate or test any setting.**

| D7.4 check | Future navigation / existing record and required sanitized observation | Boundary and accepted-only interpretation |
| --- | --- | --- |
| D1 | Selected project's identity/environment context and SQL Editor connection/role display; private unique-target match, database, time and named operator. | Binds every batch to the approved target. Current supplied name/main/PRODUCTION/`postgres` context is insufficient. No password/key retrieval. |
| D2 | Project settings' Data API/API configuration view: enabled state, exposed schemas, extra search path and available provenance of loaded-state facts; compare selected B5.2 overrides. | `portal_private` must remain unexposed. Catalog defaults do not prove loaded state or a complete fence. Do not open/disable API or save settings. |
| D3 | Authentication's existing Auth Hooks configuration view plus existing operator-owned dependency record: hook kinds/type, sanitized target identity and claim/consumer dependencies. | No future hook target requirement. Existing HR03/excluded hook means STOP/reconciliation; unrelated hooks require compatibility review. No enable/replace/remove action or secret URL/body export. |
| D4 | Authentication configuration views for signup/anonymous/phone/provider methods, URL Configuration, session/JWT/replay policy and MFA/TOTP; existing sanitized consumer record. | Record sanitized Site URL/redirect purposes and relevant policy facts. Preserve adult/TOTP and existing-consumer boundaries. No login/logout, session/factor operation, provider test or configuration change. |
| D5 | Authentication email/template and SMTP configuration views and existing sender/recipient/quota records: email enabled, OTP length/expiry, numeric Token versus link template, SMTP configured state and documented rate limits. | Compare accepted six-digit numeric OTP and production SMTP needs. Supplied 8-digit/link/no-SMTP conflicts remain context until observed. No send, test, token capture, credential reveal or template edit. |
| D6 | Versions displayed in existing Dashboard views or existing sanitized provider records: Auth/GoTrue and PostgREST versions/semantics, provenance and confirmation owner if unavailable. | PG version is not service-version proof. Undisplayed/unavailable facts UNKNOWN. No management API/log retrieval or new provider contact. |
| D7 | Existing operator-owned inventory of Auth/API/public/Storage clients, claims, direct/service/job/integration writers, automation and concurrent releases. | Provide a nonsensitive dependency summary for later fence/impact review. No job payloads, source/query-text/secret dumps, consumer messages, writer pause or denial probe. |
| D8 | Database backup/PITR metadata view and existing recovery/restore records; existing runner proposal/version/owner, accepted three-file manifest, maintenance/abort/recovery custody and proposed RPO/RTO/window. | Record availability/point/coverage and references, or UNKNOWN. No backup creation/access/download/restore, runner launch, ledger-content read/repair, grant or setting change. No generation recovery requirement. |
| D9 | Existing separately approved isolated-environment and synthetic rehearsal proposal records: environment availability, representative PG/Auth/PostgREST coverage, owner and known gaps. | Preparation facts only. No environment creation, connection/tests/build/rehearsal here. M4/M5, forced-RLS registry and issuance tests remain excluded. |

### Optional single-function private review — distinct sub-scope

Default proposal: **OMITTED / NOT AUTHORIZED**. It is not a tenth required Dashboard check and must not be inferred from D6 or B4.4. Irene may explicitly include only private inspection of the already identified **`public.rls_auto_enable()`** definition by the designated Human through an existing read-only object viewer, as permitted by S1 §C5/§G. Confirm the exact schema/name/signature from metadata; do not invoke it, inspect a wider source set or export its body/default arguments/trigger arguments. Return only a sanitized behavior/provenance/attachment summary and reviewer disposition. If safely available viewing cannot be established, leave behavior UNKNOWN and STOP for a separate bounded review proposal. No new query or provider outreach is included; no disable/replace/ACL repair follows.

## G. Evidence handoff — concise local Markdown

A **local Markdown handoff in the approved custody location** is sufficient; do not paste long grids into chat. This preparation task creates no evidence handoff file. Future collection must list all 23 labels and D1–D9 even when results are empty, errored, unavailable or not attempted. Include complete sanitized grids with headers in that handoff or reference their complete sanitized local capture under the same approved custody. A summary alone does not replace a missing grid. No screenshots, secrets, customer data, raw logs or unrestricted exports are required.

Use this reporting template, repeating the result row for every original label and the grid section for each returned result. Copy the complete label inventory from Section D. Use ISO 8601 timestamps with offset and identify America/Chicago when used; an unavailable timestamp/role/count is UNKNOWN, never inferred from another batch. B1.1's observed context applies to its snapshot only; without later in-snapshot context, document displayed role/session continuity and any uncertainty rather than adding a context query.

```markdown
# J2 accepted-only metadata evidence — [collection ID]
- Authorization: [Irene's separate J2 decision/date/reference; NOT GRANTED if absent]
- Final packet SHA-256: [external final-file digest or UNKNOWN]
- Accepted source: 079e7f2a13142e956a5766d6e9e17a1f94718f5f; M1–M3 only
- Source hashes: [Section B values rechecked; differences or UNKNOWN]
- Target label/environment/database: [sanitized approved values or UNKNOWN]
- Private unique-target confirmation: [confirmed by/date/custody ref or UNKNOWN]
- Human collector / independent reviewer / evidence custodian: [names or UNKNOWN]
- Window/freshness/limits/mode: [approved values/reference or UNKNOWN]
- Future runner/version/owner and Editor comparison: [values or UNKNOWN]
- Intervening changes/session uncertainty: [none observed with basis, or UNKNOWN/details]
- Optional public.rls_auto_enable() private review: [OMITTED / explicitly authorized reference]

| Batch | Attempt / snapshot | Result label | Observed/capture timestamp + offset | Session role / effective role + basis | Status / completeness | Rows | Sanitized grid reference | Error / SQLSTATE if displayed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Batch 1 | [ID] | B1.1 | [time or UNKNOWN] | [values or UNKNOWN; B1.1/Editor display] | [COMPLETE / EMPTY / ERROR / TRUNCATED / NOT RETURNED / NOT ATTEMPTED / UNKNOWN] | [count or UNKNOWN] | [local ref or UNKNOWN] | [none observed / sanitized error / UNKNOWN] |

## Result [B-label] — [attempt ID]
- Exact query source: unchanged preflight [section], matching approved S3 hash
- Column headers: [all original headers, or UNKNOWN if unavailable]
- Complete sanitized grid: [Markdown table or complete local text capture reference]
- Empty result: [EMPTY — 0 rows only when successful and complete]
- Redactions / missing portions / error: [description or UNKNOWN]

| Batch / attempt | Start/end capture time | Expected / captured / complete result counts | Wrapper / guard evidence | Ending ROLLBACK / cleanup outcome | Errors / limits / STOP |
| --- | --- | --- | --- | --- | --- |
| [batch/ID] | [times or UNKNOWN] | [4/6/5/4/4 expected; actual or UNKNOWN] | [observed status/basis or UNKNOWN] | [confirmed / UNKNOWN with basis] | [sanitized details] |

| Dashboard check | Timestamp | Observation + provenance / evidence ref | Status | Gap / dependent gate |
| --- | --- | --- | --- | --- |
| [D1 through D9, one row each] | [time or UNKNOWN] | [sanitized fact or UNKNOWN] | [VERIFIED by named Human / REPORTED / UNKNOWN] | [detail] |

| Discrepancy / STOP ID | Category / M1–M3 prerequisite or EXCLUDED/CONTEXT | Expected versus observed / UNKNOWN | Evidence ref | Reviewer | Irene's disposition / next proposal |
| --- | --- | --- | --- | --- | --- |
| [ID or none observed with limits] | [classification] | [detail] | [local ref] | [name or UNKNOWN] | [PENDING; no action inferred] |

- Bundle completeness: [23 labels and D1–D9 accounted for; complete/empty/error/missing counts]
- Observation age / change uncertainty: [values/basis or UNKNOWN]
- Production HOLD; no migrations/config changes/tests/deployment; no J3/J4 continuation
- J2 RESULTS REVIEW: PENDING IRENE; no gate closure inferred
```

Record the original failure and each approved retry independently. Empty, missing and permission-denied are different evidence states. Record wrapper/transaction uncertainty explicitly; cleanup confirmation is not a database-wide rollback claim. Review discrepancies against S1 §D/§F and M1–M3, not S3's superseded five-file acceptance prose. Metadata alone cannot prove native Auth/TOTP behavior, final installed Portal policies/ACLs/guards, fencing, recovery, delivered OTP or launch readiness.

## H. Safety and STOP conditions

The following **D7.4 §I STOP table is preserved verbatim**. It is not replaced by a new numbering scheme or a weaker summary.

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

STOP does not authorize an emergency repair. Preserve sanitized evidence and any already established approved fence; do not claim this packet establishes one. Stop the affected collection/dependent action and return to Irene. Missing backup/rehearsal/configuration-use evidence leaves its later action blocked; it is not permission to perform that action in J2.

**Prohibited in preparation and J2:** migrations; DDL/DML; grants/revokes/owner/default-ACL/RLS changes; Auth helper, UUID generator, Portal routine, hook or event-helper invocation; hook activation/replacement; API exposure/configuration changes; tests/builds/dependency installation; environment creation; deployment; provisioning/bootstrap/seeds; backup creation/download/restore; ledger-row/statement export or repair; role switching; DO/dynamic SQL/COPY/SELECT INTO/EXPLAIN ANALYZE; explicit row locks; `set_config`; sequence operations; network functions; management API or raw logs; customer Auth/Portal/Storage/Vault rows; password catalogs; raw definitions/arguments except the separately authorized private single-function review in Section F. The original transaction wrappers and scoped ROLLBACK cleanup are the only transaction-control allowance.

No CLI linking/push/pull/dry run, Git staging/commit/push/merge/fetch or configuration/Auth-hook action is authorized. No consumer/provider messages are authorized. **There is no automatic continuation to J3 or J4**, or to later configuration, exposure, validation, deployment or release checkpoints. Clean metadata is evidence for Irene's next decision only.

## I. Approval form — three separate decisions

### DOCUMENT REVIEW

**Status: PENDING HUMAN REVIEW.**

- Irene's decision: **TO BE CONFIRMED — accept / revise / reject**.
- Reviewed D7.5 final file-byte digest: **TO BE CONFIRMED** in the external review/decision record after the packet is final; a self-referential hash is not embedded here.
- Review of Section B source hashes, accepted-only scope, legacy discrepancy, all STOP conditions and outstanding fields: **TO BE CONFIRMED**.
- Reviewer/name, timestamp with timezone and decision reference: **TO BE CONFIRMED**.
- Document acceptance alone grants **no hosted access and no J2 execution**.

### J2 EXECUTION AUTHORIZATION

**Status: NOT GRANTED. This form is blank; no signature or approval is inferred.**

Irene must make a separate explicit action decision binding all items below to the completed packet. General document acceptance or “looks good” is insufficient. Any later change to bound source/packet bytes, target/operator/role, scope, custody or limits requires renewed review and authorization.

| Required explicit Human approval | Current disposition |
| --- | --- |
| Final D7.5 digest and all six final Section B source hashes, especially D7.4 and unchanged preflight; accepted commit/tree and M1–M3 pins/order | **TO BE CONFIRMED / NOT APPROVED** |
| Acceptance of the preserved five SQL blocks, exactly 23 original labels/statements, original wrappers, fixed allowlists/masks and S1 accepted-only interpretation; approved full-batch or explicitly included individual-SELECT mode | **TO BE CONFIRMED / NOT APPROVED** |
| Exact project/environment/database and private unique-identity confirmation/custody reference | **TO BE CONFIRMED / NOT APPROVED** |
| Designated Human collector, existing Dashboard permission scope, session/effective role, intended future runner/version/owner comparison and distinct independent reviewer | **TO BE CONFIRMED / NOT APPROVED** |
| Required D1–D9 observation scope; explicit INCLUDE or OMIT for only `public.rls_auto_enable()` private review | **TO BE CONFIRMED / NOT APPROVED**; optional scope proposed OMITTED |
| Evidence custodian, approved local handoff/private-context locations, access/retention/redaction, complete grids/empty/error/UNKNOWN handling and no secret/customer/log delivery | **TO BE CONFIRMED / NOT APPROVED** |
| Collection start/end/freshness and numeric per-batch/total/attempt/abort/completeness/workload limits, concurrency exclusion, cleanup custody and all STOP criteria | **TO BE CONFIRMED / NOT APPROVED** |
| Read-only metadata/settings observation only; no migration/DDL/DML/helper invocation/grants/hooks/config/test/build/deploy/Git publication; no J3/J4 continuation | **TO BE CONFIRMED / NOT APPROVED** |

- Irene's explicit authorization decision and permitted actions: **NOT GRANTED**.
- Irene's signature/name, timestamp with timezone, decision reference and expiry/window: **TO BE CONFIRMED**.
- Collector's acknowledgment of exact target/roles/queries/custody/limits/STOP: **TO BE CONFIRMED**.
- Independent review of the completed authorization fields: **TO BE CONFIRMED**.

Until these are completed and separately approved, **STOP — do not navigate for collection or run SQL**. No automatic action is attached to this form.

### J2 RESULTS REVIEW

**Status: NOT STARTED / NO J2 RESULTS COLLECTED IN D7.5.**

- Future bundle reference/digest, collection decision reference and completeness of 23 labels plus D1–D9: **TO BE CONFIRMED**.
- Independent reviewer, provenance/freshness/roles, expected-versus-observed discrepancies, UNKNOWNs/errors/redactions and STOP dispositions: **TO BE CONFIRMED**.
- Irene's results decision, timestamp and follow-up scope: **TO BE CONFIRMED**.
- Accepting results grants no J3 isolated preparation/rehearsal or J4 production installation authority. Each remains a separate D7.3 checkpoint requiring a concrete reviewed package and explicit Human approval.

## J. Final status and repository preservation

**PRODUCTION: HOLD. 01D: EXCLUDED. J2: NOT AUTHORIZED AND NOT EXECUTED.**

This task created only [this new D7.5 Markdown packet](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_5_J2_Read_Only_Collection_Authorization_Packet_v1.0.md>). Entry state: branch **`main`**, HEAD **`e1b2b8b0e880e2d5a277060514e9a8dac8ffdaa0`**, **202 tracked files**, **seven existing nonignored untracked documents**, no tracked/staged changes. All **291 existing workspace files**, including ignored files and excluding `.git`, were hash/mode or symlink-target recorded before creation. Entry index SHA-256: **`31037a7b891f11a5369b5f94a4b0ef187c8e1e7d0738b68f9ed3d805fe3c7e5e`**.

Final local preservation verification compares that snapshot with the completed file: branch/HEAD/index unchanged; all tracked files and seven existing untracked documents unchanged; all other pre-existing workspace files unchanged; no deletions; exactly one new file at the authorized path. Source hashes in Section B, all 23 original query labels/wrappers and verbatim D7.4 STOP-01 through STOP-09 are checked by static file/Git inspection only. This is not SQL execution, a test/build or hosted gate validation.

**No Supabase connection, Dashboard/hosted access, SQL execution, dependency installation, tests/builds, migration, application/configuration edit, Auth-hook operation, staging, commit, push, merge, fetch or deployment occurred.** No existing source document was changed and no evidence handoff was created. J2 results remain UNKNOWN; approvals remain pending.

**STOP — awaiting Irene's Human review. No further action is authorized.**
