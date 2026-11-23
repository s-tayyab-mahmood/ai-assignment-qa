# Manual run on an overloaded site – run 45139042427 (2026-11-23)
Result: 25 passed, 6 failed, 5 flaky. Cause: HTTP 503 "heavy load (queue full)" on pages, images and API.
RCA correct on 9/11. Misses (fixed in fix23):
- AE-10: TEST_SCRIPT_DEFECT (about:blank) – reality ENVIRONMENT_OR_NETWORK (API 503 before first navigation)
- AE-16: TIMING_OR_FLAKINESS – reality ENVIRONMENT_OR_NETWORK (many first-party 503s)
AI: agreed with rules on all 5 analyses it answered. Its suggestions to "add retry logic / backoff"
(AE-21, AE-22) are rejected – CI already retries once, more would hide flakiness and load the site.
Decision: no defect raised, not re-running today to avoid adding load to the shared site.
Reviewed by: Tayyab, 2026-11-23