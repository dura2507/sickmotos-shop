import "server-only";
import { adminGraphQL, hasAdminToken } from "./shopifyAdmin";

// Order snapshots for the admin dashboard. Every query is server-side, cached
// briefly through Next's fetch cache so a fast refresh doesn't burn Admin
// API quota (the storefront-visitor traffic is already free).

export type OrderSummary = {
  id: string;
  name: string; // e.g. "#1024"
  createdAt: string; // ISO
  displayFinancialStatus: string | null;
  displayFulfillmentStatus: string | null;
  totalPrice: { amount: string; currencyCode: string };
  customer: { firstName: string | null; lastName: string | null; email: string | null } | null;
  lineItemsCount: number;
};

export type DailyRevenue = { date: string; revenue: number; orders: number };

export type OrdersSnapshot = {
  todayRevenueEUR: number;
  todayOrderCount: number;
  yesterdayRevenueEUR: number;
  yesterdayOrderCount: number;
  revenue7dEUR: number;
  orders7dCount: number;
  revenue30dEUR: number;
  orders30dCount: number;
  perDay: DailyRevenue[];
  recent: OrderSummary[];
  fetchError?: string;
};

const EMPTY_SNAPSHOT: OrdersSnapshot = {
  todayRevenueEUR: 0,
  todayOrderCount: 0,
  yesterdayRevenueEUR: 0,
  yesterdayOrderCount: 0,
  revenue7dEUR: 0,
  orders7dCount: 0,
  revenue30dEUR: 0,
  orders30dCount: 0,
  perDay: [],
  recent: [],
};

function dateKey(offsetDaysFromToday: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDaysFromToday);
  return d.toISOString().slice(0, 10);
}

// Convert whatever currency the order settled in to EUR. Shopify orders on a
// EUR shop return EUR; this helper leaves other currencies as-is (rare here)
// and just parses the amount as a number.
function amountAsNumber(amount: string): number {
  const n = Number.parseFloat(amount);
  return Number.isFinite(n) ? n : 0;
}

const ORDERS_QUERY = `
  query AdminOrders($first: Int!, $query: String!) {
    orders(first: $first, sortKey: CREATED_AT, reverse: true, query: $query) {
      edges {
        node {
          id
          name
          createdAt
          displayFinancialStatus
          displayFulfillmentStatus
          totalPriceSet { presentmentMoney { amount currencyCode } }
          customer { firstName lastName email }
          lineItems(first: 1) { edges { node { id } } }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const ORDERS_PAGE_QUERY = `
  query AdminOrdersPage($first: Int!, $after: String, $query: String!) {
    orders(first: $first, after: $after, sortKey: CREATED_AT, reverse: true, query: $query) {
      edges {
        node {
          id
          name
          createdAt
          displayFinancialStatus
          displayFulfillmentStatus
          totalPriceSet { presentmentMoney { amount currencyCode } }
          customer { firstName lastName email }
          lineItems(first: 1) { edges { node { id } } }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

type EdgeNode = {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string | null;
  displayFulfillmentStatus: string | null;
  totalPriceSet: { presentmentMoney: { amount: string; currencyCode: string } };
  customer: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
  lineItems: { edges: { node: { id: string } }[] };
};

function normalize(edge: EdgeNode): OrderSummary {
  return {
    id: edge.id,
    name: edge.name,
    createdAt: edge.createdAt,
    displayFinancialStatus: edge.displayFinancialStatus,
    displayFulfillmentStatus: edge.displayFulfillmentStatus,
    totalPrice: {
      amount: edge.totalPriceSet.presentmentMoney.amount,
      currencyCode: edge.totalPriceSet.presentmentMoney.currencyCode,
    },
    customer: edge.customer,
    lineItemsCount: edge.lineItems.edges.length,
  };
}

async function fetchOrdersInWindow(sinceIso: string): Promise<OrderSummary[]> {
  const q = `created_at:>=${sinceIso}`;
  const all: OrderSummary[] = [];
  let after: string | null = null;
  for (let i = 0; i < 5; i++) {
    const data: {
      orders: {
        edges: { node: EdgeNode }[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    } = after
      ? await adminGraphQL(ORDERS_PAGE_QUERY, { first: 100, after, query: q })
      : await adminGraphQL(ORDERS_QUERY, { first: 100, query: q });
    for (const e of data.orders.edges) all.push(normalize(e.node));
    if (!data.orders.pageInfo.hasNextPage) break;
    after = data.orders.pageInfo.endCursor;
    if (!after) break;
  }
  return all;
}

export async function loadOrdersSnapshot(): Promise<OrdersSnapshot> {
  if (!hasAdminToken()) return EMPTY_SNAPSHOT;

  const since30 = new Date();
  since30.setUTCDate(since30.getUTCDate() - 29);
  since30.setUTCHours(0, 0, 0, 0);
  const sinceIso = since30.toISOString();

  let orders: OrderSummary[] = [];
  try {
    orders = await fetchOrdersInWindow(sinceIso);
  } catch (e) {
    console.error("[orders] fetch failed:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return { ...EMPTY_SNAPSHOT, fetchError: msg };
  }

  const today = dateKey(0);
  const yesterday = dateKey(-1);
  const cutoff7 = new Date();
  cutoff7.setUTCDate(cutoff7.getUTCDate() - 6);
  cutoff7.setUTCHours(0, 0, 0, 0);
  const cutoff7Ms = cutoff7.getTime();

  const perDayMap = new Map<string, DailyRevenue>();
  for (let i = 29; i >= 0; i--) {
    const d = dateKey(-i);
    perDayMap.set(d, { date: d, revenue: 0, orders: 0 });
  }

  let todayRev = 0;
  let todayCnt = 0;
  let ydayRev = 0;
  let ydayCnt = 0;
  let rev7 = 0;
  let cnt7 = 0;
  let rev30 = 0;
  let cnt30 = 0;

  for (const o of orders) {
    const day = o.createdAt.slice(0, 10);
    const amount = amountAsNumber(o.totalPrice.amount);
    const bucket = perDayMap.get(day);
    if (bucket) {
      bucket.revenue += amount;
      bucket.orders += 1;
    }
    rev30 += amount;
    cnt30 += 1;
    if (new Date(o.createdAt).getTime() >= cutoff7Ms) {
      rev7 += amount;
      cnt7 += 1;
    }
    if (day === today) {
      todayRev += amount;
      todayCnt += 1;
    }
    if (day === yesterday) {
      ydayRev += amount;
      ydayCnt += 1;
    }
  }

  const perDay = Array.from(perDayMap.values());
  const recent = orders.slice(0, 12);

  return {
    todayRevenueEUR: todayRev,
    todayOrderCount: todayCnt,
    yesterdayRevenueEUR: ydayRev,
    yesterdayOrderCount: ydayCnt,
    revenue7dEUR: rev7,
    orders7dCount: cnt7,
    revenue30dEUR: rev30,
    orders30dCount: cnt30,
    perDay,
    recent,
  };
}

export function formatEUR(n: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function customerName(o: OrderSummary): string {
  if (!o.customer) return "Gast";
  const f = o.customer.firstName ?? "";
  const l = o.customer.lastName ?? "";
  const full = `${f} ${l}`.trim();
  return full || o.customer.email || "Gast";
}
