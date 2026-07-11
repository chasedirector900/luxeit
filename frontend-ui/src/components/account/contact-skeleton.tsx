const GHOST = "rounded bg-slate-200 dark:bg-zinc-800";

/** Mirrors the change-contact page: back header + form card (label, field, note, button). */
export function ContactSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 px-4 pb-6 pt-5 dark:bg-black">
      <div className="mx-auto w-full max-w-md space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-zinc-800" />
          <div className="space-y-2">
            <div className={`h-5 w-36 ${GHOST}`} />
            <div className={`h-3 w-48 ${GHOST}`} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className={`h-3 w-24 ${GHOST}`} />
          <div className="mt-2 h-12 w-full rounded-xl bg-slate-200 dark:bg-zinc-800" />
          <div className={`mt-3 h-3 w-56 ${GHOST}`} />
          <div className="mt-4 h-12 w-full rounded-xl bg-slate-200 dark:bg-zinc-800" />
        </div>
      </div>
    </main>
  );
}
