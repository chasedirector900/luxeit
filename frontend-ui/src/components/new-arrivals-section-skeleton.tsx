"use client";

export function NewArrivalsSectionSkeleton() {
  return (
    <section className="w-full px-4 pb-10 pt-2 animate-pulse">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 dark:border-zinc-800/80">
          <div className="inline-flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-slate-200 dark:bg-zinc-800" />
            <div className="h-4 w-36 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
          <div className="h-4 w-14 rounded bg-slate-200 dark:bg-zinc-800" />
        </div>

        <div className="mt-5 flex w-full gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: 3 }).map((_, idx) => (
            <article
              key={idx}
              className="w-[78vw] sm:w-[260px] md:w-[240px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 dark:border-zinc-800/60 dark:bg-zinc-950/60"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-slate-200 dark:bg-zinc-900">
                <div className="absolute bottom-2.5 left-2.5 h-6 w-14 rounded-lg bg-slate-300/80 dark:bg-zinc-800" />
                <div className="absolute bottom-2.5 right-2.5 h-5 w-20 rounded-md bg-slate-300/80 dark:bg-zinc-800" />
              </div>

              <div className="mt-2.5 space-y-1.5 rounded-xl border border-slate-100/50 bg-slate-100/60 p-2 dark:border-zinc-900/40 dark:bg-zinc-900/40">
                <div className="h-4 w-full rounded bg-slate-200 dark:bg-zinc-800" />
                <div className="h-4 w-4/5 rounded bg-slate-200 dark:bg-zinc-800" />
                <div className="border-t border-slate-100 pt-1.5 dark:border-zinc-900/60">
                  <div className="flex items-center justify-between gap-2">
                    <div className="h-3 w-24 rounded bg-slate-200 dark:bg-zinc-800" />
                    <div className="h-3 w-16 rounded bg-slate-200 dark:bg-zinc-800" />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

