import Link from "next/link";
import { loadSalesDays, pctChange, type SalesDay } from "@/lib/salesReport";
import { FUNNEL_FIRST_DAY, loadDailyTraffic, type TrafficDay } from "@/lib/analyticsStore";
import {
  COUNTER_FIRST_DAY,
  CUTOVER_DAY,
  SHOPIFY_LAST_FULL_DAY,
  loadShopifyHistory,
  type ShopifyDay,
} from "@/lib/shopifyHistory";
import {
  COMPARE_LABELS,
  MIN_DAY,
  PRESETS,
  berlinToday,
  bucketize,
  comparisonRange,
  daysBetween,
  enumerateDays,
  fmtDay,
  hrefFor,
  parseRange,
  pickGranularity,
  sameDayLastYear,
  type CompareMode,
  type Granularity,
} from "@/lib/dashboardRange";
import { RangeForm } from "./RangeForm";

export const dynamic = "force-dynamic";
// Ein Jahresvergleich holt beim ersten Aufruf bis zu 24 Monate Bestellungen.
export const maxDuration = 60;

function eur(n: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
}

function eur0(n: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function int(n: number): string {
  return new Intl.NumberFormat("de-DE").format(Math.round(n));
}

// ---------------------------------------------------------------------------
// Tageswerte zusammenfuehren

type Src = "shopify" | "counter";
type Point = { v: number; src: Src } | null;

type DayData = {
  sales: SalesDay | null;
  visitors: Point;
  carts: Point;
  checkouts: Point;
};

function trafficPoints(
  day: string,
  counter: Map<string, TrafficDay>,
  history: Map<string, ShopifyDay> | undefined
): Pick<DayData, "visitors" | "carts" | "checkouts"> {
  if (day <= SHOPIFY_LAST_FULL_DAY) {
    const h = history?.get(day);
    if (!h) return { visitors: null, carts: null, checkouts: null };
    return {
      visitors: { v: h.visitors, src: "shopify" },
      carts: { v: h.cartSessions, src: "shopify" },
      checkouts: { v: h.checkoutSessions, src: "shopify" },
    };
  }
  if (day < COUNTER_FIRST_DAY) return { visitors: null, carts: null, checkouts: null };
  const t = counter.get(day);
  const pt = (v: number | null | undefined): Point => (v == null ? null : { v, src: "counter" });
  return {
    visitors: pt(t?.visitors),
    carts: day >= FUNNEL_FIRST_DAY ? pt(t?.carts) : null,
    checkouts: day >= FUNNEL_FIRST_DAY ? pt(t?.checkouts) : null,
  };
}

type Agg = { sum: number; covered: number; total: number; sources: Set<Src> };

function agg(points: Point[]): Agg {
  const a: Agg = { sum: 0, covered: 0, total: points.length, sources: new Set() };
  for (const p of points) {
    if (!p) continue;
    a.sum += p.v;
    a.covered += 1;
    a.sources.add(p.src);
  }
  return a;
}

function salesAgg(days: (SalesDay | null)[]) {
  let sales = 0,
    orders = 0,
    taxes = 0,
    covered = 0;
  for (const d of days) {
    if (!d) continue;
    sales += d.totalSales;
    orders += d.orders;
    taxes += d.taxes;
    covered += 1;
  }
  return { sales, orders, taxes, covered, total: days.length };
}

// ---------------------------------------------------------------------------
// Karten

type Comparable = "yes" | "partial" | "source" | "none";

function comparability(cur: Agg, cmp: Agg | null): Comparable {
  if (!cmp || cmp.covered === 0 || cur.covered === 0) return "none";
  if (cur.covered < cur.total || cmp.covered < cmp.total) return "partial";
  if (cur.sources.size > 1 || cmp.sources.size > 1) return "source";
  const a = [...cur.sources][0];
  const b = [...cmp.sources][0];
  return a && b && a !== b ? "source" : "yes";
}

function Delta({ cur, prev }: { cur: number; prev: number }) {
  const pct = pctChange(cur, prev);
  if (pct === null) return <span className="text-fg-dim">—</span>;
  if (Math.abs(pct) < 0.05) return <span className="font-semibold text-fg-muted">0,0%</span>;
  const up = pct >= 0;
  return (
    <span className={`font-semibold ${up ? "text-emerald-400" : "text-accent"}`}>
      {up ? "↗" : "↘"} {Math.abs(pct).toFixed(1).replace(".", ",")}%
    </span>
  );
}

function StatCard({
  label,
  value,
  cur,
  cmp,
  cmpValue,
  state,
  coverage,
  perDay,
  hasCompare,
}: {
  label: string;
  value: string;
  cur: number;
  cmp: number;
  cmpValue: string;
  state: Comparable;
  coverage?: string;
  // Bei Luecken ist die Summe kein fairer Vergleich (90 Tage gegen 62 Tage mit
  // Daten). Der Schnitt pro Tag mit Daten ist es.
  perDay?: string;
  hasCompare: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fg-dim">{label}</p>
      <p className="mt-1 font-display text-3xl leading-none text-fg tabular-nums">{value}</p>
      {hasCompare && (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          {state === "yes" ? (
            <Delta cur={cur} prev={cmp} />
          ) : state === "source" ? (
            <span className="text-fg-dim">andere Zählweise</span>
          ) : state === "partial" ? (
            <span className="text-fg-dim">unvollständig</span>
          ) : null}
          <span className="text-fg-muted">Vergleich: {cmpValue}</span>
        </p>
      )}
      {perDay && <p className="mt-1 text-xs text-fg-muted">{perDay}</p>}
      {coverage && <p className="mt-1 text-[11px] text-fg-dim">{coverage}</p>}
    </div>
  );
}

function perDayLine(cur: Agg, cmp: Agg | null): string | undefined {
  if (!cmp || cur.covered === 0 || cmp.covered === 0) return undefined;
  if (cur.covered === cur.total && cmp.covered === cmp.total) return undefined;
  const a = Math.round(cur.sum / cur.covered);
  const b = Math.round(cmp.sum / cmp.covered);
  return `Ø pro Tag ${int(a)} zu ${int(b)}`;
}

function compareCoverage(cmp: Agg | null): string {
  if (!cmp || cmp.covered === 0 || cmp.covered === cmp.total) return "";
  return ` (nur ${cmp.covered} von ${cmp.total} Tagen)`;
}

// Warenkorb und Kasse zaehlt seit dem Umzug nur noch unser eigener Zaehler, und
// der erst ab FUNNEL_FIRST_DAY. Ohne Hinweis sieht ein leerer Wert wie ein Fehler aus.
function funnelNote(a: Agg, days: string[]): string | undefined {
  if (a.covered === a.total) return undefined;
  const gap = days.some((d) => d > SHOPIFY_LAST_FULL_DAY && d < FUNNEL_FIRST_DAY);
  if (!gap) return coverageNote(a.covered, a.total);
  return a.covered === 0
    ? `Zählen wir erst ab ${fmtDay(FUNNEL_FIRST_DAY)}`
    : `Daten für ${a.covered} von ${a.total} Tagen, gezählt erst ab ${fmtDay(FUNNEL_FIRST_DAY)}`;
}

function coverageNote(covered: number, total: number): string | undefined {
  if (covered === total || covered === 0) return undefined;
  return `Daten für ${covered} von ${total} Tagen`;
}

// ---------------------------------------------------------------------------
// Diagramm

type ChartBucket = {
  label: string;
  value: number | null;
  partial: boolean;
  cutover: boolean;
  title: string;
};

function sumBucket(points: (number | null)[]): { value: number | null; partial: boolean } {
  const have = points.filter((p): p is number => p != null);
  if (have.length === 0) return { value: null, partial: false };
  return { value: have.reduce((s, n) => s + n, 0), partial: have.length < points.length };
}

function ComparisonChart({
  title,
  current,
  previous,
  note,
}: {
  title: string;
  current: ChartBucket[];
  previous: (number | null)[];
  note?: string;
}) {
  const max = Math.max(
    1,
    ...current.map((c) => c.value ?? 0),
    ...previous.map((p) => p ?? 0)
  );
  const n = current.length;
  // Gestrichelte Vergleichslinie, an fehlenden Werten unterbrochen.
  const segments: string[] = [];
  let seg: string[] = [];
  previous.slice(0, n).forEach((v, i) => {
    if (v == null) {
      if (seg.length) segments.push(seg.join(" "));
      seg = [];
      return;
    }
    seg.push(`${i + 0.5},${100 - (v / max) * 100}`);
  });
  if (seg.length) segments.push(seg.join(" "));
  const hasPrev = previous.some((p) => p != null);

  return (
    <section className="rounded-xl border border-border bg-surface/40 p-4">
      <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-fg-dim">{title}</h2>
      <div className="relative flex h-40 items-end gap-px sm:gap-0.5">
        {current.map((d, i) => {
          const h = d.value != null ? (d.value / max) * 100 : 0;
          return (
            <div
              key={`${d.label}-${i}`}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
              title={d.title}
            >
              {d.cutover && (
                <span className="absolute inset-y-0 left-1/2 w-px border-l border-dashed border-amber-400/70" />
              )}
              {d.value == null ? (
                <div className="w-full border-b border-dotted border-fg-dim/40" />
              ) : (
                <div
                  className={`w-full rounded-t-sm transition-colors ${
                    d.partial ? "bg-accent/35" : "bg-accent/70 hover:bg-accent"
                  }`}
                  style={{ height: `${h}%`, minHeight: d.value > 0 ? "2px" : "0" }}
                />
              )}
            </div>
          );
        })}
        {n > 1 && hasPrev && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            viewBox={`0 0 ${n} 100`}
            preserveAspectRatio="none"
            aria-hidden
          >
            {segments.map((pts, i) =>
              pts.includes(" ") ? (
                <polyline
                  key={i}
                  points={pts}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  vectorEffect="non-scaling-stroke"
                  className="text-fg-dim"
                />
              ) : null
            )}
          </svg>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 font-mono text-[10px] text-fg-dim">
        <span>{current[0]?.label}</span>
        <span className="flex flex-wrap items-center justify-center gap-3 font-sans">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-accent/70" />
            Zeitraum
          </span>
          {hasPrev && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-0 w-3 border-t-2 border-dashed border-fg-dim" />
              Vergleich
            </span>
          )}
        </span>
        <span>{current[current.length - 1]?.label}</span>
      </div>
      {note && <p className="mt-2 text-[11px] leading-relaxed text-fg-dim">{note}</p>}
    </section>
  );
}

// ---------------------------------------------------------------------------

const GRAN_LABEL: Record<Granularity, string> = { day: "pro Tag", week: "pro Woche", month: "pro Monat" };

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const today = berlinToday();
  const sel = parseRange(sp, today);
  const cmpRange = comparisonRange(sel);
  const curDays = enumerateDays(sel.from, sel.to);
  const cmpDays = cmpRange ? enumerateDays(cmpRange.from, cmpRange.to) : [];

  const [salesRes, traffic, history] = await Promise.all([
    loadSalesDays(cmpRange ? [curDays, cmpDays] : [curDays]),
    loadDailyTraffic([...curDays, ...cmpDays]),
    loadShopifyHistory(),
  ]);
  const salesCur = salesRes[0];
  const salesCmp = cmpRange ? salesRes[1] : null;
  const counter = new Map((traffic ?? []).map((t) => [t.date, t]));

  const build = (days: string[], sales: (SalesDay | null)[]): DayData[] =>
    days.map((d, i) => ({ sales: sales[i] ?? null, ...trafficPoints(d, counter, history) }));
  const cur = build(curDays, salesCur.days);
  const cmp = salesCmp ? build(cmpDays, salesCmp.days) : null;

  // Kennzahlen
  const sC = salesAgg(cur.map((d) => d.sales));
  const sP = cmp ? salesAgg(cmp.map((d) => d.sales)) : null;
  const salesAsAgg = (s: ReturnType<typeof salesAgg>): Agg => ({
    sum: s.sales,
    covered: s.covered,
    total: s.total,
    sources: new Set<Src>(["counter"]),
  });
  const salesState = comparability(salesAsAgg(sC), sP ? salesAsAgg(sP) : null);
  const vC = agg(cur.map((d) => d.visitors));
  const vP = cmp ? agg(cmp.map((d) => d.visitors)) : null;
  const cC = agg(cur.map((d) => d.carts));
  const cP = cmp ? agg(cmp.map((d) => d.carts)) : null;
  const kC = agg(cur.map((d) => d.checkouts));
  const kP = cmp ? agg(cmp.map((d) => d.checkouts)) : null;
  const aovC = sC.orders ? sC.sales / sC.orders : 0;
  const aovP = sP && sP.orders ? sP.sales / sP.orders : 0;

  const hasCompare = !!cmp;
  const dash = "—";
  const fmtAgg = (a: Agg | null, f: (n: number) => string) =>
    a && a.covered > 0 ? f(a.sum) : dash;

  // Diagramme und Tabelle
  const g = pickGranularity(curDays.length);
  const curBuckets = bucketize(curDays, g);
  // Vergleichseimer Tag fuer Tag gespiegelt: Tag 1 des Zeitraums gegen Tag 1
  // des Vergleichs, auch wenn die Wochen- oder Monatsgrenzen anders liegen.
  const offset = new Map(curDays.map((d, i) => [d, i]));
  // Beim Vorjahr Kalendertag gegen Kalendertag, sonst verrutschen die Monate
  // ueber ein Schaltjahr um einen Tag.
  const cmpDaySet = new Set(cmpDays);
  const mirror = (d: string): string | undefined =>
    sel.cmp === "year" ? (cmpDaySet.has(sameDayLastYear(d)) ? sameDayLastYear(d) : undefined) : cmpDays[offset.get(d)!];
  const cmpBuckets = cmpRange
    ? curBuckets
        .map((b) => ({
          label: b.label,
          days: Array.from(new Set(b.days.map(mirror).filter((d): d is string => !!d))),
        }))
        .filter((b) => b.days.length > 0)
    : [];
  const byDay = (rows: DayData[], days: string[]) => new Map(days.map((d, i) => [d, rows[i]]));
  const curMap = byDay(cur, curDays);
  const cmpMap = cmp ? byDay(cmp, cmpDays) : new Map<string, DayData>();

  const bucketValues = (
    buckets: { days: string[] }[],
    map: Map<string, DayData>,
    pick: (d: DayData) => number | null
  ) => buckets.map((b) => sumBucket(b.days.map((d) => (map.get(d) ? pick(map.get(d)!) : null))));

  const pickSales = (d: DayData) => d.sales?.totalSales ?? null;
  const pickOrders = (d: DayData) => d.sales?.orders ?? null;
  const pickVisitors = (d: DayData) => d.visitors?.v ?? null;

  const salesCurB = bucketValues(curBuckets, curMap, pickSales);
  const salesCmpB = bucketValues(cmpBuckets, cmpMap, pickSales);
  const ordersCurB = bucketValues(curBuckets, curMap, pickOrders);
  const ordersCmpB = bucketValues(cmpBuckets, cmpMap, pickOrders);
  const visCurB = bucketValues(curBuckets, curMap, pickVisitors);
  const visCmpB = bucketValues(cmpBuckets, cmpMap, pickVisitors);

  const span = (days: string[]) =>
    days.length === 1 ? fmtDay(days[0]) : `${fmtDay(days[0])} bis ${fmtDay(days[days.length - 1])}`;

  const chartBuckets = (
    vals: { value: number | null; partial: boolean }[],
    cmpVals: { value: number | null }[],
    format: (n: number) => string
  ): ChartBucket[] =>
    curBuckets.map((b, i) => {
      const v = vals[i];
      const c = cmpVals[i]?.value;
      const cmpSpan = cmpBuckets[i] ? ` · Vergleich ${span(cmpBuckets[i].days)}: ${c != null ? format(c) : dash}` : "";
      return {
        label: b.label,
        value: v.value,
        partial: v.partial,
        cutover:
          b.days.includes(CUTOVER_DAY) || (cmpBuckets[i]?.days.includes(CUTOVER_DAY) ?? false),
        title: `${span(b.days)}: ${v.value != null ? format(v.value) : "keine Daten"}${v.partial ? " (unvollständig)" : ""}${cmpSpan}`,
      };
    });

  const spansCutover = (days: string[]) => days[0] <= CUTOVER_DAY && days[days.length - 1] >= CUTOVER_DAY;
  const showCutoverNote = spansCutover(curDays) || (cmpDays.length > 0 && spansCutover(cmpDays));
  const touchesShopify = curDays[0] <= SHOPIFY_LAST_FULL_DAY || (cmpDays[0] ?? "9") <= SHOPIFY_LAST_FULL_DAY;
  const historyMissing = touchesShopify && history !== undefined && history.size === 0;
  // Shopify hat von Dezember 2024 bis Maerz 2025 ein Vielfaches der ueblichen
  // Besucher gezaehlt (Januar 2025: 149.334, sonst 12.000 bis 42.000 im Monat),
  // die Bestellungen stiegen nicht mit. Wer dagegen vergleicht, sieht sonst
  // "Besucher halbiert".
  const touchesSpike = (days: string[]) =>
    days.length > 0 && days[0] <= "2025-03-31" && days[days.length - 1] >= "2024-12-01";
  const showSpikeNote = touchesSpike(curDays) || touchesSpike(cmpDays);

  const presetLinks = PRESETS.map((p) => ({ ...p, href: hrefFor(sel, { preset: p.key }) }));
  const cmpModes: CompareMode[] = ["prev", "year", "none"];

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="font-display text-4xl uppercase tracking-tight text-fg md:text-5xl">Analytics</h1>
        <p className="text-xs text-fg-muted">
          {span(curDays)}
          {cmpRange && (
            <>
              {" · "}Vergleich ({COMPARE_LABELS[sel.cmp]}): {span(cmpDays)}
            </>
          )}
        </p>
        {sel.to === today && sel.from !== today && cmpRange && (
          <p className="w-full text-[11px] text-fg-dim">
            Heute läuft noch: der letzte Tag zählt nur bis jetzt, der Vergleich hat ganze Tage.
          </p>
        )}
        {sel.to === today && sel.from === today && cmpRange && (
          <p className="w-full text-[11px] text-fg-dim">
            Heute läuft noch und wird mit dem ganzen Vergleichstag verglichen.
          </p>
        )}
      </div>

      {/* Schnellauswahl */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {presetLinks.map((p) => {
          const active = sel.preset === p.key;
          return (
            <Link
              key={p.key}
              href={p.href}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                active
                  ? "border-accent bg-accent text-white"
                  : "border-border text-fg-muted hover:border-fg-dim hover:text-fg"
              }`}
            >
              {p.label}
            </Link>
          );
        })}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="mr-1 font-bold uppercase tracking-wider text-fg-dim">Vergleich:</span>
        {cmpModes.map((m) => {
          const active = sel.cmp === m;
          return (
            <Link
              key={m}
              href={hrefFor(sel, { cmp: m })}
              className={`rounded-full border px-3 py-1 font-bold uppercase tracking-wider transition-colors ${
                active
                  ? "border-fg-muted bg-surface text-fg"
                  : "border-border text-fg-muted hover:text-fg"
              }`}
            >
              {COMPARE_LABELS[m]}
            </Link>
          );
        })}
        {sel.cmp === "custom" && (
          <span className="rounded-full border border-fg-muted bg-surface px-3 py-1 font-bold uppercase tracking-wider text-fg">
            {COMPARE_LABELS.custom}
          </span>
        )}
      </div>

      <div className="mb-6">
        <RangeForm
          // Neu aufbauen, wenn sich die Auswahl ueber einen Link aendert, sonst
          // haengen Felder und Vergleich am alten Stand.
          key={`${sel.from}|${sel.to}|${sel.cmp}|${sel.cfrom}|${sel.cto}`}
          from={sel.from}
          to={sel.to}
          cmp={sel.cmp}
          cfrom={sel.cfrom ?? cmpRange?.from ?? sel.from}
          cto={sel.cto ?? cmpRange?.to ?? sel.to}
          min={MIN_DAY}
          max={today}
        />
      </div>

      {/* Hinweise */}
      <div className="mb-6 space-y-3">
        {!salesCur.configured && (
          <Notice title="Shopify-Verbindung fehlt">
            Umsatz und Bestellungen erscheinen, sobald die Admin-API-Verbindung steht.
          </Notice>
        )}
        {salesCur.fetchError && (
          <Notice title="Umsätze konnten nicht geladen werden">
            <span className="font-mono">{salesCur.fetchError}</span>
          </Notice>
        )}
        {salesCur.availableFrom && (sel.from < salesCur.availableFrom || (cmpRange && cmpRange.from < salesCur.availableFrom)) && (
          <Notice title="Ältere Umsätze nicht lesbar">
            Die Shopify-Verbindung darf nur die letzten 60 Tage Bestellungen lesen (ab{" "}
            {fmtDay(salesCur.availableFrom)}). Für ältere Zeiträume fehlt die Berechtigung
            „read_all_orders“, diese Tage zeigen „—“. In Shopify Analytics sind die Umsätze
            vollständig.
          </Notice>
        )}
        {traffic === undefined && (
          <Notice title="Besucherzähler nicht erreichbar">
            Die Datenbank antwortet gerade nicht. Umsätze sind davon nicht betroffen.
          </Notice>
        )}
        {showSpikeNote && (
          <Notice title="Besucherzahlen Dezember 2024 bis März 2025 mit Vorsicht lesen">
            Shopify hat in diesen Monaten ein Vielfaches der üblichen Besucher gezählt (Januar 2025:
            149.334, sonst 12.000 bis 42.000 im Monat), die Bestellungen sind damals nicht
            mitgestiegen. Ein Besuchervergleich mit diesen Monaten sagt deshalb wenig aus. Umsatz und
            Bestellungen sind davon nicht betroffen.
          </Notice>
        )}
        {historyMissing && (
          <Notice title="Shopify-Besucher vor dem Umzug fehlen noch">
            Der Verlauf aus Shopify ist noch nicht importiert.{" "}
            <Link href="/admin/dashboard/history" className="underline">
              Jetzt importieren
            </Link>
          </Notice>
        )}
      </div>

      {/* Kennzahlen */}
      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Gesamtumsatz"
          value={sC.covered ? eur(sC.sales) : dash}
          cur={sC.sales}
          cmp={sP?.sales ?? 0}
          cmpValue={sP && sP.covered ? eur(sP.sales) : dash}
          state={salesState}
          coverage={coverageNote(sC.covered, sC.total)}
          hasCompare={hasCompare}
        />
        <StatCard
          label="Bestellungen"
          value={sC.covered ? int(sC.orders) : dash}
          cur={sC.orders}
          cmp={sP?.orders ?? 0}
          cmpValue={sP && sP.covered ? int(sP.orders) : dash}
          state={salesState}
          hasCompare={hasCompare}
        />
        <StatCard
          label="Ø Warenkorb"
          value={sC.orders ? eur(aovC) : dash}
          cur={aovC}
          cmp={aovP}
          cmpValue={sP && sP.orders ? eur(aovP) : dash}
          state={sC.orders && sP?.orders ? salesState : "none"}
          hasCompare={hasCompare}
        />
        <StatCard
          label="Besucher"
          value={fmtAgg(vC, int)}
          cur={vC.sum}
          cmp={vP?.sum ?? 0}
          cmpValue={`${fmtAgg(vP, int)}${compareCoverage(vP)}`}
          state={comparability(vC, vP)}
          perDay={perDayLine(vC, vP)}
          coverage={coverageNote(vC.covered, vC.total)}
          hasCompare={hasCompare}
        />
        <StatCard
          label="In den Warenkorb"
          value={fmtAgg(cC, int)}
          cur={cC.sum}
          cmp={cP?.sum ?? 0}
          cmpValue={`${fmtAgg(cP, int)}${compareCoverage(cP)}`}
          state={comparability(cC, cP)}
          perDay={perDayLine(cC, cP)}
          coverage={funnelNote(cC, curDays)}
          hasCompare={hasCompare}
        />
        <StatCard
          label="Kasse erreicht"
          value={fmtAgg(kC, int)}
          cur={kC.sum}
          cmp={kP?.sum ?? 0}
          cmpValue={`${fmtAgg(kP, int)}${compareCoverage(kP)}`}
          state={comparability(kC, kP)}
          perDay={perDayLine(kC, kP)}
          coverage={funnelNote(kC, curDays)}
          hasCompare={hasCompare}
        />
      </section>

      {/* Diagramme */}
      <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ComparisonChart
          title={`Umsatz ${GRAN_LABEL[g]}`}
          current={chartBuckets(salesCurB, salesCmpB, eur0)}
          previous={salesCmpB.map((b) => b.value)}
        />
        <ComparisonChart
          title={`Besucher ${GRAN_LABEL[g]}`}
          current={chartBuckets(visCurB, visCmpB, int)}
          previous={visCmpB.map((b) => b.value)}
          note={
            showCutoverNote
              ? "Gelbe Linie: Umzug der Storefront am 09.07.2026 (im Zeitraum oder im Vergleich). Davor zählte Shopify die Besucher, danach unser eigener Zähler. Vom 09.07. bis 05.08.2026 gibt es keine Besucherdaten."
              : undefined
          }
        />
      </section>

      {/* Tabelle */}
      <section className="mb-6 overflow-hidden rounded-xl border border-border bg-surface/40">
        <h2 className="border-b border-border px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-fg-dim">
          Zahlen {GRAN_LABEL[g]}
          {hasCompare && " · darunter der Vergleich"}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="text-[10px] uppercase tracking-wider text-fg-dim">
              <tr>
                <th className="px-3 py-2 font-bold">Zeitraum</th>
                <th className="px-3 py-2 text-right font-bold">Umsatz</th>
                <th className="px-3 py-2 text-right font-bold">Best.</th>
                <th className="px-3 py-2 text-right font-bold">Besucher</th>
              </tr>
            </thead>
            <tbody>
              {curBuckets.map((b, i) => {
                const cb = cmpBuckets[i];
                const cell = (cv: { value: number | null; partial: boolean }, pv: { value: number | null; partial?: boolean } | undefined, f: (n: number) => string) => (
                  <td className="px-3 py-2 text-right align-top">
                    <span className={cv.partial ? "text-fg-muted" : "text-fg"}>
                      {cv.value != null ? f(cv.value) : dash}
                      {cv.partial ? "*" : ""}
                    </span>
                    {cb && (
                      <span className="block text-[10px] text-fg-dim">
                        {pv?.value != null ? f(pv.value) : dash}
                        {pv?.value != null && pv.partial ? "*" : ""}
                      </span>
                    )}
                  </td>
                );
                return (
                  <tr key={`${b.label}-${i}`} className="border-t border-border/60">
                    <td className="px-3 py-2 align-top">
                      <span className="text-fg">{g === "day" ? b.label : span(b.days)}</span>
                      {cb && (
                        <span className="block text-[10px] text-fg-dim">
                          {g === "day" ? fmtDay(cb.days[0]) : span(cb.days)}
                        </span>
                      )}
                    </td>
                    {cell(salesCurB[i], salesCmpB[i], eur0)}
                    {cell(ordersCurB[i], ordersCmpB[i], int)}
                    {cell(visCurB[i], visCmpB[i], int)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-4 py-2 text-[10px] text-fg-dim">
          * nur ein Teil der Tage hat Daten. „—“ = für diesen Zeitraum gibt es keine Daten.
        </p>
      </section>

      <div className="space-y-2 text-[11px] leading-relaxed text-fg-dim">
        <p>
          <strong className="text-fg-muted">Umsatz und Bestellungen</strong> kommen direkt aus den
          Shopify-Bestellungen (ohne Test, Erstattungen abgezogen, Berliner Zeit) und decken sich
          Monat für Monat mit Shopify Analytics. Einziger Unterschied: stornierte Bestellungen
          zählt Shopify mit, wir nicht, ein Monat kann deshalb ein, zwei Bestellungen weniger
          zeigen. Vor und nach dem Umzug gleich gemessen und damit voll vergleichbar. Steuern im
          Zeitraum: {eur(sC.taxes)}.
        </p>
        <p>
          <strong className="text-fg-muted">Besucher</strong> bis 08.07.2026 aus Shopify (Besucher
          pro Tag, nur Menschen), ab 10.07.2026 aus unserem eigenen Zähler (Besucher pro Tag, Bots
          herausgefiltert). Seit dem Umzug sieht Shopify nur noch die Kasse, deshalb zeigt Shopify
          selbst seitdem kaum Besucher. Beide Zählweisen messen dasselbe, aber nicht identisch.
          Darum steht beim Vergleich über den Umzug hinweg kein Prozentwert, sondern beide Zahlen.
          Vom 09.07. bis 05.08.2026 fehlen Besucherdaten (der eigene Zähler hat sie damals
          nach 90 Tagen gelöscht, seit 03.11.2026 bleiben sie dauerhaft). Bei Lücken zeigen die
          Karten zusätzlich den Schnitt pro Tag, der ist dann der faire Vergleich.
        </p>
        <p>
          <strong className="text-fg-muted">In den Warenkorb / Kasse erreicht</strong>: Besucher
          pro Tag, die etwas in den Korb gelegt bzw. auf „Zur Kasse“ geklickt haben. Bis 08.07.2026
          aus Shopify, ab {fmtDay(FUNNEL_FIRST_DAY)} aus unserem Zähler, dazwischen gibt es keine
          Daten.
        </p>
        <p>
          <Link href="/admin/dashboard/history" className="underline hover:text-fg-muted">
            Shopify-Verlauf vor dem Umzug verwalten
          </Link>
          {" · "}
          {daysBetween(sel.from, sel.to)} Tage gewählt
        </p>
      </div>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-accent/50 bg-accent/[0.06] p-4">
      <p className="font-semibold text-accent">{title}</p>
      <p className="mt-1 text-sm text-fg-muted">{children}</p>
    </div>
  );
}
