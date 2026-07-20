"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CATEGORIES,
  type BikeBrand,
  type CardProduct,
  type Category,
  fmtEUR,
} from "@/lib/products";
import { leadTimeFor } from "@/lib/leadTime";
import { readBikes, subscribeBikes, type Bike } from "@/lib/myBikes";
import { useDictionary } from "@/app/_components/LocaleProvider";
import { CustomSelect } from "../_components/CustomSelect";
import { BikeFinder } from "./BikeFinder";

type SortKey = "popular" | "price-asc" | "price-desc" | "discount" | "newest";

type Props = {
  products: CardProduct[];
  categoryCounts: Record<string, number>;
  brandCounts: Record<string, number>;
  years: number[];
  brandList: { name: string; count: number }[];
  modelsByBrand: Record<string, { name: string; count: number }[]>;
  yearsByFit: Record<string, number[]>;
};

export function ShopBrowser({
  products,
  categoryCounts,
  years,
  brandList,
  modelsByBrand,
  yearsByFit,
}: Props) {
  const dict = useDictionary();
  const catCards = dict.categoryCards as Record<string, { name: string }>;
  const catLabel = (c: string) => catCards[c]?.name ?? c;
  // Seed initial state from URL so the first paint already reflects the link
  // the user clicked. Subsequent navigations are picked up by the effect.
  const sp = useSearchParams();
  const [search, setSearch] = useState(() => sp.get("q") ?? "");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(() => {
    const c = sp.get("category");
    return new Set(c ? [c] : []);
  });
  const [bikeBrand, setBikeBrand] = useState<string | null>(
    () => sp.get("brand")
  );
  const [bikeYear, setBikeYear] = useState<number | null>(() => {
    const y = sp.get("year");
    const n = y ? parseInt(y, 10) : NaN;
    return !isNaN(n) ? n : null;
  });
  const [bikeModel, setBikeModel] = useState<string | null>(
    () => sp.get("model")
  );
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(true);
  const [sort, setSort] = useState<SortKey>("popular");
  const [drawerOpen, setDrawerOpen] = useState(false);
  // "Fit to my bikes" — filter the grid to parts that fit ANY bike the customer
  // has saved in their garage. Read from localStorage so no server roundtrip.
  const [savedBikes, setSavedBikes] = useState<Bike[]>([]);
  const [garageFilter, setGarageFilter] = useState<Bike[]>([]);
  useEffect(() => {
    setSavedBikes(readBikes());
    return subscribeBikes(() => setSavedBikes(readBikes()));
  }, []);

  // Next does not remount on query-only navigation, so we re-sync state when
  // the URL changes (header tab, hero picker, brand chip, etc).
  useEffect(() => {
    const cat = sp.get("category");
    setActiveCategories(cat ? new Set([cat]) : new Set());
    setBikeBrand(sp.get("brand"));
    setBikeModel(sp.get("model"));
    const yr = sp.get("year");
    const yrNum = yr ? parseInt(yr, 10) : NaN;
    setBikeYear(!isNaN(yrNum) ? yrNum : null);
    setSearch(sp.get("q") ?? "");
    setDrawerOpen(false);
  }, [sp]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategories.size > 0) {
      list = list.filter((p) => activeCategories.has(p.category));
    }
    if (garageFilter.length > 0) {
      // Fit to any of the customer's saved bikes: brand match is the primary
      // criterion, year narrows further when the product has a known year list.
      // Model-string matching is intentionally NOT strict here because product
      // model tags and bike model strings don't share a canonical form.
      list = list.filter((p) =>
        garageFilter.some((b) => {
          if (!p.brands.includes(b.brand as BikeBrand)) return false;
          // Years attributed to THIS brand only (cross-compat products carry
          // other brands' build years too). Empty list = universal part
          // without year info; keep it rather than hiding it.
          const ys = p.yearsByBrand[b.brand as BikeBrand] ?? p.years;
          if (b.year && ys.length > 0 && !ys.includes(b.year)) return false;
          return true;
        })
      );
    } else {
      if (bikeBrand) {
        list = list.filter((p) => p.brands.includes(bikeBrand as BikeBrand));
      }
      if (bikeYear) {
        // Same two rules as the garage filter: brand-attributed years when a
        // brand is selected, and products without any year info (universal
        // parts like the 50cc LED lamps or battery packs) always pass.
        list = list.filter((p) => {
          const ys = bikeBrand
            ? p.yearsByBrand[bikeBrand as BikeBrand] ?? []
            : p.years;
          return ys.length === 0 || ys.includes(bikeYear);
        });
      }
      if (bikeModel) {
        const m = bikeModel.toLowerCase();
        list = list.filter((p) =>
          p.models.some((mm) => mm.toLowerCase() === m)
        );
      }
    }
    if (onSaleOnly) {
      list = list.filter((p) => p.compareAt && p.compareAt > p.price);
    }
    if (inStockOnly) {
      list = list.filter((p) => p.inStock);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.fits.some((f) => f.toLowerCase().includes(q))
      );
    }
    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "discount":
        list = [...list].sort((a, b) => {
          const da = a.compareAt ? 1 - a.price / a.compareAt : 0;
          const db = b.compareAt ? 1 - b.price / b.compareAt : 0;
          return db - da;
        });
        break;
    }
    return list;
  }, [products, activeCategories, bikeBrand, bikeYear, bikeModel, garageFilter, onSaleOnly, inStockOnly, search, sort]);

  const toggle = (
    set: Set<string>,
    setter: (s: Set<string>) => void,
    value: string
  ) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  const activeFilterCount =
    activeCategories.size +
    (bikeBrand ? 1 : 0) +
    (bikeYear ? 1 : 0) +
    (bikeModel ? 1 : 0) +
    (onSaleOnly ? 1 : 0) +
    (search.trim() ? 1 : 0);

  const Filters = (
    <div className="flex flex-col gap-7">
      <FilterGroup title={dict.shopBrowser.filterCategory}>
        {(CATEGORIES as readonly Category[]).map((c) => {
          const count = categoryCounts[c] ?? 0;
          if (count === 0) return null;
          const active = activeCategories.has(c);
          return (
            <button
              key={c}
              type="button"
              onClick={() =>
                toggle(activeCategories, setActiveCategories, c)
              }
              className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition-colors ${
                active
                  ? "bg-accent/15 text-accent"
                  : "text-fg-muted hover:bg-surface hover:text-fg"
              }`}
            >
              <span>{catLabel(c)}</span>
              <span className="text-[10px] text-fg-dim">{count}</span>
            </button>
          );
        })}
      </FilterGroup>

      <FilterGroup title={dict.shopBrowser.filterAvailability}>
        <Toggle
          label={dict.shopBrowser.inStockOnly}
          checked={inStockOnly}
          onChange={setInStockOnly}
        />
        <Toggle
          label={dict.shopBrowser.onSaleOnly}
          checked={onSaleOnly}
          onChange={setOnSaleOnly}
        />
      </FilterGroup>

      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={() => {
            setActiveCategories(new Set());
            setBikeBrand(null);
            setBikeYear(null);
            setBikeModel(null);
            setOnSaleOnly(false);
            setSearch("");
          }}
          className="rounded-full border border-border-strong px-3 py-2 text-xs font-semibold uppercase tracking-wider text-fg-muted hover:border-accent hover:text-accent"
        >
          {dict.shopBrowser.clearAllFilters}
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <div className="mb-8 flex flex-col gap-4">
        <h1 className="font-display text-4xl uppercase tracking-tight md:text-5xl">
          {dict.shopBrowser.title}
        </h1>
        <p className="text-sm text-fg-muted">
          {dict.shopBrowser.subtitle.replace("{count}", String(products.length))}
        </p>
      </div>

      {savedBikes.length > 0 && (
        <div className="mb-4 flex flex-col gap-2.5 rounded-2xl border border-accent/40 bg-accent/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <svg viewBox="0 0 24 24" className="size-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="6" cy="17" r="4" />
              <circle cx="18" cy="17" r="4" />
              <path d="M6 17l4-7h5l3 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-semibold text-fg">{dict.shopBrowser.yourGarage}</span>
            <span className="text-xs text-fg-muted">
              {dict.shopBrowser.bikesSaved.replace("{count}", String(savedBikes.length))}
            </span>
          </div>
          {garageFilter.length === 0 ? (
            <button
              type="button"
              onClick={() => {
                setGarageFilter(savedBikes);
                setBikeBrand(null);
                setBikeYear(null);
                setBikeModel(null);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi"
            >
              {dict.shopBrowser.showWhatFits}
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.4}>
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setGarageFilter([])}
              className="inline-flex items-center gap-2 rounded-full border border-accent/60 bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent transition-colors hover:bg-accent/10"
            >
              {dict.shopBrowser.showAllAgain}
            </button>
          )}
        </div>
      )}

      <BikeFinder
        brands={brandList}
        years={years}
        modelsByBrand={modelsByBrand}
        yearsByFit={yearsByFit}
        selectedBrand={bikeBrand}
        selectedYear={bikeYear}
        selectedModel={bikeModel}
        onChange={(b, y, m) => {
          setBikeBrand(b);
          setBikeYear(y);
          setBikeModel(m);
        }}
      />

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
        <div className="flex items-center gap-2 rounded-full border border-border-strong bg-surface px-4 focus-within:border-accent md:flex-1 md:min-w-[220px]">
          <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-fg-muted" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={dict.shopBrowser.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-fg placeholder:text-fg-dim focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <CustomSelect
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            label={dict.shopBrowser.sortLabel}
            ariaLabel={dict.shopBrowser.sortAria}
            className="flex-1 md:flex-none md:min-w-[220px]"
            options={[
              { value: "popular", label: dict.shopBrowser.sortRelevance },
              { value: "price-asc", label: dict.shopBrowser.sortPriceAsc },
              { value: "price-desc", label: dict.shopBrowser.sortPriceDesc },
              { value: "discount", label: dict.shopBrowser.sortDiscount },
            ]}
          />

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex shrink-0 items-center gap-2 rounded-full border border-border-strong bg-surface px-4 py-2.5 text-sm font-semibold text-fg md:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
            </svg>
            {dict.shopBrowser.filters}
            {activeFilterCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-accent text-[10px] font-bold text-fg">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-10 md:grid-cols-[220px_1fr] md:gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden md:block">
          <div className="no-scrollbar sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pr-1">
            {Filters}
          </div>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <p className="text-xs text-fg-dim">
              {dict.shopBrowser.showingCount
                .replace("{shown}", String(filtered.length))
                .replace("{total}", String(products.length))}
            </p>
            {activeFilterCount > 0 && (
              <span className="text-xs text-fg-dim">·</span>
            )}
            {garageFilter.map((b) => (
              <FilterChip
                key={`garage-${b.id}`}
                label={`${b.brand} ${b.model}`}
                onRemove={() =>
                  setGarageFilter((prev) => prev.filter((x) => x.id !== b.id))
                }
              />
            ))}
            {Array.from(activeCategories).map((c) => (
              <FilterChip
                key={`cat-${c}`}
                label={catLabel(c)}
                onRemove={() =>
                  setActiveCategories((prev) => {
                    const next = new Set(prev);
                    next.delete(c);
                    return next;
                  })
                }
              />
            ))}
            {bikeBrand && (
              <FilterChip
                label={bikeBrand}
                onRemove={() => {
                  setBikeBrand(null);
                  setBikeModel(null);
                }}
              />
            )}
            {bikeModel && (
              <FilterChip
                label={bikeModel.replace(
                  new RegExp(`^${bikeBrand}\\s+`, "i"),
                  ""
                )}
                onRemove={() => setBikeModel(null)}
              />
            )}
            {bikeYear && (
              <FilterChip
                label={String(bikeYear)}
                onRemove={() => setBikeYear(null)}
              />
            )}
            {onSaleOnly && (
              <FilterChip label={dict.shopBrowser.onSaleChip} onRemove={() => setOnSaleOnly(false)} />
            )}
            {search.trim() && (
              <FilterChip
                label={`"${search.trim()}"`}
                onRemove={() => setSearch("")}
              />
            )}
          </div>
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface p-10 text-center text-sm text-fg-muted">
              {dict.shopBrowser.noMatches}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => (
                <Link
                  key={p.handle}
                  href={`/products/${p.handle}`}
                  className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent"
                >
                  <div className="relative aspect-square overflow-hidden border-b border-border bg-gradient-to-br from-surface-2 to-bg">
                    {p.image && (
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    {p.compareAt && p.compareAt > p.price && (
                      <span className="absolute left-0 top-0 rounded-br-lg bg-accent px-2 py-1 text-xs font-bold text-fg">
                        {Math.round((1 - p.price / p.compareAt) * 100)}%
                      </span>
                    )}
                    {!p.inStock && (
                      <span className="absolute right-2 top-2 rounded bg-bg/80 px-2 py-1 text-[10px] font-bold uppercase text-fg-dim">
                        {dict.shopBrowser.soldOut}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <h3 className="line-clamp-2 text-sm font-medium text-fg">
                      {p.title}
                    </h3>
                    {(() => {
                      const lead = leadTimeFor(p.category);
                      return lead ? (
                        <span className="inline-flex w-fit items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-fg-muted">
                          <svg viewBox="0 0 24 24" className="size-3 text-accent" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="12" r="9" />
                          </svg>
                          {dict.product.madeToOrder}
                        </span>
                      ) : null;
                    })()}
                    <div className="mt-auto flex items-baseline gap-2">
                      <span className="text-base font-semibold text-fg">
                        {fmtEUR(p.price)}
                      </span>
                      {p.compareAt && p.compareAt > p.price && (
                        <span className="text-xs text-fg-dim line-through">
                          {fmtEUR(p.compareAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-bg md:hidden"
          style={{ backgroundColor: "#0a0a0a" }}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <span className="font-display text-2xl uppercase tracking-tight">
              {dict.shopBrowser.filters}
            </span>
            <button
              type="button"
              aria-label={dict.shopBrowser.closeFiltersAria}
              onClick={() => setDrawerOpen(false)}
              className="grid size-9 place-items-center rounded-full border border-border-strong text-fg-muted hover:border-accent hover:text-fg"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="no-scrollbar flex-1 overflow-y-auto p-4">
            {Filters}
          </div>
          <div className="border-t border-border p-4">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="w-full rounded-full bg-accent py-3 text-sm font-bold uppercase tracking-wider text-fg"
            >
              {dict.shopBrowser.showNProducts.replace("{count}", String(filtered.length))}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-fg-dim">
        {title}
      </span>
      {children}
    </div>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="group inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent transition-colors hover:border-accent hover:bg-accent/20"
    >
      <span>{label}</span>
      <svg
        viewBox="0 0 24 24"
        className="size-3 opacity-70 group-hover:opacity-100"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 text-sm text-fg-muted hover:bg-surface hover:text-fg">
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-surface-2"
        }`}
      >
        <span
          className={`inline-block size-4 rounded-full bg-fg transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      {label}
    </label>
  );
}
