import "server-only";
import { adminGraphQL, hasAdminToken } from "./shopifyAdmin";

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

export type SalesMetrics = {
  grossSales: number;
  discounts: number;
  netSales: number;
  shipping: number;
  taxes: number;
  totalSales: number;
  orders: number;
  aov: number; // average order value = totalSales / orders
};

export type DailySales = { date: string; totalSales: number; orders: number };

export type SalesReport = SalesMetrics & { perDay: DailySales[] };

export type SalesComparison = {
  current: SalesReport;
  previous: SalesReport;
  rangeDays: number;
  fromDay: string;
  toDay: string;
  prevFromDay: string;
  prevToDay: string;
  configured: boolean;
  fetchError?: string;
};

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
  subtotalPriceSet: { shopMoney: { amount: string } };
  totalDiscountsSet: { shopMoney: { amount: string } };
  totalTaxSet: { shopMoney: { amount: string } };
  totalShippingPriceSet: { shopMoney: { amount: string } };
};

const QUERY = `query Sales($q:String!, $after:String){
  orders(first:100, after:$after, sortKey:CREATED_AT, query:$q){
    edges { node {
      createdAt cancelledAt test
      totalPriceSet { shopMoney { amount } }
      subtotalPriceSet { shopMoney { amount } }
      totalDiscountsSet { shopMoney { amount } }
      totalTaxSet { shopMoney { amount } }
      totalShippingPriceSet { shopMoney { amount } }
    } }
    pageInfo { hasNextPage endCursor }
  }
}`;

// Fetch every non-test, non-cancelled order whose Berlin-local day falls in
// [fromDay, toDay]. We pad the UTC query window by a day on each side so no
// order near a timezone boundary is missed, then bucket precisely by Berlin day.
async function fetchOrders(fromDay: string, toDay: string): Promise<OrderNode[]> {
  const q = `created_at:>=${addDays(fromDay, -1)} created_at:<=${addDays(toDay, 1)}`;
  const all: OrderNode[] = [];
  let after: string | null = null;
  for (let i = 0; i < 12; i++) {
    const data: {
      orders: {
        edges: { node: OrderNode }[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    } = await adminGraphQL(QUERY, { q, after }, 60);
    for (const e of data.orders.edges) {
      const node = e.node;
      if (node.test || node.cancelledAt) continue;
      const day = berlinDay(node.createdAt);
      if (day >= fromDay && day <= toDay) all.push(node);
    }
    if (!data.orders.pageInfo.hasNextPage) break;
    after = data.orders.pageInfo.endCursor;
    if (!after) break;
  }
  return all;
}

function emptyMetrics(): SalesMetrics {
  return {
    grossSales: 0,
    discounts: 0,
    netSales: 0,
    shipping: 0,
    taxes: 0,
    totalSales: 0,
    orders: 0,
    aov: 0,
  };
}

function metricsFrom(nodes: OrderNode[]): SalesMetrics {
  let net = 0,
    discounts = 0,
    tax = 0,
    shipping = 0;
  for (const r of nodes) {
    net += num(r.subtotalPriceSet.shopMoney.amount); // subtotal = Net sales (after discounts)
    discounts += num(r.totalDiscountsSet.shopMoney.amount);
    tax += num(r.totalTaxSet.shopMoney.amount);
    shipping += num(r.totalShippingPriceSet.shopMoney.amount);
  }
  const totalSales = net + shipping + tax; // = Shopify "Total sales" (verified)
  const orders = nodes.length;
  return {
    grossSales: net + discounts, // Shopify "Gross sales"
    discounts,
    netSales: net,
    shipping,
    taxes: tax,
    totalSales,
    orders,
    aov: orders > 0 ? totalSales / orders : 0,
  };
}

function report(nodes: OrderNode[], fromDay: string, toDay: string): SalesReport {
  const perDayMap = new Map<string, DailySales>();
  for (let d = fromDay; d <= toDay; d = addDays(d, 1)) {
    perDayMap.set(d, { date: d, totalSales: 0, orders: 0 });
  }
  for (const r of nodes) {
    const day = berlinDay(r.createdAt);
    const bucket = perDayMap.get(day);
    if (bucket) {
      const net = num(r.subtotalPriceSet.shopMoney.amount);
      const tax = num(r.totalTaxSet.shopMoney.amount);
      const ship = num(r.totalShippingPriceSet.shopMoney.amount);
      bucket.totalSales += net + ship + tax;
      bucket.orders += 1;
    }
  }
  return { ...metricsFrom(nodes), perDay: Array.from(perDayMap.values()) };
}

// Load the current `rangeDays`-day window (ending today, Berlin) plus the
// immediately preceding window of the same length for the comparison.
export async function loadSalesComparison(rangeDays: number): Promise<SalesComparison> {
  const toDay = berlinToday();
  const fromDay = addDays(toDay, -(rangeDays - 1));
  const prevToDay = addDays(fromDay, -1);
  const prevFromDay = addDays(prevToDay, -(rangeDays - 1));

  const base = {
    rangeDays,
    fromDay,
    toDay,
    prevFromDay,
    prevToDay,
  };

  const emptyReport = (): SalesReport => ({ ...emptyMetrics(), perDay: [] });

  if (!hasAdminToken()) {
    return {
      ...base,
      current: emptyReport(),
      previous: emptyReport(),
      configured: false,
    };
  }

  try {
    const [curNodes, prevNodes] = await Promise.all([
      fetchOrders(fromDay, toDay),
      fetchOrders(prevFromDay, prevToDay),
    ]);
    return {
      ...base,
      current: report(curNodes, fromDay, toDay),
      previous: report(prevNodes, prevFromDay, prevToDay),
      configured: true,
    };
  } catch (e) {
    return {
      ...base,
      current: emptyReport(),
      previous: emptyReport(),
      configured: true,
      fetchError: e instanceof Error ? e.message : String(e),
    };
  }
}

// Percentage change vs the comparison value. Returns null when there's no
// baseline to compare against (avoids a misleading "+100%").
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

// Inclusive list of YYYY-MM-DD day strings from fromDay to toDay. Used to read
// the per-day session counters for exactly the same window as the sales report.
export function enumerateDays(fromDay: string, toDay: string): string[] {
  const out: string[] = [];
  for (let d = fromDay; d <= toDay; d = addDays(d, 1)) out.push(d);
  return out;
}
