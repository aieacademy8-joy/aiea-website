# AIEA Portal — HR03 / Sprint 01D Human Authority Reconciliation Ruling v1.0

## A. Decision date and authority

**Decision date:** 2026-10-12 (America/Chicago).  
**Human Authority:** Irene — Founder, AI Explorers Academy.  
**Status:** APPROVED BY HUMAN AUTHORITY.  
**Mode:** DOCUMENTATION ONLY.

Authority is the founder's explicit approval supplied in this conversation under “AIEA PORTAL — HUMAN AUTHORITY GOVERNANCE RULING — SPRINT 01D / HR03 SOURCE ACCEPTANCE VS RELEASE BOUNDARY.” This record documents that Human decision; it is not agent self-acceptance.

The authorized task is creation of this one new Markdown decision record. The ruling grants no staging, commit, push, deployment, migration execution, hosted access, Auth-hook activation, application change, Git configuration change, branch switch, or change to existing files in either worktree.

## B. Historical source acceptance interpretation

**Sprint 01D/HR03 retains its documented historical source acceptance from October 8, 2026.**

The [Sprint 01D Final Human Authority Acceptance and Repository-Boundary Review v1.0](../AIEA_Portal_Sprint_01D_Final_Acceptance_and_Repository_Boundary_Review_v1.0.md) records that historical acceptance of Sprint 01D and the bounded HR03 trusted-generation amendment. Its historical source acceptance is preserved. This ruling does not rewrite the acceptance record, its validation evidence, or historical findings.

The later D7.2 accepted-only release boundary remains authoritative for **production release eligibility**. Its exclusion of 01D/HR03 controls the accepted-only production release; it does not revoke the October 8 historical source acceptance. The founder resolves the source-acceptance-versus-release-boundary conflict through this distinction.

Historical source acceptance does **not** authorize production deployment, hosted Supabase migration execution, Auth-hook activation, GitHub push, or acceptance of subsequent implementation changes.

## C. Exact accepted-only production release baseline

**The current accepted-only production release baseline remains Sprint 01C:**

```text
079e7f2a13142e956a5766d6e9e17a1f94718f5f
```

The [D7.2 Accepted Baseline Release Manifest v1.0 — Markdown](AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.md) and its [JSON companion](AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.json) remain the accepted-only source boundary and source-identity references. The ruling does not replace or modify them.

For that release, only the pinned M1–M3 migration sources are eligible for consideration:

1. `20261006000100_portal_domains.sql`
2. `20261006000200_portal_security.sql`
3. `20261006000300_portal_guards.sql`

Source eligibility is not migration execution or deployment approval. M4 `20261008000100_portal_mission_status.sql`, M5 `20261008000200_portal_write_generation.sql`, HR03 Auth-hook activation, and 01D runtime additions or changed versions remain outside this accepted-only production release boundary.

The audited `main` HEAD, `e1b2b8b0e880e2d5a277060514e9a8dac8ffdaa0`, contains historically accepted 01D source. That fact does not make it the accepted-only production release baseline. A commit title, branch name, or cached remote reference does not expand release eligibility.

## D. Source acceptance, commit approval, push approval, and deployment approval

| Decision or action | Disposition under this ruling |
|---|---|
| Historical Sprint 01D/HR03 source acceptance | **RETAINED**, as documented on October 8, 2026; bounded to that historical source acceptance. |
| Accepted-only production release eligibility | **UNCHANGED**: exact Sprint 01C baseline above, governed by D7.2. Historical 01D/HR03 source acceptance does not add it to this release. |
| Acceptance of subsequent implementation changes | **NOT GRANTED**. Separate review and explicit Human approval are required. |
| Commit approval | **NOT GRANTED BY THIS RULING**. Source acceptance, documentation creation, and a recommended commit sequence do not authorize staging or committing. A separate approval must identify the exact reviewed scope. |
| GitHub push approval | **NOT GRANTED BY THIS RULING**. A local commit, historical acceptance, or documentation-only change does not authorize push. |
| Deployment approval | **NOT GRANTED BY THIS RULING**. Accepted source eligibility and Git publication do not authorize production deployment. |

These decisions remain separate. No commit, push, or deployment approval is inferred from the founder's approval of this governance interpretation. The ruling does not establish or change GitHub/Vercel deployment configuration, resolve the audit's deployment-trigger UNKNOWN, or create an automatic deployment guard. The existing production hold remains in effect.

## E. Hosted Supabase and Auth-hook restrictions

This ruling does not authorize access to hosted Supabase, execution of hosted SQL or migrations, migration-ledger changes, API exposure changes, Auth settings changes, grants, RLS changes, or other hosted configuration changes.

