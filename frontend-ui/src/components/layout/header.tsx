"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  Globe,
  LogIn,
  Moon,
  Search,
  ShoppingCart,
  Sun,
  Tag,
  Sparkles,
  TrendingUp,
  Package,
  Boxes,
  Flame,
  Zap,
  Truck,
  HelpCircle,
  MapPin,
  RefreshCw,
  Minus,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { memo, type ComponentType, useEffect, useState } from "react";
import { motion } from "motion/react";
import { FullScreenSearch } from "@/components/layout/full-screen-search";
import { useOptionalCart } from "@/hooks/use-cart";
import { formatKwacha } from "@/lib/currency";

type HeaderNavItem = {
  label: string;
  Icon: ComponentType<{ className?: string }>;
  active?: boolean;
};

const mainNav: HeaderNavItem[] = [
  { label: "Top Categories", Icon: Boxes },
  { label: "Hot Deals", Icon: Flame, active: true },
  { label: "All Products", Icon: Package },
];

const logisticsNav: HeaderNavItem[] = [
  { label: "Direct Logistics", Icon: Truck },
  { label: "Zambia Hubs", Icon: MapPin },
  { label: "Returns Policy", Icon: RefreshCw },
  { label: "Buyer Protection", Icon: HelpCircle },
];

const spring = { type: "spring", stiffness: 300, damping: 30 } as const;

function HoverItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div whileHover={{ scale: 1.02, opacity: 0.9 }} transition={spring} className={className}>
      {children}
    </motion.div>
  );
}

