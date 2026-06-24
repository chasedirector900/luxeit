export function HomePageSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 px-3 pb-24 pt-3 text-slate-900 dark:bg-black">
      <div className="mx-auto w-full max-w-md space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="h-10 w-28 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="h-8 w-40 rounded-full bg-slate-200 dark:bg-zinc-800" />
          <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-zinc-800" />
        </div>

        <div className="h-12 w-full rounded-full bg-slate-200 dark:bg-zinc-800" />

        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="w-[68px] shrink-0 space-y-2">
              <div className="h-[68px] w-[68px] rounded-2xl bg-slate-200 dark:bg-zinc-800" />
              <div className="mx-auto h-3 w-12 rounded bg-slate-200 dark:bg-zinc-800" />
            </div>
          ))}
        </div>

        <div className="h-[190px] w-full rounded-3xl bg-slate-200 dark:bg-zinc-800" />

        <div className="flex items-center justify-between">
          <div className="h-7 w-40 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="h-5 w-14 rounded bg-slate-200 dark:bg-zinc-800" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
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

        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-2xl bg-slate-200 dark:bg-zinc-800" />
          <div className="h-24 rounded-2xl bg-slate-200 dark:bg-zinc-800" />
        </div>
      </div>
    </main>
  );
}
