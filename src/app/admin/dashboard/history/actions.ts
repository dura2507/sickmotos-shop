"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, isValidSession } from "@/lib/adminSession";
import { importShopifyHistory } from "@/lib/shopifyHistory";

// The proxy (src/proxy.ts) already gates /admin/*, this second check keeps the action
// safe even if the matcher ever changes.
async function assertAdmin() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const ok = await isValidSession(cookie, process.env.ADMIN_PASSWORD ?? "");
  if (!ok) throw new Error("Nicht angemeldet");
}

export async function importHistory(formData: FormData) {
  await assertAdmin();
  const csv = String(formData.get("csv") ?? "");
  const result = await importShopifyHistory(csv);
  const msg = result.ok
    ? `ok:${result.days} Tage importiert (${result.from} bis ${result.to})`
    : `err:${result.error}`;
  redirect(`/admin/dashboard/history?r=${encodeURIComponent(msg)}`);
}
