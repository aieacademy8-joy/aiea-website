# AI EXPLORERS ACADEMY
# PORTAL GLOBAL DELIVERY & UX GOVERNANCE STATEMENT
**v1.1 • 12 October 2026 • Proposed governance addendum — human approval required**

> **One canonical learning architecture. Many languages, editions, devices, delivery modes and approved tools.**

## 1. Document Identity and Authority
- **Document type:** Portal product / UX/UI governance statement and design decision map.
- **Applies to:** AIEA Portal, school/teacher/student/family experiences, lesson packages, labs, integrations, localization and access models.
- **Status:** PROPOSED FOR REVIEW — not a frozen or repository-approved standard.
- **Authority:** Supplements, but does not override, frozen curriculum governance, Portal Tool & Integration Architecture v1.0, Activity Architecture Standard v1.0, developmental standards or existing safety requirements.
- **Change control:** Any conflict or proposed amendment must be reviewed by the human curriculum owner before implementation.

## 2. Foundational Product Statement
**The curriculum adapts to the school's technology; the school should not have to adapt to the curriculum.**

**AIEA should be globally teachable, locally adaptable, technologically independent and pedagogically consistent.**

Language, national context, available devices, connectivity, classroom arrangements, AI provider and contextual edition may vary. Learning goals, Human-First cognition, developmental appropriateness, assessment evidence, learner agency and safety boundaries must remain intact.

## 3. Non-Negotiable Design Invariants
1. **Learning goal before tool.** No lesson depends on a named vendor unless a justified, approved Tool Profile permits it and a meaningful fallback exists.
2. **Human First.** Learners think, plan, attempt, compare, verify, choose and reflect; AI does not replace these moves.
3. **Teacher-ready.** A capable nontechnical teacher can confidently facilitate the lesson from the guide.
4. **Technology-equivalent pathways.** Low-tech and high-tech routes target equivalent understanding and acceptable evidence, not necessarily identical activities.
5. **Age-appropriate mediation.** Young learners use embodied and social experiences; student device access increases only when learning requires it.
6. **Safety and privacy by design.** School policy, age, access rights, child protection, local requirements and provider restrictions govern use.
7. **Tool replaceability.** Tool Profiles, not lesson text, bind capabilities to approved products.
8. **Localization with fidelity.** Translation preserves conceptual accuracy, assessment intent and safeguarding while adapting examples and language scaffolds.
9. **Accessible alternatives.** Provide appropriate offline, printable and non-device pathways when feasible; identify tasks that genuinely require computing.
10. **Evidence over spectacle.** Progress measures learner capability rather than visual polish or sophistication of AI output.

## 4. Global Delivery Resolution
**Canonical learning objective → contextual edition → locale/language → school policy → learner readiness → classroom technology/connectivity → approved tool capability → accessible fallback → evidence capture.**

| Context | Illustrative delivery route | Core invariant |
|---|---|---|
| Offline / minimal technology | Teacher Guide, printable cards, role-play, paper investigations, offline evidence | Same learning objective and safety |
| One projector / smartboard | Teacher-led Present Mode, shared class interactions, paper/group activities | Students still think first |
| Shared devices | Teacher presentation plus rotating team labs | Equitable participation |
| 1:1 devices | Guided student workspace, approved tools, portfolios | Human judgment and review |
| Home / after-school | Parent/facilitator-led variant with suitable pacing | Same capability target |
| Restricted provider market | Approved local tool or AIEA-native simulation; no vendor-specific dependency | Country compliance and fidelity |

**Qualification:** Offline parity is a design goal, not a promise that every advanced coding, API or engineering activity can run unchanged without devices. Where exact capability cannot be reproduced offline, explicitly document the nearest valid conceptual fallback and what practical skill remains unassessed.

## 5. Editions and Localization
**Canonical Core:** stable objective, concept, progression, Human-First steps, assessment look-fors, safeguarding and evidence requirements.

**Edition Layer:** School, After-School, Family, Christian, Interactive Lab and permitted contextual/character variants adapt facilitation, timing, supporting materials and setting. The **Christian edition** may add Bible connections and faith-oriented reflection without silently replacing the canonical AI-literacy objective; suitability and school requirements must be reviewed.

