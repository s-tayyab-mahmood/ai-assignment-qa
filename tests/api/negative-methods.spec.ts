import { test, expect } from '../../src/fixtures/test';
import { at, scenario } from '../../src/utils/scenario';

/** AE-23: unsupported HTTP methods are rejected with a logical 405 and no data leakage. */
const cases = [
  { id: 'API-02', method: 'POST', path: 'productsList', ref: 'API2' },
  { id: 'API-04', method: 'PUT', path: 'brandsList', ref: 'API4' },
  { id: 'API-09', method: 'DELETE', path: 'verifyLogin', ref: 'API9' },
] as const;

test.describe('API – method validation', () => {
  for (const c of cases) {
    test(
      `${c.id} ${c.method} ${c.path} is rejected as method-not-supported`,
      scenario('AE-23', 'P1', { layer: 'api', ref: c.ref }),
      async ({ api }) => {
        const tag = at('AE-23', 'P1');
        const { body } = await api.raw(c.method, c.path);
        // Strict equality also proves no catalogue/user data is returned alongside the error.
        expect(body, tag(`${c.method} ${c.path} -> 405`)).toEqual({
          responseCode: 405,
          message: 'This request method is not supported.',
        });
      },
    );
  }
});
