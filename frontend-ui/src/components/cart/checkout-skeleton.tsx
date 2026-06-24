export function CheckoutSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 px-4 pb-6 pt-5 dark:bg-black">
      <div className="mx-auto w-full max-w-md space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-zinc-800" />
          <div className="space-y-2">
            <div className="h-5 w-28 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-2.5 w-40 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
        </div>

        {/* Address */}
        <div className="h-24 w-full rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/70" />

        {/* Shipment groups */}
        <div className="h-36 w-full rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/70" />
        <div className="h-56 w-full rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/70" />

        {/* Summary */}
        <div className="h-32 w-full rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/70" />

        {/* CTA */}
        <div className="h-12 w-full rounded-xl bg-slate-200 dark:bg-zinc-800" />
      </div>
    </main>
  );
}
