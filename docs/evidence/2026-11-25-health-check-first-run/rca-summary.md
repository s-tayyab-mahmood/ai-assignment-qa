# QA run – RCA summary

> Classifications are **hypotheses pending human review**. Confidence is a calibrated judgement, not proof.

| Item | Value |
|---|---|
| Commit | `4efc0f8c8f1a` on `main` |
| Run | https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/45603876542 |
| Trigger | workflow_dispatch |
| Generated | 2026-11-25T11:24:35.896Z |
| Analysis mode | ai-assisted (with deterministic baseline) |
| Tests | 36 (passed 35, failed 0, flaky 1, skipped 0) |
| Pass rate | 97% |
| Duration | 56.6 s |

## Failures

| Scenario | Test | Classification | Confidence | Business severity | Owner | Mode |
|---|---|---|---|---|---|---|
| AE-02 | AE-02 registered customer can log in and log out | **ENVIRONMENT_OR_NETWORK** | 85% | NONE | CI / infrastructure | ai-assisted |

### AE-02 – AE-02 registered customer can log in and log out

- **Symptom:** TimeoutError: page.waitForURL: Timeout 30000ms exceeded. =========================== logs =========================== waiting for navigation until "domcontentloaded"
- **First failure:** First failing assertion/action at src/pages/components/Header.ts:27:21 (AI: E1)
- **Classification:** ENVIRONMENT_OR_NETWORK (85%) – AI agreed with the rule-based baseline
- **Alternatives considered:** TIMING_OR_FLAKINESS (0.70)
- **Validate:** Inspected network logs (E7) and retry history (E3). Trace file E4 was present in evidence but not interactively rendered; network status 503 provides direct confirmation of server overload.
- **Reproduce:** `npx playwright test tests/ui/auth.spec.ts:43 --project=ui`
- **Recommended action:** Monitor target application infrastructure for transient 503 Service Unavailable errors during automated test execution.
- **Owner:** CI / infrastructure · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| ENVIRONMENT_OR_NETWORK | 0.85 | E7, E1 | E3 | The test timed out waiting for page navigation (E1) because a first-party document request to automationexercise.com/logout failed with HTTP 503 Service Unavailable (E7). Per classification policy, 5xx server responses on first-party requests indicate an environment/network bottleneck. |
| TIMING_OR_FLAKINESS | 0.70 | E3, E1 | E7 | The test passed on retry 1 in 3.8s after failing retry 0 on a 30s timeout (E3, E1), demonstrating flakiness. However, the root cause of the initial attempt's failure was an server-side 503 response rather than a client-side timing issue. |

<details><summary>Evidence</summary>

- **E1** (error): TimeoutError: page.waitForURL: Timeout 30000ms exceeded. =========================== logs =========================== waiting for navigation until "domcontentloaded" ============================================================     at ../src/pages/components/Header.ts:27    25 |   private async navigate(name: Parameters<Header['link']>[0], url: RegExp): Promise<void> {   26 |     await this.link(na
- **E2** (stack): failing line src/pages/components/Header.ts:27; 
- **E3** (retry-history): retry 0: failed (33115ms); retry 1: passed (3847ms)
- **E4** (trace) `test-results/auth-Authentication-AE-02--7edad-omer-can-log-in-and-log-out-ui/trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results/auth-Authentication-AE-02--7edad-omer-can-log-in-and-log-out-ui/test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results/auth-Authentication-AE-02--7edad-omer-can-log-in-and-log-out-ui/video.webm`: video of failing attempt
- **E7** (network): 1 failed/5xx request(s): {"url":"https://automationexercise.com/logout","status":503,"resourceType":"document"}
- **E8** (network): 2 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":13}; {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":12}
- **E9** (console): context only (third-party hosts, not product evidence): 6 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E10** (console): 9 console error(s): [{"ts":"2026-11-25T11:23:49.114Z","level":"warn","event":"console.error","data":{"text":"Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector"}},{"ts":"2026-11-25T11:23:49.131Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/login' was loaded over HTTPS, but requested an insecure stylesheet 'http://font
- **E11** (cleanup): [{"ts":"2026-11-25T11:23:48.735Z","level":"info","event":"account.created","data":{"scenarioUser":"QA ae[REDACTED_PHONE]a4a608a8"}},{"ts":"2026-11-25T11:24:21.662Z","level":"info","event":"account.cleanup.deleted","data":{"user":"QA ae[REDACTED_PHONE]a4a608a8","attempt":1}}]
- **E12** (diff): changed files: .github/workflows/playwright.yml, README.md, docs/ai-evidence/approvals.md, docs/architecture.md, docs/test-strategy.md, package.json, tools/health/evaluate.ts, tools/health/probe.ts, tools/health/selftest.ts

</details>