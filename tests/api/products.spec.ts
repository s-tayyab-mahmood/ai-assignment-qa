import { test, expect } from '../../src/fixtures/test';
import { PRODUCTS } from '../../src/data/catalog';
import { at, scenario } from '../../src/utils/scenario';

test.describe('API – products, brands, search', () => {
  test(
    'API-01 GET productsList returns a valid, non-empty, unique-id catalogue',
    scenario('AE-06', 'P0', { smoke: true, layer: 'api', ref: 'API1' }),
    async ({ api }) => {
      const tag = at('AE-06', 'P0');
      const { httpStatus, body } = await api.getProducts(); // zod-validated
      expect(httpStatus, tag('HTTP 200')).toBe(200);
      expect(body.products.length, tag('catalogue not empty')).toBeGreaterThan(0);
      const ids = body.products.map((p) => p.id);
      expect(new Set(ids).size, tag('product ids are unique')).toBe(ids.length);
      expect(
        body.products.map((p) => p.name),
        tag('known reference products present'),
      ).toEqual(expect.arrayContaining(Object.values(PRODUCTS).map((p) => p.name)));
    },
  );

  test(
    'API-03 GET brandsList returns brands and every product brand is a listed brand',
    scenario('AE-10', 'P1', { layer: 'api', ref: 'API3' }),
    async ({ api }) => {
      const tag = at('AE-10', 'P1');
      const [{ body: brands }, { body: products }] = await Promise.all([api.getBrands(), api.getProducts()]);
      const brandNames = new Set(brands.brands.map((b) => b.brand));
      expect(brandNames.size, tag('brands not empty')).toBeGreaterThan(0);
      const orphan = products.products
        .filter((p) => !brandNames.has(p.brand))
        .map((p) => `${p.id}:${p.brand}`);
      expect(orphan, tag('referential integrity: product brands exist in brand list')).toEqual([]);
    },
  );

  test(
    'API-05 POST searchProduct returns only relevant products',
    scenario('AE-07', 'P0', { smoke: true, layer: 'api', ref: 'API5' }),
    async ({ api }) => {
      const tag = at('AE-07', 'P0');
      const { body } = await api.searchProducts('jean');
      expect(body.products.length, tag('results for "jean"')).toBeGreaterThan(0);
      // Relevance oracle: the site searches name and category; every hit must match one of them.
      const irrelevant = body.products.filter(
        (p) => !`${p.name} ${p.category.category}`.toLowerCase().includes('jean'),
      );
      expect(
        irrelevant.map((p) => p.name),
        tag('every result matches name or category'),
      ).toEqual([]);
    },
  );

  test(
    'API-06 POST searchProduct without search_product is a 400 bad request',
    scenario('AE-08', 'P1', { layer: 'api', ref: 'API6' }),
    async ({ api }) => {
      const tag = at('AE-08', 'P1');
      const { body } = await api.raw('POST', 'searchProduct');
      expect(body, tag('missing parameter rejected')).toEqual({
        responseCode: 400,
        message: 'Bad request, search_product parameter is missing in POST request.',
      });
    },
  );
});
