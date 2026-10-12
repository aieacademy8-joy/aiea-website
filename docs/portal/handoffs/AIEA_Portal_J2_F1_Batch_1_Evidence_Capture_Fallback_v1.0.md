# J2-F1 FALLBACK PREPARATION REPORT

## Executive summary

Date: **2026-10-10 (America/Chicago)**. Platform: **AIEA Curriculum Platform**. Final Human authority: **Irene**. Mode: **LOCAL DOCUMENTATION ONLY**.

**PASS — local fallback preparation. HOLD — fallback use, J2 SQL execution and production.** Irene authorized preparation of this one document. SQL execution is **NOT AUTHORIZED**, and this report grants none. The existing SQL package and existing documentation remain unchanged.

The fallback design collects **B1.1–B1.4 individually**, each exact original SELECT/CTE statement and its original comment enclosed by the exact original `BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;` and `ROLLBACK;`. This preserves statement bytes but changes execution grouping: **four transactions, four snapshot contexts and four individual collection attempts**, under S3 §E.7. It therefore **cannot operate under the approved maximum of one attempt**. Missing grids after a primary run require immediate STOP; switching to individual execution is not an authorized recovery step.

**Completion within the approved 60 seconds: UNKNOWN.** No execution timings, actual result sizes, verified capture path, cancellation guarantee or session behavior are available. Neither four separate 60-second allowances nor a timing guarantee is inferred. All future instructions below are conditional on a new, explicit, digest-bound Human action decision.

Accepted scope: **M1–M3 only**, with accepted Sprint 01C identity `079e7f2a13142e956a5766d6e9e17a1f94718f5f` carried from S2/S3. **M4/M5, HR03 and the custom Auth hook remain excluded.** Existing excluded names in the unmodified catalog filters remain drift sentinels; they are not installation requirements or callable targets. This report covers Batch 1 only, four of the full package's **five batches / 23 labeled results**. It authorizes no later batch or D1–D9 collection.

## 1. Source references and SHA-256 digests

Repository root: `/Users/dosfam/Desktop/AIEAcademy/Website/2.0`.

Digests are SHA-256 of exact local file bytes, without newline normalization. S1–S4 were inspected for this procedure. S5–S8 were only hash-rechecked as supporting pins in S3; this report does not rerun their accepted-source or behavioral verification.

| Ref | Local source | Use / inspection extent | File-byte SHA-256 |
| --- | --- | --- | --- |
| S1 | [J2 preparation report](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_J2_Preparation_Readiness_Report_v1.0.md>) | Inventory, capped-result analysis, proposed capture and fallback limits | `963208ca516d5f9aec666564f67eccb841444532ecf973cbfccce9070b41de72` |
| S2 | [D7.4 checklist](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_4_Accepted_Only_Metadata_Evidence_Checklist_v1.0.md>) | §D accepted-only interpretation; §G collection boundary; §I STOP-01–STOP-09 | `f55bb500669544d7e87db97b80719ff2907e44b3c1c46eb811c324cf07d1ac3c` |
| S3 | [D7.5 authorization packet](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_5_J2_Read_Only_Collection_Authorization_Packet_v1.0.md>) | §§C/E/G/H/I: operator fields, individual attempts, custody, STOP and separate approval | `04d2ae574bc93b6432c5e124852b8388920045ca89e81bb8c687f44f5ccd434d` |
| S4 | [Approved metadata preflight package / unchanged SQL source](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_Hosted_Metadata_Preflight_Package_v1.0.md>) | §3, Batch 1 lines 52–134; §2.4 original fallback proposal | `b3f40c9446aaa10e9dffd6ab1d42eaf171e411b41c1bb5251ca59e4cf7b20fd7` |
| S5 | [D7.3 safety plan](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_3_Production_Readiness_and_Deployment_Safety_Plan_v1.0.md>) | Supporting S3 source pin; byte recheck only in J2-F1 | `b523ca34538382eb711cf6460d1a10bc68a8193f6402d99cc368c69c9564e04f` |
| S6 | [D7.2 Markdown manifest](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.md>) | Supporting S3 source pin; byte recheck only in J2-F1 | `dccf26ffed4564700889e000e53aaa643d351c7adb3a107b6ef9dabfc8f53845` |
| S7 | [D7.2 JSON manifest](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.json>) | Supporting S3 source pin; byte recheck only in J2-F1 | `e1149899b0dceb126a240c5441e6483d0a133f788fe62872b9652eb681f779ed` |
| S8 | [Frozen P0 architecture](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_P0_Architecture_and_Data_Contract_v1.0_FROZEN.md>) | Supporting S3 source pin; byte recheck only in J2-F1 | `f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755` |

**VERIFIED — local:** all six source pins recorded in S3 §B match their current bytes (S2, S4, S5–S8 above). All four requested source documents match the before-creation snapshot and are preserved. The complete original Batch 1 SQL span, **S4 lines 52–134 inclusive**, has SHA-256 **`27c560961b80e5b4ef2ff74e2fef0d76289aaeaece2b1ccf81557af2780a7807`**, including its final LF and excluding Markdown fences. There is no separate Batch 1 SQL file.

S1 describes a previously supplied **100-row** setting. The current Human instruction supplies **No limit**; this is the planning context for J2-F1, without editing S1 or claiming live verification. Source approval/inspection is distinct from execution approval. S4's preserved historical five-file/01D/HR03 prose does not supersede the current M1–M3 boundary in S2/S3 or Irene's instruction.

