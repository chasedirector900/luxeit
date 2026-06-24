export function AccountSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 px-4 pb-6 pt-5 dark:bg-black">
      <div className="mx-auto w-full max-w-md space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="h-7 w-32 rounded-full bg-slate-200 dark:bg-zinc-800" />
        </div>

        {/* Hero */}
        <div className="h-28 w-full rounded-3xl bg-slate-200 dark:bg-zinc-800" />

        {/* Completeness */}
        <div className="h-20 w-full rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/70" />

        {/* My Orders */}
        <div>
          <div className="mb-3 h-5 w-32 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-[68px] rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/70" />
            ))}
          </div>
        </div>

        {/* Refer */}
        <div className="h-20 w-full rounded-2xl bg-slate-200 dark:bg-zinc-800" />

        {/* Account list */}
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/70">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-3 px-4 py-3.5">
                <div className="h-9 w-9 shrink-0 rounded-xl bg-slate-200 dark:bg-zinc-800" />
                <div className="h-3.5 w-32 rounded bg-slate-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <div className="h-12 w-full rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/70" />
      </div>
    </main>
  );
}
