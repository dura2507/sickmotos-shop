import { NextResponse } from "next/server";
import { recordVisit } from "@/lib/analyticsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/track — client tracker beacon. One request per pageview from
// the browser. We take metadata from Vercel's edge headers where possible
// and never store the raw IP.

export async function POST(req: Request) {
  let body: { path?: string; referrer?: string | null; locale?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const path = typeof body.path === "string" ? body.path : "/";
  const referrer =
    typeof body.referrer === "string" && body.referrer.length > 0
      ? body.referrer
      : null;
  const locale =
    typeof body.locale === "string" && body.locale.length > 0
      ? body.locale
      : null;

  const h = req.headers;
  const ip =
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "";
  const ua = h.get("user-agent") || "";
  const country =
    h.get("x-vercel-ip-country") ||
    h.get("cf-ipcountry") ||
    null;

  // Best-effort. A failure inside recordVisit (e.g. Redis hiccup) never
  // affects the customer's browsing.
  try {
    await recordVisit({ path, ip, ua, country, referrer, locale });
  } catch (e) {
    console.error("[track] recordVisit failed:", e);
  }

  return NextResponse.json({ ok: true });
}
