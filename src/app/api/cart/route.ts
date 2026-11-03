// Cart route handler. The client never talks to Shopify directly — it
// posts intent (add line, update qty, remove line) here and we make the
// Storefront API call server-side. Keeps the token off the wire and
// gives us a single place to add logging, validation or rate-limiting
// later.

import { NextResponse, after } from "next/server";
import {
  cartCreate,
  cartGet,
  cartLanguageFor,
  cartLinesAdd,
  cartLinesRemove,
  cartLinesUpdate,
} from "@/lib/shopify";
import { getLocale } from "@/lib/i18n/getLocale";
import { recordFunnel } from "@/lib/analyticsStore";

// Checkout language follows the storefront locale (cookie / Accept-Language),
// otherwise Shopify sends German customers to the English checkout.
const lang = async () => cartLanguageFor(await getLocale());

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CartLineInput = { merchandiseId: string; quantity: number };

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cartId = url.searchParams.get("id");
  if (!cartId) return bad("missing id");
  try {
    const cart = await cartGet(cartId, await lang());
    if (!cart) return NextResponse.json({ cart: null });
    return NextResponse.json({ cart });
  } catch (e) {
    return bad((e as Error).message, 500);
  }
}

export async function POST(req: Request) {
  // Either create a brand-new cart with initial lines, or add lines to an
  // existing one. Distinguished by presence of cartId in the body.
  let body: { cartId?: string; lines?: CartLineInput[] };
  try {
    body = await req.json();
  } catch {
    return bad("invalid json");
  }
  const lines = body.lines;
  if (!Array.isArray(lines) || lines.length === 0) return bad("lines required");
  for (const l of lines) {
    if (typeof l?.merchandiseId !== "string" || typeof l?.quantity !== "number") {
      return bad("malformed line");
    }
    if (l.quantity < 1 || l.quantity > 99) return bad("quantity out of range");
  }
  try {
    const language = await lang();
    const cart = body.cartId
      ? await cartLinesAdd(body.cartId, lines, language)
      : await cartCreate(lines, language);
    // Fuer das Admin-Dashboard: Shopify sieht den Warenkorb seit dem Umzug nicht
    // mehr. Laeuft nach der Antwort, haelt den Warenkorb also nie auf.
    const h = req.headers;
    const who = {
      ip: h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "",
      ua: h.get("user-agent"),
    };
    after(() => recordFunnel("cart", who));
    return NextResponse.json({ cart });
  } catch (e) {
    return bad((e as Error).message, 500);
  }
}

export async function PATCH(req: Request) {
  let body: { cartId?: string; lines?: { id: string; quantity: number }[] };
  try {
    body = await req.json();
  } catch {
    return bad("invalid json");
  }
  if (!body.cartId) return bad("cartId required");
  const lines = body.lines;
  if (!Array.isArray(lines) || lines.length === 0) return bad("lines required");
  for (const l of lines) {
    if (typeof l?.id !== "string" || typeof l?.quantity !== "number") {
      return bad("malformed line");
    }
    if (l.quantity < 0 || l.quantity > 99) return bad("quantity out of range");
  }
  try {
    const cart = await cartLinesUpdate(body.cartId, lines, await lang());
    return NextResponse.json({ cart });
  } catch (e) {
    return bad((e as Error).message, 500);
  }
}

export async function DELETE(req: Request) {
  let body: { cartId?: string; lineIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return bad("invalid json");
  }
  if (!body.cartId) return bad("cartId required");
  if (!Array.isArray(body.lineIds) || body.lineIds.length === 0) {
    return bad("lineIds required");
  }
  try {
    const cart = await cartLinesRemove(body.cartId, body.lineIds, await lang());
    return NextResponse.json({ cart });
  } catch (e) {
    return bad((e as Error).message, 500);
  }
}
