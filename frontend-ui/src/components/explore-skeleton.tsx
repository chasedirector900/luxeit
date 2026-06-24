import { ProductCardSkeleton } from "@/components/product/product-card-skeleton";

function SkeletonSection({ title }: { title: string }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-zinc-800" />
        <div className="h-3 w-12 rounded bg-slate-200 dark:bg-zinc-800" />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {Array.from({ length: 4 }).map((_, idx) => (
          <ProductCardSkeleton key={`${title}-${idx}`} />
        ))}
      </div>
    </section>
  );
}

export function ExploreSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 px-4 pb-6 pt-5 dark:bg-black">
      <div className="mx-auto w-full max-w-md space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2.5">
            <div className="h-7 w-28 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-3 w-56 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
          <div className="h-11 w-11 rounded-full bg-slate-200 dark:bg-zinc-800" />
        </div>

        {/* Search */}
        <div className="h-12 w-full rounded-xl bg-slate-200 dark:bg-zinc-800" />

        {/* Chips */}
        <div className="flex gap-2.5 overflow-hidden">
          {Array.from({ length: 7 }).map((_, idx) => (
            <div key={idx} className="h-10 w-24 shrink-0 rounded-xl bg-slate-200 dark:bg-zinc-800" />
          ))}
        </div>

        {/* Hero */}
        <div className="h-44 w-full rounded-3xl bg-slate-200 dark:bg-zinc-800" />

        {/* Browse by Category */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="h-4 w-40 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-3 w-12 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-[92px] rounded-2xl bg-slate-200 dark:bg-zinc-800" />
            ))}
          </div>
        </section>

        {/* Deals of the Day */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="h-4 w-36 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-3 w-12 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-52 w-[150px] shrink-0 rounded-2xl bg-slate-200 dark:bg-zinc-800" />
            ))}
          </div>
        </section>

        <SkeletonSection title="top" />
        <SkeletonSection title="imports" />
      </div>
    </main>
  );
}