**Localization Layer:** English, Ukrainian, Simplified Chinese, Arabic and additional languages are possible future releases, not confirmed production commitments. Localize child-facing language, examples, teacher notes, reading level, cultural context and accessible vocabulary. Require qualified educational review, language QA and regional legal/privacy review before release.

**Provider Layer:** Country-specific Tool Profiles select permitted and available services. Do not assume ChatGPT, Claude or any other provider is available in every jurisdiction. Assess local hosting, data transfer, provider terms, student ages, censorship/access and school procurement requirements separately.

## 6. UX/UI Experience Map
**Public AIEA website → subscription/license and identity → role-based Portal → level/quarter/mission → teaching/learning workspace → evidence and progress.**

| Role | Essential portal surfaces | Priority |
|---|---|---|
| School administrator | Licenses, school configuration, teacher/class access, policies, reporting | Core delivery / phased |
| Teacher | Lesson overview, Teacher Guide, Present Mode, assets, lab launch, assessment, fallback | MVP priority |
| Student (when appropriate) | Think-first workspace, approved lab/tool access, submit artifact, reflect, portfolio | Phased by level |
| Family / facilitator | Guided mission view, materials, progress and optional home connection | Edition-dependent |
| AIEA operator | Content publishing, locale/edition control, tool governance, incidents and audit | Operational requirement |

### Teacher lesson screen — reference layout
**Header:** Level • Quarter • Mission • learning objective • edition • language.

**Left/teacher panel:** preparation, timing, accurate explanation, differentiation, safeguarding, fallback.

**Main/presentation area:** Wonder → Think → Explore → Create/Investigate → Check/Choose → Reflect/Flourish.

**Actions:** START LESSON • PRESENT MODE • OPEN NATIVE LAB / APPROVED TOOL • PRINT / OFFLINE PACK • CAPTURE EVIDENCE • COMPLETE.

**Never show private teacher notes or student records on the public classroom display.** Present Mode must be display-safe and legible at smartboard distance.

## 7. Developmental Technology Progression
| Stage | Typical use | Device expectation |
|---|---|---|
| Level 1 DISCOVER (1A–1C) | Teacher-led, embodied, playful, optional shared display | No individual student device required |
| Level 2 CREATE (2A–2C) | Teacher-guided demonstrations, comparisons, shared interactive practice | Shared display generally sufficient for many lessons |
| Level 3 INNOVATE (3A–3C) | Purposeful creation, research, multimedia, no-code, verification | Periodic shared or individual devices for creation tasks |
| Level 4 BUILD (4A–4C) | Explore / Build Lab / Evaluation Studio, testing and documentation | Reliable computing access needed for practical build sessions |
| Level 5 LAUNCH (5A–5C) | Authentic projects, professional workflows, documented decisions | Sustained device/tool access for applied pathways |

## 8. Tool Integration and MVP Boundary
Existing Portal Tool & Integration Architecture v1.0 defines:
- **Mode A — AIEA Native:** AIEA-built labs and workflow tools.
- **Mode B — School-Provided External:** approved school-provisioned tools launched through Tool Profiles.
- **Mode C — AIEA Embedded Provider:** future controlled AIEA interface backed by replaceable provider APIs.
- **MVP priority:** Modes A + B. Mode C is a future capability, not a current promise.
- **Runtime selection:** lesson capability → school policy → learner level/readiness → approved Tool Profile → fallback.
- **Student sequence:** THINK FIRST → PLAN → TOOL CHOICE → CREATE/INVESTIGATE → RETURN TO AIEA → DOCUMENT AI → VERIFY/TEST → REFLECT → PORTFOLIO.

Do not design MVP as an all-provider AI super-app. The Portal owns learning orchestration and evidence; third-party generation remains bounded and replaceable. AIEA-native simulations should support safe practice and tool-independent learning.

