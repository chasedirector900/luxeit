"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useOptionalCart } from "@/hooks/use-cart";

/** Header cart button with a live item-count badge (matches the bottom-nav badge). */
export function CartButton() {
  const cart = useOptionalCart();
  const cartCount = cart?.cartCount ?? 0;

  return (
    <Link
      href="/cart"
      aria-label={cartCount > 0 ? `Open cart, ${cartCount} item${cartCount === 1 ? "" : "s"}` : "Open cart"}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold-200/70 bg-white text-slate-700 shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-95 md:hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60 dark:border-gold-900/40 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none dark:md:hover:bg-zinc-800"
    >
      <ShoppingCart className="h-[18px] w-[18px]" />
      {cartCount > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-ink ring-2 ring-slate-50 dark:ring-black">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      ) : null}
    </Link>
  );
}
