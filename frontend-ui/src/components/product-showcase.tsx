"use client";

import React, { useCallback, useMemo, useRef } from "react";
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { ProductShowcaseSkeleton } from "@/components/product-showcase-skeleton";
import Image from "next/image";

interface ProductItem {
  id: string;
  title: string;
  subtitle: string;
  platform: string;
  genre: string;
  extraTag: string;
  price: string;
  stock: string;
  countdown: string;
  releaseDate: string;
  imageSrc: string;
}

const makeCardImage = (title: string, a: string, b: string, accent = "rgba(255,255,255,0.22)") =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 750'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='${a}'/>
          <stop offset='100%' stop-color='${b}'/>
        </linearGradient>
      </defs>
      <rect width='1200' height='750' fill='url(#g)'/>
      <circle cx='950' cy='120' r='220' fill='${accent}'/>
      <circle cx='180' cy='690' r='280' fill='rgba(255,255,255,0.08)'/>
      <rect x='0' y='420' width='1200' height='330' fill='rgba(0,0,0,0.38)'/>
      <text x='50%' y='57%' fill='rgba(255,255,255,0.22)' font-size='126' font-family='Impact, Arial, sans-serif' font-weight='900' text-anchor='middle' letter-spacing='2'>${title}</text>
    </svg>`,
  )}`;

type ProductShowcaseProps = {
  isLoading?: boolean;
};

