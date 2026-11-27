# Self-healing agent – evidence (2026-11-25)

Agent: fix30 `016ce99` on branch `feature/self-healing-agent` (`tools/heal`, `skills/self-healing.md`).
The agent proposes; a human reviews and applies. Nothing below was committed by the agent.

## Summary
| # | Exercise / run | Failure | RCA | Agent decision | Human step | Result |
|---|---|---|---|---|---|---|
| 1 | PR run [45610730824](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/45610730824) (pull_request, rules only) | 5 tests hit HTTP 503 "heavy load" mid-run (2 failed, 3 flaky) | ENVIRONMENT_OR_NETWORK 85–90% ×5 | **Declined ×5** (3 flaky, 2 site 5xx) | None needed; re-run when the site recovered | Correct: nothing to heal |
| 2 | FI-04 locator drift: inject `14b692f`, red [45618415023](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/45618415023) | AE-18: `getByRole('link', { name: 'Write a Review' })` not found | TEST_SCRIPT_DEFECT 60% (AI; rules said LOCATOR_OR_UI_CHANGE) | **Proposed LOCATOR**, found by rules: "Write Your Review" (0.63 vs next 0.15); type check, lint, 3/3 green | Reviewed patch + screenshot, applied `1e8f289` | Green [45620168736](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/45620168736) |
| 3 | FI-01 wrong oracle: inject `94efbfe`, red [45621043105](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/45621043105) | AE-12: expected 1500 (× 3), received 2000 | TEST_SCRIPT_DEFECT 85% (AI agreed) | **Proposed ⚠️ ASSERTION_CHANGE** by AI: `× 3 → × 4`; guardrails passed; type check, lint, 3/3 green | Checked against the requirement (4 units = 4 × unit price), applied `bb940d7` | Green [45626489283](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/45626489283) |
| 3b | same run | AE-12b: HTTP 503 on `add_to_cart`, passed on retry | ENVIRONMENT_OR_NETWORK 60% (AI corrected the rules' TIMING_OR_FLAKINESS) | **Declined** (flaky) | Rejected the AI's "handle transient 503s gracefully" advice | Correct |
| 4 | FI-03 timing, local (`--repeat-each=6`) | Repeats 1, 3, 5 failed (delayed), 0, 2, 4 passed | TIMING_OR_FLAKINESS 65% ×3 | **Declined ×3**: runtime fault injection | None | Correct: no sleep, retry or timeout proposed |

**Totals:** 11 failures considered; 2 proposals, both validated before hand-over and both accepted by the reviewer; 9 declines, all correct; 0 unsafe heals.

Same day, run 45621043105 also exercised the health check's waiting path for the first time in CI: attempt 1 got the 503 overload page, the run waited 10 min, attempt 2 was healthy (271 ms / 135 ms) and the tests ran.

## Files
- `1-pr-site-overload-declined.md`, `2-fi-04-red-proposed.md`, `3-fi-01-red-assertion-change.md`: job summaries as shown in GitHub.
- `4-fi-03-local-rca-summary.md`, `4-fi-03-local-heal-summary.md`: local FI-03 reports.
- Branches `fi-04-locator-drift` and `fi-01-heal` are kept unmerged; each nets to zero change against the agent branch.

## What I concluded
The agent corrected only those errors that truly represented coding issues in the test. It validated its solutions by testing them against the live site successfully for all three attempts and presented them to me. All the other corrections it rejected with an explanation "six real 503 errors and three FI-03 timeouts". Not once did it suggest to retry or wait.
The only problem that needed my intervention was the ASSERTION_CHANGE. × 4 was correct since it corrected the calculation in the test itself and fulfilled the requirement. However, the agent did not simply use the 2000 that the live site provided. I verified that it was true based on “4 units = 4 × unit price”.
The AI contradicted the rule-based RCA twice, and both times it was correct, the page object change on FI-04, and 503 on AE-12b. It decreased the confidence to 60%, so I had the final say.

## Decision
Accept the agent for merge. All the fixes will have to be done manually by a person, the agent will not commit or push, and FI branches will remain unmerged. One point for improvement later: the criteria for relevance should also include changes to the page object definition if the broken locator is defined there.