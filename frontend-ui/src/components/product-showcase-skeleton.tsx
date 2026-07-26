"use client";

import { Zap } from "lucide-react";

type ProductShowcaseSkeletonProps = {
  cards?: number;
};

export function ProductShowcaseSkeleton({ cards = 1 }: ProductShowcaseSkeletonProps) {
  return (
    <section
      className="w-full select-none px-3 pb-5 pt-0 animate-pulse transform-gpu"
      style={{ contentVisibility: "auto" }}
    >
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500/80 text-neutral-950">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="h-3.5 w-40 rounded bg-slate-300 dark:bg-zinc-700" />
            <div className="h-2.5 w-28 rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
        </div>
        <div className="h-6 w-16 rounded-full bg-gold-500/20 dark:bg-gold-500/10" />
      </div>

      <div className="flex w-full items-start gap-4 overflow-hidden pb-2">
        {Array.from({ length: cards }).map((_, idx) => (
          <article
            key={idx}
            className="relative w-[278px] shrink-0 overflow-hidden rounded-[22px] border border-zinc-700/80 bg-zinc-900/95 shadow-xl shadow-black/40"
          >
            <div className="relative h-[390px] w-full overflow-hidden rounded-[22px] bg-zinc-900">
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/40 to-zinc-900/95" />
              <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-zinc-950/45 via-zinc-950/15 to-transparent" />
              <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-zinc-950/45 via-zinc-950/15 to-transparent" />

              <div className="absolute left-2.5 top-2.5 h-6 w-24 rounded-full bg-gold-500/20" />
              <div className="absolute right-2.5 top-2.5 h-6 w-12 rounded-full bg-zinc-800/80" />
              <div className="absolute right-4 top-20 h-16 w-16 rounded-full bg-zinc-300/75" />

              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="mb-2 h-3 w-20 rounded bg-gold-500/40" />
                <div className="space-y-1">
                  <div className="h-8 w-52 rounded bg-zinc-700/80" />
                  <div className="h-8 w-44 rounded bg-zinc-700/70" />
                </div>
                <div className="mt-2 h-3 w-44 rounded bg-zinc-700/70" />

                <div className="mt-2 flex gap-1.5">
                  <div className="h-5 w-20 rounded-full bg-zinc-800/80" />
                  <div className="h-5 w-14 rounded-full bg-zinc-800/80" />
                  <div className="h-5 w-16 rounded-full bg-zinc-800/80" />
                </div>

                <div className="mt-3 flex items-end justify-between">
                  <div className="space-y-1">
                    <div className="h-2.5 w-8 rounded bg-zinc-700/80" />
                    <div className="h-9 w-24 rounded bg-zinc-600/80" />
                  </div>
                  <div className="h-4 w-20 rounded bg-emerald-500/30" />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
