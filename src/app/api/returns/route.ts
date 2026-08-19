import { NextResponse } from "next/server";
import {
  returnRateLimited,
  saveReturnRequest,
  type ReturnRequest,
} from "@/lib/returnsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/returns — the return form. Server-side validation mirrors the
// client so nothing incomplete can be submitted directly against the API.
// No attachments by design (Thomas: photos only on request, per email).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ORDER_RE = /^#?[0-9A-Za-z-]{2,12}$/;
const REASON_MIN = 150;

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Honeypot: real customers never see this field. Bots that fill it get a
  // fake success so they do not adapt.
  if (str(body.website)) return NextResponse.json({ ok: true });

  const r: ReturnRequest = {
    id: crypto.randomUUID(),
    ts: Date.now(),
    orderNumber: str(body.orderNumber, 20),
    name: str(body.name),
    email: str(body.email),
    street: str(body.street),
    zip: str(body.zip, 12),
    city: str(body.city),
    country: str(body.country, 60),
    reason: str(body.reason, 3000),
    locale: str(body.locale, 5) || null,
    status: "open",
  };

  const invalid =
    !ORDER_RE.test(r.orderNumber) ||
    r.name.length < 3 ||
    !EMAIL_RE.test(r.email) ||
    r.street.length < 5 ||
    r.zip.length < 3 ||
    r.city.length < 2 ||
    r.country.length < 2 ||
    r.reason.length < REASON_MIN;
  if (invalid) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "";
  if (await returnRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });
  }

  const stored = await saveReturnRequest(r);
  if (!stored) {
    // Redis down or unconfigured: a silent ok would lose the request.
    return NextResponse.json({ ok: false, error: "store" }, { status: 503 });
  }

  void notifyTelegram(r);
  return NextResponse.json({ ok: true });
}

// Optional push into the SickMotos Telegram group. No-op until
// TELEGRAM_BOT_TOKEN + TELEGRAM_RETURNS_CHAT_ID exist in the Vercel env.
async function notifyTelegram(r: ReturnRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_RETURNS_CHAT_ID;
  if (!token || !chatId) return;
  const text = [
    "Neue Rückgabe-Anfrage",
    `Bestellung: ${r.orderNumber}`,
    `${r.name}, ${r.zip} ${r.city} (${r.country})`,
    `E-Mail: ${r.email}`,
    "",
    r.reason.slice(0, 600),
  ].join("\n");
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch {
    // Best effort, the request itself is already stored.
  }
}
