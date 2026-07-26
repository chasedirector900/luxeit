"use client";

export function FooterSkeleton() {
  return (
    <>
      <section className="px-4 pb-24 md:hidden animate-pulse">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-gold-200/70/80 bg-white/95 p-4 dark:border-white/10 dark:bg-surface">
          <div className="h-4 w-20 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="mt-2 h-3 w-44 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="mt-4 h-9 w-full rounded-full bg-slate-200 dark:bg-zinc-800" />
          <div className="mt-3 h-9 w-28 rounded-full bg-slate-200 dark:bg-zinc-800" />
          <div className="mt-4 border-t border-gold-200/70/80 pt-3 dark:border-white/10">
            <div className="h-3 w-32 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
        </div>
      </section>

      <section className="hidden px-4 pb-8 md:block animate-pulse">
        <div className="mx-auto w-full max-w-7xl rounded-2xl border border-gold-200/70/70 bg-white/95 p-4 dark:border-white/10 dark:bg-surface">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-gold-200/70/70 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-zinc-900/40">
            <div className="w-full max-w-md">
              <div className="h-8 w-44 rounded bg-slate-200 dark:bg-zinc-800" />
              <div className="mt-2 h-4 w-56 rounded bg-slate-200 dark:bg-zinc-800" />
            </div>
            <div className="flex w-full max-w-md items-center gap-2">
              <div className="h-11 w-full rounded-xl bg-slate-200 dark:bg-zinc-800" />
              <div className="h-11 w-28 rounded-xl bg-slate-200 dark:bg-zinc-800" />
            </div>
          </div>

          <div className="mt-4 border-t border-gold-200/70/80 pt-4 dark:border-white/10">
            <div className="flex items-center justify-between gap-4">
              <div className="w-1/3">
                <div className="h-6 w-56 rounded bg-slate-200 dark:bg-zinc-800" />
                <div className="mt-2 h-4 w-40 rounded bg-slate-200 dark:bg-zinc-800" />
              </div>
              <div className="w-1/3">
                <div className="h-4 w-full rounded bg-slate-200 dark:bg-zinc-800" />
              </div>
              <div className="h-8 w-40 rounded-full bg-slate-200 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

