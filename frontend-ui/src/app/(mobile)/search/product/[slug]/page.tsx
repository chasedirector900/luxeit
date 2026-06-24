import { redirect } from "next/navigation";

type SearchProductDetailRedirectPageProps = {
  params: Promise<{ slug: string }>;
};

// The home product flow now lives at /product/[slug]; keep old links working.
export default async function SearchProductDetailRedirectPage({ params }: SearchProductDetailRedirectPageProps) {
  const { slug } = await params;
  redirect(`/product/${slug}`);
}
