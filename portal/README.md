# Portal runtime — Sprint 01B

The website remains static HTML/CSS/JavaScript with CommonJS Node serverless
functions. Sprint 01B adds the bounded existing-adult entry runtime authorized in
[the implementation plan](../docs/portal/AIEA_Portal_Sprint_01B_Implementation_Plan_v1.0.md).
No framework, bundler or Supabase SDK was added. Hosted setup is not performed.

Database code lives in `supabase/migrations`; executable database cases live in
`supabase/tests`; offline repository validation lives in `scripts/portal`.
The `portal` PostgreSQL schema is the future API boundary. `portal_private` is
never an exposed Data API schema. Existing download checkout is independent.

## Runtime boundary

`/portal/login.html` requests/verifies a six-digit email OTP. `/portal` and
`/portal/` rewrite to the protected `/api/portal/index` handler. Both the entry
and `/api/portal/context` validate Auth and an active adult-confirmed profile.
`/api/portal/auth` accepts only POST request/verify/signout actions with strict
same-origin JSON input. Unknown-account requests have a generic response;
provider/rate failures remain failures. Implicit user creation is always disabled.

The runtime reads `PORTAL_SUPABASE_URL`, `PORTAL_SUPABASE_PUBLISHABLE_KEY` (modern
`sb_publishable_` key), and `PORTAL_ORIGIN`. Only configured HTTPS is allowed,
except explicit loopback HTTP for disposable local development. Configuration
comes from environment management, never static source substitution or browser
input. The service secret is not consumed. Do not set up hosted values in 01B.

Only the access JWT goes in a host-only HttpOnly, SameSite=Lax cookie; HTTPS uses
Secure and the `__Host-` prefix. Local loopback HTTP uses a distinct cookie name.
The cookie expires no later than the JWT. Refresh tokens are discarded, with no
persistent session/refresh UX. No access/refresh token enters browser JavaScript,
URLs, API JSON, localStorage, sessionStorage or logs. Numeric codes necessarily
pass transiently through the form/request; they are never persisted or logged.

Every private request checks expected issuer/audience/role/expiry and validates
the JWT through the configured Auth `/user` endpoint; decoding alone is never
authentication. Reads forward the adult JWT to `portal` PostgREST under existing
RLS. Context lists only that adult's active memberships in active workspaces,
validates the selected workspace anew, and projects permitted status fields.
Zero workspaces is a valid empty state; one auto-selects; multiple require a choice.
Selection is not stored as authority. Results are bounded to 100; overflow fails
closed rather than silently dropping authorized context. No private response is
cached. No request-specific Auth client or identity is shared between requests.

No account/profile/workspace/membership provisioning, role/cohort/learner operation,
domain write, curriculum delivery, entitlement grant, staff path, or checkout is
implemented. ACTIVE summaries do not enable content delivery or satisfy the frozen
commerce gates. No Session ID/PDF/HMAC token authorizes Portal access.

## Session end and accepted limitations

Current-session signout clears the cookie and calls Auth local-scope logout.
After the bounded audit correction, upstream failure clears active access but
preserves a distinct HttpOnly logout-retry cookie until JWT expiry. The retry
cookie never grants Portal access; private handlers refuse pending signout.
Repeated failure remains failure, and new sign-in is blocked until logout
completes or the retry credential expires. Reload routes to a retry control.
Successful Auth revocation clears both cookie slots. If the request cannot reach the server, the UI clears its private view
and asks the adult to retry; it does not claim successful signout. The UI clears
private DOM state during switching, hiding/navigation, failures and expiry, and
rejects superseded asynchronous responses. Native server expiry remains decisive.

Cross-window coordination uses BroadcastChannel signals containing no identity or
credential. Signout initiation clears other views; completion or verification
outcome triggers fresh authorization. Focus restoration clears and revalidates;
blur clears private state. After A05 correction, one remote coordination episode
has a non-renewable ten-second pause measured from its first pending signal with
a monotonic clock. Repeated/stale pending keeps private state cleared but cannot
move that deadline or cancel its recovery read. The episode includes the fresh
validation until its response completes; later replays can start another bounded
episode, never a sliding lease. Expiry triggers a fresh
context request when visible; hidden views stay empty until restoration. Focus
and visibility check the elapsed deadline even if background timers were deferred.
The 30-second revalidation fallback runs with and without BroadcastChannel;
it does not cancel an already-active coordination recovery read.
Neither focus nor periodic checks extend a pending deadline. Recovery discards
selected workspace and never redisplays cached private data. Server authorization,
including A01 pending-logout quarantine, and native RLS remain authoritative.

A previously copied bearer credential is subject to native Auth until revocation
actually succeeds; the browser keeps no active access cookie while retry is
pending. Restoring the old access cookie beside the pending cookie is refused;
after successful native revocation, replay of the original cookie alone is
refused. No distributed revocation store or refresh persistence was introduced.

All four inherited accepted OPEN NOTES are unchanged: SNV02 deprecated inbucket; SNV04
refresh-chain cascade unproven; SNV05 no exact-path-only native callback guarantee;
SNV06 unexpired signed-out JWTs may remain usable through ordinary stateless Data
API/RLS. This application checks Auth on requests; it does not change the Data API
or fix/reclassify a NOTE. The accepted live-session/bound-TOTP staff gate is untouched.
01B-A03 remains an additional OPEN NOTE: local routing tests do not establish
hosted Vercel rewrite/CDN/HTTPS-cookie behavior. Five NOTES remain open.

