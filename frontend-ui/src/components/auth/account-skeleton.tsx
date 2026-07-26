const CARD = "rounded-2xl border border-gold-200/70 bg-white dark:border-gold-900/40 dark:bg-zinc-900/70";
const GHOST = "rounded bg-slate-200 dark:bg-zinc-800";

/** Mirrors the Account page 1:1 — hero (avatar/name/chips), checklist with
 *  progress bar, MY ORDERS grid, referral card, row groups, logout. */
export function AccountSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 px-4 pb-6 pt-5 dark:bg-black">
      <div className="mx-auto w-full max-w-md space-y-5">
        {/* "Account" title */}
        <div className={`h-8 w-36 ${GHOST}`} />

        {/* Hero: centered avatar + name + contact + chips */}
        <div className={`${CARD} rounded-3xl px-6 pb-6 pt-7`}>
          <div className="flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-slate-200 dark:bg-zinc-800" />
            <div className={`mt-4 h-5 w-40 ${GHOST}`} />
            <div className={`mt-2 h-3 w-52 ${GHOST}`} />
            <div className="mt-4 flex gap-1.5">
              <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-zinc-800" />
              <div className="h-6 w-36 rounded-full bg-slate-200 dark:bg-zinc-800" />
            </div>
          </div>
        </div>

        {/* Complete your profile: title + count, progress bar, rows */}
        <div className={`${CARD} divide-y divide-slate-100 dark:divide-gold-900/40/70`}>
          <div className="px-4 pb-3.5 pt-3.5">
            <div className="flex items-center justify-between">
              <div className={`h-4 w-44 ${GHOST}`} />
              <div className={`h-3 w-12 ${GHOST}`} />
            </div>
            <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-200 dark:bg-zinc-800" />
          </div>
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-3 px-4 py-3">
              <div className="h-5 w-5 shrink-0 rounded-full bg-slate-200 dark:bg-zinc-800" />
              <div className={`h-3.5 w-32 ${GHOST}`} />
            </div>
          ))}
        </div>

        {/* MY ORDERS: micro-label + view-all, then 2×2 tiles */}
        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <div className={`h-3 w-20 ${GHOST}`} />
            <div className={`h-3 w-14 ${GHOST}`} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className={`${CARD} flex items-center gap-3 p-3.5`}>
                <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200 dark:bg-zinc-800" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className={`h-3 w-full max-w-20 ${GHOST}`} />
                  <div className={`h-2.5 w-full max-w-16 ${GHOST}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Refer & earn card */}
        <div className={`${CARD} flex items-center gap-3 p-4`}>
          <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-200 dark:bg-zinc-800" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className={`h-3.5 w-24 ${GHOST}`} />
            <div className={`h-3 w-44 ${GHOST}`} />
          </div>
          <div className="h-9 w-20 shrink-0 rounded-full bg-slate-200 dark:bg-zinc-800" />
        </div>

        {/* ACCOUNT rows */}
        <div>
          <div className={`mb-2 ml-1 h-3 w-16 ${GHOST}`} />
          <div className={`${CARD} divide-y divide-gold-200/70 dark:divide-gold-900/40`}>
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-3 px-4 py-3.5">
                <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200 dark:bg-zinc-800" />
                <div className={`h-3.5 w-32 ${GHOST}`} />
              </div>
            ))}
          </div>
        </div>

        {/* MORE rows */}
        <div>
          <div className={`mb-2 ml-1 h-3 w-12 ${GHOST}`} />
          <div className={`${CARD} divide-y divide-gold-200/70 dark:divide-gold-900/40`}>
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-3 px-4 py-3.5">
                <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200 dark:bg-zinc-800" />
                <div className={`h-3.5 w-28 ${GHOST}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div className={`${CARD} h-12 w-full`} />
      </div>
    </main>
  );
}
