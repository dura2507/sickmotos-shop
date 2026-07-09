"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body?.error === "string" ? body.error : "Login fehlgeschlagen");
        setPending(false);
        return;
      }
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError("Netzwerkfehler");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-fg-dim">
          Passwort
        </span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
          className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface/60 px-4 py-3 text-fg outline-none transition-colors placeholder:text-fg-dim focus:border-accent"
        />
      </label>
      {error && (
        <p className="text-sm font-semibold text-accent">{error}</p>
      )}
      <button
        type="submit"
        disabled={pending || !password}
        className="w-full rounded-full bg-accent px-5 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-accent-hi disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Prüfe…" : "Einloggen"}
      </button>
    </form>
  );
}
