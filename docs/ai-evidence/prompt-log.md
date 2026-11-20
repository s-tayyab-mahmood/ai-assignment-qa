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

## Part B: Engineer challenges and corrections (live runs, 19–20 Nov 2026)

Facts (prompt, AI output, correction, verification) are taken from the real runs and patches.
The "What I challenged / why" lines are written by me, the engineer.

**B1.** 2026-11-19
- **Prompt to AI:** shared the first API run output: 10/11 passed, API-08 `verifyLogin` without email timed out after 15 s; log timestamps appeared as `[REDACTED_PHONE]`.
- **AI output:** the timeout is most likely temporary site slowness (API-07 had taken 13 s just before); advised an isolated re-run rather than raising the timeout. Identified its own redaction rule as too broad (it hid dates).
- **What I challenged / why:** I saw API-08 time out once while the other API tests passed. I didn't want the timeout raised without evidence, so I asked for an isolated re-run first. I also noticed the log dates were hidden, which makes the evidence harder to read.
- **Correction applied:** fix1, commit `aa12bf0`: phone redaction no longer matches ISO timestamps; RCA rule for API request timeouts with competing hypotheses (slow site vs. endpoint hangs on that input).
- **Verified by:** `npx playwright test --grep "API-08" --repeat-each=3` → 3/3 passed; `rca:selftest` 10/10.

**B2.** 2026-11-19
- **Prompt to AI:** shared the RCA summary for AE-12/AE-12b failures (`page.goto` load timeout; "Added!" modal timeout).
- **AI output (RCA):** TEST_SCRIPT_DEFECT 40%, because `src/utils/redact.ts` (unrelated) had changed and the error's code frame matched the locator rule; Google Fonts mixed-content errors counted as network evidence.
- **What I challenged / why:** The RCA blamed redact.ts, but that file only formats logs and has nothing to do with opening the products page. A page-load timeout points to site speed, not to a script change.
- **Correction applied:** fix2, commit `40e2226`: rules match only the error head; a changed file counts only if it is in the failure path; navigation-timeout rule; slow/pending first-party requests recorded; pages wait for DOMContentLoaded + a page element instead of every third-party resource.
- **Verified by:** `--grep "@AE-12" --repeat-each=3` → 5/6 passed (the 1 failure was the 503 in B3); `rca:selftest` 12/12.

**B3.** 2026-11-19
- **Prompt to AI:** shared `error-context.md`, screenshot and RCA summary for AE-12b repeat 2.
- **AI output (RCA):** TEST_SCRIPT_DEFECT 40%, because `src/pages/OrderPages.ts` had changed and appears in the stack.
- **What I challenged / why:** The screenshot clearly showed the site's "heavy load (queue full)" page. The test never saw the cart, so it can't be a script defect.
- **Correction applied:** fix3, commit `ed9770e`: page-level 5xx recorded as `site-unavailable`; RCA classifies it as ENVIRONMENT_OR_NETWORK and down-weights changed files in the stack.
- **Verified by:** same results re-analysed → ENVIRONMENT_OR_NETWORK ~80% (`docs/evidence/2026-11-19-AE-12b-site-503/`); `rca:selftest` 13/13.

**B4.** 2026-11-19
- **Prompt to AI:** shared the RCA summary for AE-15 ×3 (all failed; cleanup of one account timed out).
- **AI output (RCA):** TIMING_OR_FLAKINESS ("find the missing wait") with TEST_DATA_OR_STATE 0.60 as runner-up, based only on the cleanup error.
- **What I challenged / why:** Cleanup runs after the test has already failed, so it can't be the cause. The add-to-cart request was still open after 25 seconds, so the server was the bottleneck, not our waits.
- **Correction applied:** fix4, commit `c871055`: a request held longer than the failed wait → ENVIRONMENT_OR_NETWORK; cleanup problems become a warning, never a cause; cleanup retries 3× with its own time budget.
- **Verified by:** `rca:selftest` 14/14; later runs show cleanup `deleted` on attempt 1 and no TEST_DATA hypothesis from cleanup.

**B5.** 2026-11-19
- **Prompt to AI:** shared the smoke RCA summary (AE-11 and AE-15 failed with WORKERS=1) and the AE-15 page snapshot.
- **AI output (RCA):** AE-15 LOCATOR_OR_UI_CHANGE 45%. (AE-11 ENVIRONMENT_OR_NETWORK 75% was correct: `add_to_cart/2` pending 10.1 s.)
- **What I challenged / why:** No add-to-cart request was recorded at all, so the click never reached the server. A changed locator would have failed to find the button, but the button was found and clicked.
- **Correction applied:** fix5, commit `d128605`: click navigation waits for DOMContentLoaded so page scripts are bound; XHR log on failure; RCA rule "no XHR sent → action never reached the server".
- **Verified by:** next AE-15 ×3 run: XHR log shows `add_to_cart/1` and `/2` answered in 0.35–1.5 s; failures moved to a later step (B6). `rca:selftest` 15/15.

**B6.** 2026-11-19
- **Prompt to AI:** shared the RCA summary for AE-15 ×3 (2 failed at the address assertion).
- **AI output (RCA):** ENVIRONMENT_OR_NETWORK 50% / 45%, driven by font files aborted by navigation.
- **What I challenged / why:** Only the address lines were empty; name, city, country and phone were correct, and the test had passed before with the same code. That means the lines were read too early, not lost to the network.
- **Correction applied:** fix6, commit `97bebe5`: checkout waits for the full DOM before non-retrying reads; aborted static resources ignored; RCA rule for empty received values.
- **Verified by:** next AE-15 ×3 run: 2 passed, 1 failed at search (site slow, correctly ENVIRONMENT 0.70); address step did not fail again. `rca:selftest` 16/16. Evidence: `docs/evidence/2026-11-19-AE-15-address-read-before-render/`.

**B7.** 2026-11-20
- **Prompt to AI:** shared the full-run RCA summary (33/36).
- **AI output (RCA):** AE-09 LOCATOR_OR_UI_CHANGE 45% ("page structure may have changed").
- **What I challenged / why:** The site's category menu hadn't changed. The test clicked "Women" again because the name "Men" also matches inside "Women".
- **Correction applied:** fix7, commit `a82d305`: whole-word category match ("Men" no longer matches "Women").
- **Verified by:** `--grep "@AE-19|@AE-09|@AE-15"` → 3/3 passed.

**B8.** 2026-11-20
- **Prompt to AI:** same full-run RCA summary.
- **AI output (RCA):** AE-19 TEST_SCRIPT_DEFECT 45% with the wrong reason ("no XHR sent"); AE-15 TIMING_OR_FLAKINESS 55% ("synchronisation gap").
- **What I challenged / why:** AE-19's real cause was that no page was open, not "no request sent". AE-15 had no stuck step; the whole journey ran over the 60-second limit on a slow site.
- **Correction applied:** fix7, commit `a82d305`: AE-19 opens a page first; RCA records the page URL at failure (`about:blank` → test never navigated); whole-test timeout with pages still loading → ENVIRONMENT_OR_NETWORK; AE-15 `test.slow()` (decision recorded in approvals.md).
- **Verified by:** 3/3 passed (as B7); `rca:selftest` 18/18.
