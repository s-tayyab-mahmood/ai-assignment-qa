# QA run – RCA summary

> Classifications are **hypotheses pending human review**. Confidence is a calibrated judgement, not proof.

| Item | Value |
|---|---|
| Commit | `04cc22aa54f2` on `main` |
| Generated | 2026-11-20T20:30:12.179Z |
| Analysis mode | deterministic (no AI_API_KEY – model-free fallback) |
| Tests | 1 (passed 0, failed 1, flaky 0, skipped 0) |
| Pass rate | 0% |
| Duration | 16.7 s |

## Failures

| Scenario | Test | Classification | Confidence | Business severity | Owner | Mode |
|---|---|---|---|---|---|---|
| AE-11 | FI-02 add-to-cart request blocked by test-controlled interception | **ENVIRONMENT_OR_NETWORK** | 75% | NONE | CI / infrastructure | deterministic |

### AE-11 – FI-02 add-to-cart request blocked by test-controlled interception

> ⚠️ Fault injection: FI-02: route.abort(connectionfailed) on /add_to_cart/*. Not evidence about the product.

- **Symptom:** Error: expect(locator).toBeVisible() failed  Locator: locator('#cartModal').getByRole('heading', { name: 'Added!' })
- **First failure:** First failing assertion/action at src\pages\CatalogPages.ts:138:30
- **Classification:** ENVIRONMENT_OR_NETWORK (75%)
- **Alternatives considered:** LOCATOR_OR_UI_CHANGE (0.50), TIMING_OR_FLAKINESS (0.30)
- **Validate:** Re-run isolated: npx playwright test tests\fault-injection\fi-02-network.spec.ts:12 --project=fault-injection --trace on; open trace; check: n/a
- **Reproduce:** `npx playwright test tests\fault-injection\fi-02-network.spec.ts:12 --project=fault-injection`
- **Recommended action:** Check runner/network status and site availability; re-run once. No test change unless repeated and reproducible.
- **Owner:** CI / infrastructure · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| ENVIRONMENT_OR_NETWORK | 0.75 | E11, E12, E7, E8, E3 |  | Test carries a fault-injection annotation (FI-02: route.abort(connectionfailed) on /add_to_cart/*). The failure is test-controlled; it is not evidence about the product. |
| LOCATOR_OR_UI_CHANGE | 0.50 | E1, E5, E4 |  | Element could not be found/resolved in time with no first-party network errors; the page structure may have changed. |
| TIMING_OR_FLAKINESS | 0.30 | E1, E3 |  | Generic timeout; slow site or synchronization gap. |

<details><summary>Evidence</summary>

- **E1** (error): Error: expect(locator).toBeVisible() failed  Locator: locator('#cartModal').getByRole('heading', { name: 'Added!' }) Expected: visible Timeout: 10000ms Error: element(s) not found  Call log:   - Expect "toBeVisible" locator('#cartModal').getByRole('heading', { name: 'Added!' }) with timeout 10000ms   - waiting for locator('#cartModal').getByRole('heading', { name: 'Added!' })      at ..\src\pages\
- **E2** (stack): failing line src\pages\CatalogPages.ts:138; 
- **E3** (retry-history): retry 0: failed (15370ms)
- **E4** (trace) `test-results\fi-02-network-FI-02-add-to-feaf7-est-controlled-interception-fault-injection\trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results\fi-02-network-FI-02-add-to-feaf7-est-controlled-interception-fault-injection\test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results\fi-02-network-FI-02-add-to-feaf7-est-controlled-interception-fault-injection\video.webm`: video of failing attempt
- **E7** (network): 1 failed/5xx request(s): {"method":"GET","url":"https://automationexercise.com/add_to_cart/1","resourceType":"xhr","error":"net::ERR_CONNECTION_FAILED"}
- **E8** (network): 2 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/add_to_cart/1","method":"GET","ms":7}; {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":167}
- **E9** (console): context only (third-party hosts, not product evidence): 3 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E10** (console): 5 console error(s): [{"ts":"2026-11-20T20:29:27.567Z","level":"warn","event":"console.error","data":{"text":"Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector"}},{"ts":"2026-11-20T20:29:27.722Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://f
- **E11** (annotation): page URL at failure: https://automationexercise.com/products
- **E12** (annotation): fault-injection annotation present: FI-02: route.abort(connectionfailed) on /add_to_cart/*
- **E13** (diff): changed files: README.md, tools/rca/classify.ts, tools/rca/selftest.ts

</details>