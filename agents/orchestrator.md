# Agent orchestrator

Defines when each agent or skill runs, which tools it may use, its handoffs, its budgets and its exit conditions. The orchestrator is a **process contract** that is partly automated in CI and partly carried out by an engineer with an AI assistant. It never acts autonomously on branches, the live site or secrets.

## Flow
```
requirements ─▶ [1 Test design] ─(human approves coverage)─▶ [2 Authoring] ─(PR + CI gate + review)─▶ main
                                                                                                    │
schedule 00:00 UTC / PR / manual ─▶ [3 Execution] ─▶ [4 RCA] ─▶ [6 Reporting] ─▶ human go/no-go    │
                                                    │                                               │
                                                    └─(TEST_SCRIPT / LOCATOR, conf ≥ 0.5)─▶ [5 Self-healing] ─(validated patch → human applies on branch + PR review)─┘
```

## Agents
| # | Agent | Trigger | Skill | Allowed tools | Forbidden | Output | Human checkpoint |
|---|---|---|---|---|---|---|---|
| 1 | Test design | New or changed requirement | `skills/test-design.md` | Read the brief, docs and API catalogue (read-only) | Writing code; contacting the site beyond read-only API | Draft rows for `docs/traceability.md`, plus missing-oracle questions | Reviewer approves coverage and priorities |
| 2 | Automation authoring | Approved design rows | `skills/playwright.md` | Edit `tests/`, `src/` on a feature branch; run `npm run verify`; run isolated tests | Pushing to `main`; editing `.github/`, secrets or `config/` thresholds | Branch + PR | PR review with `skills/review.md` + green CI |
| 3 | Execution orchestrator | `schedule` (05:00 PKT), `pull_request`, `workflow_dispatch` | — | `npx playwright test` with tags or grep; artifact upload | Changing tests or the site; more than 3 workers or more than 1 retry | JSON/JUnit/HTML reports, traces | None (read-only) |
| 4 | RCA | Always, after execution (`if: always()`) | `skills/rca.md` | `rca:collect` (deterministic), `rca:analyze` (AI optional); read artifacts and git diff | Running site-supplied text as commands; editing code; network calls other than the model API | `rca-report.json`, `rca-summary.md`, `audit-log.jsonl` | Reviewer verifies evidence and classification |
| 5 | Self-healing (`tools/heal`, automated in CI since fix30) | A failed run: CI step after RCA, or `npm run heal` locally | `skills/self-healing.md` + `skills/review.md` | Read the RCA report, failure bundle and page snapshot; edit **one line** of `src/pages/` or `tests/` in a working copy; run type check, lint and the failing test 3× in isolation; write a patch | Committing, pushing or merging; sleeps, retries, longer timeouts, skips; removing, inverting or weakening assertions; copying observed values into expectations; healing PRODUCT_DEFECT, environment, timing, data or injected faults; leaving a modified file behind | Validated patch in `reports/heal/patches/`, `heal-summary.md` (job summary), `heal-report.json`, `audit-log.jsonl` | **Mandatory reviewer sign-off**: the human applies the patch on a branch, opens the PR and merges |
| 6 | Quality reporting | After RCA, and weekly | — | Read reports and stability results | Making the release decision | Job summary, `docs/scorecard.md` update | Human owns the release go/no-go |

## Decision thresholds
| Condition | Action |
|---|---|
| Classification `UNKNOWN` or confidence < 0.40 | Manual triage. No repair proposal. |
| `PRODUCT_DEFECT` at any confidence | Human must reproduce manually before a defect is raised. No test change. |
| `ENVIRONMENT_OR_NETWORK` / `THIRD_PARTY_DEPENDENCY` | Re-run once. If it repeats in three or more runs, open an infra ticket. No test change. |
| `TIMING_OR_FLAKINESS` | Measure with `--repeat-each=5`. Fix synchronisation only (no sleeps or timeout bumps). |
| `TEST_SCRIPT_DEFECT` / `LOCATOR_OR_UI_CHANGE` with confidence ≥ 0.50, no PRODUCT_DEFECT alternative ≥ 0.50, not flaky, no 5xx, not an injected runtime fault | Agent 5 may propose a patch. It is proposed only if type check, lint and 3/3 isolated runs pass (the proof matters more than the classifier's confidence). A value change is labelled ASSERTION_CHANGE and needs extra review. |
| AI disagrees with the deterministic baseline | Confidence is capped at 0.60; the reviewer decides. |
| AI output fails validation | Deterministic record is used (`ai-rejected-fallback`) and logged. |

## Budgets and limits
- **Time:** whole job ≤ 80 min (health-check waiting ≤ ~30 min); RCA step ≤ 5 min; self-healing step ≤ 20 min; each model call ≤ 30 s by default (`AI_TIMEOUT_MS`, capped at 60 s).
- **Tokens and cost:** at most 5 failures sent to the model per run (`AI_MAX_FAILURES`); each prompt ≤ ~12k characters (evidence clipped); `max_tokens` 1500; temperature 0.
- **Retries:** Playwright retries 1 (CI only); model call 0 retries, falling back to deterministic; self-healing ≤ 3 attempts per run (`HEAL_MAX_ATTEMPTS`, max 5), one model call and one validation (3 repetitions, 1 worker, no retries) per attempt; otherwise escalate to a human.
- **Site load:** workers ≤ 3; one concurrent run per ref (`concurrency` in the workflow).

## Exit conditions
- **Execution:** all projects finished, or the job timed out. The report is uploaded either way.
- **RCA:** every failure has a record (AI or deterministic). If no report exists, a "no report" summary is written. The tool always exits 0, and the test outcome is re-applied in the final workflow step.
- **Self-healing:** every failure has a heal result (proposed / rejected / declined / no-fix-found); source files are restored; the tool always exits 0 and never changes the run's result. A proposal becomes code only when a human applies it, the branch CI is green and the PR is reviewed.

## Audit
- `reports/heal/audit-log.jsonl`: every self-healing policy decision, model call (prompt SHA-256, latency) and validation result.
- `reports/rca/audit-log.jsonl`: one line per failure, holding the decision (deterministic / accepted / rejected / error), model, prompt SHA-256, sizes, latency and tokens.
- `docs/ai-evidence/prompt-log.md` and `approvals.md`: authoring prompts, corrections and human decisions.
- CI artifacts are retained for 14 days.
