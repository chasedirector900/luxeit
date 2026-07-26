export function ProductDetailSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 px-4 pb-28 pt-4 dark:bg-black md:px-8">
      <div className="mx-auto w-full max-w-md md:max-w-5xl">
        <header className="mb-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-zinc-800" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-2.5 w-20 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
        </header>

        <section className="overflow-hidden rounded-3xl border border-gold-200/70 bg-white dark:border-gold-900/40 dark:bg-zinc-900/70">
          <div className="aspect-[4/5] w-full bg-slate-200 dark:bg-zinc-800" />

          <div className="border-t border-gold-200/70 bg-slate-50/80 p-2 dark:border-gold-900/40 dark:bg-zinc-900/70">
            <div className="flex gap-1.5 overflow-hidden">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="h-12 w-12 shrink-0 rounded-md bg-slate-200 dark:bg-zinc-800" />
              ))}
            </div>
          </div>

          <div className="space-y-3 p-3">
            <div className="h-7 w-28 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-5 w-4/5 rounded bg-slate-200 dark:bg-zinc-800" />

            <div className="flex flex-wrap gap-1.5">
              <div className="h-5 w-16 rounded-md bg-slate-200 dark:bg-zinc-800" />
              <div className="h-5 w-16 rounded-md bg-slate-200 dark:bg-zinc-800" />
              <div className="h-5 w-20 rounded-md bg-slate-200 dark:bg-zinc-800" />
            </div>

            <div className="rounded-xl border border-gold-200/70 bg-slate-50/80 p-2.5 dark:border-gold-900/40 dark:bg-zinc-900/70">
              <div className="mb-2 h-3 w-16 rounded bg-slate-200 dark:bg-zinc-800" />
              <div className="h-9 w-full rounded-lg bg-slate-200 dark:bg-zinc-800" />
            </div>

            <div className="rounded-xl border border-gold-200/70 bg-slate-50/80 p-2.5 dark:border-gold-900/40 dark:bg-zinc-900/70">
              <div className="mb-2 h-3 w-20 rounded bg-slate-200 dark:bg-zinc-800" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-8 rounded-md bg-slate-200 dark:bg-zinc-800" />
                <div className="h-8 rounded-md bg-slate-200 dark:bg-zinc-800" />
                <div className="h-8 rounded-md bg-slate-200 dark:bg-zinc-800" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-3 rounded-2xl border border-gold-200/70 bg-white/90 p-3 dark:border-gold-900/40 dark:bg-zinc-900/60">
          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="mt-2 space-y-2">
            <div className="h-3 w-full rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-3 w-11/12 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-3 w-9/12 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
        </section>

        <section className="mt-3 rounded-2xl border border-gold-200/70 bg-white/90 p-3 dark:border-gold-900/40 dark:bg-zinc-900/60">
          <div className="h-4 w-36 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="mt-2 space-y-1.5">
            <div className="h-3 w-full rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-3 w-5/6 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4.4rem+env(safe-area-inset-bottom))] z-40 px-4 md:hidden">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-gold-200/70 bg-white/95 p-2 dark:border-gold-900/40 dark:bg-zinc-950/95">
          <div className="h-12 w-full rounded-xl bg-slate-200 dark:bg-zinc-800" />
        </div>
      </div>
    </main>
  );
}

