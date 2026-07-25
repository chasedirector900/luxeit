// Order types + status metadata shared by the order pages and the tracking
// timeline. Order DATA now comes from the backend API (lib/auth/api.ts →
// listOrders/getOrder); this module is types + presentation only.

export type OrderStatus = "pending" | "queue" | "sourcing" | "transit" | "delivered";

export type OrderItem = {
  title: string;
  image: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  placedOn: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
};

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; description: string; tint: string; dot: string }
> = {
  pending: {
    label: "Pending Payment",
    description: "Awaiting payment",
    tint: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  queue: {
    label: "Sourcing",
    description: "Paid — we're buying your items",
    tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  // The backend's "sourcing" status means the goods are already BOUGHT and
  // waiting for a shipment to depart — hence "Sourced" here.
  sourcing: {
    label: "Sourced",
    description: "Bought — waiting to ship",
    tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  transit: {
    label: "In Transit",
    description: "On its way to you",
    tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
  },
  delivered: {
    label: "Delivered",
    description: "Delivered",
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
};
