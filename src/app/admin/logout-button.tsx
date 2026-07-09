"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      className="text-[11px] font-bold uppercase tracking-[0.15em] text-fg-dim transition-colors hover:text-accent"
    >
      Logout
    </button>
  );
}
