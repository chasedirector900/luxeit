import type { ProductShippingMethod, Warehouse } from "@/types/product";

// LuxeIT stocks from two warehouses. Items in the Zambia (Lusaka) hub deliver
// fast; items in the China hub ship by the carrier chosen at checkout.
export const WAREHOUSE_META: Record<Warehouse, { label: string; badge: string }> = {
  zambia: { label: "Zambia", badge: "bg-emerald-500 text-white" },
  china: { label: "China", badge: "bg-gold-500 text-white" },
};

/** Compact estimate for cards. */
export function deliveryShort(warehouse: Warehouse, shipping?: ProductShippingMethod): string {
  if (warehouse === "zambia") return "24–48 hrs";
  return shipping === "sea" ? "~2 months" : "~2 weeks";
}

/** Full estimate for the product detail page. */
export function deliveryLong(warehouse: Warehouse, shipping?: ProductShippingMethod): string {
  if (warehouse === "zambia") return "Lusaka in 24 hrs · other cities ~48 hrs";
  return shipping === "sea" ? "Sea freight · ~2 months" : "Air freight · ~2 weeks";
}
