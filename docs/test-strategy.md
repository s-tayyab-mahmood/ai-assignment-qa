# Test strategy: Automation Exercise

## 1. Objective
Give release-quality evidence that the critical customer journeys of automationexercise.com work: identity, catalogue, cart, checkout and invoice. Every failure is classified with evidence, and AI assistance stays under human control.

## 2. Scope
**In scope**
- UI journeys AE-01 to AE-21
- Public API checks (API1–API14 references)
- UI/API consistency (AE-24)
- Data lifecycle (create and clean up disposable accounts)
- CI scheduling and reporting, RCA, fault injection

**Out of scope**
- Performance and load testing (public shared site)
- Security testing and exploitation
- Real payments
- Cross-browser coverage (Chromium only; see coverage gaps)
- Visual regression
- Accessibility audit (role-based locators give partial signal only)
- Email delivery

## 3. Risk model
Risk = **Impact** (1–3: money, identity or orders = 3) × **Likelihood** (1–3: complex logic, many integrations or past instability = 3).

| ID | Area | Impact | Likelihood | Score | Priority | Rationale |
|---|---|---|---|---|---|---|
| AE-15 | End-to-end order | 3 | 3 | 9 | P0 | Revenue path that touches every component |
| AE-12 | Quantity calculation | 3 | 2 | 6 | P0 | Wrong totals mean wrong charges |
| AE-16 | Address consistency | 3 | 2 | 6 | P0 | Wrong delivery or billing address |
| AE-14 | Cart persists on login | 3 | 2 | 6 | P0 | Lost cart means lost sale; session merge is complex |
| AE-11 | Cart multiple items | 3 | 2 | 6 | P0 | Core purchase mechanics |
| AE-13 | Remove from cart | 3 | 2 | 6 | P0 | Overcharge risk |
| AE-01 | Registration | 3 | 2 | 6 | P0 | Gate to checkout |
| AE-02 | Login / logout | 3 | 2 | 6 | P0 | Identity and session |
| AE-03 | Invalid login | 3 | 2 | 6 | P0 | Account-security behaviour (no user enumeration) |
| AE-06 | Catalogue | 3 | 1 | 3 | P0 | Nothing sells without it; low complexity |
| AE-07 | Search relevance | 2 | 2 | 4 | P0 | Primary discovery path |
| AE-04 | Duplicate registration | 2 | 2 | 4 | P1 | Data integrity |
| AE-05 | Login API validation | 2 | 2 | 4 | P1 | API contract |
| AE-08 | Search empty/invalid | 2 | 2 | 4 | P1 | Error-handling robustness |
| AE-09 | Category filtering | 2 | 1 | 2 | P1 | Discovery |
| AE-10 | Brand filtering | 2 | 1 | 2 | P1 | Discovery |
| AE-17 | Invoice download | 2 | 2 | 4 | P1 | Post-purchase document |
| AE-18 | Product review | 1 | 2 | 2 | P1 | User-generated content |
| AE-19 | Contact upload | 1 | 2 | 2 | P1 | File handling |
| AE-22 | Account API CRUD | 2 | 2 | 4 | P1 | Data lifecycle; also the cleanup mechanism |
| AE-23 | API method validation | 2 | 1 | 2 | P1 | Contract hygiene |
| AE-24 | UI/API consistency | 2 | 2 | 4 | P1 | Detects drift between layers |
| AE-20 | Subscriptions | 1 | 1 | 1 | P2 | Marketing |
| AE-21 | Recommended items | 1 | 1 | 1 | P2 | Merchandising |

The brief fixed the priorities. The scores above justify them, and differences are noted (e.g. AE-06 is P0 because of impact even though likelihood is low).

## 4. Approach by layer
| Layer | What it proves | Count |
|---|---|---|
| UI (`tests/ui`) | User-visible journeys and calculations | 24 tests covering 20 scenario IDs (AE-01–04, 06–21) |
| API (`tests/api`) | Contracts, negative handling, data lifecycle | 11 tests covering all 14 reference API cases (API11–14 run as verified steps inside one CRUD flow), plus a duplicate-create negative case |
| Integration (`tests/integration`) | UI and API agree on catalogue and brands | 2 tests (AE-24) |
| Fault injection (`tests/fault-injection`) | The RCA pipeline is correct on known faults | FI-02, FI-03 (opt-in) + FI-01 on a branch |

## 5. Oracles
- **Computed:** unit price × quantity, and the sum of lines. Prices are integers parsed from `Rs. N`.
- **Cross-layer:** UI listing, search, category and brand results equal the API catalogue.
- **Fixture:** addresses and profile equal what the test entered (field by field, not "text present").
- **Documented message:** exact site texts (e.g. `Email Address already exist!`).
- **Observation only:** undefined behaviours are recorded, not asserted (blank search; quantity upper bound).

## 6. Environment decisions and assumptions
- **Ads blocked.** Google ad and consent hosts are aborted per browser context (`config/environment.ts`). The site's vignette ads cover the page and redirect, and they are not part of the product. This is network filtering inside our own browser, not a bypass of any anti-bot control. Set `BLOCK_ADS=false` to observe raw behaviour.
- **Shared public site.** Workers ≤ 2 (cap 3), retries 0 locally and 1 in CI, one run per ref, one scheduled run per day.
- **Data.** Every test creates unique users (`example.com`) and deletes them in teardown. The catalogue is read, never written. Reviews and contact messages are synthetic and clearly labelled.
- **Payment.** The practice site only simulates payment. A non-Luhn dummy card is used.
- **Site variability.** The live site can change content or be slow. Any change is caught by the oracles and classified by RCA; tests are never silently adapted.

## 7. Entry and exit criteria
- **Entry:** `npm run verify` is green and the site responds.
- **Exit (release-quality):**
  - all P0 tests pass
  - P1 failures are triaged with an RCA record
  - flaky rate < 5% over three smoke runs
  - no UNKNOWN classifications left untriaged

## 8. Coverage gaps (known, accepted)
- Chromium only. Firefox and WebKit can be added as projects but double the site load.
- No mobile viewport.
- No verification that orders persist server-side (the site exposes no order API).
- Invoice validation covers name and total only (the format is plain text with no line items).
- Review and contact submissions cannot be verified as stored (no read API).
- Published TC7 (Test Cases page), TC25/26 (scroll) are not covered: low business risk.

## 9. Smoke subset (`@smoke`)
AE-01, AE-02, AE-06 (UI + API), AE-07 (API), AE-11, AE-12, AE-15, and API-07. These cover identity, catalogue, cart arithmetic and the full order journey in about 3–5 minutes.