Public PostgreSQL 17 documentation was read only to verify transaction/time semantics cited below. Those public reference pages are not local execution inputs and are not file-byte pinned here. No Supabase site, Dashboard, database or API was contacted.

### Supplied target and Editor observations

| Field | Human-supplied value / current verification status |
| --- | --- |
| Unique project reference | `kaehqtozogixyvbmdbhd` — supplied, not independently reverified; future operator privately matches the exact project and environment |
| Environment | `main / PRODUCTION` — supplied, not independently reverified |
| Connection | SQL Editor **Primary database** — connection label; actual database name remains to be reconciled with B1.1 |
| Run as | `postgres` — displayed role supplied; B1.1 session/effective identities require future comparison |
| Row limit | **No limit** — supplied; absence of actual response/export caps remains UNKNOWN |
| Three-dot menu | **Intellisense enabled; Add to favorites; Prettify SQL** — supplied; no result-export control found there |

Do not use Prettify SQL, a query generator or a new SQL expression to facilitate capture. An absent export control in this menu proves neither the presence nor absence of a separate result-toolbar copy/export control. Its location, existence and losslessness remain UNKNOWN; no button or keyboard shortcut is invented here.

## 2. B1.1–B1.4 exact statement inventory

The WITH clauses and nested SELECTs belong to their enclosing labeled statement; they are not extra results. The original Batch 1 comprises **four result-producing statements plus BEGIN and ROLLBACK**. BEGIN/ROLLBACK statuses do not count as result grids.

| Query ID | Original comment lines | Complete statement lines in S4 | Exact ordered column headers | Structural row bound, not an observed count |
| --- | --- | --- | --- | --- |
| B1.1 | 54 | 55–61 | `observed_at`, `database_name`, `session_role`, `effective_role`, `server_version`, `server_version_num`, `read_only_guard` | 1 row on successful complete execution |
| B1.2 | 63 | 64–81 | `schema_name`, `schema_exists`, `schema_owner`, `tables`, `views`, `sequences`, `routines`, `migration_ledger_exists` | 4 rows on successful complete execution |
| B1.3 | 83 | 84–105 | `schema_name`, `object_name`, `object_kind`, `owner_role` | Variable, including 0; 30 name literals do not cap matches across schemas |
| B1.4 | 107–108 | 109–132 | `schema_name`, `routine_name`, `input_types`, `return_type`, `owner_role`, `routine_kind`, `language`, `security_definer`, `volatility` | Variable, including 0; 30 name literals do not cap schemas/overloads |

Statement digests cover the listed statement span from SELECT/WITH through its terminal semicolon **and final LF**, excluding its comment and wrapper. Proposed individual-unit digests cover the exact SQL text in each code fence below, excluding fences and including the final LF. Each unit consists only of S4 line 52, a blank LF line, its original comment and complete statement span, a blank LF line and S4 line 134. All statements, literals, whitespace, output expressions, aliases, joins, orderings and comments are copied without modification.

| Query ID | Statement lines | Statement bytes | Original statement SHA-256 | Proposed wrapped unit SHA-256 |
| --- | --- | --- | --- | --- |
| B1.1 | 55–61 | 401 | `1b5adb2875c20b6762e6aef75e48dce5609aa429ae167425cf15bd00de2ff339` | `eebf9a11ff56c51975d52759895e2947319c14798ad94684e68dffe60ac072db` |
| B1.2 | 64–81 | 977 | `212d5822f09b4251835bb4cd6fb1c3cb16f5690d76a954998631c22c76d2a082` | `1a3e6c30817ae1f0c2884d708d460363de4a52a068753cc5ab176e4423cb81f1` |
| B1.3 | 84–105 | 1169 | `87f5873510848d20525de69d86310819a19ccb53074767e3ea8525e7db2a9bdf` | `9821c2d2ada3cce95af9a20ba4530fb1077fe3c3cfacb667926e305596e594ca` |
| B1.4 | 109–132 | 1363 | `66888f9cc1d14cce0741dcbde6a97d35fe2b023054e3668dc283206d905329b9` | `f21c586c2958eccfb0eb37d883950f0ff8967b4350eed4a146a3ecc9566425fe` |

**The following four units are a proposed regrouping for review, not approved executable replacements for the original batch.** Do not run any unit now or extract a naked SELECT. Repeating the original wrapper around each statement requires separate fallback authorization despite preserving its text.

### B1.1 — exact source statement and original wrapper

```sql
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;

-- B1.1: Context. No network addresses or connection strings.
SELECT CURRENT_TIMESTAMP AS observed_at,
       pg_catalog.current_database() AS database_name,
       SESSION_USER AS session_role,
       CURRENT_USER AS effective_role,
       pg_catalog.current_setting('server_version') AS server_version,
       pg_catalog.current_setting('server_version_num') AS server_version_num,
       pg_catalog.current_setting('transaction_read_only') AS read_only_guard;

ROLLBACK;
```

### B1.2 — exact source statement and original wrapper

