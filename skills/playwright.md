# Skill: Playwright authoring standards

**Used by:** the automation authoring agent and human authors. The review skill (`skills/review.md`) checks code against this list.

## Locator policy (in order of preference)
1. `getByRole` with an accessible name, scoped to a region (e.g. `#header`), so link names cannot collide.
2. `getByLabel` / `getByPlaceholder` / `getByText` for form fields and messages.
3. `getByTestId`. Here `data-qa` is configured as the test ID attribute in `playwright.config.ts`, so it is a stable, intentional hook.
4. Stable id or class names, **only with a written reason in a comment** (`// Exception: …`). Current exceptions:
   - icon-only buttons (`#submit_search`, `#subscribe`, `.cart_quantity_delete`)
   - product cards and cart cells without roles (`.productinfo`, `.cart_price`)
   - the unlabelled quantity and file inputs
- Never use XPath, `nth-child` chains or positional indexes, except `.first()` on a filtered set where duplicates are expected.

## Synchronisation
- Use web-first assertions (`await expect(locator).toBeVisible()` / `toHaveText()`). They retry automatically.
- **Forbidden** (enforced by ESLint):
  - `waitForTimeout` or any fixed sleep in tests
  - `force: true`
  - `networkidle`
  - raising timeouts to make a failure go away
- Wait for a *condition* that proves the step completed. Example: the "Added!" modal is visible, then hidden after "Continue Shopping".

## Fixtures and isolation
- Import `test` and `expect` from `src/fixtures/test.ts` only.
- Never share an account between tests. Use one of:
  - `account`: created via API, deleted in teardown (runs on failure too)
  - `cleanup.track(user)`: for accounts the test creates through the UI
- Build test data with `buildUser()` and `dummyCard()`. Never use real personal or card data.
- Each test leaves no residue. Cleanup status is attached as `cleanup-log`.
- Keep workers ≤ 3 (public site). Use no retries locally and one in CI.

## Assertions
- Every assertion carries a scenario tag: `expect(x, tag('what')).…` where `tag = at('AE-12','P0')`.
- Critical journeys need assertions **beyond visibility**: values, arithmetic, persisted state (checked via the API), exact sets.
- Prefer an independent oracle:
  - computed (unit price × quantity)
  - API (catalogue, user profile)
  - fixture (the address entered)
- Do not assert behaviour the site does not claim (e.g. a maximum quantity). Record it as an `observation` annotation instead.

## API patterns
- Use `ApiClient` (`src/api/client.ts`). Every response is validated with zod.
- This site returns HTTP 200 with the logical status in `responseCode`, so assert the body.
- Negative tests use strict `toEqual` on `{responseCode, message}`. That also proves no data leaked alongside the error.

## Tracing and evidence
- The config retains trace, video and screenshot on failure. The `page` fixture attaches `network-failures` and `console-errors` when a test fails.
- Tag every test with `scenario(id, priority, {smoke, layer, ref})`. Tags drive CI selection, the traceability matrix and RCA.

## Code review checklist (authoring)
- [ ] Locators follow the policy; exceptions are commented
- [ ] No sleeps, force clicks, networkidle or arbitrary timeouts
- [ ] Unique data; cleanup covers failure paths
- [ ] Each assertion is tagged and has a real oracle
- [ ] `npm run verify` passes (types, lint, test list)
- [ ] The isolated test passes locally at least twice
