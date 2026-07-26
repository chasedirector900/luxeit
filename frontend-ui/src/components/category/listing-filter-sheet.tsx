"use client";

import { Check, Filter, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";

const SORTS = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
] as const;

const PRICES = [
  { key: "all", label: "All prices" },
  { key: "lt50", label: "Under K500" },
  { key: "gte50", label: "K500 & up" },
] as const;

export function ListingFilterSheet() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();

  const urlSort = searchParams.get("sort") ?? "featured";
  const urlPrice = searchParams.get("price") ?? "all";
  const hasActiveFilters = urlSort !== "featured" || urlPrice !== "all";

  // Pending selection is local — taps update it instantly with no navigation.
  // We commit to the URL once, when the sheet closes.
  const [pendingSort, setPendingSort] = useState(urlSort);
  const [pendingPrice, setPendingPrice] = useState(urlPrice);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  function openSheet() {
    setPendingSort(urlSort);
    setPendingPrice(urlPrice);
    setIsOpen(true);
  }

  function closeSheet() {
    setIsOpen(false);

    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (pendingSort === "featured") params.delete("sort");
    else params.set("sort", pendingSort);
    if (pendingPrice === "all") params.delete("price");
    else params.set("price", pendingPrice);

    const nextQuery = params.toString();
    const next = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    const currentQuery = searchParams.toString();
    const current = currentQuery ? `${pathname}?${currentQuery}` : pathname;

    if (next !== current) {
      startTransition(() => {
        router.replace(next, { scroll: false });
      });
    }
  }

  const pendingDirty = pendingSort !== "featured" || pendingPrice !== "all";

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="relative inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-900/[0.03] transition-transform duration-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none"
      >
        <Filter className="h-[18px] w-[18px]" />
        Filter
        {hasActiveFilters ? (
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-gold-500 ring-2 ring-slate-50 dark:ring-black" />
        ) : null}
      </button>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {isOpen ? (
                <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Filter products">
                  <motion.div
                    className="absolute inset-0 bg-black/60"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={closeSheet}
                  />
                  <motion.div
                    className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md transform-gpu rounded-t-3xl border-t border-slate-200 bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", stiffness: 420, damping: 40 }}
                  >
                    <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-zinc-800" />

                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">Filters</h2>
                      <button
                        type="button"
                        onClick={closeSheet}
                        aria-label="Close filters"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-transform duration-100 active:scale-95 dark:border-zinc-800 dark:text-zinc-400"
                      >
                        <X className="h-[18px] w-[18px]" />
                      </button>
                    </div>

                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Sort by</p>
                    <div className="space-y-2">
                      {SORTS.map((option) => {
                        const selected = pendingSort === option.key;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => setPendingSort(option.key)}
                            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-colors active:scale-[0.99] ${
                              selected
                                ? "border-gold-500/60 bg-gold-500/10 text-gold-600 dark:border-gold-400/50 dark:bg-gold-500/15 dark:text-gold-300"
                                : "border-slate-200 bg-white text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                            }`}
                          >
                            {option.label}
                            {selected ? <Check className="h-[18px] w-[18px]" /> : null}
                          </button>
                        );
                      })}
                    </div>

                    <p className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Price</p>
                    <div className="space-y-2">
                      {PRICES.map((option) => {
                        const selected = pendingPrice === option.key;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => setPendingPrice(option.key)}
                            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition-colors active:scale-[0.99] ${
                              selected
                                ? "border-gold-500/60 bg-gold-500/10 text-gold-600 dark:border-gold-400/50 dark:bg-gold-500/15 dark:text-gold-300"
                                : "border-slate-200 bg-white text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                            }`}
                          >
                            {option.label}
                            {selected ? <Check className="h-[18px] w-[18px]" /> : null}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setPendingSort("featured");
                          setPendingPrice("all");
                        }}
                        disabled={!pendingDirty}
                        className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition-transform duration-100 active:scale-[0.98] disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={closeSheet}
                        className="flex-1 rounded-xl bg-gold-500 py-3 text-sm font-bold text-ink shadow-md shadow-gold-900/25 transition-transform duration-100 active:scale-[0.98]"
                      >
                        Show results
                      </button>
                    </div>
                  </motion.div>
                </div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