```sql
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;

-- B1.2: Expected namespaces, relation counts, and ledger existence only.
WITH wanted(schema_name) AS (
  VALUES ('public'), ('portal'), ('portal_private'), ('supabase_migrations')
)
SELECT w.schema_name, n.oid IS NOT NULL AS schema_exists,
       pg_catalog.pg_get_userbyid(n.nspowner) AS schema_owner,
       (SELECT pg_catalog.count(*) FROM pg_catalog.pg_class c
         WHERE c.relnamespace = n.oid AND c.relkind IN ('r','p')) AS tables,
       (SELECT pg_catalog.count(*) FROM pg_catalog.pg_class c
         WHERE c.relnamespace = n.oid AND c.relkind IN ('v','m')) AS views,
       (SELECT pg_catalog.count(*) FROM pg_catalog.pg_class c
         WHERE c.relnamespace = n.oid AND c.relkind = 'S') AS sequences,
       (SELECT pg_catalog.count(*) FROM pg_catalog.pg_proc p
         WHERE p.pronamespace = n.oid) AS routines,
       pg_catalog.to_regclass('supabase_migrations.schema_migrations')
         IS NOT NULL AS migration_ledger_exists
FROM wanted w
LEFT JOIN pg_catalog.pg_namespace n ON n.nspname = w.schema_name
ORDER BY w.schema_name;

ROLLBACK;
```

### B1.3 — exact source statement and original wrapper

```sql
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;

-- B1.3: Exact accepted relation names found anywhere (metadata only).
WITH wanted(object_name) AS (
  VALUES ('user_profile'), ('workspace'), ('workspace_membership'),
    ('staff_authorization'), ('learner_ref'), ('cohort'),
    ('cohort_teacher_assignment'), ('cohort_learner_assignment'),
    ('program'), ('program_version'), ('program_version_locale'),
    ('mission'), ('mission_locale'), ('resource_asset'), ('assessment'),
    ('assessment_locale'), ('assessment_item'), ('assessment_item_locale'),
    ('billing_reference'), ('stripe_event'), ('entitlement'),
    ('cohort_mission_delivery'), ('mission_progress'), ('assessment_attempt'),
    ('assessment_response'), ('evidence_record'), ('pilot_feedback'),
    ('audit_event'), ('write_session_generation'), ('write_generation_seq')
)
SELECT n.nspname AS schema_name, c.relname AS object_name,
       c.relkind AS object_kind,
       pg_catalog.pg_get_userbyid(c.relowner) AS owner_role
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
JOIN wanted w ON w.object_name = c.relname
WHERE n.nspname NOT IN ('pg_catalog','information_schema')
  AND n.nspname NOT LIKE 'pg_toast%'
  AND n.nspname NOT LIKE 'pg_temp_%'
ORDER BY n.nspname, c.relname;

ROLLBACK;
```

### B1.4 — exact source statement and original wrapper

```sql
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;

-- B1.4: Accepted routine names/overloads and the known public event helper.
-- No routine is invoked; no body/default-argument text is returned.
WITH wanted(routine_name) AS (
  VALUES ('is_adult'), ('member_role'), ('can_cohort'), ('can_learner'),
    ('has_version'), ('can_version'), ('can_attempt'), ('staff_has'),
    ('touch_updated_at'), ('audit_change'), ('audit_append_only'),
    ('guard_version'), ('guard_curriculum'), ('guard_program'),
    ('guard_option_keys'), ('guard_entitlement'), ('guard_billing'),
    ('guard_billing_access'), ('guard_staff'), ('guard_stripe_event'),
    ('guard_learning'), ('guard_response'), ('resolve_locale'),
    ('assert_write_session'), ('lock_status_authority'),
    ('attestation_allowed'), ('record_mission_progress'),
    ('record_cohort_delivery'), ('issue_write_generation'), ('rls_auto_enable')
)
SELECT n.nspname AS schema_name, p.proname AS routine_name,
       pg_catalog.oidvectortypes(p.proargtypes) AS input_types,
       pg_catalog.format_type(p.prorettype, NULL) AS return_type,
       pg_catalog.pg_get_userbyid(p.proowner) AS owner_role,
       p.prokind AS routine_kind, l.lanname AS language,
       p.prosecdef AS security_definer, p.provolatile AS volatility
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
JOIN pg_catalog.pg_language l ON l.oid = p.prolang
JOIN wanted w ON w.routine_name = p.proname
WHERE n.nspname NOT IN ('pg_catalog','information_schema')
ORDER BY n.nspname, p.proname, input_types;

ROLLBACK;
```

## 3. Primary versus fallback collection methods

| Method | Submission and evidence requirement | Present disposition |
| --- | --- | --- |
| Primary | One Run submission of the complete original S4 lines 52–134, preserving one transaction and all four labeled result grids. Capture each full result before replacing Editor content. | Future option only after separate J2 authorization; one submission fits the numeric one-attempt ceiling only if it is the sole authorized attempt. Timing and grid/capture behavior remain UNKNOWN. |
| Individual fallback | B1.1, B1.2, B1.3, B1.4, in that order; one complete original-wrapper unit per submission. Preserve the single SELECT result and confirmed transaction closure before replacing content or continuing. | **HOLD** under the one-attempt ceiling; requires explicit new approval for all four individual attempts and their capture/timing/snapshot limitations. |
| Primary result is missing/incomplete | Preserve what is available, account for all four labels, record the failed/incomplete attempt and STOP immediately. | No automatic switch, repeat, highlighted SELECT execution or additional capture query. Return to Irene for a new bounded action decision. |

