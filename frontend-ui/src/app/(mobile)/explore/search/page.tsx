import { Suspense } from "react";
import { SearchPageClient } from "@/components/search/search-page-client";

export default function ExploreSearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageClient />
    </Suspense>
  );
}

