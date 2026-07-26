"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { formatKwacha } from "@/lib/currency";

type CartSummaryProps = {
  itemCount: number;
  subtotal: number;
  onClear: () => void;
};

const BTN = "mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-transform duration-100 active:scale-[0.98]";

export function CartSummary({ itemCount, subtotal, onClear }: CartSummaryProps) {
  const { status } = useAuth();
  const authed = status === "authenticated";
  const loading = status === "loading";

  return (
    <section className="rounded-2xl border border-gold-200/70 bg-white p-4 shadow-sm shadow-slate-900/[0.04] dark:border-gold-900/40 dark:bg-zinc-900/70 dark:shadow-none">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500 dark:text-zinc-400">Items</span>
        <span className="font-semibold text-slate-900 dark:text-zinc-100">{itemCount}</span>
      </div>

      <div className="my-3 border-t border-gold-200/70 dark:border-gold-900/40" />

      <div className="flex items-end justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">Subtotal</span>
        <span className="text-2xl font-black leading-none text-slate-900 dark:text-zinc-100">{formatKwacha(subtotal)}</span>
      </div>

      {authed ? (
        <Link
          href="/cart/checkout"
          className={`${BTN} bg-gold-500 text-ink shadow-md shadow-gold-900/25`}
        >
          Checkout
        </Link>
      ) : loading ? (
        // Brief auth-resolving state — keep checkout inert to avoid a wrong flash.
        <span className={`${BTN} cursor-default bg-slate-200 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500`} aria-disabled>
          Checkout
        </span>
      ) : (
        <Link
          href="/login?next=/cart/checkout"
          className={`${BTN} border border-gold-200/70 bg-white text-slate-700 dark:border-gold-900/50 dark:bg-zinc-900 dark:text-zinc-200`}
        >
          <Lock className="h-4 w-4" />
          Sign in to checkout
        </Link>
      )}
      {!authed && !loading ? (
        <p className="mt-1.5 text-center text-[12px] text-slate-500 dark:text-zinc-400">Sign in to place your order.</p>
      ) : null}

      <button
        type="button"
        onClick={onClear}
        className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl border border-gold-200/70 bg-white text-sm font-bold text-slate-700 transition-transform duration-100 active:scale-[0.98] md:hover:bg-slate-100 dark:border-gold-900/40 dark:bg-zinc-900 dark:text-zinc-300 dark:md:hover:bg-zinc-800"
      >
        Clear Cart
      </button>
    </section>
  );
}
