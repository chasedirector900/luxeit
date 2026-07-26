export function ReviewsRatingSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 px-4 pb-24 pt-4 dark:bg-black">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-zinc-800" />
          <div className="space-y-1.5">
            <div className="h-4 w-40 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-2.5 w-28 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
        </div>

        <div className="h-12 w-full rounded-xl bg-slate-200 dark:bg-zinc-800" />

        <div className="mt-3 flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 w-28 rounded-full bg-slate-200 dark:bg-zinc-800" />
          ))}
        </div>

        <section className="mt-3 rounded-2xl border border-gold-200/70 bg-white/90 p-3 dark:border-gold-900/40 dark:bg-zinc-900/70">
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <div>
              <div className="h-10 w-14 rounded bg-slate-200 dark:bg-zinc-800" />
              <div className="mt-2 h-3 w-16 rounded bg-slate-200 dark:bg-zinc-800" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-2 rounded bg-slate-200 dark:bg-zinc-800" />
              ))}
            </div>
          </div>
        </section>

        <div className="mt-3 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <section
              key={i}
              className="rounded-2xl border border-gold-200/70 bg-white/90 p-3 dark:border-gold-900/40 dark:bg-zinc-900/60"
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-zinc-800" />
                <div className="space-y-1">
                  <div className="h-3 w-28 rounded bg-slate-200 dark:bg-zinc-800" />
                  <div className="h-2.5 w-16 rounded bg-slate-200 dark:bg-zinc-800" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded bg-slate-200 dark:bg-zinc-800" />
                <div className="h-3 w-11/12 rounded bg-slate-200 dark:bg-zinc-800" />
                <div className="h-3 w-9/12 rounded bg-slate-200 dark:bg-zinc-800" />
              </div>
              <div className="mt-3 h-8 w-full rounded-lg bg-slate-200 dark:bg-zinc-800" />
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

