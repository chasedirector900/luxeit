"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Heart, ShoppingCart, Truck, Warehouse } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { motion } from "motion/react";
import type { Product } from "@/types/product";
import { useCart } from "@/hooks/use-cart";
import { useSaved } from "@/hooks/use-saved";
import { formatKwacha } from "@/lib/currency";
import { WAREHOUSE_META, deliveryShort } from "@/lib/products/warehouse";

type ProductCardProps = {
  product: Product;
  showAddToCart?: boolean;
  variant?: "default" | "search";
  /** Base path for the product detail link; slug is appended. */
  detailHrefBase?: string;
};

function ProductCardBase({
  product,
  showAddToCart = true,
  variant = "default",
  detailHrefBase = "/explore/search/product",
}: ProductCardProps) {
  const { addItem } = useCart();
  const { isSaved, toggleSaved, enabled: savedEnabled } = useSaved();
  const [added, setAdded] = useState(false);
  const searchVariant = variant === "search";
  const detailHref = `${detailHrefBase}/${product.slug}`;
  const saved = isSaved(product.id);
  const warehouse = product.warehouse ? WAREHOUSE_META[product.warehouse] : null;
  const delivery = product.warehouse
    ? deliveryShort(product.warehouse, product.shippingMethod)
    : product.deliveryEstimate;

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 1300);
    return () => window.clearTimeout(timer);
  }, [added]);

  return (
    <motion.article
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="group transform-gpu overflow-hidden rounded-2xl border border-gold-200/70 bg-white shadow-sm shadow-slate-900/[0.04] dark:border-gold-900/40 dark:bg-zinc-900/70 dark:shadow-none"
    >
      <Link href={detailHref} prefetch={true} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 430px) 46vw, (max-width: 768px) 180px, 220px"
            className="object-cover"
          />

          <div className="absolute left-2.5 top-2.5 inline-flex gap-1">
            {product.preorder ? (
              <span className="rounded-md bg-gold-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink shadow-sm">
                Preorder
              </span>
            ) : null}
            {warehouse ? (
              <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm ${warehouse.badge}`}>
                <Warehouse className="h-2.5 w-2.5" />
                {warehouse.label}
              </span>
            ) : null}
          </div>

          {savedEnabled ? (
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
          ) : null}
        </div>
      </Link>

      <div className="p-3">
        <Link href={detailHref} prefetch={true}>
          <h3 className="line-clamp-2 min-h-[2.4rem] text-[14px] font-bold leading-tight text-slate-900 dark:text-zinc-100">
            {product.title}
          </h3>
        </Link>

        <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
          <span className="truncate text-slate-500 dark:text-zinc-400">{product.category ?? "General"}</span>
          {searchVariant && product.popularityLabel ? (
            <span className="shrink-0 font-semibold text-gold-600 dark:text-gold-400">{product.popularityLabel} sold</span>
          ) : null}
        </div>

        {delivery ? (
          <div className="mt-1.5 flex min-h-4 items-center gap-1 overflow-hidden text-[10px] text-slate-400 dark:text-zinc-500">
            <Truck className="h-3 w-3 shrink-0" />
            <span className="truncate">{delivery}</span>
          </div>
        ) : null}

        <div className="mt-2.5 flex items-end justify-between gap-1.5">
          <span className="text-[17px] font-black leading-none text-slate-900 dark:text-zinc-100">
            {formatKwacha(product.price)}
          </span>

          {showAddToCart ? (
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
                  // Dual-shipping items default to sea (the headline "From" price).
                  selectedShippingMethod: product.airPrice ? "sea" : (product.shippingMethod ?? "air"),
                  deliveryEstimate: product.deliveryEstimate ?? null,
                  warehouse: product.warehouse,
                  shippingPrices: product.airPrice ? { sea: product.price, air: product.airPrice } : undefined,
                });
                setAdded(true);
              }}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md transition-colors ${
                added
                  ? "bg-emerald-500 shadow-emerald-900/20"
                  : "bg-gold-500 shadow-gold-900/25"
              }`}
            >
              {added ? <Check className="h-[17px] w-[17px]" /> : <ShoppingCart className="h-[17px] w-[17px]" />}
            </motion.button>
          ) : null}
        </div>
      </div>

      {added ? (
        <div className="fixed bottom-[calc(4.8rem+env(safe-area-inset-bottom))] left-1/2 z-[60] -translate-x-1/2 rounded-full border border-emerald-500/20 bg-slate-950 px-3 py-2 text-[11px] font-semibold text-emerald-300 shadow-sm dark:bg-zinc-950 md:hidden">
          Added to cart
        </div>
      ) : null}
    </motion.article>
  );
}

export const ProductCard = memo(ProductCardBase);
