// The wishlist item shape. Persistence moved to the backend (per-account) —
// see /api/saved and hooks/use-saved. Nothing is stored on the device anymore,
// so a shared phone can never show one person's hearts to the next.

export type SavedItem = {
  id: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  /** Detail path for this item (varies by where the product lives). */
  href: string;
};