## 9. Product Acceptance Gates for Every Mission
- Can a teacher find the learning objective and launch the experience quickly?
- Is the lesson teachable with its declared minimum infrastructure?
- Is a meaningful low-tech fallback provided or an explicit limitation recorded?
- Is the teacher-facing versus display-facing information separated?
- Does the learner think before any AI action?
- Are approved tool use, age controls, privacy and school policy respected?
- Can evidence be recorded without requiring personal paid AI subscriptions?
- Does localization preserve accuracy, learning goal, safeguards and assessment?
- Does the Christian or other edition preserve the canonical objective?
- Can an AI provider be swapped without rewriting the instructional core?
- Are accessibility, student privacy, device sharing and offline failure states handled?
- Is the teacher capable of delivering the experience without specialist technical knowledge?

## 10. Phased Implementation Guidance
**Phase 1 — Core delivery:** role-aware access, licensed content, teacher guides, display-safe Present Mode, downloadable assets, basic evidence and offline packages.

**Phase 2 — AIEA Interactive Lab:** native simulations and Human-First workflow tools aligned with real lessons.

**Phase 3 — School integrations:** policies, roster/SSO where justified, more complete reporting and Tool Profile resolution.

**Phase 4 — AIEA Creation Sandbox:** only after safety, privacy, operational cost and provider governance are mature.

**Phase 5 — Level 4+ Build Studio:** robust creation, test/evaluation and portfolio workflows.

These are architectural phases, not delivery dates or a statement that features already exist.

## 11. Visual Governance / Decision Tree
```text
                  CANONICAL AIEA LEARNING OBJECTIVE
                               |
                  Human-First + Safety + Evidence
                               |
                Edition + Language + Local Context
                               |
             School Policy + Age + Accessibility Check
                               |
                 Classroom Infrastructure Check
                    /           |            \
                 OFFLINE      SHARED        1:1
                    \           |            /
                    APPROVED EXPERIENCE ROUTE
                               |
              AIEA Native / Approved External / Fallback
                               |
               Student Action + Teacher Facilitation
                               |
                Evidence + Verification + Reflection
                               |
                  SAME LEARNING DESTINATION
```

## 12. Traceability and Governance Decision
**Source alignment:** Portal Tool & Integration Architecture v1.0; Activity Architecture Standard v1.0; Canonical Quarter Map Template v1.1; Preschool Developmental Language & Embodied Learning Standard v1.0; Developmental Translation & Layered Explanation Standard v1.1; Level 3 Creation & Tool Skills Progression v1.0.

**New proposals in this statement:** detailed Portal UX surfaces, screen structure, global/localization governance gates, acceptance checklist and recommended MVP UX prioritization. These require product-owner review and must not be represented as already frozen repository decisions.

**Proposed ruling:** Adopt as the guiding UX/UI and global delivery design statement after review; retain the existing frozen curriculum standards and tool architecture as controlling sources.

> **AIEA owns the learning experience. Tools provide bounded capabilities. Same learning destination; adaptable paths.**



## 13. Implementation Governance Annex — Mandatory Product Requirements (NEW v1.1)
The following requirements operationalize the statement above. **MUST** means a release-blocking requirement within the stated product scope; **SHOULD** means recommended with documented rationale for exceptions; **FUTURE** is not a present-day promise.

### 13.1 Experience Modes and Minimum Infrastructure
- **PR-01 | MUST:** Each published mission records `supported_delivery_modes`, `minimum_infrastructure`, `required_assets`, `tool_capabilities`, `fallback_route`, `evidence_options` and `known_limitations`.
- **PR-02 | MUST:** Declare one or more of `OFFLINE_TEACHER`, `PRESENT_SHARED`, `SHARED_DEVICES`, `ONE_TO_ONE`, `REMOTE_FACILITATED`. These are delivery routes, not separate curricula.
- **PR-03 | MUST:** When a route is unsupported, display the reason and available alternatives before lesson start; never imply an advanced practical lab is fully equivalent to an unplugged activity.
- **PR-04 | SHOULD:** Provide teacher-printable packs and low-bandwidth media options where pedagogically feasible.
- **PR-05 | MUST:** An offline pack must explicitly identify what works without network, what requires a device, what evidence is recorded locally and what cannot sync until connectivity returns. Offline downloadable content does **not** imply offline interactive functionality.

