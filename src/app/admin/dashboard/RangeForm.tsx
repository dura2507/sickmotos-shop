"use client";

import { useState } from "react";
import type { CompareMode } from "@/lib/dashboardRange";

// Freier Zeitraum per GET-Formular. Die Felder fuer den eigenen
// Vergleichszeitraum erscheinen nur, wenn der Vergleich darauf steht.
export function RangeForm({
  from,
  to,
  cmp,
  cfrom,
  cto,
  min,
  max,
}: {
  from: string;
  to: string;
  cmp: CompareMode;
  cfrom: string;
  cto: string;
  min: string;
  max: string;
}) {
  const [mode, setMode] = useState<CompareMode>(cmp);
  const field =
    "h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg [color-scheme:dark]";
  const label = "mb-1 block text-[10px] font-bold uppercase tracking-[0.15em] text-fg-dim";

  return (
    <form
      method="get"
      action="/admin/dashboard"
      className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface/40 p-4 md:grid-cols-[1fr_1fr_1.3fr_1fr_1fr_auto] md:items-end"
    >
      <label className="block">
        <span className={label}>Von</span>
        <input type="date" name="from" defaultValue={from} min={min} max={max} required className={field} />
      </label>
      <label className="block">
        <span className={label}>Bis</span>
        <input type="date" name="to" defaultValue={to} min={min} max={max} required className={field} />
      </label>
      <label className="col-span-2 block md:col-span-1">
        <span className={label}>Vergleichen mit</span>
        <select
          name="cmp"
          value={mode}
          onChange={(e) => setMode(e.target.value as CompareMode)}
          className={field}
        >
          <option value="prev">Vorperiode (gleich lang davor)</option>
          <option value="year">Vorjahr (gleiche Tage)</option>
          <option value="custom">Eigener Zeitraum</option>
          <option value="none">Kein Vergleich</option>
        </select>
      </label>
      {mode === "custom" ? (
        <>
          <label className="block">
            <span className={label}>Vergleich von</span>
            <input type="date" name="cfrom" defaultValue={cfrom} min={min} max={max} required className={field} />
          </label>
          <label className="block">
            <span className={label}>Vergleich bis</span>
            <input type="date" name="cto" defaultValue={cto} min={min} max={max} required className={field} />
          </label>
        </>
      ) : (
        <div className="hidden md:col-span-2 md:block" />
      )}
      <button
        type="submit"
        className="col-span-2 h-10 rounded-full bg-accent px-6 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-accent-hi md:col-span-1"
      >
        Anzeigen
      </button>
    </form>
  );
}
