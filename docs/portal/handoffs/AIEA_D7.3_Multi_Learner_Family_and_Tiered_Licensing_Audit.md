**D7.3 — Multi-Learner Family & Tiered Licensing Feasibility Audit**  
**Date:** October 11, 2026 · **Mode:** Read-only repository inspection

**Verdict:** The existing FAMILY/SCHOOL architecture can support the approved three-audience product model without introducing another delivery engine or duplicating curriculum. It already provides the relationships needed for multiple family learners, independent progress, multiple cohorts, and workspace-bound curriculum access.

It does **not** currently implement tiered commercial licensing. Learner and instructor limits, commercial teaching authorization, bundle-payment scope, capacity upgrades, and organization/site licensing boundaries require a small, explicitly approved extension.

The most significant limitation is that **cohort delivery does not require individual learner registration**. Consequently, the existing model cannot enforce unique-learner teaching limits merely by counting learner records.

All recommendations below are proposals. Neither the canonical lesson amendment nor the audience/license classification extension is treated as accepted.

---

**1. Repository, source identity, and accepted migration boundary**

| Item | Verified finding |
|---|---|
| Repository | `/Users/dosfam/Desktop/AIEAcademy/Website/2.0` |
| Branch | `main` |
| HEAD | `e1b2b8b0e880e2d5a277060514e9a8dac8ffdaa0` |
| HEAD title | `AIEA Portal: accept Sprint 01D mission status and trusted write authority` |
| Cached remote references | `origin/main` and `origin/HEAD` point to HEAD; no remote fetch performed |
| Working tree | **11 modified tracked files; 24 nonignored untracked files** |
| Index | Empty |
| Deletions/renames | None reported |
| Latest documented accepted-only release source | Sprint 01C: `079e7f2a13142e956a5766d6e9e17a1f94718f5f` |
| Hosted installation/runtime state | Not inspected; unknown |

The tracked modifications concern Portal curriculum, progress, shell/UI, login, the local adapter, and tests. Untracked files include resource-download implementation, journey fixtures/tests, and release handoffs. These files must not be assumed to inherit acceptance from HEAD.

The latest local release-boundary documents specify this sequence:

| Order | Source-eligible migration | Verification |
|---|---|---|
| M1 | [20261006000100_portal_domains.sql](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000100_portal_domains.sql>) | Current bytes match accepted 01C and HEAD |
| M2 | [20261006000200_portal_security.sql](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000200_portal_security.sql>) | Current bytes match accepted 01C and HEAD |
| M3 | [20261006000300_portal_guards.sql](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000300_portal_guards.sql>) | Current bytes match accepted 01C and HEAD |

**Required order: M1 → M2 → M3.** Source eligibility does not authorize execution. M4/M5 exist at HEAD, but the latest release documents exclude them. Each migration has its own transaction; the sequence is not automatically one atomic batch. See the [D7.2 release manifest](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.md:48>).

The frozen contract matches HEAD, accepted 01C, and original freeze commit `052101670dc92b38c7ec15c88a2b07572e42d75b`. Its SHA-256 remains:

`f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755`

---

**2. HR03 acceptance evidence — verified conflict**

There is actual historical acceptance evidence, but there is also a later contradictory release ruling.

- The tracked [Sprint 01D final acceptance record](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_Sprint_01D_Final_Acceptance_and_Repository_Boundary_Review_v1.0.md:3>), dated October 8, explicitly records Irene’s acceptance of the bounded HR03 trusted-generation amendment.
- The tracked [independent HR03 re-review](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_Sprint_01D_HR03_Independent_ReReview_v1.0.md:7>) records a local PASS and closure of 01D-A01. It expressly distinguishes that result from Human acceptance and hosted activation. Its current SHA-256 matches the acceptance record’s cited digest.
- The later, currently untracked [D7.2 manifest](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/handoffs/AIEA_Portal_D7_2_Accepted_Baseline_Release_Manifest_v1.0.md:3>) states **“01D UNACCEPTED”**, identifies 01C as the accepted source, and excludes HR03/M4/M5. Subsequent D7 documents repeat that boundary.

