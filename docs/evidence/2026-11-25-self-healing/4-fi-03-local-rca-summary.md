# FI-03 local run – RCA summary (copied from reports/rca/rca-summary.md)

# QA run – RCA summary

> Classifications are **hypotheses pending human review**. Confidence is a calibrated judgement, not proof.

| Item | Value |
|---|---|
| Commit | `016ce995fc98` on `feature/self-healing-agent` |
| Generated | 2026-11-25T13:46:43.317Z |
| Analysis mode | deterministic (no AI_API_KEY – model-free fallback) |
| Tests | 6 (passed 3, failed 3, flaky 0, skipped 0) |
| Pass rate | 50% |
| Duration | 41.5 s |

## Failures

| Scenario | Test | Classification | Confidence | Business severity | Owner | Mode |
|---|---|---|---|---|---|---|
| AE-11 | FI-03 add-to-cart response intermittently delayed by test-controlled interception | **TIMING_OR_FLAKINESS** | 65% | NONE | QA automation (exercise owner) | deterministic |
| AE-11 | FI-03 add-to-cart response intermittently delayed by test-controlled interception | **TIMING_OR_FLAKINESS** | 65% | NONE | QA automation (exercise owner) | deterministic |
| AE-11 | FI-03 add-to-cart response intermittently delayed by test-controlled interception | **TIMING_OR_FLAKINESS** | 65% | NONE | QA automation (exercise owner) | deterministic |

### AE-11 – FI-03 add-to-cart response intermittently delayed by test-controlled interception

> ⚠️ Fault injection: FI-03: 6000ms delay on /add_to_cart every 2 repeats. Not evidence about the product.

- **Symptom:** Error: [AE-11|P0] add-to-cart confirmation within budget  expect(locator).toBeVisible() failed
- **First failure:** First failing assertion/action at tests\fault-injection\fi-03-timing.spec.ts:46:86. Shares error signature with 2 other failure(s) in this run ("Error: [AE-#|P#] add-to-cart confirmation within budget  expect(locator).toBeVis…") – likely one common cause; triage once.
- **Classification:** TIMING_OR_FLAKINESS (65%)
- **Alternatives considered:** ENVIRONMENT_OR_NETWORK (0.75), LOCATOR_OR_UI_CHANGE (0.50)
- **Validate:** Re-run isolated: npx playwright test tests\fault-injection\fi-03-timing.spec.ts:16 --project=fault-injection --trace on; open trace; check: close alternative: ENVIRONMENT_OR_NETWORK
- **Reproduce:** `npx playwright test tests\fault-injection\fi-03-timing.spec.ts:16 --project=fault-injection`
- **Recommended action:** Expected outcome of the controlled exercise (FI-03). No product or infrastructure action. Verify the classification, record the review, and remove the injection to restore normal behaviour.
- **Owner:** QA automation (exercise owner) · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| TIMING_OR_FLAKINESS | 0.75 | E13, E3 |  | Test carries a fault-injection annotation (FI-03: 6000ms delay on /add_to_cart every 2 repeats). The failure is test-controlled; it is not evidence about the product. |
| ENVIRONMENT_OR_NETWORK | 0.75 | E1, E9 |  | A first-party page/XHR request was unanswered for 3105 ms, longer than the 3000 ms wait: the server was the bottleneck, so no reasonable wait would have succeeded. |
| LOCATOR_OR_UI_CHANGE | 0.50 | E1, E5, E4 |  | Element could not be found/resolved in time with no first-party network errors; the page structure may have changed. |

<details><summary>Evidence</summary>

