"use client";

import { useEffect, useMemo, useState } from "react";

function StepDot({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-flex size-3 items-center justify-center rounded-full transition-colors ${
        done ? "bg-accent" : "border border-fg-dim/60 bg-transparent"
      }`}
    >
      {done && (
        <svg viewBox="0 0 24 24" className="size-2 text-fg" fill="none" stroke="currentColor" strokeWidth={4}>
          <path d="M5 12l4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

type ModelOption = { name: string; count: number };

type Props = {
  brands: { name: string; count: number }[];
  years: number[];
  modelsByBrand: Record<string, ModelOption[]>;
  yearsByFit: Record<string, number[]>;
  selectedBrand: string | null;
  selectedYear: number | null;
  selectedModel: string | null;
  onChange: (
    brand: string | null,
    year: number | null,
    model: string | null
  ) => void;
};

const STORAGE_KEY = "sickmotos:bike-finder";

export function BikeFinder({
  brands,
  years,
  modelsByBrand,
  yearsByFit,
  selectedBrand,
  selectedYear,
  selectedModel,
  onChange,
}: Props) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedBrand || selectedYear || selectedModel) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          brand: selectedBrand,
          year: selectedYear,
          model: selectedModel,
        })
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedBrand, selectedYear, selectedModel]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedBrand || selectedYear || selectedModel) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as {
        brand?: string;
        year?: number;
        model?: string;
      };
      if (data.brand || data.year || data.model) {
        onChange(data.brand ?? null, data.year ?? null, data.model ?? null);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const models = useMemo(
    () => (selectedBrand ? modelsByBrand[selectedBrand] ?? [] : []),
    [selectedBrand, modelsByBrand]
  );

  // Year choices narrow down once brand or model is picked. Without any
  // brand we still show every year so users can browse by year alone.
  const availableYears = useMemo(() => {
    if (selectedBrand && selectedModel) {
      return yearsByFit[`${selectedBrand}::${selectedModel}`] ?? [];
    }
    if (selectedBrand) {
      return yearsByFit[selectedBrand] ?? [];
    }
    return years;
  }, [selectedBrand, selectedModel, yearsByFit, years]);

  // If the previously selected year is no longer available after a
  // brand/model change, drop it.
  useEffect(() => {
    if (selectedYear === null) return;
    if (availableYears.includes(selectedYear)) return;
    onChange(selectedBrand, null, selectedModel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableYears.join(",")]);

  const summaryParts = [
    selectedBrand,
    selectedModel ? selectedModel.replace(new RegExp(`^${selectedBrand}\\s+`, "i"), "") : null,
    selectedYear?.toString(),
  ].filter(Boolean);
  const summary = summaryParts.length > 0 ? summaryParts.join(" · ") : "Build your fit";

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
            {(selectedBrand || selectedYear || selectedModel) && (
              <span className="text-xs text-fg-muted">
                Showing only parts that fit your bike.
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(selectedBrand || selectedYear || selectedModel) && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null, null, null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(null, null, null);
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
                <StepDot done={!!selectedBrand} />
                Brand
              </span>
              <div className="flex flex-wrap gap-2">
                {brands.map((b) => {
                  const active = selectedBrand === b.name;
                  return (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => {
                        if (active) {
                          onChange(null, selectedYear, null);
                        } else {
                          onChange(b.name, selectedYear, null);
                        }
                      }}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors duration-150 ${
                        active
                          ? "border-accent bg-accent text-fg"
                          : "border-border-strong bg-surface text-fg-muted hover:border-accent/60 hover:bg-surface-2 hover:text-fg"
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

            {selectedBrand && models.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-fg-dim">
                  <StepDot done={!!selectedModel} />
                  Model
                  <span className="text-fg-dim/70">
                    ({models.length} for {selectedBrand})
                  </span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {models.map((m) => {
                    const active = selectedModel === m.name;
                    const shortName = m.name.replace(
                      new RegExp(`^${selectedBrand}\\s+`, "i"),
                      ""
                    );
                    return (
                      <button
                        key={m.name}
                        type="button"
                        onClick={() =>
                          onChange(
                            selectedBrand,
                            selectedYear,
                            active ? null : m.name
                          )
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wider transition-colors duration-150 ${
                          active
                            ? "border-accent bg-accent text-fg"
                            : "border-border-strong bg-surface text-fg-muted hover:border-accent/60 hover:bg-surface-2 hover:text-fg"
                        }`}
                      >
                        {shortName}
                        <span
                          className={`ml-2 text-[10px] ${
                            active ? "text-fg/80" : "text-fg-dim"
                          }`}
                        >
                          {m.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-fg-dim">
                <StepDot done={!!selectedYear} />
                Year
              </span>
              {availableYears.length === 0 ? (
                <p className="text-xs text-fg-dim">
                  No years available for this selection.
                </p>
              ) : (
                <div
                  key={`yr-${selectedBrand ?? "all"}-${selectedModel ?? ""}`}
                  className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
                >
                  {availableYears.map((y, i) => {
                    const active = selectedYear === y;
                    return (
                      <button
                        key={y}
                        type="button"
                        onClick={() =>
                          onChange(
                            selectedBrand,
                            active ? null : y,
                            selectedModel
                          )
                        }
                        className={`pop-in shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wider transition-colors duration-150 ${
                          active
                            ? "border-accent bg-accent text-fg"
                            : "border-border-strong bg-surface text-fg-muted hover:border-accent/60 hover:bg-surface-2 hover:text-fg"
                        }`}
                        style={{ animationDelay: `${Math.min(i * 25, 600)}ms` }}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
