import {
  countByBrand,
  countByCategory,
  getAllCards,
} from "@/lib/products";
import { ShopBrowser } from "./ShopBrowser";

export const metadata = {
  title: "Shop — SickMotos performance parts",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; brand?: string }>;
}) {
  const sp = await searchParams;
  const products = getAllCards();
  return (
    <ShopBrowser
      products={products}
      categoryCounts={countByCategory()}
      brandCounts={countByBrand()}
      initialCategory={sp.category}
      initialBrand={sp.brand}
    />
  );
}
