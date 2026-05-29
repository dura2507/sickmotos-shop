import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer, getCustomerToken } from "@/lib/customerStorefront";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "My account — SickMotos",
  robots: { index: false, follow: false },
};

const fmt = (amount: string, currency: string) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(
    parseFloat(amount)
  );

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default async function AccountPage() {
  if (!(await getCustomerToken())) redirect("/account/login");

  const customer = await getCustomer();

  if (!customer) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <h1 className="font-display text-4xl uppercase tracking-tight">
          My account
        </h1>
        <p className="mt-4 text-sm text-fg-muted">
          Your session has expired. Please sign in again.
        </p>
        <Link
          href="/account/logout"
          className="mt-6 inline-block rounded-full border border-border-strong px-4 py-2 text-xs font-bold uppercase tracking-wider text-fg-muted hover:border-accent hover:text-accent"
        >
          Sign out
        </Link>
      </div>
    );
  }

  const c = customer;
  const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
  const greeting = fullName || c.email || "Welcome back";
  const recent = c.orders.nodes;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:py-20">
      <header className="mb-10 flex flex-col gap-3 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
            My account
          </span>
          <h1 className="mt-2 font-display text-4xl uppercase tracking-tight md:text-5xl">
            Hi, {greeting}.
          </h1>
          {c.email && (
            <p className="mt-2 text-sm text-fg-muted">{c.email}</p>
          )}
        </div>
        <Link
          href="/account/logout"
          className="self-start rounded-full border border-border-strong px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-fg-muted transition-colors hover:border-accent hover:text-accent"
        >
          Sign out
        </Link>
      </header>

      <section className="mb-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-2xl uppercase tracking-tight md:text-3xl">
            Recent orders
          </h2>
          {recent.length > 0 && (
            <Link
              href="/account/orders"
              className="text-[11px] font-bold uppercase tracking-wider text-accent hover:text-accent-hi"
            >
              All orders →
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface/40 p-10 text-center">
            <p className="text-sm text-fg-muted">No orders yet.</p>
            <Link
              href="/shop"
              className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-fg hover:bg-accent-hi"
            >
              Shop the catalog
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface/40">
            {recent.slice(0, 5).map((o) => (
              <li key={o.id}>
                <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-6">
                  <div className="flex min-w-[140px] flex-col">
                    <span className="font-display text-lg uppercase tracking-tight text-fg">
                      {o.name}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-fg-dim">
                      {fmtDate(o.processedAt)}
                    </span>
                  </div>
                  <div className="flex flex-1 items-center gap-2 overflow-hidden">
                    {o.lineItems.nodes.slice(0, 3).map((li, i) => (
                      <div
                        key={i}
                        className="relative size-10 shrink-0 overflow-hidden rounded border border-border bg-surface"
                        title={li.title}
                      >
                        {li.variant?.image && (
                          <Image
                            src={li.variant.image.url}
                            alt={li.variant.image.altText ?? li.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        )}
                      </div>
                    ))}
                    <span className="ml-2 truncate text-xs text-fg-muted">
                      {o.lineItems.nodes.map((l) => l.title).join(", ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {o.fulfillmentStatus && (
                      <span className="rounded-full border border-border-strong px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-fg-muted">
                        {o.fulfillmentStatus.toLowerCase()}
                      </span>
                    )}
                    <span className="font-display text-lg text-fg">
                      {fmt(o.totalPrice.amount, o.totalPrice.currencyCode)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface/40 p-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-fg-dim">
            Default address
          </span>
          {c.defaultAddress ? (
            <p className="mt-2 text-sm text-fg-muted">
              {c.defaultAddress.address1}
              <br />
              {c.defaultAddress.city}
              {c.defaultAddress.countryCodeV2
                ? `, ${c.defaultAddress.countryCodeV2}`
                : null}
            </p>
          ) : (
            <p className="mt-2 text-sm text-fg-dim">No address saved yet.</p>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-surface/40 p-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-fg-dim">
            Need help?
          </span>
          <p className="mt-2 text-sm text-fg-muted">
            Drop us a line — fastest way is WhatsApp.
          </p>
          <a
            href="https://wa.me/4917634658003"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-full border border-border-strong px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-fg-muted hover:border-accent hover:text-accent"
          >
            WhatsApp the crew →
          </a>
        </div>
      </section>
    </div>
  );
}
