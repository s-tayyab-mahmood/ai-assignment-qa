# AI RCA – provider overload (HTTP 503) and timeout – run 44942993219

Run: https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/44942993219
Trigger: workflow_dispatch on `fi-01-ai-rca`, grep `@AE-12` (FI-01 fault re-injected).

| Attempt | Provider / model | AI step outcome | Final record | Files |
|---|---|---|---|---|
| 1 | gemini / gemini-3.8-flash | HTTP 503 "model is currently experiencing high demand" → fallback to rules | TEST_SCRIPT_DEFECT 75% (rules) | `rca-summary-attempt1.md`, `audit-log-attempt1.jsonl` |
| 2 | gemini / gemini-3.8-flash | Same HTTP 503 → fallback to rules (visible in the run's job summary) | TEST_SCRIPT_DEFECT 75% (rules) | Artifact not retained – not downloaded before it became unavailable |
| 3 | gemini (model variable changed) | 30 s timeout (AbortError) → fallback to rules; report wrongly called it a "guardrail rejection" (fixed in fix17) | TEST_SCRIPT_DEFECT 75% (rules) | `rca-summary-attempt3.md`, `audit-log-attempt3.jsonl` |

In all three attempts the test failure stayed visible, the job stayed red, and the RCA was still
published from the rule-based baseline – the AI step failing never hid or changed the test result.
Successful AI analysis followed in run 44944370864 (`../2026-11-22-ai-rca-gemini-accepted/`).
Full log: `docs/ai-evidence/ai-rca-runs.md`.