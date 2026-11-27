# Scheduled run on main – AI provider outage handled safely (2026-11-26)

- **Run:** https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/45768302331 (schedule, commit `8e8ec3f`)
- **Due / started:** due 00:00 UTC (05:00 PKT); the health check ran at 06:27 UTC (11:27 PKT) – GitHub delayed the scheduled run by about 6.5 h.
- **Result:** green – 36 tests, 34 passed, 2 flaky, 0 failed (94.8 s).

## What happened
- AE-07 and AE-24b got HTTP 503 "heavy load" from the site's API and passed on retry. Rules: ENVIRONMENT_OR_NETWORK 90% – correct.
- The AI provider was also overloaded: one Gemini call returned its own HTTP 503 ("model is currently experiencing high demand"), the other timed out. Both records fell back to the rule-based result and say so (`ai-rejected-fallback`).

## What I concluded
The pipeline does not depend on the AI being available. When Gemini failed, the run still gave a correct rule-based diagnosis, clearly labelled as a fallback, and the test result was not affected. The 6.5-hour delay came from GitHub, not from our setup. I kept the 05:00 schedule the brief asks for and documented the delay as a limitation.

## Decision
Accept both classifications (environment). No change to the tests or to the AI fallback.
