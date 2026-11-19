# QA run – RCA summary

> Classifications are **hypotheses pending human review**. Confidence is a calibrated judgement, not proof.

| Item | Value |
|---|---|
| Commit | `8f91a5827f95` on `main` |
| Generated | 2026-11-19T14:56:51.769Z |
| Analysis mode | deterministic (no AI_API_KEY – model-free fallback) |
| Tests | 3 (passed 1, failed 2, flaky 0, skipped 0) |
| Pass rate | 33% |
| Duration | 156.1 s |

## Failures

| Scenario | Test | Classification | Confidence | Business severity | Owner | Mode |
|---|---|---|---|---|---|---|
| AE-15 | AE-15 flagship: new customer discovers products, checks out, pays and downloads a correct invoice | **ENVIRONMENT_OR_NETWORK** | 50% | NONE | CI / infrastructure | deterministic |
| AE-15 | AE-15 flagship: new customer discovers products, checks out, pays and downloads a correct invoice | **ENVIRONMENT_OR_NETWORK** | 45% | NONE | CI / infrastructure | deterministic |

### AE-15 – AE-15 flagship: new customer discovers products, checks out, pays and downloads a correct invoice

- **Symptom:** Error: [AE-15|P0] delivery address = fixture  expect(received).toEqual(expected) // deep equality
- **First failure:** First failing assertion/action at tests\ui\checkout.spec.ts:45:9. Shares error signature with 1 other failure(s) in this run ("Error: [AE-#|P#] delivery address = fixture  expect(received).toEqual(expected) …") – likely one common cause; triage once.
- **Classification:** ENVIRONMENT_OR_NETWORK (50%)
- **Alternatives considered:** PRODUCT_DEFECT (0.25)
- **Validate:** Re-run isolated: npx playwright test tests\ui\checkout.spec.ts:16 --project=ui --trace on; open trace; check: single attempt – reproducibility unknown
- **Reproduce:** `npx playwright test tests\ui\checkout.spec.ts:16 --project=ui`
- **Recommended action:** Check runner/network status and site availability; re-run once. No test change unless repeated and reproducible.
- **Owner:** CI / infrastructure · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| ENVIRONMENT_OR_NETWORK | 0.50 | E7, E8 |  | Network-level errors were recorded during the test (failed requests and/or net:: error codes). |
| PRODUCT_DEFECT | 0.25 | E1, E5 |  | Deterministic value mismatch against a computed/API oracle with no test-code change. Must be reproduced manually before being reported as a product defect. |

<details><summary>Evidence</summary>

