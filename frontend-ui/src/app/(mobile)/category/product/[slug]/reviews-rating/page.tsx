import { notFound } from "next/navigation";
import { ReviewsRatingView } from "@/components/search/reviews-rating-view";
import { fetchProductDetail } from "@/lib/category/api";

type CategoryReviewsRatingPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryReviewsRatingPage({ params }: CategoryReviewsRatingPageProps) {
  const { slug } = await params;
  const product = await fetchProductDetail(slug, { fresh: true });

  if (!product || !product.ratings) {
    notFound();
  }

  return (
    <ReviewsRatingView
      title={product.title}
      ratings={product.ratings}
      backHref={`/category/product/${slug}`}
      productSlug={slug}
    />
  );
}
