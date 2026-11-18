import { test, expect } from '../../src/fixtures/test';
import { BRANDS, CATEGORIES, NO_MATCH_TERM, PRODUCTS } from '../../src/data/catalog';
import { parseRupees } from '../../src/utils/money';
import { at, scenario } from '../../src/utils/scenario';

test.describe('Catalogue, search and filtering', () => {
  test(
    'AE-06 product catalogue lists products and details match the API catalogue',
    scenario('AE-06', 'P0', { smoke: true, layer: 'ui', ref: 'TC8; API1' }),
    async ({ app, api, page }) => {
      const tag = at('AE-06', 'P0');
      const { body } = await api.getProducts();
      await app.products.open();
      await expect(app.products.cards, tag('listing shows every catalogue product')).toHaveCount(
        body.products.length,
      );

      const product = PRODUCTS.blueTop;
      const apiProduct = body.products.find((p) => p.name === product.name);
      expect(apiProduct, tag(`${product.name} exists in API catalogue`)).toBeDefined();

      await app.products.openDetails(product.name);
      await expect(page, tag('details URL uses the product id')).toHaveURL(
        new RegExp(`/product_details/${apiProduct?.id}$`),
      );
      const details = await app.productDetails.read();
      expect(details.name, tag('details name')).toBe(apiProduct?.name);
      expect(details.unitPrice, tag('details price equals API price')).toBe(parseRupees(apiProduct?.price));
      await expect(app.productDetails.info, tag('brand shown')).toContainText(`Brand: ${apiProduct?.brand}`);
      await expect(app.productDetails.info, tag('availability shown')).toContainText('Availability:');
    },
  );

  test(
    'AE-07 search results equal the API search results for the same term',
    scenario('AE-07', 'P0', { layer: 'ui', ref: 'TC9; API5' }),
    async ({ app, api }) => {
      const tag = at('AE-07', 'P0');
      const term = 'top';
      const { body } = await api.searchProducts(term);
      expect(body.products.length, tag('oracle: API returns results for term')).toBeGreaterThan(0);

      await app.products.open();
      await app.products.search(term);
      const uiNames = (await app.products.cardNames()).sort();
      expect(uiNames, tag('UI result set equals API result set')).toEqual(
        body.products.map((p) => p.name).sort(),
      );

      await app.products.search(PRODUCTS.blueTop.searchTerm);
      expect(await app.products.cardNames(), tag('exact name search finds the product')).toContain(
        PRODUCTS.blueTop.name,
      );
    },
  );

  test(
    'AE-08 zero-result search shows an empty result set (UI + API)',
    scenario('AE-08', 'P1', { layer: 'ui', ref: 'Discovery; API6' }),
    async ({ app, api }) => {
      const tag = at('AE-08', 'P1');
      await app.products.open();
      await app.products.search(NO_MATCH_TERM);
      await expect(app.products.cards, tag('no product cards for nonsense term')).toHaveCount(0);
      const { body } = await api.searchProducts(NO_MATCH_TERM);
      expect(body.products, tag('API agrees: empty list, not an error')).toEqual([]);
    },
  );

  test(
    'AE-08b blank search term – observed behaviour is recorded, no validation assumed',
    scenario('AE-08', 'P1', { layer: 'ui', ref: 'Discovery' }),
    async ({ app }) => {
      const tag = at('AE-08', 'P1');
      await app.products.open();
      await app.products.searchInput.fill('');
      await app.products.searchButton.click();
      // Oracle is deliberately weak: the site does not document blank-search behaviour (brief §6).
      // We only require that the page stays functional and record what happened.
      await expect(
        app.products.searchedHeading.or(app.products.allProductsHeading),
        tag('page remains a functional product listing'),
      ).toBeVisible();
      test.info().annotations.push({
        type: 'observation',
        description: `blank search rendered ${await app.products.cards.count()} product cards`,
      });
    },
  );

  test(
    'AE-09 category filter shows only products from that category',
    scenario('AE-09', 'P1', { layer: 'ui', ref: 'TC18' }),
    async ({ app, api, page }) => {
      const tag = at('AE-09', 'P1');
      const { body } = await api.getProducts();
      await app.products.open();

      for (const cat of [CATEGORIES.womenDress, CATEGORIES.menTshirts]) {
        await app.products.openCategory(cat.parent, cat.child);
        await expect(
          page.getByRole('heading', { name: cat.heading }),
          tag(`${cat.heading} heading`),
        ).toBeVisible();
        const expected = body.products
          .filter((p) => p.category.usertype.usertype === cat.parent && p.category.category === cat.child)
          .map((p) => p.name)
          .sort();
        expect(expected.length, tag('oracle: API has products in category')).toBeGreaterThan(0);
        expect(
          (await app.products.cardNames()).sort(),
          tag(`${cat.heading} shows exactly that category`),
        ).toEqual(expected);
      }
    },
  );

  test(
    'AE-10 brand filter shows exactly the brand products and matches the sidebar count',
    scenario('AE-10', 'P1', { layer: 'ui', ref: 'TC19; API3' }),
    async ({ app, api, page }) => {
      const tag = at('AE-10', 'P1');
      const [{ body: products }, { body: brands }] = await Promise.all([api.getProducts(), api.getBrands()]);
      await app.products.open();

      for (const brand of ['Polo', 'Madame'] as const satisfies ReadonlyArray<(typeof BRANDS)[number]>) {
        expect(
          brands.brands.some((b) => b.brand === brand),
          tag(`API lists brand ${brand}`),
        ).toBe(true);
        const link = app.products.brandsPanel.getByRole('link', { name: new RegExp(`${brand}$`) });
        const advertised = Number(((await link.locator('span').textContent()) ?? '').replace(/\D/g, ''));

        await app.products.openBrand(brand);
        await expect(
          page.getByRole('heading', { name: `Brand - ${brand} Products` }),
          tag('brand heading'),
        ).toBeVisible();
        const uiNames = (await app.products.cardNames()).sort();
        const apiNames = products.products
          .filter((p) => p.brand === brand)
          .map((p) => p.name)
          .sort();
        expect(uiNames, tag(`${brand} listing equals API products of that brand`)).toEqual(apiNames);
        expect(uiNames, tag('sidebar count matches listing')).toHaveLength(advertised);
      }
    },
  );
});
