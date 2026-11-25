# PR run 45610730824 – site overload mid-run; self-healing declined all 5 (pasted job summary)

```text
Site health check
Healthy after 1 attempt(s). Tests will run.

Policy: up to 1 attempt(s), 10 min apart, slow threshold 10000 ms, 2 requests per attempt.

Attempt	Time (UTC)	Probe	Status	Duration	Problem
1	2026-11-25T12:07:42.484Z	home page	200	1526 ms	ok
1	2026-11-25T12:07:42.484Z	products API	200	1502 ms	ok
QA run – RCA summary
Classifications are hypotheses pending human review. Confidence is a calibrated judgement, not proof.

Item	Value
Commit	7f63f331495a on feature/self-healing-agent
Run	https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/45610730824
Trigger	pull_request
Generated	2026-11-25T12:10:59.349Z
Analysis mode	deterministic (no AI_API_KEY – model-free fallback)
Tests	36 (passed 31, failed 2, flaky 3, skipped 0)
Pass rate	86%
Duration	160.7 s
Failures
Scenario	Test	Classification	Confidence	Business severity	Owner	Mode
AE-05	API-07 verifyLogin with valid credentials reports user exists	ENVIRONMENT_OR_NETWORK	90%	NONE	CI / infrastructure	deterministic
AE-02	AE-02 registered customer can log in and log out	ENVIRONMENT_OR_NETWORK	90%	NONE	CI / infrastructure	deterministic
AE-14	AE-14 guest cart is retained after logging in	ENVIRONMENT_OR_NETWORK	85%	NONE	CI / infrastructure	deterministic
AE-07	AE-07 search results equal the API search results for the same term	ENVIRONMENT_OR_NETWORK	85%	NONE	CI / infrastructure	deterministic
AE-17	AE-17 invoice for a logged-in customer downloads and states the correct total	ENVIRONMENT_OR_NETWORK	85%	NONE	CI / infrastructure	deterministic
AE-05 – API-07 verifyLogin with valid credentials reports user exists
Symptom: Error: API https://automationexercise.com/api/verifyLogin returned non-JSON (HTTP 503):
This website is under heavy load (queue full)
We're sorry, too many people are accessing this we at ../s

First failure: First failing assertion/action at src/api/client.ts:38:13. Shares error signature with 1 other failure(s) in this run ("Error: API returned non-JSON (HTTP #): <meta name='viewport' c…") – likely one common cause; triage once.
Classification: ENVIRONMENT_OR_NETWORK (90%)
Alternatives considered: TIMING_OR_FLAKINESS (0.70)
Validate: Re-run isolated: npx playwright test tests/api/users.spec.ts:6 --project=api --trace on; open trace; check: n/a
Reproduce: npx playwright test tests/api/users.spec.ts:6 --project=api
Recommended action: Check runner/network status and site availability; re-run once. No test change unless repeated and reproducible.
Owner: CI / infrastructure · Human approval required: yes
Hypothesis	Score	Evidence for	Evidence against	Rationale
ENVIRONMENT_OR_NETWORK	0.85	E1		The API answered with an HTTP 5xx error page (site overloaded or unavailable) instead of JSON. The contract was never exercised, so this is not evidence of an API change.
TIMING_OR_FLAKINESS	0.70	E3		Same code passed and failed across attempts: non-deterministic behaviour.
Evidence
AE-02 – AE-02 registered customer can log in and log out
Symptom: Error: API https://automationexercise.com/api/createAccount returned non-JSON (HTTP 503):
This website is under heavy load (queue full)
We're sorry, too many people are accessing this we at ..

First failure: First failing assertion/action at src/api/client.ts:38:13. Shares error signature with 1 other failure(s) in this run ("Error: API returned non-JSON (HTTP #): <meta name='viewport' c…") – likely one common cause; triage once.
Classification: ENVIRONMENT_OR_NETWORK (90%)
Alternatives considered: none matched
Validate: Re-run isolated: npx playwright test tests/ui/auth.spec.ts:43 --project=ui --trace on; open trace; check: n/a
Reproduce: npx playwright test tests/ui/auth.spec.ts:43 --project=ui
Recommended action: Check runner/network status and site availability; re-run once. No test change unless repeated and reproducible.
Owner: CI / infrastructure · Human approval required: yes
Hypothesis	Score	Evidence for	Evidence against	Rationale
ENVIRONMENT_OR_NETWORK	0.85	E7, E12, E5		The site returned an HTTP 5xx error page (HTTP 503 for /login) instead of the page under test. The shared public site was unavailable or overloaded; nothing about the test or the product's behaviour was exercised.
Evidence
AE-14 – AE-14 guest cart is retained after logging in
Symptom: Error: expect(locator).toBeVisible() failed Locator: getByText('Proceed To Checkout').or(getByText('Cart is empty!')).first()
First failure: First failing assertion/action at src/pages/OrderPages.ts:55:72
Classification: ENVIRONMENT_OR_NETWORK (85%)
Alternatives considered: TIMING_OR_FLAKINESS (0.70), LOCATOR_OR_UI_CHANGE (0.30)
Validate: Re-run isolated: npx playwright test tests/ui/cart.spec.ts:79 --project=ui --trace on; open trace; check: n/a
Reproduce: npx playwright test tests/ui/cart.spec.ts:79 --project=ui
Recommended action: Check runner/network status and site availability; re-run once. No test change unless repeated and reproducible.
Owner: CI / infrastructure · Human approval required: yes
Hypothesis	Score	Evidence for	Evidence against	Rationale
ENVIRONMENT_OR_NETWORK	0.85	E7, E5		The site returned an HTTP 5xx error page (document request) instead of the page under test. The shared public site was unavailable or overloaded; nothing about the test or the product's behaviour was exercised.
TIMING_OR_FLAKINESS	0.70	E3		Same code passed and failed across attempts: non-deterministic behaviour.
LOCATOR_OR_UI_CHANGE	0.30	E1, E5, E4	E7, E8	Element did not appear in time, but first-party requests failed during the test, which explains a missing UI response better than a page-structure change.
Evidence
AE-07 – AE-07 search results equal the API search results for the same term
Symptom: Error: expect(locator).toBeVisible() failed Locator: getByRole('heading', { name: 'Searched Products' })
First failure: First failing assertion/action at src/pages/CatalogPages.ts:43:40
Classification: ENVIRONMENT_OR_NETWORK (85%)
Alternatives considered: TIMING_OR_FLAKINESS (0.70), LOCATOR_OR_UI_CHANGE (0.30)
Validate: Re-run isolated: npx playwright test tests/ui/catalog.spec.ts:34 --project=ui --trace on; open trace; check: n/a
Reproduce: npx playwright test tests/ui/catalog.spec.ts:34 --project=ui
Recommended action: Check runner/network status and site availability; re-run once. No test change unless repeated and reproducible.
Owner: CI / infrastructure · Human approval required: yes
Hypothesis	Score	Evidence for	Evidence against	Rationale
ENVIRONMENT_OR_NETWORK	0.85	E7, E5		The site returned an HTTP 5xx error page (document request) instead of the page under test. The shared public site was unavailable or overloaded; nothing about the test or the product's behaviour was exercised.
TIMING_OR_FLAKINESS	0.70	E3		Same code passed and failed across attempts: non-deterministic behaviour.
LOCATOR_OR_UI_CHANGE	0.30	E1, E5, E4	E7, E8	Element did not appear in time, but first-party requests failed during the test, which explains a missing UI response better than a page-structure change.
Evidence
AE-17 – AE-17 invoice for a logged-in customer downloads and states the correct total
Symptom: Error: [AE-17|P1] logged-in banner shows account name expect(locator).toHaveText(expected) failed
First failure: First failing assertion/action at tests/support/flows.ts:14:83
Classification: ENVIRONMENT_OR_NETWORK (85%)
Alternatives considered: LOCATOR_OR_UI_CHANGE (0.30), TIMING_OR_FLAKINESS (0.30)
Validate: Re-run isolated: npx playwright test tests/ui/checkout.spec.ts:108 --project=ui --trace on; open trace; check: n/a
Reproduce: npx playwright test tests/ui/checkout.spec.ts:108 --project=ui
Recommended action: Check runner/network status and site availability; re-run once. No test change unless repeated and reproducible.
Owner: CI / infrastructure · Human approval required: yes
Hypothesis	Score	Evidence for	Evidence against	Rationale
ENVIRONMENT_OR_NETWORK	0.85	E7, E13, E5		The site returned an HTTP 5xx error page (HTTP 503 for /view_cart) instead of the page under test. The shared public site was unavailable or overloaded; nothing about the test or the product's behaviour was exercised.
LOCATOR_OR_UI_CHANGE	0.30	E1, E5, E4	E7, E8	Element did not appear in time, but first-party requests failed during the test, which explains a missing UI response better than a page-structure change.
TIMING_OR_FLAKINESS	0.30	E1, E3		Generic timeout; slow site or synchronization gap.
Evidence
Self-healing agent
Proposals only. Nothing is committed, pushed or merged. Every patch needs human review; an
ASSERTION_CHANGE needs extra care: confirm the new expectation is what the product should do.

Mode: rules only (no AI key – e.g. pull request)

Scenario	Test	RCA	Decision	Kind	Reason
AE-05	API-07 verifyLogin with valid credentials reports user exists	ENVIRONMENT_OR_NETWORK 90%	– declined	–	passed on retry (flaky): the same code passed, so there is no code defect to heal
AE-02	AE-02 registered customer can log in and log out	ENVIRONMENT_OR_NETWORK 90%	– declined	–	the site returned 5xx errors during the test: environment, not test code
AE-14	AE-14 guest cart is retained after logging in	ENVIRONMENT_OR_NETWORK 85%	– declined	–	passed on retry (flaky): the same code passed, so there is no code defect to heal
AE-07	AE-07 search results equal the API search results for the same term	ENVIRONMENT_OR_NETWORK 85%	– declined	–	passed on retry (flaky): the same code passed, so there is no code defect to heal
AE-17	AE-17 invoice for a logged-in customer downloads and states the correct total	ENVIRONMENT_OR_NETWORK 85%	– declined	–	the site returned 5xx errors during the test: environment, not test code
```
