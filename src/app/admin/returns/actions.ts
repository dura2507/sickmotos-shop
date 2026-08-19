"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE_NAME, isValidSession } from "@/lib/adminSession";
import { setReturnStatus } from "@/lib/returnsStore";

// The middleware already gates /admin/*, this second check keeps the action
// safe even if the matcher ever changes.
async function assertAdmin() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const ok = await isValidSession(cookie, process.env.ADMIN_PASSWORD ?? "");
  if (!ok) throw new Error("Nicht angemeldet");
}

export async function toggleReturnStatus(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const to = String(formData.get("to") ?? "");
  if (!id || (to !== "open" && to !== "done")) return;
  await setReturnStatus(id, to);
  revalidatePath("/admin/returns");
}
