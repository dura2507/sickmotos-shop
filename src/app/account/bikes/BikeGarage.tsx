"use client";

import { useEffect, useState } from "react";
import {
  addBike,
  readBikes,
  removeBike,
  subscribeBikes,
  type Bike,
} from "@/lib/myBikes";
import { CustomSelect } from "../../_components/CustomSelect";
import { useDictionary } from "@/app/_components/LocaleProvider";

type Props = {
  brands: string[];
  modelsByBrand: Record<string, string[]>;
  years: number[];
};

export function BikeGarage({ brands, modelsByBrand, years }: Props) {
  const dict = useDictionary();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number | "">("");

  useEffect(() => {
    setBikes(readBikes());
    return subscribeBikes(() => setBikes(readBikes()));
  }, []);

  const models = brand ? modelsByBrand[brand] || [] : [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!brand || !model || !year) return;
    addBike({ brand, model, year: Number(year) });
    setModel("");
    setYear("");
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-2xl text-sm leading-relaxed text-fg-muted">
        {dict.bikes.intro}
      </p>

      <form
        onSubmit={submit}
        className="grid gap-3 rounded-2xl border border-border bg-surface/40 p-5 md:grid-cols-[1fr_1fr_140px_auto]"
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-fg-dim">
            {dict.bikes.brand}
          </span>
          <CustomSelect
            value={brand}
            onChange={(v) => {
              setBrand(v);
              setModel("");
            }}
            options={[
              { value: "", label: dict.bikes.pickBrand },
              ...brands.map((b) => ({ value: b, label: b })),
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-fg-dim">
            {dict.bikes.model}
          </span>
          <CustomSelect
            value={model}
            onChange={setModel}
            options={[
              { value: "", label: brand ? dict.bikes.pickModel : dict.bikes.pickBrandFirst },
              ...models.map((m) => ({ value: m, label: m })),
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-fg-dim">
            {dict.bikes.year}
          </span>
          <CustomSelect
            value={year === "" ? "" : String(year)}
            onChange={(v) => setYear(v ? Number(v) : "")}
            options={[
              { value: "", label: dict.bikes.year },
              ...years.map((y) => ({ value: String(y), label: String(y) })),
            ]}
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={!brand || !model || !year}
            className="h-11 w-full rounded-full bg-accent px-5 text-xs font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-dim md:w-auto"
          >
            {dict.bikes.addBike}
          </button>
        </div>
      </form>

      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-fg-dim">
          {dict.bikes.yourGarageCount.replace("{bikes.length}", String(bikes.length))}
        </p>
        {bikes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/30 p-8 text-center text-sm text-fg-muted">
            {dict.bikes.noBikes}
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {bikes.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/50 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-accent/15 text-accent">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
                      <circle cx="6" cy="17" r="4" />
                      <circle cx="18" cy="17" r="4" />
                      <path d="M6 17l4-7h5l3 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-fg">
                      {b.brand} {b.model}
                    </p>
                    <p className="text-xs text-fg-muted">{b.year}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeBike(b.id)}
                  className="text-[11px] font-semibold uppercase tracking-wider text-fg-dim transition-colors hover:text-accent"
                >
                  {dict.bikes.remove}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {bikes.length > 0 && (
        <a
          href="/shop"
          className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-6 py-3 text-xs font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi"
        >
          {dict.bikes.shopFits}
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      )}
    </div>
  );
}
