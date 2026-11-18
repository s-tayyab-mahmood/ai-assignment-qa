import { writeFile } from 'node:fs/promises';
import { test, expect } from '../../src/fixtures/test';
import { PRODUCTS } from '../../src/data/catalog';
import { buildUser } from '../../src/data/factories';
import { at, scenario } from '../../src/utils/scenario';

test.describe('Ancillary features', () => {
  test(
    'AE-18 customer can submit a product review',
    scenario('AE-18', 'P1', { layer: 'ui', ref: 'TC21' }),
    async ({ app }) => {
      const tag = at('AE-18', 'P1');
      const reviewer = buildUser();
      await app.products.open();
      await app.products.openDetails(PRODUCTS.blueTop.name);
      await expect(app.productDetails.reviewHeading, tag('review section offered')).toBeVisible();
      await app.productDetails.submitReview(
        reviewer.name,
        reviewer.email,
        'Automated QA review – fits as described.',
      );
      await expect(
        app.page.getByText('Thank you for your review.'),
        tag('review acknowledged'),
      ).toBeVisible();
    },
  );

  test(
    'AE-19 contact form accepts a message with a file attachment',
    scenario('AE-19', 'P1', { layer: 'ui', ref: 'TC6' }),
    async ({ app }, testInfo) => {
      const tag = at('AE-19', 'P1');
      const sender = buildUser();
      const filePath = testInfo.outputPath('qa-upload.txt');
      await writeFile(filePath, 'Synthetic attachment for automated QA. Contains no personal data.\n');

      await app.header.goToContact();
      await expect(app.contact.heading, tag('contact form shown')).toBeVisible();
      await app.contact.submit({
        name: sender.name,
        email: sender.email,
        subject: 'Automated QA contact test',
        message: 'This is an automated test message from a practice-site QA suite.',
        filePath,
      });
      await expect(app.contact.success, tag('submission success message')).toHaveText(
        'Success! Your details have been submitted successfully.',
      );
    },
  );

  test(
    'AE-20 newsletter subscription works from the home page and the cart page',
    scenario('AE-20', 'P2', { layer: 'ui', ref: 'TC10,TC11' }),
    async ({ app }) => {
      const tag = at('AE-20', 'P2');
      for (const open of [() => app.home.open(), () => app.cart.open()]) {
        await open();
        await expect(app.footer.heading, tag('subscription widget present')).toBeVisible();
        await app.footer.subscribe(buildUser().email);
        await expect(app.footer.successMessage, tag('subscription confirmed')).toBeVisible();
      }
    },
  );

  test(
    'AE-21 a recommended item can be added to the cart',
    scenario('AE-21', 'P2', { layer: 'ui', ref: 'TC22' }),
    async ({ app }) => {
      const tag = at('AE-21', 'P2');
      await app.home.open();
      await app.home.recommendedHeading.scrollIntoViewIfNeeded();
      await expect(app.home.recommendedHeading, tag('recommended section shown')).toBeVisible();

      const item = app.home.recommendedActiveItems.first();
      const name = ((await item.locator('p').textContent()) ?? '').trim();
      expect(name, tag('recommended item has a name')).not.toBe('');
      await item.getByText('Add to cart').click();
      await app.cartModal.viewCart();

      const lines = await app.cart.lines();
      expect(
        lines.map((l) => l.name),
        tag('recommended item is in the cart'),
      ).toContain(name);
    },
  );
});
