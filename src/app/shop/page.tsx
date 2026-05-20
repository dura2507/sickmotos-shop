import {
  BIKE_BRANDS,
  countByBrand,
  countByCategory,
  getAllCards,
  getAllYears,
  getModelsForBrand,
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
    model?: string;
  }>;
}) {
  const sp = await searchParams;
  const products = getAllCards();
  const initialYear = sp.year ? parseInt(sp.year, 10) : undefined;

  // Pre-compute models for every brand we know so the client doesn't have
  // to do all that string slicing.
  const modelsByBrand: Record<string, { name: string; count: number }[]> = {};
  for (const b of BIKE_BRANDS) {
    const models = getModelsForBrand(b);
    if (models.length > 0) modelsByBrand[b] = models;
  }

  return (
    <ShopBrowser
      products={products}
      categoryCounts={countByCategory()}
      brandCounts={countByBrand()}
      years={getAllYears()}
      modelsByBrand={modelsByBrand}
      initialCategory={sp.category}
      initialBrand={sp.brand}
      initialYear={initialYear && !isNaN(initialYear) ? initialYear : undefined}
      initialModel={sp.model}
    />
  );
}
