import type { Locator, Page } from '@playwright/test';

/** Footer subscription widget (present on every page). */
export class Footer {
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly subscribeButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    const footer = page.locator('#footer');
    this.heading = footer.getByRole('heading', { name: 'Subscription' });
    this.emailInput = footer.getByPlaceholder('Your email address');
    // Exception: icon-only button with no accessible name; #subscribe is the stable id.
    this.subscribeButton = footer.locator('#subscribe');
    this.successMessage = page.getByText('You have been successfully subscribed!');
  }

  async subscribe(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.subscribeButton.click();
  }
}
