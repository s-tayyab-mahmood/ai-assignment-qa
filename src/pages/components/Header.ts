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

  async goToProducts(): Promise<void> {
    await this.link('Products').click();
  }

  async goToCart(): Promise<void> {
    await this.link('Cart').click();
  }

  async goToLogin(): Promise<void> {
    await this.link('Signup / Login').click();
  }

  async goToContact(): Promise<void> {
    await this.link('Contact us').click();
  }

  async logout(): Promise<void> {
    await this.link('Logout').click();
  }

  async deleteAccount(): Promise<void> {
    await this.link('Delete Account').click();
  }
}
