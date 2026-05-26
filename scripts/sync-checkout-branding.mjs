#!/usr/bin/env node
/**
 * Pushes the SickMotos brand colors, fonts and radius onto the Shopify
 * Checkout via the Admin GraphQL API. Run once whenever the brand
 * values change.
 *
 * Setup (one-time):
 *  1. Shopify Admin -> Settings -> Apps and sales channels -> Develop
 *     apps -> Create app -> Name "Branding sync" -> Configure Admin
 *     API scopes: write_checkout_branding (and write_customer_accounts
 *     if you want to brand the customer account API the same way).
 *  2. Install the app, copy the Admin API access token.
 *  3. Add to .env.local AND Vercel:
 *       SHOPIFY_ADMIN_API_TOKEN=shpat_xxxxxxxxxxxx
 *  4. Run:  node scripts/sync-checkout-branding.mjs
 *
 * Re-run any time you change the brand values below.
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Load env from .env.local if present
try {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), "..", ".env.local");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const [k, ...rest] = line.split("=");
    if (!k || !rest.length) continue;
    const key = k.trim();
    const val = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

const SHOP = process.env.SHOPIFY_STORE_DOMAIN || "sickmotos.myshopify.com";
const TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = "2025-07";

if (!TOKEN) {
  console.error(
    "Missing SHOPIFY_ADMIN_API_TOKEN. Create a custom app with write_checkout_branding scope and add its token to .env.local."
  );
  process.exit(1);
}

async function adminGql(query, variables) {
  const r = await fetch(
    `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    }
  );
  const j = await r.json();
  if (j.errors || j.data?.userErrors?.length) {
    throw new Error(JSON.stringify(j.errors || j.data?.userErrors));
  }
  return j.data;
}

// Find the live checkout profile id we need to brand.
const PROFILE_QUERY = /* GraphQL */ `
  query {
    checkoutProfiles(first: 5, query: "is_published:true") {
      edges {
        node {
          id
          name
          isPublished
        }
      }
    }
  }
`;

// The brand values. Tweak here and rerun the script.
const BRAND = {
  primaryButton: {
    background: "#e10600",
    backgroundHover: "#ff1f10",
    text: "#fafafa",
    border: "#e10600",
    borderRadius: "FULL",
    blockPadding: "BASE",
  },
  secondaryButton: {
    background: "#1c1c1c",
    text: "#fafafa",
    border: "#3a3a3a",
    borderRadius: "FULL",
  },
  formControls: {
    background: "#141414",
    text: "#fafafa",
    border: "#3a3a3a",
    borderRadius: "BASE",
  },
  colorSchemes: {
    canvas: {
      base: { background: "#0a0a0a", text: "#fafafa", accent: "#e10600", decorative: "#3a3a3a" },
    },
    primary: {
      base: { background: "#0a0a0a", text: "#fafafa", accent: "#e10600", decorative: "#3a3a3a" },
    },
    secondary: {
      base: { background: "#141414", text: "#fafafa", accent: "#e10600", decorative: "#3a3a3a" },
    },
  },
  cornerRadius: { base: "BASE", small: "SMALL", large: "LARGE" },
  typography: {
    size: { base: 16, ratio: 1.2 },
    primary: { shopifyFontGroup: { name: "Inter", baseWeight: 400, boldWeight: 700 } },
    secondary: { shopifyFontGroup: { name: "Bebas Neue", baseWeight: 400, boldWeight: 700 } },
  },
};

const UPSERT_MUTATION = /* GraphQL */ `
  mutation UpdateCheckoutBranding($checkoutProfileId: ID!, $input: CheckoutBrandingInput!) {
    checkoutBrandingUpsert(checkoutProfileId: $checkoutProfileId, checkoutBrandingInput: $input) {
      checkoutBranding {
        designSystem { colorPalette { primary { background text } } }
      }
      userErrors { field message }
    }
  }
`;

const input = {
  customizations: {
    primaryButton: BRAND.primaryButton,
    secondaryButton: BRAND.secondaryButton,
    control: BRAND.formControls,
    cornerRadius: "BASE",
  },
  designSystem: {
    colorPalette: {
      canvas: { foreground: BRAND.colorSchemes.canvas.base },
      primary: { foreground: BRAND.colorSchemes.primary.base },
      secondary: { foreground: BRAND.colorSchemes.secondary.base },
    },
    typography: BRAND.typography,
    cornerRadius: BRAND.cornerRadius,
  },
};

async function main() {
  console.log("[branding] fetching checkout profile...");
  const profileData = await adminGql(PROFILE_QUERY);
  const live = profileData.checkoutProfiles.edges.find((e) => e.node.isPublished);
  if (!live) {
    console.error("No published checkout profile found.");
    process.exit(1);
  }
  console.log(`[branding] profile: ${live.node.name} (${live.node.id})`);
  console.log("[branding] applying brand values...");
  const res = await adminGql(UPSERT_MUTATION, {
    checkoutProfileId: live.node.id,
    input,
  });
  const errs = res.checkoutBrandingUpsert.userErrors;
  if (errs.length) {
    console.error("[branding] errors:", errs);
    process.exit(1);
  }
  console.log("[branding] done. Open a fresh checkout to see it.");
}

main().catch((e) => {
  console.error("[branding] failed:", e.message);
  process.exit(1);
});
