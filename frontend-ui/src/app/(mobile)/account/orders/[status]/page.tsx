import { notFound } from "next/navigation";
import { OrdersListView } from "@/components/orders/orders-list-view";
import { getOrderBucket } from "@/lib/orders/order-buckets";

type OrdersBucketPageProps = {
  params: Promise<{ status: string }>;
};

export default async function OrdersBucketPage({ params }: OrdersBucketPageProps) {
  const { status } = await params;
  if (!getOrderBucket(status)) notFound();

  return <OrdersListView slug={status} />;
}
