# AIEA Portal — Sprint 01B Implementation Plan v1.0

Date: 2026-10-06 (America/Chicago)

Authority: Human Authority's Sprint 01B Implementation Authorization, supplied
after approval of read-only reconnaissance. This plan records that authorization;
it does not authorize staging, commit, push, deployment, hosted setup or Sprint 01C.

## Baseline

Verified before implementation: branch `main`; HEAD, local main and cached
origin/main all `0b9d4af280c05e128e07a15e4687b053082f9eea`; clean working tree;
empty index. Accepted Sprint 01A artifacts are committed and present. Frozen v1.0
is byte-identical to freeze commit `052101670dc92b38c7ec15c88a2b07572e42d75b`,
SHA-256 `f63b7204aa0b76ad94bc11f65479e8b0234c6e7d04ae9a6a0b6db2b9cdf0a755`.

## 1. Objective

Existing-adult numeric email OTP sign-in, protected Portal runtime, selection of
existing authorized workspaces, and a minimal workspace/access summary.

## 2. Dependency rationale

Sprint 01A supplies the database, RLS and accepted native security foundation.
The application is static HTML/CSS/JS plus CommonJS Vercel handlers, with no Portal
runtime. Existing-adult passwordless Auth is validated; numeric-code email/UI is
new behavior. Authentication and request-time workspace authority precede writes,
curriculum delivery and checkout. No framework migration or service-key read is
needed. Workspace creation requires a later bounded transaction/onboarding scope.

## 3. In scope

- Explicit `create_user=false` OTP request; numeric email/code verification.
- Existing non-anonymous identities with active, adult-confirmed profiles only.
- Server-managed session ending no later than access-token expiry; reauthentication.
- Protected entry, own active memberships in active workspaces, zero/one/multiple
  workspace behavior, request-time selected-workspace revalidation.
- FAMILY/SCHOOL kind, explicit existing role and permitted entitlement summaries.
- Current-session signout, private-state clearing and fail-closed errors.
- Responsive accessible AIEA-branded entry/shell; bounded tests/documentation.

## 4. Out of scope

Public signup/onboarding, invitations, profile/workspace/membership provisioning or
mutation, ownership/role changes, cohort management, learners/screens, curriculum
or resource delivery, learning/evidence/assessment, uploads, persistent refresh UX,
staff UI, checkout/Stripe, entitlement mutation, hosted setup, deployment,
production SMTP/Postmark, provider configuration, real users and later sprints.

## 5. Expected source paths

New: `portal/login.html`, `portal/portal.js`, `portal/portal.css`,
`api/portal/index.js`, `api/portal/auth.js`, `api/portal/context.js`,
`lib/portal/runtime.js`, `lib/portal/shell.js`,
`supabase/templates/adult-email-otp.html`, `scripts/portal/test-runtime.mjs`,
`scripts/portal/serve-local.mjs`, `scripts/portal/test-browser.mjs`,
`supabase/tests/portal-entry.native.py`, and the
required implementation/validation report. Modify only the Portal routing in
`vercel.json`, the blank configuration contract `.env.example`, and
`portal/README.md`. Tests may add focused local tooling within these boundaries.

## 6. Database impact

None. Preserve all three accepted migrations, grants, policies and helpers.
No new Portal tables, production seed or Auth DDL. STOP for Human review if a
schema change is genuinely required.

## 7. Server/API impact

Bounded entry/auth/context handlers. Verify sessions through configured Auth;
read active adult profile and tenant data using the ordinary adult JWT under
PostgREST `portal` RLS. No service key, synthetic claims or general proxy.
Strict field projections, workspace validation, bounded responses, no-store,
HttpOnly cookies and same-origin POST protection. Discard issued refresh tokens.

## 8. UI impact

Email/code form, resend and expiry feedback, workspace selector and empty states,
explicit workspace kind/role, status summaries and signout. Reuse AIEA brand tokens.
No public-site redesign or learner/dashboard expansion.

## 9. Frozen governance/security

