"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Minus,
  Plane,
  Plus,
  Ship,
  ShoppingCart,
  Star,
  Truck,
  Video,
  Warehouse,
} from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { recordProductEvent } from "@/lib/auth/api";
import { useCart } from "@/hooks/use-cart";
import { formatKwacha } from "@/lib/currency";
import { WAREHOUSE_META, deliveryLong } from "@/lib/products/warehouse";
import type { Product, ProductMediaItem } from "@/types/product";

type SearchProductDetailClientProps = {
  product: Product;
  related: Product[];
  /** Where the back button and "View all" link go. */
  backHref?: string;
  /** Base path for product detail links (back-reviews + related cards). */
  productHrefBase?: string;
};

const SHIPPING_METHODS: Array<{ key: "air" | "sea"; label: string; eta: string }> = [
  { key: "air", label: "Air Shipping", eta: "4-10 days" },
  { key: "sea", label: "Sea Shipping", eta: "12-25 days" },
];

const CARD_CLASS =
  "rounded-2xl border border-gold-200/70 bg-white p-4 shadow-sm shadow-slate-900/[0.04] dark:border-gold-900/40 dark:bg-zinc-900/60 dark:shadow-none";

const SELECT_ACTIVE =
  "border-gold-500 bg-gold-500/10 text-gold-600 dark:border-gold-400 dark:text-gold-300";
const SELECT_IDLE =
  "border-slate-300 bg-white text-slate-700 dark:border-gold-900/50 dark:bg-zinc-900 dark:text-zinc-300";

