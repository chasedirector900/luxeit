export function SavedItemsSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 px-4 pb-6 pt-5 dark:bg-black">
      <div className="mx-auto w-full max-w-md space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-zinc-800" />
          <div className="space-y-2">
            <div className="h-5 w-28 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-2.5 w-16 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="overflow-hidden rounded-2xl border border-gold-200/70 bg-white dark:border-gold-900/40 dark:bg-zinc-900/70">
              <div className="aspect-[4/3] w-full bg-slate-200 dark:bg-zinc-800" />
              <div className="space-y-2 p-3">
                <div className="h-3.5 w-5/6 rounded bg-slate-200 dark:bg-zinc-800" />
                <div className="h-3.5 w-3/5 rounded bg-slate-200 dark:bg-zinc-800" />
                <div className="mt-2 flex items-center justify-between">
                  <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-zinc-800" />
                  <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-zinc-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
