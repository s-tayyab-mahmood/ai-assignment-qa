# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\checkout.spec.ts >> Checkout and orders >> AE-15 flagship: new customer discovers products, checks out, pays and downloads a correct invoice
- Location: tests\ui\checkout.spec.ts:16:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#cartModal').getByRole('heading', { name: 'Added!' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('#cartModal').getByRole('heading', { name: 'Added!' }) with timeout 10000ms
  - waiting for locator('#cartModal').getByRole('heading', { name: 'Added!' })

```

```yaml
- banner:
  - link "Website for automation practice":
    - /url: /
    - img "Website for automation practice"
  - list:
    - listitem:
      - link " Home":
        - /url: /
    - listitem:
      - link " Products":
        - /url: /products
    - listitem:
      - link " Cart":
        - /url: /view_cart
    - listitem:
      - link " Signup / Login":
        - /url: /login
    - listitem:
      - link " Test Cases":
        - /url: /test_cases
    - listitem:
      - link " API Testing":
        - /url: /api_list
    - listitem:
      - link " Video Tutorials":
        - /url: https://www.youtube.com/c/AutomationExercise
    - listitem:
      - link " Contact us":
        - /url: /contact_us
- heading "Category" [level=2]
- heading " Women" [level=4]:
  - link " Women":
    - /url: "#Women"
- heading " Men" [level=4]:
  - link " Men":
    - /url: "#Men"
- heading " Kids" [level=4]:
  - link " Kids":
    - /url: "#Kids"
- heading "Brands" [level=2]
- list:
  - listitem:
    - link "(6) Polo":
      - /url: /brand_products/Polo
  - listitem:
    - link "(5) H&M":
      - /url: /brand_products/H&M
  - listitem:
    - link "(5) Madame":
      - /url: /brand_products/Madame
  - listitem:
    - link "(3) Mast & Harbour":
      - /url: /brand_products/Mast & Harbour
  - listitem:
    - link "(4) Babyhug":
      - /url: /brand_products/Babyhug
  - listitem:
    - link "(3) Allen Solly Junior":
      - /url: /brand_products/Allen Solly Junior
  - listitem:
    - link "(3) Kookie Kids":
      - /url: /brand_products/Kookie Kids
  - listitem:
    - link "(5) Biba":
      - /url: /brand_products/Biba
- img "ecommerce website products"
- img "ecommerce website products"
- heading "Blue Top" [level=2]
- paragraph: "Category: Women > Tops"
- img "ecommerce website products"
- text: "Rs. 500 Quantity:"
- spinbutton: "4"
- button " Add to cart"
- paragraph: "Availability: In Stock"
- paragraph: "Condition: New"
- paragraph: "Brand: Polo"
- list:
  - listitem:
    - link "Write Your Review":
      - /url: "#reviews"
- textbox "Your Name"
- textbox "Email Address"
- textbox "Add Review Here!"
- button "Submit"
- contentinfo:
  - heading "Subscription" [level=2]
  - textbox "Your email address"
  - button ""
  - paragraph: Get the most recent updates from our site and be updated your self...
  - paragraph: Copyright © 2021 All rights reserved
