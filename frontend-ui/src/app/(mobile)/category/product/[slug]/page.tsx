import { notFound } from "next/navigation";
import { SearchProductDetailClient } from "@/components/search/search-product-detail-client";
import { MOCK_PRODUCTS } from "@/lib/products/mock-products";

type CategoryProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryProductDetailPage({ params }: CategoryProductDetailPageProps) {
  const { slug } = await params;
  const product = MOCK_PRODUCTS.find((item) => item.slug === slug);

  if (!product) {
    notFound();
  }

  const related = MOCK_PRODUCTS.filter((item) => item.slug !== slug).slice(0, 4);

  return (
    <SearchProductDetailClient
      product={product}
      related={related}
      backHref="/category"
      productHrefBase="/category/product"
    />
  );
}
