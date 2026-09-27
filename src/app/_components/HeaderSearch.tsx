"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { readBike, subscribeBike, writeBike, type SavedBike } from "@/lib/bikeStore";
import type { SearchEntry } from "@/lib/products";
import { getCachedSearchIndex, loadSearchIndex } from "@/lib/searchIndexLoader";
import { SearchSuggest } from "./SearchSuggest";
import { useDictionary } from "./LocaleProvider";

export function HeaderSearch() {
  const dict = useDictionary();
  const [bike, setBike] = useState<SavedBike>({ brand: null, model: null, year: null });
  const [mounted, setMounted] = useState(false);
  // Der Suchindex (~180 KB) kommt nicht mehr im Seiten-Payload mit, sondern
  // wird beim ersten Hover/Fokus/Tastendruck auf die Suche von
  // /api/search-index geholt. Der Loader haelt ihn modulweit, ein Remount
  // (z.B. Sprachwechsel laedt die Seite neu) startet also nicht bei null.
  const [index, setIndex] = useState<SearchEntry[]>(() => getCachedSearchIndex() ?? []);
  const [indexLoading, setIndexLoading] = useState(false);
  const requested = useRef(false);
  const alive = useRef(true);

  useEffect(() => {
    setMounted(true);
    setBike(readBike());
    alive.current = true;
    const unsubscribe = subscribeBike(setBike);
    return () => {
      alive.current = false;
      unsubscribe();
    };
  }, []);

  const ensureIndex = useCallback(() => {
    if (requested.current) return;
    requested.current = true;
    const cached = getCachedSearchIndex();
    if (cached) {
      setIndex(cached);
      return;
    }
    setIndexLoading(true);
    loadSearchIndex()
      .then((entries) => {
        if (alive.current) setIndex(entries);
      })
      .catch(() => {
        // Naechster Trigger versucht es erneut, der Loader hat sein Promise
        // bereits verworfen.
        requested.current = false;
      })
      .finally(() => {
        if (alive.current) setIndexLoading(false);
      });
  }, []);

  const hasBike = !!(bike.brand || bike.model);
  const shortModel = bike.model && bike.brand
    ? bike.model.replace(new RegExp(`^${bike.brand}\\s+`, "i"), "")
    : bike.model;
  const chipLabel = bike.model
    ? `${bike.brand} ${shortModel}`
    : bike.brand ?? "";

  const placeholder = hasBike
    ? dict.headerSearch.placeholderWithBike.replace("{bike}", chipLabel)
    : dict.headerSearch.placeholderDefault;

  return (
    <div className="hidden flex-1 items-center gap-2 md:flex">
      {mounted && hasBike ? (
        <div className="flex shrink-0 items-center gap-1 rounded-full border border-accent/40 bg-accent/10 py-1 pl-3 pr-1 text-xs font-semibold uppercase tracking-wider text-accent">
          <span>{chipLabel}</span>
          <button
            type="button"
            aria-label={dict.headerSearch.clearBike}
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
          {dict.header.pickBike}
        </Link>
      )}
      <SearchSuggest
        index={index}
        indexLoading={indexLoading}
        onIntent={ensureIndex}
        variant="header"
        placeholder={placeholder}
        filterBrand={bike.brand ?? undefined}
        filterModel={bike.model ?? undefined}
      />
    </div>
  );
}
