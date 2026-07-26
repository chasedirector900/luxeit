"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Bolt, Flame, Warehouse } from "lucide-react";
import Image from "next/image";

interface ArrivalItem {
  id: string;
  title: string;
  category: string;
  price: string;
  warehouseTag: string;
  salesCount: string;
  imageSrc: string;
}

const makeArrivalMockImage = (title: string, a: string, b: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 1100'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='${a}'/>
          <stop offset='100%' stop-color='${b}'/>
        </linearGradient>
      </defs>
      <rect width='900' height='1100' fill='url(#g)'/>
      <circle cx='760' cy='120' r='180' fill='rgba(255,255,255,0.12)'/>
      <circle cx='140' cy='900' r='220' fill='rgba(255,255,255,0.08)'/>
      <text x='50%' y='52%' fill='rgba(255,255,255,0.15)' font-size='100' font-family='Impact, Arial, sans-serif' font-weight='900' text-anchor='middle' letter-spacing='4'>${title}</text>
    </svg>`,
  )}`;

export function NewArrivalsSection() {
  const arrivalProducts = useMemo<ArrivalItem[]>(
    () => [
      {
        id: "new_01",
        title: "Intelligent G Shaped LED Lamp & Speaker",
        category: "Home Electronics",
        price: "$1.49",
        warehouseTag: "CN / GLOBAL",
        salesCount: "67.5k sold",
        imageSrc: makeArrivalMockImage("LED LAMP", "#091229", "#0f4aa8"),
      },
      {
        id: "new_02",
        title: "Ultra-Premium Luxury Chronograph Watch",
        category: "Accessories",
        price: "$142.00",
        warehouseTag: "CN HUB",
        salesCount: "12.3k sold",
        imageSrc: makeArrivalMockImage("LUX CHRONO", "#1c1917", "#44403c"),
      },
      {
        id: "new_03",
        title: "Ergonomic Mechanical Gaming Controller",
        category: "Gaming Gear",
        price: "$48.50",
        warehouseTag: "CN / US",
        salesCount: "24.1k sold",
        imageSrc: makeArrivalMockImage("CONTROLLER", "#1e1b4b", "#4338ca"),
      },
    ],
    [],
  );

  return (
    <section className="w-full px-3 pb-8 pt-2 select-none transform-gpu sm:px-4 sm:pb-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 dark:border-zinc-800/80">
          <div className="inline-flex items-center gap-2 text-slate-900 dark:text-zinc-100">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-500/10 text-gold-500 shadow-sm">
              <Bolt className="h-4 w-4 fill-amber-500/10" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider">New Arrivals Track</h2>
          </div>

          <Link
            href="/explore"
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gold-500 transition-colors duration-150 hover:text-gold-400"
          >
            <span>View all</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 flex w-full snap-x snap-mandatory items-center gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden transform-gpu will-change-transform sm:mt-5 sm:gap-4">
          {arrivalProducts.map((product) => (
            <article
              key={product.id}
              className="group relative w-[192px] min-[390px]:w-[206px] sm:w-[260px] md:w-[240px] shrink-0 snap-start overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 transition-all duration-200 hover:border-zinc-700/60 dark:border-zinc-800/60 dark:bg-gradient-to-b dark:from-zinc-900/90 dark:to-zinc-950/95 sm:rounded-2xl sm:p-2"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-zinc-100 shadow-inner dark:bg-zinc-950 sm:aspect-[4/5] sm:rounded-xl">
                <Image
                  src={product.imageSrc}
                  alt={product.title}
                  fill
                  sizes="(max-width: 389px) 192px, (max-width: 639px) 206px, (max-width: 768px) 260px, 240px"
                  loading="lazy"
                  className="object-cover"
                />

                <div className="absolute inset-0 z-10 bg-gradient-to-t from-zinc-950/50 via-transparent to-transparent" />

                <span className="absolute bottom-1.5 left-1.5 z-20 rounded-md border border-zinc-800/40 bg-zinc-950/85 px-2 py-0.5 text-[11px] font-black tracking-tight text-white sm:bottom-2.5 sm:left-2.5 sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-xs">
                  {product.price}
                </span>

                <span className="absolute bottom-1.5 right-1.5 z-20 inline-flex h-4.5 items-center gap-1 rounded border border-zinc-800/20 bg-zinc-900/80 px-1.5 text-[8px] font-bold uppercase tracking-wider text-zinc-300 sm:bottom-2.5 sm:right-2.5 sm:h-5 sm:rounded-md sm:px-2 sm:text-[9px]">
                  <Warehouse className="h-2.5 w-2.5 text-gold-500 sm:h-3 sm:w-3" />
                  <span>{product.warehouseTag}</span>
                </span>
              </div>

              <div className="mt-1.5 space-y-1 rounded-lg border border-slate-100/50 bg-zinc-50/60 p-1.5 dark:border-zinc-900/40 dark:bg-zinc-900/40 sm:mt-2.5 sm:space-y-1.5 sm:rounded-xl sm:p-2">
                <h3 className="line-clamp-2 text-[12px] font-bold leading-tight tracking-tight text-slate-900 transition-colors duration-150 group-hover:text-gold-500 dark:text-zinc-100 dark:group-hover:text-gold-400 sm:line-clamp-1 sm:text-sm">
                  {product.title}
                </h3>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-1 dark:border-zinc-900/60 sm:pt-1.5">
                  <p className="truncate text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:text-zinc-500 sm:text-[10px]">
                    {product.category}
                  </p>

                  <span className="inline-flex shrink-0 items-center gap-0.5 text-[9px] font-extrabold uppercase tracking-tight text-orange-600 dark:text-orange-400 sm:text-[10px]">
                    <Flame className="h-2.5 w-2.5 fill-orange-500/10 sm:h-3 sm:w-3" />
                    <span>{product.salesCount}</span>
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