export function SearchProductDetailClient({
  product,
  related,
  backHref = "/explore/search",
  productHrefBase = "/explore/search/product",
}: SearchProductDetailClientProps) {
  const router = useRouter();
  const { addItem } = useCart();
  // Tell the feed this product was viewed, so recommendations learn (fires once
  // per product; no-op when signed out).
  useEffect(() => {
    void recordProductEvent(product.slug, "view");
  }, [product.slug]);
  const [quantity, setQuantity] = useState(1);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  // Which gallery images have actually finished loading, so the skeleton only
  // shows once per image (switching back to an already-loaded one is instant)
  // and switching the selection itself is instant even on a slow connection.
  // Resets naturally on navigation: `slug` is a route param, so Next remounts
  // this component (and its state) for a different product.
  const [loadedMedia, setLoadedMedia] = useState<Set<number>>(() => new Set());
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [compatibilitySelections, setCompatibilitySelections] = useState<Record<string, string>>({});
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [addState, setAddState] = useState<"idle" | "adding" | "added">("idle");
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  // China-hub goods can offer sea (cheaper, default) + air (pricier). The chosen
  // option drives the price the customer pays.
  const shippingOptions = product.shippingOptions ?? [];
  const isDualShipping = shippingOptions.length > 1;
  const [selectedShipping, setSelectedShipping] = useState<"air" | "sea">(
    isDualShipping ? "sea" : (product.shippingMethod ?? "air"),
  );
  const effectivePrice = shippingOptions.find((o) => o.method === selectedShipping)?.price ?? product.price;
  const ratings = product.ratings;
  const warehouse = product.warehouse ? WAREHOUSE_META[product.warehouse] : null;
  const deliveryInfo = product.warehouse
    ? deliveryLong(product.warehouse, selectedShipping)
    : (product.deliveryEstimate ?? "");

  const shippingMeta = useMemo(
    () => SHIPPING_METHODS.find((method) => method.key === selectedShipping) ?? SHIPPING_METHODS[0],
    [selectedShipping],
  );

  const resolvedMedia = useMemo<ProductMediaItem[]>(
    () =>
      product.media && product.media.length > 0
        ? product.media
        : [
            {
              type: "image",
              src: product.image,
              alt: product.title,
              objectFit: "contain",
            },
          ],
    [product.image, product.media, product.title],
  );

  const activeMedia = resolvedMedia[selectedMediaIndex] ?? resolvedMedia[0];

  const hasDiscount = product.originalPrice != null && product.originalPrice > effectivePrice;

  const productDescription = `${product.title} is curated for fast-moving import catalogs. Designed for quality checks, reliable supply lanes, and quick resell listing turnaround across regional marketplaces.`;

  const fallbackProductSpecs = [
    `Category: ${product.category ?? "General"}`,
    `Origin: ${product.origin ?? "Global"}`,
    ...(product.productType !== "digital"
      ? [
          `Shipping Mode: ${shippingMeta.label}`,
          `Delivery Window: ${product.deliveryEstimate ?? shippingMeta.eta}`,
        ]
      : [`Delivery: ${product.deliveryEstimate ?? "Instant"}`]),
  ];

  const isAddingLocked = addState === "adding" || addState === "added";

  const requiredOptions = useMemo(
    () => (product.options ?? []).filter((option) => option.required),
    [product.options],
  );

  const requiredCompatibilityFields = useMemo(() => {
    const fields = product.compatibility?.fields ?? [];
    if (product.compatibility?.required) return fields;
    return fields.filter((field) => field.required);
  }, [product.compatibility]);

  const handleAddToCart = () => {
    if (isAddingLocked) return;
    setSelectionError(null);

    for (const option of requiredOptions) {
      if (!selectedOptions[option.key]) {
        setSelectionError(`${option.name} is required.`);
        return;
      }
    }

    for (const field of requiredCompatibilityFields) {
      if (!compatibilitySelections[field.key]) {
        setSelectionError(`${field.label} is required.`);
        return;
      }
    }

    const selectedMeta: Record<string, string> = {
      ...selectedOptions,
      ...compatibilitySelections,
    };
    const variantId =
      Object.keys(selectedMeta).length > 0
        ? Object.entries(selectedMeta)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}:${value}`)
            .join("|")
        : null;

    setAddState("adding");

    addItem({
      productId: product.id,
      variantId,
      selectedOptions: selectedMeta,
      slug: product.slug,
      title: product.title,
      image: product.image,
      price: effectivePrice,
      quantity,
      selectedShippingMethod: selectedShipping,
      shippingPrices: isDualShipping
        ? {
            sea: shippingOptions.find((o) => o.method === "sea")?.price ?? effectivePrice,
            air: shippingOptions.find((o) => o.method === "air")?.price ?? effectivePrice,
          }
        : undefined,
      deliveryEstimate: product.deliveryEstimate ?? shippingMeta.eta,
      warehouse: product.warehouse,
    });

    window.setTimeout(() => {
      setAddState("added");
      setShowAddSuccess(true);

      window.setTimeout(() => {
        setAddState("idle");
      }, 900);

      window.setTimeout(() => {
        setShowAddSuccess(false);
      }, 1600);
    }, 240);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-28 pt-4 text-slate-900 dark:bg-black dark:text-zinc-100 md:px-8">
      <div className="mx-auto w-full max-w-md space-y-3 md:max-w-5xl">
        <header className="reveal-up flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(backHref)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-200/70 bg-white text-slate-700 shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-95 dark:border-gold-900/40 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-none"
            aria-label="Go back"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </button>
          <div>
            <h1 className="text-xl font-black leading-none tracking-tight">Product Details</h1>
            <p className="mt-1 text-[12px] text-slate-500 dark:text-zinc-400">Search catalog</p>
          </div>
        </header>

        <section className="reveal-up overflow-hidden rounded-3xl border border-gold-200/70 bg-white shadow-sm shadow-slate-900/[0.04] dark:border-gold-900/40 dark:bg-zinc-900/70 dark:shadow-none" style={{ animationDelay: "60ms" }}>
          <div className="relative aspect-[4/5] w-full bg-slate-100 dark:bg-zinc-950">
            {activeMedia.type === "video" ? (
              <video
                src={activeMedia.src}
                poster={activeMedia.thumbnail}
                controls
                playsInline
                preload="metadata"
                className="h-full w-full object-contain"
              />
            ) : (
              <>
                {!loadedMedia.has(selectedMediaIndex) ? (
                  <div className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-zinc-800" />
                ) : null}
                <Image
                  src={activeMedia.src}
                  alt={activeMedia.alt ?? product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 520px"
                  className={`transition-opacity duration-200 ${
                    activeMedia.objectFit === "cover" ? "object-cover" : "object-contain"
                  } ${loadedMedia.has(selectedMediaIndex) ? "opacity-100" : "opacity-0"}`}
                  priority={selectedMediaIndex === 0}
                  onLoad={() =>
                    setLoadedMedia((prev) => (prev.has(selectedMediaIndex) ? prev : new Set(prev).add(selectedMediaIndex)))
                  }
                />
              </>
            )}
            <div className="absolute left-3 top-3 inline-flex gap-1.5">
              {product.preorder ? (
                <span className="rounded-md bg-gold-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink shadow-sm">
                  Preorder
                </span>
              ) : null}
              {product.importTag ? (
                <span className="rounded-md bg-gold-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink shadow-sm">
                  {product.importTag}
                </span>
              ) : null}
            </div>
            {resolvedMedia.length > 1 ? (
              <div className="absolute bottom-3 left-3 right-3 z-20 flex gap-1.5 overflow-x-auto rounded-xl bg-slate-950/75 p-1.5 backdrop-blur dark:bg-zinc-950/75 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {resolvedMedia.map((media, idx) => {
                  const active = idx === selectedMediaIndex;
                  return (
                    <button
                      key={`${media.src}-${idx}`}
                      type="button"
                      onClick={() => setSelectedMediaIndex(idx)}
                      className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                        active ? "border-gold-400" : "border-transparent"
                      }`}
                      aria-label={`Select media ${idx + 1}`}
                    >
                      {media.type === "video" ? (
                        <>
                          {media.thumbnail ? (
                            <Image
                              src={media.thumbnail}
                              alt={media.title ?? `Video ${idx + 1}`}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-slate-900 dark:bg-zinc-900">
                              <Video className="h-4 w-4 text-zinc-300" />
                            </div>
                          )}
                          <span className="absolute bottom-0 left-0 right-0 bg-black/70 py-0.5 text-[8px] font-semibold text-white">
                            Video
                          </span>
                        </>
                      ) : (
                        <Image
                          src={media.src}
                          alt={media.alt ?? `${product.title} thumbnail ${idx + 1}`}
                          fill
                          sizes="48px"
                          className={media.objectFit === "cover" ? "object-cover" : "object-contain"}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="space-y-3.5 p-4">
            <div>
              <div className="flex items-baseline gap-1.5">
                {isDualShipping ? (
                  <span className="text-[13px] font-bold uppercase tracking-wide text-slate-400 dark:text-zinc-500">
                    {selectedShipping === "air" ? "Air" : "Sea"}
                  </span>
                ) : null}
                <p className="text-[1.75rem] font-black leading-none">{formatKwacha(effectivePrice)}</p>
              </div>
              {hasDiscount ? (
                <p className="mt-1.5 text-[12px] text-slate-500 dark:text-zinc-400">
                  <span className="line-through">{formatKwacha(product.originalPrice!)}</span>
                </p>
              ) : null}
            </div>

            <h2 className="text-lg font-extrabold leading-tight">{product.title}</h2>

            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded-md bg-slate-100 px-2.5 py-1 font-semibold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                {product.category ?? "General"}
              </span>
              {warehouse ? (
                <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-bold ${warehouse.badge}`}>
                  <Warehouse className="h-3 w-3" />
                  {warehouse.label} Hub
                </span>
              ) : (
                <span className="rounded-md bg-slate-100 px-2.5 py-1 font-semibold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {product.origin ?? "Global"}
                </span>
              )}
              {product.popularityLabel ? (
                <span className="rounded-md bg-gold-500/15 px-2.5 py-1 font-semibold text-gold-600 dark:text-gold-400">
                  {product.popularityLabel} popular
                </span>
              ) : null}
            </div>

            {warehouse && deliveryInfo ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-gold-200/70 bg-slate-50 px-3 py-2.5 dark:border-gold-900/40 dark:bg-zinc-900/70">
                <Truck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-[12px] leading-snug text-slate-600 dark:text-zinc-300">
                  <span className="font-bold text-slate-900 dark:text-zinc-100">Ships from {warehouse.label}</span> · {deliveryInfo}
                </p>
              </div>
            ) : null}

            {/* Shipping option — China dual freight (sea vs air), drives the price */}
            {isDualShipping ? (
              <div>
                <p className="mb-2 text-[12px] font-semibold text-slate-500 dark:text-zinc-400">Choose shipping</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {shippingOptions.map((opt) => {
                    const active = selectedShipping === opt.method;
                    const Icon = opt.method === "air" ? Plane : Ship;
                    return (
                      <button
                        key={opt.method}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSelectedShipping(opt.method)}
                        className={`rounded-xl border p-3 text-left transition-transform active:scale-[0.98] ${
                          active
                            ? "border-gold-500/60 bg-gold-500/10 dark:border-gold-400/50 dark:bg-gold-500/15"
                            : "border-gold-200/70 bg-white dark:border-gold-900/40 dark:bg-zinc-900"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className={`h-4 w-4 ${active ? "text-gold-600 dark:text-gold-400" : "text-slate-500 dark:text-zinc-400"}`} />
                          <span className={`text-sm font-bold ${active ? "text-gold-700 dark:text-gold-300" : "text-slate-900 dark:text-zinc-100"}`}>{opt.label}</span>
                          {opt.method === "sea" ? (
                            <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Cheapest</span>
                          ) : null}
                        </div>
                        <p className="mt-1.5 text-[15px] font-black leading-none text-slate-900 dark:text-zinc-100">{formatKwacha(opt.price)}</p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">{opt.eta}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="rounded-xl border border-gold-200/70 bg-slate-50 p-3 dark:border-gold-900/40 dark:bg-zinc-900/70">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-slate-500 dark:text-zinc-400">Quantity</p>
                <div className="inline-flex items-center gap-1 rounded-xl border border-gold-200/70 bg-white p-1 dark:border-gold-900/40 dark:bg-zinc-950">
                  <button
                    type="button"
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 transition-colors active:scale-90 disabled:opacity-40 dark:text-zinc-300"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((value) => value + 1)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 transition-colors active:scale-90 dark:text-zinc-300"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {product.options && product.options.length > 0 ? (
              <div className="space-y-2.5 rounded-xl border border-gold-200/70 bg-slate-50 p-3 dark:border-gold-900/40 dark:bg-zinc-900/70">
                <h3 className="text-[12px] font-semibold text-slate-500 dark:text-zinc-400">Options</h3>
                <div className="space-y-2.5">
                  {product.options.map((option) => (
                    <div key={option.key}>
                      <p className="mb-1.5 text-[12px] font-semibold text-slate-700 dark:text-zinc-300">
                        {option.name}
                        {option.required ? " *" : ""}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {option.values.map((value) => {
                          const active = selectedOptions[option.key] === value;
                          const stock = option.stockByValue?.[value];
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setSelectedOptions((prev) => ({
                                  ...prev,
                                  [option.key]: value,
                                }))
                              }
                              className={`rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors active:scale-95 ${
                                active ? SELECT_ACTIVE : SELECT_IDLE
                              }`}
                            >
                              {value}
                              {typeof stock === "number" ? ` (${stock})` : ""}
                            </button>
                          );
                        })}
                      </div>
                      {option.note ? (
                        <p className="mt-1 text-[10px] text-slate-500 dark:text-zinc-500">{option.note}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {product.compatibility?.fields?.length ? (
              <div className="space-y-2.5 rounded-xl border border-gold-200/70 bg-slate-50 p-3 dark:border-gold-900/40 dark:bg-zinc-900/70">
                <h3 className="text-[12px] font-semibold text-slate-500 dark:text-zinc-400">
                  {product.compatibility.title}
                </h3>
                <div className="space-y-2.5">
                  {product.compatibility.fields.map((field) => (
                    <div key={field.key}>
                      <p className="mb-1.5 text-[12px] font-semibold text-slate-700 dark:text-zinc-300">
                        {field.label}
                        {field.required || product.compatibility?.required ? " *" : ""}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {field.values.map((value) => {
                          const active = compatibilitySelections[field.key] === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setCompatibilitySelections((prev) => ({
                                  ...prev,
                                  [field.key]: value,
                                }))
                              }
                              className={`rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors active:scale-95 ${
                                active ? SELECT_ACTIVE : SELECT_IDLE
                              }`}
                            >
                              {value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {product.compatibility.note ? (
                  <p className="rounded-lg border border-gold-500/30 bg-gold-500/10 px-2.5 py-1.5 text-[11px] text-gold-700 dark:text-gold-300">
                    {product.compatibility.note}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        {ratings ? (
          <section className={`reveal-up ${CARD_CLASS}`} style={{ animationDelay: "120ms" }}>
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold tracking-tight">Ratings and reviews</h3>
                <p className="mt-1 text-[12px] text-slate-500 dark:text-zinc-400">
                  Ratings are verified and from people who bought this item.
                </p>
              </div>
              <Link
                href={`${productHrefBase}/${product.slug}/reviews-rating`}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-200/70 text-slate-600 transition-transform duration-100 active:scale-95 dark:border-gold-900/50 dark:text-zinc-300"
                aria-label="Open full reviews"
              >
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-4">
              <div>
                <p className="text-4xl font-black leading-none">{ratings.ratingAverage.toFixed(1)}</p>
                <div className="mt-1.5 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const active = idx < Math.round(ratings.ratingAverage);
                    return (
                      <Star
                        key={idx}
                        className={`h-3.5 w-3.5 ${active ? "fill-amber-400 text-gold-400" : "text-slate-300 dark:text-zinc-600"}`}
                      />
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[12px] text-slate-500 dark:text-zinc-400">
                  {ratings.ratingCount.toLocaleString()} ratings
                </p>
              </div>
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((level) => {
                  const count = ratings.ratingBreakdown[level as 1 | 2 | 3 | 4 | 5] ?? 0;
                  const width = ratings.ratingCount > 0 ? (count / ratings.ratingCount) * 100 : 0;
                  return (
                    <div key={level} className="grid grid-cols-[10px_1fr] items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">{level}</span>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
                        <div className="h-full rounded-full bg-gold-500" style={{ width: `${Math.max(2, width)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {ratings.reviewTags.length > 0 ? (
              <div className="mt-3.5 flex flex-wrap gap-2">
                {ratings.reviewTags.slice(0, 4).map((tag) => (
                  <span
                    key={tag.label}
                    className="rounded-full border border-gold-200/70 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:border-gold-900/50 dark:text-zinc-300"
                  >
                    {tag.label} {tag.count}
                  </span>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        <section className={`reveal-up ${CARD_CLASS}`} style={{ animationDelay: "160ms" }}>
          <h3 className="text-base font-extrabold tracking-tight">Description</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-600 dark:text-zinc-400">{productDescription}</p>
        </section>

        {product.specGroups && product.specGroups.length > 0 ? (
          product.specGroups.map((group) => (
            <section key={group.title} className={`reveal-up ${CARD_CLASS}`} style={{ animationDelay: "160ms" }}>
              <h3 className="text-base font-extrabold tracking-tight">{group.title}</h3>
              <ul className="mt-2.5 space-y-1.5 text-[13px] text-slate-600 dark:text-zinc-400">
                {group.specs.map((spec) => (
                  <li key={`${group.title}-${spec.label}`} className="flex justify-between gap-3">
                    <span className="text-slate-500 dark:text-zinc-500">{spec.label}</span>
                    <span className="text-right font-medium text-slate-700 dark:text-zinc-300">{spec.value}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))
        ) : (
          <section className={`reveal-up ${CARD_CLASS}`} style={{ animationDelay: "160ms" }}>
            <h3 className="text-base font-extrabold tracking-tight">Product Information</h3>
            <ul className="mt-2.5 space-y-1.5 text-[13px] text-slate-600 dark:text-zinc-400">
              {fallbackProductSpecs.map((spec) => (
                <li key={spec}>{spec}</li>
              ))}
            </ul>
          </section>
        )}

        {product.packageContents && product.packageContents.length > 0 ? (
          <section className={`reveal-up ${CARD_CLASS}`} style={{ animationDelay: "160ms" }}>
            <h3 className="text-base font-extrabold tracking-tight">Package Contents</h3>
            <ul className="mt-2.5 space-y-1.5 text-[13px] text-slate-600 dark:text-zinc-400">
              {product.packageContents.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {product.notices && product.notices.length > 0 ? (
          <section className={`reveal-up ${CARD_CLASS}`} style={{ animationDelay: "160ms" }}>
            <h3 className="text-base font-extrabold tracking-tight">Notes</h3>
            <ul className="mt-2.5 space-y-1.5 text-[13px] text-slate-600 dark:text-zinc-400">
              {product.notices.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="reveal-up" style={{ animationDelay: "200ms" }}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-extrabold tracking-tight">You may also like</h3>
            <Link
              href={backHref}
              className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-gold-600 dark:text-gold-400"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                showAddToCart
                variant="search"
                detailHrefBase={productHrefBase}
              />
            ))}
          </div>
        </section>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.4rem+env(safe-area-inset-bottom))] z-40 px-4 md:hidden">
        <div className="pointer-events-auto mx-auto w-full max-w-md rounded-2xl border border-gold-200/70 bg-white/95 p-2 shadow-lg shadow-slate-900/10 backdrop-blur dark:border-gold-900/40 dark:bg-zinc-950/95 dark:shadow-black/40">
          {showAddSuccess ? (
            <div className="mb-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Added to cart successfully.
            </div>
          ) : null}
          {selectionError ? (
            <div className="mb-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {selectionError}
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAddingLocked}
            className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-md transition-transform active:scale-[0.98] ${
              isAddingLocked
                ? "bg-gold-400 shadow-none"
                : "bg-gold-500 shadow-gold-900/25"
            }`}
          >
            {addState === "added" ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            {addState === "adding" ? "Adding..." : addState === "added" ? "Added" : "Add to Cart"}
            <span className="text-xs font-semibold opacity-80">{formatKwacha(effectivePrice * quantity)}</span>
          </button>
        </div>
      </div>
    </main>
  );
}