**Hosted migration execution remains separately restricted even for source-eligible M1–M3.** The historically accepted M4/M5 sources remain excluded from the current accepted-only production release.

**HR03 Auth-hook installation or activation is not authorized.** The `portal_private.issue_write_generation(jsonb)` issuance hook and its generation registry, sequence, and claim mechanism do not enter the accepted-only production release through historical source acceptance. No hook enablement, replacement, or provider-setting change follows from this record.

No hosted inspection, SQL execution, migration execution, or Auth-hook operation is part of the documentation-only task.

## F. Treatment of the original 36 pending files

The [36-File Commit Readiness Audit v1.0](AIEA_Portal_36_File_Commit_Readiness_Audit_v1.0.md) preserves the exact original inventory and its classifications: **A 8 · B 0 · C 24 · D 4 · E 0 among the 36**, with Portal-relevant ignored files separately excluded.

**Existing pending implementation files remain unaccepted unless separately reviewed and approved.** The October 8 acceptance does not extend to subsequent changes to historically accepted files or to later added implementation, test, fixture, or local-tooling files.

The eight class A documentation files remain documentation-only review candidates. Their proposed or evidentiary status does not confer implementation acceptance, commit approval, push approval, or operational authority. The four class D files remain subject to their documented review needs; this ruling supplies the source-acceptance-versus-release-boundary interpretation without editing or reclassifying those documents. In particular, their historical five-migration/01D language must not be used to expand the current accepted-only release.

The audit and its recommendations are preserved as historical audit findings. This ruling does not rerun that audit, update its inventory, or alter its file classifications. The audit handoff and this decision record are subsequent documentation additions and are not part of the original 36-file inventory.

## G. Treatment of the separate 21-file founder-preview worktree

The separate Level 1A-Q1 founder-preview worktree at:

```text
/Users/dosfam/.codex/worktrees/l1a-q1-founder-preview/2.0
```

**remains outside the current production release boundary.** Its separate 21-file inventory is recorded in the commit-readiness audit. The audit's class D treatment and requirement for a separate acceptance review are not changed by this ruling.

The preview worktree's Sprint 01C base and documented `GREEN_REVIEWED_NON_RELEASE` status do not authorize incorporation into the accepted-only production release, committing, pushing, deploying, or executing its preview SQL. No preview code, configuration, migration, or other file is approved by this ruling. Neither worktree's existing files are to be altered under this documentation-only task.

## H. Governing references

| Reference | Role in this ruling |
|---|---|
| [Sprint 01D Final Human Authority Acceptance and Repository-Boundary Review v1.0](../AIEA_Portal_Sprint_01D_Final_Acceptance_and_Repository_Boundary_Review_v1.0.md) | Preserved October 8 historical source acceptance; separate hosted/publication boundaries. |
| [D7.2 Accepted Baseline Release Manifest v1.0 — Markdown](AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.md) | Authoritative accepted-only production release boundary and exclusions. |
| [D7.2 Accepted Baseline Release Manifest v1.0 — JSON](AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.json) | Pinned accepted source identities and declarative release exclusions. |
| [36-File Commit Readiness Audit v1.0](AIEA_Portal_36_File_Commit_Readiness_Audit_v1.0.md) | Preserved original 36-file inventory, classifications, security/deployment risks, commit recommendation, and separate 21-file preview inventory. |
| [Frozen P0 Architecture and Data Contract v1.0](../AIEA_Portal_P0_Architecture_and_Data_Contract_v1.0_FROZEN.md) | Existing frozen architecture; not modified by this decision. |
| [D7.3 Multi-Learner Family and Tiered Licensing Audit](AIEA_D7.3_Multi_Learner_Family_and_Tiered_Licensing_Audit.md) | Existing feasibility proposals; no commercial licensing approval follows from this ruling. |

References identify existing records. Their contents remain unchanged, and no historical record is rewritten by this reconciliation.

## I. Frozen architecture, commercial licensing, and final boundary

**This ruling does not modify the frozen P0 architecture or approve commercial licensing.** It does not approve audience/license classification extensions, commercial capacity rules, bundle scope, canonical lesson amendments, or subsequent implementation. Those matters retain their separate Human review and approval boundaries.

The approved decision is limited to retaining historical Sprint 01D/HR03 source acceptance while preserving Sprint 01C as the accepted-only production release baseline. Source acceptance, commit approval, push approval, deployment approval, hosted migration execution, and Auth-hook activation remain separate decisions.

**Documentation-only completion: create this one decision record, report its exact path, and STOP.** No automatic technical or operational continuation is authorized.
