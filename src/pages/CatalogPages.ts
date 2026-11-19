import { expect, type Locator, type Page } from '@playwright/test';
import { parseRupees } from '../utils/money';

export interface ProductCard {
  name: string;
  unitPrice: number;
}

/** /products, search results, category and brand listings (they share one product grid). */
export class ProductsPage {
  readonly allProductsHeading: Locator;
  readonly searchedHeading: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  /**
   * Exception to role-first policy: product cards are plain <div>s with no landmark/role. The
   * `.features_items .productinfo` structure is the stable container shared by all listings.
   */
  readonly cards: Locator;
  readonly sidebar: Locator;
  readonly brandsPanel: Locator;

  constructor(private readonly page: Page) {
    this.allProductsHeading = page.getByRole('heading', { name: 'All Products' });
    this.searchedHeading = page.getByRole('heading', { name: 'Searched Products' });
    this.searchInput = page.getByPlaceholder('Search Product');
    // Exception: icon-only submit button without accessible name.
    this.searchButton = page.locator('#submit_search');
    this.cards = page.locator('.features_items .product-image-wrapper');
    this.sidebar = page.locator('.left-sidebar');
    this.brandsPanel = page.locator('.brands_products');
  }

  async open(): Promise<void> {
    await this.page.goto('/products', { waitUntil: 'domcontentloaded' });
    await expect(this.allProductsHeading).toBeVisible();
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.searchButton.click();
    await expect(this.searchedHeading).toBeVisible();
  }

  card(name: string): Locator {
    return this.cards.filter({
      has: this.page.locator('.productinfo p', { hasText: new RegExp(`^${escapeRe(name)}$`) }),
    });
  }

  async cardNames(): Promise<string[]> {
    return (await this.cards.locator('.productinfo p').allTextContents()).map((t) => t.trim());
  }

  async readCard(name: string): Promise<ProductCard> {
    const card = this.card(name).first();
    const price = await card.locator('.productinfo h2').textContent();
    return { name, unitPrice: parseRupees(price) };
  }

  /** Adds from the listing (quantity 1) and dismisses the confirmation modal. */
  async addToCartFromListing(name: string, modal: CartModal): Promise<void> {
    await this.card(name).first().locator('.productinfo').getByText('Add to cart').click();
    await modal.continueShopping();
  }

  async openDetails(name: string): Promise<void> {
    await this.card(name).first().getByRole('link', { name: 'View Product' }).click();
  }

  async openCategory(parent: string, child: string): Promise<void> {
    await this.sidebar.getByRole('link', { name: parent, exact: false }).first().click();
    await this.sidebar.locator(`#${parent}`).getByRole('link', { name: child }).click();
  }

  async openBrand(brand: string): Promise<void> {
    await this.brandsPanel.getByRole('link', { name: new RegExp(`${escapeRe(brand)}$`) }).click();
  }
}

/** /product_details/:id */
export class ProductDetailsPage {
  readonly info: Locator;
  readonly name: Locator;
  readonly price: Locator;
  readonly quantity: Locator;
  readonly addToCartButton: Locator;
  readonly reviewHeading: Locator;

  constructor(private readonly page: Page) {
    this.info = page.locator('.product-information');
    this.name = this.info.getByRole('heading', { level: 2 });
    // Exception: price is an unlabeled <span>; first span>span within product info.
    this.price = this.info.locator('span > span').first();
    // Exception: <label>Quantity:</label> is not associated with the input (no `for`).
    this.quantity = page.locator('#quantity');
    this.addToCartButton = this.info.getByRole('button', { name: 'Add to cart' });
    this.reviewHeading = page.getByRole('link', { name: 'Write Your Review' });
  }

  async read(): Promise<ProductCard> {
    const name = (await this.name.textContent())?.trim() ?? '';
    return { name, unitPrice: parseRupees(await this.price.textContent()) };
  }

  async addToCart(quantity: number, modal: CartModal): Promise<void> {
    await this.quantity.fill(String(quantity));
    await expect(this.quantity).toHaveValue(String(quantity));
    await this.addToCartButton.click();
    await modal.continueShopping();
  }

  async submitReview(name: string, email: string, text: string): Promise<void> {
    await this.page.getByPlaceholder('Your Name').fill(name);
    await this.page.getByPlaceholder('Email Address', { exact: true }).fill(email);
    await this.page.getByPlaceholder('Add Review Here!').fill(text);
    await this.page.getByRole('button', { name: 'Submit' }).click();
  }
}

/** "Added!" modal shown after any add-to-cart. */
export class CartModal {
  readonly title: Locator;

  constructor(private readonly page: Page) {
    this.title = page.locator('#cartModal').getByRole('heading', { name: 'Added!' });
  }

  async continueShopping(): Promise<void> {
    await expect(this.title).toBeVisible();
    await this.page.getByRole('button', { name: 'Continue Shopping' }).click();
    await expect(this.title).toBeHidden();
  }

  async viewCart(): Promise<void> {
    await expect(this.title).toBeVisible();
    await this.page.locator('#cartModal').getByRole('link', { name: 'View Cart' }).click();
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
