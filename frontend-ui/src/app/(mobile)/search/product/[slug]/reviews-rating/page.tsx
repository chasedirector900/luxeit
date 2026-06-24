import { redirect } from "next/navigation";

type SearchReviewsRatingRedirectPageProps = {
  params: Promise<{ slug: string }>;
};

// The home reviews flow now lives at /product/[slug]/reviews-rating.
export default async function SearchReviewsRatingRedirectPage({ params }: SearchReviewsRatingRedirectPageProps) {
  const { slug } = await params;
  redirect(`/product/${slug}/reviews-rating`);
}
