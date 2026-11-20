# AE-15 – address lines read before the checkout page finished rendering (test defect)

**Date / run:** 2026-11-19, ~19:53 PKT. Local run, WORKERS=1:
`npx playwright test --grep "@AE-15" --repeat-each=3` → 1 passed, 2 failed (both at the same step)

**Test(s):** AE-15 – flagship: new customer discovers products, checks out, pays and downloads a correct invoice (P0)

**What failed (symptom):**
Assertion `[AE-15|P0] delivery address = fixture` (`tests/ui/checkout.spec.ts:45`).
Name, city/state/zip, country and phone matched the fixture; only `lines` (company, street, suite)
was received as an empty list `[]`.

**What the AI/RCA said (before fix):**
ENVIRONMENT_OR_NETWORK, 50% and 45% confidence. It cited network evidence that was only font
files aborted by navigation (`net::ERR_ABORTED`), and listed PRODUCT_DEFECT (0.25) as the
alternative. (File: `rca-before-fix.md`)

**What I checked:**
- RCA evidence E1 – the diff of expected vs received: every field present except `lines: []`.
- RCA evidence E8 / E7 (XHR log) – `add_to_cart/1` and `/2` sent and answered in 0.35–1.5 s, so
  the earlier "click before ready" fix (fix5) worked and the test reached checkout.
- The test had passed once with the same code, so the address locators themselves are correct.
- `readAddress()` in `src/pages/OrderPages.ts` read the lines with `allTextContents()`, which does
  not wait, before reading the other fields, which do wait.

**What I concluded and why:**
Only line was empty while the other fields matched, and the test had passed before, so it was read tii early. Not the site, Not the product

**Decision:** 
Rejected the AI classification as it said it's ENVIRONMENT_OR_NETWORK. Though it was actually a TEST_SCRIPT issue.

**Fix:** fix6 – commit `97bebe5`: `CheckoutPage.waitReady()` (URL, DOMContentLoaded, total row
visible) before any non-retrying read; `readAddress()` also waits for the block's last line
(phone). Diagnostics stop recording aborted static resources; RCA rule: empty received value in
a non-timeout value assertion → TEST_SCRIPT_DEFECT.

**Validated by:**
- Re-analysed the same results with the fixed RCA → see `rca-after-fix.md`.
- Next run, 2026-11-19 ~20:04 PKT, `--repeat-each=3` → 2 passed, 1 failed at an earlier step
  (search click; site slow – RCA ENVIRONMENT_OR_NETWORK 0.70). The address step did not fail again.
- `npm run rca:selftest` → 16/16, including a regression case shaped on this failure.

**Brief requirement covered:** "one genuine failure classification, with evidence and human review."

Reviewed by: Tayyab Mahmood, 2026-11-20