# Quality scorecard

Every value comes from a linked artifact. "Not measured" means not measured – nothing is estimated.
Drafted 2026-11-21 from the evidence in this repository; reviewed by: Tayyab, 2026-11-22; updated 2026-11-25 (health-check run 45603876542).

## Execution and reliability
| Metric | Value | Source |
|---|---|---|
| Pass rate – CI, fixed code (full suite, 36 tests) | **100%** (all passed) | [run 44794834130](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/44794834130), 2026-11-20 |
| Pass rate – first scheduled CI run (before fix7) | 94% (34/36); both failures were test defects later fixed in fix7 | [run 44680539790](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/44680539790) |
| Pass rate – first full local run (before fix7) | 92% (33/36) | `docs/evidence/2026-11-20-full-run/` |
| Smoke stability | **3/3 consecutive runs green, 27/27 tests, 0 flaky** (65–68 s per run, no retries) | `docs/evidence/stability-3-runs/` |
| Flaky rate (passed only on retry) | 1 in all recorded CI runs: AE-02 in run 45603876542 (HTTP 503 on `/logout` mid-run, passed on retry in 3.8 s; classified environment) | [run 45603876542](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/45603876542), `docs/evidence/2026-11-25-health-check-first-run/` |
| Suite duration – CI (2 workers) | 54–74 s for 36 tests | runs 44805726674 (54 s), 45603876542 (57 s), 44804837080 (61 s), 44680539790 (74 s) |
| Suite duration – local (1 worker, slow site) | 453 s for 36 tests | `docs/evidence/2026-11-20-full-run/rca-full-run.md` |
| Site health check (fix28) | First CI run: healthy on attempt 1 (home page 215 ms, products API 430 ms); tests started without waiting. Waiting path covered by offline self-test (9/9), not yet seen in CI | run 45603876542, `tools/health/` |
| Scheduled trigger | Fired; due 00:00 UTC, started ~05:20 UTC (GitHub delay, documented) | run 44680539790 |

## Fault injection and RCA accuracy
| Metric | Value | Source |
|---|---|---|
| RCA accuracy on known injections | **2/2 correct** – FI-01 TEST_SCRIPT_DEFECT 75%; FI-02 ENVIRONMENT_OR_NETWORK 75% (test-controlled) | `docs/fault-injection/FI-01.md`, `FI-02.md` |
| False product-defect claims on injections | 0 | same |
| Human-reviewed patch validation | FI-01: red [44804837080] → 1-line repair → green [44805726674] on the same PR | `FI-01.md` |
| Classifier regression suite | 23/23 labelled cases (synthetic, includes 11 shaped on real failures) | `npm run rca:selftest` (CI static gate) |

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
| AE-02 503 on /login (23 Nov, scheduled) | ENVIRONMENT_OR_NETWORK 85% | ENVIRONMENT_OR_NETWORK | ✓ |
| AE-12 503 on /products (23 Nov, scheduled) | ENVIRONMENT_OR_NETWORK 90% | ENVIRONMENT_OR_NETWORK | ✓ |
| AE-12b 503 on /products (23 Nov, scheduled) | ENVIRONMENT_OR_NETWORK 90% | ENVIRONMENT_OR_NETWORK | ✓ |
| AE-17 503 on /payment (23 Nov, scheduled) | ENVIRONMENT_OR_NETWORK 85% | ENVIRONMENT_OR_NETWORK | ✓ |
| AE-10 API answered 503 page (23 Nov, scheduled) | TIMING_OR_FLAKINESS 60% (PRODUCT_DEFECT 0.55 runner-up) | ENVIRONMENT_OR_NETWORK | ✗ |
| 9 failures on 503 pages/API (23 Nov, manual run 45139042427: AE-22, AE-18, AE-21, AE-02, AE-03b, AE-12, AE-08, AE-15, AE-17) | ENVIRONMENT_OR_NETWORK 85–90% | ENVIRONMENT_OR_NETWORK | ✓ ×9 |
| AE-10 API 503 before first navigation (23 Nov, manual) | TEST_SCRIPT_DEFECT 75% ("about:blank") | ENVIRONMENT_OR_NETWORK | ✗ |
| AE-16 many first-party 503s (23 Nov, manual) | TIMING_OR_FLAKINESS 70% | ENVIRONMENT_OR_NETWORK | ✗ |
| AE-02 503 on /logout mid-run (25 Nov, manual 45603876542, after a healthy pre-run check) | ENVIRONMENT_OR_NETWORK (85% with AI agreement) | ENVIRONMENT_OR_NETWORK | ✓ |

