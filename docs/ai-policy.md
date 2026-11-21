# AI usage policy

## Model and tool choices
| Use | Model / tool | Why |
|---|---|---|
| Design and authoring assistant (development time) | Claude (Anthropic), used interactively by the engineer | Strong at TypeScript and Playwright. Every suggestion goes through human review, type check, lint and tests. |
| RCA agent (CI) – default | GitHub Models (`openai/gpt-4.1`), temperature 0, `max_tokens` 1500, authenticated with the run's short-lived `GITHUB_TOKEN` (`models: read`) | Free and rate-limited; no stored secret at all; JSON output that can be validated |
| RCA agent (CI) – alternative | Anthropic Messages API (`claude-sonnet-5-5`) when repo variable `AI_PROVIDER=anthropic` and secret `AI_API_KEY` are set | Paid; first attempt on 2026-11-22 failed with HTTP 400 (no credit) and fell back safely – see `docs/evidence/2026-11-22-ai-rca-fallback-no-credit/` |
| Fallback | Rule-based classifier (`tools/rca/classify.ts`) | Works without a key or network. It is also the baseline that AI output is checked against. |

Configuration:
- Provider from repository variable `AI_PROVIDER` (default `github-models`), model from `AI_MODEL`.
- Credential: the run's `GITHUB_TOKEN` (GitHub Models) or the `AI_API_KEY` secret (Anthropic) – never on pull_request runs.
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
