import { expect, type Download, type Locator, type Page } from '@playwright/test';
import type { Address, DummyCard } from '../data/types';
import { parseRupees } from '../utils/money';

export interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

/**
 * Reads cart-style tables (cart page and checkout review use the same row markup).
 * Exception to role-first policy: the table has no header association for cells, so class
 * names (.cart_price etc.) are the most stable hooks the site exposes.
 */
async function readLines(rows: Locator): Promise<CartLine[]> {
  const lines: CartLine[] = [];
  for (const row of await rows.all()) {
    const id = (await row.getAttribute('id')) ?? '';
    lines.push({
      productId: id.replace('product-', ''),
      name: ((await row.locator('.cart_description h4').textContent()) ?? '').trim(),
      unitPrice: parseRupees(await row.locator('.cart_price').textContent()),
      quantity: Number(((await row.locator('.cart_quantity').textContent()) ?? '').trim()),
      total: parseRupees(await row.locator('.cart_total_price').textContent()),
    });
  }
  return lines;
}

/** /view_cart */
export class CartPage {
  readonly rows: Locator;
  readonly emptyMessage: Locator;
  readonly proceedToCheckout: Locator;
  readonly registerLoginLink: Locator;

  constructor(private readonly page: Page) {
    this.rows = page.locator('#cart_info_table tbody tr[id^="product-"]');
    this.emptyMessage = page.getByText('Cart is empty!');
    this.proceedToCheckout = page.getByText('Proceed To Checkout');
    this.registerLoginLink = page.locator('#checkoutModal').getByRole('link', { name: 'Register / Login' });
  }

  async open(): Promise<void> {
    await this.page.goto('/view_cart', { waitUntil: 'domcontentloaded' });
    await this.waitReady();
  }

  /** The cart is ready when it shows either its checkout control or the empty-cart message. */
  async waitReady(): Promise<void> {
    await expect(this.page).toHaveURL(/\/view_cart/);
    await expect(this.proceedToCheckout.or(this.emptyMessage).first()).toBeVisible();
  }

  row(name: string): Locator {
    return this.rows.filter({ has: this.page.locator('.cart_description h4', { hasText: name }) });
  }

  async lines(): Promise<CartLine[]> {
    await this.waitReady(); // never read rows before the cart page has rendered
    return readLines(this.rows);
  }

  async remove(name: string): Promise<void> {
    const row = this.row(name);
    // Exception: delete control is an icon-only <a class="cart_quantity_delete">.
    await row.locator('.cart_quantity_delete').click();
    await expect(row).toHaveCount(0);
  }
}

/** /checkout */
export class CheckoutPage {
  readonly deliveryAddress: Locator;
  readonly billingAddress: Locator;
  readonly reviewRows: Locator;
  readonly totalAmount: Locator;
  readonly comment: Locator;
  readonly placeOrder: Locator;

  constructor(private readonly page: Page) {
    this.deliveryAddress = page.locator('#address_delivery');
    this.billingAddress = page.locator('#address_invoice');
    this.reviewRows = page.locator('#cart_info tbody tr[id^="product-"]');
    // The "Total Amount" summary row is the last row in the review table.
    this.totalAmount = page
      .locator('#cart_info tbody tr')
      .filter({ hasText: 'Total Amount' })
      .locator('.cart_total_price');
    this.comment = page.locator('textarea[name="message"]');
    this.placeOrder = page.getByRole('link', { name: 'Place Order' });
  }

