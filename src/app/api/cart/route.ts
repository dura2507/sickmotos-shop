// Cart route handler. The client never talks to Shopify directly — it
// posts intent (add line, update qty, remove line) here and we make the
// Storefront API call server-side. Keeps the token off the wire and
// gives us a single place to add logging, validation or rate-limiting
// later.

import { NextResponse } from "next/server";
import {
  cartCreate,
  cartGet,
  cartLinesAdd,
  cartLinesRemove,
  cartLinesUpdate,
} from "@/lib/shopify";

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
    const cart = await cartGet(cartId);
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
    const cart = body.cartId
      ? await cartLinesAdd(body.cartId, lines)
      : await cartCreate(lines);
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
    const cart = await cartLinesUpdate(body.cartId, lines);
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
    const cart = await cartLinesRemove(body.cartId, body.lineIds);
    return NextResponse.json({ cart });
  } catch (e) {
    return bad((e as Error).message, 500);
  }
}
