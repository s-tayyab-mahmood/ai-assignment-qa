# AI-assisted RCA in CI – run log (2026-11-22 to 2026-11-25)

Runs 1–4: `workflow_dispatch` on branch `fi-01-ai-rca` (the FI-01 fault re-injected: AE-12 expects
3 × unit price instead of 4 ×), grep `@AE-12`. Pull-request runs never receive an AI credential, so
AI mode was exercised on a trusted branch. Artifacts: `docs/evidence/2026-11-22-ai-rca-*`.
Runs 5–7 are scheduled/manual runs of `main` on the live site (`docs/evidence/2026-11-23-*`, `2026-11-25-*`).

| # | Run | Provider / model | What happened | Pipeline behaviour | Final record |
|---|---|---|---|---|---|
| 1 | [44939903969](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/44939903969) | anthropic / claude-sonnet-5-5 | HTTP 400 – no API credit | Fallback to rules; audit `decision: error`; test failure still shown | TEST_SCRIPT_DEFECT 75% (rules) |
| 2 | [44941742953](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/44941742953) | github-models / openai/gpt-4.1 | HTTP 200 body "OK" – service retired 2026-07-30 | Non-JSON reply rejected; fallback to rules | **PRODUCT_DEFECT 45% CRITICAL – wrong** (merge-diff bug, see below) |
| 3 | [44942993219](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/44942993219) attempts 1–2 | gemini / gemini-3.8-flash | HTTP 503 – model under high demand | Fallback to rules | TEST_SCRIPT_DEFECT 75% (rules) |
| 3 | 44942993219 attempt 3 | gemini (model variable changed) | 30 s timeout (AbortError) | Fallback; report wrongly said "rejected by guardrail" (fixed in fix17) | TEST_SCRIPT_DEFECT 75% (rules) |
| 4 | [44944370864](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/44944370864) | gemini / **gemini-3.6-flash** (repo variable `AI_MODEL`), timeout 60 s (`AI_TIMEOUT_MS`) | **Answered; passed schema and evidence-ID checks** | `decision: accepted`; AI agreed with rules | **TEST_SCRIPT_DEFECT 85% – ai-assisted** |
| 5 | [45116848024](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/45116848024) (scheduled, 23 Nov) | gemini / gemini-3.6-flash | Site overloaded (503); 5 failures analysed | 3 accepted (all agreed: ENVIRONMENT_OR_NETWORK), 2 replies truncated mid-JSON → fallback (fixed in fix21) | Reviewer rejected AI suggestion "add retry mechanisms"; AE-10 rules verdict corrected (fix21) |
| 6 | [45139042427](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/45139042427) (manual, 23 Nov) | gemini / gemini-3.6-flash | Site overloaded (503); 11 failures, AI limited to first 5 | 5 accepted (all agreed: ENVIRONMENT_OR_NETWORK); 6 analysed by rules only | Reviewer rejected "retry logic / backoff" suggestions; AE-10 and AE-16 rules verdicts corrected (fix23) |
| 7 | [45603876542](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/45603876542) (manual, 25 Nov, first run with the site health check) | gemini / gemini-3.6-flash | Health check passed; HTTP 503 on `/logout` mid-run, AE-02 passed on retry (flaky) | 1 accepted (agreed: ENVIRONMENT_OR_NETWORK 85%) | Accepted; no change to tests |

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
**Rebuttal / reviewer notes:**
- I double-checked the actual diff and confirmed that line 41 in `tests/ui/cart.spec.ts` is indeed multiplying by 3 instead of 4. Both the AI's root cause analysis and its suggested fix are spot-on.
- That said, the AI figured out the "× 3" issue through basic math (1500 expected ÷ 500 unit price) rather than actually reading the code. When it claimed to have "inspected the diff in E12," it was overstating things—E12 only shows file names.
- Where the AI really helped over the standard rules was explaining *why* the product's output (2000 for 4 × 500) was right, making it much clearer why this wasn't a `PRODUCT_DEFECT`.
- Its "first failure" label ("AE-12") wasn't nearly as helpful as the standard `file:line` format, though that has since been addressed in `fix18`.
- Across the five failed AI runs (due to lack of credits, a retired endpoint, two overloads, and a timeout), the system reliably fell back to the rule-based results. None of the failures masked the broken test or falsely passed the job.
- Ironically, the biggest issue these runs uncovered was with the rules, not the AI: after a merge, the diff missed the injected test change, leading the RCA to falsely flag a critical `PRODUCT_DEFECT`. This has been resolved in `fix16`.

**Human decision:** Approved `TEST_SCRIPT_DEFECT` for run 44944370864. Both the AI provider setup (Gemini free tier using redacted synthetic data only) and the fallback behavior look good to go. – Reviewer Tayyab, 2026-11-22

