import { test, expect } from '../../src/fixtures/test';
import { buildUser } from '../../src/data/factories';
import { at, scenario } from '../../src/utils/scenario';
import { loginViaUi, registerViaUi } from '../support/flows';

test.describe('Authentication', () => {
  test(
    'AE-01 new customer can register, is persisted, and can delete the account',
    scenario('AE-01', 'P0', { smoke: true, layer: 'ui', ref: 'TC1' }),
    async ({ app, api, cleanup }) => {
      const tag = at('AE-01', 'P0');
      const user = buildUser();
      cleanup.track(user); // safety net if the test fails before UI deletion

      await app.login.open();
      await registerViaUi(app, user, tag);

      await test.step('backend persisted the exact profile entered in the UI', async () => {
        const { body } = await api.getUserByEmail(user.email);
        expect(body.user, tag('persisted profile matches form input')).toMatchObject({
          name: user.name,
          email: user.email,
          first_name: user.address.firstName,
          last_name: user.address.lastName,
          address1: user.address.address1,
          city: user.address.city,
          zipcode: user.address.zipcode,
          country: user.address.country,
        });
      });

      await test.step('delete account through the UI', async () => {
        await app.header.deleteAccount();
        await expect(app.signup.accountDeleted, tag('account deleted confirmation')).toHaveText(
          'Account Deleted!',
        );
        const after = await api.verifyLogin(user.email, user.password);
        expect(after.body.responseCode, tag('credentials no longer valid after deletion')).toBe(404);
      });
    },
  );

  test(
    'AE-02 registered customer can log in and log out',
    scenario('AE-02', 'P0', { smoke: true, layer: 'ui', ref: 'TC2,TC4' }),
    async ({ app, account, page }) => {
      const tag = at('AE-02', 'P0');
      await loginViaUi(app, account, tag);
      await expect(app.header.link('Logout'), tag('logout control offered when authenticated')).toBeVisible();

      await app.header.logout();
      await expect(page, tag('logout returns to login page')).toHaveURL(/\/login$/);
      await expect(app.header.loggedInAs, tag('no authenticated banner after logout')).toHaveCount(0);
      await expect(app.header.link('Signup / Login'), tag('login link restored')).toBeVisible();
    },
  );

  test(
    'AE-03a login is rejected for a wrong password on an existing account',
    scenario('AE-03', 'P0', { layer: 'ui', ref: 'TC3' }),
    async ({ app, account }) => {
      const tag = at('AE-03', 'P0');
      await app.login.open();
      await app.login.login(account.email, `${account.password}-wrong`);
      await expect(app.login.invalidCredentialsError, tag('generic invalid-credentials error')).toBeVisible();
      await expect(app.header.loggedInAs, tag('user is not authenticated')).toHaveCount(0);
    },
  );

  test(
    'AE-03b login is rejected for an unregistered email (UI + API agree)',
    scenario('AE-03', 'P0', { layer: 'ui', ref: 'TC3; API10' }),
    async ({ app, api }) => {
      const tag = at('AE-03', 'P0');
      const ghost = buildUser();
      await app.login.open();
      await app.login.login(ghost.email, ghost.password);
      await expect(app.login.invalidCredentialsError, tag('invalid-credentials error')).toBeVisible();
      await expect(app.header.loggedInAs, tag('user is not authenticated')).toHaveCount(0);

      const { body } = await api.verifyLogin(ghost.email, ghost.password);
      expect(body, tag('API reports user not found')).toEqual({
        responseCode: 404,
        message: 'User not found!',
      });
    },
  );

  test(
    'AE-04 signup with an already-registered email is rejected',
    scenario('AE-04', 'P1', { layer: 'ui', ref: 'TC5' }),
    async ({ app, account }) => {
      const tag = at('AE-04', 'P1');
      await app.login.open();
      await app.login.startSignup('Duplicate Attempt', account.email);
      await expect(app.login.duplicateEmailError, tag('duplicate email error shown')).toBeVisible();
      await expect(app.signup.heading, tag('account form is not offered')).toHaveCount(0);
    },
  );
});
