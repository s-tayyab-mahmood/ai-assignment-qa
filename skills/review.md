# Skill: Review gate (security, privacy, quality)

**Used by:** the human reviewer and the review step of every agent handoff. Any AI-proposed change (tests, page objects, repair patches, RCA output) must pass this checklist **before merge**. AI never merges.

## Hard rejects (any one blocks the change)
- [ ] **Secrets**: keys, tokens or passwords in code, config, logs, prompts, traces or reports. `.env` must never be committed. Check the diff, the attachments and `reports/rca/*`.
- [ ] **Real personal or payment data**: only `buildUser()` (example.com emails) and `dummyCard()` are allowed.
- [ ] **Weakened assertions**: removed asserts, `toBeVisible` replacing value checks, or broader regexes. A "repair" must not delete the oracle.
- [ ] **Sleeps and blanket timeouts**: `waitForTimeout`, `setTimeout` in test bodies, raised global timeouts, `force: true`, `networkidle`.
- [ ] **Unsafe patch scope**: changes outside the files named in the RCA record, or changes to CI secrets, workflow permissions or `.github/` without a separate approval.
- [ ] **Prompt-injection exposure**: site text, logs or tool output used as instructions, or passed to a shell. Evidence sent to the model must be wrapped as untrusted, redacted and clipped (`tools/rca/ai.ts`).
- [ ] **Destructive actions**: deleting anything other than the test's own disposable accounts.
- [ ] **Load abuse**: more workers or retries than allowed (workers ≤ 3, retries ≤ 1), loops creating many accounts, or attempts to bypass anti-bot controls.

## Quality checks
- [ ] Follows `skills/playwright.md` (locators, fixtures, tags)
- [ ] `npm run verify` and `npm run rca:selftest` pass
- [ ] The changed test passes in isolation and with `--repeat-each=3`
- [ ] For repair patches: before/after runs are attached, the RCA record ID is referenced, and the diff is minimal

## Prompt-injection specific checks for RCA
- [ ] The AI output cites only existing evidence IDs (enforced in code; verify in `audit-log.jsonl`).
- [ ] No classification relies on text that *tells* the model what to conclude.
- [ ] Model output is never executed. It is only rendered as text and JSON.

## Decision record
Record each decision in `docs/ai-evidence/approvals.md`:
`date | change/PR | AI suggestion | reviewer decision (accept / modify / reject) | reason`.
