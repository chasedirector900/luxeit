"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/types/cart";
import { formatKwacha } from "@/lib/currency";

type CartItemCardProps = {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
};

export function CartItemCard({ item, onIncrement, onDecrement, onRemove }: CartItemCardProps) {
  const lineTotal = item.price * item.quantity;

  return (
    <article className="rounded-2xl border border-gold-200/70 bg-white p-3 shadow-sm shadow-slate-900/[0.04] dark:border-gold-900/40 dark:bg-zinc-900/70 dark:shadow-none">
      <div className="flex gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-zinc-800">
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-bold text-slate-900 dark:text-zinc-100">{item.title}</h3>
          {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 ? (
            <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
              {Object.entries(item.selectedOptions)
                .map(([key, value]) => `${key}: ${value}`)
                .join(" · ")}
            </p>
          ) : null}
          <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400 uppercase">{item.selectedShippingMethod} shipping</p>
          {item.deliveryEstimate ? (
            <p className="text-[11px] text-slate-500 dark:text-zinc-500">{item.deliveryEstimate}</p>
          ) : null}
          <p className="mt-1 text-sm font-bold text-slate-900 dark:text-zinc-100">{formatKwacha(item.price)}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-1 rounded-xl border border-gold-200/70 bg-white p-1 dark:border-gold-900/40 dark:bg-zinc-950">
          <button
            type="button"
            aria-label={`Decrease quantity for ${item.title}`}
            onClick={onDecrement}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 transition-colors active:scale-90 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="inline-flex h-7 min-w-7 items-center justify-center px-1 text-sm font-bold">
            {item.quantity}
          </span>
          <button
            type="button"
            aria-label={`Increase quantity for ${item.title}`}
            onClick={onIncrement}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 transition-colors active:scale-90 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm font-black text-slate-900 dark:text-zinc-100">{formatKwacha(lineTotal)}</p>
          <button
            type="button"
            aria-label={`Remove ${item.title} from cart`}
            onClick={onRemove}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition-transform active:scale-90 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
