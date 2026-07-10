import "server-only";

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? "sickmotos.myshopify.com";
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2025-01";
const TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;

export function hasAdminToken(): boolean {
  return typeof TOKEN === "string" && TOKEN.length > 0;
}

export async function adminGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
  revalidateSec = 60
): Promise<T> {
  if (!TOKEN) {
    throw new Error("SHOPIFY_ADMIN_API_TOKEN is not set");
  }
  const res = await fetch(
    `https://${DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: revalidateSec },
    }
  );
  if (!res.ok) {
    throw new Error(`Shopify Admin API ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as {
    data?: T;
    errors?: { message: string }[];
  };
  if (json.errors?.length) {
    throw new Error(`Shopify Admin GraphQL error: ${json.errors[0].message}`);
  }
  if (!json.data) throw new Error("Shopify Admin API returned no data");
  return json.data;
}
