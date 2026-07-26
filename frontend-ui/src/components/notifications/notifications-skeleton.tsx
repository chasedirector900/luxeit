export function NotificationsSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 px-4 pb-6 pt-5 dark:bg-black">
      <div className="mx-auto w-full max-w-md space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-zinc-800" />
          <div className="space-y-2">
            <div className="h-5 w-32 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-2.5 w-20 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
        </div>

        <div className="divide-y divide-gold-200/70 overflow-hidden rounded-2xl border border-gold-200/70 bg-white dark:divide-gold-900/40 dark:border-gold-900/40 dark:bg-zinc-900/70">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-3 px-3.5 py-3.5">
              <div className="h-12 w-12 shrink-0 rounded-full bg-slate-200 dark:bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/3 rounded bg-slate-200 dark:bg-zinc-800" />
                <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
