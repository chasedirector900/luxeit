"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Heart, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { ListingProduct } from "@/lib/category/shared";
import { useCart } from "@/hooks/use-cart";
import { useSaved } from "@/hooks/use-saved";
import { formatKwacha } from "@/lib/currency";

type ListingProductCardProps = {
  product: ListingProduct;
  /** Base path for the detail link; slug is appended. */
  detailHrefBase: string;
};

export function ListingProductCard({ product, detailHrefBase }: ListingProductCardProps) {
  const { addItem } = useCart();
  const { isSaved, toggleSaved } = useSaved();
  const [added, setAdded] = useState(false);
  const detailHref = `${detailHrefBase}/${product.slug}`;
  const saved = isSaved(product.id);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 1000);
    return () => window.clearTimeout(timer);
  }, [added]);

  return (
    <motion.article
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="transform-gpu overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none"
    >
      <Link href={detailHref} prefetch={false} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 430px) 46vw, 200px"
            className="object-cover"
          />

          {product.badge ? (
            <span
              className={`absolute left-2.5 top-2.5 rounded-md px-2 py-0.5 text-[11px] font-bold shadow-sm ${
                product.badge.tone === "new" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
              }`}
            >
              {product.badge.label}
            </span>
          ) : null}

          <button
            type="button"
            aria-label={saved ? "Remove from saved" : "Save item"}
            aria-pressed={saved}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleSaved({
                id: product.id,
                slug: product.slug,
                title: product.title,
                image: product.image,
                price: product.price,
                href: detailHref,
              });
            }}
            className="absolute right-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-sm backdrop-blur-sm transition-transform active:scale-90 dark:bg-zinc-950/80 dark:text-zinc-300"
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>
        </div>
      </Link>

      <div className="p-3">
        <Link href={detailHref} prefetch={false}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-[15px] font-bold leading-tight text-slate-900 dark:text-zinc-100">
            {product.title}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-1 text-[12px] text-slate-500 dark:text-zinc-400">{product.subtitle}</p>

        <div className="mt-2.5 flex items-end justify-between gap-1.5">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
            {product.airPrice ? (
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-zinc-500">From</span>
            ) : null}
            <span className="text-[17px] font-black leading-none text-slate-900 dark:text-zinc-100">
              {formatKwacha(product.price)}
            </span>
            {product.originalPrice ? (
              <span className="text-[12px] font-medium text-slate-400 line-through dark:text-zinc-500">
                {formatKwacha(product.originalPrice)}
              </span>
            ) : null}
          </div>

          <motion.button
            type="button"
            aria-label={added ? "Added to cart" : `Add ${product.title} to cart`}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              addItem({
                productId: product.id,
                variantId: null,
                slug: product.slug,
                title: product.title,
                image: product.image,
                price: product.price,
                quantity: 1,
                // Default to sea (the cheaper "From" price shown on the card).
                selectedShippingMethod: "sea",
                deliveryEstimate: null,
                warehouse: "china",
                shippingPrices: product.airPrice
                  ? { sea: product.price, air: product.airPrice }
                  : undefined,
              });
              setAdded(true);
            }}
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md transition-colors ${
              added ? "bg-emerald-500 shadow-emerald-900/20" : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-900/25"
            }`}
          >
            {added ? <Check className="h-[17px] w-[17px]" /> : <ShoppingCart className="h-[17px] w-[17px]" />}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
