# AE-15 – "Add to cart" clicked before the product page was ready (test defect)

**Date / run:** 2026-11-19, ~19:44 PKT. Local run, WORKERS=1: `npm run test:smoke` →
7 passed, 2 failed (AE-11 and AE-15). AE-15 had passed on its own just before this run.

**Test(s):** AE-15 – flagship: new customer discovers products, checks out, pays and downloads a correct invoice (P0)

**What failed (symptom):**
After clicking "Add to cart" on the Blue Top details page (quantity 4), the "Added!" confirmation
did not appear within 10 s (`src/pages/CatalogPages.ts:130`).

**What the AI/RCA said (before fix):**
LOCATOR_OR_UI_CHANGE, 45% ("element could not be found… the page structure may have changed").
Alternative: TIMING_OR_FLAKINESS 0.30. (File: `rca-summary.md`)

**What I checked:**
- `error-context.md` – page snapshot: details page for Blue Top, quantity field shows 4,
  "Add to cart" button present, no modal.
- RCA evidence – no failed first-party requests and **no slow or pending request**: so the
  add-to-cart request was not slow, it was most likely never sent.
- Comparison in the same run: AE-11's failure did show `add_to_cart/2` pending 10.1 s, which was
  correctly classified ENVIRONMENT_OR_NETWORK. AE-15 had no such request.
- The trace was not opened before the next run overwrote it; the conclusion rests on the
  snapshot, the absence of any add-to-cart request, and the result after the fix.

**What I concluded and why:**
The button was found and clicked, so the locator was fine and the page had not changed. Because
no add-to-cart request was recorded at all, the click had no effect: the page was opened by
clicking "View Product", and the test clicked "Add to cart" before the page's scripts had
attached the click handler. On a fast site this race is hidden; on a slow site it fails.

**Decision:** Reject LOCATOR_OR_UI_CHANGE. Correct classification: TEST_SCRIPT_DEFECT
(synchronisation – interacting before the page was ready).

**Fix:** fix5 – commit `d128605`: navigation by click (header links, search, View Product,
category, brand) now waits for the target URL with `waitUntil: 'domcontentloaded'`, so page
scripts are bound before the next action. Failure diagnostics now include an XHR log, and RCA
classifies "element wait expired + no XHR sent + nothing slow" as TEST_SCRIPT_DEFECT.

**Validated by:**
- Next run, 2026-11-19 ~19:53 PKT, `npx playwright test --grep "@AE-15" --repeat-each=3`:
  the XHR log shows `add_to_cart/1` and `add_to_cart/2` sent and answered in 0.35–1.5 s. The
  add-to-cart step no longer failed; the runs reached checkout (next issue: address read, fixed
  in fix6).
- `npm run rca:selftest` → 15/15, including a regression case for a click with no effect.

Reviewed by: Tayyab, 2026-11-20
