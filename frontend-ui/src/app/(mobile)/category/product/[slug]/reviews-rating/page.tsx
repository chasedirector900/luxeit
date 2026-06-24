import { notFound } from "next/navigation";
import { ReviewsRatingView } from "@/components/search/reviews-rating-view";
import { MOCK_PRODUCTS } from "@/lib/products/mock-products";

type CategoryReviewsRatingPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryReviewsRatingPage({ params }: CategoryReviewsRatingPageProps) {
  const { slug } = await params;
  const product = MOCK_PRODUCTS.find((item) => item.slug === slug);

  if (!product || !product.ratings) {
    notFound();
  }

  return <ReviewsRatingView title={product.title} ratings={product.ratings} backHref={`/category/product/${slug}`} />;
}
