/**
 * The site renders prices as "Rs. 1500" (whole rupees). We parse to integer rupees so cart
 * arithmetic is exact; never compare money as floating-point strings.
 */
export function parseRupees(text: string | null | undefined): number {
  if (!text) throw new Error('parseRupees: empty price text');
  const match = text.replace(/,/g, '').match(/(\d+)/);
  if (!match?.[1]) throw new Error(`parseRupees: no amount found in "${text}"`);
  return Number.parseInt(match[1], 10);
}

export function formatRupees(amount: number): string {
  return `Rs. ${amount}`;
}

export function lineTotal(unitPrice: number, quantity: number): number {
  if (!Number.isInteger(unitPrice) || !Number.isInteger(quantity)) {
    throw new Error(`lineTotal expects integers, got ${unitPrice} x ${quantity}`);
  }
  return unitPrice * quantity;
}

export function sum(values: readonly number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}
