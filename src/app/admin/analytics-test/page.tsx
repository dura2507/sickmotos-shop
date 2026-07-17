// TEMPORARY verification page. ShopifyQL is blocked (token lacks read_reports +
// Level 2 customer data), so we recompute Shopify's sales-report metrics from the
// Orders Admin API and check they match the Shopify Analytics dashboard for a known
// window (Jul 9-15, 2026). Behind the /admin gate. Delete once the panel is wired.

export const dynamic = "force-dynamic";

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? "sickmotos.myshopify.com";
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-07";
const TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;

const ORDERS_QUERY = `query($q:String!, $after:String){
  orders(first:100, after:$after, sortKey:CREATED_AT, query:$q){
    edges { node {
      id createdAt displayFinancialStatus cancelledAt test
      totalPriceSet { shopMoney { amount } }
      subtotalPriceSet { shopMoney { amount } }
      totalDiscountsSet { shopMoney { amount } }
      totalTaxSet { shopMoney { amount } }
      totalShippingPriceSet { shopMoney { amount } }
      totalRefundedSet { shopMoney { amount } }
    } }
    pageInfo { hasNextPage endCursor }
  }
}`;

type Node = {
  id: string; createdAt: string; displayFinancialStatus: string | null;
  cancelledAt: string | null; test: boolean;
  totalPriceSet: { shopMoney: { amount: string } };
  subtotalPriceSet: { shopMoney: { amount: string } };
  totalDiscountsSet: { shopMoney: { amount: string } };
  totalTaxSet: { shopMoney: { amount: string } };
  totalShippingPriceSet: { shopMoney: { amount: string } };
  totalRefundedSet: { shopMoney: { amount: string } };
};

const n = (s: string | undefined) => {
  const x = Number.parseFloat(s ?? "0");
  return Number.isFinite(x) ? x : 0;
};

async function gql(q: string, after: string | null) {
  const res = await fetch(
    `https://${DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN as string },
      body: JSON.stringify({ query: ORDERS_QUERY, variables: { q, after } }),
      cache: "no-store",
    }
  );
  return res.json();
}

async function compute(query: string, excludeCancelled: boolean) {
  let after: string | null = null;
  const rows: Node[] = [];
  for (let i = 0; i < 4; i++) {
    const j = await gql(query, after);
    if (j.errors) return { error: j.errors };
    const o = j.data.orders;
    for (const e of o.edges as { node: Node }[]) rows.push(e.node);
    if (!o.pageInfo.hasNextPage) break;
    after = o.pageInfo.endCursor;
  }
  const kept = rows.filter((r) => !r.test && (!excludeCancelled || !r.cancelledAt));
  let total = 0, subtotal = 0, discounts = 0, tax = 0, shipping = 0, refunded = 0;
  for (const r of kept) {
    total += n(r.totalPriceSet.shopMoney.amount);
    subtotal += n(r.subtotalPriceSet.shopMoney.amount);
    discounts += n(r.totalDiscountsSet.shopMoney.amount);
    tax += n(r.totalTaxSet.shopMoney.amount);
    shipping += n(r.totalShippingPriceSet.shopMoney.amount);
    refunded += n(r.totalRefundedSet.shopMoney.amount);
  }
  const net = subtotal;          // subtotal = after discounts = Shopify Net sales
  const gross = net + discounts; // Shopify Gross sales
  return {
    orders: kept.length,
    fetchedRaw: rows.length,
    gross_sales: gross.toFixed(2),
    discounts: discounts.toFixed(2),
    net_sales: net.toFixed(2),
    shipping: shipping.toFixed(2),
    taxes: tax.toFixed(2),
    refunded: refunded.toFixed(2),
    total_sales_sumTotalPrice: total.toFixed(2),
    total_sales_netPlusShipTax: (net + shipping + tax).toFixed(2),
  };
}

export default async function AnalyticsTest() {
  if (!TOKEN) return <pre style={{ padding: 24 }}>no token</pre>;
  // Shopify uses the shop timezone (Europe/Berlin, UTC+2) for day boundaries.
  // Try the window both ways so we can see which matches 54 orders / €8.700,31.
  const q1 = "created_at:>=2026-07-09 created_at:<=2026-07-15";
  const q2 = "created_at:>='2026-07-09T00:00:00+02:00' created_at:<='2026-07-15T23:59:59+02:00'";
  const [a, b] = await Promise.all([compute(q1, true), compute(q2, true)]);
  const out = {
    shopify_says: { total_sales: "8700.31", gross: "6977.28", net: "6851.48", discounts: "125.80", taxes: "1244.15", shipping: "604.68", orders: 54 },
    recompute_utc_dates: a,
    recompute_berlin_tz: b,
  };
  return (
    <div style={{ padding: 24, fontFamily: "monospace", fontSize: 12, whiteSpace: "pre-wrap", color: "#e5e5e5", background: "#0a0a0a", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 16 }}>Orders-API sales recompute vs Shopify (Jul 9-15, 2026)</h1>
      <div>{JSON.stringify(out, null, 2)}</div>
    </div>
  );
}
