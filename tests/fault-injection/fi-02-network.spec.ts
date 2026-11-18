import { test, expect } from '../../src/fixtures/test';
import { PRODUCTS } from '../../src/data/catalog';
import { at, scenario } from '../../src/utils/scenario';

/**
 * FI-02 – controlled network fault. EXPECTED TO FAIL.
 * The add-to-cart XHR is aborted by Playwright route interception inside THIS browser context
 * only. Nothing is sent to, or changed on, the real site. RCA must classify this as
 * ENVIRONMENT_OR_NETWORK (test-controlled) and must NOT claim a product defect.
 * Run with:  npm run test:fi -- --grep FI-02
 */
test(
  'FI-02 add-to-cart request blocked by test-controlled interception',
  {
    ...scenario('AE-11', 'P0', { layer: 'ui', ref: 'FI-02' }),
    annotation: [
      { type: 'scenario', description: 'AE-11' },
      { type: 'priority', description: 'P0' },
      { type: 'fault-injection', description: 'FI-02: route.abort(connectionfailed) on /add_to_cart/*' },
    ],
  },
  async ({ app, page }) => {
    const tag = at('AE-11', 'P0');
    await page.route('**/add_to_cart/**', (route) => route.abort('connectionfailed'));

    await app.products.open();
    await app.products.addToCartFromListing(PRODUCTS.blueTop.name, app.cartModal);
    await app.header.goToCart();
    await expect(app.cart.rows, tag('product added to cart')).toHaveCount(1);
  },
);
