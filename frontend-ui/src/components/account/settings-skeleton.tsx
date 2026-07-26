const CARD = "rounded-2xl border border-gold-200/70 bg-white dark:border-gold-900/40 dark:bg-zinc-900/70";
const GHOST = "rounded bg-slate-200 dark:bg-zinc-800";

function RowGroup({ rows, trailing }: { rows: number; trailing?: "toggle" | "chevron" }) {
  return (
    <div className={`${CARD} divide-y divide-gold-200/70 dark:divide-gold-900/40`}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-3 px-4 py-3.5">
          {trailing !== "toggle" ? <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200 dark:bg-zinc-800" /> : null}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className={`h-3.5 w-36 ${GHOST}`} />
            <div className={`h-3 w-48 ${GHOST}`} />
          </div>
          {trailing === "toggle" ? (
            <div className="h-6 w-11 shrink-0 rounded-full bg-slate-200 dark:bg-zinc-800" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Mirrors the Settings page — back header, theme row, notification toggles,
 *  account/legal row groups, about row and the danger zone. */
export function SettingsSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 px-4 pb-6 pt-5 dark:bg-black">
      <div className="mx-auto w-full max-w-md space-y-5">
        {/* Back + title header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-zinc-800" />
          <div className="space-y-2">
            <div className={`h-5 w-28 ${GHOST}`} />
            <div className={`h-3 w-44 ${GHOST}`} />
          </div>
        </div>

        {/* Appearance */}
        <div>
          <div className={`mb-2 ml-1 h-3 w-20 ${GHOST}`} />
          <div className={`${CARD} flex items-center gap-3 px-4 py-3.5`}>
            <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200 dark:bg-zinc-800" />
            <div className={`h-3.5 w-16 flex-1 ${GHOST}`} />
            <div className="h-8 w-32 shrink-0 rounded-full bg-slate-200 dark:bg-zinc-800" />
          </div>
        </div>

        {/* Notification preferences (toggles) */}
        <div>
          <div className={`mb-2 ml-1 h-3 w-44 ${GHOST}`} />
          <RowGroup rows={3} trailing="toggle" />
        </div>

        {/* Account */}
        <div>
          <div className={`mb-2 ml-1 h-3 w-16 ${GHOST}`} />
          <RowGroup rows={2} />
        </div>

        {/* Support & legal */}
        <div>
          <div className={`mb-2 ml-1 h-3 w-28 ${GHOST}`} />
          <RowGroup rows={3} />
        </div>

        {/* About */}
        <div>
          <div className={`mb-2 ml-1 h-3 w-12 ${GHOST}`} />
          <div className={`${CARD} flex items-center gap-3 px-4 py-3.5`}>
            <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200 dark:bg-zinc-800" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className={`h-3.5 w-20 ${GHOST}`} />
              <div className={`h-3 w-56 ${GHOST}`} />
            </div>
            <div className={`h-3 w-10 shrink-0 ${GHOST}`} />
          </div>
        </div>

        {/* Danger zone */}
        <div>
          <div className={`mb-2 ml-1 h-3 w-24 ${GHOST}`} />
          <RowGroup rows={1} />
        </div>
      </div>
    </main>
  );
}
