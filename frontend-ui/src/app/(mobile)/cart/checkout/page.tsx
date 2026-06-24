import { CheckoutClient } from "@/components/cart/checkout-client";

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-6 pt-5 text-slate-900 dark:bg-black dark:text-zinc-100">
      <CheckoutClient />
    </main>
  );
}
