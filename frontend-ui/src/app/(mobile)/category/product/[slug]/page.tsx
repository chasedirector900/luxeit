import { notFound } from "next/navigation";
import { SearchProductDetailClient } from "@/components/search/search-product-detail-client";
import { fetchProductDetail, fetchRelated } from "@/lib/category/api";

type CategoryProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryProductDetailPage({ params }: CategoryProductDetailPageProps) {
  const { slug } = await params;
  const product = await fetchProductDetail(slug);

  if (!product) {
    notFound();
  }

  const related = await fetchRelated(product.categorySlug, slug);

  return (
    <SearchProductDetailClient
      product={product}
      related={related}
      backHref="/category"
      productHrefBase="/category/product"
    />
  );
}
