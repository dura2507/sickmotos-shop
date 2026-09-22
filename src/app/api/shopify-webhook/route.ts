// Shopify webhook receiver. Verifies the HMAC signature, then forwards
// the trigger to a Vercel Deploy Hook so a fresh build picks up the
// updated product / inventory / price data into our static products.json
// snapshot.
//
// SETUP — one-time, in two places:
//
// 1. Vercel project -> Settings -> Git -> Deploy Hooks
//      Create one ("Shopify product sync"), copy the URL.
//      Save it as env var:  VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/...
//      (no NEXT_PUBLIC_ prefix; server-side only)
//
// 2. Shopify Admin -> Settings -> Notifications -> Webhooks
//      Add one webhook per topic we care about:
//         - Product update
//         - Product deletion
//         - Inventory levels update
//      URL: https://<our-domain>/api/shopify-webhook
//      Format: JSON
//      API version: 2025-01
//      Shopify generates a webhook signing secret on the same page.
//      Save it as env var: SHOPIFY_WEBHOOK_SECRET=<secret>
//
// Once both env vars are set in Vercel and the webhook is added in
// Shopify, every product/inventory change triggers a rebuild within
// ~30 seconds; the static product pages and the BikeFinder data refresh
// automatically.

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { redis, safe } from "@/lib/redisSafe";

// Shopify (some app) rewrites the whole catalog in one burst several times a
// day, which produced 30 deployments in 24 h (2026-09-11). Webhooks arriving
// within this window after a deploy was triggered are coalesced into it: the
// build fetches products.json 15 to 40 s after the hook, so the burst is
// already in the data. Fails open when Redis is down.
const COALESCE_SEC = 15;
const LOCK_KEY = "sm:deploy:lock";

async function alreadyTriggered(): Promise<boolean> {
  if (!redis) return false;
  return safe(
    "webhook.lock",
    async () => {
      const set = await redis!.set(LOCK_KEY, Date.now(), { nx: true, ex: COALESCE_SEC });
      return set === null;
    },
    false
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifyHmac(rawBody: string, headerHmac: string | null): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret || !headerHmac) return false;
  const computed = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");
  // Both buffers must be the same length for timingSafeEqual.
  const a = Buffer.from(computed, "utf8");
  const b = Buffer.from(headerHmac, "utf8");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const raw = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");
  if (!verifyHmac(raw, hmac)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const topic = req.headers.get("x-shopify-topic") ?? "unknown";
  const shop = req.headers.get("x-shopify-shop-domain") ?? "unknown";

  const deployHook = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!deployHook) {
    // Webhook valid but no deploy hook configured yet. Log and accept so
    // Shopify doesn't keep retrying.
    console.warn(`[shopify-webhook] no VERCEL_DEPLOY_HOOK_URL set; received ${topic} from ${shop}`);
    return NextResponse.json({ ok: true, action: "skipped" });
  }

  if (await alreadyTriggered()) {
    return NextResponse.json({ ok: true, action: "coalesced", topic, shop });
  }

  // Fire-and-forget the deploy hook. Shopify expects a 200 quickly or
  // it counts the webhook as failed.
  try {
    const r = await fetch(deployHook, { method: "POST" });
    if (!r.ok) {
      console.error(`[shopify-webhook] deploy hook returned ${r.status}`);
    }
  } catch (e) {
    console.error("[shopify-webhook] deploy hook call failed:", e);
  }

  return NextResponse.json({ ok: true, topic, shop });
}
