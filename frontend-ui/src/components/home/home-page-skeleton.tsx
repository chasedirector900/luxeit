export function HomePageSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 px-3 pb-24 pt-3 text-slate-900 md:px-6 md:pb-6 dark:bg-black">
      <div className="mx-auto w-full max-w-md space-y-5 md:max-w-6xl">
        {/* Logo + delivering banner + bell — mobile only (desktop has the top bar). */}
        <div className="flex items-center justify-between gap-2 md:hidden">
          <div className="h-10 w-28 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="h-8 w-40 rounded-full bg-slate-200 dark:bg-zinc-800" />
          <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-zinc-800" />
        </div>

        {/* Inline search — mobile only. */}
        <div className="h-12 w-full rounded-full bg-slate-200 md:hidden dark:bg-zinc-800" />

        {/* Hero banner. */}
        <div className="h-[190px] w-full rounded-3xl bg-slate-200 md:h-[220px] dark:bg-zinc-800" />

        {/* "Top Picks for You" header. */}
        <div className="flex items-center justify-between">
          <div className="h-7 w-44 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="h-5 w-14 rounded bg-slate-200 dark:bg-zinc-800" />
        </div>

        {/* Product grid — matches the real feed's responsive columns. */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/70"
            >
              <div className="aspect-[4/3] w-full bg-slate-200 dark:bg-zinc-800" />
              <div className="space-y-1.5 p-3">
                <div className="h-3.5 w-full rounded bg-slate-200 dark:bg-zinc-800" />
                <div className="h-3.5 w-4/5 rounded bg-slate-200 dark:bg-zinc-800" />
                <div className="mt-2.5 flex items-center justify-between">
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
