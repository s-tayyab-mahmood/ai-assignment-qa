# QA run – RCA summary

> Classifications are **hypotheses pending human review**. Confidence is a calibrated judgement, not proof.

| Item | Value |
|---|---|
| Commit | `f1d582bbb30d` on `main` |
| Run | https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/45139042427 |
| Trigger | workflow_dispatch |
| Generated | 2026-11-23T08:34:00.893Z |
| Analysis mode | ai-assisted (with deterministic baseline); AI limited to first 5 failures |
| Tests | 36 (passed 25, failed 6, flaky 5, skipped 0) |
| Pass rate | 69% |
| Duration | 242.8 s |

## Failures

| Scenario | Test | Classification | Confidence | Business severity | Owner | Mode |
|---|---|---|---|---|---|---|
| AE-22 | API-11..14 create, read, update and delete an account with state verified at each step | **ENVIRONMENT_OR_NETWORK** | 90% | NONE | CI / infrastructure | ai-assisted |
| AE-18 | AE-18 customer can submit a product review | **ENVIRONMENT_OR_NETWORK** | 90% | NONE | CI / infrastructure | ai-assisted |
| AE-21 | AE-21 a recommended item can be added to the cart | **ENVIRONMENT_OR_NETWORK** | 85% | NONE | CI / infrastructure | ai-assisted |
| AE-02 | AE-02 registered customer can log in and log out | **ENVIRONMENT_OR_NETWORK** | 85% | NONE | CI / infrastructure | ai-assisted |
| AE-03 | AE-03b login is rejected for an unregistered email (UI + API agree) | **ENVIRONMENT_OR_NETWORK** | 85% | NONE | CI / infrastructure | ai-assisted |
| AE-12 | AE-12 quantity set on product details is reflected and line total is calculated | **ENVIRONMENT_OR_NETWORK** | 90% | NONE | CI / infrastructure | deterministic |
| AE-08 | AE-08 zero-result search shows an empty result set (UI + API) | **ENVIRONMENT_OR_NETWORK** | 90% | NONE | CI / infrastructure | deterministic |
| AE-10 | AE-10 brand filter shows exactly the brand products and matches the sidebar count | **TEST_SCRIPT_DEFECT** | 75% | NONE | QA automation | deterministic |
| AE-15 | AE-15 flagship: new customer discovers products, checks out, pays and downloads a correct invoice | **ENVIRONMENT_OR_NETWORK** | 85% | NONE | CI / infrastructure | deterministic |
| AE-16 | AE-16 checkout addresses match both the registration fixture and the API profile | **TIMING_OR_FLAKINESS** | 70% | NONE | QA automation | deterministic |
| AE-17 | AE-17 invoice for a logged-in customer downloads and states the correct total | **ENVIRONMENT_OR_NETWORK** | 90% | NONE | CI / infrastructure | deterministic |

### AE-22 – API-11..14 create, read, update and delete an account with state verified at each step

- **Symptom:** Error: API https://automationexercise.com/api/updateAccount returned non-JSON (HTTP 503): <html><head><meta name='viewport' content='width=device-width, initial-scale=1'></head><body><h2>This website is under heavy load (queue full)</h2><p>We're sorry, too many people are accessing this we     at ..
- **First failure:** First failing assertion/action at src/api/client.ts:38:13. Shares error signature with 2 other failure(s) in this run ("Error: API <url> returned non-JSON (HTTP #): <html><head><meta name='viewport' c…") – likely one common cause; triage once. (AI: E1)
- **Classification:** ENVIRONMENT_OR_NETWORK (90%) – AI agreed with the rule-based baseline
- **Alternatives considered:** PRODUCT_DEFECT (0.10)
- **Validate:** Trace artifact E4 was not visually inspected, but the raw error details in E1 explicitly capture the HTTP 503 response from the target server.
- **Reproduce:** `npx playwright test tests/api/users.spec.ts:45 --project=api`
- **Recommended action:** Rerun the API test suite when target environment load subsides, or configure retry backoff for rate-limited/503 responses.
- **Owner:** CI / infrastructure · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| ENVIRONMENT_OR_NETWORK | 0.85 | E1, E3 |  | The target API endpoint returned HTTP 503 Service Unavailable with the body 'This website is under heavy load (queue full)', indicating an external server load/capacity issue rather than a test or product defect. |
| PRODUCT_DEFECT | 0.10 |  | E1, E8 | The failure was caused by server infrastructure load shedding (HTTP 503), not application logic changes, and no application code was modified in this commit. |

<details><summary>Evidence</summary>

