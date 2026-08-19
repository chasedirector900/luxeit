/** Format a stored price (already in Kwacha) as Kwacha, e.g. 1500 -> "K1,500". */
export function formatKwacha(amount: number): string {
  return `K${Math.round(amount).toLocaleString("en-US")}`;
}

/** The numeric Kwacha value (no symbol) — for structured data / JSON-LD offers. */
export function priceInKwacha(amount: number): number {
  return Math.round(amount);
}

/** ISO 4217 currency code the catalog is priced/displayed in. */
export const CURRENCY_CODE = "ZMW";
