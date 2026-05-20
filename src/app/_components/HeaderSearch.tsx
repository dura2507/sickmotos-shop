"use client";

import { useState } from "react";
import { CustomSelect } from "./CustomSelect";

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

export function HeaderSearch() {
  const [brand, setBrand] = useState("all");
  const [q, setQ] = useState("");

  return (
    <form
      role="search"
      action="/shop"
      method="get"
      className="hidden flex-1 items-center gap-2 md:flex"
    >
      <CustomSelect
        options={brandOptions}
        value={brand}
        onChange={setBrand}
        ariaLabel="Select bike brand"
        triggerClassName="w-44"
      />
      {brand !== "all" && (
        <input type="hidden" name="brand" value={brand} />
      )}
      <div className="flex flex-1 items-center gap-2 rounded-full border border-border-strong bg-surface px-4 transition-colors focus-within:border-accent">
        <svg viewBox="0 0 24 24" className="size-4 text-fg-muted" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search exhausts, LEDs, carbon, parts..."
          className="flex-1 bg-transparent py-2.5 text-sm text-fg placeholder:text-fg-dim focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Search"
          className="grid size-9 place-items-center rounded-full text-fg-muted transition-colors hover:bg-accent/15 hover:text-accent"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </form>
  );
}
