# AI usage policy

## Model and tool choices
| Use | Model / tool | Why |
|---|---|---|
| Design and authoring assistant (development time) | Claude (Anthropic), used interactively by the engineer | Strong at TypeScript and Playwright. Every suggestion goes through human review, type check, lint and tests. |
| RCA agent (CI) | Anthropic Messages API, `AI_MODEL` (default `claude-sonnet-5-5`), temperature 0, `max_tokens` 1500 | Deterministic-leaning output; cheap enough to run per failure; JSON output that can be validated |
| Fallback | Rule-based classifier (`tools/rca/classify.ts`) | Works without a key or network. It is also the baseline that AI output is checked against. |

Configuration:
- The key is read only from `AI_API_KEY` (a GitHub Actions secret).
- The model name comes from the repository variable `AI_MODEL`.
- No key is ever committed. `.env` is gitignored.

## Data sent to the model
**Sent:**
- scenario ID, priority, project and outcome
- attempt statuses and durations
- the redacted, clipped error message and the top four stack frames
- evidence summaries (each ≤ 600 characters)
- the fault-injection annotation
- the deterministic baseline

**Never sent:**
- full page text or the DOM
- form values or passwords
- card fields or emails (redacted)
- trace or video files
- environment variables or secrets

The redaction rules are in `src/utils/redact.ts`. They redact keys, authorization headers, password, CVC and card fields, card-number-shaped digit runs, emails and phone numbers.

## Prompt-injection controls
- Evidence is wrapped in `<untrusted_evidence>`. The system prompt says it may contain instructions and that they must not be followed.
- The model has no tools. Its output is only parsed as JSON and rendered as text; it is never executed.
- The output is validated with a zod schema and checked against the real evidence IDs. A PRODUCT_DEFECT claim on an injected fault is rejected.
- PR runs get no secret, so a malicious PR cannot exfiltrate the key.

## Human oversight
- Every RCA record has `status: HYPOTHESIS_PENDING_REVIEW` and `requires_human_approval: true`.
- No agent may merge, push to `main`, change secrets or workflow permissions, or delete data other than its own disposable accounts.
- Code is accepted only through a PR with the `skills/review.md` checklist and green CI.
- Decisions are recorded in `docs/ai-evidence/approvals.md`.

## Cost and latency
`audit-log.jsonl` records latency and input/output tokens for every call. Report them in `docs/scorecard.md`. Expected usage is about 3–5k input tokens per failure and at most 5 failures per run.
