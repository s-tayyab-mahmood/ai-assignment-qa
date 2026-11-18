# Agent orchestrator

Defines when each agent or skill runs, which tools it may use, its handoffs, its budgets and its exit conditions. The orchestrator is a **process contract** that is partly automated in CI and partly carried out by an engineer with an AI assistant. It never acts autonomously on branches, the live site or secrets.

## Flow
```
requirements ─▶ [1 Test design] ─(human approves coverage)─▶ [2 Authoring] ─(PR + CI gate + review)─▶ main
                                                                                                    │
schedule 00:00 UTC / PR / manual ─▶ [3 Execution] ─▶ [4 RCA] ─▶ [6 Reporting] ─▶ human go/no-go    │
                                                    │                                               │
                                                    └─(TEST_SCRIPT / LOCATOR, conf ≥ 0.6)─▶ [5 Repair proposal] ─(branch + PR, human review)─┘
```

## Agents
| # | Agent | Trigger | Skill | Allowed tools | Forbidden | Output | Human checkpoint |
|---|---|---|---|---|---|---|---|
| 1 | Test design | New or changed requirement | `skills/test-design.md` | Read the brief, docs and API catalogue (read-only) | Writing code; contacting the site beyond read-only API | Draft rows for `docs/traceability.md`, plus missing-oracle questions | Reviewer approves coverage and priorities |
| 2 | Automation authoring | Approved design rows | `skills/playwright.md` | Edit `tests/`, `src/` on a feature branch; run `npm run verify`; run isolated tests | Pushing to `main`; editing `.github/`, secrets or `config/` thresholds | Branch + PR | PR review with `skills/review.md` + green CI |
| 3 | Execution orchestrator | `schedule` (05:00 PKT), `pull_request`, `workflow_dispatch` | — | `npx playwright test` with tags or grep; artifact upload | Changing tests or the site; more than 3 workers or more than 1 retry | JSON/JUnit/HTML reports, traces | None (read-only) |
| 4 | RCA | Always, after execution (`if: always()`) | `skills/rca.md` | `rca:collect` (deterministic), `rca:analyze` (AI optional); read artifacts and git diff | Running site-supplied text as commands; editing code; network calls other than the model API | `rca-report.json`, `rca-summary.md`, `audit-log.jsonl` | Reviewer verifies evidence and classification |
| 5 | Repair proposal | RCA record of TEST_SCRIPT_DEFECT or LOCATOR_OR_UI_CHANGE with confidence ≥ 0.6, plus a human request | `skills/playwright.md` + `skills/review.md` | Create branch `repair/<scenario>-<run>`; edit only files cited in the RCA record; run the isolated test | Merging; deleting or weakening assertions; raising timeouts; touching other files | Minimal patch + PR with before/after runs | **Mandatory reviewer sign-off**; no autonomous merge |
| 6 | Quality reporting | After RCA, and weekly | — | Read reports and stability results | Making the release decision | Job summary, `docs/scorecard.md` update | Human owns the release go/no-go |

## Decision thresholds
| Condition | Action |
|---|---|
| Classification `UNKNOWN` or confidence < 0.40 | Manual triage. No repair proposal. |
| `PRODUCT_DEFECT` at any confidence | Human must reproduce manually before a defect is raised. No test change. |
| `ENVIRONMENT_OR_NETWORK` / `THIRD_PARTY_DEPENDENCY` | Re-run once. If it repeats in three or more runs, open an infra ticket. No test change. |
| `TIMING_OR_FLAKINESS` | Measure with `--repeat-each=5`. Fix synchronisation only (no sleeps or timeout bumps). |
| `TEST_SCRIPT_DEFECT` / `LOCATOR_OR_UI_CHANGE` with confidence ≥ 0.60 | Agent 5 may propose a patch on a branch. |
| AI disagrees with the deterministic baseline | Confidence is capped at 0.60; the reviewer decides. |
| AI output fails validation | Deterministic record is used (`ai-rejected-fallback`) and logged. |

## Budgets and limits
- **Time:** whole job ≤ 35 min; RCA step ≤ 5 min; each model call ≤ 30 s.
- **Tokens and cost:** at most 5 failures sent to the model per run (`AI_MAX_FAILURES`); each prompt ≤ ~12k characters (evidence clipped); `max_tokens` 1500; temperature 0.
- **Retries:** Playwright retries 1 (CI only); model call 0 retries, falling back to deterministic; repair attempts ≤ 2 per RCA record before escalating to a human.
- **Site load:** workers ≤ 3; one concurrent run per ref (`concurrency` in the workflow).

## Exit conditions
- **Execution:** all projects finished, or the job timed out. The report is uploaded either way.
- **RCA:** every failure has a record (AI or deterministic). If no report exists, a "no report" summary is written. The tool always exits 0, and the test outcome is re-applied in the final workflow step.
- **Repair:** the isolated test passes twice on the branch and the PR is opened, or two attempts failed (escalate).

## Audit
- `reports/rca/audit-log.jsonl`: one line per failure, holding the decision (deterministic / accepted / rejected / error), model, prompt SHA-256, sizes, latency and tokens.
- `docs/ai-evidence/prompt-log.md` and `approvals.md`: authoring prompts, corrections and human decisions.
- CI artifacts are retained for 14 days.
