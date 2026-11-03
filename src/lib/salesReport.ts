import "server-only";
import { adminGraphQL, hasAdminToken } from "./shopifyAdmin";
import { redis, safe } from "./redisSafe";

// Recomputes Shopify's Analytics sales-report metrics from the Orders Admin API.
// ShopifyQL is not reachable with our token (no read_reports / Level-2), so we
// reproduce the numbers ourselves. Verified 1:1 against the Shopify Analytics
// dashboard for Jul 9-15, 2026: Total sales EUR 8.700,31 / 54 orders, and
// Gross/Net/Discounts/Taxes/Shipping all matched to the cent.
//
// Two things make it match exactly:
// 1. Shopify buckets orders by the SHOP timezone (Europe/Berlin), not UTC.
// 2. The report set = all orders in the window that are NOT test and NOT
//    cancelled (no financial-status filter).

const num = (s: string | undefined | null): number => {
  const x = Number.parseFloat(s ?? "0");
  return Number.isFinite(x) ? x : 0;
};

// YYYY-MM-DD in the shop's timezone (Europe/Berlin), DST-safe.
function berlinDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
}

// Today in Berlin as YYYY-MM-DD.
function berlinToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
}

// Add `days` (can be negative) to a YYYY-MM-DD string, staying in date-only space.
function addDays(day: string, days: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

type OrderNode = {
  createdAt: string;
  cancelledAt: string | null;
  test: boolean;
  totalPriceSet: { shopMoney: { amount: string } };
  totalTaxSet: { shopMoney: { amount: string } };
  totalRefundedSet: { shopMoney: { amount: string } };
};

const QUERY = `query Sales($q:String!, $after:String){
  orders(first:100, after:$after, sortKey:CREATED_AT, query:$q){
    edges { node {
      createdAt cancelledAt test
      totalPriceSet { shopMoney { amount } }
      totalTaxSet { shopMoney { amount } }
      totalRefundedSet { shopMoney { amount } }
    } }
    pageInfo { hasNextPage endCursor }
  }
}`;

// Shopify drosselt nach Abfragekosten. Bei langen Zeitraeumen laufen mehrere
// Monate parallel, dann kommt gelegentlich "Throttled" zurueck: kurz warten und
// dieselbe Seite neu holen, statt den ganzen Bericht scheitern zu lassen.
async function withThrottleRetry<T>(op: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await op();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (attempt >= 5 || !/throttl/i.test(msg)) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

// Fetch every non-test, non-cancelled order whose Berlin-local day falls in
// [fromDay, toDay]. We pad the UTC query window by a day on each side so no
// order near a timezone boundary is missed, then bucket precisely by Berlin day.
async function fetchOrders(fromDay: string, toDay: string): Promise<OrderNode[]> {
  const q = `created_at:>=${addDays(fromDay, -1)} created_at:<=${addDays(toDay, 1)}`;
  const all: OrderNode[] = [];
  let after: string | null = null;
  // Page until Shopify says there is no next page. The bound is only an
  // infinite-loop backstop set far above any realistic window (200 x 100 =
  // 20.000 orders), so we never silently truncate and under-report a window.
  const MAX_PAGES = 200;
  let i = 0;
  for (; i < MAX_PAGES; i++) {
    const data: {
      orders: {
        edges: { node: OrderNode }[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    } = await withThrottleRetry(() => adminGraphQL(QUERY, { q, after }, 60));
    for (const e of data.orders.edges) {
      const node = e.node;
      if (node.test || node.cancelledAt) continue;
      const day = berlinDay(node.createdAt);
      if (day >= fromDay && day <= toDay) all.push(node);
    }
    if (!data.orders.pageInfo.hasNextPage) break;
    after = data.orders.pageInfo.endCursor;
    if (!after) break;
    if (i === MAX_PAGES - 1) {
      // Should never happen at this shop's scale; if it does, the total would
      // be under-reported, so make the truncation loud instead of silent.
      console.error(
        `[salesReport] order window ${fromDay}..${toDay} exceeded ${MAX_PAGES} pages, total may be undercounted`,
      );
    }
  }
  return all;
}

export type SalesDay = {
  date: string;
  totalSales: number;
  orders: number;
  taxes: number;
};

export type SalesDays = {
  configured: boolean;
  // Tage vor diesem Datum kann der Token nicht lesen (ohne read_all_orders
  // liefert Shopify nur die letzten 60 Tage, und zwar stillschweigend).
  availableFrom: string | null;
  days: (SalesDay | null)[]; // null = fuer diesen Tag nicht lesbar
  fetchError?: string;
};

function aggregate(nodes: OrderNode[], fromDay: string, toDay: string): SalesDay[] {
  const map = new Map<string, SalesDay>();
  for (let d = fromDay; d <= toDay; d = addDays(d, 1)) {
    map.set(d, { date: d, totalSales: 0, orders: 0, taxes: 0 });
  }
  for (const r of nodes) {
    const bucket = map.get(berlinDay(r.createdAt));
    if (!bucket) continue;
    bucket.totalSales +=
      num(r.totalPriceSet.shopMoney.amount) - num(r.totalRefundedSet.shopMoney.amount);
    bucket.taxes += num(r.totalTaxSet.shopMoney.amount);
    bucket.orders += 1;
  }
  return Array.from(map.values());
}

// Abgeschlossene Monate werden 6 Stunden in Redis gehalten, Erstattungen
// tauchen damit spaetestens nach 6 Stunden auf. Der laufende Monat 60 Sekunden
// pro Instanz. So kostet ein Jahresvergleich nur beim ersten Aufruf Zeit.
const MONTH_CACHE_SEC = 6 * 60 * 60;
const MONTH_KEY = (m: string) => `sm:sales:month:v3:${m}`;
const liveMonth = new Map<string, { at: number; data: SalesDay[] }>();

function monthBounds(month: string): [string, string] {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [`${month}-01`, `${month}-${String(last).padStart(2, "0")}`];
}

async function loadMonth(
  month: string,
  today: string,
  availableFrom: string | null
): Promise<SalesDay[]> {
  const [first, last] = monthBounds(month);
  if (first > today) return [];
  // Ein Monat, der ueber die 60-Tage-Grenze reicht, kommt von Shopify nur halb.
  // So einen nie speichern, sonst bleibt die Luecke nach einer neuen
  // Berechtigung stundenlang haengen (passiert am 03.11. mit dem 1. bis 4.9.).
  const closed = last < today && (!availableFrom || first >= availableFrom);
  if (closed) {
    const hit = await safe<SalesDay[] | null>(
      "sales.monthCache.get",
      async () => (redis ? await redis.get<SalesDay[]>(MONTH_KEY(month)) : null),
      null
    );
    if (Array.isArray(hit)) return hit;
  } else {
    const live = liveMonth.get(month);
    if (live && Date.now() - live.at < 60_000) return live.data;
  }
  const to = last < today ? last : today;
  const data = aggregate(await fetchOrders(first, to), first, to);
  if (closed) {
    await safe(
      "sales.monthCache.set",
      async () => redis?.set(MONTH_KEY(month), data, { ex: MONTH_CACHE_SEC }),
      undefined
    );
  } else {
    liveMonth.set(month, { at: Date.now(), data });
  }
  return data;
}

let scopeCache: { at: number; allOrders: boolean } | null = null;

// Ohne read_all_orders liefert Shopify stillschweigend nur 60 Tage. Apps, die
// der Shop-Inhaber selbst im Dev Dashboard angelegt hat, sehen laut Shopify
// aber schon mit read_orders die ganze Historie, obwohl der Scope nicht in der
// Liste steht. Deshalb nicht nur die Liste lesen, sondern nachsehen: gibt es
// eine Bestellung, die aelter als 70 Tage ist?
async function canReadAllOrders(): Promise<boolean> {
  // 10 Minuten, damit eine neu erteilte Berechtigung ohne Redeploy ankommt.
  if (scopeCache && Date.now() - scopeCache.at < 10 * 60_000) return scopeCache.allOrders;
  const cutoff = addDays(berlinToday(), -70);
  const data = await adminGraphQL<{
    currentAppInstallation: { accessScopes: { handle: string }[] };
    orders: { edges: { node: { id: string } }[] };
  }>(
    `query Probe($q: String!) {
      currentAppInstallation { accessScopes { handle } }
      orders(first: 1, query: $q) { edges { node { id } } }
    }`,
    { q: `created_at:<${cutoff}` },
    0
  );
  const allOrders =
    data.currentAppInstallation.accessScopes.some((s) => s.handle === "read_all_orders") ||
    data.orders.edges.length > 0;
  scopeCache = { at: Date.now(), allOrders };
  return allOrders;
}

// Umsatz und Bestellungen pro Tag fuer jede Menge an Tagen (auch mehrere
// getrennte Zeitraeume). Monate werden einzeln geholt und gecacht, hoechstens
// drei gleichzeitig, damit Shopify nicht drosselt.
export async function loadSalesDays(dayLists: string[][]): Promise<SalesDays[]> {
  const blank = (configured: boolean, fetchError?: string): SalesDays[] =>
    dayLists.map((days) => ({
      configured,
      availableFrom: null,
      days: days.map(() => null),
      fetchError,
    }));
  if (!(await hasAdminToken())) return blank(false);

  const today = berlinToday();
  try {
    const allOrders = await canReadAllOrders();
    const availableFrom = allOrders ? null : addDays(today, -59);
    const months = new Set<string>();
    for (const days of dayLists) {
      for (const d of days) {
        if (d <= today && (!availableFrom || d >= availableFrom)) months.add(d.slice(0, 7));
      }
    }
    const list = Array.from(months).sort();
    const byDay = new Map<string, SalesDay>();
    for (let i = 0; i < list.length; i += 3) {
      const chunk = await Promise.all(list.slice(i, i + 3).map((m) => loadMonth(m, today, availableFrom)));
      for (const month of chunk) for (const d of month) byDay.set(d.date, d);
    }
    return dayLists.map((days) => ({
      configured: true,
      availableFrom,
      days: days.map((d) => {
        if (d > today) return null;
        if (availableFrom && d < availableFrom) return null;
        return byDay.get(d) ?? { date: d, totalSales: 0, orders: 0, taxes: 0 };
      }),
    }));
  } catch (e) {
    return blank(true, e instanceof Error ? e.message : String(e));
  }
}

// Percentage change vs the comparison value. Returns null when there's no
// baseline to compare against (avoids a misleading "+100%").
export function pctChange(current: number, previous: number): number | null {
  // No baseline to compare against (previous period empty or before tracking
  // started) → return null so the UI shows "—" instead of a misleading number.
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

// Inclusive list of YYYY-MM-DD day strings from fromDay to toDay. Used to read
// the per-day session counters for exactly the same window as the sales report.
export function enumerateDays(fromDay: string, toDay: string): string[] {
  const out: string[] = [];
  for (let d = fromDay; d <= toDay; d = addDays(d, 1)) out.push(d);
  return out;
}
