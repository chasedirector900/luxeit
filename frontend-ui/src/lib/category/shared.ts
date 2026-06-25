import type { ComponentType } from "react";
import type { Product, ProductRatings } from "@/types/product";

// ---------------------------------------------------------------------------
// Shared types + helpers for config-driven category listing pages.
// A new category (Watches, Electronics, ...) is just a CategoryConfig object —
// no new components or routes needed.
// ---------------------------------------------------------------------------

export type ListingIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

export type ListingBadge = { label: string; tone: "sale" | "new" };

export type ListingProduct = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  /** Which chip/sub-category this belongs to (matches a chip key). */
  subCategory: string;
  price: number;
  originalPrice?: number;
  /** China-hub air-freight price; when set, cards show "From {price}". */
  airPrice?: number;
  badge?: ListingBadge;
  /** Inline SVG data URI — self-contained, no network, valid cart image. */
  image: string;
};

// `icon` is a string name resolved via the icon registry — keeps configs as
// plain data so they can cross the Server -> Client Component boundary.
export type ListingChip = { key: string; label: string; icon: string };

export type ListingFeature = {
  icon: string;
  title: string;
  subtitle: string;
  tint: string;
  ring: string;
};

export type CategoryConfig = {
  /** URL segment, e.g. "footwear" -> /category/footwear */
  slug: string;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  hero: { badge: string; title: string; subtitle: string };
  /** First chip should be the "all" chip. */
  chips: ListingChip[];
  features: ListingFeature[];
  products: ListingProduct[];
};

// Builds a gradient placeholder as an SVG data URI. Encoded once at module load.
export function makeListingImage(label: string, from: string, to: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='${from}'/>
        <stop offset='100%' stop-color='${to}'/>
      </linearGradient>
    </defs>
    <rect width='800' height='600' fill='url(#g)'/>
    <circle cx='640' cy='120' r='150' fill='rgba(255,255,255,0.10)'/>
    <circle cx='150' cy='500' r='190' fill='rgba(255,255,255,0.07)'/>
    <text x='50%' y='53%' fill='rgba(255,255,255,0.22)' font-size='72' font-family='Arial, sans-serif' font-weight='900' text-anchor='middle' letter-spacing='3'>${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const LISTING_REVIEW_TAGS = [
  { label: "Great Quality", count: 312 },
  { label: "Good Value", count: 264 },
  { label: "As Described", count: 188 },
  { label: "Fast Delivery", count: 141 },
];

// Deterministic ratings so the shared reviews UI has real content per product.
export function buildListingRatings(item: ListingProduct): ProductRatings {
  const seed = Math.round(item.price);
  const ratingAverage = Number((4.2 + (seed % 7) / 10).toFixed(1));
  const ratingCount = 480 + seed * 37;
  const five = Math.round(ratingCount * 0.62);
  const four = Math.round(ratingCount * 0.24);
  const three = Math.round(ratingCount * 0.08);
  const two = Math.round(ratingCount * 0.04);
  const one = Math.max(0, ratingCount - five - four - three - two);

  return {
    ratingAverage,
    ratingCount,
    ratingBreakdown: { 5: five, 4: four, 3: three, 2: two, 1: one },
    reviewTags: LISTING_REVIEW_TAGS,
    reviews: [
      {
        id: `${item.id}-r1`,
        userName: "Chisomo",
        avatarInitial: "C",
        rating: 5,
        date: "2026-05-09",
        text: `${item.title} arrived faster than expected and matches the description. Very happy with it.`,
        helpfulCount: 12,
      },
      {
        id: `${item.id}-r2`,
        userName: "Mwansa",
        avatarInitial: "M",
        rating: 4,
        date: "2026-04-22",
        text: "Good quality for the price. Packaging was solid and delivery was on time.",
        helpfulCount: 5,
      },
      {
        id: `${item.id}-r3`,
        userName: "Natasha",
        avatarInitial: "N",
        rating: 5,
        date: "2026-04-03",
        text: "Exactly as pictured. Will order again from this seller.",
        helpfulCount: 3,
      },
    ],
  };
}

// Adapts a lightweight ListingProduct into the rich Product shape used by the
// shared product-detail + reviews UI.
export function listingToProduct(item: ListingProduct, categoryLabel: string): Product {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    image: item.image,
    price: item.price,
    productType: "general",
    category: categoryLabel,
    origin: "Global",
    shippingMethod: "air",
    deliveryEstimate: "5-10 days",
    media: [{ type: "image", src: item.image, alt: item.title, objectFit: "cover" }],
    ratings: buildListingRatings(item),
  };
}

export type ListingFilters = { query: string; type: string; sort: string; price: string };

// Server-side filter + sort, shared by every category.
export function filterListing(products: ListingProduct[], filters: ListingFilters): ListingProduct[] {
  const { query, type, sort, price } = filters;
  let list = products;

  if (type !== "all") {
    list = list.filter((product) => product.subCategory === type);
  }
  if (query) {
    list = list.filter((product) => `${product.title} ${product.subtitle}`.toLowerCase().includes(query));
  }
  if (price === "lt50") {
    list = list.filter((product) => product.price < 50);
  } else if (price === "gte50") {
    list = list.filter((product) => product.price >= 50);
  }
  if (sort === "price-asc") {
    list = [...list].sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    list = [...list].sort((a, b) => b.price - a.price);
  }

  return list;
}
