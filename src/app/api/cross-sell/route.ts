// Tiny endpoint that gives the cart drawer 3 cross-sell items so we can
// drop them under the cart contents as an upsell ("add a titanium screw
// kit while you're here"). Excludes the handles already in the cart.

import { NextResponse } from "next/server";
import { getCrossSell } from "@/lib/products";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const exclude = url.searchParams.getAll("exclude");
  const items = getCrossSell(exclude, 3);
  return NextResponse.json({ items });
}
