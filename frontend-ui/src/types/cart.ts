import type { Warehouse } from "@/types/product";

export type ShippingMethod = "air" | "sea";

export type CartItem = {
  productId: string;
  variantId?: string | null;
  selectedOptions?: Record<string, string>;
  slug: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  selectedShippingMethod: ShippingMethod;
  deliveryEstimate?: string | null;
  /** Which hub fulfils this item — drives checkout grouping + delivery time. */
  warehouse?: Warehouse;
};

export type AddCartItemInput = Omit<CartItem, "quantity"> & {
  quantity?: number;
};

export type CartState = {
  items: CartItem[];
};
