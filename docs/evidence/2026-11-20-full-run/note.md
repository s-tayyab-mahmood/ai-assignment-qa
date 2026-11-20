# First full run on the live site – 33/36 passed; 3 failures triaged

**Date / run:** 2026-11-20, ~21:50 PKT. Local run, WORKERS=1: `npm test` →
36 tests, 33 passed, 3 failed, 453 s. RCA summary: `rca-full-run.md`.
Tests that ran live for the first time and passed include AE-10, AE-16, AE-17, AE-18, AE-20,
AE-21 and both AE-24 consistency checks.

---

## 1. AE-19 – contact form with file attachment (P1)

**Symptom:** `locator.click: Timeout 15000ms exceeded` waiting for the header link "Contact us"
(`src/pages/components/Header.ts:26`).

**What the AI/RCA said:** TEST_SCRIPT_DEFECT, 45% – reason given: "no XHR was sent, the click did
not reach the server". Alternatives: LOCATOR_OR_UI_CHANGE 0.50, TIMING_OR_FLAKINESS 0.30.

**What I checked:** the test code (`tests/ui/ancillary.spec.ts`) – it calls
`app.header.goToContact()` without opening any page first, so the browser was still on
`about:blank` and the header did not exist.

**What I concluded and why:** No page was open when the test clicked "Contact us" (the browser was still on about:blank), so the header didn't exist yet. Missing step in the test, not a site or product problem.

**Decision:** Category accepted (TEST_SCRIPT_DEFECT), reason rejected (it was not "no request sent"; the test never opened a page).

---

## 2. AE-09 – category filter (P1)

**Symptom:** Women > Dress passed; Men > Tshirts failed – `locator.click: Timeout 15000ms
exceeded` waiting for `#Men` → link "Tshirts" (`src/pages/CatalogPages.ts:76`).

**What the AI/RCA said:** LOCATOR_OR_UI_CHANGE, 45% ("the page structure may have changed").
Alternative: TIMING_OR_FLAKINESS 0.30.

**What I checked:** `openCategory()` found the parent link with a substring match on the name.
"Men" is also contained in "Women", so `.first()` clicked "Women" again; the Men panel stayed
collapsed and its hidden "Tshirts" link is not found by role. The site did not change.

**What I concluded and why:** The site's category menu did not change; Women > Dress worked in the same test. The locator's name "Men" also matched "Women", so the Men panel never opened.

**Decision:** Reject LOCATOR_OR_UI_CHANGE. Correct classification: TEST_SCRIPT_DEFECT (ambiguous locator).

---

## 3. AE-15 – flagship purchase journey (P0)

**Symptom:** `Test timeout of 60000ms exceeded` (attempt took 68 s); `/payment` (page request)
was still loading; 20 first-party requests slow or pending.

**What the AI/RCA said:** TIMING_OR_FLAKINESS, 55% – reason: "request slower than usual but
shorter than the wait: likely a synchronisation gap".

**What I checked:** the slow/pending evidence (E7) and earlier durations of passing AE-15 runs
(34–52 s). The journey is ~20 steps; with the site this slow, the total exceeded the 60 s
budget even though no single step was stuck.

**What I concluded and why:** No single step was stuck; the whole ~20-step journey ran over the 60 s limit because the site was slow (/payment still loading). Not a synchronisation gap in the test.

**Decision:** Reject TIMING_OR_FLAKINESS. Correct classification: ENVIRONMENT_OR_NETWORK. `test.slow()` for AE-15 approved (see approvals.md).

---

**Fix:** fix7 – commit `a82d305`:
- AE-19 opens the home page before using the header.
- AE-09 matches the category name as a whole word (verified: "Men" no longer matches "Women").
- AE-15 `test.slow()` for this test only, with the evidence in a comment (pending my approval).
- Diagnostics record the page URL at failure; RCA rules: `about:blank` → TEST_SCRIPT_DEFECT
  ("test never opened a page"); whole-test timeout with pages still loading → ENVIRONMENT_OR_NETWORK.

**Validated by:**
- 2026-11-20 ~22:05 PKT: `npx playwright test --grep "@AE-19|@AE-09|@AE-15"` → 3 passed.
- `npm run rca:selftest` → 18/18, including regression cases for AE-19 and AE-15.

Reviewed by: Tayyab, 2026-11-20
