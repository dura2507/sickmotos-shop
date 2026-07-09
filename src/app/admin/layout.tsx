import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { SESSION_COOKIE_NAME, isValidSession } from "@/lib/adminSession";
import { LogoutButton } from "./logout-button";

export const metadata: Metadata = {
  title: "Admin · SickMotos",
  robots: { index: false, follow: false },
};

const NAV = [
  { label: "Dashboard", href: "/admin" },
  { label: "Bestellungen", href: "/admin/orders" },
  { label: "Bot-Chats", href: "/admin/chats" },
  { label: "Besucher", href: "/admin/visitors" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No chrome before login. When the session is missing/invalid, this layout
  // renders only the children — the login page fills the whole screen.
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const password = process.env.ADMIN_PASSWORD ?? "";
  const authed = await isValidSession(sessionCookie, password);
  if (!authed) return <>{children}</>;

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border bg-surface/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link
            href="/admin"
            className="flex items-baseline gap-3"
          >
            <span className="font-display text-xl uppercase tracking-tight text-fg">
              SickMotos
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-fg-dim">
              Admin
            </span>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.15em] text-fg-muted transition-colors hover:text-accent sm:hidden"
          >
            View site →
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-xs font-bold uppercase tracking-[0.15em] text-fg-muted transition-colors hover:text-fg"
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/"
              target="_blank"
              className="text-xs font-bold uppercase tracking-[0.15em] text-fg-dim transition-colors hover:text-accent"
            >
              View site →
            </Link>
            <LogoutButton />
          </nav>
        </div>
        <nav className="flex items-center gap-5 overflow-x-auto px-5 pb-3 sm:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.15em] text-fg-muted transition-colors hover:text-fg"
            >
              {n.label}
            </Link>
          ))}
          <LogoutButton />
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
