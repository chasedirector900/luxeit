"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Clock, Search, Sparkles, TrendingUp, X } from "lucide-react";
import { useEffect, useRef } from "react";

type FullScreenSearchProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function FullScreenSearch({ isOpen, onClose }: FullScreenSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
      return () => {
        window.clearTimeout(timer);
        document.body.style.overflow = "";
      };
    }

    document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const trendingSearches = [
    "Luxury Chronograph Watches",
    "Minimalist Gold Rings",
    "Premium Leather Bags",
    "Designer Sunglasses",
  ];

  const recentSearches = ["Mechanical Automatic Watch", "Silver Cuban Chain"];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-white/95 p-6 text-neutral-900 backdrop-blur-xl dark:bg-zinc-950/95 dark:text-white"
        >
          <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-6 pt-4 dark:border-zinc-900/60">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Global Search
              </span>
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 transition-colors hover:text-slate-900 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:text-white"
                aria-label="Close search overlay"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-12">
              <div className="flex w-full items-center gap-4 border-b-2 border-neutral-900 pb-4 dark:border-white">
                <Search className="h-6 w-6 shrink-0 text-slate-400 dark:text-zinc-500" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search premium goods or ask LUXEIT AI..."
                  className="w-full bg-transparent text-xl font-medium outline-none placeholder:text-slate-300 dark:placeholder:text-zinc-700 md:text-2xl"
                />
              </div>

              <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2">
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      <Clock className="h-3.5 w-3.5" /> Recent Searches
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      {recentSearches.map((item) => (
                        <button
                          key={item}
                          className="py-1 text-left text-[14px] font-medium text-slate-600 transition-colors hover:text-neutral-900 dark:text-zinc-300 dark:hover:text-white"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      <TrendingUp className="h-3.5 w-3.5" /> Trending Drops
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {trendingSearches.map((keyword) => (
                        <button
                          key={keyword}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium transition-all hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-zinc-900"
                        >
                          {keyword}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="group flex flex-col justify-between rounded-2xl border border-amber-500/10 bg-amber-500/[0.02] p-5 dark:border-amber-400/10 dark:bg-amber-400/[0.02]">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      <Sparkles className="h-3 w-3" /> AI Copilot
                    </span>
                    <h4 className="mt-3 text-lg font-semibold">Find products with natural language</h4>
                    <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
                      Ask for style, budget, or occasion and get curated luxury picks instantly.
                    </p>
                  </div>
                  <button className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-amber-700 transition-colors group-hover:text-amber-600 dark:text-amber-400 dark:group-hover:text-amber-300">
                    Try Smart Search <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