export function ProductShowcase({ isLoading = false }: ProductShowcaseProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const displayProducts = useMemo<ProductItem[]>(
    () => [
      {
        id: "prod_01",
        title: "UFC 6 Ultimate Edition PRE-ORDER EU Xbox Series X|S",
        subtitle: "PRE-ORDER EU Xbox Series X|S Key",
        platform: "Xbox Series X|S",
        genre: "Action",
        extraTag: "Adventure",
        price: "$125.51",
        stock: "100 in stock",
        countdown: "28d",
        releaseDate: "Jun 19, 2026",
        imageSrc: makeCardImage("UFC 6", "#2a1a16", "#5d1d16", "rgba(255,186,109,0.16)"),
      },
      {
        id: "prod_02",
        title: "UFC 6 Ultimate Edition PRE-ORDER EU Xbox Series X|S",
        subtitle: "PRE-ORDER EU Xbox Series X|S Key",
        platform: "Xbox Series X|S",
        genre: "Action",
        extraTag: "Adventure",
        price: "$125.51",
        stock: "100 in stock",
        countdown: "28d",
        releaseDate: "Jun 19, 2026",
        imageSrc: makeCardImage("UFC 6", "#2a1a16", "#5d1d16", "rgba(255,186,109,0.16)"),
      },
      {
        id: "prod_03",
        title: "UFC 6 Ultimate Edition PRE-ORDER EU Xbox Series X|S",
        subtitle: "PRE-ORDER EU Xbox Series X|S Key",
        platform: "Xbox Series X|S",
        genre: "Action",
        extraTag: "Adventure",
        price: "$125.51",
        stock: "100 in stock",
        countdown: "28d",
        releaseDate: "Jun 19, 2026",
        imageSrc: makeCardImage("UFC 6", "#2a1a16", "#5d1d16", "rgba(255,186,109,0.16)"),
      },
      {
        id: "prod_04",
        title: "UFC 6 Ultimate Edition PRE-ORDER EU Xbox Series X|S",
        subtitle: "PRE-ORDER EU Xbox Series X|S Key",
        platform: "Xbox Series X|S",
        genre: "Action",
        extraTag: "Adventure",
        price: "$125.51",
        stock: "100 in stock",
        countdown: "28d",
        releaseDate: "Jun 19, 2026",
        imageSrc: makeCardImage("UFC 6", "#2a1a16", "#5d1d16", "rgba(255,186,109,0.16)"),
      },
      {
        id: "prod_05",
        title: "UFC 6 Ultimate Edition PRE-ORDER EU Xbox Series X|S",
        subtitle: "PRE-ORDER EU Xbox Series X|S Key",
        platform: "Xbox Series X|S",
        genre: "Action",
        extraTag: "Adventure",
        price: "$125.51",
        stock: "100 in stock",
        countdown: "28d",
        releaseDate: "Jun 19, 2026",
        imageSrc: makeCardImage("UFC 6", "#2a1a16", "#5d1d16", "rgba(255,186,109,0.16)"),
      },
      {
        id: "prod_06",
        title: "UFC 6 Ultimate Edition PRE-ORDER EU Xbox Series X|S",
        subtitle: "PRE-ORDER EU Xbox Series X|S Key",
        platform: "Xbox Series X|S",
        genre: "Action",
        extraTag: "Adventure",
        price: "$125.51",
        stock: "100 in stock",
        countdown: "28d",
        releaseDate: "Jun 19, 2026",
        imageSrc: makeCardImage("UFC 6", "#2a1a16", "#5d1d16", "rgba(255,186,109,0.16)"),
      },
    ],
    [],
  );

  const scrollTrack = useCallback((direction: "left" | "right") => {
    if (!trackRef.current) return;
    const delta = direction === "left" ? -330 : 330;
    trackRef.current.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  if (isLoading) {
    return <ProductShowcaseSkeleton cards={1} />;
  }

  return (
    <section className="w-full select-none px-0 pb-5 pt-0 transform-gpu">
      <div className="mb-2 flex items-center justify-between gap-2 px-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-neutral-950 shadow-sm shadow-amber-500/20">
            <Zap className="h-3 w-3" fill="currentColor" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-[13px] font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Pre-Order & Upcoming
            </h2>
            <p className="text-[9px] font-medium text-slate-500 dark:text-zinc-500">
              Secure your copy before launch
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => scrollTrack("left")}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300/90 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 dark:border-zinc-800/70 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-200 md:h-8 md:w-8"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollTrack("right")}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300/90 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 dark:border-zinc-800/70 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-200 md:h-8 md:w-8"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <span className="mx-1 h-4 w-[1px] bg-slate-300 dark:bg-zinc-800/80" />
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/12 px-2 py-0.5 text-[8px] font-bold tracking-wide text-amber-400 transition hover:bg-amber-500/20 hover:text-amber-300 md:px-2.5 md:py-1 md:text-[9px]"
          >
            <span>View all</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="relative overflow-visible">
        <div ref={trackRef} className="flex w-full items-start gap-2.5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden transform-gpu will-change-transform sm:gap-4">
          {displayProducts.map((product) => (
            <article
              key={product.id}
              className="group relative w-[198px] shrink-0 overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-900/95 transition-colors duration-200 hover:border-amber-500/70 hover:shadow-[0_0_0_1px_rgba(245,158,11,0.35)] sm:w-[250px] md:w-[278px] md:rounded-[22px]"
            >
            <div className="relative h-[272px] w-full overflow-hidden bg-zinc-950 sm:h-[352px] md:h-[390px]">
              <Image
                src={product.imageSrc}
                alt={product.title}
                fill
                sizes="(max-width: 430px) 198px, (max-width: 640px) 250px, 278px"
                loading="lazy"
                className="object-cover transform-gpu transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-zinc-950/45 via-zinc-950/15 to-transparent" />
              <div className="absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-zinc-950/45 via-zinc-950/15 to-transparent" />
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-zinc-950 via-zinc-950/35 to-zinc-900/5" />

              <div className="absolute left-2 right-2 top-2 z-20 flex items-center justify-between gap-1.5 md:left-2.5 md:right-2.5 md:top-2.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/55 bg-amber-500/20 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-amber-300 backdrop-blur-md md:px-3 md:py-1 md:text-[9px]">
                  <span className="inline-block h-2 w-2 rounded-full border border-amber-400/90" />
                  Pre-Order
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700/70 bg-zinc-950/80 px-2 py-0.5 text-[9px] font-bold tracking-tight text-zinc-200 backdrop-blur-md md:px-2.5 md:py-1 md:text-[10px]">
                  <Calendar className="h-2.5 w-2.5 text-amber-400 md:h-3 md:w-3" />
                  {product.countdown}
                </span>
              </div>

              <div className="absolute right-2.5 top-12 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200/85 text-black shadow-md md:right-4 md:top-20 md:h-16 md:w-16">
                <span className="text-[11px] font-black leading-none md:text-[14px]">EA</span>
              </div>

              <div className="absolute inset-x-0 bottom-0 z-20 p-2 md:p-3">
                <div className="mb-0.5 flex items-center gap-1 text-[9px] font-bold text-amber-400 md:mb-1.5 md:text-[11px]">
                  <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" />
                  <span>{product.releaseDate}</span>
                </div>

                <h3 className="line-clamp-2 text-[12px] font-black leading-[1.02] tracking-tight text-white sm:line-clamp-3 sm:text-[26px] md:text-[36px] md:leading-[0.92]">
                  {product.title}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-[9px] font-semibold tracking-wide text-zinc-300/95 md:text-[11px]">
                  {product.subtitle}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-1 md:mt-2 md:gap-1.5">
                  <span className="rounded-full bg-zinc-800/70 px-1 py-0.5 text-[8px] font-semibold text-zinc-300/95 md:px-2 md:text-[10px]">
                    {product.platform}
                  </span>
                  <span className="rounded-full bg-zinc-800/70 px-1 py-0.5 text-[8px] font-semibold text-zinc-300/95 md:px-2 md:text-[10px]">
                    {product.genre}
                  </span>
                  <span className="rounded-full bg-zinc-800/70 px-1 py-0.5 text-[8px] font-semibold text-zinc-300/95 md:px-2 md:text-[10px]">
                    {product.extraTag}
                  </span>
                </div>

                <div className="mt-1.5 flex items-end justify-between md:mt-3">
                  <div>
                    <span className="text-[9px] font-semibold text-zinc-500 md:text-[11px]">From </span>
                    <span className="text-[14px] font-black tracking-tight text-white sm:text-[38px] md:text-3xl">{product.price}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400 md:text-base">{product.stock}</span>
                </div>
              </div>
            </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
