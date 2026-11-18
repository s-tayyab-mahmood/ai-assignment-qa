# Automation Exercise: Playwright QA with AI-assisted RCA

A Playwright + TypeScript test automation solution for [automationexercise.com](https://automationexercise.com) with:
- risk-based UI, API and integration tests
- isolated test data that is cleaned up after every test
- GitHub Actions CI (daily at 05:00 PKT, on pull requests, and on demand)
- a deterministic failure-diagnostics pipeline, with an optional, guarded AI root-cause-analysis step

> **Status:** framework complete; it type-checks, lints and lists 36 tests. The RCA classifier passes its self-test (9/9 synthetic cases). **The tests have not yet been run against the live site.** See "Limitations".

## Quick start
```bash
nvm use 22                 # Node.js LTS (22.x)
npm ci
npx playwright install --with-deps chromium
cp .env.example .env       # optional; defaults work without it
npm run verify             # typecheck + lint + list tests
npm run test:smoke         # fast critical subset
npm test                   # everything (api, ui, integration)
npm run report             # open the HTML report
npm run rca                # build failure bundle + RCA summary → reports/rca/
```

## Commands
| Command | What it does |
|---|---|
| `npm test` | All projects (`api`, `ui`, `integration`) |
| `npm run test:ui` / `test:api` / `test:integration` | One layer |
| `npm run test:smoke` | `@smoke` subset (see docs/test-strategy.md §9) |
| `npm run test:p0` | All P0 scenarios |
| `npx playwright test --grep @AE-15` | One scenario by trace ID |
| `npm run test:fi -- --grep FI-02` | Fault-injection exercise (expected to fail) |
| `npm run stability` | 3 consecutive smoke runs → `reports/stability/` |
| `npm run rca:collect` / `rca:analyze` / `rca` | RCA stages (always exit 0) |
| `npm run rca:selftest` | Classifier and AI-guardrail regression test (offline) |
| `npm run typecheck` / `lint` / `format` | Static quality |

### Tags
- `@AE-xx`: scenario ID
- `@P0`, `@P1`, `@P2`: risk priority
- `@smoke`: smoke subset
- `@ui`, `@api`, `@integration`: layer

## Repository layout
```
.github/workflows/playwright.yml   CI: schedule (00:00 UTC = 05:00 PKT), PR, manual
config/environment.ts              non-secret settings, ad-host block list
docs/                              strategy, traceability, architecture, AI policy, FI reports, scorecard, AI evidence
skills/                            test-design, playwright, rca, review
agents/orchestrator.md             agent roles, tools, handoffs, thresholds, budgets, exit conditions
src/pages/                         page and component objects (App aggregates them)
src/api/                           typed API client + zod schemas
src/fixtures/test.ts               app, api, account lifecycle, cleanup registry, diagnostics, ad blocking
src/data/                          unique user factory, dummy card, catalogue references
src/utils/                         money, scenario tagging, redaction, logging
tests/ui|api|integration/          test suites
tests/fault-injection/             FI-02, FI-03 (only with FAULT_INJECTION=1)
tools/rca/                         collector, classifier, AI analyzer, report, JSON schema, self-test
tools/stability/                   repeatability runner
reports/                           generated output (gitignored)
```

## CI
The workflow is `.github/workflows/playwright.yml`.
- **Triggers:**
  - `schedule: '0 0 * * *'` (05:00 Asia/Karachi; Pakistan has no DST). It runs only from the **default branch**, and GitHub may start it a few minutes late.
  - `pull_request` to `main`
  - `workflow_dispatch`, with an optional grep
- **Status propagation:** the test step records its outcome. Diagnostics run with `if: always()` and `continue-on-error`, and the final step fails the job only if the tests failed. This means AI or report problems cannot hide a test failure or fake a pass.
- **Artifacts:** the `qa-report-<run_id>-<attempt>` artifact contains:
  - the HTML, JSON and JUnit reports
  - traces, videos and screenshots
  - `reports/rca/*`

  The RCA summary is also written to the job summary.
- **Secrets:**
  - `AI_API_KEY` is optional; add it under repo Settings → Secrets → Actions.
  - It is **never passed to `pull_request` runs**. PR runs get the model-free RCA.
  - The optional repository variable `AI_MODEL` overrides the model.
- **Site safety:** 2 workers, 1 retry in CI, one run per ref at a time.

## AI-assisted RCA in short
1. `collect`: test results become `failure-bundle.json`. The bundle contains each failure's error, stack top, attempts, trace/screenshot paths, network and console logs, cleanup log, fault-injection annotation, changed files, commit and run URL. Everything is redacted.
2. `classify`: rules produce competing hypotheses with evidence for and against, a calibrated confidence, owner, severity and next action. Weak evidence gives UNKNOWN.
3. `ai` (optional): sends sanitized evidence wrapped as untrusted data. The output must pass a schema check and evidence-ID checks, and it can never call an injected fault a product defect. If the AI disagrees with the rules, confidence is capped at 0.6.
4. Publish: `rca-report.json`, `rca-summary.md` and `audit-log.jsonl`. Every record is `HYPOTHESIS_PENDING_REVIEW` and requires human approval.

The details are in `skills/rca.md`, `docs/architecture.md` and `docs/ai-policy.md`.

## Fault-injection exercises
| ID | How | Expected classification | Doc |
|---|---|---|---|
| FI-01 | Branch `fi-01-script-fault`: wrong expected total in AE-12. Repair branch `repair/fi-01` | TEST_SCRIPT_DEFECT | docs/fault-injection/FI-01.md |
| FI-02 | `route.abort` on add-to-cart, local context only | ENVIRONMENT_OR_NETWORK (test-controlled) | docs/fault-injection/FI-02.md |
| FI-03 | Intermittent delay inside the route handler, `--repeat-each=6` | TIMING_OR_FLAKINESS | docs/fault-injection/FI-03.md |

## Limitations and known risks
- **Not yet executed against the live site.** The sandbox where this was built had no access to automationexercise.com. The locators and expected texts are based on the site's known markup and published test cases. Expect a round of locator fixes on the first real run. Record each fix in `docs/ai-evidence/prompt-log.md` Part B.
  - Most likely spots: the address block format (AE-15/16), the invoice text format (AE-17), the brand-sidebar count span (AE-10), and the recommended carousel (AE-21).
- **Ads are blocked** by host pattern. If the site adds new ad hosts, extend `blockedThirdPartyHosts`.
- **Public shared site:** availability and content can change. That is handled by RCA, not by weakening tests.
- **Chromium only;** no visual or accessibility audits. See docs/test-strategy.md §8.
- **Evidence must be real.** The FI reports, scorecard, traceability status and approvals are deliberately left blank until they are filled from real runs.
