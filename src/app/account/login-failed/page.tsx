import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign in failed — SickMotos",
  robots: { index: false, follow: false },
};

export default async function LoginFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const sp = await searchParams;
  const reason = sp.reason ?? "unknown";
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <span className="font-display text-5xl uppercase tracking-tight text-accent">
        Sign in failed
      </span>
      <p className="max-w-md text-sm text-fg-muted">
        We could not complete the sign-in. Most of the time this means the
        page took too long, or the browser blocked our session cookie.
      </p>
      <p className="text-[11px] uppercase tracking-[0.2em] text-fg-dim">
        Reason: {reason}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/account/login"
          className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-fg hover:bg-accent-hi"
        >
          Try again
        </Link>
        <Link
          href="/"
          className="rounded-full border border-border-strong px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-fg-muted hover:border-accent hover:text-accent"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
