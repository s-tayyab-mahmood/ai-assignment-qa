import { test, expect } from '../../src/fixtures/test';
// FI-01 (script fault) is exercised on branch `fi-01-script-fault` – see docs/fault-injection/FI-01.md.
import { PRODUCTS } from '../../src/data/catalog';
import { at, scenario } from '../../src/utils/scenario';
import { addViaDetails, expectCart, loginViaUi } from '../support/flows';

test.describe('Cart', () => {
  test(
    'AE-11 multiple products added from the listing appear with correct prices and totals',
    scenario('AE-11', 'P0', { smoke: true, layer: 'ui', ref: 'TC12' }),
    async ({ app }) => {
      const tag = at('AE-11', 'P0');
      await app.products.open();
      const first = await app.products.readCard(PRODUCTS.blueTop.name);
      const second = await app.products.readCard(PRODUCTS.menTshirt.name);
      await app.products.addToCartFromListing(first.name, app.cartModal);
      await app.products.addToCartFromListing(second.name, app.cartModal);

      await app.header.goToCart();
      expectCart(
        await app.cart.lines(),
        [
          { ...first, quantity: 1 },
          { ...second, quantity: 1 },
        ],
        tag,
      );
    },
  );

  test(
    'AE-12 quantity set on product details is reflected and line total is calculated',
    scenario('AE-12', 'P0', { smoke: true, layer: 'ui', ref: 'TC13' }),
    async ({ app }) => {
      const tag = at('AE-12', 'P0');
      const added = await addViaDetails(app, PRODUCTS.blueTop.name, 4);
      await app.cart.open();
      const lines = await app.cart.lines();
      expectCart(lines, [added], tag);
      // Explicit arithmetic oracle (also the target of fault-injection exercise FI-01).
      expect(lines[0]?.total, tag('line total for 4 units = 4 x unit price')).toBe(added.unitPrice * 3);
    },
  );

  test(
    'AE-12b unusual but site-accepted quantity (25) is calculated correctly',
    scenario('AE-12', 'P0', { layer: 'ui', ref: 'Boundary' }),
    async ({ app }) => {
      const tag = at('AE-12', 'P0');
      // Boundary choice: the input is type=number with min=1 and no documented max; we pick a value
      // the site accepts and do NOT assert any upper-limit validation the site does not claim.
      const added = await addViaDetails(app, PRODUCTS.sleevelessDress.name, 25);
      await app.cart.open();
      expectCart(await app.cart.lines(), [added], tag);
    },
  );

  test(
    'AE-13 removing a product updates the cart; removing the last empties it',
    scenario('AE-13', 'P0', { layer: 'ui', ref: 'TC17' }),
    async ({ app }) => {
      const tag = at('AE-13', 'P0');
      await app.products.open();
      const a = await app.products.readCard(PRODUCTS.blueTop.name);
      const b = await app.products.readCard(PRODUCTS.menTshirt.name);
      await app.products.addToCartFromListing(a.name, app.cartModal);
      await app.products.addToCartFromListing(b.name, app.cartModal);
      await app.header.goToCart();

      await app.cart.remove(a.name);
      expectCart(await app.cart.lines(), [{ ...b, quantity: 1 }], tag);

      await app.cart.remove(b.name);
      await expect(app.cart.emptyMessage, tag('empty-cart message after removing last item')).toBeVisible();
      await expect(app.cart.rows, tag('no rows remain')).toHaveCount(0);
    },
  );

  test(
    'AE-14 guest cart is retained after logging in',
    scenario('AE-14', 'P0', { layer: 'ui', ref: 'TC20' }),
    async ({ app, account }) => {
      const tag = at('AE-14', 'P0');
      const added = await addViaDetails(app, PRODUCTS.menTshirt.name, 2);
      await app.cart.open();
      expectCart(await app.cart.lines(), [added], tag);

      await loginViaUi(app, account, tag);
      await app.header.goToCart();
      expectCart(await app.cart.lines(), [added], tag);
    },
  );
});
