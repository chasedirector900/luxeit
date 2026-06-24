import { ProductCardSkeleton } from "@/components/product/product-card-skeleton";

function SectionHeaderSkeleton() {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <div className="h-4 w-28 rounded bg-slate-200 dark:bg-zinc-800" />
      <div className="h-3 w-10 rounded bg-slate-200 dark:bg-zinc-800" />
    </div>
  );
}

export default function CategoryLoading() {
  return (
    <main className="min-h-screen animate-pulse bg-slate-50 px-3 pb-4 pt-4 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-3 flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-7 w-24 rounded bg-slate-200 dark:bg-zinc-800" />
            <div className="h-3 w-56 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
          <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-zinc-800" />
        </div>

        <SectionHeaderSkeleton />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-20 rounded-xl bg-slate-200 dark:bg-zinc-800" />
          ))}
        </div>

        <div className="mt-5 h-36 w-full rounded-2xl bg-slate-200 dark:bg-zinc-800" />

        <section className="mt-5">
          <SectionHeaderSkeleton />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-11 rounded-xl bg-slate-200 dark:bg-zinc-800" />
            ))}
          </div>
        </section>

        <section className="mt-5">
          <SectionHeaderSkeleton />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-20 rounded-xl bg-slate-200 dark:bg-zinc-800" />
            ))}
          </div>
        </section>

        <div className="mt-5 h-28 w-full rounded-2xl bg-slate-200 dark:bg-zinc-800" />

        <section className="mt-5">
          <SectionHeaderSkeleton />
          <div className="grid grid-cols-2 gap-2.5">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </div>
        </section>
      </div>
    </main>
  );
}