### 13.2 Teacher Experience and Display Safety
- **PR-06 | MUST:** A unified Lesson Player must expose learning objective, duration, preparation, teaching sequence, assets, tool access, assessment look-fors and fallback within the same mission context.
- **PR-07 | MUST:** Present Mode is display-safe: hide teacher-only notes, class lists, individual student records, credentials and private evaluations.
- **PR-08 | MUST:** Provide an explicit transition from each stage to the next; include pause/resume and printable alternative when supported.
- **PR-09 | SHOULD:** Support smartboard distance legibility, touch targets, keyboard navigation, projection aspect ratios and an accessible no-animation/reduced-motion path.
- **PR-10 | MUST:** Teacher guidance must be sufficient to deliver the lesson without specialist AI tool knowledge; prerequisites and setup instructions must be discoverable before class.

### 13.3 Country, Locale and Tool Independence
- **PR-11 | MUST:** Maintain stable canonical mission IDs and separate localized content, edition overrides, tool mappings and delivery configurations.
- **PR-12 | MUST:** Tool resolution checks permitted capability, country availability, school policy, age/consent and required privacy constraints **before** offering a provider.
- **PR-13 | MUST:** Provider unavailability, API outage, rate limit, license expiry or school prohibition must fail safely and present a meaningful approved fallback where available.
- **PR-14 | MUST:** No named AI provider is a prerequisite for accessing the canonical instructional core. Practical tasks with provider-specific requirements must declare that dependency and alternate route.
- **PR-15 | MUST:** Localization review covers instructional meaning, child-facing readability, terminology, culture, accessibility, assessment fidelity, safeguarding and media assets; a machine translation alone is not a release approval.
- **PR-16 | MUST:** Language and country are distinct configuration dimensions; schools may teach in a language different from their geographic region.

### 13.4 Editions, Identity, Licensing and Progress
- **PR-17 | MUST:** School, After-School, Family and Christian editions reference the same canonical mission ID and preserve its learning objectives and evidence requirements. Edition-specific content is a governed overlay.
- **PR-18 | MUST:** Christian Edition Bible connections and faith reflections are explicit edition assets; they must not appear in Universal/School delivery unless that edition is selected and authorized.
- **PR-19 | MUST:** Role-based permissions separate school administrator, teacher, student, family/facilitator and AIEA operator access. Default to least privilege.
- **PR-20 | MUST:** Content access is governed by license/entitlements, not by easily guessed URLs alone; precise pricing, billing units and tier boundaries remain open business decisions.
- **PR-21 | MUST:** Published mission versions are immutable snapshots for active assignments, or version changes require a controlled migration and teacher notice.
- **PR-22 | SHOULD:** Offer standards-based or documented export of learner artifacts, feedback and progress, with permissions, retention rules and portability constraints.

### 13.5 Child Protection, Accessibility and Data
- **PR-23 | MUST:** Define child-data categories, purposes, consent/authority, retention/deletion, access logs, incident handling, vendor subprocessors and region-specific compliance review before processing student data.
- **PR-24 | MUST:** No student-facing external AI tool is enabled solely because an API key exists; it requires age, school, regional and data-policy approval.
- **PR-25 | MUST:** Provide accessible participation and evidence options appropriate to learner needs; avoid making a timed game, audio-only prompt or fine-motor input the sole route to demonstrate understanding.
- **PR-26 | MUST:** Protect student privacy in shared-display mode, shared devices, exports, portfolios and classroom demonstrations.
- **PR-27 | SHOULD:** Allow teachers to deliver learning without creating individual child accounts for early years, where consistent with school policy and product requirements.

### 13.6 Evidence and Learning Integrity
- **PR-28 | MUST:** Evidence maps to a canonical learning objective and assessment look-for, regardless of whether it is oral, paper-based, uploaded or digitally produced.
- **PR-29 | MUST:** When AI contributes to an artifact, the learner records AI's role at an age-appropriate level; teacher assessment evaluates human understanding, verification and choices.
- **PR-30 | MUST:** The system must not equate tool usage counts, prompt length, time-on-screen or output polish with AI literacy proficiency.

