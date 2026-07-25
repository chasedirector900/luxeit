import type { ComponentType } from "react";
import { Clock, PackageCheck, Truck, Wallet } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/orders/mock-orders";

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

// The four order buckets shown on the account page. Each maps a URL slug to one
// or more underlying order statuses, so the account tabs and the listing pages
// stay in sync from a single source of truth.
export type OrderBucket = {
  slug: string;
  label: string; // account tab title, e.g. "Pending Payment"
  note: string; // account tab subtitle, e.g. "Awaiting payment"
  title: string; // page heading
  subtitle: string; // page subheading
  empty: string; // empty-state copy
  statuses: OrderStatus[];
  icon: IconType;
  tint: string;
  ring: string;
};

export const ORDER_BUCKETS: OrderBucket[] = [
  {
    slug: "pending",
    label: "Pending Payment",
    note: "Awaiting payment",
    title: "Pending Payment",
    subtitle: "Orders waiting for your payment",
    empty: "No orders are awaiting payment.",
    statuses: ["pending"],
    icon: Wallet,
    tint: "text-rose-500 dark:text-rose-400",
    ring: "bg-rose-500/10",
  },
  {
    // Slug stays "queue" (it's in URLs); the labels now describe both statuses
    // this tab holds: being bought, and bought-but-not-yet-shipped.
    slug: "queue",
    label: "Sourcing",
    note: "Paid · being sourced",
    title: "Sourcing",
    subtitle: "Paid orders being bought and prepared to ship",
    empty: "Nothing being sourced right now.",
    statuses: ["queue", "sourcing"],
    icon: Clock,
    tint: "text-amber-500 dark:text-amber-400",
    ring: "bg-amber-500/10",
  },
  {
    slug: "transit",
    label: "In Transit",
    note: "On the way",
    title: "In Transit",
    subtitle: "Orders on their way to you",
    empty: "Nothing is in transit right now.",
    statuses: ["transit"],
    icon: Truck,
    tint: "text-violet-500 dark:text-violet-400",
    ring: "bg-violet-500/10",
  },
  {
    slug: "delivered",
    label: "Delivered",
    note: "Completed",
    title: "Delivered",
    subtitle: "Your completed orders",
    empty: "No delivered orders yet.",
    statuses: ["delivered"],
    icon: PackageCheck,
    tint: "text-emerald-500 dark:text-emerald-400",
    ring: "bg-emerald-500/10",
  },
];

const BY_SLUG: Record<string, OrderBucket> = Object.fromEntries(
  ORDER_BUCKETS.map((bucket) => [bucket.slug, bucket]),
);

export function getOrderBucket(slug: string): OrderBucket | undefined {
  return BY_SLUG[slug];
}

export function getOrderBucketSlugs(): string[] {
  return ORDER_BUCKETS.map((bucket) => bucket.slug);
}

/** Filter a fetched order list down to a bucket's statuses. */
export function ordersForBucket(bucket: OrderBucket, orders: Order[]): Order[] {
  const statuses = new Set<OrderStatus>(bucket.statuses);
  return orders.filter((order) => statuses.has(order.status));
}

/** How many of the given orders fall into a bucket (drives the tab badge). */
export function bucketCount(slug: string, orders: Order[]): number {
  const bucket = BY_SLUG[slug];
  return bucket ? ordersForBucket(bucket, orders).length : 0;
}
