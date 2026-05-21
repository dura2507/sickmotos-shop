"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readBike, subscribeBike, writeBike, type SavedBike } from "@/lib/bikeStore";
import type { SearchEntry } from "@/lib/products";
import { SearchSuggest } from "./SearchSuggest";

export function HeaderSearch({ index }: { index: SearchEntry[] }) {
  const [bike, setBike] = useState<SavedBike>({ brand: null, model: null, year: null });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setBike(readBike());
    return subscribeBike(setBike);
  }, []);

  const hasBike = !!(bike.brand || bike.model);
  const shortModel = bike.model && bike.brand
    ? bike.model.replace(new RegExp(`^${bike.brand}\\s+`, "i"), "")
    : bike.model;
  const chipLabel = bike.model
    ? `${bike.brand} ${shortModel}`
    : bike.brand ?? "";

  const placeholder = hasBike
    ? `Parts that fit ${chipLabel}...`
    : "Search exhausts, LEDs, carbon...";

  return (
    <div className="hidden flex-1 items-center gap-2 md:flex">
      {mounted && hasBike ? (
        <div className="flex shrink-0 items-center gap-1 rounded-full border border-accent/40 bg-accent/10 py-1 pl-3 pr-1 text-xs font-semibold uppercase tracking-wider text-accent">
          <span>{chipLabel}</span>
          <button
            type="button"
            aria-label="Clear bike"
            onClick={() => writeBike({ brand: null, model: null, year: null })}
            className="grid size-6 place-items-center rounded-full text-accent/80 transition-colors hover:bg-accent/20 hover:text-accent"
          >
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : (
        <Link
          href="/shop"
          className="shrink-0 rounded-full border border-border-strong px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-muted transition-colors hover:border-accent hover:text-accent"
        >
          Pick your bike
        </Link>
      )}
      <SearchSuggest
        index={index}
        variant="header"
        placeholder={placeholder}
        filterBrand={bike.brand ?? undefined}
        filterModel={bike.model ?? undefined}
      />
    </div>
  );
}