## 14. UX/UI Acceptance Scenarios (NEW v1.1)
| ID | Given / When | Expected release criterion |
|---|---|---|
| UX-01 | Teacher selects an offline classroom | Eligible mission launches via offline pack; unavailable features clearly identified |
| UX-02 | Teacher connects one smartboard | Present Mode shows only classroom-safe content; teacher notes remain private |
| UX-03 | School has 1:1 tablets | Student workspace offers age-appropriate activity without changing canonical goal |
| UX-04 | Provider blocked or unavailable in a country | No dead-end link; approved substitute, native lab or honest limitation is shown |
| UX-05 | School prohibits a tool | Tool is absent from student launch and teacher sees policy-compliant alternative |
| UX-06 | Teacher switches English to Ukrainian/Chinese | Correct reviewed locale assets load; untranslated items flagged, not silently substituted |
| UX-07 | Christian Edition is enabled | Faith-specific overlay appears only for authorized edition |
| UX-08 | Teacher changes mission version mid-term | Active assignments remain pinned or controlled migration is approved |
| UX-09 | Learner uses shared device | No cross-student exposure of artifacts, identifiers or progress |
| UX-10 | Learner uses no personal account | Teacher can still capture age-appropriate evidence when permitted |
| UX-11 | Student uses AI for a creation task | Think-first, AI contribution, verification and reflection evidence are capturable |
| UX-12 | School license expires | Content access changes according to contract; student records follow documented retention/export rules |

## 15. Governance for AI Coding Agents and Design Decisions (NEW v1.1)
**Agents MUST NOT without explicit human approval:** change frozen learning objectives, Learning DNA, assessment requirements, developmental progression, edition boundaries, safety policies, canonical mission identifiers or data-retention commitments; introduce mandatory third-party AI dependencies; assume cross-border compliance; expose child data in logs, analytics or presentations; silently change published lesson versions.

**Agents MAY propose:** screen layouts, component architecture, configuration schemas, migration plans, prototypes and tests consistent with approved governance. Proposals must identify assumptions, source standard, affected surfaces, security/privacy impact and acceptance tests.

**Required change record:** `decision_id`, `problem`, `affected_missions`, `affected_editions/locales`, `governance_source`, `options`, `risks`, `human_approver`, `approval_date`, `implementation_owner`, `verification_evidence`.

**STOP gate:** If implementation conflicts with a frozen standard or lacks required safety/privacy decisions, stop that change, document the blocker and request a human ruling. Do not silently choose a new policy.

## 16. Product Boundary and Release Gates (NEW v1.1)
**MVP (target scope, subject to product approval):** teacher mission delivery, display-safe presentation, printable/offline teaching pack, role-aware access, licensed content, basic evidence capture, approved Tool Profiles and selected native learning interactions where lesson requirements justify them.

**NOT automatically MVP:** universal offline interactive app; embedded multi-provider generative AI; cross-border student-data hosting; full SSO/roster integration; automatic translation of all 15 years; every advanced lab on mobile; a paid AI subscription bundled for each learner.

**Release gates:** (1) curriculum fidelity; (2) supported delivery-route QA; (3) privacy/security review; (4) accessibility and developmental QA; (5) localization/edition QA where offered; (6) teacher usability testing; (7) evidence integrity; (8) approved change log.

## 17. Traceability, Open Decisions and v1.1 Approval (NEW v1.1)
**Existing controlling sources:** Portal Tool & Integration Architecture v1.0; Activity Architecture Standard v1.0; Canonical Quarter Map Template v1.1; Preschool Developmental Language & Embodied Learning Standard v1.0; Developmental Translation & Layered Explanation Standard v1.1; Level 3 Creation & Tool Skills Progression v1.0. The present annex proposes product-level implementation controls; it does not claim these detailed requirements are already ratified by the source standards.

**Open decisions:** actual portal hosting regions and legal counsel review; data retention periods; offline app versus printable pack roadmap; licensing and billing model; provider allowlists by country; accessibility conformance target; supported languages at launch; student account requirements by age; technical content schema and UX component library.

**Approval record:** Status `PROPOSED`; owner approval `PENDING`; repository freeze `NOT PERFORMED`; supersedes v1.0 only after human sign-off.

> **Final invariant:** Access to technology must not be confused with access to quality education. AIEA should offer meaningful, safe learning paths across budgets, devices, connectivity, languages and countries while explicitly stating where hands-on technical competence requires computing.