Preserve all seven frozen rulings: (1) account/workspace/authorized membership
before checkout, no guest claim; (2) school teacher cohort privacy, explicit
owner/admin authority; (3) independent server-managed staff authorization;
(4) one-time commerce only, paid ACTIVE, full refund/final loss REVOKED, controlled
unresolved-dispute SUSPENDED, authorized partial-refund review, retained history;
(5) cohort delivery distinct from individual evidence; (6) controlled privacy and
retention categories, durations deferred; (7) adult passwordless aal1, privileged
staff current TOTP-backed aal2 plus capability, production SMTP prerequisite.

Preserve four OPEN NOTES unchanged: SNV02 deprecated inbucket/local mail worked;
SNV04 stale refresh rejection without demonstrated current-chain cascade;
SNV05 same-site redirect behavior does not establish exact callback paths;
SNV06 ordinary stateless PostgREST can accept unexpired signed-out JWTs.
The accepted SNV03 live managed-session/bound-factor staff gate remains unchanged.
The application Auth check does not fix or reclassify ordinary Data API behavior.

## 10. Configuration — identify only

Runtime: `PORTAL_SUPABASE_URL`, `PORTAL_SUPABASE_PUBLISHABLE_KEY`, `PORTAL_ORIGIN`.
Secret/service-role key unused. Numeric template uses `{{ .Token }}`. Local tests
may configure a disposable copy only. Hosted email/SMTP, origins, rate/abuse
controls, exposure of portal only and controlled adult provisioning require later
authorization. Never configure hosted Vercel, Supabase, Stripe, Postmark or others.

## 11. Validation

Runtime/security tests: malformed/forged/expired/wrong-project tokens, profile
absence/inactivity, Auth/DB outages, direct API, Origin/CSRF, cookies/cache,
token leakage, expiry/signout and per-request user isolation.
Tenancy: zero/one/multiple membership, forged/switch/revoked/inactive workspace,
FAMILY/SCHOOL roles and retained cohort isolation. Entitlements: permitted columns
and selected-workspace summaries only; no content authorization or legacy tokens.
Native OTP: actual numeric delivery/verification, wrong code/email, replay,
expiry/resend/rate handling, denied implicit/public/anonymous signup.
Preserve/re-run 188 database assertions, 7 runner self-tests and SNV01/SNV03 native
regressions. Run SNV01 against the accepted magic-link configuration, numeric OTP
against an explicitly identified disposable template overlay. Do not rewrite
historical evidence or claim the old fixed-allowlist validator passes new paths.
Validate browser flow and relevant unchanged public routes. Clean disposable
services/data and report exact measured results and remaining limits.

## 12. Acceptance

Real local application numeric OTP completes for a synthetic existing adult;
private entry/context require valid active adult authorization; workspace reads
are current and bounded; roles and cohort boundaries remain; summaries exclude
billing/provider identifiers; no domain writes or refresh lifecycle introduced;
tokens remain outside browser JS/URLs/logs/storage; expiry/signout clear private
state; scoped tests and accepted regressions pass; frozen/prior evidence unchanged.
This is bounded local/repository acceptance, not hosted/production readiness.

## 13. Human rulings and remaining gates

1. Existing-account scope APPROVED: no public signup, onboarding, invitation,
   profile/workspace/membership provisioning.
2. Access-token-expiry session boundary APPROVED; persistent refresh excluded.
3. Future SCHOOL ownership DEFERRED; read existing memberships/roles only.
4. Disposable local synthetic testing AUTHORIZED; clean resources, no real data.

Implementation and local validation are authorized. Material/destructive/local
infrastructure terminal permissions must be requested with their purpose.
No staging, commit, push, deployment, hosted-provider changes or later sprint.
STOP on a frozen/security conflict; do not silently resolve it.
Live onboarding, SMTP/abuse controls, hosted assurance, policy and commerce gates
remain later Human Authority work.

## 14. Sequence and deliverables

Create this plan first; implement bounded server/session contracts; implement OTP
and shell; add isolated numeric template/testing; run scoped/adversarial and
accepted regressions; verify cleanup and preserved bytes; create
`AIEA_Portal_Sprint_01B_Implementation_and_Validation_Report_v1.0.md`; STOP for
Human review with all work unstaged and uncommitted.
