import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CarFront,
  ChevronRight,
  Cpu,
  Footprints,
  Gift,
  Search,
  ShieldCheck,
  Sparkles,
  Watch,
} from "lucide-react";
import { HeaderCartButton } from "@/components/layout/header-cart-button";
import { ProductCard } from "@/components/product/product-card";
import { MOCK_PRODUCTS } from "@/lib/products/mock-products";
import { formatKwacha } from "@/lib/currency";

const categoryChips = [
  { label: "All", href: "/explore", icon: Sparkles },
  { label: "Footwear", href: "/category/footwear", icon: Footprints },
  { label: "Watches", href: "/explore/search?q=watch", icon: Watch },
  { label: "Car Parts", href: "/explore/search?q=car+parts", icon: CarFront },
  { label: "Electronics", href: "/category/electronics", icon: Cpu },
  { label: "Security", href: "/category/security", icon: ShieldCheck },
  { label: "Gift Cards", href: "/explore/search?q=gift+card", icon: Gift },
] as const;

const browseItems = [
  { label: "Footwear", href: "/category/footwear", icon: Footprints, tint: "text-rose-500 dark:text-rose-400", ring: "bg-rose-500/10" },
  { label: "Watches", href: "/explore/search?q=watch", icon: Watch, tint: "text-sky-500 dark:text-sky-400", ring: "bg-sky-500/10" },
  { label: "Car Parts", href: "/explore/search?q=car+parts", icon: CarFront, tint: "text-indigo-500 dark:text-indigo-400", ring: "bg-indigo-500/10" },
  { label: "Electronics", href: "/category/electronics", icon: Cpu, tint: "text-violet-500 dark:text-violet-400", ring: "bg-violet-500/10" },
  { label: "Security", href: "/category/security", icon: ShieldCheck, tint: "text-emerald-500 dark:text-emerald-400", ring: "bg-emerald-500/10" },
] as const;

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">{title}</h2>
      <Link
        href={href}
        className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-indigo-600 transition-colors active:text-indigo-500 dark:text-indigo-400"
      >
        See all
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function ProductSection({
  title,
  href,
  products,
  delay,
}: {
  title: string;
  href: string;
  products: typeof MOCK_PRODUCTS;
  delay: number;
}) {
  return (
    <section className="reveal-up" style={{ animationDelay: `${delay}ms` }}>
      <SectionHeader title={title} href={href} />
      <div className="grid grid-cols-2 gap-2.5">
        {products.map((product) => (
          <ProductCard key={`${title}-${product.id}`} product={product} variant="search" />
        ))}
      </div>
    </section>
  );
}