Prefer complete result-grid copy/export only when an **existing approved mechanism is established to include all headers, full cell contents, all returned rows/pages and a reliable NULL convention**. A result-toolbar export, if actually present, may be used only after that verification and custody approval. This report does not assert such a control exists.

If export is unavailable, the proposed fallback capture is full-grid clipboard copying, or careful local transcription of every cell/row from the individual grid, with the typed representation in §6. Copying/transcription must be verified lossless and complete before it qualifies. Screenshots may corroborate a result, count or NULL marker; clipped cells, a viewport or a final-page screenshot cannot replace the complete grid. If the wrapped single SELECT also disappears after ROLLBACK, or available UI output cannot preserve full values/NULL distinctions, the fallback fails its purpose: **UNKNOWN / STOP**. Do not execute the SELECT without its wrapper to keep a grid visible.

Capture from an already preserved, complete result under approved custody is not a new SQL attempt. A new Run submission, even unchanged or used only to recover a grid, is an attempt. No alternative client, connection, browser automation or new SQL collection format is approved here.

## 4. Transaction, snapshot and provenance effects

The primary keeps all four queries between one original BEGIN and ROLLBACK. PostgreSQL REPEATABLE READ uses the transaction's first non-control statement to establish the ordinary query snapshot; later reads in that transaction share it. Four separately wrapped units establish four independent transaction snapshots. Matching values or an operator's no-change statement cannot make them one snapshot. This is the database-semantic basis for the fallback's weaker cross-result consistency, not a hosted observation. [PostgreSQL 17 transaction isolation](https://www.postgresql.org/docs/17/transaction-iso.html#XACT-REPEATABLE-READ).

