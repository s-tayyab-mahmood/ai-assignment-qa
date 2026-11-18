/** Countries offered by the site's signup <select>. Using a union keeps fixtures valid at compile time. */
export type Country =
  'India' | 'United States' | 'Canada' | 'Australia' | 'Israel' | 'New Zealand' | 'Singapore';

export type Title = 'Mr' | 'Mrs';

export interface Address {
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  country: Country;
  state: string;
  city: string;
  zipcode: string;
  mobileNumber: string;
}

export interface UserAccount {
  name: string;
  email: string;
  password: string;
  title: Title;
  birthDay: string; // "1".."31"
  birthMonth: string; // "1".."12"  (UI select uses month names; see SignupPage)
  birthYear: string; // "1990"
  address: Address;
}

/** Invented, obviously-fake payment data. Never use real card data (brief §4). */
export interface DummyCard {
  nameOnCard: string;
  number: string;
  cvc: string;
  expiryMonth: string;
  expiryYear: string;
}

export interface ProductRef {
  /** Search term known to return the product in the live catalogue. */
  searchTerm: string;
  /** Expected display name (exact) – verified against the API catalogue in AE-24. */
  name: string;
}
