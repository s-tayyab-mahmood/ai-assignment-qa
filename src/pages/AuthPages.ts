import { expect, type Locator, type Page } from '@playwright/test';
import { MONTH_NAMES } from '../data/factories';
import type { UserAccount } from '../data/types';

/** /login – contains both the login form and the "New User Signup!" form. */
export class LoginPage {
  readonly loginHeading: Locator;
  readonly signupHeading: Locator;
  readonly loginEmail: Locator;
  readonly loginPassword: Locator;
  readonly loginButton: Locator;
  readonly signupName: Locator;
  readonly signupEmail: Locator;
  readonly signupButton: Locator;
  readonly invalidCredentialsError: Locator;
  readonly duplicateEmailError: Locator;

  constructor(private readonly page: Page) {
    this.loginHeading = page.getByRole('heading', { name: 'Login to your account' });
    this.signupHeading = page.getByRole('heading', { name: 'New User Signup!' });
    // data-qa is configured as Playwright's test id attribute (playwright.config.ts).
    this.loginEmail = page.getByTestId('login-email');
    this.loginPassword = page.getByTestId('login-password');
    this.loginButton = page.getByTestId('login-button');
    this.signupName = page.getByTestId('signup-name');
    this.signupEmail = page.getByTestId('signup-email');
    this.signupButton = page.getByTestId('signup-button');
    this.invalidCredentialsError = page.getByText('Your email or password is incorrect!');
    this.duplicateEmailError = page.getByText('Email Address already exist!');
  }

  async open(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.loginHeading).toBeVisible();
  }

  async login(email: string, password: string): Promise<void> {
    await this.loginEmail.fill(email);
    await this.loginPassword.fill(password);
    await this.loginButton.click();
  }

  async startSignup(name: string, email: string): Promise<void> {
    await this.signupName.fill(name);
    await this.signupEmail.fill(email);
    await this.signupButton.click();
  }
}

/** /signup – "Enter Account Information" form and the account created/deleted confirmations. */
export class SignupPage {
  readonly heading: Locator;
  readonly accountCreated: Locator;
  readonly accountDeleted: Locator;
  readonly continueButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByText('Enter Account Information');
    this.accountCreated = page.getByTestId('account-created');
    this.accountDeleted = page.getByTestId('account-deleted');
    this.continueButton = page.getByTestId('continue-button');
  }

  async fillAccountDetails(user: UserAccount): Promise<void> {
    const p = this.page;
    const a = user.address;
    await p.getByLabel(user.title === 'Mr' ? 'Mr.' : 'Mrs.', { exact: true }).check();
    await p.getByTestId('password').fill(user.password);
    await p.getByTestId('days').selectOption(user.birthDay);
    const monthIndex = Number(user.birthMonth) - 1;
    await p.getByTestId('months').selectOption({ label: MONTH_NAMES[monthIndex] ?? 'January' });
    await p.getByTestId('years').selectOption(user.birthYear);
    await p.getByLabel('Sign up for our newsletter!').check();
    await p.getByTestId('first_name').fill(a.firstName);
    await p.getByTestId('last_name').fill(a.lastName);
    await p.getByTestId('company').fill(a.company);
    await p.getByTestId('address').fill(a.address1);
    await p.getByTestId('address2').fill(a.address2);
    await p.getByTestId('country').selectOption(a.country);
    await p.getByTestId('state').fill(a.state);
    await p.getByTestId('city').fill(a.city);
    await p.getByTestId('zipcode').fill(a.zipcode);
    await p.getByTestId('mobile_number').fill(a.mobileNumber);
  }

  async submit(): Promise<void> {
    await this.page.getByTestId('create-account').click();
  }
}
