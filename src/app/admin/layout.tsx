import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <nav className="mb-8 flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-6">
          <Link
            href="/admin"
            className="font-display text-xl uppercase tracking-tight text-fg hover:text-accent"
          >
            SickMotos · Admin
          </Link>
          <div className="flex gap-4 text-xs font-bold uppercase tracking-wider text-fg-muted">
            <Link href="/admin" className="hover:text-fg">
              Übersicht
            </Link>
            <Link href="/admin/conversations" className="hover:text-fg">
              Bot-Chats
            </Link>
          </div>
        </div>
        <form action="/api/admin/logout" method="post">
          <button
            type="submit"
            className="text-[10px] font-bold uppercase tracking-widest text-fg-dim hover:text-accent"
          >
            Logout
          </button>
        </form>
      </nav>
      {children}
    </div>
  );
}