- **E1** (error): Error: [AE-11|P0] add-to-cart confirmation within budget  expect(locator).toBeVisible() failed  Locator: locator('#cartModal').getByRole('heading', { name: 'Added!' }) Expected: visible Timeout: 3000ms Error: element(s) not found  Call log:   - [AE-11|P0] add-to-cart confirmation within budget locator('#cartModal').getByRole('heading', { name: 'Added!' }) with timeout 3000ms   - waiting for locato
- **E2** (stack): failing line tests\fault-injection\fi-03-timing.spec.ts:46; 
- **E3** (retry-history): retry 0: failed (4803ms)
- **E4** (trace) `test-results\fi-03-timing-FI-03-add-to--0ef3d-est-controlled-interception-fault-injection-repeat1\trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results\fi-03-timing-FI-03-add-to--0ef3d-est-controlled-interception-fault-injection-repeat1\test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results\fi-03-timing-FI-03-add-to--0ef3d-est-controlled-interception-fault-injection-repeat1\video.webm`: video of failing attempt
- **E7** (network): no failed first-party requests recorded (ad hosts blocked by design are excluded)
- **E8** (network): 1 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":16}
- **E9** (network): 1 first-party request(s) slow (>5 s) or still pending at failure: {"url":"https://automationexercise.com/add_to_cart/1","method":"GET","type":"xhr","openForMs":3105}
- **E10** (console): context only (third-party hosts, not product evidence): 3 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E11** (console): 4 console error(s): [{"ts":"2026-11-25T13:46:15.616Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://fonts.googleapis.com/css?family=Roboto:400,300,400italic,500,700,100'. This request has been blocked; the content must be served over HTTPS."}},{"ts":"202
- **E12** (annotation): page URL at failure: https://automationexercise.com/products
- **E13** (annotation): fault-injection annotation present: FI-03: 6000ms delay on /add_to_cart every 2 repeats
- **E14** (diff): changed files: .github/workflows/playwright.yml, README.md, agents/orchestrator.md, docs/ai-evidence/approvals.md, docs/ai-policy.md, docs/architecture.md, docs/fault-injection/FI-01.md, docs/fault-injection/FI-03.md, docs/fault-injection/FI-04.md, package.json, skills/review.md, skills/self-healing.md, tools/heal/assertion.ts, tools/heal/engine.ts, tools/heal/heal.ts

</details>

### AE-11 – FI-03 add-to-cart response intermittently delayed by test-controlled interception

> ⚠️ Fault injection: FI-03: 6000ms delay on /add_to_cart every 2 repeats. Not evidence about the product.

- **Symptom:** Error: [AE-11|P0] add-to-cart confirmation within budget  expect(locator).toBeVisible() failed
- **First failure:** First failing assertion/action at tests\fault-injection\fi-03-timing.spec.ts:46:86. Shares error signature with 2 other failure(s) in this run ("Error: [AE-#|P#] add-to-cart confirmation within budget  expect(locator).toBeVis…") – likely one common cause; triage once.
- **Classification:** TIMING_OR_FLAKINESS (65%)
- **Alternatives considered:** ENVIRONMENT_OR_NETWORK (0.75), LOCATOR_OR_UI_CHANGE (0.50)
- **Validate:** Re-run isolated: npx playwright test tests\fault-injection\fi-03-timing.spec.ts:16 --project=fault-injection --trace on; open trace; check: close alternative: ENVIRONMENT_OR_NETWORK
- **Reproduce:** `npx playwright test tests\fault-injection\fi-03-timing.spec.ts:16 --project=fault-injection`
- **Recommended action:** Expected outcome of the controlled exercise (FI-03). No product or infrastructure action. Verify the classification, record the review, and remove the injection to restore normal behaviour.
- **Owner:** QA automation (exercise owner) · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| TIMING_OR_FLAKINESS | 0.75 | E13, E3 |  | Test carries a fault-injection annotation (FI-03: 6000ms delay on /add_to_cart every 2 repeats). The failure is test-controlled; it is not evidence about the product. |
| ENVIRONMENT_OR_NETWORK | 0.75 | E1, E9 |  | A first-party page/XHR request was unanswered for 3098 ms, longer than the 3000 ms wait: the server was the bottleneck, so no reasonable wait would have succeeded. |
| LOCATOR_OR_UI_CHANGE | 0.50 | E1, E5, E4 |  | Element could not be found/resolved in time with no first-party network errors; the page structure may have changed. |

<details><summary>Evidence</summary>

- **E1** (error): Error: [AE-11|P0] add-to-cart confirmation within budget  expect(locator).toBeVisible() failed  Locator: locator('#cartModal').getByRole('heading', { name: 'Added!' }) Expected: visible Timeout: 3000ms Error: element(s) not found  Call log:   - [AE-11|P0] add-to-cart confirmation within budget locator('#cartModal').getByRole('heading', { name: 'Added!' }) with timeout 3000ms   - waiting for locato
- **E2** (stack): failing line tests\fault-injection\fi-03-timing.spec.ts:46; 
- **E3** (retry-history): retry 0: failed (5353ms)
- **E4** (trace) `test-results\fi-03-timing-FI-03-add-to--0ef3d-est-controlled-interception-fault-injection-repeat3\trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results\fi-03-timing-FI-03-add-to--0ef3d-est-controlled-interception-fault-injection-repeat3\test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results\fi-03-timing-FI-03-add-to--0ef3d-est-controlled-interception-fault-injection-repeat3\video.webm`: video of failing attempt
- **E7** (network): no failed first-party requests recorded (ad hosts blocked by design are excluded)
- **E8** (network): 1 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":12}
- **E9** (network): 1 first-party request(s) slow (>5 s) or still pending at failure: {"url":"https://automationexercise.com/add_to_cart/1","method":"GET","type":"xhr","openForMs":3098}
- **E10** (console): context only (third-party hosts, not product evidence): 3 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E11** (console): 4 console error(s): [{"ts":"2026-11-25T13:46:25.878Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://fonts.googleapis.com/css?family=Roboto:400,300,400italic,500,700,100'. This request has been blocked; the content must be served over HTTPS."}},{"ts":"202
- **E12** (annotation): page URL at failure: https://automationexercise.com/products
- **E13** (annotation): fault-injection annotation present: FI-03: 6000ms delay on /add_to_cart every 2 repeats
- **E14** (diff): changed files: .github/workflows/playwright.yml, README.md, agents/orchestrator.md, docs/ai-evidence/approvals.md, docs/ai-policy.md, docs/architecture.md, docs/fault-injection/FI-01.md, docs/fault-injection/FI-03.md, docs/fault-injection/FI-04.md, package.json, skills/review.md, skills/self-healing.md, tools/heal/assertion.ts, tools/heal/engine.ts, tools/heal/heal.ts

</details>

### AE-11 – FI-03 add-to-cart response intermittently delayed by test-controlled interception

> ⚠️ Fault injection: FI-03: 6000ms delay on /add_to_cart every 2 repeats. Not evidence about the product.

- **Symptom:** Error: [AE-11|P0] add-to-cart confirmation within budget  expect(locator).toBeVisible() failed
- **First failure:** First failing assertion/action at tests\fault-injection\fi-03-timing.spec.ts:46:86. Shares error signature with 2 other failure(s) in this run ("Error: [AE-#|P#] add-to-cart confirmation within budget  expect(locator).toBeVis…") – likely one common cause; triage once.
- **Classification:** TIMING_OR_FLAKINESS (65%)
- **Alternatives considered:** ENVIRONMENT_OR_NETWORK (0.75), LOCATOR_OR_UI_CHANGE (0.50)
- **Validate:** Re-run isolated: npx playwright test tests\fault-injection\fi-03-timing.spec.ts:16 --project=fault-injection --trace on; open trace; check: close alternative: ENVIRONMENT_OR_NETWORK
- **Reproduce:** `npx playwright test tests\fault-injection\fi-03-timing.spec.ts:16 --project=fault-injection`
- **Recommended action:** Expected outcome of the controlled exercise (FI-03). No product or infrastructure action. Verify the classification, record the review, and remove the injection to restore normal behaviour.
- **Owner:** QA automation (exercise owner) · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| TIMING_OR_FLAKINESS | 0.75 | E13, E3 |  | Test carries a fault-injection annotation (FI-03: 6000ms delay on /add_to_cart every 2 repeats). The failure is test-controlled; it is not evidence about the product. |
| ENVIRONMENT_OR_NETWORK | 0.75 | E1, E9 |  | A first-party page/XHR request was unanswered for 3101 ms, longer than the 3000 ms wait: the server was the bottleneck, so no reasonable wait would have succeeded. |
| LOCATOR_OR_UI_CHANGE | 0.50 | E1, E5, E4 |  | Element could not be found/resolved in time with no first-party network errors; the page structure may have changed. |

<details><summary>Evidence</summary>

- **E1** (error): Error: [AE-11|P0] add-to-cart confirmation within budget  expect(locator).toBeVisible() failed  Locator: locator('#cartModal').getByRole('heading', { name: 'Added!' }) Expected: visible Timeout: 3000ms Error: element(s) not found  Call log:   - [AE-11|P0] add-to-cart confirmation within budget locator('#cartModal').getByRole('heading', { name: 'Added!' }) with timeout 3000ms   - waiting for locato
- **E2** (stack): failing line tests\fault-injection\fi-03-timing.spec.ts:46; 
- **E3** (retry-history): retry 0: failed (4962ms)
- **E4** (trace) `test-results\fi-03-timing-FI-03-add-to--0ef3d-est-controlled-interception-fault-injection-repeat5\trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results\fi-03-timing-FI-03-add-to--0ef3d-est-controlled-interception-fault-injection-repeat5\test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results\fi-03-timing-FI-03-add-to--0ef3d-est-controlled-interception-fault-injection-repeat5\video.webm`: video of failing attempt
- **E7** (network): no failed first-party requests recorded (ad hosts blocked by design are excluded)
- **E8** (network): 1 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":32}
- **E9** (network): 1 first-party request(s) slow (>5 s) or still pending at failure: {"url":"https://automationexercise.com/add_to_cart/1","method":"GET","type":"xhr","openForMs":3101}
- **E10** (console): context only (third-party hosts, not product evidence): 3 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E11** (console): 4 console error(s): [{"ts":"2026-11-25T13:46:37.087Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://fonts.googleapis.com/css?family=Roboto:400,300,400italic,500,700,100'. This request has been blocked; the content must be served over HTTPS."}},{"ts":"202
- **E12** (annotation): page URL at failure: https://automationexercise.com/products
- **E13** (annotation): fault-injection annotation present: FI-03: 6000ms delay on /add_to_cart every 2 repeats
- **E14** (diff): changed files: .github/workflows/playwright.yml, README.md, agents/orchestrator.md, docs/ai-evidence/approvals.md, docs/ai-policy.md, docs/architecture.md, docs/fault-injection/FI-01.md, docs/fault-injection/FI-03.md, docs/fault-injection/FI-04.md, package.json, skills/review.md, skills/self-healing.md, tools/heal/assertion.ts, tools/heal/engine.ts, tools/heal/heal.ts

</details>