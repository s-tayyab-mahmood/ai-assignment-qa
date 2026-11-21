# QA run – RCA summary

> Classifications are **hypotheses pending human review**. Confidence is a calibrated judgement, not proof.

| Item | Value |
|---|---|
| Commit | `13890bc44f72` on `fi-01-ai-rca` |
| Run | https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/44942993219 |
| Trigger | workflow_dispatch |
| Generated | 2026-11-21T19:50:07.130Z |
| Analysis mode | ai-assisted (with deterministic baseline) |
| Tests | 2 (passed 1, failed 1, flaky 0, skipped 0) |
| Pass rate | 50% |
| Duration | 8.0 s |

## Failures

| Scenario | Test | Classification | Confidence | Business severity | Owner | Mode |
|---|---|---|---|---|---|---|
| AE-12 | AE-12 quantity set on product details is reflected and line total is calculated | **TEST_SCRIPT_DEFECT** | 75% | NONE | QA automation | ai-rejected-fallback |

### AE-12 – AE-12 quantity set on product details is reflected and line total is calculated

- **Symptom:** Error: [AE-12|P0] line total for 4 units = 4 x unit price  expect(received).toBe(expected) // Object.is equality
- **First failure:** First failing assertion/action at tests/ui/cart.spec.ts:41:79
- **Classification:** TEST_SCRIPT_DEFECT (75%) – AI call failed or returned unusable output; rule-based result used (call failed: Error: HTTP 503: {
  "error": {
    "code": 503,
    "message": "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.",
    "s)
- **Alternatives considered:** PRODUCT_DEFECT (0.25)
- **Validate:** Re-run isolated: npx playwright test tests/ui/cart.spec.ts:31 --project=ui --trace on; open trace; check: n/a
- **Reproduce:** `npx playwright test tests/ui/cart.spec.ts:31 --project=ui`
- **Recommended action:** Inspect the diff of the failing spec/page object; prepare a minimal patch on a branch; re-run the isolated test; human review before merge.
- **Owner:** QA automation · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| TEST_SCRIPT_DEFECT | 0.75 | E1, E13 |  | Test code changed in this commit range (tests/ui/cart.spec.ts), including the failing spec, and the failure is an assertion/locator failure. |
| PRODUCT_DEFECT | 0.25 | E1, E5 | E13 | Value mismatch against a computed/API oracle, but test code in the failure path changed (tests/ui/cart.spec.ts), which points away from the product. Kept as a low-scored alternative; reproduce manually before ever reporting a product defect. |

<details><summary>Evidence</summary>

- **E1** (error): Error: [AE-12|P0] line total for 4 units = 4 x unit price  expect(received).toBe(expected) // Object.is equality  Expected: 1500 Received: 2000    39 |       expectCart(lines, [added], tag);   40 |       // Explicit arithmetic oracle (also the target of fault-injection exercise FI-01). > 41 |       expect(lines[0]?.total, tag('line total for 4 units = 4 x unit price')).toBe(added.unitPrice * 3);  
- **E2** (stack): failing line tests/ui/cart.spec.ts:41; 
- **E3** (retry-history): retry 0: failed (2980ms); retry 1: failed (2225ms)
- **E4** (trace) `test-results/cart-Cart-AE-12-quantity-s-97485-nd-line-total-is-calculated-ui-retry1/trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results/cart-Cart-AE-12-quantity-s-97485-nd-line-total-is-calculated-ui-retry1/test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results/cart-Cart-AE-12-quantity-s-97485-nd-line-total-is-calculated-ui-retry1/video.webm`: video of failing attempt
- **E7** (network): no failed first-party requests recorded (ad hosts blocked by design are excluded)
- **E8** (network): 3 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":18}; {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":12}; {"url":"https://automationexercise.com/add_to_cart/1","method":"GET","ms":136}
- **E9** (network): 1 first-party request(s) slow (>5 s) or still pending at failure: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","type":"xhr","openForMs":3}
- **E10** (console): context only (third-party hosts, not product evidence): 12 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E11** (console): 16 console error(s): [{"ts":"2026-11-21T19:50:04.714Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://fonts.googleapis.com/css?family=Roboto:400,300,400italic,500,700,100'. This request has been blocked; the content must be served over HTTPS."}},{"ts":"20
- **E12** (annotation): page URL at failure: https://automationexercise.com/view_cart
- **E13** (diff): changed files: tests/ui/cart.spec.ts

</details>