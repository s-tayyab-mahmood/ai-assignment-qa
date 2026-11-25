# FI-04 – red run 45618415023: locator drift, self-healing proposed the fix (pasted job summary)

```text
QA run – RCA summary
Item	Value
Commit	14b692f8e884 on fi-04-locator-drift
Run	https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/45618415023
Trigger	workflow_dispatch
Generated	2026-11-25T12:56:27.645Z
Analysis mode	ai-assisted (with deterministic baseline)
Tests	1 (passed 0, failed 1, flaky 0, skipped 0)
Duration	30.7 s

AE-18 – AE-18 customer can submit a product review
Symptom: Error: [AE-18|P1] review section offered expect(locator).toBeVisible() failed
First failure: tests/ui/ancillary.spec.ts:16
Classification: TEST_SCRIPT_DEFECT (60%) – AI differed from the rule-based baseline
Alternatives considered: LOCATOR_OR_UI_CHANGE (0.35), TIMING_OR_FLAKINESS (0.10)
Recommended action: Inspect the locator for reviewHeading in src/pages/CatalogPages.ts updated in the recent commit range and fix the role/name definition to match the actual review section element on the product details page.
Hypothesis	Score	Evidence for	Evidence against	Rationale
TEST_SCRIPT_DEFECT	0.75	E1, E3, E7, E12		The failure occurred due to a locator error looking for getByRole('link', { name: 'Write a Review' }) after changes were introduced to page objects in src/pages/CatalogPages.ts. Network requests were clean and the failure was deterministic across retries.
LOCATOR_OR_UI_CHANGE	0.35	E1, E7, E11	E12	The element was missing on the page, but because test code in src/pages/CatalogPages.ts was changed in this commit range, classification policy rules out LOCATOR_OR_UI_CHANGE in favor of TEST_SCRIPT_DEFECT.
TIMING_OR_FLAKINESS	0.10		E3	The failure is deterministic, failing consistently across both attempt 0 and attempt 1.

Self-healing agent
Mode: rules + AI fallback (gemini / gemini-3.6-flash)
Scenario	Test	RCA	Decision	Kind	Reason
AE-18	AE-18 customer can submit a product review	TEST_SCRIPT_DEFECT 60%	proposed	LOCATOR	closest link on the page: "Write Your Review" (similarity 0.63; next "Website for automation practice" 0.15)
AE-18 – LOCATOR
Change: src/pages/CatalogPages.ts:106 (found by rules, from the page snapshot)
- this.reviewHeading = page.getByRole('link', { name: 'Write a Review' });
+ this.reviewHeading = page.getByRole('link', { name: 'Write Your Review' });
Proof: type check passed, lint passed, isolated runs 3/3 green (npx playwright test tests/ui/ancillary.spec.ts:8 --project=ui --repeat-each=3 --retries=0 --workers=1 --reporter=line --output=reports/heal/validation/AE-18-4e7cd14a)
Patch: reports/heal/patches/AE-18-4e7cd14a.patch in the run artifact.
```
