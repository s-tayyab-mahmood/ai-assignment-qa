# Human approval decisions

Every AI-proposed change and every RCA classification used as evidence gets one row.

| Date | Change / PR / RCA record | AI suggestion | Decision (accept / modify / reject) | Reason | Reviewer |
|---|---|---|---|---|---|
| 2026-11-19 | Initial framework import (zip from the assistant) | Full scaffold, 36 tests, RCA tooling, docs | Accept, with fixes to follow | Reviewed the structure, ran verify and rca:selftest, ran the API tests; live runs found issues, fixed in fix1–fix7 | Tayyab |
| 2026-11-19 | fix1 `aa12bf0` | Timestamp-safe redaction; RCA rule for API request timeouts | Accept | Timestamps readable again; API-08 passed 3/3 on re-run | Tayyab |
| 2026-11-19 | fix2 `40e2226` | RCA: error-head matching, relevant-change filter, navigation-timeout rule; readiness-based page opening | Accept | The RCA no longer blames unrelated files; AE-12 passed 3/3 after the fix | Tayyab |
| 2026-11-19 | fix3 `ed9770e` | Detect site error pages (5xx) as ENVIRONMENT_OR_NETWORK | Accept | The 503 page is now classified as environment; same evidence re-analysed correctly | Tayyab |
| 2026-11-19 | RCA record AE-12b (site 503) | AI said TEST_SCRIPT_DEFECT 40% | Reject: ENVIRONMENT_OR_NETWORK | The screenshot shows the overload page; the cart was never reached | Tayyab |
| 2026-11-19 | fix4 `c871055` | Cleanup retries; server-held request → environment; cleanup = warning only | Accept | Cleanup no longer treated as a cause; retries reduce leftover test accounts | Tayyab |
| 2026-11-19 | fix5 `d128605` | Wait for DOMContentLoaded after click navigation; XHR log; no-effect-click rule | Accept | Next run showed add-to-cart requests sent and answered | Tayyab |
| 2026-11-19 | RCA record AE-15 (address `[]`) | AI said ENVIRONMENT_OR_NETWORK 50% | Reject: TEST_SCRIPT_DEFECT | Only one field empty and the others correct: read too early | Tayyab |
| 2026-11-19 | fix6 `97bebe5` | Checkout waits for full DOM before non-retrying reads; empty-value rule | Accept | Address step didn't fail again; self-test 16/16 | Tayyab |
| 2026-11-20 | RCA records AE-09 / AE-19 / AE-15 (full run) | LOCATOR_OR_UI_CHANGE / TEST_SCRIPT_DEFECT (wrong reason) / TIMING_OR_FLAKINESS | AE-09: reject → TEST_SCRIPT_DEFECT; AE-19: category accepted, reason rejected; AE-15: reject → ENVIRONMENT_OR_NETWORK | See full-run note | Tayyab |
| 2026-11-20 | fix7 `a82d305` | AE-19 open page first; AE-09 whole-word match; RCA final-URL and test-timeout rules | Accept | All three tests passed after the fix | Tayyab |
| 2026-11-20 | fix7: `test.slow()` for AE-15 only | Triple AE-15's test budget (60 s → 180 s); evidence: passing runs 34–52 s, timeout at 60 s with /payment still loading | Accept | Passing runs took 34–52 s against a 60 s limit; it's the longest end-to-end journey; applies to this test only; step waits unchanged | Tayyab |
| 2026-11-21 | RCA record FI-02 (network fault) | ENVIRONMENT_OR_NETWORK 75%, flagged as fault injection | Accept | Test-controlled abort, correct network evidence (E7), no product-defect claim; four report-detail issues found and fixed in fix11 | Tayyab |
| 2026-11-21 | fix11 `5c7b334` | XHR log only completed requests; locator alternative lowered with correct rationale; exercise-specific action/owner; FI evidence citation | Accept | Re-run of FI-02 shows the corrected report; self-test 19/19 | Tayyab |
| 2026-11-21 | fix13 `8edaf00` + git config | Commit attribution note; repo-local git identity replaced | Accept | My evidence(s) & some commits showed the assistant as author due to the starter zip's .git/config; documented instead of rewriting history so evidence commit IDs stay valid | Tayyab |