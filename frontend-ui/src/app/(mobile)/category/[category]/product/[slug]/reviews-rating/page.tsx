import { notFound } from "next/navigation";
import { ReviewsRatingView } from "@/components/search/reviews-rating-view";
import { fetchProductDetail } from "@/lib/category/api";
import { findListingProduct } from "@/lib/category/registry";
import { listingToProduct } from "@/lib/category/shared";

type CategoryReviewsPageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export default async function CategoryListingReviewsPage({ params }: CategoryReviewsPageProps) {
  const { category, slug } = await params;
  const backHref = `/category/${category}/product/${slug}`;

  // Local config-driven categories first.
  const found = findListingProduct(category, slug);
  if (found) {
    const mapped = listingToProduct(found.product, found.config.title);
    if (!mapped.ratings) {
      notFound();
    }
    return <ReviewsRatingView title={mapped.title} ratings={mapped.ratings} backHref={backHref} />;
  }

  // Backend-driven categories (car brands + universal parts). Fetch fresh so a
  // just-posted review appears immediately after the client calls router.refresh().
  const product = await fetchProductDetail(slug, { fresh: true });
  if (!product?.ratings) {
    notFound();
  }
  return <ReviewsRatingView title={product.title} ratings={product.ratings} backHref={backHref} productSlug={slug} />;
}
