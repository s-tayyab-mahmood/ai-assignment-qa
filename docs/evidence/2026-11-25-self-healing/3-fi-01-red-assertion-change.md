# FI-01 self-healing re-run – red run 45621043105 (pasted job summary; health-check waited once)

```text
Site health check
Healthy after 2 attempt(s). Tests will run.

Policy: up to 4 attempt(s), 10 min apart, slow threshold 10000 ms, 2 requests per attempt.

Attempt	Time (UTC)	Probe	Status	Duration	Problem
1	2026-11-25T13:11:49.563Z	home page	503	394 ms	site overload page (HTTP 503)
1	2026-11-25T13:11:49.563Z	products API	200	1431 ms	ok
2	2026-11-25T13:21:50.070Z	home page	200	271 ms	ok
2	2026-11-25T13:21:50.070Z	products API	200	135 ms	ok
QA run – RCA summary
Classifications are hypotheses pending human review. Confidence is a calibrated judgement, not proof.

Item	Value
Commit	94efbfed8d3e on fi-01-heal
Run	https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/45621043105
Trigger	workflow_dispatch
Generated	2026-11-25T13:22:36.248Z
Analysis mode	ai-assisted (with deterministic baseline)
Tests	2 (passed 0, failed 1, flaky 1, skipped 0)
Pass rate	0%
Duration	19.3 s
Failures
Scenario	Test	Classification	Confidence	Business severity	Owner	Mode
AE-12	AE-12 quantity set on product details is reflected and line total is calculated	TEST_SCRIPT_DEFECT	85%	NONE	QA automation	ai-assisted
AE-12	AE-12b unusual but site-accepted quantity (25) is calculated correctly	ENVIRONMENT_OR_NETWORK	60%	NONE	QA automation	ai-assisted
AE-12 – AE-12 quantity set on product details is reflected and line total is calculated
Symptom: Error: [AE-12|P0] line total for 4 units = 4 x unit price expect(received).toBe(expected) // Object.is equality
First failure: tests/ui/cart.spec.ts:41:79
Classification: TEST_SCRIPT_DEFECT (85%) – AI agreed with the rule-based baseline
Alternatives considered: PRODUCT_DEFECT (0.15)
Validate: Trace artifact E4 was listed; examination of error message E1 and diff E12 confirms the assertion in tests/ui/cart.spec.ts uses added.unitPrice * 3 instead of added.unitPrice * 4 for 4 units, causing a false positive test failure.
Reproduce: npx playwright test tests/ui/cart.spec.ts:31 --project=ui
Recommended action: Fix line 41 in tests/ui/cart.spec.ts to multiply added.unitPrice * 4 instead of added.unitPrice * 3.
Owner: QA automation · Human approval required: yes
Hypothesis	Score	Evidence for	Evidence against	Rationale
TEST_SCRIPT_DEFECT	0.85	E1, E3, E12		The test assertion in tests/ui/cart.spec.ts (modified in this commit range E12) incorrectly multiplies unit price by 3 (added.unitPrice * 3) even though the assertion tag states 'line total for 4 units = 4 x unit price'. The product returned 2000, which accurately reflects 4 * 500.
PRODUCT_DEFECT	0.15	E1	E1, E7, E8, E12	The UI received value of 2000 is mathematically correct for 4 units of 500 each. The failure is entirely driven by the incorrect multiplier in the test code assertion.
Evidence
AE-12 – AE-12b unusual but site-accepted quantity (25) is calculated correctly
Symptom: Error: expect(locator).toBeVisible() failed Locator: locator('#cartModal').getByRole('heading', { name: 'Added!' })
First failure: First failing assertion/action at src/pages/CatalogPages.ts:138:30 (AI: HTTP 503 error on XHR request to https://automationexercise.com/add_to_cart/3 during retry 0 (E7).)
Classification: ENVIRONMENT_OR_NETWORK (60%) – AI differed from the rule-based baseline
Alternatives considered: TIMING_OR_FLAKINESS (0.70), TEST_SCRIPT_DEFECT (0.35)
Validate: Network logs confirm HTTP 503 response (E7) causing locator timeout for cart modal (E1); issue resolved transiently on retry 1 (E3). Trace (E4) and screenshot (E5) were captured.
Reproduce: npx playwright test tests/ui/cart.spec.ts:45 --project=ui
Recommended action: Investigate environment stability and endpoint load for automationexercise.com; handle transient 503 responses gracefully or verify server availability.
Owner: QA automation · Human approval required: yes
Hypothesis	Score	Evidence for	Evidence against	Rationale
ENVIRONMENT_OR_NETWORK	0.85	E7, E1	E3	The add_to_cart XHR request failed with HTTP 503 Service Unavailable in retry 0 (E7), which prevented the cart modal heading 'Added!' from appearing and resulted in the assertion timeout (E1).
TIMING_OR_FLAKINESS	0.70	E3	E7	The test failed on retry 0 and passed on retry 1 (E3), demonstrating transient behavior, but the root cause is explicitly identified as a server 503 error (E7).
TEST_SCRIPT_DEFECT	0.35	E11	E3, E7	Although cart.spec.ts was modified in this commit range (E11), the same test script passed on retry 1 (E3) and the failure was triggered by a 503 response from the application server (E7).
Evidence
Self-healing agent
Proposals only. Nothing is committed, pushed or merged. Every patch needs human review; an
ASSERTION_CHANGE needs extra care: confirm the new expectation is what the product should do.

Mode: rules + AI fallback (gemini / gemini-3.6-flash)

Scenario	Test	RCA	Decision	Kind	Reason
AE-12	AE-12 quantity set on product details is reflected and line total is calculated	TEST_SCRIPT_DEFECT 85%	🩹 proposed	ASSERTION_CHANGE	Fix arithmetic oracle calculation from multiplying by 3 to 4, matching the 4 units added and the assertion tag description.
AE-12	AE-12b unusual but site-accepted quantity (25) is calculated correctly	ENVIRONMENT_OR_NETWORK 60%	– declined	–	passed on retry (flaky): the same code passed, so there is no code defect to heal
AE-12 – ⚠️ ASSERTION_CHANGE (review the expectation itself)
Change: tests/ui/cart.spec.ts:41 (found by AI, checked against the page/source)
- expect(lines[0]?.total, tag('line total for 4 units = 4 x unit price')).toBe(added.unitPrice * 3);
+ expect(lines[0]?.total, tag('line total for 4 units = 4 x unit price')).toBe(added.unitPrice * 4);
Proof: type check passed, lint passed, isolated runs 3/3 green (npx playwright test tests/ui/cart.spec.ts:31 --project=ui --repeat-each=3 --retries=0 --workers=1 --reporter=line --output=reports/heal/validation/AE-12-1981448f)
Patch: reports/heal/patches/AE-12-1981448f.patch in the run artifact. Review, then on the branch: git apply reports/heal/patches/AE-12-1981448f.patch, commit and push.
```
