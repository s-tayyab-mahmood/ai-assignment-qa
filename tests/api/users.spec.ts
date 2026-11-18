import { test, expect } from '../../src/fixtures/test';
import { buildUser } from '../../src/data/factories';
import { at, scenario } from '../../src/utils/scenario';

test.describe('API – login validation (AE-05)', () => {
  test(
    'API-07 verifyLogin with valid credentials reports user exists',
    scenario('AE-05', 'P1', { smoke: true, layer: 'api', ref: 'API7' }),
    async ({ api, account }) => {
      const tag = at('AE-05', 'P1');
      const { body } = await api.verifyLogin(account.email, account.password);
      expect(body, tag('valid login')).toEqual({ responseCode: 200, message: 'User exists!' });
    },
  );

  test(
    'API-08 verifyLogin without email is a 400 bad request',
    scenario('AE-05', 'P1', { layer: 'api', ref: 'API8' }),
    async ({ api }) => {
      const tag = at('AE-05', 'P1');
      const { body } = await api.verifyLogin(undefined, 'irrelevant');
      expect(body, tag('missing email rejected')).toEqual({
        responseCode: 400,
        message: 'Bad request, email or password parameter is missing in POST request.',
      });
    },
  );

  test(
    'API-10 verifyLogin with wrong password for a real account is 404, not a leak',
    scenario('AE-05', 'P1', { layer: 'api', ref: 'API10' }),
    async ({ api, account }) => {
      const tag = at('AE-05', 'P1');
      const { body } = await api.verifyLogin(account.email, `${account.password}x`);
      // Same response as an unknown user: the API must not reveal that the email exists.
      expect(body, tag('wrong password indistinguishable from unknown user')).toEqual({
        responseCode: 404,
        message: 'User not found!',
      });
    },
  );
});

test.describe('API – account lifecycle (AE-22)', () => {
  test(
    'API-11..14 create, read, update and delete an account with state verified at each step',
    scenario('AE-22', 'P1', { layer: 'api', ref: 'API11-14' }),
    async ({ api, cleanup }) => {
      const tag = at('AE-22', 'P1');
      const user = buildUser();
      cleanup.track(user);

      await test.step('create', async () => {
        const { body } = await api.createAccount(user);
        expect(body, tag('created')).toEqual({ responseCode: 201, message: 'User created!' });
      });

      await test.step('duplicate create is rejected', async () => {
        const { body } = await api.createAccount(user);
        expect(body, tag('duplicate email rejected')).toEqual({
          responseCode: 400,
          message: 'Email already exists!',
        });
      });

      await test.step('read back', async () => {
        const { body } = await api.getUserByEmail(user.email);
        expect(body.user, tag('read-back equals created profile')).toMatchObject({
          name: user.name,
          email: user.email,
          first_name: user.address.firstName,
          last_name: user.address.lastName,
          city: user.address.city,
          country: user.address.country,
        });
      });

      const updated = { ...user, address: { ...user.address, city: 'Ottawa', address1: '1 Updated Road' } };

      await test.step('update', async () => {
        const { body } = await api.updateAccount(updated);
        expect(body, tag('updated')).toEqual({ responseCode: 200, message: 'User updated!' });
        const { body: after } = await api.getUserByEmail(user.email);
        expect(after.user, tag('update persisted')).toMatchObject({
          city: 'Ottawa',
          address1: '1 Updated Road',
        });
      });

      await test.step('delete', async () => {
        const { body } = await api.deleteAccount(user.email, user.password);
        expect(body, tag('deleted')).toEqual({ responseCode: 200, message: 'Account deleted!' });
        const { body: gone } = await api.raw(
          'GET',
          `getUserDetailByEmail?email=${encodeURIComponent(user.email)}`,
        );
        expect(gone.responseCode, tag('read after delete returns 404')).toBe(404);
      });
    },
  );
});
