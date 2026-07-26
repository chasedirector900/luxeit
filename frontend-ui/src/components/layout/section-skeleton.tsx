/**
 * Neutral loading shell for SECTION-LEVEL route boundaries (category/, explore/,
 * account/). These boundaries front every deep page in their branch during
 * cross-tab navigation (Next shows the topmost new segment's loading.tsx), so a
 * page-specific skeleton here would flash the WRONG page's UI — e.g. the
 * category grid before a product detail. Page-specific skeletons belong in the
 * leaf segments' loading.tsx, which take over as the payload streams.
 */
export function SectionSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 px-4 pb-6 pt-5 md:px-6 dark:bg-black">
      <div className="mx-auto w-full max-w-md space-y-5 md:max-w-6xl">
        {/* Generic header: back button + title lines — matches every section page */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-zinc-800" />
          <div className="space-y-2">
            <div className="h-5 w-36 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-3 w-48 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
        </div>

        {/* Uncommitted content blocks — plausible before any child page */}
        <div className="h-40 w-full rounded-2xl border border-gold-200/70 bg-white md:h-52 dark:border-gold-900/40 dark:bg-zinc-900/70" />
        {/* A responsive card grid so desktop doesn't flash a narrow column. */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className="aspect-[3/4] rounded-2xl border border-gold-200/70 bg-white dark:border-gold-900/40 dark:bg-zinc-900/70"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