```

# Test source

```ts
  30  |     this.sidebar = page.locator('.left-sidebar');
  31  |     this.brandsPanel = page.locator('.brands_products');
  32  |   }
  33  | 
  34  |   async open(): Promise<void> {
  35  |     await this.page.goto('/products', { waitUntil: 'domcontentloaded' });
  36  |     await expect(this.allProductsHeading).toBeVisible();
  37  |   }
  38  | 
  39  |   async search(term: string): Promise<void> {
  40  |     await this.searchInput.fill(term);
  41  |     await this.searchButton.click();
  42  |     await expect(this.searchedHeading).toBeVisible();
  43  |   }
  44  | 
  45  |   card(name: string): Locator {
  46  |     return this.cards.filter({
  47  |       has: this.page.locator('.productinfo p', { hasText: new RegExp(`^${escapeRe(name)}$`) }),
  48  |     });
  49  |   }
  50  | 
  51  |   async cardNames(): Promise<string[]> {
  52  |     return (await this.cards.locator('.productinfo p').allTextContents()).map((t) => t.trim());
  53  |   }
  54  | 
  55  |   async readCard(name: string): Promise<ProductCard> {
  56  |     const card = this.card(name).first();
  57  |     const price = await card.locator('.productinfo h2').textContent();
  58  |     return { name, unitPrice: parseRupees(price) };
  59  |   }
  60  | 
  61  |   /** Adds from the listing (quantity 1) and dismisses the confirmation modal. */
  62  |   async addToCartFromListing(name: string, modal: CartModal): Promise<void> {
  63  |     await this.card(name).first().locator('.productinfo').getByText('Add to cart').click();
  64  |     await modal.continueShopping();
  65  |   }
  66  | 
  67  |   async openDetails(name: string): Promise<void> {
  68  |     await this.card(name).first().getByRole('link', { name: 'View Product' }).click();
  69  |   }
  70  | 
  71  |   async openCategory(parent: string, child: string): Promise<void> {
  72  |     await this.sidebar.getByRole('link', { name: parent, exact: false }).first().click();
  73  |     await this.sidebar.locator(`#${parent}`).getByRole('link', { name: child }).click();
  74  |   }
  75  | 
  76  |   async openBrand(brand: string): Promise<void> {
  77  |     await this.brandsPanel.getByRole('link', { name: new RegExp(`${escapeRe(brand)}$`) }).click();
  78  |   }
  79  | }
  80  | 
  81  | /** /product_details/:id */
  82  | export class ProductDetailsPage {
  83  |   readonly info: Locator;
  84  |   readonly name: Locator;
  85  |   readonly price: Locator;
  86  |   readonly quantity: Locator;
  87  |   readonly addToCartButton: Locator;
  88  |   readonly reviewHeading: Locator;
  89  | 
  90  |   constructor(private readonly page: Page) {
  91  |     this.info = page.locator('.product-information');
  92  |     this.name = this.info.getByRole('heading', { level: 2 });
  93  |     // Exception: price is an unlabeled <span>; first span>span within product info.
  94  |     this.price = this.info.locator('span > span').first();
  95  |     // Exception: <label>Quantity:</label> is not associated with the input (no `for`).
  96  |     this.quantity = page.locator('#quantity');
  97  |     this.addToCartButton = this.info.getByRole('button', { name: 'Add to cart' });
  98  |     this.reviewHeading = page.getByRole('link', { name: 'Write Your Review' });
  99  |   }
  100 | 
  101 |   async read(): Promise<ProductCard> {
  102 |     const name = (await this.name.textContent())?.trim() ?? '';
  103 |     return { name, unitPrice: parseRupees(await this.price.textContent()) };
  104 |   }
  105 | 
  106 |   async addToCart(quantity: number, modal: CartModal): Promise<void> {
  107 |     await this.quantity.fill(String(quantity));
  108 |     await expect(this.quantity).toHaveValue(String(quantity));
  109 |     await this.addToCartButton.click();
  110 |     await modal.continueShopping();
  111 |   }
  112 | 
  113 |   async submitReview(name: string, email: string, text: string): Promise<void> {
  114 |     await this.page.getByPlaceholder('Your Name').fill(name);
  115 |     await this.page.getByPlaceholder('Email Address', { exact: true }).fill(email);
  116 |     await this.page.getByPlaceholder('Add Review Here!').fill(text);
  117 |     await this.page.getByRole('button', { name: 'Submit' }).click();
  118 |   }
  119 | }
  120 | 
  121 | /** "Added!" modal shown after any add-to-cart. */
  122 | export class CartModal {
  123 |   readonly title: Locator;
  124 | 
  125 |   constructor(private readonly page: Page) {
  126 |     this.title = page.locator('#cartModal').getByRole('heading', { name: 'Added!' });
  127 |   }
  128 | 
  129 |   async continueShopping(): Promise<void> {
> 130 |     await expect(this.title).toBeVisible();
      |                              ^ Error: expect(locator).toBeVisible() failed
  131 |     await this.page.getByRole('button', { name: 'Continue Shopping' }).click();
  132 |     await expect(this.title).toBeHidden();
  133 |   }
  134 | 
  135 |   async viewCart(): Promise<void> {
  136 |     await expect(this.title).toBeVisible();
  137 |     await this.page.locator('#cartModal').getByRole('link', { name: 'View Cart' }).click();
  138 |   }
  139 | }
  140 | 
  141 | function escapeRe(s: string): string {
  142 |   return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  143 | }
  144 | 
```