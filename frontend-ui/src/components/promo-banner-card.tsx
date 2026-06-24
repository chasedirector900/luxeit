"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";

type SlideItem = {
  imageSrc: string;
  mobileImageSrc?: string;
  title: string;
  link: string;
};

type PromoBannerCardProps = {
  headingText: string;
  accentText: string;
  badgeText: string;
  slideshowItems: SlideItem[];
  autoPlayMs?: number;
  className?: string;
};

const springTransition = { type: "spring", stiffness: 300, damping: 30 } as const;

export function PromoBannerCard({
  headingText,
  accentText,
  badgeText,
  slideshowItems,
  autoPlayMs = 2600,
  className,
}: PromoBannerCardProps) {
  const safeItems = slideshowItems.length > 0 ? slideshowItems : [];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (safeItems.length < 2) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % safeItems.length);
    }, autoPlayMs);
    return () => clearInterval(timer);
  }, [autoPlayMs, safeItems.length]);

  useEffect(() => {
    if (activeIndex >= safeItems.length) setActiveIndex(0);
  }, [activeIndex, safeItems.length]);

  const activeSlide = useMemo(() => safeItems[activeIndex], [activeIndex, safeItems]);
  const activeSlideSrc = activeSlide?.imageSrc;

  const goNext = () => setActiveIndex((prev) => (prev + 1) % safeItems.length);
  const goPrev = () =>
    setActiveIndex((prev) => (prev - 1 + safeItems.length) % safeItems.length);

  return (
    <section className={`group relative overflow-hidden rounded-2xl border border-slate-300/80 bg-slate-50 p-2.5 text-slate-900 shadow-[0_10px_28px_rgba(15,23,42,0.14)] dark:border-indigo-300/20 dark:bg-[#070b1f] dark:text-white dark:shadow-[0_16px_44px_rgba(17,24,39,0.5)] h-full min-h-[260px] md:rounded-3xl md:p-4 md:min-h-[360px] ${className ?? ""}`}>
      {activeSlide && activeSlideSrc && (
        <Link href={activeSlide.link} className="absolute inset-0 z-0 block">
          <motion.div
            key={activeSlideSrc}
            className="relative h-full w-full bg-slate-100 dark:bg-[#070b1f]"
            initial={{ opacity: 0.35, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <Image
              alt={activeSlide.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              src={activeSlideSrc}
              className="object-cover object-center"
            />
          </motion.div>
        </Link>
      )}

      <div className="relative z-10">
        <div className="mx-auto mb-1.5 h-3 w-16 rounded-full bg-slate-900/15 dark:bg-white/15 md:mb-2 md:h-4 md:w-20" />

        <motion.div
          className="relative mt-1.5 aspect-[16/9] w-full md:mt-2"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (safeItems.length < 2) return;
            const threshold = 45;
            const velocityThreshold = 320;
            if (info.offset.x <= -threshold || info.velocity.x <= -velocityThreshold) {
              goNext();
              return;
            }
            if (info.offset.x >= threshold || info.velocity.x >= velocityThreshold) {
              goPrev();
            }
          }}
        >
          {safeItems.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous slide"
                onClick={goPrev}
                className="absolute left-2 top-1/2 z-30 -translate-y-1/2 rounded-full border border-slate-300/80 bg-white/80 p-1.5 text-slate-900 opacity-100 shadow-md transition-opacity md:opacity-0 md:group-hover:opacity-100 dark:border-white/20 dark:bg-black/45 dark:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={goNext}
                className="absolute right-2 top-1/2 z-30 -translate-y-1/2 rounded-full border border-slate-300/80 bg-white/80 p-1.5 text-slate-900 opacity-100 shadow-md transition-opacity md:opacity-0 md:group-hover:opacity-100 dark:border-white/20 dark:bg-black/45 dark:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </motion.div>

        {safeItems.length > 1 && (
          <div className="absolute bottom-3 left-1/2 z-30 hidden -translate-x-1/2 items-center justify-center gap-1.5 md:bottom-4 md:flex">
            {safeItems.map((_, idx) => (
              <button
                type="button"
                aria-label={`Go to slide ${idx + 1}`}
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className="relative h-1.5 w-4 rounded-full bg-slate-300 dark:bg-white/20"
              >
                {idx === activeIndex && (
                  <motion.span
                    layoutId="promo-active-dot"
                    className="absolute inset-0 rounded-full bg-cyan-400 dark:bg-cyan-300"
                    transition={springTransition}
                  />
                )}
              </button>
            ))}
            <Sparkles className="ml-1 h-3.5 w-3.5 text-violet-500/85 dark:text-violet-300/85" />
          </div>
        )}
      </div>
    </section>
  );
}

export type { PromoBannerCardProps, SlideItem };