  /**
   * The checkout page is fully parsed (DOMContentLoaded) and the review table has a total row.
   * Required before any non-retrying read (allTextContents / all()): those read whatever exists at
   * that instant. On 2026-11-19 a slow site let readAddress() return lines: [] while the other,
   * auto-waiting fields were populated a moment later.
   */
  async waitReady(): Promise<void> {
    await expect(this.page).toHaveURL(/\/checkout/);
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.totalAmount).toBeVisible();
  }

  async lines(): Promise<CartLine[]> {
    await this.waitReady();
    return readLines(this.reviewRows);
  }

  /** Structured read of an address block, so tests compare fields rather than "text present". */
  async readAddress(block: Locator): Promise<Record<string, string | string[]>> {
    await this.waitReady();
    // The phone line is the last item of the block: once visible, the whole block is rendered.
    await expect(block.locator('li.address_phone')).toBeVisible();
    const text = async (sel: string) => ((await block.locator(sel).first().textContent()) ?? '').trim();
    const address1Lines = (await block.locator('li.address_address1').allTextContents()).map((t) => t.trim());
    return {
      fullName: await text('li.address_firstname'),
      lines: address1Lines,
      cityStateZip: (await text('li.address_city')).replace(/\s+/g, ' '),
      country: await text('li.address_country_name'),
      phone: await text('li.address_phone'),
    };
  }

  static expectedAddress(title: string, a: Address): Record<string, string | string[]> {
    return {
      fullName: `${title}. ${a.firstName} ${a.lastName}`,
      lines: [a.company, a.address1, a.address2],
      cityStateZip: `${a.city} ${a.state} ${a.zipcode}`,
      country: a.country,
      phone: a.mobileNumber,
    };
  }
}

/** /payment and /payment_done */
export class PaymentPage {
  readonly orderPlaced: Locator;
  readonly confirmation: Locator;
  readonly downloadInvoice: Locator;

  constructor(private readonly page: Page) {
    this.orderPlaced = page.getByTestId('order-placed');
    this.confirmation = page.getByText('Congratulations! Your order has been confirmed!');
    this.downloadInvoice = page.getByRole('link', { name: 'Download Invoice' });
  }

  async pay(card: DummyCard): Promise<void> {
    await this.page.getByTestId('name-on-card').fill(card.nameOnCard);
    await this.page.getByTestId('card-number').fill(card.number);
    await this.page.getByTestId('cvc').fill(card.cvc);
    await this.page.getByTestId('expiry-month').fill(card.expiryMonth);
    await this.page.getByTestId('expiry-year').fill(card.expiryYear);
    await this.page.getByTestId('pay-button').click();
  }

  /** Captures the invoice via Playwright's download event (no filesystem guessing). */
  async downloadInvoiceFile(): Promise<Download> {
    const [download] = await Promise.all([this.page.waitForEvent('download'), this.downloadInvoice.click()]);
    return download;
  }
}

/** /contact_us */
export class ContactPage {
  readonly heading: Locator;
  readonly success: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Get In Touch' });
    this.success = page.locator('#contact-page .status.alert-success');
  }

  async submit(input: {
    name: string;
    email: string;
    subject: string;
    message: string;
    filePath: string;
  }): Promise<void> {
    await this.page.getByTestId('name').fill(input.name);
    await this.page.getByTestId('email').fill(input.email);
    await this.page.getByTestId('subject').fill(input.subject);
    await this.page.getByTestId('message').fill(input.message);
    // Exception: unlabeled file input; name attribute is the stable hook.
    await this.page.locator('input[name="upload_file"]').setInputFiles(input.filePath);
    // The site asks for confirmation with window.confirm(); accept exactly this one dialog.
    this.page.once('dialog', (dialog) => void dialog.accept());
    await this.page.getByTestId('submit-button').click();
  }
}

/** Home page sections used by ancillary scenarios. */
export class HomePage {
  readonly recommendedHeading: Locator;
  readonly recommendedActiveItems: Locator;

  constructor(private readonly page: Page) {
    this.recommendedHeading = page.getByRole('heading', { name: 'recommended items' });
    // Exception: carousel items have no roles; restrict to the visible (active) slide.
    this.recommendedActiveItems = page.locator('#recommended-item-carousel .item.active .productinfo');
  }

  async open(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }
}
