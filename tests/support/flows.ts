import { readFile } from 'node:fs/promises';
import type { Download, TestInfo } from '@playwright/test';
import { expect } from '../../src/fixtures/test';
import type { App } from '../../src/pages/App';
import type { CartLine } from '../../src/pages/OrderPages';
import type { UserAccount } from '../../src/data/types';
import { lineTotal, sum } from '../../src/utils/money';

/** Reusable multi-page flows. Assertions inside take a tagger so messages carry scenario + risk. */

export async function loginViaUi(app: App, user: UserAccount, tag: (w: string) => string): Promise<void> {
  await app.login.open();
  await app.login.login(user.email, user.password);
  await expect(app.header.loggedInAs, tag('logged-in banner shows account name')).toHaveText(
    `Logged in as ${user.name}`,
  );
}

export async function registerViaUi(app: App, user: UserAccount, tag: (w: string) => string): Promise<void> {
  await app.login.startSignup(user.name, user.email);
  await expect(app.signup.heading, tag('signup form opened')).toBeVisible();
  await app.signup.fillAccountDetails(user);
  await app.signup.submit();
  await expect(app.signup.accountCreated, tag('account created confirmation')).toHaveText('Account Created!');
  await app.signup.continueButton.click();
  await expect(app.header.loggedInAs, tag('new user is logged in')).toHaveText(`Logged in as ${user.name}`);
}

/** Search → details → set quantity → add. Returns the captured unit price as displayed. */
export async function addViaDetails(
  app: App,
  productName: string,
  quantity: number,
): Promise<{ name: string; unitPrice: number; quantity: number }> {
  await app.products.open();
  await app.products.search(productName);
  const listed = await app.products.readCard(productName);
  await app.products.openDetails(productName);
  const details = await app.productDetails.read();
  expect(details.name, 'details page shows the product opened from the listing').toBe(listed.name);
  expect(details.unitPrice, 'details price equals listing price').toBe(listed.unitPrice);
  await app.productDetails.addToCart(quantity, app.cartModal);
  return { name: details.name, unitPrice: details.unitPrice, quantity };
}

/**
 * Cart oracle: every line's quantity and total are correct for the captured unit price, and the
 * set of lines matches exactly what the test added (no extra/missing items).
 */
export function expectCart(
  lines: CartLine[],
  expected: Array<{ name: string; unitPrice: number; quantity: number }>,
  tag: (w: string) => string,
): void {
  expect(lines.map((l) => l.name).sort(), tag('cart contains exactly the added products')).toEqual(
    expected.map((e) => e.name).sort(),
  );
  for (const e of expected) {
    const line = lines.find((l) => l.name === e.name);
    expect(line, tag(`line present for ${e.name}`)).toBeDefined();
    expect(line?.unitPrice, tag(`${e.name} unit price unchanged in cart`)).toBe(e.unitPrice);
    expect(line?.quantity, tag(`${e.name} quantity`)).toBe(e.quantity);
    expect(line?.total, tag(`${e.name} line total = unit price x quantity`)).toBe(
      lineTotal(e.unitPrice, e.quantity),
    );
  }
}

export function expectedGrandTotal(expected: Array<{ unitPrice: number; quantity: number }>): number {
  return sum(expected.map((e) => lineTotal(e.unitPrice, e.quantity)));
}

/**
 * Invoice oracle: download event fired, file saved, non-empty, text type, and content names the
 * customer and the order total. The site's invoice is a plain-text file.
 */
export async function validateInvoice(
  download: Download,
  user: UserAccount,
  expectedTotal: number,
  testInfo: TestInfo,
  tag: (w: string) => string,
): Promise<void> {
  const path = testInfo.outputPath(download.suggestedFilename() || 'invoice.txt');
  await download.saveAs(path);
  expect(await download.failure(), tag('invoice download did not fail')).toBeNull();
  expect(download.suggestedFilename(), tag('invoice filename is a text file')).toMatch(/\.txt$/i);
  const content = await readFile(path, 'utf8');
  expect(content.length, tag('invoice is non-empty')).toBeGreaterThan(0);
  expect(content, tag('invoice addresses the customer by name')).toContain(
    `${user.address.firstName} ${user.address.lastName}`,
  );
  expect(content, tag('invoice states the order total')).toMatch(new RegExp(`\\b${expectedTotal}\\b`));
  // Invoice contains the customer name (synthetic test data) – attached for evidence.
  await testInfo.attach('invoice', { path, contentType: 'text/plain' });
}
