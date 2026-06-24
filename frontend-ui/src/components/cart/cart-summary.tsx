"use client";

import Link from "next/link";
import { formatKwacha } from "@/lib/currency";

type CartSummaryProps = {
  itemCount: number;
  subtotal: number;
  onClear: () => void;
};

export function CartSummary({ itemCount, subtotal, onClear }: CartSummaryProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500 dark:text-zinc-400">Items</span>
        <span className="font-semibold text-slate-900 dark:text-zinc-100">{itemCount}</span>
      </div>

      <div className="my-3 border-t border-slate-200 dark:border-zinc-800" />

      <div className="flex items-end justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">Subtotal</span>
        <span className="text-2xl font-black leading-none text-slate-900 dark:text-zinc-100">{formatKwacha(subtotal)}</span>
      </div>

      <Link
        href="/cart/checkout"
        className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-900/25 transition-transform duration-100 active:scale-[0.98]"
      >
        Checkout
      </Link>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-transform duration-100 active:scale-[0.98] md:hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:md:hover:bg-zinc-800"
      >
        Clear Cart
      </button>
    </section>
  );
}
