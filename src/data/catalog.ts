import type { ProductRef } from './types';

/**
 * Known products from the live catalogue. Values are re-validated at runtime against the API
 * (AE-24) so a catalogue change surfaces as TEST_DATA_OR_STATE, not as a silent false pass.
 * Prices are intentionally NOT hard-coded: tests capture the displayed price and compute totals.
 */
export const PRODUCTS = {
  blueTop: { searchTerm: 'Blue Top', name: 'Blue Top' },
  menTshirt: { searchTerm: 'Men Tshirt', name: 'Men Tshirt' },
  sleevelessDress: { searchTerm: 'Sleeveless Dress', name: 'Sleeveless Dress' },
} as const satisfies Record<string, ProductRef>;

/** Category/brand navigation used by AE-09/AE-10. */
export const CATEGORIES = {
  womenDress: { parent: 'Women', child: 'Dress', heading: 'Women - Dress Products' },
  menTshirts: { parent: 'Men', child: 'Tshirts', heading: 'Men - Tshirts Products' },
} as const;

export const BRANDS = [
  'Polo',
  'H&M',
  'Madame',
  'Mast & Harbour',
  'Babyhug',
  'Allen Solly Junior',
  'Kookie Kids',
  'Biba',
] as const;

/** A term that should return zero products (AE-08). Random suffix avoids accidental matches. */
export const NO_MATCH_TERM = 'zzqx-no-such-product-9f3k';
