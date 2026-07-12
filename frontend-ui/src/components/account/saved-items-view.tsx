"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Heart, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useSaved } from "@/hooks/use-saved";
import { formatKwacha } from "@/lib/currency";

export function SavedItemsView() {
  const { items, savedCount, removeSaved } = useSaved();

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <header className="reveal-up flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/account"
            aria-label="Back to account"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Link>
          <div>
            <h1 className="text-xl font-black leading-none tracking-tight">Saved items</h1>
            <p className="mt-1 text-[12px] text-slate-500 dark:text-zinc-400">
              {savedCount} {savedCount === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
        {savedCount > 0 ? (
          <button
            type="button"
            onClick={() => items.forEach((item) => removeSaved(item.id))}
            className="text-[12px] font-semibold text-slate-500 transition-colors active:text-rose-500 dark:text-zinc-400"
          >
            Clear all
          </button>
        ) : null}
      </header>

      {items.length > 0 ? (
        <div style={{ animationDelay: "60ms" }} className="reveal-up grid grid-cols-2 gap-3">
          {items.map((item) => (
            <motion.article
              key={item.id}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="transform-gpu overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none"
            >
              <Link href={item.href} className="block">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
                  <Image src={item.image} alt={item.title} fill sizes="(max-width: 430px) 46vw, 200px" className="object-cover" />
                  <button
                    type="button"
                    aria-label="Remove from saved"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      removeSaved(item.id);
                    }}
                    className="absolute right-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-rose-500 shadow-sm backdrop-blur-sm transition-transform active:scale-90 dark:bg-zinc-950/80"
                  >
                    <Heart className="h-4 w-4 fill-rose-500" />
                  </button>
                </div>
              </Link>

              <div className="p-3">
                <Link href={item.href}>
                  <h3 className="line-clamp-2 min-h-[2.5rem] text-[14px] font-bold leading-tight text-slate-900 dark:text-zinc-100">
                    {item.title}
                  </h3>
                </Link>
                <div className="mt-2 flex items-center justify-between gap-1.5">
                  <span className="text-[17px] font-black leading-none text-slate-900 dark:text-zinc-100">
                    {formatKwacha(item.price)}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove from saved"
                    onClick={() => removeSaved(item.id)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-transform active:scale-90 dark:border-zinc-800 dark:text-zinc-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <div className="reveal-up flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm shadow-slate-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900/60 dark:shadow-none">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 dark:text-rose-400">
            <Heart className="h-7 w-7" strokeWidth={1.8} />
          </span>
          <h2 className="mt-4 text-lg font-extrabold tracking-tight">No saved items yet</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-zinc-400">
            Tap the heart on any product to save it here for later.
          </p>
          <Link
            href="/explore"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-6 text-sm font-bold text-white shadow-md shadow-indigo-900/25 transition-transform duration-100 active:scale-95"
          >
            Browse products
          </Link>
        </div>
      )}
    </div>
  );
}
