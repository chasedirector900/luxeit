"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { CartItemCard } from "@/components/cart/cart-item-card";
import { CartSummary } from "@/components/cart/cart-summary";

function CartHeader({ cartCount }: { cartCount: number }) {
  return (
    <header className="reveal-up flex items-center gap-3">
      <Link
        href="/"
        aria-label="Back"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none"
      >
        <ArrowLeft className="h-[18px] w-[18px]" />
      </Link>
      <div>
        <h1 className="text-xl font-black leading-none tracking-tight">Cart</h1>
        <p className="mt-1 text-[12px] text-slate-500 dark:text-zinc-400">
          {cartCount} {cartCount === 1 ? "item" : "items"}
        </p>
      </div>
    </header>
  );
}

export function CartPageClient() {
  const {
    items,
    cartCount,
    cartSubtotal,
    incrementQuantity,
    decrementQuantity,
    removeItem,
    clearCart,
  } = useCart();

  if (items.length === 0) {
    return (
      <section className="mx-auto w-full max-w-md space-y-5">
        <CartHeader cartCount={cartCount} />

        <div
          style={{ animationDelay: "60ms" }}
          className="reveal-up flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm shadow-slate-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900/60 dark:shadow-none"
        >
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-500 dark:text-gold-400">
            <ShoppingCart className="h-7 w-7" strokeWidth={1.8} />
          </span>
          <h2 className="mt-4 text-lg font-extrabold tracking-tight">Your cart is empty</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-zinc-400">
            Browse our products and add items to get started.
          </p>
          <Link
            href="/explore"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-gold-500 px-6 text-sm font-bold text-ink shadow-md shadow-gold-900/25 transition-transform duration-100 active:scale-95"
          >
            Start Shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-md space-y-5">
      <CartHeader cartCount={cartCount} />

      <div style={{ animationDelay: "60ms" }} className="reveal-up space-y-3">
        {items.map((item) => (
          <CartItemCard
            key={`${item.productId}-${item.variantId ?? "default"}-${Object.entries(item.selectedOptions ?? {})
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, v]) => `${k}:${v}`)
              .join("|")}`}
            item={item}
            onIncrement={() => incrementQuantity(item.productId, item.variantId, item.selectedOptions)}
            onDecrement={() => decrementQuantity(item.productId, item.variantId, item.selectedOptions)}
            onRemove={() => removeItem(item.productId, item.variantId, item.selectedOptions)}
          />
        ))}
      </div>

      <div style={{ animationDelay: "120ms" }} className="reveal-up">
        <CartSummary itemCount={cartCount} subtotal={cartSubtotal} onClear={clearCart} />
      </div>
    </section>
  );
}
