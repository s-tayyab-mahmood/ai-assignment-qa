import { test, expect } from '../../src/fixtures/test';
import { parseRupees } from '../../src/utils/money';
import { at, scenario } from '../../src/utils/scenario';

test.describe('UI / API consistency (AE-24)', () => {
  test(
    'AE-24a every product in the UI listing has the same name and price as the API catalogue',
    scenario('AE-24', 'P1', { layer: 'integration', ref: 'API1' }),
    async ({ app, api }) => {
      const tag = at('AE-24', 'P1');
      const { body } = await api.getProducts();
      await app.products.open();

      // Read UI cards as "name|price" multiset; duplicates in names are preserved.
      const ui = await app.products.cards
        .locator('.productinfo')
        .evaluateAll((nodes) =>
          nodes.map(
            (n) =>
              `${n.querySelector('p')?.textContent?.trim()}|${n.querySelector('h2')?.textContent?.trim()}`,
          ),
        );
      const uiNormalised = ui.map((s) => {
        const [name, price] = s.split('|');
        return `${name}|${parseRupees(price)}`;
      });
      const apiNormalised = body.products.map((p) => `${p.name}|${parseRupees(p.price)}`);
      expect(uiNormalised.sort(), tag('UI catalogue equals API catalogue (name + price)')).toEqual(
        apiNormalised.sort(),
      );
    },
  );

  test(
    'AE-24b every API brand is navigable in the UI brand sidebar',
    scenario('AE-24', 'P1', { layer: 'integration', ref: 'API3' }),
    async ({ app, api }) => {
      const tag = at('AE-24', 'P1');
      const { body } = await api.getBrands();
      await app.products.open();
      const uiBrands = (await app.products.brandsPanel.getByRole('link').allTextContents())
        .map((t) => t.replace(/^\s*\(\d+\)\s*/, '').trim())
        .sort();
      const apiBrands = [...new Set(body.brands.map((b) => b.brand))].sort();
      expect(uiBrands, tag('UI brand list equals distinct API brands')).toEqual(apiBrands);
    },
  );
});
