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

// ---------------------------------------------------------------------------
// Cart — Storefront API. We keep cart state on Shopify (so it survives
// device switches once we add customer login) and store only the cart ID
// in the browser. checkoutUrl is the Shopify-hosted checkout we redirect
// to when the user clicks Checkout.

export type StorefrontCartLine = {
  id: string;
  quantity: number;
  cost: { totalAmount: StorefrontMoney };
  merchandise: {
    id: string;
    title: string;
    availableForSale: boolean;
    image: { url: string; altText: string | null } | null;
    price: StorefrontMoney;
    compareAtPrice: StorefrontMoney | null;
    product: {
      handle: string;
      title: string;
      featuredImage: { url: string; altText: string | null } | null;
    };
    selectedOptions: { name: string; value: string }[];
  };
};

export type StorefrontCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: StorefrontMoney;
    totalAmount: StorefrontMoney;
    totalTaxAmount: StorefrontMoney | null;
  };
  lines: { nodes: StorefrontCartLine[] };
};

const CART_FRAGMENT = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
      totalTaxAmount { amount currencyCode }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost { totalAmount { amount currencyCode } }
        merchandise {
          ... on ProductVariant {
            id
            title
            availableForSale
            image { url altText }
            price { amount currencyCode }
            compareAtPrice { amount currencyCode }
            product {
              handle
              title
              featuredImage { url altText }
            }
            selectedOptions { name value }
          }
        }
      }
    }
  }
`;

// Storefront mutations DON'T benefit from Next's cache, so always
// revalidate:false (or pass through a route handler with no cache).

export async function cartCreate(
  lines: { merchandiseId: string; quantity: number }[]
): Promise<StorefrontCart> {
  const data = await shopifyFetch<{ cartCreate: { cart: StorefrontCart } }>(
    `${CART_FRAGMENT}
     mutation CartCreate($input: CartInput!) {
       cartCreate(input: $input) {
         cart { ...CartFields }
         userErrors { field message }
       }
     }`,
    { variables: { input: { lines } }, revalidate: false }
  );
  return data.cartCreate.cart;
}

export async function cartGet(cartId: string): Promise<StorefrontCart | null> {
  const data = await shopifyFetch<{ cart: StorefrontCart | null }>(
    `${CART_FRAGMENT}
     query CartGet($id: ID!) {
       cart(id: $id) { ...CartFields }
     }`,
    { variables: { id: cartId }, revalidate: false }
  );
  return data.cart;
}

export async function cartLinesAdd(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<StorefrontCart> {
  const data = await shopifyFetch<{ cartLinesAdd: { cart: StorefrontCart } }>(
    `${CART_FRAGMENT}
     mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
       cartLinesAdd(cartId: $cartId, lines: $lines) {
         cart { ...CartFields }
         userErrors { field message }
       }
     }`,
    { variables: { cartId, lines }, revalidate: false }
  );
  return data.cartLinesAdd.cart;
}

export async function cartLinesUpdate(
  cartId: string,
  lines: { id: string; quantity: number }[]
): Promise<StorefrontCart> {
  const data = await shopifyFetch<{
    cartLinesUpdate: { cart: StorefrontCart };
  }>(
    `${CART_FRAGMENT}
     mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
       cartLinesUpdate(cartId: $cartId, lines: $lines) {
         cart { ...CartFields }
         userErrors { field message }
       }
     }`,
    { variables: { cartId, lines }, revalidate: false }
  );
  return data.cartLinesUpdate.cart;
}

export async function cartLinesRemove(
  cartId: string,
  lineIds: string[]
): Promise<StorefrontCart> {
  const data = await shopifyFetch<{
    cartLinesRemove: { cart: StorefrontCart };
  }>(
    `${CART_FRAGMENT}
     mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
       cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
         cart { ...CartFields }
         userErrors { field message }
       }
     }`,
    { variables: { cartId, lineIds }, revalidate: false }
  );
  return data.cartLinesRemove.cart;
}
