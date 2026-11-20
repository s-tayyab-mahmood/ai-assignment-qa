import { test, expect } from '../../src/fixtures/test';
import { PRODUCTS } from '../../src/data/catalog';
import { buildUser, dummyCard } from '../../src/data/factories';
import { CheckoutPage } from '../../src/pages/OrderPages';
import { at, scenario } from '../../src/utils/scenario';
import {
  addViaDetails,
  expectCart,
  expectedGrandTotal,
  loginViaUi,
  registerViaUi,
  validateInvoice,
} from '../support/flows';

test.describe('Checkout and orders', () => {
  test(
    'AE-15 flagship: new customer discovers products, checks out, pays and downloads a correct invoice',
    scenario('AE-15', 'P0', { smoke: true, layer: 'ui', ref: 'TC14-16' }),
    async ({ app, api, cleanup, page }, testInfo) => {
      // Evidence-based budget (needs reviewer approval – docs/ai-evidence/approvals.md): this ~20-step
      // journey took 34-52 s when passing on the live site (2026-11-19/20) and hit the 60 s test
      // timeout on 2026-11-20 while /payment was still loading. test.slow() triples the budget for
      // this one test only; step-level waits are unchanged.
      test.slow();
      const tag = at('AE-15', 'P0');
      // 1. Unique identity – no reliance on any other test.
      const user = buildUser();
      cleanup.track(user); // deleted in teardown even if a later step fails

      // 2-4. Discover two distinct products; quantity 4 on the first.
      const first = await addViaDetails(app, PRODUCTS.blueTop.name, 4);
      const second = await addViaDetails(app, PRODUCTS.menTshirt.name, 1);
      const expected = [first, second];
      await app.cart.open();
      expectCart(await app.cart.lines(), expected, tag);

      // 5. Checkout requires an account: register, then return to cart.
      await app.cart.proceedToCheckout.click();
      await app.cart.registerLoginLink.click();
      await registerViaUi(app, user, tag);
      await app.header.goToCart();
      expectCart(await app.cart.lines(), expected, tag); // cart survived registration
      await app.cart.proceedToCheckout.click();

      // 6. Addresses compared field-by-field against the source fixture.
      const want = CheckoutPage.expectedAddress(user.title, user.address);
      expect(
        await app.checkout.readAddress(app.checkout.deliveryAddress),
        tag('delivery address = fixture'),
      ).toEqual(want);
      expect(
        await app.checkout.readAddress(app.checkout.billingAddress),
        tag('billing address = fixture'),
      ).toEqual(want);
      expectCart(await app.checkout.lines(), expected, tag);
      await expect(app.checkout.totalAmount, tag('order total = sum of line totals')).toHaveText(
        `Rs. ${expectedGrandTotal(expected)}`,
      );

      // 7. Comment + invented payment data only.
      await app.checkout.comment.fill('Automated QA order – practice site, no real purchase.');
      await app.checkout.placeOrder.click();
      await app.payment.pay(dummyCard());
      await expect(app.payment.orderPlaced, tag('order placed confirmation')).toHaveText('Order Placed!');
      await expect(app.payment.confirmation, tag('order confirmed message')).toBeVisible();

      // 8. Invoice via download event.
      const download = await app.payment.downloadInvoiceFile();
      await validateInvoice(download, user, expectedGrandTotal(expected), testInfo, tag);

      // 9. Delete the disposable account through the product, then confirm via API.
      await app.header.deleteAccount();
      await expect(app.signup.accountDeleted, tag('account deleted after evidence capture')).toBeVisible();
      const after = await api.verifyLogin(user.email, user.password);
      expect(after.body.responseCode, tag('account no longer exists')).toBe(404);
      await expect(page, tag('deletion handled by the delete_account route')).toHaveURL(/delete_account/);
    },
  );

  test(
    'AE-16 checkout addresses match both the registration fixture and the API profile',
    scenario('AE-16', 'P0', { layer: 'ui', ref: 'TC23; API14' }),
    async ({ app, api, account }) => {
      const tag = at('AE-16', 'P0');
      await loginViaUi(app, account, tag);
      await addViaDetails(app, PRODUCTS.blueTop.name, 1);
      await app.cart.open();
      await app.cart.proceedToCheckout.click();

      const delivery = await app.checkout.readAddress(app.checkout.deliveryAddress);
      const billing = await app.checkout.readAddress(app.checkout.billingAddress);
      expect(delivery, tag('delivery address = fixture')).toEqual(
        CheckoutPage.expectedAddress(account.title, account.address),
      );
      expect(billing, tag('billing address = delivery address')).toEqual(delivery);

      const { body } = await api.getUserByEmail(account.email);
      const u = body.user;
      expect(delivery, tag('delivery address = API profile')).toMatchObject({
        fullName: `${u.title}. ${u.first_name} ${u.last_name}`,
        lines: [u.company, u.address1, u.address2],
        cityStateZip: `${u.city} ${u.state} ${u.zipcode}`,
        country: u.country,
      });
    },
  );

  test(
    'AE-17 invoice for a logged-in customer downloads and states the correct total',
    scenario('AE-17', 'P1', { layer: 'ui', ref: 'TC24' }),
    async ({ app, account }, testInfo) => {
      const tag = at('AE-17', 'P1');
      await loginViaUi(app, account, tag);
      const item = await addViaDetails(app, PRODUCTS.sleevelessDress.name, 2);
      await app.cart.open();
      await app.cart.proceedToCheckout.click();
      await app.checkout.placeOrder.click();
      await app.payment.pay(dummyCard());
      await expect(app.payment.orderPlaced, tag('order placed')).toBeVisible();
      const download = await app.payment.downloadInvoiceFile();
      await validateInvoice(download, account, expectedGrandTotal([item]), testInfo, tag);
    },
  );
});
