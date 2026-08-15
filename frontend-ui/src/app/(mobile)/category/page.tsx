import Link from "next/link";
import Image from "next/image";
import type { ComponentType } from "react";
import {
  Armchair,
  ArrowRight,
  Car,
  ChevronRight,
  Cpu,
  Footprints,
  Lightbulb,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Watch,
  Wind,
} from "lucide-react";
import { CartButton } from "@/components/layout/cart-button";
import { ProductCard } from "@/components/product/product-card";
import { fetchProducts } from "@/lib/category/api";

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

type QuickCategory = {
  label: string;
  href: string;
  icon: IconType;
  tint: string;
  ring: string;
};

const quickCategories: QuickCategory[] = [
  { label: "Footwear", href: "/category/footwear", icon: Footprints, tint: "text-rose-500 dark:text-rose-400", ring: "bg-rose-500/10" },
  { label: "Watches", href: "/category/watches", icon: Watch, tint: "text-gold-500 dark:text-gold-400", ring: "bg-gold-500/10" },
  { label: "Electronics", href: "/category/electronics", icon: Cpu, tint: "text-gold-500 dark:text-gold-400", ring: "bg-gold-500/10" },
  { label: "Security", href: "/category/security", icon: ShieldCheck, tint: "text-emerald-500 dark:text-emerald-400", ring: "bg-emerald-500/10" },
];

const popularVehicleCategories = [
  { label: "Toyota Parts", href: "/category/toyota", count: "12,540+", logo: "/brands/toyota.svg", car: "/cars/toyota.png" },
  { label: "Nissan Parts", href: "/category/nissan", count: "8,430+", logo: "/brands/nissan.svg", car: "/cars/nissan.png" },
  { label: "Honda Parts", href: "/category/honda", count: "10,210+", logo: "/brands/honda.svg", car: "/cars/honda.png" },
  { label: "Mazda Parts", href: "/category/mazda", count: "6,320+", logo: "/brands/mazda.svg", car: "/cars/mazda.png" },
  { label: "Isuzu Parts", href: "/category/isuzu", count: "4,210+", logo: "/brands/isuzu.svg", car: "/cars/isuzu.png" },
  { label: "Ford Parts", href: "/category/ford", count: "7,890+", logo: "/brands/ford.svg", car: "/cars/ford.png" },
] as const;

type CarPart = {
  title: string;
  subtitle: string;
  href: string;
  icon: IconType;
  tint: string;
  ring: string;
};

