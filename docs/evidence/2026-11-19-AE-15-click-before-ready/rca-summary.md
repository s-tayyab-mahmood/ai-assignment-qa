# QA run – RCA summary

> Classifications are **hypotheses pending human review**. Confidence is a calibrated judgement, not proof.

| Item | Value |
|---|---|
| Commit | `c871055e8b3a` on `main` |
| Generated | 2026-11-19T14:46:20.360Z |
| Analysis mode | deterministic (no AI_API_KEY – model-free fallback) |
| Tests | 9 (passed 7, failed 2, flaky 0, skipped 0) |
| Pass rate | 78% |
| Duration | 107.1 s |

## Failures

| Scenario | Test | Classification | Confidence | Business severity | Owner | Mode |
|---|---|---|---|---|---|---|
| AE-11 | AE-11 multiple products added from the listing appear with correct prices and totals | **ENVIRONMENT_OR_NETWORK** | 75% | NONE | CI / infrastructure | deterministic |
| AE-15 | AE-15 flagship: new customer discovers products, checks out, pays and downloads a correct invoice | **LOCATOR_OR_UI_CHANGE** | 45% | NONE | QA automation | deterministic |

### AE-11 – AE-11 multiple products added from the listing appear with correct prices and totals

- **Symptom:** Error: expect(locator).toBeVisible() failed  Locator: locator('#cartModal').getByRole('heading', { name: 'Added!' })
- **First failure:** First failing assertion/action at src\pages\CatalogPages.ts:130:30. Shares error signature with 1 other failure(s) in this run ("Error: expect(locator).toBeVisible() failed  Locator: locator('#cartModal').getB…") – likely one common cause; triage once.
- **Classification:** ENVIRONMENT_OR_NETWORK (75%)
- **Alternatives considered:** LOCATOR_OR_UI_CHANGE (0.50), TIMING_OR_FLAKINESS (0.30)
- **Validate:** Re-run isolated: npx playwright test tests\ui\cart.spec.ts:8 --project=ui --trace on; open trace; check: single attempt – reproducibility unknown
- **Reproduce:** `npx playwright test tests\ui\cart.spec.ts:8 --project=ui`
- **Recommended action:** Check runner/network status and site availability; re-run once. No test change unless repeated and reproducible.
- **Owner:** CI / infrastructure · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| ENVIRONMENT_OR_NETWORK | 0.75 | E1, E8 |  | A first-party page/XHR request was unanswered for 10126 ms, longer than the 10000 ms wait: the server was the bottleneck, so no reasonable wait would have succeeded. |
| LOCATOR_OR_UI_CHANGE | 0.50 | E1, E5, E4 |  | Element could not be found/resolved in time with no first-party network errors; the page structure may have changed. |
| TIMING_OR_FLAKINESS | 0.30 | E1, E3 |  | Generic timeout; slow site or synchronization gap. |

<details><summary>Evidence</summary>

