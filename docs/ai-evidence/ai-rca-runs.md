# AI-assisted RCA in CI – run log (2026-11-22)

All runs: `workflow_dispatch` on branch `fi-01-ai-rca` (the FI-01 fault re-injected: AE-12 expects
3 × unit price instead of 4 ×), grep `@AE-12`. Pull-request runs never receive an AI credential, so
AI mode was exercised on a trusted branch. Artifacts: `docs/evidence/2026-11-22-ai-rca-*`.

| # | Run | Provider / model | What happened | Pipeline behaviour | Final record |
|---|---|---|---|---|---|
| 1 | [44939903969](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/44939903969) | anthropic / claude-sonnet-5-5 | HTTP 400 – no API credit | Fallback to rules; audit `decision: error`; test failure still shown | TEST_SCRIPT_DEFECT 75% (rules) |
| 2 | [44941742953](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/44941742953) | github-models / openai/gpt-4.1 | HTTP 200 body "OK" – service retired 2026-07-30 | Non-JSON reply rejected; fallback to rules | **PRODUCT_DEFECT 45% CRITICAL – wrong** (merge-diff bug, see below) |
| 3 | [44942993219](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/44942993219) attempts 1–2 | gemini / gemini-3.8-flash | HTTP 503 – model under high demand | Fallback to rules | TEST_SCRIPT_DEFECT 75% (rules) |
| 3 | 44942993219 attempt 3 | gemini (model variable changed) | 30 s timeout (AbortError) | Fallback; report wrongly said "rejected by guardrail" (fixed in fix17) | TEST_SCRIPT_DEFECT 75% (rules) |
| 4 | [44944370864](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/44944370864) | gemini / **gemini-3.6-flash** (repo variable `AI_MODEL`), timeout 60 s (`AI_TIMEOUT_MS`) | **Answered; passed schema and evidence-ID checks** | `decision: accepted`; AI agreed with rules | **TEST_SCRIPT_DEFECT 85% – ai-assisted** |

## Run 4 – the accepted AI analysis
| Item | Value |
|---|---|
| Audit | prompt 9,665 chars (SHA-256 `10adc6dd…617c`), response 1,001 chars, latency 8.6 s, tokens 2,769 in / 289 out, cost $0 (free tier) |
| AI hypotheses | TEST_SCRIPT_DEFECT 0.85 (E1, E3, E12); PRODUCT_DEFECT 0.15 with E1, E12 against ("2000 for 4 × 500 is correct; error is in the test oracle") |
| Confidence calibration | rules 0.75 → 0.85 (agreement may raise by at most 0.10) |
| AI recommended action | "Update assertion in tests/ui/cart.spec.ts at line 41 to multiply by 4 instead of 3" – matches the injected fault exactly |

## Problems found and fixed during these runs
| Found in | Problem | Fix |
|---|---|---|
| Run 1 | Report said "AI differed from rule baseline" for a failed call | fix14, completed in fix17 |
| Run 2 | **Rule-based RCA claimed PRODUCT_DEFECT (CRITICAL)**: after `git merge main`, the diff of the last commit hid the injected test change | fix16 – diff against the branch point with `main` |
| Run 2 | AI provider chosen from out-of-date knowledge (GitHub Models, retired) | fix16 – Gemini free tier; Anthropic optional |
| Run 3 | Timeout reported as a guardrail rejection | fix17 – outcome-specific wording + self-test |
| Run 4 | AI replaced the precise location `tests/ui/cart.spec.ts:41:79` with just "AE-12" | fix18 – keep the rule-based file:line when the AI's is less specific |
| Run 4 | AI's validation text said it "inspected the diff in E12"; E12 holds only changed **file names**. "× 3" was inferred from 1500 ÷ 500, not read from the code | Reviewer note – inference is correct, but must be confirmed against the real diff (done: `14879f6` / current branch) |

## Human review
**Rebuttal / reviewer notes:** ✍️ (your words – e.g. what you confirmed against the diff; whether the
AI added value over the rules; what the failed runs show about safety)

**Human decision:** ✍️ (e.g. accept TEST_SCRIPT_DEFECT; AI provider and fallback behaviour approved) – reviewer ✍️, date ✍️