## Local validation (separately authorized disposable infrastructure only)

- `node --test scripts/portal/test-runtime.mjs`: mocked upstream adversarial
  handler contracts, not native Auth proof.
- `node --test scripts/portal/test-coordination.mjs`: executes the actual client
  with deterministic DOM/clock and mocked context replies. Covers lost completion,
  timer/focus/visibility recovery, stale-response cancellation and server quarantine.
  A05 cases sustain repeated pending through two episodes and held responses,
  including periodic work. The old renewal assertion was replaced by the required
  non-renewable initial-deadline assertion; original evidence is preserved.
  `AIEA_PORTAL_CLIENT_SOURCE` optionally selects a saved pre-correction source file for a
  negative control. It is a test-runner input, never a production configuration.
- `node scripts/portal/serve-local.mjs`: loopback-only test adapter using the
  three runtime environment variables. It exercises checked-in rewrite/header
  definitions; it is not a Vercel deployment or full platform emulator.
- Run unchanged 01A SQL, SNV01 and SNV03 regressions against the accepted local
  config first. Preserve their sources/evidence and assertion inventory.
- For numeric tests, copy Supabase to a disposable directory and append only:

  ```toml
  [auth.email.template.magic_link]
  subject = "Your AIEA sign-in code"
  content_path = "./supabase/templates/adult-email-otp.html"
  ```

  Keep the repository `supabase/config.toml` unchanged. Apply the three unchanged
  migrations to a clean disposable local stack, capture CLI JSON privately, and
  set `AIEA_LOCAL_CREDENTIALS` to that file. With the application adapter running,
  run `python3 supabase/tests/portal-entry.native.py --setup`, then the same script
  without `--setup`. Setup creates synthetic `@example.invalid` adults and accepted
  fixture data, including genuine TOTP for test curriculum publication. Fixture
  tokens/claims never supply production runtime authority. The expiry test ages a
  synthetic managed email timestamp; it does not alter configured OTP lifetime.
- `node scripts/portal/test-browser.mjs`: uses `AIEA_LOCAL_CREDENTIALS`,
  `AIEA_PLAYWRIGHT_MODULE` (installed Playwright path), and optionally
  `AIEA_CHROME_PATH`. Exercises the untouched synthetic adult 8 after setup, blocks
  external browser requests, saves screenshots/results only beside private test
  credentials. Client expiry-clock simulation is separate from native expiry proof.

- After stopping the ordinary local adapter, run
  `node scripts/portal/test-audit-browser.mjs` with the same private credential
  and installed Playwright environment variables. It starts/stops an exclusive
  loopback adapter, injects only upstream logout failures through a temporary
  test-process fetch hook, and exercises eventual real native revocation and
  two real browser pages with shared cookies. Fresh synthetic adults 11–15 are
  provisioned only by disposable `--setup`. A held context response proves stale
  state clearing before new data may render. The independent focus regression
  disables BroadcastChannel in one page and delivers its focus event explicitly
  because headless targets may remain focused. No production test endpoint or
  fault option exists in the runtime. The test removes its hook/flag/server/browser.
- With the ordinary adapter stopped, run `node scripts/portal/test-pending-browser.mjs`
  with the same private credentials/installed Playwright environment. It starts an
  exclusive loopback adapter, uses existing synthetic adults 2/3 and native fixture
  numeric codes, and tests an actual sender closing without completion. It holds
  the receiver's response to prove clearing before current-adult rendering. Focus,
  timeout and hidden/visibility sequences use the browser clock; visibility/focus
  events are explicitly delivered in headless Chrome. Native Auth/context remain
  real. Optional `AIEA_PORTAL_CLIENT_SOURCE` serves saved pre-A04 code only to the
  receiver for a negative control; the same recovery assertion must then fail.
  Fixture code generation is not new mail-delivery evidence. Server/browser cleanup
  runs in `finally`; results are saved only beside private temporary credentials.
- `node scripts/portal/test-replayed-pending-browser.mjs` uses the same private
  environment with no ordinary adapter running. Two real pages sustain one-second
  pending signals for 80 seconds of browser time across two coordination episodes.
  Actual native context responses are held unchanged to prove clearing until
  authorization completes and continued replay cannot cancel recovery. Optional
  `AIEA_PORTAL_CLIENT_SOURCE` selects saved pre-A05 receiver code for the negative
  control, which must fail exactly on the missing first recovery request. It uses
  existing synthetic adults and native fixture codes, not new mail-delivery proof.
  The exclusive loopback adapter/browser close in `finally`; no production test
  endpoint or provider change is introduced.

These native fixtures are for a clean disposable stack only, never production.
Stop/remove local stack volumes with local CLI `stop --no-backup` afterward, stop
the test server/browser, and verify cleanup. No hosted CLI link/push/configuration.
Production numeric template/SMTP, approved origins, abuse controls, hosted assurance,
real adult provisioning, and broader launch remain separate Human Authority gates.