**Audit disposition:** Historical repository evidence records bounded local HR03 acceptance. The latest documented release boundary excludes it. Repository inspection alone cannot resolve the conflicting Human-authority provenance, so this audit **does not certify HR03 as currently accepted or deployable**.

For accepted-baseline conclusions, this report uses 01C/M1–M3. It describes M4/M5 only as inspected later implementation. Historical tests were not rerun, and their acceptance cannot automatically extend to the current dirty application files. Hosted hook activation and compatibility remain unproven under either interpretation.

---

**3. Compatibility matrix**

“Supported” below means verified structural or source support. It does not mean hosted deployment or a complete purchasing workflow exists.

| Requirement | Audience / engine | Compatibility |
|---|---|---|
| Multiple children in one workspace | FAMILY / FAMILY | **Supported.** Multiple `learner_ref` rows can belong to one workspace. |
| Independent progress per child | FAMILY / FAMILY | **Supported structurally.** Progress is unique per learner and mission. Accepted 01C has no progress-recording endpoint. |
| Different annual levels simultaneously | FAMILY / FAMILY | **Conditional.** Multiple exact versions are supported; annual-level identity/mapping is absent. |
| Multiple curriculum entitlements | All audiences | **Supported.** Multiple purchases/versions can coexist in a workspace. |
| Additional curriculum without progress loss | All audiences | **Supported structurally.** Add access records while preserving existing learner, mission, and version identities. Purchasing automation is missing. |
| No per-sibling charge | FAMILY / FAMILY | **Compatible product policy.** No sibling billing structure exists; Portal checkout is not implemented. |
| No commercial teaching rights | FAMILY / FAMILY | FAMILY cannot use SCHOOL cohorts, but an explicit commercial-license gate is missing. Off-platform teaching cannot be technically prevented. |
| Multiple teaching groups | EDUCATOR / SCHOOL | **Supported structurally.** Multiple cohorts per SCHOOL workspace. |
| One instructor teaching multiple groups | EDUCATOR / SCHOOL | **Supported.** One membership can have assignments to multiple cohorts. |
| Unique-learner capacity | EDUCATOR / SCHOOL | **Missing enforcement.** Learner records exist, but rosters are optional and no licensed limit exists. |
| Curriculum scope restrictions | EDUCATOR / SCHOOL | **Enforced for exact versions.** Annual/stage packaging remains conditional on approved mapping. |
| Capacity upgrades | EDUCATOR / SCHOOL | **Missing.** No capacity grant, tier ceiling, or upgrade policy exists. |
| License isolation between workspaces | Commercial / SCHOOL | Purchase and entitlement bases are workspace-bound. Credential sharing, exported content sharing, and physical use remain outside that guarantee. |
| Multiple authorized instructors | ORGANIZATION / SCHOOL | Memberships and assignments support multiple adults. Commercial instructor registration/limits are missing. |
| Multiple cohorts | ORGANIZATION / SCHOOL | **Supported structurally.** |
| Learner-capacity restriction | ORGANIZATION / SCHOOL | **Missing enforcement.** |
| Instructor-capacity restriction | ORGANIZATION / SCHOOL | **Missing enforcement.** |
| Organization/site boundaries | ORGANIZATION / SCHOOL | Workspace tenancy is enforced. Organization/site identity, hierarchy, and pooled rights are absent. |

The underlying relationships are visible in [M1 identity/cohort structures](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000100_portal_domains.sql:21>), [M1 progress structures](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000100_portal_domains.sql:221>), and the [frozen cardinality map](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_P0_Architecture_and_Data_Contract_v1.0_FROZEN.md:144>).

---

**4. Verified current structures and enforcement**

