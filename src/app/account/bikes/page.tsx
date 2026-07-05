import type { Metadata } from "next";
import Link from "next/link";
import { BikeGarage } from "./BikeGarage";
import {
  BIKE_BRANDS,
  getAllYears,
  getModelsForBrand,
} from "@/lib/products";

export const metadata: Metadata = {
  title: "My garage — SickMotos",
  description: "Save your bikes and shop only what fits.",
};

export default function MyBikesPage() {
  const modelsByBrand: Record<string, string[]> = {};
  for (const brand of BIKE_BRANDS) {
    modelsByBrand[brand] = getModelsForBrand(brand).map((m) => m.name);
  }
  const years = getAllYears();

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <nav className="mb-6 flex items-center gap-2 text-xs text-fg-muted">
        <Link href="/account" className="hover:text-fg">
          Account
        </Link>
        <span className="text-fg-dim">/</span>
        <span className="text-fg">My garage</span>
      </nav>

      <h1 className="mb-3 font-display text-4xl uppercase tracking-tight md:text-5xl">
        My garage
      </h1>

      <BikeGarage
        brands={[...BIKE_BRANDS]}
        modelsByBrand={modelsByBrand}
        years={years}
      />
    </div>
  );
}
