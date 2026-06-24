import { notFound } from "next/navigation";
import { OrdersListView } from "@/components/orders/orders-list-view";
import { getOrderBucket, getOrderBucketSlugs } from "@/lib/orders/order-buckets";

type OrdersBucketPageProps = {
  params: Promise<{ status: string }>;
};

// Pre-render the four bucket shells; per-user order data is resolved client-side.
export function generateStaticParams() {
  return getOrderBucketSlugs().map((status) => ({ status }));
}

export default async function OrdersBucketPage({ params }: OrdersBucketPageProps) {
  const { status } = await params;
  if (!getOrderBucket(status)) notFound();

  return <OrdersListView slug={status} />;
}
