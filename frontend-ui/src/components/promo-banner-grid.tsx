"use client";

import Image from "next/image";
import { CircleHelp, Settings } from "lucide-react";
import { motion } from "motion/react";
import { PromoBannerCard, type SlideItem } from "@/components/promo-banner-card";
import { useState } from "react";
import { MobileSettingsDrawer } from "@/components/mobile-settings-drawer";

const hoverSpring = { type: "spring", stiffness: 300, damping: 30 } as const;

const slideshowItems: SlideItem[] = [
  {
    title: "LUXEIT Hero Slide 1",
    link: "/explore",
    imageSrc: "/images/banners/hero/hero-slide-1.png",
  },
  {
    title: "LUXEIT Hero Slide 2",
    link: "/explore",
    imageSrc: "/images/banners/hero/hero-slide-2.png",
  },
  {
    title: "LUXEIT Hero Slide 3",
    link: "/explore",
    imageSrc: "/images/banners/hero/hero-slide-3.png",
  },
  {
    title: "LUXEIT Hero Slide 4",
    link: "/explore",
    imageSrc: "/images/banners/hero/hero-slide-4.png",
  },
  {
    title: "LUXEIT Hero Slide 5",
    link: "/explore",
    imageSrc: "/images/banners/hero/hero-slide-5.png",
  },
  {
    title: "LUXEIT Hero Slide 6",
    link: "/explore",
    imageSrc: "/images/banners/hero/hero-slide-6.png",
  },
];

const leftAsset = "/images/banners/left/hero-left-feature.png";
const rightAsset = "/images/banners/right/hero-right-card-v2.png";

export function PromoBannerGrid() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <section className="grid grid-cols-1 gap-4 w-full px-4 max-w-7xl mx-auto lg:grid-cols-4">
      <motion.article
        whileHover={{ y: -6, scale: 1.01 }}
        transition={hoverSpring}
        className="relative hidden overflow-hidden rounded-3xl border border-gold-200/70/80 bg-white text-slate-900 shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:shadow-black/40 lg:col-span-1 lg:block"
      >
        <div className="relative h-full min-h-[360px] w-full">
          <Image
            src={leftAsset}
            alt="LUXEIT left feature banner"
            fill
            sizes="(max-width: 1024px) 100vw, 25vw"
            className="object-contain object-center"
          />
        </div>
      </motion.article>

      <div className="relative h-full lg:col-span-2">
        <div className="fixed right-4 top-4 z-40 flex items-center gap-1.5 md:hidden">
          <button
            type="button"
            aria-label="Help"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300/70 bg-white/90 text-slate-700 shadow-sm backdrop-blur-sm dark:border-white/20 dark:bg-black/45 dark:text-zinc-200"
          >
            <CircleHelp className="h-5.5 w-5.5" />
          </button>
          <button
            type="button"
            aria-label="Settings"
            onClick={() => setIsMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/45 bg-gold-200/70 text-gold-700 shadow-sm backdrop-blur-sm dark:border-gold-300/40 dark:bg-gold-300/20 dark:text-gold-200"
          >
            <Settings className="h-5.5 w-5.5" />
          </button>
        </div>
        <PromoBannerCard
          headingText="Windows Keys at"
          accentText="Crazy Prices"
          badgeText="HOT DEALS"
          slideshowItems={slideshowItems}
          className="h-full"
        />
      </div>

      <motion.article
        whileHover={{ y: -6, scale: 1.01 }}
        transition={hoverSpring}
        className="relative hidden overflow-hidden rounded-3xl border border-gold-200/70/80 bg-white text-slate-900 shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:shadow-black/40 lg:col-span-1 lg:block"
      >
        <div className="relative h-full min-h-[360px] w-full">
          <Image
            src={rightAsset}
            alt="LUXEIT right feature banner"
            fill
            sizes="(max-width: 1024px) 100vw, 25vw"
            className="object-contain object-center scale-[1.06] transform-gpu"
          />
        </div>
      </motion.article>
      </section>

      <MobileSettingsDrawer open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