const SearchBar = memo(function SearchBar({ onOpen }: { onOpen: () => void }) {
  const [focused, setFocused] = useState(false);

  return (
    <motion.div
      animate={{
        boxShadow: focused ? "0 0 0 2px rgba(14,165,233,0.2)" : "0 0 0 0 rgba(0,0,0,0)",
        borderColor: focused ? "#0ea5e9" : "transparent",
      }}
      transition={spring}
      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 w-full max-w-none dark:border-zinc-800 dark:bg-zinc-900/60 text-neutral-900 dark:text-white"
      onClick={onOpen}
    >
      <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-zinc-500" />
      <input
        type="text"
        placeholder="Search products or ask AI..."
        onFocus={() => {
          setFocused(true);
          onOpen();
        }}
        onBlur={() => setFocused(false)}
        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500"
        readOnly
      />
      <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-500 shrink-0 select-none">
        {"\u2318"}K
      </span>
    </motion.div>
  );
});

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const cart = useOptionalCart();
  const items = cart?.items ?? [];
  const cartCount = cart?.cartCount ?? 0;
  const cartSubtotal = cart?.cartSubtotal ?? 0;
  const visibleItems = items.slice(0, 3);

  useEffect(() => {
    const syncTheme = () => {
      const saved = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const nextDark = saved === "auto" || !saved ? prefersDark : saved === "dark";
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(nextDark ? "dark" : "light");
      setIsDark(nextDark);
    };

    syncTheme();
    setMounted(true);

    const onThemeChange = () => syncTheme();
    window.addEventListener("luxeit-theme-change", onThemeChange);
    return () => window.removeEventListener("luxeit-theme-change", onThemeChange);
  }, []);

  return (
    <>
      <header className="hidden lg:block sticky top-0 z-50 w-full px-4 pt-4">
        <div className="w-full max-w-7xl mx-auto">
        <div className="w-full px-4 py-1.5 rounded-[24px] border border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/80 shadow-none">
          <div className="flex items-center justify-between w-full pb-1 border-b border-slate-200/80 dark:border-zinc-900/60 min-h-[38px]">
            <div className="flex items-center z-10 min-w-0 flex-1">
              <Link href="/" className="text-[2rem] font-bold tracking-[0.14em] uppercase text-neutral-900 dark:text-white shrink-0">
                LUXEIT
              </Link>
              <div className="ml-4 w-full max-w-[620px]">
                <SearchBar onOpen={() => setIsSearchOpen(true)} />
              </div>
            </div>

            <div className="flex items-center gap-5 z-10 shrink-0 ml-auto pl-3">
              <HoverItem>
                <button className="inline-flex items-center gap-1 text-[13px] font-medium text-slate-700 dark:text-zinc-300">
                  <Tag className="h-4 w-4" />
                  <span>Offers</span>
                </button>
              </HoverItem>

              <HoverItem>
                <button className="bg-neutral-900 text-white dark:bg-white dark:text-black px-4 py-1.5 rounded-lg text-[13px] font-medium shadow-sm transition-transform hover:bg-neutral-800 dark:hover:bg-neutral-100">
                  Track Order
                </button>
              </HoverItem>

              <div className="flex items-center gap-4 text-slate-500 dark:text-zinc-400">
                <div className="group/cart relative">
                  <HoverItem>
                    <button
                      type="button"
                      aria-label="Open cart preview"
                      className="relative rounded-md p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
                    >
                      <ShoppingCart className="h-[18px] w-[18px]" />
                      {cartCount > 0 ? (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[9px] font-bold text-white">
                          {cartCount > 99 ? "99+" : cartCount}
                        </span>
                      ) : null}
                    </button>
                  </HoverItem>

                  <div className="pointer-events-none absolute right-0 top-[calc(100%+10px)] z-[80] w-[340px] translate-y-1 opacity-0 transition duration-150 group-hover/cart:pointer-events-auto group-hover/cart:translate-y-0 group-hover/cart:opacity-100 group-focus-within/cart:pointer-events-auto group-focus-within/cart:translate-y-0 group-focus-within/cart:opacity-100">
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-lg dark:border-zinc-800/80 dark:bg-zinc-950/95">
                      <div className="flex items-center justify-between border-b border-slate-200/80 px-3 py-2.5 dark:border-zinc-800/80">
                        <div className="inline-flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">Your Cart</span>
                          <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                            {cartCount} {cartCount === 1 ? "item" : "items"}
                          </span>
                        </div>
                        <span className="text-slate-400 dark:text-zinc-500">
                          <X className="h-4 w-4" />
                        </span>
                      </div>

                      {items.length === 0 ? (
                        <div className="px-3 py-4">
                          <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">Your cart is empty</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                            Add products from search or explore to start your order.
                          </p>
                          <Link
                            href="/search"
                            className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-3 text-xs font-bold text-white dark:bg-zinc-100 dark:text-black"
                          >
                            View products
                          </Link>
                        </div>
                      ) : (
                        <>
                          <div className="max-h-[268px] space-y-2 overflow-auto px-3 py-2.5">
                            {visibleItems.map((item) => (
                              <div
                                key={`${item.productId}::${item.variantId ?? "default"}`}
                                className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2 dark:border-zinc-800/80 dark:bg-zinc-900/50"
                              >
                                <div className="flex gap-2.5">
                                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-zinc-800">
                                    <Image
                                      src={item.image}
                                      alt={item.title}
                                      fill
                                      sizes="48px"
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-zinc-100">
                                      {item.title}
                                    </p>
                                    <div className="mt-1.5 flex items-center justify-between">
                                      <div className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1 py-0.5 dark:border-zinc-700 dark:bg-zinc-950">
                                        <button
                                          type="button"
                                          aria-label="Decrease quantity"
                                          onClick={() => cart?.decrementQuantity(item.productId, item.variantId)}
                                          className="rounded p-0.5 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                                        >
                                          <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-4 text-center text-[11px] font-bold text-slate-700 dark:text-zinc-200">
                                          {item.quantity}
                                        </span>
                                        <button
                                          type="button"
                                          aria-label="Increase quantity"
                                          onClick={() => cart?.incrementQuantity(item.productId, item.variantId)}
                                          className="rounded p-0.5 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                                        >
                                          <Plus className="h-3 w-3" />
                                        </button>
                                      </div>
                                      <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                                        {formatKwacha(item.price * item.quantity)}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    aria-label="Remove item"
                                    onClick={() => cart?.removeItem(item.productId, item.variantId)}
                                    className="self-center rounded p-1 text-slate-400 hover:text-rose-500 dark:text-zinc-500 dark:hover:text-rose-400"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="border-t border-slate-200/80 px-3 py-2.5 dark:border-zinc-800/80">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                                Subtotal ({cartCount} {cartCount === 1 ? "item" : "items"})
                              </span>
                              <span className="text-xl font-black text-slate-900 dark:text-zinc-100">
                                {formatKwacha(cartSubtotal)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Link
                                href="/cart"
                                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-sm font-bold text-slate-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                              >
                                View Cart
                              </Link>
                              <Link
                                href="/checkout"
                                className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white dark:bg-zinc-100 dark:text-black"
                              >
                                Checkout
                              </Link>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <HoverItem>
                  <button className="p-0.5"><Bell className="h-[18px] w-[18px]" /></button>
                </HoverItem>
                <HoverItem>
                  <button className="p-0.5"><Globe className="h-[18px] w-[18px]" /></button>
                </HoverItem>
                <HoverItem>
                  <motion.button
                    type="button"
                    aria-label="Toggle theme"
                    onClick={() => {
                      if (!mounted) return;
                      const nextDark = !isDark;
                      const root = document.documentElement;
                      root.classList.remove("light", "dark");
                      root.classList.add(nextDark ? "dark" : "light");
                      localStorage.setItem("theme", nextDark ? "dark" : "light");
                      setIsDark(nextDark);
                    }}
                    whileHover={{ y: -1, opacity: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="p-0.5"
                  >
                    {mounted && isDark ? (
                      <Sun className="h-[18px] w-[18px]" />
                    ) : (
                      <Moon className="h-[18px] w-[18px]" />
                    )}
                  </motion.button>
                </HoverItem>
              </div>

              <div className="h-4 w-[1px] bg-slate-200 dark:bg-zinc-800" />

              <HoverItem>
                <Link href="/account" className="inline-flex items-center gap-1 text-[13px] font-medium text-slate-700 dark:text-zinc-300">
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              </HoverItem>
            </div>
          </div>

          <div className="flex items-center justify-between w-full pt-1 text-sm">
            <div className="flex items-center gap-4 text-slate-600 dark:text-zinc-300 font-medium">
              {mainNav.map(({ label, Icon, active }) => (
                <HoverItem key={label}>
                  <button className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] text-slate-600 dark:text-zinc-400 transition-colors hover:text-neutral-900 dark:hover:text-white font-medium leading-none">
                    <Icon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{label}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1.5 shadow-sm shadow-blue-500/50" />}
                  </button>
                </HoverItem>
              ))}
            </div>

            <div className="flex items-center gap-4 w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1 transform-gpu justify-end">
              <div className="inline-flex items-center gap-1.5 border border-amber-500/20 bg-amber-500/[0.04] dark:border-amber-500/30 dark:bg-amber-500/10 px-3 py-1 rounded-full backdrop-blur-md shrink-0 select-none">
                <Zap className="h-3 w-3 text-amber-500 fill-amber-500/20" />
                <span className="text-amber-600 dark:text-amber-500 font-black tracking-widest text-[9px] uppercase">
                  Logistics
                </span>
              </div>

              <nav className="flex items-center gap-3.5 text-zinc-400 dark:text-zinc-400">
                {logisticsNav.map(({ label, Icon }, index) => (
                  <div key={label} className="flex items-center gap-3.5">
                    {index > 0 && <div className="h-3 w-[1px] bg-slate-200 dark:bg-zinc-800/80 shrink-0" />}
                    <HoverItem>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-150 whitespace-nowrap outline-none group"
                      >
                        <Icon className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300 transition-colors" />
                        <span>{label}</span>
                      </button>
                    </HoverItem>
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>
        </div>
      </header>
      <FullScreenSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
