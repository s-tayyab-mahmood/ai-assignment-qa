import type { Locator, Page } from '@playwright/test';

/** Global navigation bar. Scoped to #header so link names cannot collide with page content. */
export class Header {
  readonly root: Locator;
  readonly loggedInAs: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('#header');
    this.loggedInAs = this.root.getByText(/Logged in as/);
  }

  link(
    name: 'Home' | 'Products' | 'Cart' | 'Signup / Login' | 'Logout' | 'Delete Account' | 'Contact us',
  ): Locator {
    return this.root.getByRole('link', { name });
  }

  /**
   * Click a nav link and wait until the target page's DOM is parsed. DOMContentLoaded fires only
   * after the page's synchronous scripts ran, so jQuery click handlers (e.g. "Add to cart") are
   * bound before the next action. Without this, on a slow site the next click could land on a
   * button whose handler is not attached yet (observed in AE-15, 2026-11-19).
   */
  private async navigate(name: Parameters<Header['link']>[0], url: RegExp): Promise<void> {
    await this.link(name).click();
    await this.page.waitForURL(url, { waitUntil: 'domcontentloaded' });
  }

  async goToProducts(): Promise<void> {
    await this.navigate('Products', /\/products/);
  }

  async goToCart(): Promise<void> {
    await this.navigate('Cart', /\/view_cart/);
  }

  async goToLogin(): Promise<void> {
    await this.navigate('Signup / Login', /\/login/);
  }

  async goToContact(): Promise<void> {
    await this.navigate('Contact us', /\/contact_us/);
  }

  async logout(): Promise<void> {
    await this.navigate('Logout', /\/login/);
  }

  async deleteAccount(): Promise<void> {
    await this.navigate('Delete Account', /\/delete_account/);
  }
}
