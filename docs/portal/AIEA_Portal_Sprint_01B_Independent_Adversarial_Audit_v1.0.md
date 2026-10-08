# AIEA Portal — Sprint 01B Independent Adversarial Audit v1.0

## Original independent verdict

**FAIL — correction cycle required.**

This artifact faithfully records the independent findings supplied by Human
Authority in the Sprint 01B Bounded Audit Correction Authorization. The supplied
authorization is the source of this audit record; no additional independent
test transcript, test count or auditor identity was supplied. This is not a
claim that the implementing agent performed the independent audit.

| Finding | Original severity | Original finding |
| --- | --- | --- |
| 01B-A01 | MAJOR | Logout failure loses the ability to retry session revocation |
| 01B-A02 | MINOR | Another visible window can retain the previous adult's private summary |
| 01B-A03 | NOTE | Local routing tests cannot establish the hosted routing boundary |

For A01, the demonstrated sequence deleted the application credential after an
upstream logout failure. Revocation remained incomplete; the subsequent retry
lacked its credential yet could report success, while the original credential
remained usable by the Portal runtime until expiry.

For A02, a second already-open visible Portal window could retain the previous
adult's workspace name, role and entitlement summary after the shared session
changed in another window. Visibility handling alone did not establish
cross-window invalidation or focus-before-render revalidation.

**01B-A03 — OPEN NOTE:** Local routing tests do not establish hosted Vercel
rewrite/CDN/HTTPS-cookie behavior. No deployment or provider work is authorized
to resolve this observation in the correction pass.

The four inherited accepted findings remain unchanged: **SNV02 — OPEN NOTE;
SNV04 — OPEN NOTE; SNV05 — OPEN NOTE; SNV06 — OPEN NOTE.** The original audit thus
returned one MAJOR, one MINOR and five open NOTES including A03.

## Authorized correction boundary

Human Authority authorized correction of A01 and A02 only, associated mocked and
disposable synthetic native/browser regressions, and truthful documentation.
Required evidence includes the complete logout cookie-jar sequence and a real
two-window stale-state/revalidation sequence. No refresh persistence, schema,
frozen architecture, Sprint 01A historical evidence, hosted/provider, deployment,
staging, commit, push, product expansion or later-sprint change is authorized.

This original FAIL verdict and findings remain historical evidence regardless of
later correction results. The separate correction report records implementation
and validation; independent re-audit must determine their final disposition.

## Post-correction independent re-audit — supplied by Human Authority

**FAIL — further correction required.** This second verdict and its findings were
supplied in Human Authority's Sprint 01B Bounded A04 Correction Authorization.
No additional independent transcript, count or auditor identity was supplied.
The original independent FAIL and A01/A02 correction history above remain intact.

- **A01:** Original MAJOR independently confirmed corrected on inspected code and
  reproduced evidence.
- **A02:** Original private-state-retention defect independently confirmed corrected
  for normal completed sequences; final acceptance was withheld because of A04.
- **01B-A04 — MINOR:** A lost completion signal permanently blocks an existing
  Portal view. This is an availability/recovery defect, not retained-private-data
  exposure.

The reproduced A04 sequence displayed an authenticated workspace in Window A;
Window B sent `pending`, then disappeared before `revalidate`. Window A cleared
private fields correctly but retained `remotePending = true`. Focus/visibility
could not get past the `load()` guard, and the periodic fallback existed only
without BroadcastChannel. Thus the receiving view lacked bounded recovery.

Exactly five existing NOTES remain OPEN and unchanged: **01B-A03, SNV02, SNV04,
SNV05 and SNV06**. A03 still concerns absent hosted Vercel rewrite/CDN/HTTPS-cookie
assurance. Neither independent audit originally passed.

Human Authority authorized A04 correction, adversarial regression that fails on
the pre-A04 implementation, A01/A02 regressions and bounded local validation only.
The separate correction/implementation reports append the resulting evidence.
A04 remains a candidate correction awaiting independent re-audit; this record
does not self-declare it independently CLOSED or approve Sprint 01B.

## Final A04 independent re-audit — supplied by Human Authority

**FAIL — further correction required.** This third independent verdict was
supplied in Human Authority's Sprint 01B Bounded A05 Correction Authorization.
The auditor independently confirmed **A01 corrected, A02 corrected and A04
corrected**, with exactly five existing NOTES unchanged. The preceding independent
FAIL verdicts and correction history remain intact; none originally passed.

**01B-A05 — MINOR:** Repeated pending signals can indefinitely postpone authoritative
recovery. Each received pending replaced the deadline with
`performance.now() + 10000` and cancelled the prior timer. Repeated/duplicate/stale
signals could continually renew the pause; focus, visibility and periodic recovery
remained blocked by the unelapsed sliding deadline. Private fields stayed cleared.
This is an availability defect, not demonstrated private-data exposure or an
authorization bypass.

Human Authority authorized A05 correction only, associated sustained/replayed-pending
regression, saved pre-A05 negative control where practical, retained A01/A02/A04
and security regressions, and truthful documentation. The appended correction
evidence records local results; **A05 remains a correction candidate awaiting
independent re-audit**, not independently CLOSED. Sprint 01B is not self-approved.

Exactly **01B-A03, SNV02, SNV04, SNV05 and SNV06 remain OPEN NOTES**. No NOTE was
fixed, removed, promoted or demoted. No additional independent transcript, count
or auditor identity was supplied beyond the Human Authority authorization.
