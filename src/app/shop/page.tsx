import {
  BIKE_BRANDS,
  countByBrand,
  countByCategory,
  getAllCards,
  getAllYears,
  getModelsForBrand,
  getYearsForFit,
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
  // Years per (brand, model) combo. Year list is dynamic so users only see
  // realistic options.
  const yearsByFit: Record<string, number[]> = {};
  for (const b of BIKE_BRANDS) {
    const models = getModelsForBrand(b);
    if (models.length > 0) modelsByBrand[b] = models;
    // years for brand alone (no model)
    const brandYears = getYearsForFit(b, null);
    if (brandYears.length > 0) yearsByFit[b] = brandYears;
    // years for each brand+model
    for (const m of models) {
      const k = `${b}::${m.name}`;
      const ys = getYearsForFit(b, m.name);
      if (ys.length > 0) yearsByFit[k] = ys;
    }
  }

  return (
    <ShopBrowser
      products={products}
      categoryCounts={countByCategory()}
      brandCounts={countByBrand()}
      years={getAllYears()}
      modelsByBrand={modelsByBrand}
      yearsByFit={yearsByFit}
      initialCategory={sp.category}
      initialBrand={sp.brand}
      initialYear={initialYear && !isNaN(initialYear) ? initialYear : undefined}
      initialModel={sp.model}
    />
  );
}
