import { notFound } from "next/navigation";
import { ReviewsRatingView } from "@/components/search/reviews-rating-view";
import { MOCK_PRODUCTS } from "@/lib/products/mock-products";

type ProductReviewsRatingPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductReviewsRatingPage({ params }: ProductReviewsRatingPageProps) {
  const { slug } = await params;
  const product = MOCK_PRODUCTS.find((item) => item.slug === slug);

  if (!product || !product.ratings) {
    notFound();
  }

  return <ReviewsRatingView title={product.title} ratings={product.ratings} backHref={`/product/${slug}`} />;
}
