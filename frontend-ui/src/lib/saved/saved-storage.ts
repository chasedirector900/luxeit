// Client-side wishlist persistence (localStorage), mirroring cart-storage.

export type SavedItem = {
  id: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  /** Detail path for this item (varies by where the product lives). */
  href: string;
};

export type SavedState = { items: SavedItem[] };

export const EMPTY_SAVED: SavedState = { items: [] };

const STORAGE_KEY = "luxeit:saved:v1";

export function readSaved(): SavedState {
  if (typeof window === "undefined") return EMPTY_SAVED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_SAVED;
    const parsed = JSON.parse(raw) as SavedState;
    return parsed && Array.isArray(parsed.items) ? { items: parsed.items } : EMPTY_SAVED;
  } catch {
    return EMPTY_SAVED;
  }
}

export function writeSaved(state: SavedState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore write errors.
  }
}
