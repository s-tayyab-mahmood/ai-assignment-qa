import type { Page } from '@playwright/test';
import { LoginPage, SignupPage } from './AuthPages';
import { CartModal, ProductDetailsPage, ProductsPage } from './CatalogPages';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { CartPage, CheckoutPage, ContactPage, HomePage, PaymentPage } from './OrderPages';

/** Single entry point to all page/component objects for one Page. */
export class App {
  readonly header: Header;
  readonly footer: Footer;
  readonly home: HomePage;
  readonly login: LoginPage;
  readonly signup: SignupPage;
  readonly products: ProductsPage;
  readonly productDetails: ProductDetailsPage;
  readonly cartModal: CartModal;
  readonly cart: CartPage;
  readonly checkout: CheckoutPage;
  readonly payment: PaymentPage;
  readonly contact: ContactPage;

  constructor(readonly page: Page) {
    this.header = new Header(page);
    this.footer = new Footer(page);
    this.home = new HomePage(page);
    this.login = new LoginPage(page);
    this.signup = new SignupPage(page);
    this.products = new ProductsPage(page);
    this.productDetails = new ProductDetailsPage(page);
    this.cartModal = new CartModal(page);
    this.cart = new CartPage(page);
    this.checkout = new CheckoutPage(page);
    this.payment = new PaymentPage(page);
    this.contact = new ContactPage(page);
  }
}
