# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\cart.spec.ts >> Cart >> AE-12b unusual but site-accepted quantity (25) is calculated correctly
- Location: tests\ui\cart.spec.ts:45:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Proceed To Checkout').or(getByText('Cart is empty!')).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Proceed To Checkout').or(getByText('Cart is empty!')).first() with timeout 10000ms
  - waiting for getByText('Proceed To Checkout').or(getByText('Cart is empty!')).first()

```

```yaml
- heading "This website is under heavy load (queue full)" [level=2]
- paragraph: We're sorry, too many people are accessing this website at the same time. We're working on this problem. Please try again later.
```

# Test source

```ts
  1   | import { expect, type Download, type Locator, type Page } from '@playwright/test';
  2   | import type { Address, DummyCard } from '../data/types';
  3   | import { parseRupees } from '../utils/money';
  4   | 
  5   | export interface CartLine {
  6   |   productId: string;
  7   |   name: string;
  8   |   unitPrice: number;
  9   |   quantity: number;
  10  |   total: number;
  11  | }
  12  | 
  13  | /**
  14  |  * Reads cart-style tables (cart page and checkout review use the same row markup).
  15  |  * Exception to role-first policy: the table has no header association for cells, so class
  16  |  * names (.cart_price etc.) are the most stable hooks the site exposes.
  17  |  */
  18  | async function readLines(rows: Locator): Promise<CartLine[]> {
  19  |   const lines: CartLine[] = [];
  20  |   for (const row of await rows.all()) {
  21  |     const id = (await row.getAttribute('id')) ?? '';
  22  |     lines.push({
  23  |       productId: id.replace('product-', ''),
  24  |       name: ((await row.locator('.cart_description h4').textContent()) ?? '').trim(),
  25  |       unitPrice: parseRupees(await row.locator('.cart_price').textContent()),
  26  |       quantity: Number(((await row.locator('.cart_quantity').textContent()) ?? '').trim()),
  27  |       total: parseRupees(await row.locator('.cart_total_price').textContent()),
  28  |     });
  29  |   }
  30  |   return lines;
  31  | }
  32  | 
  33  | /** /view_cart */
  34  | export class CartPage {
  35  |   readonly rows: Locator;
  36  |   readonly emptyMessage: Locator;
  37  |   readonly proceedToCheckout: Locator;
  38  |   readonly registerLoginLink: Locator;
  39  | 
  40  |   constructor(private readonly page: Page) {
  41  |     this.rows = page.locator('#cart_info_table tbody tr[id^="product-"]');
  42  |     this.emptyMessage = page.getByText('Cart is empty!');
  43  |     this.proceedToCheckout = page.getByText('Proceed To Checkout');
  44  |     this.registerLoginLink = page.locator('#checkoutModal').getByRole('link', { name: 'Register / Login' });
  45  |   }
  46  | 
  47  |   async open(): Promise<void> {
  48  |     await this.page.goto('/view_cart', { waitUntil: 'domcontentloaded' });
  49  |     await this.waitReady();
  50  |   }
  51  | 
  52  |   /** The cart is ready when it shows either its checkout control or the empty-cart message. */
  53  |   async waitReady(): Promise<void> {
  54  |     await expect(this.page).toHaveURL(/\/view_cart/);
> 55  |     await expect(this.proceedToCheckout.or(this.emptyMessage).first()).toBeVisible();
      |                                                                        ^ Error: expect(locator).toBeVisible() failed
  56  |   }
  57  | 
  58  |   row(name: string): Locator {
  59  |     return this.rows.filter({ has: this.page.locator('.cart_description h4', { hasText: name }) });
  60  |   }
  61  | 
  62  |   async lines(): Promise<CartLine[]> {
  63  |     await this.waitReady(); // never read rows before the cart page has rendered
  64  |     return readLines(this.rows);
  65  |   }
  66  | 
  67  |   async remove(name: string): Promise<void> {
  68  |     const row = this.row(name);
  69  |     // Exception: delete control is an icon-only <a class="cart_quantity_delete">.
  70  |     await row.locator('.cart_quantity_delete').click();
  71  |     await expect(row).toHaveCount(0);
  72  |   }
  73  | }
  74  | 
  75  | /** /checkout */
  76  | export class CheckoutPage {
  77  |   readonly deliveryAddress: Locator;
  78  |   readonly billingAddress: Locator;
  79  |   readonly reviewRows: Locator;
  80  |   readonly totalAmount: Locator;
  81  |   readonly comment: Locator;
  82  |   readonly placeOrder: Locator;
  83  | 
  84  |   constructor(private readonly page: Page) {
  85  |     this.deliveryAddress = page.locator('#address_delivery');
  86  |     this.billingAddress = page.locator('#address_invoice');
  87  |     this.reviewRows = page.locator('#cart_info tbody tr[id^="product-"]');
  88  |     // The "Total Amount" summary row is the last row in the review table.
  89  |     this.totalAmount = page
  90  |       .locator('#cart_info tbody tr')
  91  |       .filter({ hasText: 'Total Amount' })
  92  |       .locator('.cart_total_price');
  93  |     this.comment = page.locator('textarea[name="message"]');
  94  |     this.placeOrder = page.getByRole('link', { name: 'Place Order' });
  95  |   }
  96  | 
  97  |   async lines(): Promise<CartLine[]> {
  98  |     return readLines(this.reviewRows);
  99  |   }
  100 | 
  101 |   /** Structured read of an address block, so tests compare fields rather than "text present". */
  102 |   async readAddress(block: Locator): Promise<Record<string, string | string[]>> {
  103 |     const text = async (sel: string) => ((await block.locator(sel).first().textContent()) ?? '').trim();
  104 |     const address1Lines = (await block.locator('li.address_address1').allTextContents()).map((t) => t.trim());
  105 |     return {
  106 |       fullName: await text('li.address_firstname'),
  107 |       lines: address1Lines,
  108 |       cityStateZip: (await text('li.address_city')).replace(/\s+/g, ' '),
  109 |       country: await text('li.address_country_name'),
  110 |       phone: await text('li.address_phone'),
  111 |     };
  112 |   }
  113 | 
  114 |   static expectedAddress(title: string, a: Address): Record<string, string | string[]> {
  115 |     return {
  116 |       fullName: `${title}. ${a.firstName} ${a.lastName}`,
  117 |       lines: [a.company, a.address1, a.address2],
  118 |       cityStateZip: `${a.city} ${a.state} ${a.zipcode}`,
  119 |       country: a.country,
  120 |       phone: a.mobileNumber,
  121 |     };
  122 |   }
  123 | }
  124 | 
  125 | /** /payment and /payment_done */
  126 | export class PaymentPage {
  127 |   readonly orderPlaced: Locator;
  128 |   readonly confirmation: Locator;
  129 |   readonly downloadInvoice: Locator;
  130 | 
  131 |   constructor(private readonly page: Page) {
  132 |     this.orderPlaced = page.getByTestId('order-placed');
  133 |     this.confirmation = page.getByText('Congratulations! Your order has been confirmed!');
  134 |     this.downloadInvoice = page.getByRole('link', { name: 'Download Invoice' });
  135 |   }
  136 | 
  137 |   async pay(card: DummyCard): Promise<void> {
  138 |     await this.page.getByTestId('name-on-card').fill(card.nameOnCard);
  139 |     await this.page.getByTestId('card-number').fill(card.number);
  140 |     await this.page.getByTestId('cvc').fill(card.cvc);
  141 |     await this.page.getByTestId('expiry-month').fill(card.expiryMonth);
  142 |     await this.page.getByTestId('expiry-year').fill(card.expiryYear);
  143 |     await this.page.getByTestId('pay-button').click();
  144 |   }
  145 | 
  146 |   /** Captures the invoice via Playwright's download event (no filesystem guessing). */
  147 |   async downloadInvoiceFile(): Promise<Download> {
  148 |     const [download] = await Promise.all([this.page.waitForEvent('download'), this.downloadInvoice.click()]);
  149 |     return download;
  150 |   }
  151 | }
  152 | 
  153 | /** /contact_us */
  154 | export class ContactPage {
  155 |   readonly heading: Locator;
```