| Structure | What exists | Licensing implication |
|---|---|---|
| `workspace` | `kind = FAMILY \| SCHOOL`, display name, active/inactive status | Represents the two delivery engines. No commercial audience, institution, household, or site identifier. |
| `workspace_membership` | Adult user, workspace, role, status; one active membership per workspace/user | Supports multiple adults. FAMILY permits OWNER; SCHOOL permits OWNER, SCHOOL_ADMIN, TEACHER. No instructor ceiling or separate teaching authorization. |
| `learner_ref` | Workspace-bound UUID, display code, optional broad age/grade bands, status | Supports pseudonymous children without Auth accounts. No annual-level assignment or licensed registration state. Display code is not uniquely constrained. |
| `cohort` | SCHOOL workspace, code, status | Supports multiple groups. No capacity, roster-completeness requirement, site, or schedule. |
| Teacher assignment | Membership/cohort association, same-workspace composite FKs, active/revoked status | One adult can teach multiple cohorts. Assignment counts are not instructor counts. |
| Learner assignment | Learner/cohort association, same-workspace composite FKs, active/revoked status | Can represent enrollment. One learner can belong to multiple cohorts. |
| `billing_reference` | One workspace and **one exact program version**, offering/Stripe identifiers, idempotency and payment states | No typed license terms, capacity, bundle items, or duration. Subscription/invoice fields are required to remain null. |
| `entitlement` | Exact workspace/version/billing basis; ACTIVE/SUSPENDED/REVOKED | Enforces exact-version access. It represents neither teaching rights nor capacity. |
| `program` / `program_version` | Stable program identity, version identity, publication state, content hash, locale/completion rules | Supports shared, historically stable curriculum. No annual-level or stage hierarchy. |
| `mission` | Exact version, mission key, sequence, rules | Stable identity within a version. No accepted canonical lesson identity extension. |
| Progress/delivery | Learner–mission progress and separate cohort–mission delivery | Preserves independent history; cohort delivery does not establish individual participation or completion. |

The commerce structures are in [M1 billing and entitlements](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000100_portal_domains.sql:183>). Publication, purchase-basis, and learning-context immutability are guarded in [M3](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000300_portal_guards.sql:48>).

Licensing dimensions divide as follows:

| Classification | Dimensions |
|---|---|
| **Already represented and enforced in source** | Workspace isolation; active membership; cohort-scoped learner visibility; exact-version entitlement; same-workspace FKs; immutable purchase correlation and learning context; published curriculum immutability. |
| **Represented, but no licensing enforcement** | Learner population; instructor memberships; cohort enrollment; cohort count; payment/access statuses as the basis for future workflows. |
| **Missing from schema** | Audience classification; commercial license class/terms; numeric capacity; capacity measure; teaching-seat authorization; bundle scope items; capacity-upgrade semantics; license validity dates if finite duration is chosen; organization/site license relationships. |
| **Unreliable without registration or operational evidence** | Actual unique children served; actual unique instructors behind shared credentials; concurrent attendance; physical classroom/site use; organization-wide deduplication across separate workspaces. |

A trusted `offering_key` could select terms in future server code, but the present text field and absent Portal offer-processing workflow do not constitute enforceable licensing.

---

**5. Learner-capacity enforcement and data minimization**

The frozen contract explicitly permits cohort delivery without individual entries. The later SCHOOL recording RPC also checks cohort authority and entitlement without requiring a learner roster. See the [frozen delivery distinction](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_P0_Architecture_and_Data_Contract_v1.0_FROZEN.md:352>) and [later cohort RPC](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261008000100_portal_mission_status.sql:102>).

These measures are different:

| Measure | What it counts | Present feasibility |
|---|---|---|
| **Unique registered learners** | Distinct stable learner references within an explicitly defined workspace and counting period | Possible with existing learner records, mandatory registration rules, and new capacity enforcement. |
| **Concurrent learners** | Learners participating at the same time | Not represented. Adult sessions and mission statuses do not establish attendance. |
| **Cohort enrollment capacity** | Active learner assignments within each cohort | Countable when rosters exist. Summing cohorts can count the same child repeatedly. |
| **Licensed classroom/group capacity** | Authorized groups, or permitted size of each group | Requires explicit license terms and group/headcount rules. Cohort count alone does not establish group size. |

For example, one child enrolled in two cohorts produces **one unique learner and two enrollments**. Neither count establishes concurrent attendance.

