"use client";

export function ProductCardSkeleton() {
  return (
    <article className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/70">
      <div className="aspect-[4/3] w-full bg-slate-200 dark:bg-zinc-800" />
      <div className="space-y-1.5 p-3">
        <div className="h-3.5 w-5/6 rounded bg-slate-200 dark:bg-zinc-800" />
        <div className="h-3 w-3/5 rounded bg-slate-200 dark:bg-zinc-800" />
        <div className="mt-2.5 flex items-center justify-between">
          <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-zinc-800" />
        </div>
      </div>
    </article>
  );
}
