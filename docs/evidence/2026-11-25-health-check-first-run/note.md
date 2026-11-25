# Site health check – first CI run (fix28)

- **Date:** 2026-11-25
- **Commit:** `4efc0f8` (fix28)
- **Run:** https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/45603876542 (workflow_dispatch)
- **Why the check was added:** two runs failed only because the site was overloaded
  (scheduled 45116848024, manual 45139042427). RCA classified both as ENVIRONMENT_OR_NETWORK.

## Health check
| Attempt | Time (UTC) | Probe | Status | Duration | Result |
|---|---|---|---|---|---|
| 1 | 2026-11-25T11:23:10Z | home page | 200 | 215 ms | ok |
| 1 | 2026-11-25T11:23:10Z | products API | 200 | 430 ms | ok |

Healthy on the first attempt, so the tests started straight away.

## Test result
36 tests: 35 passed, 1 flaky, 0 failed (56.6 s). Job green.
- AE-02 (login/logout): the first attempt timed out waiting for navigation because
  `GET /logout` returned HTTP 503 during the run. The retry passed in 3.8 s.
- RCA: ENVIRONMENT_OR_NETWORK, 85%, AI-assisted (Gemini) and agreeing with the rule-based verdict.
  Alternative considered: TIMING_OR_FLAKINESS (0.70).

## What I concluded
The health check worked as designed. The site was healthy at the start, so there was no waiting.
The 503 came later in the run, which a pre-run check cannot see. CI's single retry
covered it, and RCA classified it correctly as environment, not product.
So the two protections cover different cases: the health check for a site that is
down before the run, the retry for a short overload during it. The waiting path
(wait 10 min and retry) is covered by the offline self-test (9/9) but has not happened in CI yet.

## Decision
Accept the classification (environment, no action on the tests). Keep the health check and
the single retry as they are. Review after the first scheduled run where the site is overloaded at start.