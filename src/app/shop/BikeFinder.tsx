"use client";

import { useEffect, useState } from "react";

type Props = {
  brands: { name: string; count: number }[];
  years: number[];
  selectedBrand: string | null;
  selectedYear: number | null;
  onChange: (brand: string | null, year: number | null) => void;
};

const STORAGE_KEY = "sickmotos:bike-finder";

export function BikeFinder({
  brands,
  years,
  selectedBrand,
  selectedYear,
  onChange,
}: Props) {
  const [open, setOpen] = useState(true);

  // Persist selection so the bike sticks across navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    const data = { brand: selectedBrand, year: selectedYear };
    if (selectedBrand || selectedYear) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedBrand, selectedYear]);

  // Hydrate from storage on first mount (only if parent didn't already set)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedBrand || selectedYear) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { brand?: string; year?: number };
      if (data.brand || data.year) {
        onChange(data.brand ?? null, data.year ?? null);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = selectedBrand
    ? `${selectedBrand}${selectedYear ? ` · ${selectedYear}` : ""}`
    : "Build your fit";

  return (
    <section className="relative isolate mb-10 overflow-hidden rounded-2xl border border-border bg-surface/40">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 -z-10 size-[420px] rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(closest-side, rgba(225,6,0,0.18), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(225,6,0,0.5) 50%, transparent 100%)",
        }}
      />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <div className="flex items-center gap-4">
          <span className="grid size-10 place-items-center rounded-full border border-accent/40 bg-accent/10 text-accent">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="18" r="3" />
              <path d="M9 18h6M6 18l3-9h6l3 9M12 9V6h4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
              Bike finder
            </span>
            <span className="font-display text-xl uppercase tracking-tight text-fg md:text-2xl">
              {summary}
            </span>
            {(selectedBrand || selectedYear) && (
              <span className="text-xs text-fg-muted">
                Showing only parts that fit your bike.
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(selectedBrand || selectedYear) && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null, null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(null, null);
                }
              }}
              className="cursor-pointer rounded-full border border-border-strong px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-fg-muted transition-colors hover:border-accent hover:text-accent"
            >
              Reset
            </span>
          )}
          <svg
            viewBox="0 0 24 24"
            className={`size-5 text-fg-muted transition-transform ${
              open ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-5 px-6 pb-6">
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-fg-dim">
                <span
                  className={`grid size-4 place-items-center rounded-full border text-[9px] font-bold ${
                    selectedBrand
                      ? "border-accent bg-accent text-fg"
                      : "border-fg-dim text-fg-dim"
                  }`}
                >
                  1
                </span>
                Brand
              </span>
              <div className="flex flex-wrap gap-2">
                {brands.map((b) => {
                  const active = selectedBrand === b.name;
                  return (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() =>
                        onChange(active ? null : b.name, selectedYear)
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 ${
                        active
                          ? "border-accent bg-accent text-fg"
                          : "border-border-strong bg-surface text-fg-muted hover:border-fg/40 hover:text-fg"
                      }`}
                    >
                      {b.name}
                      <span
                        className={`ml-2 text-[10px] ${
                          active ? "text-fg/80" : "text-fg-dim"
                        }`}
                      >
                        {b.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-fg-dim">
                <span
                  className={`grid size-4 place-items-center rounded-full border text-[9px] font-bold ${
                    selectedYear
                      ? "border-accent bg-accent text-fg"
                      : "border-fg-dim text-fg-dim"
                  }`}
                >
                  2
                </span>
                Year
              </span>
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                {years.map((y) => {
                  const active = selectedYear === y;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() =>
                        onChange(selectedBrand, active ? null : y)
                      }
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wider transition-all duration-200 hover:-translate-y-0.5 ${
                        active
                          ? "border-accent bg-accent text-fg"
                          : "border-border-strong bg-surface text-fg-muted hover:border-fg/40 hover:text-fg"
                      }`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