export default function ExplorePage() {
  const topPicks = MOCK_PRODUCTS.slice(0, 4);
  const newImports = MOCK_PRODUCTS.filter((p) => p.importTag || p.preorder).slice(0, 4);
  const fastAir = MOCK_PRODUCTS.filter((p) => p.shippingMethod === "air").slice(0, 4);
  const popular = [...MOCK_PRODUCTS]
    .sort((a, b) => Number.parseFloat(b.popularityLabel ?? "0") - Number.parseFloat(a.popularityLabel ?? "0"))
    .slice(0, 4);
  const dealsOfDay = [...MOCK_PRODUCTS].sort((a, b) => a.price - b.price).slice(0, 6);

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-6 pt-5 text-slate-900 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto w-full max-w-md space-y-5">
        {/* Header */}
        <header className="reveal-up flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[2rem] font-black leading-none tracking-tight">Explore</h1>
            <p className="mt-1.5 text-[13px] text-slate-500 dark:text-zinc-400">
              Discover products from China to Zambia
            </p>
          </div>
          <HeaderCartButton />
        </header>

        {/* Search */}
        <Link
          href="/explore/search"
          style={{ animationDelay: "60ms" }}
          className="reveal-up flex h-12 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 shadow-sm shadow-slate-900/[0.03] transition-transform duration-100 active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none"
        >
          <Search className="h-[18px] w-[18px] shrink-0 text-slate-400 dark:text-zinc-500" />
          <span className="truncate text-sm text-slate-400 dark:text-zinc-500">Search products, brands, parts...</span>
        </Link>

        {/* Category chips */}
        <div
          style={{ animationDelay: "120ms" }}
          className="reveal-up -mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex min-w-max gap-2.5 transform-gpu">
            {categoryChips.map(({ label, href, icon: Icon }, index) => (
              <Link
                key={label}
                href={href}
                className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-[13px] font-bold transition-colors duration-150 active:scale-95 ${
                  index === 0
                    ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-600 dark:border-indigo-400/50 dark:bg-indigo-500/15 dark:text-indigo-300"
                    : "border-slate-200 bg-white text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Hero */}
        <section
          style={{ animationDelay: "180ms" }}
          className="reveal-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-indigo-600 to-violet-700 p-5 text-white shadow-lg shadow-indigo-900/25"
        >
          <div className="pointer-events-none absolute -right-8 -top-10 h-44 w-44 rounded-full bg-white/20 blur-3xl transform-gpu" />
          <div className="pointer-events-none absolute -bottom-12 right-4 h-40 w-40 rounded-full bg-white/10 blur-3xl transform-gpu" />
          <div className="relative z-10 max-w-[85%]">
            <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
              Pre-Order Deals
            </span>
            <h2 className="mt-3 text-[1.55rem] font-black leading-[1.05]">China finds delivered to Zambia</h2>
            <p className="mt-2 text-[13px] text-white/85">Reserve the latest imports and we&apos;ll bring them to your door.</p>
            <Link
              href="/explore/search?q=preorder"
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-extrabold text-indigo-700 shadow-md transition-transform duration-100 active:scale-95"
            >
              Shop Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Browse by Category */}
        <section className="reveal-up" style={{ animationDelay: "240ms" }}>
          <SectionHeader title="Browse by Category" href="/explore/search" />
          <div className="grid grid-cols-3 gap-2.5">
            {browseItems.map(({ label, href, icon: Icon, tint, ring }) => (
              <Link
                key={label}
                href={href}
                className="flex h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-1 text-center shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none"
              >
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${ring}`}>
                  <Icon className={`h-5 w-5 ${tint}`} strokeWidth={2} />
                </span>
                <span className="line-clamp-1 text-[11px] font-semibold text-slate-700 dark:text-zinc-300">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Deals of the Day */}
        <section className="reveal-up" style={{ animationDelay: "300ms" }}>
          <SectionHeader title="Deals of the Day" href="/explore/search?sort=deals" />
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-3 transform-gpu">
              {dealsOfDay.map((product) => (
                <Link
                  key={`deal-${product.id}`}
                  href={`/explore/search/product/${product.slug}`}
                  prefetch={false}
                  className="w-[150px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.04] transition-transform duration-100 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
                    <Image src={product.image} alt={product.title} fill sizes="150px" className="object-cover" />
                  </div>
                  <div className="p-2.5">
                    <p className="line-clamp-2 min-h-[2rem] text-[12px] font-bold leading-tight text-slate-900 dark:text-zinc-100">
                      {product.title}
                    </p>
                    <p className="mt-1.5 text-[15px] font-black leading-none text-slate-900 dark:text-zinc-100">
                      {formatKwacha(product.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <ProductSection title="Top Picks For You" href="/explore/search?sort=top" products={topPicks} delay={360} />
        <ProductSection title="New Imports" href="/explore/search?filter=imports" products={newImports} delay={360} />
        <ProductSection title="Fast Air Shipping" href="/explore/search?shipping=air" products={fastAir} delay={360} />
        <ProductSection title="Popular Categories" href="/explore/search?sort=popular" products={popular} delay={360} />
      </div>
    </main>
  );
}
