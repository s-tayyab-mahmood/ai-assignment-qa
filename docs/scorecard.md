# Quality scorecard

Every value comes from a linked artifact. "Not measured" means not measured – nothing is estimated.
Drafted 2026-11-21 from the evidence in this repository; reviewed by: ✍️ Tayyab, ✍️ date.

## Execution and reliability
| Metric | Value | Source |
|---|---|---|
| Pass rate – CI, fixed code (full suite, 36 tests) | **100%** (all passed) | [run 44794834130](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/44794834130), 2026-11-20 |
| Pass rate – first scheduled CI run (before fix7) | 94% (34/36); both failures were test defects later fixed in fix7 | [run 44680539790](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/44680539790) |
| Pass rate – first full local run (before fix7) | 92% (33/36) | `docs/evidence/2026-11-20-full-run/` |
| Smoke stability | **3/3 consecutive runs green, 27/27 tests, 0 flaky** (65–68 s per run, no retries) | `docs/evidence/stability-3-runs/` |
| Flaky rate (passed only on retry) | 0 in all recorded CI runs | CI runs above (flaky = 0) |
| Suite duration – CI (2 workers) | 54–74 s for 36 tests | runs 44805726674 (54 s), 44804837080 (61 s), 44680539790 (74 s) |
| Suite duration – local (1 worker, slow site) | 453 s for 36 tests | `docs/evidence/2026-11-20-full-run/rca-full-run.md` |
| Scheduled trigger | Fired; due 00:00 UTC, started ~05:20 UTC (GitHub delay, documented) | run 44680539790 |

## Fault injection and RCA accuracy
| Metric | Value | Source |
|---|---|---|
| RCA accuracy on known injections | **2/2 correct** – FI-01 TEST_SCRIPT_DEFECT 75%; FI-02 ENVIRONMENT_OR_NETWORK 75% (test-controlled) | `docs/fault-injection/FI-01.md`, `FI-02.md` |
| False product-defect claims on injections | 0 | same |
| Human-reviewed patch validation | FI-01: red [44804837080] → 1-line repair → green [44805726674] on the same PR | `FI-01.md` |
| Classifier regression suite | 19/19 labelled cases (synthetic, includes 8 shaped on real failures) | `npm run rca:selftest` (CI static gate) |

### RCA on real (non-injected) failures – first verdict vs. human-reviewed verdict
| Failure | RCA first verdict | Human-reviewed verdict | First verdict correct? |
|---|---|---|---|
| API-08 request timeout (19 Nov) | no rule (would be UNKNOWN) | ENVIRONMENT_OR_NETWORK (passed 3/3 on re-run) | ✗ |
| AE-12 page-load timeout (19 Nov) | TEST_SCRIPT_DEFECT 40% | ENVIRONMENT_OR_NETWORK | ✗ |
| AE-12b site 503 page (19 Nov) | TEST_SCRIPT_DEFECT 40% | ENVIRONMENT_OR_NETWORK | ✗ |
| AE-15 ×3, server held requests (19 Nov) | TIMING_OR_FLAKINESS (+ cleanup as cause) | ENVIRONMENT_OR_NETWORK | ✗ (partly) |
| AE-11 add_to_cart pending 10.1 s (19 Nov) | ENVIRONMENT_OR_NETWORK 75% | ENVIRONMENT_OR_NETWORK | ✓ |
| AE-15 click before page ready (19 Nov) | LOCATOR_OR_UI_CHANGE 45% | TEST_SCRIPT_DEFECT | ✗ |
| AE-15 address read before render (19 Nov) | ENVIRONMENT_OR_NETWORK 50% | TEST_SCRIPT_DEFECT | ✗ |
| AE-15 search page slow (19 Nov) | ENVIRONMENT_OR_NETWORK 70% | ENVIRONMENT_OR_NETWORK | ✓ |
| AE-19 test never opened a page (20 Nov) | TEST_SCRIPT_DEFECT 45%, wrong reason | TEST_SCRIPT_DEFECT | ✓ category / ✗ reason |
| AE-09 "Men" matched "Women" (20 Nov) | LOCATOR_OR_UI_CHANGE 45% | TEST_SCRIPT_DEFECT | ✗ |
| AE-15 60 s budget exceeded (20 Nov) | TIMING_OR_FLAKINESS 55% | ENVIRONMENT_OR_NETWORK | ✗ |

**First-verdict accuracy on real failures: 3/11** (2 fully, 1 category only). Every misclassification was caught
in human review, corrected with evidence, turned into a rule plus a regression case, and – where the
results were still available – re-analysed correctly (`rca-after-fix.md` files). This is the main
finding of the RCA work: the deterministic baseline needs human review; it is not trusted on its own.

## AI usage
| Metric | Value | Source |
|---|---|---|
| AI model in the RCA pipeline | ✍️ Not yet exercised with a model: all recorded RCA runs used the deterministic fallback (no `AI_API_KEY`). | `rca-summary.md` "Analysis mode" |
| AI agreement with baseline / rejections | Not measured (no AI-mode runs yet) | `reports/rca/audit-log.jsonl` |
| AI cost / latency per failure | Not measured (no AI-mode runs yet) | `audit-log.jsonl` |
| AI-assisted authoring | Claude (chat) drafted code/docs; 11 patches; every one reviewed, run and recorded | `docs/ai-evidence/approvals.md` |
| Engineer corrections of AI output | 8 recorded (B1–B8) + FI-01/FI-02 report findings | `docs/ai-evidence/prompt-log.md` |

## Maintenance and data hygiene
| Metric | Value | Source |
|---|---|---|
| Test-code defects found by live runs | 5 (AE-15 click-before-ready, AE-15 address read, AE-19 no navigation, AE-09 ambiguous locator, AE-15 budget) | evidence notes |
| Maintenance effort | ✍️ hours spent on test fixes and triage (19–21 Nov) | engineer log |
| Time to triage | Not instrumented. Typical cycle in this session: run → RCA → evidence review → decision in ~5–15 min per failure | session evidence timestamps |
| Cleanup success | All recorded cleanups `deleted` or `already_deleted` except one timeout on 19 Nov before fix4 (account `QA aelocal84f10c437e` may remain on the site); retries added in fix4 | `cleanup-log` attachments, `rca-summary` E11 (19 Nov) |

## Rubric self-assessment (fill before submission)
| Dimension | Max | Self-score | Evidence link |
|---|---|---|---|
| Risk-based test design / traceability | 12 | ✍️ | `docs/test-strategy.md`, `docs/traceability.md` |
| Playwright architecture / code quality | 15 | ✍️ | `src/`, `skills/playwright.md` |
| UI & API coverage / data integrity | 14 | ✍️ | CI run 44794834130 |
| AI task decomposition and agent design | 15 | ✍️ | `agents/orchestrator.md`, `skills/` |
| AI RCA and failure classification | 18 | ✍️ | FI-01/FI-02 reports, table above |
| CI/CD and report automation | 10 | ✍️ | runs 44680539790, 44794834130, 44804837080, 44805726674 |
| Reliability, security and governance | 10 | ✍️ | stability evidence, `docs/ai-policy.md` |
| Communication, metrics and live defense | 6 | ✍️ | – |
