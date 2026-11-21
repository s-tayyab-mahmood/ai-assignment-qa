# QA run – RCA summary

> Classifications are **hypotheses pending human review**. Confidence is a calibrated judgement, not proof.

| Item | Value |
|---|---|
| Commit | `394a1ac12ea0` on `fi-01-ai-rca` |
| Run | https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/44941742953 |
| Trigger | workflow_dispatch |
| Generated | 2026-11-21T19:35:56.555Z |
| Analysis mode | ai-assisted (with deterministic baseline) |
| Tests | 2 (passed 1, failed 1, flaky 0, skipped 0) |
| Pass rate | 50% |
| Duration | 8.0 s |

## Failures

| Scenario | Test | Classification | Confidence | Business severity | Owner | Mode |
|---|---|---|---|---|---|---|
| AE-12 | AE-12 quantity set on product details is reflected and line total is calculated | **PRODUCT_DEFECT** | 45% | CRITICAL | Product engineering (after QA reproduction) | ai-rejected-fallback |

### AE-12 – AE-12 quantity set on product details is reflected and line total is calculated

- **Symptom:** Error: [AE-12|P0] line total for 4 units = 4 x unit price  expect(received).toBe(expected) // Object.is equality
- **First failure:** First failing assertion/action at tests/ui/cart.spec.ts:41:79
- **Classification:** PRODUCT_DEFECT (45%) – AI output rejected by guardrail: SyntaxError: Unexpected token 'O', "OK
" is not valid JSON; rule-based result used
- **Alternatives considered:** none matched
- **Validate:** Re-run isolated: npx playwright test tests/ui/cart.spec.ts:31 --project=ui --trace on; open trace; check: n/a
- **Reproduce:** `npx playwright test tests/ui/cart.spec.ts:31 --project=ui`
- **Recommended action:** Reproduce manually on the live site, confirm oracle, then raise a defect with trace + steps. Do not change the test.
- **Owner:** Product engineering (after QA reproduction) · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| PRODUCT_DEFECT | 0.45 | E1, E5 |  | Deterministic value mismatch against a computed/API oracle with no test-code change. Must be reproduced manually before being reported as a product defect. |

<details><summary>Evidence</summary>

- **E1** (error): Error: [AE-12|P0] line total for 4 units = 4 x unit price  expect(received).toBe(expected) // Object.is equality  Expected: 1500 Received: 2000    39 |       expectCart(lines, [added], tag);   40 |       // Explicit arithmetic oracle (also the target of fault-injection exercise FI-01). > 41 |       expect(lines[0]?.total, tag('line total for 4 units = 4 x unit price')).toBe(added.unitPrice * 3);  
- **E2** (stack): failing line tests/ui/cart.spec.ts:41; 
- **E3** (retry-history): retry 0: failed (3479ms); retry 1: failed (2218ms)
- **E4** (trace) `test-results/cart-Cart-AE-12-quantity-s-97485-nd-line-total-is-calculated-ui-retry1/trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results/cart-Cart-AE-12-quantity-s-97485-nd-line-total-is-calculated-ui-retry1/test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results/cart-Cart-AE-12-quantity-s-97485-nd-line-total-is-calculated-ui-retry1/video.webm`: video of failing attempt
- **E7** (network): no failed first-party requests recorded (ad hosts blocked by design are excluded)
- **E8** (network): 4 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":10}; {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":12}; {"url":"https://automationexercise.com/add_to_cart/1","method":"GET","ms":138}; {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":12}
- **E9** (console): context only (third-party hosts, not product evidence): 12 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E10** (console): 16 console error(s): [{"ts":"2026-11-21T19:35:54.157Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://fonts.googleapis.com/css?family=Roboto:400,300,400italic,500,700,100'. This request has been blocked; the content must be served over HTTPS."}},{"ts":"20
- **E11** (annotation): page URL at failure: https://automationexercise.com/view_cart
- **E12** (diff): changed files: .env.example, .github/workflows/playwright.yml, docs/ai-policy.md, docs/evidence/2026-11-22-ai-rca-fallback-no-credit/audit-log.jsonl, docs/evidence/2026-11-22-ai-rca-fallback-no-credit/rca-summary.md, tools/rca/ai.ts, tools/rca/analyze.ts, tools/rca/report.ts

</details>