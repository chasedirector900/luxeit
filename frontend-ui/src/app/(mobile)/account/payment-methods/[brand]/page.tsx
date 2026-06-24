import { notFound } from "next/navigation";
import { AddPaymentMethodView } from "@/components/account/add-payment-method-view";
import { PAYMENT_BRANDS, type PaymentBrand } from "@/lib/payments/payment-methods";

// Pre-render one static page per payment brand (visa, mastercard, bank, ...).
export function generateStaticParams() {
  return PAYMENT_BRANDS.map(({ brand }) => ({ brand }));
}

const VALID_BRANDS = new Set<string>(PAYMENT_BRANDS.map((b) => b.brand));

export default async function AddPaymentMethodPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand } = await params;
  if (!VALID_BRANDS.has(brand)) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-6 pt-5 text-slate-900 dark:bg-black dark:text-zinc-100">
      <AddPaymentMethodView brand={brand as PaymentBrand} />
    </main>
  );
}
