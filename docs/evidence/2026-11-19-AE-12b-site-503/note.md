# AE-12b – failure caused by site overload (HTTP 503), not by the test or the product

**Date / run:** 2026-11-19, ~19:17 PKT. Local run, 1 command:
`npx playwright test --grep "@AE-12" --repeat-each=3` → 5 passed, 1 failed (AE-12b, repeat 2)

**Test(s):** AE-12b – unusual but site-accepted quantity (25) is calculated correctly (P0)

**What failed (symptom):**
Cart page readiness check failed: neither "Proceed To Checkout" nor "Cart is empty!" appeared
within 10 s (`src/pages/OrderPages.ts:55`). The URL check (/view_cart) had passed.

**What the AI/RCA said (before fix):**
TEST_SCRIPT_DEFECT, 40% confidence, because `src/pages/OrderPages.ts` had changed in the
commit range and appears in the stack. Alternatives: ENVIRONMENT_OR_NETWORK 0.50,
LOCATOR_OR_UI_CHANGE 0.30. (File: `rca-before-fix.md`)

**What I checked:**
- `error-context.md` – page snapshot shows only the heading
  "This website is under heavy load (queue full)".
- `test-failed-1.png` – screenshot shows the same overload page, no cart.
- RCA evidence E7 – `/view_cart` returned HTTP 503 (also 503 on two product images).

**What I concluded and why:**
The site returned an error page (HTTP 503, recorded in E7 and visible in the screenshot) instead
of the cart, so the test never reached the cart logic. The changed file in the stack is a
coincidence, not the cause. Because of the error page, nothing about the product's cart
calculation was tested in this attempt.

**Decision:** Rejected the AI classification (TEST_SCRIPT_DEFECT). The correct classification is
ENVIRONMENT_OR_NETWORK (site unavailable / overloaded). Not a product defect.

**Fix:** fix3 – commit `<ed9770e>`: page-level 5xx is detected and recorded as a
`site-unavailable` annotation; RCA classifies it as ENVIRONMENT_OR_NETWORK; test code unchanged.

**Validated by:**
- Re-analysed the same results with the fixed RCA → ENVIRONMENT_OR_NETWORK, ~80%
  (`rca-after-fix.md`). TEST_SCRIPT_DEFECT dropped to a 0.20 alternative.
- `npm run rca:selftest` → 13/13, including a regression case shaped on this failure.

**Brief requirement covered:** "one non-product failure classification, with evidence and human review."

Reviewed by: Tayyab Mahmood, 2026-11-20