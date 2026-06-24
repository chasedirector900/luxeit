"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  CarFront,
  CreditCard,
  Gamepad2,
  Globe2,
  PackageCheck,
  Shield,
  ShoppingBag,
} from "lucide-react";

const categoryTiles = [
  { key: "Security", label: "Security", Icon: Shield },
  { key: "Gaming", label: "Gaming", Icon: Gamepad2 },
  { key: "Car Parts", label: "Car Parts", Icon: CarFront },
  { key: "Electronics", label: "Electronics", Icon: CreditCard },
  { key: "Lifestyle", label: "Lifestyle & Beauty", Icon: PackageCheck },
] as const;

const shopSlides = [
  { image: "/images/shop-section-images/shop-item-fashion.png", tag: "Lifestyle · Fashion", categoryKey: "Lifestyle" },
  { image: "/images/shop-section-images/shop-item-electronics.png", tag: "Electronics · Devices", categoryKey: "Electronics" },
  { image: "/images/shop-section-images/shop-item-security.png", tag: "Wearables · Smart Tech", categoryKey: "Lifestyle" },
  { image: "/images/shop-section-images/shop-item-gaming.png", tag: "Gaming · Accessories", categoryKey: "Gaming" },
  { image: "/images/shop-section-images/shop-item-lifestyle.png", tag: "Lifestyle · Beauty", categoryKey: "Lifestyle" },
] as const;

