# AI prompt and correction log

The brief requires at least five representative prompts and outputs showing how **the engineer** challenged or corrected AI suggestions. Part A is a true record of the initial generation session. Part B is for the engineer to fill in while reviewing and running the code. Only Part B counts as the engineer's own challenges, so do not move Part A entries into it.

## Part A: Initial generation session (Claude, 2026-11-18)

**A1. Scope and provider clarification**
- **Prompt (engineer):** "AI provider will be you right?"
- **AI answer:** Two separate roles. The assistant (Claude in chat) helps design and author the code. The CI RCA agent needs an API key in a GitHub secret, because a chat session cannot be called from Actions. Recommended building the model-free fallback first.
- **Decision (engineer):** Proceed with the deterministic fallback; add an Anthropic API key later.

**A2. Repository access**
- **Event:** GitHub connection to the assistant failed.
- **Decision (engineer):** The assistant builds locally and hands over a zip; the engineer pushes. This keeps humans as the only actors that push.

**A3. AI self-correction: FI-03 design**
- **First draft:** delay the `/view_cart` page response and assert the cart rows with a short timeout.
- **Problem found:** a click that triggers navigation waits for the delayed response, so the assertion would never see the delay. The fault would not reproduce.
- **Fix:** delay the add-to-cart XHR instead and assert the modal within 3 s.

**A4. AI self-correction: workflow script injection**
- **First draft:** `npx playwright test --grep "${{ github.event.inputs.grep }}"`. That interpolates user input into the shell.
- **Fix:** pass it through `env: GREP`, and record the rule in `skills/review.md`.

**A5. AI self-correction: RCA evidence citation**
- **First run** (an offline dry run in the sandbox, where the site was unreachable): the classifier cited the evidence item "no failed first-party requests recorded" as evidence *for* ENVIRONMENT_OR_NETWORK. Confidence was also only 0.45 for an unambiguous DNS failure.
- **Fix:** network evidence is cited only when failures were actually recorded. DNS and connection-refused errors score 0.8. Failures with the same error signature are flagged as a likely common cause.
- **Verification:** `npm run rca:selftest`, 9/9 labelled cases.

**A6. AI self-correction: API base URL**
- **First draft:** set the `api` project's `baseURL` to `…/api` and call relative paths.
- **Problem:** URL resolution drops the last path segment without a trailing slash.
- **Fix:** `ApiClient` builds absolute URLs from `env.apiUrl`.

## Part B: Engineer challenges (fill in during review and first runs; at least 5)

For each entry:

> **B1.** Date:
> **Prompt to AI:**
> **AI output (summary or excerpt):**
> **What I challenged / why:**
> **Correction applied:** (commit …)
> **Verified by:** (run …)

Good candidates:
- locators that fail on the first live run
- the AE-16 address format
- the invoice text format
- whether the cart accumulates quantities
- whether to block ads
- an RCA classification you disagree with
- the confidence calibration