A privacy-minimized registered-learner model can use the existing workspace-local UUID and generated display code. It does not require child email, legal name, birth date, address, media, or authentication. Optional age/grade bands need not become licensing requirements.

However:

- A stable reference identifies a **registered record**, not independently verified physical identity.
- Multiple references can represent the same child.
- One reference can be improperly reused for several children.
- Unregistered attendees remain invisible.
- A pseudonymous child record can still be personal data when the instructor can link it to a child.

Therefore, software can reliably enforce a ceiling on distinct authorized **records**. Applying that ceiling to actual children taught requires complete registration, stable record reuse, truthful instructor practice, and an approved compliance policy. Collecting more identifying information does not automatically solve off-platform misuse.

**Recommended P0 measure, subject to Human approval:** active registered learners across the entire commercial workspace, counted once regardless of cohort or annual level. Existing `learner_ref` rows can support this without another learner table if every ACTIVE commercial learner reference consumes a licensed place.

Commercial delivery would then require registered, active cohort participants. A nonempty roster alone cannot prove completeness; the operating policy must require all intended participants to be represented.

Further distinctions require separate decisions:

- **Lifetime/term unique learners:** active status alone is insufficient. Archiving one learner and adding another would recycle capacity. A durable license-period registration ledger would be needed.
- **Concurrent seats:** would require attendance/check-in or comparable time-bound records.
- **Organization-wide unique learners across workspaces:** would require a shared license boundary and privacy-preserving cross-workspace registration identity.
- **Roster-free group licensing:** remains possible, but it must be sold and enforced as group/classroom capacity rather than unique-learner capacity.

These alternatives should not all enter P0.

---

**6. Curriculum scope, bundles, purchases, and historical progress**

| Requested scope | Feasibility |
|---|---|
| One annual level | Works if an approved mapping resolves that annual level to exact published versions containing only its authorized curriculum. Current schema does not establish that mapping. |
| Multiple annual levels | Multiple version entitlements can coexist. No learner or workspace is constrained to one version. |
| Three-level stage bundle | Access can be expressed as several exact-version entitlements. A single bundle payment cannot currently back entitlements to different versions. |
| All-level family access | Can be an explicit purchased set of approved versions. It should not silently imply access to every future publication. |
| Additional level purchases | New billing/access records can be added without changing existing learner or progress identities. |
| Capacity upgrade | Requires separate capacity rights; purchasing another curriculum level must not automatically multiply teaching capacity. |

The bundle limitation is a database constraint:

`entitlement(billing_reference_id, workspace_id, program_version_id)` references the matching triple in `billing_reference`, whose row contains one version. Checkout, PaymentIntent, and Charge IDs also have uniqueness constraints. Duplicating payment rows for each bundle component would conflict with those provider identities.

See [M1 commerce constraints](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000100_portal_domains.sql:183>).

The smallest sound bundle extension is an immutable purchase-to-exact-version scope relation. It preserves one payment identity while permitting several curriculum access items.

Curriculum identity must remain exact:

- Purchase additional access by inserting new scope/access records.
- Keep prior billing correlation, learner IDs, mission IDs, and delivered version IDs.
- Do not repoint historical progress to a newer version.
- Do not duplicate curriculum for FAMILY, EDUCATOR, and ORGANIZATION.
- Do not infer canonical lesson identity or purchased annual scope from display labels, mission ordinals, or sequence ranges.

The accepted scope unit is a complete `program_version`. **If one version contains several annual levels, current entitlement enforcement cannot restrict access to only one of those levels.** That requires an approved content-boundary decision or finer scope model; the unaccepted canonical amendment cannot be assumed to supply it.

Published content and historical delivery remain pinned under the [frozen immutability contract](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_P0_Architecture_and_Data_Contract_v1.0_FROZEN.md:519>).

There is also a scaling limitation: the current runtime rejects result sets exceeding 100 rows. This affects entitlement history, subjects, curriculum rows, and potentially annual packages. It is a technical response bound, **not a licensed learner cap**. Larger offerings require an approved bounded-read/pagination approach. See [runtime row bounds](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/lib/portal/runtime.js:113>).

