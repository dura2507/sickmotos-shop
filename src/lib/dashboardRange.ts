// Zeitraum-Logik fuer /admin/dashboard: freier Von-Bis-Zeitraum, Vergleich mit
// Vorperiode, Vorjahr oder einem eigenen Zeitraum, und die Einteilung in Tage,
// Wochen oder Monate fuer Diagramme und Tabelle. Reine Datumsrechnung auf
// YYYY-MM-DD-Strings in Berliner Zeit, nichts davon braucht den Server.

export type CompareMode = "prev" | "year" | "custom" | "none";

export type RangeSelection = {
  from: string;
  to: string;
  cmp: CompareMode;
  cfrom: string | null;
  cto: string | null;
  preset: string | null;
};

export type DayRange = { from: string; to: string };

// Frueher als das gibt es weder Shopify-Besucherdaten noch sinnvolle Vergleiche.
export const MIN_DAY = "2023-01-01";
// Ein Zeitraum bis gut drei Jahre, damit "drei Jahre gegen drei Jahre" noch in
// die 60 Sekunden passt, die der Seite zustehen.
const MAX_DAYS = 1100;

export function berlinToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
}

export function addDays(day: string, days: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function addYears(day: string, years: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return (
    Math.round(
      (Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000
    ) + 1
  );
}

export function enumerateDays(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

function isDay(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

function clampRange(from: string, to: string, today: string): DayRange {
  let f = from < MIN_DAY ? MIN_DAY : from;
  let t = to > today ? today : to;
  if (f > t) [f, t] = [t, f];
  if (daysBetween(f, t) > MAX_DAYS) f = addDays(t, -(MAX_DAYS - 1));
  return { from: f, to: t };
}

export type Preset = { key: string; label: string; range: (today: string) => DayRange };

export const PRESETS: Preset[] = [
  { key: "today", label: "Heute", range: (t) => ({ from: t, to: t }) },
  { key: "yesterday", label: "Gestern", range: (t) => ({ from: addDays(t, -1), to: addDays(t, -1) }) },
  { key: "7d", label: "7 Tage", range: (t) => ({ from: addDays(t, -6), to: t }) },
  { key: "30d", label: "30 Tage", range: (t) => ({ from: addDays(t, -29), to: t }) },
  { key: "90d", label: "90 Tage", range: (t) => ({ from: addDays(t, -89), to: t }) },
  { key: "month", label: "Dieser Monat", range: (t) => ({ from: `${t.slice(0, 7)}-01`, to: t }) },
  {
    key: "lastmonth",
    label: "Letzter Monat",
    range: (t) => {
      const last = addDays(`${t.slice(0, 7)}-01`, -1);
      return { from: `${last.slice(0, 7)}-01`, to: last };
    },
  },
  { key: "year", label: "Dieses Jahr", range: (t) => ({ from: `${t.slice(0, 4)}-01-01`, to: t }) },
  { key: "12m", label: "12 Monate", range: (t) => ({ from: addDays(addYears(t, -1), 1), to: t }) },
  // Alles seit dem Umzug der Storefront, am sinnvollsten mit "Vorjahr".
  { key: "since", label: "Seit Umzug", range: (t) => ({ from: "2026-07-10", to: t }) },
];

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parseRange(sp: SearchParams, today: string): RangeSelection {
  const cmpRaw = first(sp.cmp);
  const cmp: CompareMode =
    cmpRaw === "year" || cmpRaw === "custom" || cmpRaw === "none" ? cmpRaw : "prev";

  let range: DayRange | null = null;
  let preset: string | null = null;
  const presetKey = first(sp.p);
  const legacy = first(sp.range); // alte Links: ?range=1|7|30
  const from = first(sp.from);
  const to = first(sp.to);
  if (isDay(from) && isDay(to)) {
    range = clampRange(from, to, today);
  } else if (presetKey && PRESETS.some((p) => p.key === presetKey)) {
    preset = presetKey;
    range = PRESETS.find((p) => p.key === presetKey)!.range(today);
  } else if (legacy === "1" || legacy === "7" || legacy === "30") {
    preset = legacy === "1" ? "today" : `${legacy}d`;
    range = PRESETS.find((p) => p.key === preset)!.range(today);
  }
  if (!range) {
    preset = "30d";
    range = PRESETS.find((p) => p.key === "30d")!.range(today);
  }

  const cfrom = first(sp.cfrom);
  const cto = first(sp.cto);
  const custom =
    cmp === "custom" && isDay(cfrom) && isDay(cto) ? clampRange(cfrom, cto, today) : null;

  return {
    from: range.from,
    to: range.to,
    cmp: cmp === "custom" && !custom ? "prev" : cmp,
    cfrom: custom?.from ?? null,
    cto: custom?.to ?? null,
    preset,
  };
}

export function comparisonRange(sel: RangeSelection): DayRange | null {
  const len = daysBetween(sel.from, sel.to);
  switch (sel.cmp) {
    case "none":
      return null;
    case "year":
      return { from: addYears(sel.from, -1), to: addYears(sel.to, -1) };
    case "custom":
      return sel.cfrom && sel.cto ? { from: sel.cfrom, to: sel.cto } : null;
    default: {
      const to = addDays(sel.from, -1);
      return { from: addDays(to, -(len - 1)), to };
    }
  }
}

export const COMPARE_LABELS: Record<CompareMode, string> = {
  prev: "Vorperiode",
  year: "Vorjahr",
  custom: "Eigener Zeitraum",
  none: "Kein Vergleich",
};

// Link-Ziel, das den Zeitraum oder den Vergleich austauscht und den Rest behaelt.
export function hrefFor(sel: RangeSelection, patch: Partial<RangeSelection>): string {
  const next = { ...sel, ...patch };
  const q = new URLSearchParams();
  if (next.preset && !("from" in patch)) q.set("p", next.preset);
  else {
    q.set("from", next.from);
    q.set("to", next.to);
  }
  if (next.cmp !== "prev") q.set("cmp", next.cmp);
  if (next.cmp === "custom" && next.cfrom && next.cto) {
    q.set("cfrom", next.cfrom);
    q.set("cto", next.cto);
  }
  return `/admin/dashboard?${q.toString()}`;
}

export type Granularity = "day" | "week" | "month";

export function pickGranularity(days: number): Granularity {
  if (days <= 62) return "day";
  if (days <= 200) return "week";
  return "month";
}

export type Bucket = { label: string; days: string[] };

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export function fmtDay(d: string): string {
  return `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;
}

function shortDay(d: string): string {
  return `${d.slice(8, 10)}.${d.slice(5, 7)}.`;
}

function monthLabel(d: string): string {
  return `${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(2, 4)}`;
}

// Wochen beginnen am Montag. Der erste und letzte Eimer kann kuerzer sein, das
// zeigt die Tabelle ueber die Spanne an.
export function bucketize(days: string[], g: Granularity): Bucket[] {
  if (g === "day") return days.map((d) => ({ label: shortDay(d), days: [d] }));
  const out: Bucket[] = [];
  for (const d of days) {
    const key =
      g === "month"
        ? d.slice(0, 7)
        : addDays(d, -((new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7));
    const last = out[out.length - 1];
    if (last && (last as Bucket & { key?: string }).key === key) {
      last.days.push(d);
    } else {
      const b: Bucket & { key: string } = {
        key,
        label: g === "month" ? monthLabel(d) : `ab ${shortDay(d)}`,
        days: [d],
      };
      out.push(b);
    }
  }
  return out.map(({ label, days: ds }) => ({ label, days: ds }));
}
