# QA run – RCA summary

> Classifications are **hypotheses pending human review**. Confidence is a calibrated judgement, not proof.

| Item | Value |
|---|---|
| Commit | `eb7ed783b78b` on `main` |
| Run | https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/45116848024 |
| Trigger | schedule |
| Generated | 2026-11-23T05:20:56.990Z |
| Analysis mode | ai-assisted (with deterministic baseline) |
| Tests | 36 (passed 31, failed 1, flaky 4, skipped 0) |
| Pass rate | 86% |
| Duration | 173.5 s |

## Failures

| Scenario | Test | Classification | Confidence | Business severity | Owner | Mode |
|---|---|---|---|---|---|---|
| AE-02 | AE-02 registered customer can log in and log out | **ENVIRONMENT_OR_NETWORK** | 85% | NONE | CI / infrastructure | ai-assisted |
| AE-12 | AE-12 quantity set on product details is reflected and line total is calculated | **ENVIRONMENT_OR_NETWORK** | 90% | NONE | CI / infrastructure | ai-rejected-fallback |
| AE-12 | AE-12b unusual but site-accepted quantity (25) is calculated correctly | **ENVIRONMENT_OR_NETWORK** | 90% | NONE | CI / infrastructure | ai-assisted |
| AE-10 | AE-10 brand filter shows exactly the brand products and matches the sidebar count | **TIMING_OR_FLAKINESS** | 60% | NONE | QA automation | ai-rejected-fallback |
| AE-17 | AE-17 invoice for a logged-in customer downloads and states the correct total | **ENVIRONMENT_OR_NETWORK** | 85% | NONE | CI / infrastructure | ai-assisted |

### AE-02 – AE-02 registered customer can log in and log out

