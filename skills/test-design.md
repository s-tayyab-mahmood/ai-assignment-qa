# Skill: Test design

**Used by:** the test design agent. Its output is approved by a human reviewer before it is automated.

## Inputs
1. Requirements: the scenario catalogue in the assignment brief (AE-01 … AE-24), including the detailed flagship journey.
2. The risk model: `docs/test-strategy.md` §3 (impact × likelihood).
3. Reference mappings: the site's 26 published UI test cases (TC1–TC26) and 14 API cases (API1–API14). These are **references, not scripts to copy**.
4. Observed site behaviour, recorded as `observation` annotations from previous runs.

## Procedure
1. For each requirement, state the **business risk** in one sentence (what breaks for whom).
2. Assign a priority:
   - **P0**: money, identity or order integrity
   - **P1**: a core feature that has a workaround
   - **P2**: convenience or marketing
3. Derive cases:
   - the happy path
   - at least one negative case per P0/P1 input
   - boundaries for numeric and free-text inputs, **only where the site defines a rule**
4. Define an **oracle** for every expected outcome, taken from this list:
   - computed (arithmetic)
   - cross-layer (UI vs API)
   - fixture (what we entered)
   - documented message (exact text)
   - observation (no oracle; record only)
5. Choose the lowest layer that proves the risk: API for contracts and data, UI for user-visible journeys, integration for consistency.
6. Map each case to its trace ID and any reference TC/API IDs.
7. List **missing-oracle questions**: behaviours where expected results are not defined.

## Output format
For each case:
```
ID | Priority | Feature | Steps | Test data | Expected outcome + oracle type | Layer | Source mapping | Open questions
```

## Current missing-oracle questions (for reviewer)
- Blank search term: should it list all products, show none, or be rejected? (AE-08b records what happens.)
- Maximum cart quantity: there is no documented limit. Quantity 25 is tested as an accepted value; no upper-bound validation is assumed.
- Invoice format: a plain-text file. We validate the customer name and total only; no tax or line-item breakdown is defined.
- Cart behaviour when the same product is added twice (accumulates vs replaces): not specified, so not asserted.
- Contact-form upload limits (size and type): not documented, so only a small .txt file is used.

## Quality bar
- Reject cases whose only assertion is "page/element visible" for P0 journeys.
- Reject cases that depend on another test's state.
- Reject boundaries invented without a site rule ("should reject 1000 items").
