"use client";

import { useState } from "react";

const brands = ["All", "Beta", "Husqvarna", "KTM", "Aprilia", "Fantic", "Yamaha", "GasGas"];

export function BrandPillTabs() {
  const [active, setActive] = useState("All");
  return (
    <div className="mb-6 -mx-2 flex gap-2 overflow-x-auto px-2 pb-1">
      {brands.map((b) => (
        <button
          key={b}
          type="button"
          onClick={() => setActive(b)}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-colors ${
            active === b
              ? "border-accent bg-accent text-fg"
              : "border-border-strong bg-surface text-fg-muted hover:border-accent hover:text-fg"
          }`}
        >
          {b}
        </button>
      ))}
    </div>
  );
}
