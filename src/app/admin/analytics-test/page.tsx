// TEMPORARY verification page. Proves whether Shopify's own analytics engine
// (ShopifyQL `FROM sales`) is reachable with our Admin token + returns numbers
// that match the Shopify Analytics dashboard 1:1. Behind the /admin gate.
// Delete once the real analytics panel is wired.

export const dynamic = "force-dynamic";

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? "sickmotos.myshopify.com";
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-07";
const TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;

async function runQL(q: string): Promise<unknown> {
  if (!TOKEN) return { error: "SHOPIFY_ADMIN_API_TOKEN not set" };
  const query = `query($q:String!){
    shopifyqlQuery(query:$q){
      tableData { columns { name displayName dataType } rows }
      parseErrors
    }
  }`;
  try {
    const res = await fetch(
      `https://${DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": TOKEN,
        },
        body: JSON.stringify({ query, variables: { q } }),
        cache: "no-store",
      }
    );
    const json = await res.json();
    return { status: res.status, json };
  } catch (e) {
    return { error: String(e) };
  }
}

export default async function AnalyticsTest() {
  const q =
    "FROM sales SHOW total_sales, gross_sales, net_sales, discounts, taxes, shipping, orders SINCE 2026-07-09 UNTIL 2026-07-15";
  const result = await runQL(q);
  return (
    <div
      style={{
        padding: 24,
        fontFamily: "monospace",
        fontSize: 12,
        whiteSpace: "pre-wrap",
        color: "#e5e5e5",
        background: "#0a0a0a",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: 16, marginBottom: 8 }}>ShopifyQL sales test</h1>
      <p style={{ color: "#9a9a9a", marginBottom: 16 }}>
        Zeitraum Jul 9-15, 2026. Shopify-Dashboard sagt: total_sales €8.700,31 ·
        gross_sales €6.977,28 · net_sales €6.851,48 · discounts €125,80 · taxes
        €1.244,15 · shipping €604,68 · orders 54. Wenn die Zahlen hier
        übereinstimmen, ist ShopifyQL die zuverlässige Quelle.
      </p>
      <div>{JSON.stringify(result, null, 2)}</div>
    </div>
  );
}