---

**7. Are `workspace.audience_type` and `billing_reference.license_class` sufficient?**

**No.** Neither field currently exists in the inspected implementation, and adding the labels alone would not enforce:

- learner or instructor limits;
- which memberships may teach;
- the counting basis or counting period;
- bundle scope;
- capacity upgrades and stacking;
- finite license validity;
- site boundaries;
- refund effects on capacity.

A classification extension would still be useful:

| Commercial audience | Preserved delivery engine |
|---|---|
| FAMILY | FAMILY |
| EDUCATOR | SCHOOL |
| ORGANIZATION | SCHOOL |

That mapping needs controlled provisioning and database/server validation. Clients must not turn a household purchase into teaching rights by changing an audience value.

The **minimum additional enforceable concepts**, assuming bundles and capacity upgrades are included, are:

| Concept | Minimum implication |
|---|---|
| **Purchase scope items** | Immutable association between one billing purchase, its workspace, and each exact purchased program version. Replace the present single-version entitlement basis with equivalent purchase/workspace/version integrity for new purchases. |
| **Workspace license grant** | Purchase-backed, workspace-bound terms containing the license class or trusted reference to it, explicit capacity measure, learner ceiling, instructor ceiling, and ACTIVE/SUSPENDED/REVOKED lifecycle. Purchased terms remain immutable; status changes are audited. |
| **Explicit teaching authorization** | A controlled field on existing membership, such as `teaching_authorized`, can distinguish instructors from administrative members. No additional Auth identity system is needed. |
| **Commercial learner-registration rule** | Reuse existing learner references and cohort assignments for active registered-learner licensing. A separate registration ledger is needed only if lifetime/term uniqueness is selected. |
| **Approved curriculum-scope mapping** | A trusted, versioned offer mapping must resolve annual levels/bundles to exact published versions. A new runtime hierarchy is unnecessary if that mapping is sufficient. |

For purchase scope and capacity-only upgrades, `billing_reference` would need an approved forward extension toward a purchase-header role. Its present mandatory single-version relationship cannot truthfully represent a capacity-only purchase with no curriculum item. Using a fabricated curriculum version as a placeholder would obscure purchase facts.

Existing migrations and historical purchase rows should retain their facts. Any future relational change must preserve equivalent integrity; dropping the present composite FK without a replacement would weaken the contract.

No general subscription engine is required. Validity dates become necessary only if Human Authority chooses finite license terms. Undecided duration must not silently become a perpetual promise.

---

**8. Minimum P0 licensing recommendation**

Subject to Human approval:

- **FAMILY:** one licensed household workspace using the FAMILY engine; multiple learner references; no sibling capacity charge; explicit curriculum scope; no commercial teaching grant.
- **EDUCATOR:** one SCHOOL workspace; multiple cohorts; one explicitly authorized adult instructor by default; a chosen workspace-wide learner-capacity measure; explicit curriculum scope.
- **ORGANIZATION:** one SCHOOL workspace with explicit authorized instructor and learner ceilings; multiple cohorts; one clearly defined licensed organization/site boundary.

Capacity should apply across the workspace’s curriculum scope. Buying three annual levels should not create three learner pools unless that is explicitly sold.

A small upgrade rule could use **purchased total ceilings**, with the greatest applicable ACTIVE ceiling providing current capacity. Curriculum-only purchases would not change capacity. This avoids additive stacking and a replacement-chain system. It is a recommendation requiring approval, not an existing rule.

Under that model, refunding an upgrade can restore a lower surviving ceiling. Refund processing must remain truthful even when existing registrations exceed the reduced capacity. Preserve all records, prevent expansion, and apply an approved resolution rule to future teaching. Do not automatically delete learners or progress.

For site boundaries, the smallest P0 approach is **one licensed workspace per approved organization/site boundary**, without pooled capacity across workspaces. If multi-site pooled rights are required, an organization/license-root relationship becomes necessary. A display name does not create that boundary.

---

**9. Missing enforcement mechanisms**

The minimum schema concepts require corresponding enforcement:

