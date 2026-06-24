import { PaymentMethodsView } from "@/components/account/payment-methods-view";

export default function PaymentMethodsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-6 pt-5 text-slate-900 dark:bg-black dark:text-zinc-100">
      <PaymentMethodsView />
    </main>
  );
}
