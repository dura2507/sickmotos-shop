// Fully on-site customer auth using the Shopify Storefront API "classic"
// customer accounts. No OAuth redirect, no Shopify-hosted login page. We
// exchange email + password for a customerAccessToken, keep it in an
// httpOnly cookie, and read the profile + orders straight from the
// Storefront API. This keeps the whole account experience on our domain,
// in our design.

import "server-only";
import { cookies } from "next/headers";
import { shopifyFetch } from "./shopify";

const COOKIE = "sm_cat"; // customer access token
const SECURE = process.env.NODE_ENV === "production";

// ---------------------------------------------------------------------------
// Types

export type CustomerUserError = {
  field: string[] | null;
  message: string;
  code?: string | null;
};

export type CustomerAddress = {
  address1: string | null;
  address2: string | null;
  city: string | null;
  zip: string | null;
  province: string | null;
  country: string | null;
  countryCodeV2: string | null;
};

export type CustomerOrderLine = {
  title: string;
  quantity: number;
  variant: { image: { url: string; altText: string | null } | null } | null;
};

export type CustomerOrder = {
  id: string;
  name: string;
  orderNumber: number;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  totalPrice: { amount: string; currencyCode: string };
  lineItems: { nodes: CustomerOrderLine[] };
};

export type Customer = {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  defaultAddress: CustomerAddress | null;
  orders: { nodes: CustomerOrder[] };
};

// ---------------------------------------------------------------------------
// Cookie helpers

export async function setCustomerToken(
  token: string,
  expiresAt: string
): Promise<void> {
  const jar = await cookies();
  const expiry = new Date(expiresAt).getTime();
  const maxAge = Math.max(60, Math.floor((expiry - Date.now()) / 1000));
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: SECURE,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function clearCustomerToken(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, "", { path: "/", maxAge: 0 });
}

export async function getCustomerToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value ?? null;
}

// ---------------------------------------------------------------------------
// Auth mutations

type TokenResult =
  | { ok: true; token: string; expiresAt: string }
  | { ok: false; errors: CustomerUserError[] };

export async function customerLogin(
  email: string,
  password: string
): Promise<TokenResult> {
  const data = await shopifyFetch<{
    customerAccessTokenCreate: {
      customerAccessToken: { accessToken: string; expiresAt: string } | null;
      customerUserErrors: CustomerUserError[];
    };
  }>(
    `mutation Login($input: CustomerAccessTokenCreateInput!) {
       customerAccessTokenCreate(input: $input) {
         customerAccessToken { accessToken expiresAt }
         customerUserErrors { field message code }
       }
     }`,
    { variables: { input: { email, password } }, revalidate: false }
  );
  const r = data.customerAccessTokenCreate;
  if (r.customerAccessToken) {
    return {
      ok: true,
      token: r.customerAccessToken.accessToken,
      expiresAt: r.customerAccessToken.expiresAt,
    };
  }
  return { ok: false, errors: r.customerUserErrors };
}

export async function customerRegister(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  acceptsMarketing?: boolean;
}): Promise<{ ok: true } | { ok: false; errors: CustomerUserError[] }> {
  const data = await shopifyFetch<{
    customerCreate: {
      customer: { id: string } | null;
      customerUserErrors: CustomerUserError[];
    };
  }>(
    `mutation Register($input: CustomerCreateInput!) {
       customerCreate(input: $input) {
         customer { id }
         customerUserErrors { field message code }
       }
     }`,
    { variables: { input }, revalidate: false }
  );
  const r = data.customerCreate;
  if (r.customer) return { ok: true };
  return { ok: false, errors: r.customerUserErrors };
}

export async function customerRecover(
  email: string
): Promise<{ ok: true } | { ok: false; errors: CustomerUserError[] }> {
  const data = await shopifyFetch<{
    customerRecover: { customerUserErrors: CustomerUserError[] };
  }>(
    `mutation Recover($email: String!) {
       customerRecover(email: $email) {
         customerUserErrors { field message code }
       }
     }`,
    { variables: { email }, revalidate: false }
  );
  const errs = data.customerRecover.customerUserErrors;
  if (errs.length === 0) return { ok: true };
  return { ok: false, errors: errs };
}

export async function customerLogout(token: string): Promise<void> {
  try {
    await shopifyFetch(
      `mutation Logout($token: String!) {
         customerAccessTokenDelete(customerAccessToken: $token) {
           deletedAccessToken
           userErrors { field message }
         }
       }`,
      { variables: { token }, revalidate: false }
    );
  } catch {
    // Best-effort; the cookie is cleared regardless.
  }
}

// ---------------------------------------------------------------------------
// Profile + orders

const CUSTOMER_QUERY = /* GraphQL */ `
  query Customer($token: String!) {
    customer(customerAccessToken: $token) {
      firstName
      lastName
      email
      phone
      defaultAddress {
        address1
        address2
        city
        zip
        province
        country
        countryCodeV2
      }
      orders(first: 50, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          id
          name
          orderNumber
          processedAt
          financialStatus
          fulfillmentStatus
          totalPrice { amount currencyCode }
          lineItems(first: 5) {
            nodes {
              title
              quantity
              variant { image { url altText } }
            }
          }
        }
      }
    }
  }
`;

// Returns the logged-in customer (profile + recent orders), or null when
// there is no valid session.
export async function getCustomer(): Promise<Customer | null> {
  const token = await getCustomerToken();
  if (!token) return null;
  try {
    const data = await shopifyFetch<{ customer: Customer | null }>(
      CUSTOMER_QUERY,
      { variables: { token }, revalidate: false }
    );
    return data.customer;
  } catch {
    return null;
  }
}

// Maps Shopify customerUserErrors to a single friendly message.
export function friendlyAuthError(errors: CustomerUserError[]): string {
  if (!errors.length) return "Something went wrong. Please try again.";
  const codes = errors.map((e) => e.code);
  if (codes.includes("UNIDENTIFIED_CUSTOMER")) {
    return "Wrong email or password.";
  }
  if (codes.includes("TAKEN")) {
    return "An account with this email already exists. Sign in instead.";
  }
  if (codes.includes("CUSTOMER_DISABLED")) {
    return "Your account is not activated yet. Check your email for the activation link.";
  }
  return errors[0].message || "Something went wrong. Please try again.";
}
