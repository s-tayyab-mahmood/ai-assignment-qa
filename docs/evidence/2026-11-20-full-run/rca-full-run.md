# QA run – RCA summary

> Classifications are **hypotheses pending human review**. Confidence is a calibrated judgement, not proof.

| Item | Value |
|---|---|
| Commit | `22b37bc5dd96` on `main` |
| Generated | 2026-11-20T16:55:26.035Z |
| Analysis mode | deterministic (no AI_API_KEY – model-free fallback) |
| Tests | 36 (passed 33, failed 3, flaky 0, skipped 0) |
| Pass rate | 92% |
| Duration | 453.3 s |

## Failures

| Scenario | Test | Classification | Confidence | Business severity | Owner | Mode |
|---|---|---|---|---|---|---|
| AE-19 | AE-19 contact form accepts a message with a file attachment | **TEST_SCRIPT_DEFECT** | 45% | NONE | QA automation | deterministic |
| AE-09 | AE-09 category filter shows only products from that category | **LOCATOR_OR_UI_CHANGE** | 45% | NONE | QA automation | deterministic |
| AE-15 | AE-15 flagship: new customer discovers products, checks out, pays and downloads a correct invoice | **TIMING_OR_FLAKINESS** | 55% | NONE | QA automation | deterministic |

### AE-19 – AE-19 contact form accepts a message with a file attachment

- **Symptom:** TimeoutError: locator.click: Timeout 15000ms exceeded. Call log:   - waiting for locator('#header').getByRole('link', { name: 'Contact us' })
- **First failure:** First failing assertion/action at src\pages\components\Header.ts:26:27. Shares error signature with 1 other failure(s) in this run ("TimeoutError: locator.click: Timeout #ms exceeded. …") – likely one common cause; triage once.
- **Classification:** TEST_SCRIPT_DEFECT (45%)
- **Alternatives considered:** LOCATOR_OR_UI_CHANGE (0.50), TIMING_OR_FLAKINESS (0.30)
- **Validate:** Re-run isolated: npx playwright test tests\ui\ancillary.spec.ts:29 --project=ui --trace on; open trace; check: single attempt – reproducibility unknown; close alternative: LOCATOR_OR_UI_CHANGE
- **Reproduce:** `npx playwright test tests\ui\ancillary.spec.ts:29 --project=ui`
- **Recommended action:** Inspect the diff of the failing spec/page object; prepare a minimal patch on a branch; re-run the isolated test; human review before merge.
- **Owner:** QA automation · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| TEST_SCRIPT_DEFECT | 0.60 | E1, E8 |  | The expected UI response never appeared and no XHR was sent: the action did not reach the server. Most likely the test interacted before the page scripts were ready (synchronisation defect in the test). |
| LOCATOR_OR_UI_CHANGE | 0.50 | E1, E5, E4 |  | Element could not be found/resolved in time with no first-party network errors; the page structure may have changed. |
| TIMING_OR_FLAKINESS | 0.30 | E1, E3 |  | Generic timeout; slow site or synchronization gap. |

<details><summary>Evidence</summary>

