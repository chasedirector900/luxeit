// Mock catalog prices are stored as base numeric values. The whole app displays
// money in Zambian Kwacha (ZMW) using one simplified display rate, so conversion
// and formatting live in a single place — change the rate here and it updates
// everywhere prices are shown.
const KWACHA_PER_UNIT = 10;

/** Format a stored price as Kwacha, e.g. 129 -> "K1,290". */
export function formatKwacha(amount: number): string {
  return `K${Math.round(amount * KWACHA_PER_UNIT).toLocaleString("en-US")}`;
}

/** The numeric Kwacha value (no symbol) — for structured data / JSON-LD offers. */
export function priceInKwacha(amount: number): number {
  return Math.round(amount * KWACHA_PER_UNIT);
}

/** ISO 4217 currency code the catalog is priced/displayed in. */
export const CURRENCY_CODE = "ZMW";
