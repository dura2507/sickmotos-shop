"use client";

import { useState } from "react";
import { CustomSelect } from "./CustomSelect";
import { SearchSuggest } from "./SearchSuggest";
import type { SearchEntry } from "@/lib/products";

const brandOptions = [
  { value: "all", label: "All brands" },
  { value: "Beta", label: "Beta" },
  { value: "Husqvarna", label: "Husqvarna" },
  { value: "KTM", label: "KTM" },
  { value: "Aprilia", label: "Aprilia" },
  { value: "Fantic", label: "Fantic" },
  { value: "Yamaha", label: "Yamaha" },
  { value: "GasGas", label: "GasGas" },
  { value: "Sherco", label: "Sherco" },
];

export function HeaderSearch({ index }: { index: SearchEntry[] }) {
  const [brand, setBrand] = useState("all");

  return (
    <div className="hidden flex-1 items-center gap-2 md:flex">
      <CustomSelect
        options={brandOptions}
        value={brand}
        onChange={setBrand}
        ariaLabel="Select bike brand"
        triggerClassName="w-44"
      />
      <SearchSuggest
        index={index}
        variant="header"
        brand={brand}
        placeholder="Search exhausts, LEDs, carbon, parts..."
      />
    </div>
  );
}
