import type { Metadata } from "next";
import Link from "next/link";
import { BikeGarage } from "./BikeGarage";
import {
  BIKE_BRANDS,
  getAllYears,
  getModelsForBrand,
} from "@/lib/products";
import { getLocale } from "@/lib/i18n/getLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(await getLocale());
  return {
    title: dict.bikes.metaTitle,
    description: dict.bikes.metaDescription,
  };
}

export default async function MyBikesPage() {
  const dict = await getDictionary(await getLocale());
  const modelsByBrand: Record<string, string[]> = {};
  for (const brand of BIKE_BRANDS) {
    modelsByBrand[brand] = getModelsForBrand(brand).map((m) => m.name);
  }
  const years = getAllYears();

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <nav className="mb-6 flex items-center gap-2 text-xs text-fg-muted">
        <Link href="/account" className="hover:text-fg">
          {dict.bikes.breadcrumbAccount}
        </Link>
        <span className="text-fg-dim">/</span>
        <span className="text-fg">{dict.bikes.breadcrumbGarage}</span>
      </nav>

      <h1 className="mb-3 font-display text-4xl uppercase tracking-tight md:text-5xl">
        {dict.bikes.heading}
      </h1>

      <BikeGarage
        brands={[...BIKE_BRANDS]}
        modelsByBrand={modelsByBrand}
        years={years}
      />
    </div>
  );
}
