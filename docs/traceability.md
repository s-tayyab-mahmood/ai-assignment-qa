# Requirements-to-test traceability matrix

**How to read the status column:**
- **Implemented** means the code exists, type-checks and lints.
- **Passing** / **Failing** is set only from a real run, with a link to that run.

Status below is taken from CI run [44794834130](https://github.com/s-tayyab-mahmood/ai-assignment-qa/actions/runs/44794834130) (2026-11-20, workflow_dispatch, full suite, all passed) unless stated otherwise. First-run findings are linked where a scenario needed a test fix before passing.

Evidence for every row: the Playwright HTML report, trace on failure, and `reports/rca/*` in the CI artifact `qa-report-<run_id>`. Filter by tag, e.g. `npx playwright test --grep @AE-15`.

| ID | Pri | Feature | Test(s) | Key steps | Test data | Expected outcome (oracle) | Layer | Source mapping | Evidence | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| AE-01 | P0 | Registration | `ui/auth.spec.ts` AE-01 | Signup form → create → logged in → API read-back → delete via UI | `buildUser()` unique | "Account Created!"; banner shows the name; **API profile equals form input** (fixture); after deletion the login API returns 404 | UI + API | TC1 | trace, cleanup-log | Passing (CI 44794834130) |
| AE-02 | P0 | Login / logout | `ui/auth.spec.ts` AE-02 | Login → banner → logout | `account` fixture | Banner text is exactly `Logged in as <name>`; after logout the URL is `/login`, the banner is absent and the login link is restored | UI | TC2, TC4 | trace | Passing (CI 44794834130) |
| AE-03 | P0 | Invalid login | `ui/auth.spec.ts` AE-03a, AE-03b | Wrong password; unknown email | fixture + ghost user | Exact error text; not authenticated; API returns `{404,"User not found!"}` | UI + API | TC3; API10 | trace | Passing (CI 44794834130) |
| AE-04 | P1 | Duplicate registration | `ui/auth.spec.ts` AE-04 | Signup with an existing email | `account` fixture | `Email Address already exist!`; account form not offered | UI | TC5 | trace | Passing (CI 44794834130) |
| AE-05 | P1 | Login API validation | `api/users.spec.ts` API-07/08/10 | verifyLogin valid / missing email / wrong password | fixture | Strict `{responseCode,message}` for 200/400/404; a wrong password is indistinguishable from an unknown user | API | API7, 8, 10 | JSON report | Passing (CI 44794834130) |
| AE-06 | P0 | Product catalogue | `ui/catalog.spec.ts` AE-06; `api/products.spec.ts` API-01 | List → details | API catalogue | UI card count equals the API product count; details name, price and brand equal the API; unique IDs; schema-valid | UI + API | TC8; API1 | trace | Passing (CI 44794834130) |
| AE-07 | P0 | Search relevance | `ui/catalog.spec.ts` AE-07; API-05 | Search "top"; search "Blue Top"; API search "jean" | Terms in `catalog.ts` | **UI result set equals API result set**; every API hit matches name or category | UI + API | TC9; API5 | trace | Passing (CI 44794834130) |
| AE-08 | P1 | Search empty/invalid | AE-08, AE-08b; API-06 | Nonsense term; blank term; missing parameter | `NO_MATCH_TERM` | 0 cards and API `[]`; blank search recorded as an observation (no oracle); API `{400,…missing…}` | UI + API | Discovery; API6 | annotation | Passing (CI 44794834130) |
| AE-09 | P1 | Category filtering | `ui/catalog.spec.ts` AE-09 | Women>Dress, Men>Tshirts | — | Heading; **listing equals the API products with that usertype+category** | UI (+API oracle) | TC18 | trace | Passing (CI 44794834130); first live run failed – test defect "Men" matched "Women", fixed in fix7 (`docs/evidence/2026-11-20-full-run/`) |
| AE-10 | P1 | Brand filtering | `ui/catalog.spec.ts` AE-10; API-03 | Polo, Madame | — | Listing equals the API products of that brand; sidebar count equals the listing count; every product brand exists in the brand list | UI + API | TC19; API3 | trace | Passing (CI 44794834130) |
| AE-11 | P0 | Cart multiple items | `ui/cart.spec.ts` AE-11 | Add 2 from the listing → cart | Blue Top, Men Tshirt | Exactly 2 lines; unit price unchanged; qty 1; line total = price | UI | TC12 | trace | Passing (CI 44794834130) |
| AE-12 | P0 | Quantity calculation | AE-12, AE-12b | Details → qty 4 (and 25) → cart | — | qty shown; **line total = qty × captured unit price** | UI | TC13 + boundary | trace | Passing (CI 44794834130); also FI-01 target (`docs/fault-injection/FI-01.md`) |
| AE-13 | P0 | Remove from cart | `ui/cart.spec.ts` AE-13 | Add 2 → remove 1 → remove the last | — | Only the remaining line, with correct totals; then "Cart is empty!" and 0 rows | UI | TC17 | trace | Passing (CI 44794834130) |
| AE-14 | P0 | Cart persists on login | `ui/cart.spec.ts` AE-14 | Guest adds qty 2 → login → cart | `account` | The same line, qty and total after login | UI | TC20 | trace | Passing (CI 44794834130) |
| AE-15 | P0 | End-to-end order (flagship) | `ui/checkout.spec.ts` AE-15 | Search, then add qty 4 + 2nd product → checkout requires registration → register → back to cart → checkout → addresses → comment → dummy pay → invoice → delete account | `buildUser()`, `dummyCard()` | Cart arithmetic before and after registration; **delivery and billing equal the fixture field by field**; total = sum of lines; "Order Placed!"; invoice download event, .txt, non-empty, contains name + total; account deleted (API 404); cleanup on failure | UI (+API) | TC14–16 | trace, invoice attachment, cleanup-log | Passing (CI 44794834130); two sync defects fixed (fix5, fix6) and budget set by evidence (fix7) – `docs/evidence/2026-11-19-AE-15-*` |
| AE-16 | P0 | Address consistency | `ui/checkout.spec.ts` AE-16 | Login → add → checkout | `account` | Delivery equals the fixture; billing equals delivery; delivery equals the API profile | UI + API | TC23; API14 | trace | Passing (CI 44794834130) |
| AE-17 | P1 | Invoice download | `ui/checkout.spec.ts` AE-17 | Logged-in order → download | `account`, `dummyCard()` | Download event; .txt; non-empty; name and total | UI | TC24 | invoice attachment | Passing (CI 44794834130) |
| AE-18 | P1 | Product review | `ui/ancillary.spec.ts` AE-18 | Details → review form | synthetic reviewer | "Thank you for your review." | UI | TC21 | trace | Passing (CI 44794834130) |
| AE-19 | P1 | Contact form upload | `ui/ancillary.spec.ts` AE-19 | Fill + upload .txt + confirm dialog | generated file | Exact success message | UI | TC6 | trace | Passing (CI 44794834130); first live run failed – test never opened a page, fixed in fix7 |
| AE-20 | P2 | Subscriptions | `ui/ancillary.spec.ts` AE-20 | Home footer; cart footer | unique email | Success message on both pages | UI | TC10, 11 | trace | Passing (CI 44794834130) |
| AE-21 | P2 | Recommended items | `ui/ancillary.spec.ts` AE-21 | Home → recommended → add → view cart | — | The chosen item's name is in the cart | UI | TC22 | trace | Passing (CI 44794834130) |
| AE-22 | P1 | Account API CRUD | `api/users.spec.ts` API-11..14 | Create → duplicate → read → update → read → delete → read | `buildUser()` | 201; 400 duplicate; read equals input; update persisted; 200 delete; 404 after | API | API11–14 | JSON report | Passing (CI 44794834130) |
| AE-23 | P1 | API method validation | `api/negative-methods.spec.ts` | POST productsList, PUT brandsList, DELETE verifyLogin | — | Exactly `{405,"This request method is not supported."}`, no data | API | API2, 4, 9 | JSON report | Passing (CI 44794834130) |
| AE-24 | P1 | UI/API consistency | `integration/consistency.spec.ts` | Listing vs API; brand sidebar vs API | — | name+price multiset equal; brand sets equal | Integration | API1, 3 | trace | Passing (CI 44794834130) |

## Totals
- **UI:** 20 scenario IDs, 23 tests (`npx playwright test --list --project=ui`). The brief requires ≥ 18.
- **Negative and edge UI tests:** AE-03a, AE-03b, AE-04, AE-08, AE-08b, AE-12b (6). The brief requires ≥ 6. API negatives are in addition: API-06, 08, 10, the duplicate create, and AE-23 ×3.
- **API:** 11 tests, 14 reference endpoints and methods, more than 25 distinct assertions. The brief requires ≥ 8.