Each unit repeats the original READ ONLY transaction mode and ends that transaction with the original ROLLBACK; neither command changes database defaults. ROLLBACK closes only its own current transaction and cannot undo a different transaction or repair missing evidence. Preserve the exact allowlist as well as the wrapper; read-only mode is not a general guarantee of no physical disk activity or provider load. [PostgreSQL 17 transaction modes](https://www.postgresql.org/docs/17/sql-set-transaction.html), [PostgreSQL 17 ROLLBACK](https://www.postgresql.org/docs/17/sql-rollback.html).

| Issue | Required interpretation for individual execution |
| --- | --- |
| Transaction boundaries | Four separately opened/closed READ ONLY transactions. Do not leave a transaction open across Editor submissions, use bare highlighted statements, remove wrappers, add COMMIT, or change isolation/settings. A stable Editor tab does not prove stable backend session identity. |
| Snapshot consistency | Each successful unit has its own snapshot context; the bundle is four separate observations over an interval. Concurrent catalog/configuration/role changes can make B1.2–B1.4 disagree without a query error. No common-snapshot or project-wide empty-state claim. Intervening-change uncertainty is recorded and triggers the source STOP rules. No snapshot export/import or locking is added. |
| Evidence provenance | Keep collection ID, distinct attempt ID and logical snapshot-context ID per unit; source-file/statement/unit digests; B-label; submission/response/capture times; displayed context; wrapper/closure evidence and custody reference. The logical ID is an operator label, not a PostgreSQL transaction/snapshot ID. Do not query a new backend ID. |
| B1.1 context | Its returned identities and `read_only_guard = on` describe B1.1's transaction only. B1.2–B1.4 do not project roles, server timestamps or guard values. Record their exact wrapper, displayed context and verified session/connection-continuity basis separately; unobserved backend facts are UNKNOWN. If the necessary wrapper/continuity basis is insufficient under approval, STOP. Do not rerun/add B1.1 inside later units. |
| Result completeness | Splitting changes retrieval grouping, not query coverage or row limits. Every original column/row must be preserved. B1.3/B1.4 have no finite query bound; No limit alone does not prove no provider transport/export cap. Successful collection of four grids does not prove simultaneous consistency or later production readiness. |

B1.1 `observed_at` is `CURRENT_TIMESTAMP`, **transaction-start time**, not capture time or elapsed duration. Preserve its original timezone/precision; do not rewrite it to a wall-clock expression. B1.2–B1.4 contain no timestamp column: their server execution timestamps are **UNKNOWN unless actually exposed by the approved UI**. Record Human submission, response and capture wall-clock times with offset, label their basis, and never reuse B1.1's timestamp as their server execution time. [PostgreSQL 17 current date/time semantics](https://www.postgresql.org/docs/17/functions-datetime.html#FUNCTIONS-DATETIME-CURRENT).

## 5. One-attempt limit and 60-second assessment

### Attempt accounting — controlling incompatibility

S3 §E.7 explicitly states: **“Each individual collection is a separate attempt/snapshot”**. S2 §G.3 also requires separate attempt/snapshot times. The current Human safety ceiling is **maximum attempts: 1**. Those statements rule out silently treating four successful submissions as one collection attempt.

| Scenario | Attempt consequence / disposition |
| --- | --- |
| No SQL submitted | 0 attempts consumed by this preparation. No target execution history is independently established. |
| Complete primary submitted once | 1 original batch attempt. Missing grids still consume that attempt; no retries/fallback remain under the one-attempt ceiling. |
| Fallback chosen before any primary submission | At least 4 individual attempts to collect all four labels, without retries. Requires a new explicit allowance that supersedes the one-attempt ceiling for these named units. This report does not grant that allowance. |
| Primary submitted, then all four fallback units proposed | 1 + 4 = at least 5 cumulative collection attempts. Immediate STOP applies to the incomplete primary; later fallback requires a separate decision, accurate prior-attempt accounting and explicit remaining allowance. No counter reset or reclassification is inferred. |
| Timeout, error, accidental duplicate Run, uncertain acknowledgment or lost grid | Preserve the attempted submission and uncertainty. Do not resubmit because no result is visible. Any retry is another attempt and separately requires approval. |
| Known-session cleanup | Only separately scoped existing ROLLBACK cleanup, if authorized and the original transaction is known open/aborted. It returns no new result, restores no allowance and must be logged as an additional control submission. The approval must explicitly address cleanup accounting; no exception is inferred here. |

A one-attempt rule retained unchanged leaves this four-unit fallback unusable. Irene must approve either a different explicit allowance for these four distinct attempts, or continue HOLD. This document requests no execution now and does not redefine the term “attempt.”

### Duration — UNKNOWN, no multiplication or guarantee

The four-unit path introduces four submission/response cycles, four transaction openings/closures and four complete captures, with Human review between them. No execution or timing measurements were performed. B1.3/B1.4 cardinalities, catalog locks/load, network/UI latency, full-value copy behavior, pagination, export limits and cancellation/rollback completion times are UNKNOWN. Structural row bounds for B1.1/B1.2 do not bound elapsed time.

For a future reviewed plan, use a **single conservative aggregate wall-clock envelope of at most 60 seconds** from the first Run submission through the last confirmed transaction closure and complete immediate capture, including intervening response/copy/review time. This is a proposed conservative timing definition for Irene to confirm, not a change to the supplied limit. Preserve per-unit timings too. Never restart the clock per unit, approve 4 × 60 seconds, or reduce the recorded duration by subtracting capture delays without explicit new authority. Preparation before Run and later offline review should be identified separately.

**Can all four results be executed and preserved within that envelope? UNKNOWN.** A local stopwatch records elapsed time but does not enforce a server-side deadline. At the approved deadline, stop new work and use only an explicitly approved, existing cancellation/cleanup path; cancellation availability, same-session continuity and completion within 60 seconds remain UNKNOWN. Do not change statement/lock/idle timeouts or add a SET/monitoring query to enforce it. If an in-flight request or cleanup crosses the bound, record the breach and outcome UNKNOWN; never claim the bound was met simply because the Human stopped clicking.

Future use requires Irene's explicit aggregate/per-unit timing definition, existing abort/cleanup controls and a reviewed disposition of these uncertainties. If preservation and safe stopping within the retained bound cannot be established sufficiently for that decision, **remain HOLD**. No unauthorized production trial, timing test, query modification or relaxed limit is supplied to resolve the gap.

## 6. Evidence preservation and completeness rules

Every future capture must preserve the complete original grid or explicitly report why that is impossible. Summary counts and interpreted conclusions cannot replace the original values. Future evidence files/locations require custody approval; none is created by this task.

| Evidence requirement | Proposed preservation rule |
| --- | --- |
| All column headers | Copy every header in exact query order from §2, including empty results; compare actual headers to the inventory. Keep source grid and capture header counts (7 / 8 / 4 / 9). Do not rename or merge columns. |
| All returned rows and values | Preserve rows in query order, with local capture ordinals outside the SQL columns. Include every page and full cell contents, case, punctuation, whitespace, newlines and numeric/boolean values. Record captured ordinal ranges and overlap checks if page copying is necessary; do not deduplicate or sample. Cell ellipses, inaccessible full values, dropped columns or omitted pages mean incomplete. |
| NULL versus empty | Use a documented lossless copy/export convention only if the UI distinguishes them. Otherwise transcribe typed cells locally: `{"kind":"null"}` for an observed SQL NULL; `{"kind":"text","value":""}` for an observed empty string; `{"kind":"text","value":"NULL"}` for literal text NULL; JSON-escaped exact text for other strings. Preserve booleans/numbers with declared types, using their exact displayed/source text when precision could be lost. A blank-looking cell is UNKNOWN until distinguished; never convert it to NULL or empty by guess. B1.2 absent-schema owners can be NULL; B1.4 zero-argument `input_types` can be empty text. No COALESCE/cast/JSON SQL is added. |
| Result counts | Record separately UI-reported returned count and its basis, total-result count/completeness basis if available, and locally captured data-row count. Exclude headers and BEGIN/ROLLBACK statuses. Counts must reconcile; a page count or selected/copied count is not the total. B1.2 `tables/views/sequences/routines` are catalog-object counts within cells, not this grid's row count. Unknown totals/caps remain UNKNOWN without an extra COUNT query. |
| Query identifiers | Bind original B-label, S4 file digest and statement digest, proposed unit digest, collection/attempt/snapshot-context IDs, any actually displayed UI query ID, selected mode and source lines. A UI ID absent from display is UNKNOWN; B-label plus digests identifies the approved text. |
| Execution timestamps | Keep B1.1 returned `observed_at` unchanged; record Human submit/response/capture/closure times for each unit in ISO 8601 with explicit UTC offset, e.g. `YYYY-MM-DDThh:mm:ss-05:00` when applicable, and America/Chicago if used. Separate server-observed versus Human-recorded times; unknown server times stay UNKNOWN. Record stopwatch elapsed and any clock uncertainty. |
| Completeness status | One explicit state per label: COMPLETE, EMPTY — 0 rows, ERROR, TRUNCATED, NOT RETURNED, NOT ATTEMPTED, or UNKNOWN, with reason and evidence. COMPLETE means all headers/full values/rows preserved, uncapped output basis established, counts reconciled and no errors; EMPTY additionally requires a successful complete zero-row result and preserved headers. A 0-row missing/denied grid is not EMPTY. |
| Integrity and privacy | Preserve an approved complete custody copy, then hash final capture bytes and record encoding/format/NULL convention/capture method and custodian. Keep permitted originals only in approved private custody. Label sanitized redactions, their positions and effect on reviewer access; if no safely complete evidence is available, report UNKNOWN and STOP. No raw customer records/secrets/logs or broad source exports. |

For manual transcription, an independent reviewer should compare every header, row and full value with the still-accessible original; a count match alone cannot prove cell accuracy. If verification cannot occur before the grid is lost or within the approved capture boundary, completeness is UNKNOWN and the next statement must not be submitted. Formatting or sanitizing an approved local copy must not silently normalize NULLs, empty strings, whitespace, timezone precision or order.

### Future evidence ledger — template only; no results collected

| Query | Attempt / logical snapshot context | Submitted / response / capture / closure time + basis | Server time | Role / wrapper / continuity basis | UI returned / total / captured rows | Status + reason | Source/statement/unit digest; capture reference/digest |
| --- | --- | --- | --- | --- | --- | --- | --- |
| B1.1 | NOT ATTEMPTED | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN / UNKNOWN / 0 captured | NOT ATTEMPTED; no SQL authority | Use §1/§2 pins; no capture |
| B1.2 | NOT ATTEMPTED | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN / UNKNOWN / 0 captured | NOT ATTEMPTED; no SQL authority | Use §1/§2 pins; no capture |
| B1.3 | NOT ATTEMPTED | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN / UNKNOWN / 0 captured | NOT ATTEMPTED; no SQL authority | Use §1/§2 pins; no capture |
| B1.4 | NOT ATTEMPTED | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN / UNKNOWN / 0 captured | NOT ATTEMPTED; no SQL authority | Use §1/§2 pins; no capture |

Bundle status now: **0/4 result grids collected; Batch 1 evidence UNKNOWN / NOT COLLECTED IN J2-F1**. A future manifest must distinguish labels accounted for from complete results, e.g. expected 4; submitted, returned, captured, COMPLETE, EMPTY, ERROR and unattempted counts; failures cannot disappear from a replacement summary. Do not merge primary and fallback records as if they were one snapshot. Batch 1 completion, if later achieved, still leaves 19 other SELECT results and D1–D9 outside this report's collection scope.

## 7. Step-by-step Human operator instructions — future use only

**Step 1 is an execution-blocking gate. Do not perform the later hosted steps under current preparation authority.**

1. **Read Irene's separate action decision.** Confirm it explicitly authorizes Batch 1 on the exact target, selects primary or individual fallback, binds final S3/S4 and this report's external final-file digest plus source/statement/unit pins, and completes the S3 §C/I operator/reviewer/custody/window fields. For fallback, require an explicit revised allowance for all four individual attempts, with prior attempts accounted for, four separate snapshots accepted, timing/abort/cleanup limits and the approved lossless capture method. General document acceptance or the already supplied safety limits are insufficient. If anything is absent, STOP before hosted navigation or Run.
2. **Prepare local custody and attempt records.** Use only the approved destination and approved capture tools; prepare four label records and the exact reviewed units without creating new SQL. Recheck all bound hashes. Record existing attempts and remaining allowance; no presumed reset. Arrange the named independent reviewer and check availability of existing nonsensitive capture/abort evidence. If the required UI/cap/NULL/session/timing prerequisites cannot be established without unauthorized SQL or access, mark UNKNOWN and STOP.
3. **Confirm the Human's target and Editor context.** Only after authorization, privately match project `kaehqtozogixyvbmdbhd`, main / PRODUCTION, Primary database, existing Run-as `postgres` and No limit to the action decision. Record observation time and custody reference. Do not change roles, database configuration, Auth hooks or timeout values. No limit must be established as uncapped returned output, not just visible pagination. Do not obtain credentials or customer pages. Stop for uncertainty/mismatch.
4. **Select the approved collection route before the first Run.** For primary, paste the complete unchanged S4 lines 52–134 and verify four labels/wrappers. For fallback, prepare B1.1 first from §2 and verify the exact source comment, entire statement and both original transaction endpoints; repeat text verification before each later unit. Keep one complete unit per Run, with no selected-text fragment, extra SQL, template, Prettify change or appended statement. Confirm the retained-result/capture mechanism works with the ending ROLLBACK based on permitted evidence; if unresolved, STOP instead of testing in production.
5. **Submit the approved primary or B1.1 unit once.** Immediately record attempt ID, logical snapshot-context ID, approved source/unit digests, submit time and the aggregate stopwatch start. Record UI duration/response/closure evidence when available. No SQL submission is made by this preparation task. On any error, missing output, uncertain acknowledgment, limit breach or open-session uncertainty, go directly to step 9; do not press Run again.
6. **Capture and reconcile before continuing.** Preserve the full primary four-grid set, or the single fallback grid, under §6. Compare all headers, count all captured rows and validate NULL/empty distinctions/full values. Record timestamps, UI/cap/count basis and exact closure status. For B1.1 reconcile database, session/effective role, server context and `read_only_guard = on` against the decision; mismatch is STOP. B1.1 never independently proves project identity. An incomplete or ambiguous grid requires immediate STOP before any next query.
7. **Continue only if every gate still holds.** Primary completes after its one successful complete submission/capture; no fallback follows under the one-attempt ceiling. In a separately authorized fallback, confirm B1.1's closure/capture, remaining explicit attempts, target/role/continuity, no intervening changes and remaining aggregate time, then submit B1.2 once; apply steps 5–6 to B1.2, then B1.3, then B1.4. Keep the original wrappers and individual attempt records. The aggregate timer never restarts. If safe execution/capture/closure of the next unit cannot fit the approved remaining time on the reviewed basis, STOP without submitting it; do not invent a per-query budget or continue speculatively.
8. **Close and hand off.** Confirm every submitted unit's ending ROLLBACK with actual approved UI/session evidence or mark UNKNOWN. Reconcile four required labels with actual captures, failures and unattempted labels. Preserve counts, typed values, timestamps, digests, redactions, changed-context concerns and all prior primary evidence; obtain independent review. Return the approved sanitized local bundle/reference to Irene. Keep production HOLD and stop; no Batch 2 or operational action is implied.
9. **Handle STOP immediately.** Stop all new collection submissions, preserve sanitized available evidence/error/SQLSTATE if displayed, elapsed time, affected labels, attempt accounting and transaction outcome. At deadline use only the explicitly approved existing cancellation path; cancellation/closure not established means UNKNOWN. If the same session is known open/aborted and cleanup is explicitly authorized, use only the original `ROLLBACK;`, record that control submission and confirmation; do not guess a session, reconnect blindly or use COMMIT. Missing cleanup authority or unknown outcome goes to Irene. No repair, SQL rewrite, role/timeout change, retry or automatic switch to fallback.

## 8. STOP conditions

All **S2 §I STOP-01–STOP-09**, also preserved in S3 §H, remain controlling. This summary adds no exception or weaker threshold.

- **Authority/attempts:** missing separate J2/fallback approval, wrong/unverified target/role/operator, unapproved capture/settings/private-definition scope, attempt budget exhausted or automatic continuation. Four units under a one-attempt ceiling must not start.
- **Integrity/evidence:** source/pasted SQL/wrapper/hash mismatch; missing headers/rows/full values; ambiguous NULL/empty; cap/truncation; denied/error/timeout; unreconciled counts; lost grid after ROLLBACK; unknown required session/guard/closure basis. Preserve UNKNOWN and stop immediately.
- **Time/workload:** approved 60-second boundary reached/exceeded, no reviewed safe basis to fit remaining work, cancellation/cleanup uncertainty, provider/UI degradation or other approved abort trigger. No additional query to diagnose load.
- **Drift/concurrency:** intervening catalog/configuration/release work or uncertainty, unexpected Portal/ledger/excluded objects/routines/hooks, unexplained collision/overload/partial state or prior-attempt provenance. Catalog discovery grants no inspection/repair authority.
- **Existing downstream STOPs:** unresolved compatibility/privileges, exposure/security, maintenance/runner, recovery or configuration/use findings keep their dependent actions blocked. Preserve accepted-only interpretation rather than importing M4/M5 requirements.
- **Scope/privacy:** obtaining complete safe evidence would require new SQL, credentials/secrets/customer rows, raw logs/bodies, helper/hook invocation, locks, alternate connection/client, database setting changes, tests or other production side effects. Leave UNKNOWN and return for the smallest separate review scope.

A cleanup confirmation is not a successful result or a database-wide rollback. Do not suppress a failure, call denied results empty, repeat queries to make counts match, or convert UNKNOWN into PASS.

## 9. Remaining UNKNOWNs

| UNKNOWN | Effect / required future disposition |
| --- | --- |
| Actual Batch 1 results, current catalog state and target database/session roles | All four result sets are uncollected here; supplied observations are not current hosted verification. |
| Existing production execution/attempt history | Human must reconcile before any new allowance; this task consumed zero SQL attempts and does not claim the target has never been queried. |
| Multiple-grid preservation and single wrapped-SELECT preservation after ROLLBACK | Determines whether primary/fallback can retain results; not established by the three-dot menu observation. |
| Existing full-grid copy/export controls, NULL encoding, full-value accessibility and independent verification feasibility | No lossless capture qualification is established; if unavailable, fallback remains HOLD. |
| Actual response/transport/export caps under No limit; B1.3/B1.4 row totals | No completeness guarantee; finite count/filter assumptions cannot replace complete uncapped output evidence. |
| Server/backend continuity and wrapper/closure visibility for B1.2–B1.4 | B1.1 is one snapshot's context; later backend context cannot be inferred from it. No new context query is approved. |
| In-flight cancel path, same-session cleanup and whether the full sequence fits/stops within 60 seconds | Duration and enforcement remain UNKNOWN; no timeouts/configuration changes or production timing trial performed. |
| Named collector/reviewer/custodian, custody destination, retention, collection window/freshness and intended runner comparison | Authorization-critical fields must be completed for a separate action decision. Irene is final authority, not automatically every operating role. |
| Four-snapshot comparability and intervening changes | Must be expressly accepted with provenance and a reviewed no-change basis; four separate snapshots never become a shared one. |
| Remaining J2/production gates | 19 other result sets, D1–D9, native behavior, privileges, fence/recovery/rehearsal/configuration/deployment readiness remain outside this Batch 1 preparation; no gate closes. |

## 10. Explicit authorization boundaries and required new decision

**Authorized now:** inspect existing local sources and create exactly this one Markdown procedure. **Not authorized now:** Supabase/hosted access, SQL execution anywhere, database/configuration changes, migrations, Auth-hook activation, tests/builds, commits, pushes, deployments or marking J2 execution authorized. No such actions occurred. Only public PostgreSQL reference documentation was read outside the local sources.

Before using the fallback, Irene must make a **separate written, dated, digest-bound action decision** completing the S3 §C/I conditions and explicitly addressing:

1. **Execution scope and target:** Human-operated Batch 1 individual collection only on the privately confirmed exact project/environment/database; original four statements/comments, original wrappers, source/statement/unit hashes and M1–M3 interpretation. This report's final hash is recorded externally after finalization, not self-embedded. Keep optional event-helper definition review omitted; no broader SQL/Dashboard or later-batch authority is inferred.
2. **Attempts:** an explicit allowance covering four separate named individual attempts, without retries, and exact treatment of any already consumed primary/failed/uncertain attempt and cleanup submission. This must expressly supersede the current one-attempt ceiling for the fallback; merely approving this document does not do so. If the ceiling remains one, retain HOLD.
3. **Snapshots/provenance:** acceptance of four separate snapshot contexts, their time/role/wrapper evidence limitations, independent reviewer, freshness/change rules and the prohibition on a common-snapshot claim. No wrapper removal or new context/snapshot query.
4. **Duration and abort:** whether the conservative single aggregate 60-second envelope is the approved timing definition; explicit per-unit/aggregate workload/stop limits, existing cancel/cleanup custody and disposition of timing/enforcement UNKNOWNs. No multiplying or silently relaxing 60 seconds. If safe stopping/complete capture under the retained limit lacks an adequate basis, retain HOLD or prepare a separately reviewed limits decision; no exception is granted here.
5. **Evidence custody and capture:** designated collector/custodian/reviewer, approved local destination/retention/redaction, established lossless complete capture including NULLs/empty values, count/timestamp status rules, original-failure retention and explicit incomplete-evidence STOP/cleanup handling.

The statement inventory makes that next decision concrete and reviewable. It is not a blank approval and makes no request to execute now. Source approvals and supplied numeric safety limits authorize preparation only under the present instruction. Production remains on HOLD even if Irene later accepts this procedure or a future Batch 1 bundle.

## 11. Local artifact, Git status and final recommendation

Exactly one new file was created:

`/Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_J2_F1_Batch_1_Evidence_Capture_Fallback_v1.0.md`

Entry preservation snapshot: **293 pre-existing workspace files**, including ignored files and excluding `.git`, recorded by byte digest/mode or symlink target; branch **main**; HEAD **`e1b2b8b0e880e2d5a277060514e9a8dac8ffdaa0`**; nine pre-existing nonignored untracked documents; no tracked/staged changes. Index SHA-256: **`31037a7b891f11a5369b5f94a4b0ef187c8e1e7d0738b68f9ed3d805fe3c7e5e`**. Final verification checks the completed document against that snapshot: all pre-existing entries, source digests, HEAD/branch/index preserved; no deletions; exactly the one authorized addition; all four embedded statements/comments/wrappers equal their source byte spans. These are static local file/Git checks, not SQL execution or a hosted/behavioral test PASS.

Final Git status (`git status --short --untracked-files=all`):

```text
?? docs/portal/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md
?? docs/portal/AIEA_Portal_J2_Preparation_Readiness_Report_v1.0.md
?? docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.json
?? docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.md
?? docs/portal/handoffs/AIEA_Portal_D7_3_Production_Readiness_and_Deployment_Safety_Plan_v1.0.md
?? docs/portal/handoffs/AIEA_Portal_D7_4_Accepted_Only_Metadata_Evidence_Checklist_v1.0.md
?? docs/portal/handoffs/AIEA_Portal_D7_5_J2_Read_Only_Collection_Authorization_Packet_v1.0.md
?? docs/portal/handoffs/AIEA_Portal_Hosted_Metadata_Preflight_Package_v1.0.md
?? docs/portal/handoffs/AIEA_Portal_Hosted_Migration_Reconciliation_Handoff_v1.0.md
?? docs/portal/handoffs/AIEA_Portal_J2_F1_Batch_1_Evidence_Capture_Fallback_v1.0.md
```

The ten untracked paths consist of the nine pre-existing documents plus J2-F1. No staging, commit, push, deploy, migration, database/configuration write or Auth-hook activation occurred. Existing SQL and documentation are unchanged. No evidence result file was created.

**Final recommendation: PASS for local fallback preparation and source preservation; HOLD for fallback use, J2 execution and production.** The current one-attempt limit excludes four individual attempts; completion within 60 seconds and lossless Editor capture remain UNKNOWN. Irene's separate explicit authorization and reviewed prerequisites are required before any use.

**STOP — return control to Irene. No further action is authorized by this report.**
