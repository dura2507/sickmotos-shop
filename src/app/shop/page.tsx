import { Suspense } from "react";
import type { Metadata } from "next";
import { getShopData } from "@/lib/products";
import { getLocale } from "@/lib/i18n/getLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ShopBrowser } from "./ShopBrowser";
import { ShopSkeleton } from "./ShopSkeleton";

// Static: HTML is cached at the edge. Filter state is read from the URL on
// the client via useSearchParams, so we never need the server to re-render
// for a query change.
export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(await getLocale());
  return {
    title: dict.shopPage.metaTitle,
  };
}

export default function ShopPage() {
  const data = getShopData();
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopBrowser
        products={data.products}
        categoryCounts={data.categoryCounts}
        brandCounts={data.brandCounts}
        years={data.years}
        brandList={data.brandList}
        modelsByBrand={data.modelsByBrand}
        yearsByFit={data.yearsByFit}
      />
    </Suspense>
  );
}
