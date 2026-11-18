# Quality scorecard

Every value must come from a real artifact (a CI run, a stability summary or an RCA report). Link the source in the last column. Empty cells mean "not yet measured", never "assumed".

| Metric | Definition | How measured | Value | Source |
|---|---|---|---|---|
| Execution pass rate | passed / executed (excludes skipped) | `rca-summary.md` "Pass rate" | | |
| Flaky / retry rate | tests passing only on retry / executed | JSON stats `flaky` | | |
| Smoke stability | green runs / 3 consecutive | `reports/stability/stability-summary.md` | | |
| Suite duration | wall-clock of the Run Playwright step | CI log / JSON `stats.duration` | | |
| RCA accuracy on known injections | correct classifications / injected faults (FI-01, FI-02, FI-03) | FI docs | | |
| RCA accuracy on labelled synthetic cases | `npm run rca:selftest` | CI static gates log | 9/9 (synthetic; not live evidence) | `tools/rca/selftest.ts` |
| Time to triage | failure detected → human classification recorded | timestamps in approvals.md | | |
| AI agreement with baseline | AI agreed / AI-analysed failures | `rca-report.json` `ai.agreed_with_deterministic` | | |
| AI rejections | rejected outputs / AI calls | `audit-log.jsonl` | | |
| AI cost / latency | tokens and ms per failure | `audit-log.jsonl` | | |
| Maintenance effort | hours spent fixing tests (not product) per week | engineer log | | |
| Cleanup success | accounts deleted / accounts created | `cleanup-log` attachments | | |

## Rubric self-assessment (fill before submission, with evidence links)
| Dimension | Max | Self-score | Evidence link |
|---|---|---|---|
| Risk-based test design / traceability | 12 | | docs/test-strategy.md, docs/traceability.md |
| Playwright architecture / code quality | 15 | | src/, skills/playwright.md |
| UI & API coverage / data integrity | 14 | | CI run |
| AI task decomposition and agent design | 15 | | agents/orchestrator.md, skills/ |
| AI RCA and failure classification | 18 | | FI-01/02 docs, rca reports |
| CI/CD and report automation | 10 | | workflow runs |
| Reliability, security and governance | 10 | | stability summary, ai-policy.md |
| Communication, metrics and live defense | 6 | | — |
