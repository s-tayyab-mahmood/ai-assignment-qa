# QA run – RCA summary

> Classifications are **hypotheses pending human review**. Confidence is a calibrated judgement, not proof.

| Item | Value |
|---|---|
| Commit | `ed9770e2023f` on `main` |
| Generated | 2026-11-19T14:26:12.568Z |
| Analysis mode | deterministic (no AI_API_KEY – model-free fallback) |
| Tests | 6 (passed 5, failed 1, flaky 0, skipped 0) |
| Pass rate | 83% |
| Duration | 45.7 s |

## Failures

| Scenario | Test | Classification | Confidence | Business severity | Owner | Mode |
|---|---|---|---|---|---|---|
| AE-12 | AE-12b unusual but site-accepted quantity (25) is calculated correctly | **ENVIRONMENT_OR_NETWORK** | 80% | NONE | CI / infrastructure | deterministic |

### AE-12 – AE-12b unusual but site-accepted quantity (25) is calculated correctly

- **Symptom:** Error: expect(locator).toBeVisible() failed  Locator: getByText('Proceed To Checkout').or(getByText('Cart is empty!')).first()
- **First failure:** First failing assertion/action at src\pages\OrderPages.ts:55:72
- **Classification:** ENVIRONMENT_OR_NETWORK (80%)
- **Alternatives considered:** LOCATOR_OR_UI_CHANGE (0.50), TIMING_OR_FLAKINESS (0.30)
- **Validate:** Re-run isolated: npx playwright test tests\ui\cart.spec.ts:45 --project=ui --trace on; open trace; check: single attempt – reproducibility unknown
- **Reproduce:** `npx playwright test tests\ui\cart.spec.ts:45 --project=ui`
- **Recommended action:** Check runner/network status and site availability; re-run once. No test change unless repeated and reproducible.
- **Owner:** CI / infrastructure · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| ENVIRONMENT_OR_NETWORK | 0.85 | E7, E5 |  | The site returned an HTTP 5xx error page (document request) instead of the page under test. The shared public site was unavailable or overloaded; nothing about the test or the product's behaviour was exercised. |
| LOCATOR_OR_UI_CHANGE | 0.50 | E1, E5, E4 |  | Element could not be found/resolved in time with no first-party network errors; the page structure may have changed. |
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
- **E10** (diff): changed files: docs/test-strategy.md, src/fixtures/test.ts, tools/rca/bundle.ts, tools/rca/classify.ts, tools/rca/selftest.ts, tools/rca/types.ts

</details>