1. **Bounded provisioning and registration operations.** Workspace, learner, membership, teaching authorization, and assignment mutations require trusted actor/target checks and audit provenance. These management workflows are not implemented by accepted 01C.

2. **Transactional capacity checks.** Serialize competing registration, instructor authorization, and capacity changes on a common workspace/license lock. A read-count-then-insert sequence can oversubscribe under concurrency.

3. **Complete instructor accounting.** Count distinct authorized adults, not assignments or cohorts. OWNER and SCHOOL_ADMIN currently have cohort authority; limiting TEACHER rows alone would leave a bypass.

4. **Commercial teaching gates.** Validate matching audience/engine, ACTIVE license rights, instructor authorization, applicable capacity, authorized cohort, and exact curriculum entitlement.

5. **Database and direct-RPC coverage.** API-only licensing checks are insufficient where direct Data API/RPC access remains possible. Relevant helpers, RLS, grants, guards, and RPCs must agree. Privileged service paths also require bounded checks.

6. **Trusted Portal purchasing and event application.** Account-before-checkout, server-resolved offers, durable event idempotency, payment truth, atomic access/capacity updates, refund/dispute reconciliation, and notification separation remain required.

7. **Revocation and overcapacity handling.** Recalculate applicable rights after suspension, refund, dispute loss, and authorization removal while retaining history.

The repository explicitly records that Portal webhook processing and staff correction workflows are later implementation gates. See [M3’s commerce boundary](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000300_portal_guards.sql:288>) and [frozen Section R](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_P0_Architecture_and_Data_Contract_v1.0_FROZEN.md:576>).

---

**10. Security implications**

| Area | Verified boundary / risk |
|---|---|
| Cross-workspace isolation | Composite FKs and immutable purchase/access bases prevent moving a valid entitlement or learning context into another workspace. |
| Selected-workspace scope | Curriculum RLS permits the union of an adult’s authorized workspaces. The API separately checks the selected workspace. Future licensing must preserve both boundaries. |
| FAMILY versus teaching rights | FAMILY cannot create SCHOOL cohorts, but that does not detect commercial reuse of household materials. Explicit commercial rights and terms are needed. |
| Instructor authorization | Active SCHOOL membership already permits curriculum reads; cohort assignments constrain learner visibility. A teacher can read curriculum without a cohort assignment. New instructor licensing must address that accepted distinction explicitly. |
| Credential/content sharing | Workspace binding prevents entitlement transfer. It cannot guarantee that an adult never shares credentials or downloaded materials. |
| Refunds and revocation | Database guards require revocation for full refunds/final dispute loss. They do not implement the provider workflow or future capacity revocation. |
| Historical data | Revocation retains records. Current RLS can deny their visibility when entitlement is absent; retention is not a promise of continued customer access. |
| Private resources | Resource metadata exists in the accepted schema. The current download endpoint/module are untracked and cannot be assumed accepted. Their inspected checks cover Auth, selected workspace/version, locale, asset hash, and final reauthorization; they contain no new commercial license/capacity checks. |
| Service credentials | Service-role privileges bypass ordinary RLS. Existing server-only credential custody and bounded privileged operations must remain intact. |
| Authority provenance | Dirty application files and contradictory acceptance documents prevent treating HEAD or the whole worktree as an accepted release package. |

Relevant source: [M2 authorization/RLS](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/supabase/migrations/20261006000200_portal_security.sql:10>), [curriculum response reconciliation](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/api/portal/curriculum.js:9>), [current resource endpoint](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/api/portal/resources.js:9>).

Private Blob paths are identifiers, not permission grants. Future downloads must validate applicable rights before releasing bytes, keep credentials server-side, and avoid reusable public authorization links. Already downloaded bytes cannot be recalled by entitlement revocation.

The existing public-site commerce remains separate. Its [checkout](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/api/create-checkout.js:61>) has no Portal workspace purchase correlation; [check-access](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/api/check-access.js:64>) still accepts `payment_status === "paid" || status === "complete"`; the [webhook](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/api/stripe-webhook.js:104>) handles email fulfillment rather than durable Portal grants. None can serve as a Portal licensing fallback.

