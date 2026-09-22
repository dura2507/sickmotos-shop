import { Suspense } from "react";
import type { Metadata } from "next";
import { getShopData } from "@/lib/products";
import { getLocale } from "@/lib/i18n/getLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { ShopBrowser } from "./ShopBrowser";
import { ShopSkeleton } from "./ShopSkeleton";

// Rendered per request like every other page: force-static baked ONE
// English HTML for all visitors (cookies and Accept-Language are empty at
// build time), so German customers saw "Shop the catalog" (2026-09-11).
// Product data is cached in-process by getShopData(), the render itself
// costs ~30 ms. Filter state is read from the URL on the client.

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(await getLocale());
  return {
    alternates: { canonical: "/shop" },
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
