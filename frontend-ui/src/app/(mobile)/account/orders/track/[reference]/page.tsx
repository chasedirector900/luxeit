import { OrderTrackingView } from "@/components/orders/order-tracking-view";

type OrderTrackPageProps = {
  params: Promise<{ reference: string }>;
};

export default async function OrderTrackPage({ params }: OrderTrackPageProps) {
  const { reference } = await params;
  return <OrderTrackingView reference={reference} />;
}