- **Symptom:** Error: [AE-02|P0] logged-in banner shows account name  expect(locator).toHaveText(expected) failed
- **First failure:** First failing assertion/action at tests/support/flows.ts:14:83 (AI: HTTP 503 error when requesting https://automationexercise.com/login (E7, E13).)
- **Classification:** ENVIRONMENT_OR_NETWORK (85%) – AI agreed with the rule-based baseline
- **Alternatives considered:** LOCATOR_OR_UI_CHANGE (0.20), TEST_SCRIPT_DEFECT (0.10)
- **Validate:** Inspected network logs (E7, E13) and error location (E1). Trace (E4) and screenshot (E5) artifacts exist.
- **Reproduce:** `npx playwright test tests/ui/auth.spec.ts:43 --project=ui`
- **Recommended action:** Verify server health and deployment availability for automationexercise.com, and re-run the test suite once the endpoint returns 200 OK.
- **Owner:** CI / infrastructure · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| ENVIRONMENT_OR_NETWORK | 0.85 | E7, E12, E13 |  | The server returned HTTP 503 Service Unavailable when accessing the login page (E7, E13), resulting in an error page instead of the actual site header/UI. |
| LOCATOR_OR_UI_CHANGE | 0.20 | E1 | E7, E13 | The locator failed to find the logged-in header element, but this was caused by the server returning a 503 status code rather than a missing UI element. |
| TEST_SCRIPT_DEFECT | 0.10 | E1 | E7, E13, E14 | No test script code was modified in this commit range (only documentation in E14), and the root issue is server HTTP 503 failure. |

<details><summary>Evidence</summary>

- **E1** (error): Error: [AE-02|P0] logged-in banner shows account name  expect(locator).toHaveText(expected) failed  Locator: locator('#header').getByText(/Logged in as/) Expected: "Logged in as QA ae16848024a8abc41b01" Timeout: 10000ms Error: element(s) not found  Call log:   - [AE-02|P0] logged-in banner shows account name locator('#header').getByText(/Logged in as/) with timeout 10000ms   - waiting for locator(
- **E2** (stack): failing line tests/support/flows.ts:14; 
- **E3** (retry-history): retry 0: failed (14326ms); retry 1: failed (12136ms)
- **E4** (trace) `test-results/auth-Authentication-AE-02--7edad-omer-can-log-in-and-log-out-ui-retry1/trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results/auth-Authentication-AE-02--7edad-omer-can-log-in-and-log-out-ui-retry1/test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results/auth-Authentication-AE-02--7edad-omer-can-log-in-and-log-out-ui-retry1/video.webm`: video of failing attempt
- **E7** (network): 1 failed/5xx request(s): {"url":"https://automationexercise.com/login","status":503,"resourceType":"document"}
- **E8** (network): 2 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":39}; {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":22}
- **E9** (console): context only (third-party hosts, not product evidence): 3 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E10** (console): 5 console error(s): [{"ts":"2026-11-23T05:18:38.314Z","level":"warn","event":"console.error","data":{"text":"Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector"}},{"ts":"2026-11-23T05:18:38.318Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/login' was loaded over HTTPS, but requested an insecure stylesheet 'http://font
- **E11** (cleanup): [{"ts":"2026-11-23T05:18:36.905Z","level":"info","event":"account.created","data":{"scenarioUser":"QA ae[REDACTED_PHONE]bb37f467"}},{"ts":"2026-11-23T05:18:51.494Z","level":"info","event":"account.cleanup.deleted","data":{"user":"QA ae[REDACTED_PHONE]bb37f467","attempt":1}}]
- **E12** (annotation): page URL at failure: https://automationexercise.com/login
- **E13** (network): site served an error page instead of the requested page: HTTP 503 for /login
- **E14** (diff): changed files: docs/scorecard.md

</details>

### AE-12 – AE-12 quantity set on product details is reflected and line total is calculated

- **Symptom:** Error: expect(locator).toBeVisible() failed  Locator: getByRole('heading', { name: 'Searched Products' })
- **First failure:** First failing assertion/action at src/pages/CatalogPages.ts:43:40. Shares error signature with 1 other failure(s) in this run ("Error: expect(locator).toBeVisible() failed  Locator: getByRole('heading', { nam…") – likely one common cause; triage once.
- **Classification:** ENVIRONMENT_OR_NETWORK (90%) – AI call failed; rule-based result used (SyntaxError: Expected ',' or ']' after array element in JSON at position 1193 (line 39 column 6))
- **Alternatives considered:** TIMING_OR_FLAKINESS (0.70), LOCATOR_OR_UI_CHANGE (0.30)
- **Validate:** Re-run isolated: npx playwright test tests/ui/cart.spec.ts:31 --project=ui --trace on; open trace; check: n/a
- **Reproduce:** `npx playwright test tests/ui/cart.spec.ts:31 --project=ui`
- **Recommended action:** Check runner/network status and site availability; re-run once. No test change unless repeated and reproducible.
- **Owner:** CI / infrastructure · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| ENVIRONMENT_OR_NETWORK | 0.85 | E7, E5 |  | The site returned an HTTP 5xx error page (document request) instead of the page under test. The shared public site was unavailable or overloaded; nothing about the test or the product's behaviour was exercised. |
| TIMING_OR_FLAKINESS | 0.70 | E3 |  | Same code passed and failed across attempts: non-deterministic behaviour. |
| LOCATOR_OR_UI_CHANGE | 0.30 | E1, E5, E4 | E7, E8 | Element did not appear in time, but first-party requests failed during the test, which explains a missing UI response better than a page-structure change. |

<details><summary>Evidence</summary>

- **E1** (error): Error: expect(locator).toBeVisible() failed  Locator: getByRole('heading', { name: 'Searched Products' }) Expected: visible Timeout: 10000ms Error: element(s) not found  Call log:   - Expect "toBeVisible" getByRole('heading', { name: 'Searched Products' }) with timeout 10000ms   - waiting for getByRole('heading', { name: 'Searched Products' })      at ../src/pages/CatalogPages.ts:43    41 |     aw
- **E2** (stack): failing line src/pages/CatalogPages.ts:43; 
- **E3** (retry-history): retry 0: failed (12537ms); retry 1: passed (7491ms)
- **E4** (trace) `test-results/cart-Cart-AE-12-quantity-s-97485-nd-line-total-is-calculated-ui/trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results/cart-Cart-AE-12-quantity-s-97485-nd-line-total-is-calculated-ui/test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results/cart-Cart-AE-12-quantity-s-97485-nd-line-total-is-calculated-ui/video.webm`: video of failing attempt
- **E7** (network): 1 failed/5xx request(s): {"url":"https://automationexercise.com/products","status":503,"resourceType":"document"}
- **E8** (network): 1 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":23}
- **E9** (console): context only (third-party hosts, not product evidence): 3 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E10** (console): 5 console error(s): [{"ts":"2026-11-23T05:18:50.220Z","level":"warn","event":"console.error","data":{"text":"Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector"}},{"ts":"2026-11-23T05:18:50.239Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://f
- **E11** (diff): changed files: docs/scorecard.md

</details>

### AE-12 – AE-12b unusual but site-accepted quantity (25) is calculated correctly

- **Symptom:** Error: expect(locator).toBeVisible() failed  Locator: getByRole('heading', { name: 'Searched Products' })
- **First failure:** Attempt 0 failed at src/pages/CatalogPages.ts:43 (E1, E2) due to an HTTP 503 response from https://automationexercise.com/products (E7).
- **Classification:** ENVIRONMENT_OR_NETWORK (90%) – AI agreed with the rule-based baseline
- **Alternatives considered:** TIMING_OR_FLAKINESS (0.60), LOCATOR_OR_UI_CHANGE (0.10)
- **Validate:** Trace (E4), screenshot (E5), and video (E6) artifacts are available. The trace snapshot was not directly inspected, but HTTP 503 network failure in network log (E7) clearly corroborates the root cause.
- **Reproduce:** `npx playwright test tests/ui/cart.spec.ts:45 --project=ui`
- **Recommended action:** Monitor target environment availability for HTTP 503 spikes. If the service experiences transient load issues, consider adding retry mechanisms or site status checks prior to suite execution.
- **Owner:** CI / infrastructure · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| ENVIRONMENT_OR_NETWORK | 0.90 | E7, E3 |  | The initial request to https://automationexercise.com/products returned an HTTP 503 Service Unavailable error (E7), preventing the page from loading and causing the heading locator to fail (E1). The test subsequently passed on retry 1 (E3) once the server responded normally. |
| TIMING_OR_FLAKINESS | 0.60 | E3 | E7 | The test passed on retry 1 (E3), but the presence of an explicit HTTP 503 response (E7) indicates an environmental/server bottleneck rather than simple timing flakiness. |
| LOCATOR_OR_UI_CHANGE | 0.10 | E1 | E3, E7, E11 | The locator failed to be found (E1), but this was caused by the 503 page failure (E7). The locator worked on retry 1 (E3) and no UI/code changes were made in test files (E11). |

<details><summary>Evidence</summary>

- **E1** (error): Error: expect(locator).toBeVisible() failed  Locator: getByRole('heading', { name: 'Searched Products' }) Expected: visible Timeout: 10000ms Error: element(s) not found  Call log:   - Expect "toBeVisible" getByRole('heading', { name: 'Searched Products' }) with timeout 10000ms   - waiting for getByRole('heading', { name: 'Searched Products' })      at ../src/pages/CatalogPages.ts:43    41 |     aw
- **E2** (stack): failing line src/pages/CatalogPages.ts:43; 
- **E3** (retry-history): retry 0: failed (11991ms); retry 1: passed (6599ms)
- **E4** (trace) `test-results/cart-Cart-AE-12b-unusual-b-fbec8--25-is-calculated-correctly-ui/trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results/cart-Cart-AE-12b-unusual-b-fbec8--25-is-calculated-correctly-ui/test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results/cart-Cart-AE-12b-unusual-b-fbec8--25-is-calculated-correctly-ui/video.webm`: video of failing attempt
- **E7** (network): 1 failed/5xx request(s): {"url":"https://automationexercise.com/products","status":503,"resourceType":"document"}
- **E8** (network): 1 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":24}
- **E9** (console): context only (third-party hosts, not product evidence): 3 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E10** (console): 5 console error(s): [{"ts":"2026-11-23T05:18:53.482Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://fonts.googleapis.com/css?family=Roboto:400,300,400italic,500,700,100'. This request has been blocked; the content must be served over HTTPS."}},{"ts":"202
- **E11** (diff): changed files: docs/scorecard.md

</details>

### AE-10 – AE-10 brand filter shows exactly the brand products and matches the sidebar count

- **Symptom:** Error: API https://automationexercise.com/api/productsList returned non-JSON (HTTP 503): <html><head><meta name='viewport' content='width=device-width, initial-scale=1'></head><body><h2>This website is under heavy load (queue full)</h2><p>We're sorry, too many people are accessing this we     at ../
- **First failure:** First failing assertion/action at src/api/client.ts:38:13
- **Classification:** TIMING_OR_FLAKINESS (60%) – AI call failed; rule-based result used (SyntaxError: Expected ',' or ']' after array element in JSON at position 779 (line 26 column 6))
- **Alternatives considered:** PRODUCT_DEFECT (0.55)
- **Validate:** Re-run isolated: npx playwright test tests/ui/catalog.spec.ts:118 --project=ui --trace on; open trace; check: close alternative: PRODUCT_DEFECT
- **Reproduce:** `npx playwright test tests/ui/catalog.spec.ts:118 --project=ui`
- **Recommended action:** Re-run isolated with --repeat-each to measure; find the missing wait condition; never add fixed sleeps or blanket timeout increases.
- **Owner:** QA automation · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| TIMING_OR_FLAKINESS | 0.70 | E3 |  | Same code passed and failed across attempts: non-deterministic behaviour. |
| PRODUCT_DEFECT | 0.55 | E1 |  | API response violated its validated contract (schema mismatch). Could be a real API change; confirm against the live endpoint before raising a defect. |

<details><summary>Evidence</summary>

- **E1** (error): Error: API https://automationexercise.com/api/productsList returned non-JSON (HTTP 503): <html><head><meta name='viewport' content='width=device-width, initial-scale=1'></head><body><h2>This website is under heavy load (queue full)</h2><p>We're sorry, too many people are accessing this we     at ../src/api/client.ts:38    36 |       json = JSON.parse(text);   37 |     } catch { > 38 |       throw 
- **E2** (stack): failing line src/api/client.ts:38; 
- **E3** (retry-history): retry 0: failed (390ms); retry 1: passed (7233ms)
- **E4** (trace) `test-results/catalog-Catalogue-search-a-2afc7-d-matches-the-sidebar-count-ui/trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results/catalog-Catalogue-search-a-2afc7-d-matches-the-sidebar-count-ui/test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results/catalog-Catalogue-search-a-2afc7-d-matches-the-sidebar-count-ui/video.webm`: video of failing attempt
- **E7** (network): no failed first-party requests recorded (ad hosts blocked by design are excluded)
- **E8** (network): xhr-log: no first-party XHR call completed during the test
- **E9** (console): no console errors recorded
- **E10** (diff): changed files: docs/scorecard.md

</details>

### AE-17 – AE-17 invoice for a logged-in customer downloads and states the correct total

- **Symptom:** Error: [AE-17|P1] order placed  expect(locator).toBeVisible() failed
- **First failure:** First failing assertion/action at tests/ui/checkout.spec.ts:119:66 (AI: AE-17 attempt 0 failed at step `toBeVisible()` on `orderPlaced` after server responded with 503 on `https://automationexercise.com/payment`.)
- **Classification:** ENVIRONMENT_OR_NETWORK (85%) – AI agreed with the rule-based baseline
- **Alternatives considered:** TIMING_OR_FLAKINESS (0.65), LOCATOR_OR_UI_CHANGE (0.20)
- **Validate:** HYPOTHESIS_PENDING_REVIEW: Playwright trace (E4) and DOM snapshots were not visually re-inspected, but network summary (E7) clearly identifies an HTTP 503 on the payment request.
- **Reproduce:** `npx playwright test tests/ui/checkout.spec.ts:108 --project=ui`
- **Recommended action:** Monitor environment stability for HTTP 503 errors on the payment endpoint; no test script changes required.
- **Owner:** CI / infrastructure · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| ENVIRONMENT_OR_NETWORK | 0.85 | E7 |  | The server returned HTTP 503 Service Unavailable for the first-party payment endpoint (https://automationexercise.com/payment), causing the order completion page to fail to load. |
| TIMING_OR_FLAKINESS | 0.65 | E3 | E7 | The test passed on retry 1, but the primary cause of retry 0 failing was a server HTTP 503 response rather than a client-side race condition. |
| LOCATOR_OR_UI_CHANGE | 0.20 | E1 | E3, E7 | The order-placed locator was not found because the page failed to render due to a 503 server error, not because the UI schema changed. |

<details><summary>Evidence</summary>

- **E1** (error): Error: [AE-17|P1] order placed  expect(locator).toBeVisible() failed  Locator: getByTestId('order-placed') Expected: visible Timeout: 10000ms Error: element(s) not found  Call log:   - [AE-17|P1] order placed getByTestId('order-placed') with timeout 10000ms   - waiting for getByTestId('order-placed')     117 |       await app.checkout.placeOrder.click();   118 |       await app.payment.pay(dummyCa
- **E2** (stack): failing line tests/ui/checkout.spec.ts:119; 
- **E3** (retry-history): retry 0: failed (25500ms); retry 1: passed (16820ms)
- **E4** (trace) `test-results/checkout-Checkout-and-orde-667f1-nd-states-the-correct-total-ui/trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results/checkout-Checkout-and-orde-667f1-nd-states-the-correct-total-ui/test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results/checkout-Checkout-and-orde-667f1-nd-states-the-correct-total-ui/video.webm`: video of failing attempt
- **E7** (network): 1 failed/5xx request(s): {"url":"https://automationexercise.com/payment","status":503,"resourceType":"document"}
- **E8** (network): 6 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":26}; {"url":"https://automationexercise.com/add_to_cart/3","method":"GET","ms":778}; {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":24}; {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":20}
- **E9** (console): context only (third-party hosts, not product evidence): 20 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E10** (console): 20 console error(s): [{"ts":"2026-11-23T05:20:10.396Z","level":"warn","event":"console.error","data":{"text":"Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector"}},{"ts":"2026-11-23T05:20:10.412Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/login' was loaded over HTTPS, but requested an insecure stylesheet 'http://fon
- **E11** (cleanup): [{"ts":"2026-11-23T05:20:09.280Z","level":"info","event":"account.created","data":{"scenarioUser":"QA ae16848024d51476e341"}},{"ts":"2026-11-23T05:20:36.085Z","level":"info","event":"account.cleanup.deleted","data":{"user":"QA ae16848024d51476e341","attempt":1}}]
- **E12** (diff): changed files: docs/scorecard.md

</details>