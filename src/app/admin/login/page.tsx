import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSession, verifyAdminPassword } from "../auth";

export const metadata = {
  title: "SickMotos · Admin",
  robots: { index: false, follow: false },
};

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  if (!verifyAdminPassword(password)) {
    redirect("/admin/login?error=1");
  }
  const token = createSession();
  const cookieStore = await cookies();
  cookieStore.set("sm_admin", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  redirect("/admin");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-12">
      <h1 className="mb-2 font-display text-4xl uppercase tracking-tight">
        Admin
      </h1>
      <p className="mb-8 text-sm text-fg-muted">
        Interner Bereich. Login erforderlich.
      </p>
      <form action={login} className="flex flex-col gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-fg-dim">
          Passwort
        </label>
        <input
          type="password"
          name="password"
          required
          autoFocus
          className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-fg outline-none focus:border-accent"
        />
        {error && (
          <p className="text-xs text-accent">Passwort falsch.</p>
        )}
        <button
          type="submit"
          className="mt-2 rounded-full bg-accent px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-accent-hi"
        >
          Einloggen
        </button>
      </form>
    </div>
  );
}
