# QA run – RCA summary

> Classifications are **hypotheses pending human review**. Confidence is a calibrated judgement, not proof.

| Item | Value |
|---|---|
| Commit | `8aff32c26a3f` on `fi-01-ai-rca` |
| Run | https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/44944370864 |
| Trigger | workflow_dispatch |
| Generated | 2026-11-21T20:05:47.357Z |
| Analysis mode | ai-assisted (with deterministic baseline) |
| Tests | 2 (passed 1, failed 1, flaky 0, skipped 0) |
| Pass rate | 50% |
| Duration | 10.4 s |

## Failures

| Scenario | Test | Classification | Confidence | Business severity | Owner | Mode |
|---|---|---|---|---|---|---|
| AE-12 | AE-12 quantity set on product details is reflected and line total is calculated | **TEST_SCRIPT_DEFECT** | 85% | NONE | QA automation | ai-assisted |

### AE-12 – AE-12 quantity set on product details is reflected and line total is calculated

- **Symptom:** Error: [AE-12|P0] line total for 4 units = 4 x unit price  expect(received).toBe(expected) // Object.is equality
- **First failure:** AE-12
- **Classification:** TEST_SCRIPT_DEFECT (85%) – AI agreed with the rule-based baseline
- **Alternatives considered:** PRODUCT_DEFECT (0.15)
- **Validate:** Inspected assertion error in E1 and diff in E12. Trace artifact E4 available but error mechanism is directly verified in E1 assertion text.
- **Reproduce:** `npx playwright test tests/ui/cart.spec.ts:31 --project=ui`
- **Recommended action:** Update assertion in `tests/ui/cart.spec.ts` at line 41 to multiply by 4 (`added.unitPrice * 4`) instead of 3.
- **Owner:** QA automation · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| TEST_SCRIPT_DEFECT | 0.85 | E1, E3, E12 |  | The assertion in line 41 incorrectly multiplies `added.unitPrice` by 3 instead of 4 (`added.unitPrice * 3`), resulting in expected value 1500 for 4 units. The product correctly returned 2000. Furthermore, `tests/ui/cart.spec.ts` was modified in this commit range. |
| PRODUCT_DEFECT | 0.15 |  | E1, E12 | The product calculation of 2000 for 4 units (500 unit price) is mathematically correct; the error is strictly in the test oracle. |

<details><summary>Evidence</summary>

- **E1** (error): Error: [AE-12|P0] line total for 4 units = 4 x unit price  expect(received).toBe(expected) // Object.is equality  Expected: 1500 Received: 2000    39 |       expectCart(lines, [added], tag);   40 |       // Explicit arithmetic oracle (also the target of fault-injection exercise FI-01). > 41 |       expect(lines[0]?.total, tag('line total for 4 units = 4 x unit price')).toBe(added.unitPrice * 3);  
- **E2** (stack): failing line tests/ui/cart.spec.ts:41; 
- **E3** (retry-history): retry 0: failed (4566ms); retry 1: failed (2191ms)
- **E4** (trace) `test-results/cart-Cart-AE-12-quantity-s-97485-nd-line-total-is-calculated-ui-retry1/trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results/cart-Cart-AE-12-quantity-s-97485-nd-line-total-is-calculated-ui-retry1/test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results/cart-Cart-AE-12-quantity-s-97485-nd-line-total-is-calculated-ui-retry1/video.webm`: video of failing attempt
- **E7** (network): no failed first-party requests recorded (ad hosts blocked by design are excluded)
- **E8** (network): 3 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":12}; {"url":"https://automationexercise.com/add_to_cart/1","method":"GET","ms":137}; {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":14}
- **E9** (console): context only (third-party hosts, not product evidence): 12 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E10** (console): 16 console error(s): [{"ts":"2026-11-21T20:05:44.988Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://fonts.googleapis.com/css?family=Roboto:400,300,400italic,500,700,100'. This request has been blocked; the content must be served over HTTPS."}},{"ts":"20
- **E11** (annotation): page URL at failure: https://automationexercise.com/view_cart
- **E12** (diff): changed files: tests/ui/cart.spec.ts

</details>