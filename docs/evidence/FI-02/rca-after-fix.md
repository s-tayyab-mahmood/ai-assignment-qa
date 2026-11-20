# QA run – RCA summary

> Classifications are **hypotheses pending human review**. Confidence is a calibrated judgement, not proof.

| Item | Value |
|---|---|
| Commit | `5c7b334dc9fd` on `main` |
| Generated | 2026-11-20T20:34:37.237Z |
| Analysis mode | deterministic (no AI_API_KEY – model-free fallback) |
| Tests | 1 (passed 0, failed 1, flaky 0, skipped 0) |
| Pass rate | 0% |
| Duration | 14.7 s |

## Failures

| Scenario | Test | Classification | Confidence | Business severity | Owner | Mode |
|---|---|---|---|---|---|---|
| AE-11 | FI-02 add-to-cart request blocked by test-controlled interception | **ENVIRONMENT_OR_NETWORK** | 75% | NONE | QA automation (exercise owner) | deterministic |

### AE-11 – FI-02 add-to-cart request blocked by test-controlled interception

> ⚠️ Fault injection: FI-02: route.abort(connectionfailed) on /add_to_cart/*. Not evidence about the product.

- **Symptom:** Error: expect(locator).toBeVisible() failed  Locator: locator('#cartModal').getByRole('heading', { name: 'Added!' })
- **First failure:** First failing assertion/action at src\pages\CatalogPages.ts:138:30
- **Classification:** ENVIRONMENT_OR_NETWORK (75%)
- **Alternatives considered:** LOCATOR_OR_UI_CHANGE (0.30), TIMING_OR_FLAKINESS (0.30)
- **Validate:** Re-run isolated: npx playwright test tests\fault-injection\fi-02-network.spec.ts:12 --project=fault-injection --trace on; open trace; check: n/a
- **Reproduce:** `npx playwright test tests\fault-injection\fi-02-network.spec.ts:12 --project=fault-injection`
- **Recommended action:** Expected outcome of the controlled exercise (FI-02). No product or infrastructure action. Verify the classification, record the review, and remove the injection to restore normal behaviour.
- **Owner:** QA automation (exercise owner) · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| ENVIRONMENT_OR_NETWORK | 0.75 | E12, E7, E8, E3 |  | Test carries a fault-injection annotation (FI-02: route.abort(connectionfailed) on /add_to_cart/*). The failure is test-controlled; it is not evidence about the product. |
| LOCATOR_OR_UI_CHANGE | 0.30 | E1, E5, E4 | E7, E8 | Element did not appear in time, but first-party requests failed during the test, which explains a missing UI response better than a page-structure change. |
| TIMING_OR_FLAKINESS | 0.30 | E1, E3 |  | Generic timeout; slow site or synchronization gap. |

<details><summary>Evidence</summary>

- **E1** (error): Error: expect(locator).toBeVisible() failed  Locator: locator('#cartModal').getByRole('heading', { name: 'Added!' }) Expected: visible Timeout: 10000ms Error: element(s) not found  Call log:   - Expect "toBeVisible" locator('#cartModal').getByRole('heading', { name: 'Added!' }) with timeout 10000ms   - waiting for locator('#cartModal').getByRole('heading', { name: 'Added!' })      at ..\src\pages\
- **E2** (stack): failing line src\pages\CatalogPages.ts:138; 
- **E3** (retry-history): retry 0: failed (13436ms)
- **E4** (trace) `test-results\fi-02-network-FI-02-add-to-feaf7-est-controlled-interception-fault-injection\trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results\fi-02-network-FI-02-add-to-feaf7-est-controlled-interception-fault-injection\test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results\fi-02-network-FI-02-add-to-feaf7-est-controlled-interception-fault-injection\video.webm`: video of failing attempt
- **E7** (network): 1 failed/5xx request(s): {"method":"GET","url":"https://automationexercise.com/add_to_cart/1","resourceType":"xhr","error":"net::ERR_CONNECTION_FAILED"}
- **E8** (network): 1 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":137}
- **E9** (console): context only (third-party hosts, not product evidence): 3 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E10** (console): 5 console error(s): [{"ts":"2026-11-20T20:34:24.658Z","level":"warn","event":"console.error","data":{"text":"Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector"}},{"ts":"2026-11-20T20:34:24.785Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://f
- **E11** (annotation): page URL at failure: https://automationexercise.com/products
- **E12** (annotation): fault-injection annotation present: FI-02: route.abort(connectionfailed) on /add_to_cart/*
- **E13** (diff): changed files: docs/fault-injection/FI-02.md, src/fixtures/test.ts, tools/rca/classify.ts

</details>