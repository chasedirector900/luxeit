export default function PaymentMethodsLoading() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 px-4 pb-6 pt-5 dark:bg-black">
      <div className="mx-auto w-full max-w-md space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-zinc-800" />
          <div className="space-y-2">
            <div className="h-5 w-40 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-2.5 w-24 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
        </div>

        <div className="h-40 w-full rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/70" />

        <div className="space-y-2">
          <div className="h-3 w-40 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/70">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-3 px-4 py-3.5">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200 dark:bg-zinc-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-28 rounded bg-slate-200 dark:bg-zinc-800" />
                  <div className="h-2.5 w-20 rounded bg-slate-200 dark:bg-zinc-800" />
                </div>
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