const universalCarParts: CarPart[] = [
  { title: "LED Headlight Bulbs", subtitle: "Common sockets for many vehicles", href: "/explore/search?q=universal+led+headlight+bulbs", icon: Lightbulb, tint: "text-gold-500 dark:text-gold-400", ring: "bg-gold-500/10" },
  { title: "Wiper Blade Sets", subtitle: "Multi-size fit for most cars", href: "/explore/search?q=universal+wiper+blades", icon: Wind, tint: "text-gold-500 dark:text-gold-400", ring: "bg-gold-500/10" },
  { title: "Seat Covers", subtitle: "Universal interior fit options", href: "/explore/search?q=universal+seat+covers", icon: Armchair, tint: "text-emerald-500 dark:text-emerald-400", ring: "bg-emerald-500/10" },
  { title: "Phone Holders", subtitle: "Dashboard and vent mount types", href: "/explore/search?q=car+phone+holder", icon: Smartphone, tint: "text-gold-500 dark:text-gold-400", ring: "bg-gold-500/10" },
];

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <h2 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">{title}</h2>
      {href ? (
        <Link href={href} className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 transition-colors active:text-emerald-500 dark:text-emerald-400">
          See all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

export default async function CategoryPage() {
  const recommended = (await fetchProducts()).slice(0, 10);

  return (
    <main className="min-h-screen bg-slate-50 px-3 pb-4 pt-4 text-slate-950 md:px-6 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto w-full max-w-md md:max-w-6xl">
        <header className="reveal-up mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Category</h1>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500 md:text-sm dark:text-zinc-400">
              Browse products, imports, and digital services
            </p>
          </div>
          {/* Cart lives in the desktop top bar. */}
          <span className="md:hidden">
            <CartButton />
          </span>
        </header>

        <div style={{ animationDelay: "60ms" }} className="reveal-up">
          <SectionHeader title="Quick Categories" />
          <div className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8">
            {quickCategories.map(({ label, href, icon: Icon, tint, ring }) => (
              <Link
                key={label}
                href={href}
                className="flex h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-gold-200/70 bg-white p-1 text-center shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-95 md:hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60 dark:border-gold-900/40 dark:bg-zinc-900 dark:shadow-none dark:md:hover:border-zinc-700"
              >
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${ring}`}>
                  <Icon className={`h-[18px] w-[18px] ${tint}`} strokeWidth={2} />
                </span>
                <span className="line-clamp-1 text-[10px] font-semibold leading-tight text-slate-700 dark:text-zinc-300">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <section
          style={{ animationDelay: "120ms" }}
          className="reveal-up mt-5 rounded-3xl border border-gold-200/70 bg-white/60 p-3 dark:border-gold-900/40 dark:bg-zinc-900/40"
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400">
              <Car className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-zinc-100">Luxeit Auto</h2>
              <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">Imports, vehicle parts &amp; accessories</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold-500 via-gold-500 to-gold-600 p-4 text-white shadow-lg shadow-gold-900/20">
            {/* Pure-CSS decorative glow — composited once, no repaint */}
            <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/20 blur-3xl transform-gpu" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Featured</p>
                <h3 className="mt-1 text-lg font-black leading-tight">China Imports</h3>
                <p className="mt-1 text-xs text-white/90">Find products from trusted suppliers</p>
                <Link
                  href="/explore/search?q=china+imports"
                  className="mt-3 inline-flex min-h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-white px-4 py-1.5 text-xs font-extrabold text-slate-900 shadow-sm transition-transform duration-100 active:scale-95 md:hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                >
                  Explore imports
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <Sparkles className="h-5 w-5" />
              </span>
            </div>
          </div>

          <div className="mt-4">
            <SectionHeader title="Popular Vehicle Categories" href="/explore/search?q=car+parts" />
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
              {popularVehicleCategories.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-2 rounded-2xl border border-gold-200/70 bg-white px-2.5 py-2 transition-transform duration-100 active:scale-[0.98] md:hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60 dark:border-gold-900/40 dark:bg-zinc-900 dark:md:hover:border-zinc-700"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-slate-200 dark:ring-zinc-700">
                    <Image src={item.logo} alt={`${item.label} logo`} width={28} height={28} unoptimized className="h-6 w-6 object-contain" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-bold leading-tight text-slate-900 dark:text-zinc-100">{item.label}</span>
                    <span className="block truncate text-[10px] font-medium text-slate-500 dark:text-zinc-400">{item.count} Products</span>
                  </span>
                  <span className="flex h-9 w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                    <Image src={item.car} alt="" width={72} height={44} className="h-full w-full object-contain" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <SectionHeader title="Universal Car Parts" href="/category/universal-car-parts" />
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {universalCarParts.map(({ title, subtitle, href, icon: Icon, tint, ring }) => (
                <Link
                  key={title}
                  href={href}
                  className="rounded-xl border border-gold-200/70 bg-white p-3 transition-transform duration-100 active:scale-[0.98] md:hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60 dark:border-gold-900/40 dark:bg-zinc-900 dark:md:hover:border-zinc-700"
                >
                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${ring}`}>
                    <Icon className={`h-[18px] w-[18px] ${tint}`} strokeWidth={2} />
                  </span>
                  <p className="mt-2.5 text-sm font-bold text-slate-900 dark:text-zinc-100">{title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-zinc-400">{subtitle}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section
          style={{ animationDelay: "300ms" }}
          className="reveal-up relative mt-5 overflow-hidden rounded-2xl border border-gold-200/70 bg-white p-4 dark:border-gold-900/40 dark:bg-zinc-900"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Store className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">Wholesale & Bulk Orders</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">For shops, resellers, and businesses</p>
              <Link
                href="/explore/search?q=wholesale"
                className="mt-3 inline-flex min-h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-700 px-4 py-1.5 text-xs font-extrabold text-white shadow-sm shadow-emerald-900/20 transition-transform duration-100 active:scale-95 md:hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 dark:bg-emerald-600 dark:md:hover:bg-emerald-500"
              >
                Request sourcing
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        <section style={{ animationDelay: "360ms" }} className="reveal-up mt-5">
          <SectionHeader title="Recommended in Categories" href="/explore/search" />
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {recommended.map((product) => (
              <ProductCard
                key={`cat-reco-${product.id}`}
                product={product}
                variant="search"
                detailHrefBase="/category/product"
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