**First-verdict accuracy on real failures: 17/28** (16 fully, 1 category only). The trend improved as
corrections became rules: 3/11 in the first live runs (19–20 Nov) vs 4/5 and 9/11 on the two
overloaded-site runs (23 Nov) and 1/1 on 25 Nov. Every misclassification was caught in human review, corrected with
evidence, turned into a rule plus a regression case (self-test 23/23), and – where the results were
still available – re-analysed correctly. The rule-based baseline still needs human review; it is not
trusted on its own.

## AI usage
| Metric | Value | Source |
|---|---|---|
| AI model in the RCA pipeline | Google Gemini free tier (`gemini-3.6-flash` via repo variable `AI_MODEL`); Anthropic optional. GitHub Models tried – service retired | `docs/ai-evidence/ai-rca-runs.md` |
| AI-mode runs | 7 runs / 17 analyses: 10 accepted, 7 safe fallbacks (no credit, retired endpoint, 2× HTTP 503, 1× timeout, 2× truncated reply) – none hid the test result | `ai-rca-runs.md`, `docs/evidence/2026-11-23-*` |
| AI agreement with baseline | 10/10 accepted analyses agreed (FI-01 TEST_SCRIPT_DEFECT 0.75 → 0.85; 8 ENVIRONMENT_OR_NETWORK on the two overload runs; 1 ENVIRONMENT_OR_NETWORK on 25 Nov) | runs 44944370864, 45116848024, 45139042427, 45603876542 |
| AI suggestions rejected by reviewer | 3 – "add retry mechanisms / backoff" (AE-12b, AE-21, AE-22, 23 Nov): CI already retries once; more retries would hide flakiness and load the shared site | `approvals.md` |
| AI rejections by guardrail | 0 – all non-accepted outcomes were call failures (2 truncated replies fixed in fix21), not invalid answers | audit logs in `docs/evidence/2026-11-2*-*` |
| AI cost / latency per failure | $0 (free tier); 8.6 s; 2,769 input / 289 output tokens | `docs/evidence/2026-11-22-ai-rca-gemini-accepted/audit-log.jsonl` |
| AI-assisted authoring | Claude (chat) drafted code/docs; 28 patches; every one reviewed, run and recorded | `docs/ai-evidence/approvals.md` |
| Engineer corrections of AI output | 8 recorded (B1–B8) + FI-01/FI-02 report findings + AI-run findings (merge-diff false CRITICAL, outcome wording, vague location, overstated "inspected the diff") | `prompt-log.md`, `ai-rca-runs.md` |

## Maintenance and data hygiene
| Metric | Value | Source |
|---|---|---|
| Test-code defects found by live runs | 5 (AE-15 click-before-ready, AE-15 address read, AE-19 no navigation, AE-09 ambiguous locator, AE-15 budget) | evidence notes |
| Maintenance effort | 6 hours spent on test fixes and triage (19–22 Nov) | engineer log |
| Time to triage | Not instrumented. Typical cycle in this session: run → RCA → evidence review → decision in ~5–15 min per failure | session evidence timestamps |
| Cleanup success | All recorded cleanups `deleted` or `already_deleted` except one timeout on 19 Nov before fix4 (account `QA aelocal84f10c437e` may remain on the site); retries added in fix4 | `cleanup-log` attachments, `rca-summary` E11 (19 Nov) |

## Rubric self-assessment (fill before submission)
| Dimension | Max | Self-score | Evidence link |
|---|---|---|---|
| Risk-based test design / traceability | 12 | 11 | `docs/test-strategy.md`, `docs/traceability.md` |
| Playwright architecture / code quality | 15 | 12 | `src/`, `skills/playwright.md` |
| UI & API coverage / data integrity | 14 | 12 | CI run 44794834130 |
| AI task decomposition and agent design | 15 | 12 | `agents/orchestrator.md`, `skills/`; RCA agent automated in CI, other agents run as documented human-in-the-loop processes |
| AI RCA and failure classification | 18 | 14 | FI-01/FI-02 reports, `docs/ai-evidence/ai-rca-runs.md`, table above |
| CI/CD and report automation | 10 | 9 | runs 44680539790, 44794834130, 44804837080, 44805726674, 44944370864 |
| Reliability, security and governance | 10 | 9 | stability evidence, `docs/ai-policy.md` |
| Communication, metrics and live defense | 6 | – (assessed at defense) | – |
| **Total (excluding live defense)** | **94** | **79** | |