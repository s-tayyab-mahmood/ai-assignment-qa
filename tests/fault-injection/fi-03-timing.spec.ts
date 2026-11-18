import { test, expect } from '../../src/fixtures/test';
import { PRODUCTS } from '../../src/data/catalog';
import { at, scenario } from '../../src/utils/scenario';

/**
 * FI-03 (stretch) – controlled, intermittent timing fault. EXPECTED TO BE FLAKY.
 * A route handler delays the add-to-cart XHR on a deterministic subset of repeats
 * (every 2nd repetition by default) while the assertion uses a deliberately short timeout.
 * The delay lives inside interception, not in the test body (no fixed sleeps in tests).
 * Run with:  npm run test:fi -- --grep FI-03 --repeat-each=6
 * RCA should see pass/fail alternation across repeats and classify TIMING_OR_FLAKINESS.
 */
const DELAY_MS = Number(process.env.FI03_DELAY_MS ?? 6000);
const EVERY_NTH = Number(process.env.FI03_EVERY_NTH ?? 2);

test(
  'FI-03 add-to-cart response intermittently delayed by test-controlled interception',
  {
    ...scenario('AE-11', 'P0', { layer: 'ui', ref: 'FI-03' }),
    annotation: [
      { type: 'scenario', description: 'AE-11' },
      { type: 'priority', description: 'P0' },
      {
        type: 'fault-injection',
        description: `FI-03: ${DELAY_MS}ms delay on /add_to_cart every ${EVERY_NTH} repeats`,
      },
    ],
  },
  async ({ app, page }, testInfo) => {
    const tag = at('AE-11', 'P0');
    const delayed = testInfo.repeatEachIndex % EVERY_NTH === 1;
    testInfo.annotations.push({ type: 'fi03-delayed', description: String(delayed) });
    await page.route('**/add_to_cart/**', async (route) => {
      if (delayed) await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      await route.continue();
    });

    await app.products.open();
    await app.products
      .card(PRODUCTS.blueTop.name)
      .first()
      .locator('.productinfo')
      .getByText('Add to cart')
      .click();
    // Deliberately tight synchronization budget – this is the synchronization weakness under study.
    await expect(app.cartModal.title, tag('add-to-cart confirmation within budget')).toBeVisible({
      timeout: 3000,
    });
  },
);
