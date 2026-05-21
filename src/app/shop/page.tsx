import { Suspense } from "react";
import { getShopData } from "@/lib/products";
import { ShopBrowser } from "./ShopBrowser";
import { ShopSkeleton } from "./ShopSkeleton";

// Static: HTML is cached at the edge. Filter state is read from the URL on
// the client via useSearchParams, so we never need the server to re-render
// for a query change.
export const dynamic = "force-static";

export const metadata = {
  title: "Shop — SickMotos performance parts",
};

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