export function ShopSection() {
  const [activeSlide, setActiveSlide] = useState(0);
  const activeCategoryKey = shopSlides[activeSlide]?.categoryKey;

  useEffect(() => {
    if (shopSlides.length < 2) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % shopSlides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="w-full px-3 pb-5 pt-2 select-none transform-gpu sm:px-4 sm:pb-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 dark:border-zinc-800/80">
          <div className="inline-flex items-center gap-2 text-slate-900 dark:text-zinc-100">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Boxes className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-black tracking-tight">Shop</h2>
          </div>

          <Link
            href="/explore"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <span>See all</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <article className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-zinc-800/60 dark:bg-gradient-to-br dark:from-zinc-900/90 dark:via-zinc-950 dark:to-black/95 sm:mt-4 sm:rounded-3xl sm:p-5">
          <div className="block lg:hidden">
            <div className="relative h-[132px] overflow-hidden rounded-xl border border-slate-100 dark:border-zinc-800/60 min-[390px]:h-[150px] sm:h-auto sm:rounded-2xl">
              <Image
                src={shopSlides[activeSlide].image}
                alt="Mobile shop showcase"
                width={560}
                height={560}
                className="h-full w-full object-contain object-center sm:h-auto"
                sizes="(max-width: 768px) 100vw, 560px"
              />
              <div className="pointer-events-none absolute right-2 top-2 h-6 w-6 rounded-full bg-cyan-500/15" />
            </div>

            <div className="mt-1.5 flex items-center justify-between">
              <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-1.5 py-0.5 text-[9px] font-bold dark:border-zinc-800 dark:bg-zinc-900/70">
                <PackageCheck className="h-2.5 w-2.5 text-cyan-500" />
                <span className="text-slate-700 dark:text-zinc-300">{shopSlides[activeSlide].tag}</span>
              </div>
              <div className="inline-flex items-center gap-1">
                {shopSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Go to shop slide ${idx + 1}`}
                    onClick={() => setActiveSlide(idx)}
                    className={
                      idx === activeSlide
                        ? "h-1.5 w-4 rounded-full bg-cyan-500"
                        : "h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-zinc-700"
                    }
                  />
                ))}
              </div>
            </div>

            <div className="mt-2">
              <span className="inline-flex items-center rounded-md border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[8px] font-black tracking-wider text-cyan-600 uppercase dark:text-cyan-400">
                Physical Products
              </span>

              <h3 className="mt-1.5 text-[22px] font-black leading-none tracking-tight text-slate-900 dark:text-white min-[390px]:text-2xl">
                Shop <span className="text-cyan-600 dark:text-cyan-400">Premium Products</span>
              </h3>

              <p className="mt-1.5 line-clamp-2 text-[10px] font-medium leading-snug text-slate-500 dark:text-zinc-400 min-[390px]:text-[11px]">
                Electronics, wearables, gaming gear, fashion & lifestyle — delivered worldwide.
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-1 text-[8px] font-bold text-slate-500 dark:text-zinc-400 min-[390px]:text-[9px]">
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-1.5 py-0.5 dark:border-zinc-800">
                  <Globe2 className="h-2.5 w-2.5 text-cyan-500" /> Shipping
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-1.5 py-0.5 dark:border-zinc-800">
                  <BadgeCheck className="h-2.5 w-2.5 text-cyan-500" /> Secure
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-1.5 py-0.5 dark:border-zinc-800">
                  <CreditCard className="h-2.5 w-2.5 text-cyan-500" /> Card
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-2 py-1.5 dark:border-zinc-900 dark:bg-zinc-900/40">
                <div className="inline-flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/10 text-rose-500">
                    <ShoppingBag className="h-3 w-3" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold leading-tight text-slate-900 dark:text-zinc-100">Shipped Direct from China</p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500">Factory prices · Global delivery · 7-25 day shipping</p>
                  </div>
                </div>
                <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                  CN
                </span>
              </div>

              <button className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 text-[11px] font-bold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
                <span>Explore Shop</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="hidden items-center gap-8 lg:grid lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-7">
              <span className="inline-flex items-center rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                Physical Products
              </span>

              <h3 className="text-3xl font-black uppercase leading-none tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                Shop <span className="text-cyan-600 dark:text-cyan-400">Premium Products</span>
                <br />
                <span className="text-slate-400 dark:text-zinc-500">From Global Suppliers</span>
              </h3>

              <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-600 sm:text-base dark:text-zinc-400">
                Premium electronics, designer wearables, elite gaming gear, fashion & lifestyle curated and delivered straight to your local hub.
              </p>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <Globe2 className="h-3.5 w-3.5 text-cyan-500" />
                  Worldwide Shipping
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5 text-cyan-500" />
                  Secure Checkout
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-cyan-500" />
                  Multiple Payment Options
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 backdrop-blur-md dark:border-zinc-900 dark:bg-zinc-900/40">
                <div className="inline-flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                    <ShoppingBag className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-900 dark:text-white">Shipped Direct from China</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-500">Factory prices · Global delivery · 7-25 day shipping</p>
                  </div>
                </div>
                <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                  CN
                </span>
              </div>

              <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all duration-150 hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
                <span>Explore Shop</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="relative flex flex-col items-center justify-center lg:col-span-5">
              <div className="pointer-events-none absolute right-4 top-4 h-24 w-24 rounded-full bg-cyan-500/5 blur-xl" />
              <div className="pointer-events-none absolute bottom-4 left-4 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl" />

              <div className="relative w-full max-w-xs transform-gpu transition-transform duration-700 hover:scale-[1.03]">
                <Image
                  src={shopSlides[activeSlide].image}
                  alt="Featured product showcase asset"
                  width={400}
                  height={400}
                  priority
                  className="mx-auto h-auto w-[80%] object-contain drop-shadow-[0_25px_50px_rgba(6,182,212,0.2)]"
                />
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/60">
                <PackageCheck className="h-3.5 w-3.5 text-cyan-500" />
                <span className="text-slate-700 dark:text-zinc-300">{shopSlides[activeSlide].tag.split(" · ")[0]}</span>
                <span className="text-cyan-500">· {shopSlides[activeSlide].tag.split(" · ")[1]}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3 transform-gpu will-change-transform dark:border-zinc-900/80 sm:mt-6 sm:pt-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-6 lg:gap-3">
              {categoryTiles.map((item) => (
                <button
                  key={item.label}
                  className={`group flex h-[66px] flex-col items-center justify-center rounded-lg border p-2 shadow-sm transition-all duration-200 transform-gpu active:scale-[0.98] outline-none sm:h-24 sm:rounded-xl sm:p-3 lg:h-28 ${
                    activeCategoryKey === item.key
                      ? "border-cyan-500/60 bg-cyan-500/10 dark:border-cyan-400/50 dark:bg-cyan-500/10"
                      : "border-slate-200/60 bg-slate-50/50 hover:border-cyan-500/30 hover:bg-white dark:border-zinc-800/60 dark:bg-zinc-900/30 dark:hover:border-cyan-400/30 dark:hover:bg-zinc-900/60"
                  }`}
                  type="button"
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-md border shadow-inner transition-colors duration-200 sm:h-9 sm:w-9 sm:rounded-lg ${
                    activeCategoryKey === item.key
                      ? "border-cyan-500/30 bg-cyan-500/10 dark:border-cyan-400/30 dark:bg-cyan-500/10"
                      : "border-slate-200/40 bg-slate-100 group-hover:border-cyan-500/20 dark:border-zinc-800/40 dark:bg-zinc-950"
                  }`}>
                    <item.Icon className={`h-3.5 w-3.5 transition-colors duration-200 sm:h-4 sm:w-4 ${
                      activeCategoryKey === item.key
                        ? "text-cyan-600 dark:text-cyan-400"
                        : "text-slate-500 group-hover:text-cyan-600 dark:text-zinc-400 dark:group-hover:text-cyan-400"
                    }`} />
                  </div>
                  <span className={`mt-1.5 text-[8px] font-black uppercase tracking-widest transition-colors duration-150 sm:mt-3 sm:text-[10px] ${
                    activeCategoryKey === item.key
                      ? "text-cyan-700 dark:text-cyan-300"
                      : "text-slate-500 group-hover:text-slate-900 dark:text-zinc-400 dark:group-hover:text-white"
                  }`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