**HR compatibility must remain explicit:**

- **HR01:** Licensing registration must not become mandatory learning evidence. Reads, attendance, enrollment, or cohort delivery must not infer learner completion. Preserve explicit adult attestation and idempotency.
- **HR02:** Every future protected adult write must require the live/current managed session. Accepted read policies and original learning guards are not a universal current-session write guarantee.
- **HR03:** The inspected generation mechanism is bounded to the two later status RPCs. It does not automatically protect future registration, licensing, or purchasing operations. Preserve its security guarantee wherever approved; resolve its authority before extending or activating it.

The original M4 timestamp gate has documented same-second failures; M5 supplies the later correction. M4 must not be adopted alone as adequate HR02 protection.

The inherited notes remain open: **01B-A03, SNV02, SNV04, SNV05, SNV06**. HR03 does not establish global JWT invalidation or close SNV04/SNV06. See the [historical acceptance limitations](</Users/dosfam/Desktop/AIEAcademy/Website/2.0/docs/portal/AIEA_Portal_Sprint_01D_Final_Acceptance_and_Repository_Boundary_Review_v1.0.md:282>).

---

**11. What can safely be deferred**

These can remain outside the minimum model:

- subscriptions, recurring billing, proration, and automatic renewal;
- concurrent-seat telemetry and attendance tracking;
- lifetime-unique learner accounting, if active registered learners is the chosen measure;
- organization hierarchies and cross-site capacity pooling;
- child accounts and identifying child-data collection;
- SIS/LMS/SSO and automated rostering;
- per-learner curriculum enrollment when workspace scope covers every authorized learner;
- sophisticated tier catalogs and self-service license transfers;
- a full annual-level UI/import pipeline.

Exact prices, numeric learner caps, duration, and packaging remain undecided in this audit. They may be deferred during design, but applicable terms must be approved before sales or automated grants.

**The counting measure, instructor eligibility, license boundary, purchase scope, and refund/upgrade effects cannot remain ambiguous while those rights are being sold.**

---

**12. Decisions requiring Human Authority**

The approved product principles need no reconfirmation. Their operational and architectural consequences require decisions on:

1. **Current HR03/01D authority:** reconcile the historical acceptance record with later accepted-only release exclusions.
2. **Capacity measure:** active registered learners, period/lifetime unique learners, concurrency, enrollment, or classroom/group capacity.
3. **Counting boundary:** workspace-wide across all cohorts/levels; treatment of inactive learners and seat reassignment.
4. **Instructor eligibility:** explicit teaching authorization; treatment of OWNER/SCHOOL_ADMIN; instructor substitution and any EDUCATOR expansion beyond the default one instructor.
5. **Organization/site boundary:** one workspace per licensed boundary, or explicitly approved pooled rights.
6. **Curriculum packaging:** exact annual-level/version mapping, bundle contents, future-version access, and canonical identity handling.
7. **Upgrade and refund effects:** total ceilings versus additive rights, scope-only purchases, and reduced-capacity overages.
8. **Schema amendments:** classification fields, purchase scope items, license grants, and teaching authorization—separately from the unaccepted canonical lesson amendment.
9. **Commercial and privacy terms:** prices, limits, duration, authorized registration practice, and retention policy before broader launch.

---

**13. Exact next smallest safe task**

**D7.3-R1 — Human Licensing Policy Ruling, in chat.**

Review this audit and issue a bounded ruling on:

- current HR03/01D authority;
- learner-capacity measure and counting boundary;
- instructor eligibility;
- organization/site boundary;
- bundle purchase scope and capacity-upgrade semantics.

That ruling is the smallest prerequisite to a versioned licensing amendment draft. Numeric pricing and packaging can remain undecided while implementation and sales remain unauthorized.

**Read-only completion:** No files were modified or created. No tests, database writes, hosted Supabase connections, Stripe changes, website changes, commits, pushes, or deployments were performed. Final verification found all **226 Git-visible file hashes unchanged** from the inspection ledger, with unchanged HEAD and working-tree status.

**STOP.**
