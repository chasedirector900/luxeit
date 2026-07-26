const GHOST = "rounded bg-slate-200 dark:bg-zinc-800";

/** Mirrors the security page: back header + signed-in device rows + logout-others button. */
export function SecuritySkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 px-4 pb-6 pt-5 dark:bg-black">
      <div className="mx-auto w-full max-w-md space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-zinc-800" />
          <div className="space-y-2">
            <div className={`h-5 w-28 ${GHOST}`} />
            <div className={`h-3 w-44 ${GHOST}`} />
          </div>
        </div>
        <div>
          <div className={`mb-2 ml-1 h-3 w-32 ${GHOST}`} />
          <div className="divide-y divide-gold-200/70 rounded-2xl border border-gold-200/70 bg-white dark:divide-gold-900/40 dark:border-gold-900/40 dark:bg-zinc-900/70">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-3 px-4 py-3.5">
                <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200 dark:bg-zinc-800" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className={`h-3.5 w-36 ${GHOST}`} />
                  <div className={`h-3 w-48 ${GHOST}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="h-12 w-full rounded-2xl border border-gold-200/70 bg-white dark:border-gold-900/40 dark:bg-zinc-900/70" />
      </div>
    </main>
  );
}
