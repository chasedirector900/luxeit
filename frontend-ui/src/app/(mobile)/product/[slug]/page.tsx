import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SearchProductDetailClient } from "@/components/search/search-product-detail-client";
import { fetchProductDetail, fetchRelated } from "@/lib/category/api";
import { CURRENCY_CODE, priceInKwacha } from "@/lib/currency";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

// Per-product SEO: a descriptive title/description + the product image for link
// previews, and a canonical URL so the several internal product paths all point
// search engines back to this one.
export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductDetail(slug);
  if (!product) return { title: "Product not found" };

  const origin = product.origin ?? "China";
  const description =
    `Buy ${product.title} on ${SITE_NAME} — imported from ${origin}, delivered across Zambia` +
    `${product.deliveryEstimate ? ` (${product.deliveryEstimate})` : ""}. Shipping included.`;
  const images = product.image ? [product.image] : undefined;

  return {
    title: product.title,
    description,
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      type: "website",
      title: `${product.title} · ${SITE_NAME}`,
      description,
      url: `/product/${slug}`,
      images,
    },
    twitter: { card: "summary_large_image", title: product.title, description, images },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await fetchProductDetail(slug);

  if (!product) {
    notFound();
  }

  const related = await fetchRelated(product.categorySlug, slug);

  // Product structured data → rich results (price, availability, rating stars).
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    ...(product.image ? { image: [product.image] } : {}),
    sku: product.slug,
    ...(product.category ? { category: product.category } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: CURRENCY_CODE,
      price: priceInKwacha(product.price),
      availability: product.preorder
        ? "https://schema.org/PreOrder"
        : "https://schema.org/InStock",
      url: `${SITE_URL}/product/${product.slug}`,
    },
    ...(product.ratings && product.ratings.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratings.ratingAverage,
            reviewCount: product.ratings.ratingCount,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <SearchProductDetailClient
        product={product}
        related={related}
        backHref="/"
        productHrefBase="/product"
      />
    </>
  );
}
