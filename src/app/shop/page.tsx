import {
  countByBrand,
  countByCategory,
  getAllCards,
  getAllYears,
} from "@/lib/products";
import { ShopBrowser } from "./ShopBrowser";

export const metadata = {
  title: "Shop — SickMotos performance parts",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    brand?: string;
    year?: string;
  }>;
}) {
  const sp = await searchParams;
  const products = getAllCards();
  const initialYear = sp.year ? parseInt(sp.year, 10) : undefined;
  return (
    <ShopBrowser
      products={products}
      categoryCounts={countByCategory()}
      brandCounts={countByBrand()}
      years={getAllYears()}
      initialCategory={sp.category}
      initialBrand={sp.brand}
      initialYear={initialYear && !isNaN(initialYear) ? initialYear : undefined}
    />
  );
}
