// Shopify Storefront API client. Public read-only token, safe to use in
// server components. Use this when you need live data (stock, prices,
// search results) instead of the build-time products.json snapshot.

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? "sickmotos.myshopify.com";
const TOKEN = process.env.SHOPIFY_STOREFRONT_API_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2025-01";

export type ShopifyFetchOptions = {
  variables?: Record<string, unknown>;
  revalidate?: number | false;
  tags?: string[];
};

export async function shopifyFetch<T>(
  query: string,
  { variables, revalidate = 3600, tags }: ShopifyFetchOptions = {}
): Promise<T> {
  if (!TOKEN) {
    throw new Error(
      "SHOPIFY_STOREFRONT_API_TOKEN is not set. Add it to .env.local."
    );
  }

  const res = await fetch(
    `https://${DOMAIN}/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": TOKEN,
      },
      body: JSON.stringify({ query, variables }),
      next: {
        revalidate: revalidate === false ? undefined : revalidate,
        tags,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Shopify API ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as { data?: T; errors?: unknown[] };
  if (json.errors) {
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(json.errors)}`);
  }
  if (!json.data) {
    throw new Error("Shopify returned no data");
  }
  return json.data;
}

// ---------------------------------------------------------------------------
// Common fragments and queries. Add more as we wire features (cart,
// checkout, predictive search, etc.).

export const PRODUCT_CARD_FRAGMENT = `
  fragment ProductCard on Product {
    id
    handle
    title
    vendor
    productType
    availableForSale
    tags
    featuredImage {
      url
      altText
      width
      height
    }
    priceRange {
      minVariantPrice { amount currencyCode }
    }
    compareAtPriceRange {
      minVariantPrice { amount currencyCode }
    }
  }
`;

export type StorefrontMoney = {
  amount: string;
  currencyCode: string;
};

export type StorefrontProductCard = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  availableForSale: boolean;
  tags: string[];
  featuredImage: {
    url: string;
    altText: string | null;
    width: number;
    height: number;
  } | null;
  priceRange: { minVariantPrice: StorefrontMoney };
  compareAtPriceRange: { minVariantPrice: StorefrontMoney };
};

export async function fetchProductCards(
  query?: string,
  first = 24
): Promise<StorefrontProductCard[]> {
  const data = await shopifyFetch<{
    products: { nodes: StorefrontProductCard[] };
  }>(
    `${PRODUCT_CARD_FRAGMENT}
     query Products($first: Int!, $query: String) {
       products(first: $first, query: $query, sortKey: BEST_SELLING) {
         nodes { ...ProductCard }
       }
     }`,
    { variables: { first, query: query ?? null } }
  );
  return data.products.nodes;
}

// Health check — used by scripts / status pages.
export async function getShopInfo() {
  return shopifyFetch<{
    shop: { name: string; primaryDomain: { url: string } };
  }>(
    `{ shop { name primaryDomain { url } } }`,
    { revalidate: 86400 }
  );
}
