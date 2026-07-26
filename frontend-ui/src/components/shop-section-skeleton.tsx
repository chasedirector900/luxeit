"use client";

export function ShopSectionSkeleton() {
  return (
    <section className="w-full px-4 pb-8 pt-2 animate-pulse">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-center justify-between border-b border-gold-200/70/60 pb-3 dark:border-gold-900/40/80">
          <div className="inline-flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-slate-200 dark:bg-zinc-800" />
            <div className="h-4 w-16 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
          <div className="h-4 w-14 rounded bg-slate-200 dark:bg-zinc-800" />
        </div>

        <article className="mt-4 overflow-hidden rounded-3xl border border-gold-200/70 bg-white p-3 dark:border-gold-900/40/60 dark:bg-zinc-950/60 sm:p-5">
          <div className="block lg:hidden">
            <div className="aspect-square w-full rounded-2xl bg-slate-200 dark:bg-zinc-900" />
            <div className="mt-3 h-3 w-28 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="mt-2 h-8 w-56 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="mt-2 h-3 w-full rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="mt-1 h-3 w-4/5 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="mt-3 h-10 w-full rounded-xl bg-slate-200 dark:bg-zinc-800" />
          </div>

          <div className="hidden items-center gap-8 lg:grid lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <div className="h-5 w-32 rounded bg-slate-200 dark:bg-zinc-800" />
              <div className="h-14 w-4/5 rounded bg-slate-200 dark:bg-zinc-800" />
              <div className="h-4 w-full rounded bg-slate-200 dark:bg-zinc-800" />
              <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-zinc-800" />
              <div className="h-10 w-48 rounded-xl bg-slate-200 dark:bg-zinc-800" />
            </div>
            <div className="lg:col-span-5 flex justify-center">
              <div className="h-64 w-64 rounded-2xl bg-slate-200 dark:bg-zinc-800" />
            </div>
          </div>

          <div className="mt-6 border-t border-gold-100/70 pt-5 dark:border-zinc-900/80">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-24 sm:h-28 rounded-xl border border-gold-200/70/60 bg-slate-100/70 dark:border-gold-900/40/60 dark:bg-zinc-900/30"
                />
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