- **E1** (error): Error: [AE-15|P0] delivery address = fixture  expect(received).toEqual(expected) // deep equality  - Expected  - 5 + Received  + 1    Object {     "cityStateZip": "Toronto Ontario M5V 2T6",     "country": "Canada",     "fullName": "Mr. Testa Rossa0ca7", -   "lines": Array [ -     "QA Practice Ltd", -     "205 Automation Street", -     "Suite 42", -   ], +   "lines": Array [],     "phone": "[REDACT
- **E2** (stack): failing line tests\ui\checkout.spec.ts:45; 
- **E3** (retry-history): retry 0: failed (27649ms)
- **E4** (trace) `test-results\checkout-Checkout-and-orde-4f317-downloads-a-correct-invoice-ui\trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results\checkout-Checkout-and-orde-4f317-downloads-a-correct-invoice-ui\test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results\checkout-Checkout-and-orde-4f317-downloads-a-correct-invoice-ui\video.webm`: video of failing attempt
- **E7** (network): 4 failed/5xx request(s): {"method":"GET","url":"https://automationexercise.com/static/fonts/fontawesome-webfont.woff","resourceType":"font","error":"net::ERR_ABORTED"}; {"method":"GET","url":"https://automationexercise.com/static/fonts/fontawesome-webfont.woff","resourceType":"font","error":"net::ERR_ABORTED"}; {"method":"GET","url":"https://automationexercise.com/static/fonts/fontawesome-webfont.
- **E8** (network): 6 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/add_to_cart/2","method":"GET","ms":395}; {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":127}; {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":119}; {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":554}
- **E9** (console): context only (third-party hosts, not product evidence): 20 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E10** (console): 20 console error(s): [{"ts":"2026-11-19T14:53:09.770Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://fonts.googleapis.com/css?family=Roboto:400,300,400italic,500,700,100'. This request has been blocked; the content must be served over HTTPS."}},{"ts":"20
- **E11** (cleanup): [{"ts":"2026-11-19T14:53:34.219Z","level":"info","event":"account.cleanup.deleted","data":{"user":"QA aelocal8f8a240ca7","attempt":1}}]
- **E12** (diff): changed files: docs/evidence/2026-11-19-AE-15-click-before-ready/error-context.md, docs/evidence/2026-11-19-AE-15-click-before-ready/rca-summary.md

</details>

### AE-15 – AE-15 flagship: new customer discovers products, checks out, pays and downloads a correct invoice

- **Symptom:** Error: [AE-15|P0] delivery address = fixture  expect(received).toEqual(expected) // deep equality
- **First failure:** First failing assertion/action at tests\ui\checkout.spec.ts:45:9. Shares error signature with 1 other failure(s) in this run ("Error: [AE-#|P#] delivery address = fixture  expect(received).toEqual(expected) …") – likely one common cause; triage once.
- **Classification:** ENVIRONMENT_OR_NETWORK (45%)
- **Alternatives considered:** PRODUCT_DEFECT (0.25)
- **Validate:** Re-run isolated: npx playwright test tests\ui\checkout.spec.ts:16 --project=ui --trace on; open trace; check: no screenshot; single attempt – reproducibility unknown
- **Reproduce:** `npx playwright test tests\ui\checkout.spec.ts:16 --project=ui`
- **Recommended action:** Check runner/network status and site availability; re-run once. No test change unless repeated and reproducible.
- **Owner:** CI / infrastructure · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| ENVIRONMENT_OR_NETWORK | 0.50 | E6, E7, E8 |  | Network-level errors were recorded during the test (failed requests and/or net:: error codes). |
| PRODUCT_DEFECT | 0.25 | E1 |  | Deterministic value mismatch against a computed/API oracle with no test-code change. Must be reproduced manually before being reported as a product defect. |

<details><summary>Evidence</summary>

- **E1** (error): Error: [AE-15|P0] delivery address = fixture  expect(received).toEqual(expected) // deep equality  - Expected  - 5 + Received  + 1    Object {     "cityStateZip": "Toronto Ontario M5V 2T6",     "country": "Canada",     "fullName": "Mr. Testa Rossaf19b", -   "lines": Array [ -     "QA Practice Ltd", -     "822 Automation Street", -     "Suite 42", -   ], +   "lines": Array [],     "phone": "[REDACT
- **E2** (stack): failing line tests\ui\checkout.spec.ts:45; 
- **E3** (retry-history): retry 0: failed (65196ms)
- **E4** (trace) `test-results\checkout-Checkout-and-orde-4f317-downloads-a-correct-invoice-ui-repeat1\trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (video) `test-results\checkout-Checkout-and-orde-4f317-downloads-a-correct-invoice-ui-repeat1\video.webm`: video of failing attempt
- **E6** (network): 9 failed/5xx request(s): {"method":"GET","url":"https://automationexercise.com/static/fonts/fontawesome-webfont.woff","resourceType":"font","error":"net::ERR_ABORTED"}; {"method":"GET","url":"https://automationexercise.com/static/fonts/fontawesome-webfont.woff","resourceType":"font","error":"net::ERR_ABORTED"}; {"method":"GET","url":"https://automationexercise.com/static/js/jquery.scrollUp.min.js"
- **E7** (network): 4 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":13}; {"url":"https://automationexercise.com/add_to_cart/1","method":"GET","ms":354}; {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":136}; {"url":"https://automationexercise.com/add_to_cart/2","method":"GET","ms":1469}
- **E8** (network): 20 first-party request(s) slow (>5 s) or still pending at failure: {"url":"https://automationexercise.com/static/css/bootstrap.min.css","method":"GET","type":"stylesheet","openForMs":7267}; {"url":"https://automationexercise.com/static/css/animate.css","method":"GET","type":"stylesheet","openForMs":7260}; {"url":"https://automationexercise.com/static/images/home/logo.png","method":"GET","type":"im
- **E9** (console): context only (third-party hosts, not product evidence): 20 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E10** (console): 20 console error(s): [{"ts":"2026-11-19T14:53:36.891Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://fonts.googleapis.com/css?family=Roboto:400,300,400italic,500,700,100'. This request has been blocked; the content must be served over HTTPS."}},{"ts":"20
- **E11** (cleanup): [{"ts":"2026-11-19T14:54:40.262Z","level":"info","event":"account.cleanup.deleted","data":{"user":"QA aelocalf4f52bf19b","attempt":1}}]
- **E12** (diff): changed files: docs/evidence/2026-11-19-AE-15-click-before-ready/error-context.md, docs/evidence/2026-11-19-AE-15-click-before-ready/rca-summary.md

</details>