- **E1** (error): Error: expect(locator).toBeVisible() failed  Locator: locator('#cartModal').getByRole('heading', { name: 'Added!' }) Expected: visible Timeout: 10000ms Error: element(s) not found  Call log:   - Expect "toBeVisible" locator('#cartModal').getByRole('heading', { name: 'Added!' }) with timeout 10000ms   - waiting for locator('#cartModal').getByRole('heading', { name: 'Added!' })      at ..\src\pages\
- **E2** (stack): failing line src\pages\CatalogPages.ts:130; 
- **E3** (retry-history): retry 0: failed (20839ms)
- **E4** (trace) `test-results\cart-Cart-AE-11-multiple-p-65f0d-h-correct-prices-and-totals-ui\trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results\cart-Cart-AE-11-multiple-p-65f0d-h-correct-prices-and-totals-ui\test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results\cart-Cart-AE-11-multiple-p-65f0d-h-correct-prices-and-totals-ui\video.webm`: video of failing attempt
- **E7** (network): no failed first-party requests recorded (ad hosts blocked by design are excluded)
- **E8** (network): 6 first-party request(s) slow (>5 s) or still pending at failure: {"url":"https://automationexercise.com/get_product_picture/7","method":"GET","type":"image","openForMs":15935}; {"url":"https://automationexercise.com/add_to_cart/2","method":"GET","type":"xhr","openForMs":10126}; {"url":"https://automationexercise.com/get_product_picture/37","method":"GET","type":"image","ms":5273}; {"url":"https:/
- **E9** (console): context only (third-party hosts, not product evidence): 3 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E10** (console): 4 console error(s): [{"ts":"2026-11-19T14:43:42.014Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://fonts.googleapis.com/css?family=Roboto:400,300,400italic,500,700,100'. This request has been blocked; the content must be served over HTTPS."}},{"ts":"202
- **E11** (diff): changed files: skills/rca.md, src/fixtures/test.ts, tools/rca/classify.ts, tools/rca/report.ts, tools/rca/schema/rca-record.schema.json, tools/rca/selftest.ts, tools/rca/types.ts

</details>

### AE-15 – AE-15 flagship: new customer discovers products, checks out, pays and downloads a correct invoice

- **Symptom:** Error: expect(locator).toBeVisible() failed  Locator: locator('#cartModal').getByRole('heading', { name: 'Added!' })
- **First failure:** First failing assertion/action at src\pages\CatalogPages.ts:130:30. Shares error signature with 1 other failure(s) in this run ("Error: expect(locator).toBeVisible() failed  Locator: locator('#cartModal').getB…") – likely one common cause; triage once.
- **Classification:** LOCATOR_OR_UI_CHANGE (45%)
- **Alternatives considered:** TIMING_OR_FLAKINESS (0.30)
- **Validate:** Re-run isolated: npx playwright test tests\ui\checkout.spec.ts:16 --project=ui --trace on; open trace; check: single attempt – reproducibility unknown
- **Reproduce:** `npx playwright test tests\ui\checkout.spec.ts:16 --project=ui`
- **Recommended action:** Open the trace/DOM snapshot at the failing step; update the locator following skills/playwright.md (role/label first); do not weaken the assertion.
- **Owner:** QA automation · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| LOCATOR_OR_UI_CHANGE | 0.50 | E1, E5, E4 |  | Element could not be found/resolved in time with no first-party network errors; the page structure may have changed. |
| TIMING_OR_FLAKINESS | 0.30 | E1, E3 |  | Generic timeout; slow site or synchronization gap. |

<details><summary>Evidence</summary>

- **E1** (error): Error: expect(locator).toBeVisible() failed  Locator: locator('#cartModal').getByRole('heading', { name: 'Added!' }) Expected: visible Timeout: 10000ms Error: element(s) not found  Call log:   - Expect "toBeVisible" locator('#cartModal').getByRole('heading', { name: 'Added!' }) with timeout 10000ms   - waiting for locator('#cartModal').getByRole('heading', { name: 'Added!' })      at ..\src\pages\
- **E2** (stack): failing line src\pages\CatalogPages.ts:130; 
- **E3** (retry-history): retry 0: failed (15891ms)
- **E4** (trace) `test-results\checkout-Checkout-and-orde-4f317-downloads-a-correct-invoice-ui\trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results\checkout-Checkout-and-orde-4f317-downloads-a-correct-invoice-ui\test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results\checkout-Checkout-and-orde-4f317-downloads-a-correct-invoice-ui\video.webm`: video of failing attempt
- **E7** (network): no failed first-party requests recorded (ad hosts blocked by design are excluded)
- **E8** (console): context only (third-party hosts, not product evidence): 9 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E9** (console): 12 console error(s): [{"ts":"2026-11-19T14:44:25.962Z","level":"warn","event":"console.error","data":{"text":"Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector"}},{"ts":"2026-11-19T14:44:27.589Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://
- **E10** (cleanup): [{"ts":"2026-11-19T14:44:44.998Z","level":"info","event":"account.cleanup.already_deleted","data":{"user":"QA aelocal61b463e41f","attempt":1}}]
- **E11** (diff): changed files: skills/rca.md, src/fixtures/test.ts, tools/rca/classify.ts, tools/rca/report.ts, tools/rca/schema/rca-record.schema.json, tools/rca/selftest.ts, tools/rca/types.ts

</details>