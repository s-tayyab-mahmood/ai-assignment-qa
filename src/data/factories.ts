import { randomUUID } from 'node:crypto';
import type { DummyCard, UserAccount } from './types';

/**
 * Deterministic-shape, unique-value test data. Every call yields a new identity so parallel
 * workers never share a mutable account (brief §4). The run tag makes leaked accounts traceable
 * to a CI run if cleanup ever fails.
 */
const RUN_TAG = (process.env.GITHUB_RUN_ID ?? 'local').slice(-8);

export function uniqueId(prefix = 'qa'): string {
  return `${prefix}${RUN_TAG}${randomUUID().replace(/-/g, '').slice(0, 10)}`;
}

export function buildUser(overrides: Partial<UserAccount> = {}): UserAccount {
  const id = uniqueId('ae');
  const user: UserAccount = {
    name: `QA ${id}`,
    // example.com is reserved (RFC 2606) – no real mailbox is ever contacted.
    email: `${id}@example.com`,
    password: `Pw-${randomUUID().slice(0, 12)}`,
    title: 'Mr',
    birthDay: '15',
    birthMonth: '6',
    birthYear: '1992',
    address: {
      firstName: 'Testa',
      lastName: `Rossa${id.slice(-4)}`,
      company: 'QA Practice Ltd',
      address1: `${Math.floor(Math.random() * 900) + 100} Automation Street`,
      address2: 'Suite 42',
      country: 'Canada',
      state: 'Ontario',
      city: 'Toronto',
      zipcode: 'M5V 2T6',
      mobileNumber: '5550100123',
    },
    ...overrides,
  };
  return user;
}

/** Clearly invented payment details for the practice site's simulated checkout. */
export function dummyCard(): DummyCard {
  return {
    nameOnCard: 'Test Card Holder',
    // Not a valid PAN (fails Luhn) – the practice site does not validate card numbers.
    number: '0000000000000001',
    cvc: '000',
    expiryMonth: '01',
    expiryYear: '2099',
  };
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;
