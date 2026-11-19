# QA run – RCA summary

> Classifications are **hypotheses pending human review**. Confidence is a calibrated judgement, not proof.

| Item | Value |
|---|---|
| Commit | `40e2226656cd` on `main` |
| Generated | 2026-11-19T14:20:04.652Z |
| Analysis mode | deterministic (no AI_API_KEY – model-free fallback) |
| Tests | 6 (passed 5, failed 1, flaky 0, skipped 0) |
| Pass rate | 83% |
| Duration | 45.7 s |

## Failures

| Scenario | Test | Classification | Confidence | Business severity | Owner | Mode |
|---|---|---|---|---|---|---|
| AE-12 | AE-12b unusual but site-accepted quantity (25) is calculated correctly | **TEST_SCRIPT_DEFECT** | 40% | NONE | QA automation | deterministic |

### AE-12 – AE-12b unusual but site-accepted quantity (25) is calculated correctly

- **Symptom:** Error: expect(locator).toBeVisible() failed  Locator: getByText('Proceed To Checkout').or(getByText('Cart is empty!')).first()
- **First failure:** First failing assertion/action at src\pages\OrderPages.ts:55:72
- **Classification:** TEST_SCRIPT_DEFECT (40%)
- **Alternatives considered:** ENVIRONMENT_OR_NETWORK (0.50), LOCATOR_OR_UI_CHANGE (0.30), TIMING_OR_FLAKINESS (0.30)
- **Validate:** Re-run isolated: npx playwright test tests\ui\cart.spec.ts:45 --project=ui --trace on; open trace; check: single attempt – reproducibility unknown; close alternative: ENVIRONMENT_OR_NETWORK
- **Reproduce:** `npx playwright test tests\ui\cart.spec.ts:45 --project=ui`
- **Recommended action:** Inspect the diff of the failing spec/page object; prepare a minimal patch on a branch; re-run the isolated test; human review before merge.
- **Owner:** QA automation · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| TEST_SCRIPT_DEFECT | 0.55 | E1, E10 | E7 | Test code changed in this commit range (src/pages/OrderPages.ts), and the failure is an assertion/locator failure. |
| ENVIRONMENT_OR_NETWORK | 0.50 | E7 |  | Network-level errors were recorded during the test (failed requests and/or net:: error codes). |
| LOCATOR_OR_UI_CHANGE | 0.30 | E1, E5, E4 | E10 | Element could not be found/resolved in time with no first-party network errors; the page structure may have changed. |
| TIMING_OR_FLAKINESS | 0.30 | E1, E3 |  | Generic timeout; slow site or synchronization gap. |

<details><summary>Evidence</summary>

- **E1** (error): Error: expect(locator).toBeVisible() failed  Locator: getByText('Proceed To Checkout').or(getByText('Cart is empty!')).first() Expected: visible Timeout: 10000ms Error: element(s) not found  Call log:   - Expect "toBeVisible" getByText('Proceed To Checkout').or(getByText('Cart is empty!')).first() with timeout 10000ms   - waiting for getByText('Proceed To Checkout').or(getByText('Cart is empty!'))
- **E2** (stack): failing line src\pages\OrderPages.ts:55; 
- **E3** (retry-history): retry 0: failed (16878ms)
- **E4** (trace) `test-results\cart-Cart-AE-12b-unusual-b-fbec8--25-is-calculated-correctly-ui-repeat2\trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results\cart-Cart-AE-12b-unusual-b-fbec8--25-is-calculated-correctly-ui-repeat2\test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results\cart-Cart-AE-12b-unusual-b-fbec8--25-is-calculated-correctly-ui-repeat2\video.webm`: video of failing attempt
- **E7** (network): 3 failed/5xx request(s): {"url":"https://automationexercise.com/get_product_picture/42","status":503}; {"url":"https://automationexercise.com/get_product_picture/40","status":503}; {"url":"https://automationexercise.com/view_cart","status":503}
- **E8** (console): context only (third-party hosts, not product evidence): 9 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E9** (console): 15 console error(s): [{"ts":"2026-11-19T14:17:04.902Z","level":"warn","event":"console.error","data":{"text":"Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector"}},{"ts":"2026-11-19T14:17:04.932Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://
- **E10** (diff): changed files: src/fixtures/test.ts, src/pages/AuthPages.ts, src/pages/CatalogPages.ts, src/pages/OrderPages.ts, tools/rca/bundle.ts, tools/rca/classify.ts, tools/rca/selftest.ts, tools/rca/types.ts

</details>