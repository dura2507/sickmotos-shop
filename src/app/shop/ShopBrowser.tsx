"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BIKE_BRANDS,
  CATEGORIES,
  type BikeBrand,
  type CardProduct,
  type Category,
  fmtEUR,
} from "@/lib/products";
import { CustomSelect } from "../_components/CustomSelect";

type SortKey = "popular" | "price-asc" | "price-desc" | "discount" | "newest";

type Props = {
  products: CardProduct[];
  categoryCounts: Record<string, number>;
  brandCounts: Record<string, number>;
  initialCategory?: string;
  initialBrand?: string;
};

export function ShopBrowser({
  products,
  categoryCounts,
  brandCounts,
  initialCategory,
  initialBrand,
}: Props) {
  const [search, setSearch] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    () => new Set(initialCategory ? [initialCategory] : [])
  );
  const [activeBrands, setActiveBrands] = useState<Set<string>>(
    () => new Set(initialBrand ? [initialBrand] : [])
  );
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(true);
  const [sort, setSort] = useState<SortKey>("popular");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategories.size > 0) {
      list = list.filter((p) => activeCategories.has(p.category));
    }
    if (activeBrands.size > 0) {
      list = list.filter((p) =>
        p.brands.some((b) => activeBrands.has(b))
      );
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
  }, [products, activeCategories, activeBrands, onSaleOnly, inStockOnly, search, sort]);

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
    activeBrands.size +
    (onSaleOnly ? 1 : 0) +
    (search.trim() ? 1 : 0);

  const Filters = (
    <div className="flex flex-col gap-7">
      <FilterGroup title="Category">
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
              <span>{c}</span>
              <span className="text-[10px] text-fg-dim">{count}</span>
            </button>
          );
        })}
      </FilterGroup>

      <FilterGroup title="Bike brand">
        {(BIKE_BRANDS as readonly BikeBrand[]).map((b) => {
          const count = brandCounts[b] ?? 0;
          if (count === 0) return null;
          const active = activeBrands.has(b);
          return (
            <button
              key={b}
              type="button"
              onClick={() => toggle(activeBrands, setActiveBrands, b)}
              className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition-colors ${
                active
                  ? "bg-accent/15 text-accent"
                  : "text-fg-muted hover:bg-surface hover:text-fg"
              }`}
            >
              <span>{b}</span>
              <span className="text-[10px] text-fg-dim">{count}</span>
            </button>
          );
        })}
      </FilterGroup>

      <FilterGroup title="Availability">
        <Toggle
          label="In stock only"
          checked={inStockOnly}
          onChange={setInStockOnly}
        />
        <Toggle
          label="On sale only"
          checked={onSaleOnly}
          onChange={setOnSaleOnly}
        />
      </FilterGroup>

      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={() => {
            setActiveCategories(new Set());
            setActiveBrands(new Set());
            setOnSaleOnly(false);
            setSearch("");
          }}
          className="rounded-full border border-border-strong px-3 py-2 text-xs font-semibold uppercase tracking-wider text-fg-muted hover:border-accent hover:text-accent"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:py-14">
      <div className="mb-8 flex flex-col gap-4">
        <h1 className="font-display text-4xl uppercase tracking-tight md:text-5xl">
          Shop the catalog
        </h1>
        <p className="text-sm text-fg-muted">
          {products.length} products. Filter by bike, category, sale or stock.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-full border border-border-strong bg-surface px-4 focus-within:border-accent">
          <svg viewBox="0 0 24 24" className="size-4 text-fg-muted" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by part or bike..."
            className="flex-1 bg-transparent py-2.5 text-sm text-fg placeholder:text-fg-dim focus:outline-none"
          />
        </div>

        <CustomSelect
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          label="Sort:"
          ariaLabel="Sort products"
          triggerClassName="min-w-[220px]"
          options={[
            { value: "popular", label: "Relevance" },
            { value: "price-asc", label: "Price: low to high" },
            { value: "price-desc", label: "Price: high to low" },
            { value: "discount", label: "Biggest discount" },
          ]}
        />

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 rounded-full border border-border-strong bg-surface px-4 py-2.5 text-sm font-semibold text-fg md:hidden"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-accent text-[10px] font-bold text-fg">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="grid gap-10 md:grid-cols-[220px_1fr] md:gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden md:block">
          <div className="no-scrollbar sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pr-1">
            {Filters}
          </div>
        </aside>

        <div>
          <p className="mb-4 text-xs text-fg-dim">
            Showing {filtered.length} of {products.length} products
          </p>
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface p-10 text-center text-sm text-fg-muted">
              No products match these filters.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    {p.compareAt && p.compareAt > p.price && (
                      <span className="absolute left-0 top-0 rounded-br-lg bg-accent px-2 py-1 text-xs font-bold text-fg">
                        {Math.round((1 - p.price / p.compareAt) * 100)}%
                      </span>
                    )}
                    {!p.inStock && (
                      <span className="absolute right-2 top-2 rounded bg-bg/80 px-2 py-1 text-[10px] font-bold uppercase text-fg-dim">
                        Sold out
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <h3 className="line-clamp-2 text-sm font-medium text-fg">
                      {p.title}
                    </h3>
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
              Filters
            </span>
            <button
              type="button"
              aria-label="Close filters"
              onClick={() => setDrawerOpen(false)}
              className="grid size-9 place-items-center rounded-full border border-border-strong text-fg-muted hover:border-accent hover:text-fg"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{Filters}</div>
          <div className="border-t border-border p-4">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="w-full rounded-full bg-accent py-3 text-sm font-bold uppercase tracking-wider text-fg"
            >
              Show {filtered.length} products
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
