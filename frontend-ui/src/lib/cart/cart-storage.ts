import type { CartState } from "@/types/cart";

const CART_STORAGE_KEY = "luxeit:cart:v1";

const EMPTY_CART: CartState = { items: [] };

function isValidState(value: unknown): value is CartState {
  if (!value || typeof value !== "object") return false;
  const maybe = value as Partial<CartState>;
  return Array.isArray(maybe.items);
}

export function readCartState(): CartState {
  if (typeof window === "undefined") return EMPTY_CART;

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return EMPTY_CART;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidState(parsed)) return EMPTY_CART;
    return parsed;
  } catch {
    return EMPTY_CART;
  }
}

export function writeCartState(state: CartState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // No-op: storage quota/private mode should not break the UI.
  }
}

export function clearCartState() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // No-op by design.
  }
}

export { CART_STORAGE_KEY, EMPTY_CART };