- **E1** (error): Error: API https://automationexercise.com/api/updateAccount returned non-JSON (HTTP 503): <html><head><meta name='viewport' content='width=device-width, initial-scale=1'></head><body><h2>This website is under heavy load (queue full)</h2><p>We're sorry, too many people are accessing this we     at ../src/api/client.ts:38    36 |       json = JSON.parse(text);   37 |     } catch { > 38 |       throw
- **E2** (stack): failing line src/api/client.ts:38; 
- **E3** (retry-history): retry 0: failed (5747ms); retry 1: failed (4181ms)
- **E4** (trace) `test-results/users-API-–-account-lifecy-33a65-state-verified-at-each-step-api-retry1/trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (network): no failed first-party requests recorded (ad hosts blocked by design are excluded)
- **E6** (console): no console errors recorded
- **E7** (cleanup): [{"ts":"2026-11-23T08:30:28.196Z","level":"info","event":"account.cleanup.deleted","data":{"user":"QA ae390424272b6e1ff6cb","attempt":2}}]
- **E8** (diff): changed files: docs/scorecard.md

</details>

### AE-18 – AE-18 customer can submit a product review

- **Symptom:** Error: [AE-18|P1] review section offered  expect(locator).toBeVisible() failed
- **First failure:** First failing assertion/action at tests/ui/ancillary.spec.ts:16:85 (AI: E12)
- **Classification:** ENVIRONMENT_OR_NETWORK (90%) – AI agreed with the rule-based baseline
- **Alternatives considered:** LOCATOR_OR_UI_CHANGE (0.20), TIMING_OR_FLAKINESS (0.15)
- **Validate:** Inspected network logs E7 and E12; server returned HTTP 503 for the target URL. Trace E4 and screenshot E5 available.
- **Reproduce:** `npx playwright test tests/ui/ancillary.spec.ts:8 --project=ui`
- **Recommended action:** Check site health and infrastructure availability for automationexercise.com before re-running the test suite.
- **Owner:** CI / infrastructure · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| ENVIRONMENT_OR_NETWORK | 0.90 | E7, E12 |  | The server responded with HTTP 503 Service Unavailable on the requested product details page (/product_details/1) and associated product picture assets. |
| LOCATOR_OR_UI_CHANGE | 0.20 | E1 | E7, E12 | The 'Write Your Review' locator failed to resolve because the page rendered an HTTP 503 error page rather than a UI change. |
| TIMING_OR_FLAKINESS | 0.15 |  | E3 | The test failed deterministically on both attempts due to server availability issues. |

<details><summary>Evidence</summary>

- **E1** (error): Error: [AE-18|P1] review section offered  expect(locator).toBeVisible() failed  Locator: getByRole('link', { name: 'Write Your Review' }) Expected: visible Timeout: 10000ms Error: element(s) not found  Call log:   - [AE-18|P1] review section offered getByRole('link', { name: 'Write Your Review' }) with timeout 10000ms   - waiting for getByRole('link', { name: 'Write Your Review' })     14 |       
- **E2** (stack): failing line tests/ui/ancillary.spec.ts:16; 
- **E3** (retry-history): retry 0: failed (12344ms); retry 1: failed (12215ms)
- **E4** (trace) `test-results/ancillary-Ancillary-featur-2c4a2-can-submit-a-product-review-ui-retry1/trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results/ancillary-Ancillary-featur-2c4a2-can-submit-a-product-review-ui-retry1/test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results/ancillary-Ancillary-featur-2c4a2-can-submit-a-product-review-ui-retry1/video.webm`: video of failing attempt
- **E7** (network): 20 failed/5xx request(s): {"url":"https://automationexercise.com/get_product_picture/37","status":503,"resourceType":"image"}; {"url":"https://automationexercise.com/get_product_picture/18","status":503,"resourceType":"image"}; {"url":"https://automationexercise.com/get_product_picture/42","status":503,"resourceType":"image"}; {"url":"https://automationexercise.com/get_product_picture/7","status":
- **E8** (network): 1 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":16}
- **E9** (console): context only (third-party hosts, not product evidence): 3 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E10** (console): 20 console error(s): [{"ts":"2026-11-23T08:30:26.973Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://fonts.googleapis.com/css?family=Roboto:400,300,400italic,500,700,100'. This request has been blocked; the content must be served over HTTPS."}},{"ts":"20
- **E11** (annotation): page URL at failure: https://automationexercise.com/product_details/1
- **E12** (network): site served an error page instead of the requested page: HTTP 503 for /product_details/1
- **E13** (diff): changed files: docs/scorecard.md

</details>

### AE-21 – AE-21 a recommended item can be added to the cart

- **Symptom:** TimeoutError: locator.scrollIntoViewIfNeeded: Timeout 15000ms exceeded. Call log:   - waiting for getByRole('heading', { name: 'recommended items' })
- **First failure:** First failing assertion/action at tests/ui/ancillary.spec.ts:76:41 (AI: Attempt 0 received an HTTP 503 status code on document load (E7), leading to locator timeout on getByRole('heading', { name: 'recommended items' }) (E1).)
- **Classification:** ENVIRONMENT_OR_NETWORK (85%) – AI agreed with the rule-based baseline
- **Alternatives considered:** TIMING_OR_FLAKINESS (0.40), LOCATOR_OR_UI_CHANGE (0.15)
- **Validate:** Trace (E4) and retry history (E3) corroborate that the target site temporarily returned 503 Service Unavailable during attempt 0 and recovered on attempt 1.
- **Reproduce:** `npx playwright test tests/ui/ancillary.spec.ts:70 --project=ui`
- **Recommended action:** Monitor target server availability and HTTP 503 rates; consider adding retry logic or status checks for transient server errors in environment infrastructure.
- **Owner:** CI / infrastructure · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| ENVIRONMENT_OR_NETWORK | 0.85 | E7, E9, E3 |  | The initial document request to automationexercise.com failed with HTTP 503 Service Unavailable (E7, E9). Consequently, the page failed to load the expected heading, causing a locator timeout (E1). The test passed on retry (E3) when the server responded normally. |
| TIMING_OR_FLAKINESS | 0.40 | E3 | E7, E9 | While the test was flaky across retries, the underlying cause was an explicit 503 response from the target server rather than a execution timing/race condition. |
| LOCATOR_OR_UI_CHANGE | 0.15 | E1 | E3, E7, E10 | The locator failed to find the heading in attempt 0, but it resolved successfully on retry 1 without code changes, ruling out a broken locator or DOM change. |

<details><summary>Evidence</summary>

- **E1** (error): TimeoutError: locator.scrollIntoViewIfNeeded: Timeout 15000ms exceeded. Call log:   - waiting for getByRole('heading', { name: 'recommended items' })     74 |       const tag = at('AE-21', 'P2');   75 |       await app.home.open(); > 76 |       await app.home.recommendedHeading.scrollIntoViewIfNeeded();      |                                         ^   77 |       await expect(app.home.recommended
- **E2** (stack): failing line tests/ui/ancillary.spec.ts:76; 
- **E3** (retry-history): retry 0: failed (15471ms); retry 1: passed (4493ms)
- **E4** (trace) `test-results/ancillary-Ancillary-featur-e36c2-em-can-be-added-to-the-cart-ui/trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results/ancillary-Ancillary-featur-e36c2-em-can-be-added-to-the-cart-ui/test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results/ancillary-Ancillary-featur-e36c2-em-can-be-added-to-the-cart-ui/video.webm`: video of failing attempt
- **E7** (network): 1 failed/5xx request(s): {"url":"https://automationexercise.com/","status":503,"resourceType":"document"}
- **E8** (network): 1 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":14}
- **E9** (console): 1 console error(s): [{"ts":"2026-11-23T08:30:37.605Z","level":"warn","event":"console.error","data":{"text":"Failed to load resource: the server responded with a status of 503 ()"}}]
- **E10** (diff): changed files: docs/scorecard.md

</details>

### AE-02 – AE-02 registered customer can log in and log out

- **Symptom:** TimeoutError: page.waitForURL: Timeout 30000ms exceeded. =========================== logs =========================== waiting for navigation until "domcontentloaded"
- **First failure:** First failing assertion/action at src/pages/components/Header.ts:27:21 (AI: HTTP 503 response received when navigating to https://automationexercise.com/login (E7, E12).)
- **Classification:** ENVIRONMENT_OR_NETWORK (85%) – AI agreed with the rule-based baseline
- **Alternatives considered:** TIMING_OR_FLAKINESS (0.20), TEST_SCRIPT_DEFECT (0.10)
- **Validate:** Confirmed through network logs (E7) and server error indication (E12) that https://automationexercise.com/login returned an HTTP 503 status code. Trace artifact (E4) and screenshot (E5) were captured. Commit diff (E13) shows no changes to test code.
- **Reproduce:** `npx playwright test tests/ui/auth.spec.ts:43 --project=ui`
- **Recommended action:** Verify target server health/availability for automationexercise.com and re-run the pipeline once the server is back online.
- **Owner:** CI / infrastructure · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| ENVIRONMENT_OR_NETWORK | 0.85 | E7, E9, E12 |  | The test failed because the server responded with an HTTP 503 error when attempting to navigate to the /login page, indicating environment/server unavailability. |
| TIMING_OR_FLAKINESS | 0.20 | E1 | E7, E12 | Although a Playwright timeout occurred during waitForURL, it was caused directly by the server returning a 503 response rather than standard UI timing flakiness. |
| TEST_SCRIPT_DEFECT | 0.10 |  | E13 | No test script files were modified in this commit range; only docs/scorecard.md was updated. |

<details><summary>Evidence</summary>

- **E1** (error): TimeoutError: page.waitForURL: Timeout 30000ms exceeded. =========================== logs =========================== waiting for navigation until "domcontentloaded" ============================================================     at ../src/pages/components/Header.ts:27    25 |   private async navigate(name: Parameters<Header['link']>[0], url: RegExp): Promise<void> {   26 |     await this.link(na
- **E2** (stack): failing line src/pages/components/Header.ts:27; 
- **E3** (retry-history): retry 0: failed (36258ms); retry 1: failed (10408ms)
- **E4** (trace) `test-results/auth-Authentication-AE-02--7edad-omer-can-log-in-and-log-out-ui-retry1/trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results/auth-Authentication-AE-02--7edad-omer-can-log-in-and-log-out-ui-retry1/test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results/auth-Authentication-AE-02--7edad-omer-can-log-in-and-log-out-ui-retry1/video.webm`: video of failing attempt
- **E7** (network): 1 failed/5xx request(s): {"url":"https://automationexercise.com/login","status":503,"resourceType":"document"}
- **E8** (network): 1 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":22}
- **E9** (console): 1 console error(s): [{"ts":"2026-11-23T08:31:35.669Z","level":"warn","event":"console.error","data":{"text":"Failed to load resource: the server responded with a status of 503 ()"}}]
- **E10** (cleanup): [{"ts":"2026-11-23T08:31:35.504Z","level":"info","event":"account.created","data":{"scenarioUser":"QA ae[REDACTED_PHONE]ed7ff67b"}},{"ts":"2026-11-23T08:31:48.877Z","level":"info","event":"account.cleanup.deleted","data":{"user":"QA ae[REDACTED_PHONE]ed7ff67b","attempt":1}}]
- **E11** (annotation): page URL at failure: https://automationexercise.com/login
- **E12** (network): site served an error page instead of the requested page: HTTP 503 for /login
- **E13** (diff): changed files: docs/scorecard.md

</details>

### AE-03 – AE-03b login is rejected for an unregistered email (UI + API agree)

- **Symptom:** Error: [AE-03|P0] invalid-credentials error  expect(locator).toBeVisible() failed
- **First failure:** First failing assertion/action at tests/ui/auth.spec.ts:78:89 (AI: AE-03 attempt 0 failed due to an HTTP 503 Service Unavailable error when requesting https://automationexercise.com/login, which prevented the expected error message locator from rendering within the t)
- **Classification:** ENVIRONMENT_OR_NETWORK (85%) – AI agreed with the rule-based baseline
- **Alternatives considered:** TIMING_OR_FLAKINESS (0.65), LOCATOR_OR_UI_CHANGE (0.20)
- **Validate:** Validated via network log (E7) showing HTTP status 503 for the target page and retry history (E3) showing the test passed on the next attempt once the server recovered. Trace (E4) and screenshot (E5) were captured.
- **Reproduce:** `npx playwright test tests/ui/auth.spec.ts:70 --project=ui`
- **Recommended action:** Investigate server capacity or rate-limiting on https://automationexercise.com/login that leads to intermittent 503 Service Unavailable responses during test execution.
- **Owner:** CI / infrastructure · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| ENVIRONMENT_OR_NETWORK | 0.85 | E7, E3 |  | The initial document request to https://automationexercise.com/login returned HTTP 503 Service Unavailable, preventing the login page from loading properly and causing the UI assertion for the error message to time out. |
| TIMING_OR_FLAKINESS | 0.65 | E3 | E7 | The test passed on retry 1, demonstrating transient behavior, but the root cause of the initial failure was a server 503 HTTP error rather than a frontend race condition. |
| LOCATOR_OR_UI_CHANGE | 0.20 | E1 | E3, E7, E11 | The element was missing during attempt 0, but this was caused by the server 503 error rather than a UI or locator change, as proven by the successful retry without code changes. |

<details><summary>Evidence</summary>

- **E1** (error): Error: [AE-03|P0] invalid-credentials error  expect(locator).toBeVisible() failed  Locator: getByText('Your email or password is incorrect!') Expected: visible Timeout: 10000ms Error: element(s) not found  Call log:   - [AE-03|P0] invalid-credentials error getByText('Your email or password is incorrect!') with timeout 10000ms   - waiting for getByText('Your email or password is incorrect!')     76
- **E2** (stack): failing line tests/ui/auth.spec.ts:78; 
- **E3** (retry-history): retry 0: failed (12150ms); retry 1: passed (1896ms)
- **E4** (trace) `test-results/auth-Authentication-AE-03b-7f163-istered-email-UI-API-agree--ui/trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results/auth-Authentication-AE-03b-7f163-istered-email-UI-API-agree--ui/test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results/auth-Authentication-AE-03b-7f163-istered-email-UI-API-agree--ui/video.webm`: video of failing attempt
- **E7** (network): 1 failed/5xx request(s): {"url":"https://automationexercise.com/login","status":503,"resourceType":"document"}
- **E8** (network): 1 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":12}
- **E9** (console): context only (third-party hosts, not product evidence): 3 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E10** (console): 5 console error(s): [{"ts":"2026-11-23T08:31:07.597Z","level":"warn","event":"console.error","data":{"text":"Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector"}},{"ts":"2026-11-23T08:31:07.610Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/login' was loaded over HTTPS, but requested an insecure stylesheet 'http://font
- **E11** (diff): changed files: docs/scorecard.md

</details>

### AE-12 – AE-12 quantity set on product details is reflected and line total is calculated

- **Symptom:** Error: expect(locator).toBeVisible() failed  Locator: getByRole('heading', { name: 'Searched Products' })
- **First failure:** First failing assertion/action at src/pages/CatalogPages.ts:43:40. Shares error signature with 2 other failure(s) in this run ("Error: expect(locator).toBeVisible() failed  Locator: getByRole('heading', { nam…") – likely one common cause; triage once.
- **Classification:** ENVIRONMENT_OR_NETWORK (90%)
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
- **E3** (retry-history): retry 0: failed (11973ms); retry 1: passed (8437ms)
- **E4** (trace) `test-results/cart-Cart-AE-12-quantity-s-97485-nd-line-total-is-calculated-ui/trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results/cart-Cart-AE-12-quantity-s-97485-nd-line-total-is-calculated-ui/test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results/cart-Cart-AE-12-quantity-s-97485-nd-line-total-is-calculated-ui/video.webm`: video of failing attempt
- **E7** (network): 19 failed/5xx request(s): {"url":"https://automationexercise.com/get_product_picture/15","status":503,"resourceType":"image"}; {"url":"https://automationexercise.com/get_product_picture/18","status":503,"resourceType":"image"}; {"url":"https://automationexercise.com/get_product_picture/19","status":503,"resourceType":"image"}; {"url":"https://automationexercise.com/get_product_picture/24","status"
- **E8** (network): 1 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":17}
- **E9** (console): context only (third-party hosts, not product evidence): 3 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E10** (console): 20 console error(s): [{"ts":"2026-11-23T08:31:35.345Z","level":"warn","event":"console.error","data":{"text":"Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector"}},{"ts":"2026-11-23T08:31:35.353Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://
- **E11** (diff): changed files: docs/scorecard.md

</details>

### AE-08 – AE-08 zero-result search shows an empty result set (UI + API)

- **Symptom:** Error: API https://automationexercise.com/api/searchProduct returned non-JSON (HTTP 503): <html><head><meta name='viewport' content='width=device-width, initial-scale=1'></head><body><h2>This website is under heavy load (queue full)</h2><p>We're sorry, too many people are accessing this we     at ..
- **First failure:** First failing assertion/action at src/api/client.ts:38:13. Shares error signature with 2 other failure(s) in this run ("Error: API <url> returned non-JSON (HTTP #): <html><head><meta name='viewport' c…") – likely one common cause; triage once.
- **Classification:** ENVIRONMENT_OR_NETWORK (90%)
- **Alternatives considered:** TIMING_OR_FLAKINESS (0.70)
- **Validate:** Re-run isolated: npx playwright test tests/ui/catalog.spec.ts:57 --project=ui --trace on; open trace; check: n/a
- **Reproduce:** `npx playwright test tests/ui/catalog.spec.ts:57 --project=ui`
- **Recommended action:** Check runner/network status and site availability; re-run once. No test change unless repeated and reproducible.
- **Owner:** CI / infrastructure · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| ENVIRONMENT_OR_NETWORK | 0.85 | E1 |  | The API answered with an HTTP 5xx error page (site overloaded or unavailable) instead of JSON. The contract was never exercised, so this is not evidence of an API change. |
| TIMING_OR_FLAKINESS | 0.70 | E3 |  | Same code passed and failed across attempts: non-deterministic behaviour. |

<details><summary>Evidence</summary>

- **E1** (error): Error: API https://automationexercise.com/api/searchProduct returned non-JSON (HTTP 503): <html><head><meta name='viewport' content='width=device-width, initial-scale=1'></head><body><h2>This website is under heavy load (queue full)</h2><p>We're sorry, too many people are accessing this we     at ../src/api/client.ts:38    36 |       json = JSON.parse(text);   37 |     } catch { > 38 |       throw
- **E2** (stack): failing line src/api/client.ts:38; 
- **E3** (retry-history): retry 0: failed (5390ms); retry 1: passed (5339ms)
- **E4** (trace) `test-results/catalog-Catalogue-search-a-b94c7-an-empty-result-set-UI-API--ui/trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results/catalog-Catalogue-search-a-b94c7-an-empty-result-set-UI-API--ui/test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results/catalog-Catalogue-search-a-b94c7-an-empty-result-set-UI-API--ui/video.webm`: video of failing attempt
- **E7** (network): no failed first-party requests recorded (ad hosts blocked by design are excluded)
- **E8** (network): 1 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":13}
- **E9** (console): context only (third-party hosts, not product evidence): 6 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E10** (console): 8 console error(s): [{"ts":"2026-11-23T08:32:19.342Z","level":"warn","event":"console.error","data":{"text":"Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector"}},{"ts":"2026-11-23T08:32:19.345Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://f
- **E11** (diff): changed files: docs/scorecard.md

</details>

### AE-10 – AE-10 brand filter shows exactly the brand products and matches the sidebar count

- **Symptom:** Error: API https://automationexercise.com/api/brandsList returned non-JSON (HTTP 503): <html><head><meta name='viewport' content='width=device-width, initial-scale=1'></head><body><h2>This website is under heavy load (queue full)</h2><p>We're sorry, too many people are accessing this we     at ../sr
- **First failure:** First failing assertion/action at src/api/client.ts:38:13. Shares error signature with 2 other failure(s) in this run ("Error: API <url> returned non-JSON (HTTP #): <html><head><meta name='viewport' c…") – likely one common cause; triage once.
- **Classification:** TEST_SCRIPT_DEFECT (75%)
- **Alternatives considered:** ENVIRONMENT_OR_NETWORK (0.85)
- **Validate:** Re-run isolated: npx playwright test tests/ui/catalog.spec.ts:118 --project=ui --trace on; open trace; check: close alternative: ENVIRONMENT_OR_NETWORK
- **Reproduce:** `npx playwright test tests/ui/catalog.spec.ts:118 --project=ui`
- **Recommended action:** Inspect the diff of the failing spec/page object; prepare a minimal patch on a branch; re-run the isolated test; human review before merge.
- **Owner:** QA automation · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| TEST_SCRIPT_DEFECT | 0.85 | E1, E10 |  | The page was still about:blank when the test failed: the test interacted before navigating to any page. |
| ENVIRONMENT_OR_NETWORK | 0.85 | E1 |  | The API answered with an HTTP 5xx error page (site overloaded or unavailable) instead of JSON. The contract was never exercised, so this is not evidence of an API change. |

<details><summary>Evidence</summary>

- **E1** (error): Error: API https://automationexercise.com/api/brandsList returned non-JSON (HTTP 503): <html><head><meta name='viewport' content='width=device-width, initial-scale=1'></head><body><h2>This website is under heavy load (queue full)</h2><p>We're sorry, too many people are accessing this we     at ../src/api/client.ts:38    36 |       json = JSON.parse(text);   37 |     } catch { > 38 |       throw ne
- **E2** (stack): failing line src/api/client.ts:38; 
- **E3** (retry-history): retry 0: failed (295ms); retry 1: failed (468ms)
- **E4** (trace) `test-results/catalog-Catalogue-search-a-2afc7-d-matches-the-sidebar-count-ui-retry1/trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results/catalog-Catalogue-search-a-2afc7-d-matches-the-sidebar-count-ui-retry1/test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results/catalog-Catalogue-search-a-2afc7-d-matches-the-sidebar-count-ui-retry1/video.webm`: video of failing attempt
- **E7** (network): no failed first-party requests recorded (ad hosts blocked by design are excluded)
- **E8** (network): xhr-log: no first-party XHR call completed during the test
- **E9** (console): no console errors recorded
- **E10** (annotation): page URL at failure: about:blank
- **E11** (diff): changed files: docs/scorecard.md

</details>

### AE-15 – AE-15 flagship: new customer discovers products, checks out, pays and downloads a correct invoice

- **Symptom:** Error: [AE-15|P0] signup form opened  expect(locator).toBeVisible() failed
- **First failure:** First failing assertion/action at tests/support/flows.ts:21:63
- **Classification:** ENVIRONMENT_OR_NETWORK (85%)
- **Alternatives considered:** LOCATOR_OR_UI_CHANGE (0.30), TIMING_OR_FLAKINESS (0.30)
- **Validate:** Re-run isolated: npx playwright test tests/ui/checkout.spec.ts:16 --project=ui --trace on; open trace; check: n/a
- **Reproduce:** `npx playwright test tests/ui/checkout.spec.ts:16 --project=ui`
- **Recommended action:** Check runner/network status and site availability; re-run once. No test change unless repeated and reproducible.
- **Owner:** CI / infrastructure · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| ENVIRONMENT_OR_NETWORK | 0.85 | E7, E13, E5 |  | The site returned an HTTP 5xx error page (HTTP 503 for /view_cart) instead of the page under test. The shared public site was unavailable or overloaded; nothing about the test or the product's behaviour was exercised. |
| LOCATOR_OR_UI_CHANGE | 0.30 | E1, E5, E4 | E7, E8 | Element did not appear in time, but first-party requests failed during the test, which explains a missing UI response better than a page-structure change. |
| TIMING_OR_FLAKINESS | 0.30 | E1, E3 |  | Generic timeout; slow site or synchronization gap. |

<details><summary>Evidence</summary>

- **E1** (error): Error: [AE-15|P0] signup form opened  expect(locator).toBeVisible() failed  Locator: getByText('Enter Account Information') Expected: visible Timeout: 10000ms Error: element(s) not found  Call log:   - [AE-15|P0] signup form opened getByText('Enter Account Information') with timeout 10000ms   - waiting for getByText('Enter Account Information')      at support/flows.ts:21    19 | export async func
- **E2** (stack): failing line tests/support/flows.ts:21; 
- **E3** (retry-history): retry 0: failed (28160ms); retry 1: failed (33062ms)
- **E4** (trace) `test-results/checkout-Checkout-and-orde-4f317-downloads-a-correct-invoice-ui-retry1/trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results/checkout-Checkout-and-orde-4f317-downloads-a-correct-invoice-ui-retry1/test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results/checkout-Checkout-and-orde-4f317-downloads-a-correct-invoice-ui-retry1/video.webm`: video of failing attempt
- **E7** (network): 20 failed/5xx request(s): {"url":"https://automationexercise.com/get_product_picture/13","status":503,"resourceType":"image"}; {"url":"https://automationexercise.com/get_product_picture/4","status":503,"resourceType":"image"}; {"url":"https://automationexercise.com/get_product_picture/12","status":503,"resourceType":"image"}; {"url":"https://automationexercise.com/get_product_picture/5","status":5
- **E8** (network): 7 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/add_to_cart/2","method":"GET","ms":725}; {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":14}; {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":26}; {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":16}
- **E9** (console): context only (third-party hosts, not product evidence): 20 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E10** (console): 20 console error(s): [{"ts":"2026-11-23T08:33:02.152Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://fonts.googleapis.com/css?family=Roboto:400,300,400italic,500,700,100'. This request has been blocked; the content must be served over HTTPS."}},{"ts":"20
- **E11** (cleanup): [{"ts":"2026-11-23T08:33:35.769Z","level":"info","event":"account.cleanup.deleted","data":{"user":"QA ae39042427b6bd83bf21","attempt":1}}]
- **E12** (annotation): page URL at failure: https://automationexercise.com/view_cart
- **E13** (network): site served an error page instead of the requested page: HTTP 503 for /view_cart
- **E14** (diff): changed files: docs/scorecard.md

</details>

### AE-16 – AE-16 checkout addresses match both the registration fixture and the API profile

- **Symptom:** Error: expect(locator).toBeVisible() failed  Locator: getByRole('heading', { name: 'All Products' })
- **First failure:** First failing assertion/action at src/pages/CatalogPages.ts:36:43. Shares error signature with 2 other failure(s) in this run ("Error: expect(locator).toBeVisible() failed  Locator: getByRole('heading', { nam…") – likely one common cause; triage once.
- **Classification:** TIMING_OR_FLAKINESS (70%)
- **Alternatives considered:** ENVIRONMENT_OR_NETWORK (0.50), LOCATOR_OR_UI_CHANGE (0.30)
- **Validate:** Re-run isolated: npx playwright test tests/ui/checkout.spec.ts:80 --project=ui --trace on; open trace; check: n/a
- **Reproduce:** `npx playwright test tests/ui/checkout.spec.ts:80 --project=ui`
- **Recommended action:** Re-run isolated with --repeat-each to measure; find the missing wait condition; never add fixed sleeps or blanket timeout increases.
- **Owner:** QA automation · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| TIMING_OR_FLAKINESS | 0.70 | E3 |  | Same code passed and failed across attempts: non-deterministic behaviour. |
| ENVIRONMENT_OR_NETWORK | 0.50 | E7, E8 |  | Network-level errors were recorded during the test (failed requests and/or net:: error codes). |
| LOCATOR_OR_UI_CHANGE | 0.30 | E1, E5, E4 | E7, E8 | Element did not appear in time, but first-party requests failed during the test, which explains a missing UI response better than a page-structure change. |

<details><summary>Evidence</summary>

- **E1** (error): Error: expect(locator).toBeVisible() failed  Locator: getByRole('heading', { name: 'All Products' }) Expected: visible Timeout: 10000ms Error: element(s) not found  Call log:   - Expect "toBeVisible" getByRole('heading', { name: 'All Products' }) with timeout 10000ms   - waiting for getByRole('heading', { name: 'All Products' })      at ../src/pages/CatalogPages.ts:36    34 |   async open(): Promi
- **E2** (stack): failing line src/pages/CatalogPages.ts:36; 
- **E3** (retry-history): retry 0: failed (16627ms); retry 1: passed (16806ms)
- **E4** (trace) `test-results/checkout-Checkout-and-orde-0dad8-fixture-and-the-API-profile-ui/trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results/checkout-Checkout-and-orde-0dad8-fixture-and-the-API-profile-ui/test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results/checkout-Checkout-and-orde-0dad8-fixture-and-the-API-profile-ui/video.webm`: video of failing attempt
- **E7** (network): 20 failed/5xx request(s): {"url":"https://automationexercise.com/get_product_picture/1","status":503,"resourceType":"image"}; {"url":"https://automationexercise.com/get_product_picture/22","status":503,"resourceType":"image"}; {"url":"https://automationexercise.com/get_product_picture/15","status":503,"resourceType":"image"}; {"url":"https://automationexercise.com/get_product_picture/7","status":5
- **E8** (network): 1 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":14}
- **E9** (console): context only (third-party hosts, not product evidence): 6 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E10** (console): 20 console error(s): [{"ts":"2026-11-23T08:32:35.142Z","level":"warn","event":"console.error","data":{"text":"Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector"}},{"ts":"2026-11-23T08:32:35.151Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/login' was loaded over HTTPS, but requested an insecure stylesheet 'http://fon
- **E11** (cleanup): [{"ts":"2026-11-23T08:32:33.930Z","level":"info","event":"account.created","data":{"scenarioUser":"QA ae39042427f0ba41aada"}},{"ts":"2026-11-23T08:32:52.501Z","level":"info","event":"account.cleanup.deleted","data":{"user":"QA ae39042427f0ba41aada","attempt":1}}]
- **E12** (diff): changed files: docs/scorecard.md

</details>

### AE-17 – AE-17 invoice for a logged-in customer downloads and states the correct total

- **Symptom:** Error: expect(locator).toBeVisible() failed  Locator: getByRole('heading', { name: 'All Products' })
- **First failure:** First failing assertion/action at src/pages/CatalogPages.ts:36:43. Shares error signature with 2 other failure(s) in this run ("Error: expect(locator).toBeVisible() failed  Locator: getByRole('heading', { nam…") – likely one common cause; triage once.
- **Classification:** ENVIRONMENT_OR_NETWORK (90%)
- **Alternatives considered:** LOCATOR_OR_UI_CHANGE (0.30), TIMING_OR_FLAKINESS (0.30)
- **Validate:** Re-run isolated: npx playwright test tests/ui/checkout.spec.ts:108 --project=ui --trace on; open trace; check: n/a
- **Reproduce:** `npx playwright test tests/ui/checkout.spec.ts:108 --project=ui`
- **Recommended action:** Check runner/network status and site availability; re-run once. No test change unless repeated and reproducible.
- **Owner:** CI / infrastructure · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| ENVIRONMENT_OR_NETWORK | 0.85 | E7, E13, E5 |  | The site returned an HTTP 5xx error page (HTTP 503 for /checkout) instead of the page under test. The shared public site was unavailable or overloaded; nothing about the test or the product's behaviour was exercised. |
| LOCATOR_OR_UI_CHANGE | 0.30 | E1, E5, E4 | E7, E8 | Element did not appear in time, but first-party requests failed during the test, which explains a missing UI response better than a page-structure change. |
| TIMING_OR_FLAKINESS | 0.30 | E1, E3 |  | Generic timeout; slow site or synchronization gap. |

<details><summary>Evidence</summary>

- **E1** (error): Error: expect(locator).toBeVisible() failed  Locator: getByRole('heading', { name: 'All Products' }) Expected: visible Timeout: 10000ms Error: element(s) not found  Call log:   - Expect "toBeVisible" getByRole('heading', { name: 'All Products' }) with timeout 10000ms   - waiting for getByRole('heading', { name: 'All Products' })      at ../src/pages/CatalogPages.ts:36    34 |   async open(): Promi
- **E2** (stack): failing line src/pages/CatalogPages.ts:36; 
- **E3** (retry-history): retry 0: failed (15252ms); retry 1: failed (27465ms)
- **E4** (trace) `test-results/checkout-Checkout-and-orde-667f1-nd-states-the-correct-total-ui-retry1/trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results/checkout-Checkout-and-orde-667f1-nd-states-the-correct-total-ui-retry1/test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results/checkout-Checkout-and-orde-667f1-nd-states-the-correct-total-ui-retry1/video.webm`: video of failing attempt
- **E7** (network): 15 failed/5xx request(s): {"url":"https://automationexercise.com/get_product_picture/23","status":503,"resourceType":"image"}; {"url":"https://automationexercise.com/get_product_picture/43","status":503,"resourceType":"image"}; {"url":"https://automationexercise.com/get_product_picture/30","status":503,"resourceType":"image"}; {"url":"https://automationexercise.com/get_product_picture/38","status"
- **E8** (network): 3 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":12}; {"url":"https://automationexercise.com/add_to_cart/3","method":"GET","ms":1482}; {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":10}
- **E9** (console): context only (third-party hosts, not product evidence): 18 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E10** (console): 20 console error(s): [{"ts":"2026-11-23T08:33:32.317Z","level":"warn","event":"console.error","data":{"text":"Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector"}},{"ts":"2026-11-23T08:33:32.327Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/login' was loaded over HTTPS, but requested an insecure stylesheet 'http://fon
- **E11** (cleanup): [{"ts":"2026-11-23T08:33:31.726Z","level":"info","event":"account.created","data":{"scenarioUser":"QA ae[REDACTED_PHONE]a4ea387a"}},{"ts":"2026-11-23T08:34:00.218Z","level":"info","event":"account.cleanup.deleted","data":{"user":"QA ae[REDACTED_PHONE]a4ea387a","attempt":1}}]
- **E12** (annotation): page URL at failure: https://automationexercise.com/checkout
- **E13** (network): site served an error page instead of the requested page: HTTP 503 for /checkout
- **E14** (diff): changed files: docs/scorecard.md

</details>