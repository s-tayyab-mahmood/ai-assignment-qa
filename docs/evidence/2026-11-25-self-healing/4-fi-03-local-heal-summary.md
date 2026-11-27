## Self-healing agent

_Proposals only. Nothing is committed, pushed or merged. Every patch needs human review; an
ASSERTION_CHANGE needs extra care: confirm the new expectation is what the product should do._

Mode: rules only (no AI key – e.g. pull request)

| Scenario | Test | RCA | Decision | Kind | Reason |
|---|---|---|---|---|---|
| AE-11 | FI-03 add-to-cart response intermittently delayed by test-controlled interception | TIMING_OR_FLAKINESS 65% | – declined | – | runtime fault injection (FI-03): the fault is in the test harness on purpose, not in test code |
| AE-11 | FI-03 add-to-cart response intermittently delayed by test-controlled interception | TIMING_OR_FLAKINESS 65% | – declined | – | runtime fault injection (FI-03): the fault is in the test harness on purpose, not in test code |
| AE-11 | FI-03 add-to-cart response intermittently delayed by test-controlled interception | TIMING_OR_FLAKINESS 65% | – declined | – | runtime fault injection (FI-03): the fault is in the test harness on purpose, not in test code |