- **E1** (error): TimeoutError: locator.click: Timeout 15000ms exceeded. Call log:   - waiting for locator('#header').getByRole('link', { name: 'Contact us' })      at ..\src\pages\components\Header.ts:26    24 |    */   25 |   private async navigate(name: Parameters<Header['link']>[0], url: RegExp): Promise<void> { > 26 |     await this.link(name).click();      |                           ^   27 |     await this.p
- **E2** (stack): failing line src\pages\components\Header.ts:26; 
- **E3** (retry-history): retry 0: failed (16271ms)
- **E4** (trace) `test-results\ancillary-Ancillary-featur-35277-sage-with-a-file-attachment-ui\trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results\ancillary-Ancillary-featur-35277-sage-with-a-file-attachment-ui\test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results\ancillary-Ancillary-featur-35277-sage-with-a-file-attachment-ui\video.webm`: video of failing attempt
- **E7** (network): no failed first-party requests recorded (ad hosts blocked by design are excluded)
- **E8** (network): xhr-log: no first-party XHR call completed during the test
- **E9** (console): no console errors recorded
- **E10** (diff): changed files: docs/evidence/2026-11-19-AE-15-address-read-before-render/rca-after-fix.md, docs/evidence/2026-11-19-AE-15-address-read-before-render/rca-before-fix.md

</details>

### AE-09 – AE-09 category filter shows only products from that category

- **Symptom:** TimeoutError: locator.click: Timeout 15000ms exceeded. Call log:   - waiting for locator('.left-sidebar').locator('#Men').getByRole('link', { name: 'Tshirts' })
- **First failure:** First failing assertion/action at src\pages\CatalogPages.ts:76:81. Shares error signature with 1 other failure(s) in this run ("TimeoutError: locator.click: Timeout #ms exceeded. …") – likely one common cause; triage once.
- **Classification:** LOCATOR_OR_UI_CHANGE (45%)
- **Alternatives considered:** TIMING_OR_FLAKINESS (0.30)
- **Validate:** Re-run isolated: npx playwright test tests\ui\catalog.spec.ts:91 --project=ui --trace on; open trace; check: single attempt – reproducibility unknown
- **Reproduce:** `npx playwright test tests\ui\catalog.spec.ts:91 --project=ui`
- **Recommended action:** Open the trace/DOM snapshot at the failing step; update the locator following skills/playwright.md (role/label first); do not weaken the assertion.
- **Owner:** QA automation · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| LOCATOR_OR_UI_CHANGE | 0.50 | E1, E5, E4 |  | Element could not be found/resolved in time with no first-party network errors; the page structure may have changed. |
| TIMING_OR_FLAKINESS | 0.30 | E1, E3 |  | Generic timeout; slow site or synchronization gap. |

<details><summary>Evidence</summary>

- **E1** (error): TimeoutError: locator.click: Timeout 15000ms exceeded. Call log:   - waiting for locator('.left-sidebar').locator('#Men').getByRole('link', { name: 'Tshirts' })      at ..\src\pages\CatalogPages.ts:76    74 |   async openCategory(parent: string, child: string): Promise<void> {   75 |     await this.sidebar.getByRole('link', { name: parent, exact: false }).first().click(); > 76 |     await this.sid
- **E2** (stack): failing line src\pages\CatalogPages.ts:76; 
- **E3** (retry-history): retry 0: failed (25942ms)
- **E4** (trace) `test-results\catalog-Catalogue-search-a-2c82e-products-from-that-category-ui\trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E5** (screenshot) `test-results\catalog-Catalogue-search-a-2c82e-products-from-that-category-ui\test-failed-1.png`: screenshot at failure
- **E6** (video) `test-results\catalog-Catalogue-search-a-2c82e-products-from-that-category-ui\video.webm`: video of failing attempt
- **E7** (network): no failed first-party requests recorded (ad hosts blocked by design are excluded)
- **E8** (network): 1 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":185}
- **E9** (console): context only (third-party hosts, not product evidence): 6 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E10** (console): 8 console error(s): [{"ts":"2026-11-20T16:52:00.874Z","level":"warn","event":"console.error","data":{"text":"Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector"}},{"ts":"2026-11-20T16:52:01.513Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://f
- **E11** (diff): changed files: docs/evidence/2026-11-19-AE-15-address-read-before-render/rca-after-fix.md, docs/evidence/2026-11-19-AE-15-address-read-before-render/rca-before-fix.md

</details>

### AE-15 – AE-15 flagship: new customer discovers products, checks out, pays and downloads a correct invoice

- **Symptom:** Test timeout of 60000ms exceeded.
- **First failure:** Location not captured
- **Classification:** TIMING_OR_FLAKINESS (55%)
- **Alternatives considered:** none matched
- **Validate:** Re-run isolated: npx playwright test tests\ui\checkout.spec.ts:16 --project=ui --trace on; open trace; check: no screenshot; single attempt – reproducibility unknown
- **Reproduce:** `npx playwright test tests\ui\checkout.spec.ts:16 --project=ui`
- **Recommended action:** Re-run isolated with --repeat-each to measure; find the missing wait condition; never add fixed sleeps or blanket timeout increases.
- **Owner:** QA automation · **Human approval required:** yes

| Hypothesis | Score | Evidence for | Evidence against | Rationale |
|---|---|---|---|---|
| TIMING_OR_FLAKINESS | 0.65 | E1, E7 |  | A first-party request was slower than usual (>5 s) but shorter than the wait: likely a synchronisation gap. |

<details><summary>Evidence</summary>

- **E1** (error): Test timeout of 60000ms exceeded.
- **E2** (retry-history): retry 0: timedOut (68040ms)
- **E3** (trace) `test-results\checkout-Checkout-and-orde-4f317-downloads-a-correct-invoice-ui\trace.zip`: Playwright trace (open with npx playwright show-trace)
- **E4** (video) `test-results\checkout-Checkout-and-orde-4f317-downloads-a-correct-invoice-ui\video.webm`: video of failing attempt
- **E5** (network): no failed first-party requests recorded (ad hosts blocked by design are excluded)
- **E6** (network): 6 completed first-party XHR call(s), last: {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":259}; {"url":"https://automationexercise.com/add_to_cart/2","method":"GET","ms":534}; {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":235}; {"url":"https://automationexercise.com/cdn-cgi/rum","method":"POST","ms":468}
- **E7** (network): 20 first-party request(s) slow (>5 s) or still pending at failure: {"url":"https://automationexercise.com/static/js/jquery.prettyPhoto.js","method":"GET","type":"script","openForMs":8230}; {"url":"https://automationexercise.com/static/fonts/fontawesome-webfont.woff","method":"GET","type":"font","openForMs":2343}; {"url":"https://automationexercise.com/payment","method":"POST","type":"document","op
- **E8** (console): context only (third-party hosts, not product evidence): 20 failed request(s), e.g. {"method":"GET","url":"http://fonts.googleapis.com/css","resourceType":"stylesheet","error":"mixed-content"}
- **E9** (console): 20 console error(s): [{"ts":"2026-11-20T16:52:37.214Z","level":"warn","event":"console.error","data":{"text":"Failed to load resource: net::ERR_BLOCKED_BY_CLIENT.Inspector"}},{"ts":"2026-11-20T16:52:37.432Z","level":"warn","event":"console.error","data":{"text":"Mixed Content: The page at 'https://automationexercise.com/products' was loaded over HTTPS, but requested an insecure stylesheet 'http://
- **E10** (cleanup): [{"ts":"2026-11-20T16:53:46.056Z","level":"info","event":"account.cleanup.deleted","data":{"user":"QA aelocal9b2b164991","attempt":1}}]
- **E11** (diff): changed files: docs/evidence/2026-11-19-AE-15-address-read-before-render/rca-after-fix.md, docs/evidence/2026-11-19-AE-15-address-read-before-render/rca-before-fix.md

</details>