import Link from "next/link";
import {
  loadSalesComparison,
  pctChange,
  enumerateDays,
} from "@/lib/salesReport";
import { loadSessionsForDays } from "@/lib/analyticsStore";

export const dynamic = "force-dynamic";

const RANGES = [
  { days: 1, label: "Heute" },
  { days: 7, label: "7 Tage" },
  { days: 30, label: "30 Tage" },
];

function eur(n: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function int(n: number): string {
  return new Intl.NumberFormat("de-DE").format(n);
}

function Delta({ cur, prev }: { cur: number; prev: number }) {
  const pct = pctChange(cur, prev);
  if (pct === null) return <span className="text-fg-dim">—</span>;
  const up = pct >= 0;
  return (
    <span className={`font-semibold ${up ? "text-emerald-400" : "text-accent"}`}>
      {up ? "↗" : "↘"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function StatCard({
  label,
  value,
  cur,
  prev,
  sub,
}: {
  label: string;
  value: string;
  cur: number;
  prev: number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fg-dim">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl leading-none text-fg tabular-nums">
        {value}
      </p>
      <p className="mt-1.5 flex items-center gap-2 text-xs">
        <Delta cur={cur} prev={prev} />
        {sub && <span className="text-fg-muted">{sub}</span>}
      </p>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  cur,
  prev,
  strong,
}: {
  label: string;
  value: string;
  cur: number;
  prev: number;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-sm first:border-t-0 ${
        strong ? "font-bold text-fg" : "text-fg-muted"
      }`}
    >
      <span>{label}</span>
      <span className="flex items-center gap-3 tabular-nums">
        <span className="text-[11px]">
          <Delta cur={cur} prev={prev} />
        </span>
        <span className={strong ? "text-fg" : "text-fg"}>{value}</span>
      </span>
    </div>
  );
}

// Bars for the current period plus a dashed line for the previous period,
// aligned day-by-day and scaled to the same max (Shopify-style overlay).
function ComparisonChart({
  title,
  current,
  previous,
  format,
}: {
  title: string;
  current: { date: string; value: number }[];
  previous: number[];
  format: (n: number) => string;
}) {
  const max = Math.max(1, ...current.map((c) => c.value), ...previous);
  const n = current.length;
  const pts = previous
    .map((v, i) => `${i + 0.5},${100 - (v / max) * 100}`)
    .join(" ");

  return (
    <section className="rounded-xl border border-border bg-surface/40 p-4">
      <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-fg-dim">
        {title}
      </h2>
      <div className="relative flex h-36 items-end gap-1">
        {current.map((d, i) => {
          const h = max > 0 ? (d.value / max) * 100 : 0;
          return (
            <div
              key={d.date}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
              title={`${d.date}: ${format(d.value)}  (Vergleich: ${format(
                previous[i] ?? 0
              )})`}
            >
              <div
                className="w-full rounded-t-sm bg-accent/70 transition-colors hover:bg-accent"
                style={{ height: `${h}%`, minHeight: d.value > 0 ? "2px" : "0" }}
              />
              <span className="invisible absolute bottom-full z-10 mb-1 whitespace-nowrap rounded border border-border bg-bg px-1.5 py-0.5 text-[10px] font-bold text-fg group-hover:visible">
                {format(d.value)}
              </span>
            </div>
          );
        })}
        {n > 1 && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            viewBox={`0 0 ${n} 100`}
            preserveAspectRatio="none"
            aria-hidden
          >
            <polyline
              points={pts}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
              className="text-fg-dim"
            />
          </svg>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-fg-dim">
        <span>{current[0]?.date.slice(5)}</span>
        <span className="flex items-center gap-3 font-sans">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-accent/70" />
            aktuell
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-0 w-3 border-t-2 border-dashed border-fg-dim" />
            Vergleich
          </span>
        </span>
        <span>{current[current.length - 1]?.date.slice(5)}</span>
      </div>
    </section>
  );
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const rangeDays = RANGES.some((r) => String(r.days) === sp.range)
    ? Number(sp.range)
    : 7;

  const sales = await loadSalesComparison(rangeDays);
  const curDays = enumerateDays(sales.fromDay, sales.toDay);
  const prevDays = enumerateDays(sales.prevFromDay, sales.prevToDay);
  const sessions = await loadSessionsForDays(curDays, prevDays);

  const c = sales.current;
  const p = sales.previous;
  const rangeLabel = RANGES.find((r) => r.days === rangeDays)?.label ?? "";

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-display text-4xl uppercase tracking-tight text-fg md:text-5xl">
          Übersicht
        </h1>
        <p className="text-xs text-fg-muted">
          {sales.fromDay} bis {sales.toDay} · vs. Vorperiode ({sales.prevFromDay}{" "}
          bis {sales.prevToDay})
        </p>
      </div>

      {/* Range selector */}
      <div className="mb-6 inline-flex rounded-full border border-border bg-surface/40 p-1">
        {RANGES.map((r) => {
          const active = r.days === rangeDays;
          return (
            <Link
              key={r.days}
              href={`/admin/dashboard?range=${r.days}`}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                active
                  ? "bg-accent text-white"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              {r.label}
            </Link>
          );
        })}
      </div>

      {!sales.configured && (
        <div className="mb-6 rounded-xl border border-accent/50 bg-accent/[0.06] p-4">
          <p className="font-semibold text-accent">Shopify-Verbindung fehlt</p>
          <p className="mt-1 text-sm text-fg-muted">
            Die Umsatzzahlen erscheinen, sobald die Admin-API-Verbindung steht.
          </p>
        </div>
      )}
      {sales.fetchError && (
        <div className="mb-6 rounded-xl border border-accent/50 bg-accent/[0.06] p-4">
          <p className="font-semibold text-accent">Fehler beim Laden</p>
          <p className="mt-1 font-mono text-sm text-fg-muted">{sales.fetchError}</p>
        </div>
      )}

      {/* Top cards */}
      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={`Gesamtumsatz ${rangeLabel}`}
          value={eur(c.totalSales)}
          cur={c.totalSales}
          prev={p.totalSales}
        />
        <StatCard
          label="Bestellungen"
          value={int(c.orders)}
          cur={c.orders}
          prev={p.orders}
        />
        <StatCard
          label="Ø Warenkorb"
          value={eur(c.aov)}
          cur={c.aov}
          prev={p.aov}
        />
        <StatCard
          label="Sitzungen"
          value={sessions.persistent ? int(sessions.visitors) : "—"}
          cur={sessions.visitors}
          prev={sessions.prevVisitors}
          sub={
            sessions.persistent
              ? `${int(sessions.views)} Aufrufe`
              : "Zähler inaktiv"
          }
        />
      </section>

      {/* Charts */}
      <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ComparisonChart
          title={`Umsatz über Zeit · ${rangeLabel}`}
          current={c.perDay.map((d) => ({ date: d.date, value: d.totalSales }))}
          previous={p.perDay.map((d) => d.totalSales)}
          format={eur}
        />
        <ComparisonChart
          title={`Sitzungen über Zeit · ${rangeLabel}`}
          current={sessions.perDay.map((d) => ({
            date: d.date,
            value: d.visitors,
          }))}
          previous={sessions.prevPerDay.map((d) => d.visitors)}
          format={int}
        />
      </section>

      {/* Sales breakdown */}
      <section className="rounded-xl border border-border bg-surface/40">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-fg">
            Umsatz-Aufschlüsselung · {rangeLabel}
          </h2>
        </div>
        <BreakdownRow
          label="Bruttoumsatz"
          value={eur(c.grossSales)}
          cur={c.grossSales}
          prev={p.grossSales}
        />
        <BreakdownRow
          label="Rabatte"
          value={`-${eur(c.discounts)}`}
          cur={c.discounts}
          prev={p.discounts}
        />
        <BreakdownRow
          label="Nettoumsatz"
          value={eur(c.netSales)}
          cur={c.netSales}
          prev={p.netSales}
        />
        <BreakdownRow
          label="Versand"
          value={eur(c.shipping)}
          cur={c.shipping}
          prev={p.shipping}
        />
        <BreakdownRow
          label="Steuern"
          value={eur(c.taxes)}
          cur={c.taxes}
          prev={p.taxes}
        />
        <BreakdownRow
          label="Gesamtumsatz"
          value={eur(c.totalSales)}
          cur={c.totalSales}
          prev={p.totalSales}
          strong
        />
      </section>

      <p className="mt-4 text-[11px] text-fg-dim">
        Umsatz aus der Shopify-Order-API (1:1 zu Shopify Analytics, Berlin-Zeit).
        Sitzungen aus dem eigenen Besucher-Zähler (sieht den echten
        headless-Traffic, den Shopify nicht mehr zählt).
      </p>
    </div>
  );
}
