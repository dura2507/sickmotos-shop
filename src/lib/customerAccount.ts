// Headless Customer Account API helpers. Implements the OAuth 2.0 PKCE
// flow against Shopify's Customer Account API so /account/* lives on
// our domain instead of account.sick-motos.com. Tokens live in
// httpOnly cookies; the access token is short-lived and we refresh on
// demand. No Shopify Plus required.
//
// Required env vars:
//   SHOPIFY_SHOP_ID                       Shop GID number, e.g. 53473804477
//   SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID    Public client ID from Shopify
//                                          Admin -> Customer Accounts ->
//                                          Headless storefronts.

import { createHash, randomBytes } from "node:crypto";

const SHOP_ID = process.env.SHOPIFY_SHOP_ID ?? "53473804477";
const CLIENT_ID =
  process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID ??
  "5166793c-ad00-4be6-a2fe-74ffb54e4108";

export const CUSTOMER_ACCOUNT = {
  shopId: SHOP_ID,
  clientId: CLIENT_ID,
  authUrl: `https://shopify.com/authentication/${SHOP_ID}/oauth/authorize`,
  tokenUrl: `https://shopify.com/authentication/${SHOP_ID}/oauth/token`,
  logoutUrl: `https://shopify.com/authentication/${SHOP_ID}/logout`,
  apiUrl: `https://shopify.com/${SHOP_ID}/account/customer/api/2025-07/graphql`,
  scopes: ["openid", "email", "customer-account-api:full"].join(" "),
};

// PKCE: code_verifier = 43-128 chars base64url. code_challenge =
// base64url(sha256(verifier)). Shopify requires S256.
export function makeCodeVerifier(): string {
  return randomBytes(48).toString("base64url");
}

export function codeChallengeFromVerifier(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function makeRandomState(): string {
  return randomBytes(24).toString("base64url");
}

export type TokenResponse = {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token: string;
  token_type: "Bearer";
  scope?: string;
};

export async function exchangeCodeForTokens(opts: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    redirect_uri: opts.redirectUri,
    code: opts.code,
    code_verifier: opts.codeVerifier,
  });
  const r = await fetch(CUSTOMER_ACCOUNT.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await r.json()) as TokenResponse & { error?: string; error_description?: string };
  if (!r.ok) {
    throw new Error(
      `Token exchange failed: ${data.error ?? r.status} ${data.error_description ?? ""}`
    );
  }
  return data;
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
    refresh_token: refreshToken,
  });
  const r = await fetch(CUSTOMER_ACCOUNT.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await r.json()) as TokenResponse & { error?: string; error_description?: string };
  if (!r.ok) {
    throw new Error(
      `Token refresh failed: ${data.error ?? r.status} ${data.error_description ?? ""}`
    );
  }
  return data;
}

// ---------------------------------------------------------------------------
// Customer Account GraphQL helpers

export async function customerGql<T>(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const r = await fetch(CUSTOMER_ACCOUNT.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const json = (await r.json()) as { data?: T; errors?: unknown[] };
  if (json.errors) {
    throw new Error(
      `Customer Account API error: ${JSON.stringify(json.errors)}`
    );
  }
  if (!json.data) {
    throw new Error(`Customer Account API returned no data`);
  }
  return json.data;
}

export type CustomerOverview = {
  customer: {
    firstName: string | null;
    lastName: string | null;
    emailAddress: { emailAddress: string } | null;
    defaultAddress: {
      address1: string | null;
      city: string | null;
      countryCodeV2: string | null;
    } | null;
    orders: {
      nodes: Array<{
        id: string;
        name: string;
        processedAt: string;
        financialStatus: string | null;
        fulfillmentStatus: string | null;
        totalPrice: { amount: string; currencyCode: string };
        lineItems: {
          nodes: Array<{
            title: string;
            quantity: number;
            image: { url: string; altText: string | null } | null;
          }>;
        };
      }>;
    };
  };
};

export const CUSTOMER_OVERVIEW_QUERY = /* GraphQL */ `
  query CustomerOverview {
    customer {
      firstName
      lastName
      emailAddress { emailAddress }
      defaultAddress {
        address1
        city
        countryCodeV2
      }
      orders(first: 10, reverse: true) {
        nodes {
          id
          name
          processedAt
          financialStatus
          fulfillmentStatus
          totalPrice { amount currencyCode }
          lineItems(first: 3) {
            nodes {
              title
              quantity
              image { url altText }
            }
          }
        }
      }
    }
  }
`;
