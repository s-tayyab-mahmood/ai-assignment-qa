# Human approval decisions

Every AI-proposed change and every RCA classification used as evidence gets one row.

| Date | Change / PR / RCA record | AI suggestion | Decision (accept / modify / reject) | Reason | Reviewer |
|---|---|---|---|---|---|
| | Initial framework import (zip from the assistant) | Full scaffold, 36 tests, RCA tooling, docs | | Fill after your own review: what you checked, what you changed | |
| | fix7: `test.slow()` for AE-15 only | Triple AE-15's test budget (60 s → 180 s); evidence: passing runs 34–52 s, timeout at 60 s on 2026-11-20 with /payment still loading | **PENDING – reviewer to decide** | Timeout changes need evidence and approval (brief §13) | |
