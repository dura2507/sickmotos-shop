import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer, getCustomerToken } from "@/lib/customerStorefront";
import { AskSickBot } from "@/app/_components/AskSickBot";
import { getLocale } from "@/lib/i18n/getLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata() {
  const dict = await getDictionary(await getLocale());
  return {
    title: dict.account.metaTitle,
    robots: { index: false, follow: false },
  };
}

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
  const dict = await getDictionary(await getLocale());

  if (!(await getCustomerToken())) redirect("/account/login");

  const customer = await getCustomer();

  if (!customer) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <h1 className="font-display text-4xl uppercase tracking-tight">
          {dict.account.heading}
        </h1>
        <p className="mt-4 text-sm text-fg-muted">
          {dict.account.sessionExpired}
        </p>
        <Link
          href="/account/logout"
          className="mt-6 inline-block rounded-full border border-border-strong px-4 py-2 text-xs font-bold uppercase tracking-wider text-fg-muted hover:border-accent hover:text-accent"
        >
          {dict.account.signOut}
        </Link>
      </div>
    );
  }

  const c = customer;
  const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
  const greeting = fullName || c.email || dict.account.welcomeBack;
  const recent = c.orders.nodes;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:py-20">
      <header className="mb-10 flex flex-col gap-3 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
            {dict.account.heading}
          </span>
          <h1 className="mt-2 font-display text-4xl uppercase tracking-tight md:text-5xl">
            {dict.account.greeting.replace("{greeting}", greeting)}
          </h1>
          {c.email && (
            <p className="mt-2 text-sm text-fg-muted">{c.email}</p>
          )}
        </div>
        <Link
          href="/account/logout"
          className="self-start rounded-full border border-border-strong px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-fg-muted transition-colors hover:border-accent hover:text-accent"
        >
          {dict.account.signOut}
        </Link>
      </header>

      <section className="mb-10">
        <Link
          href="/account/bikes"
          className="group mb-8 flex items-center gap-4 rounded-2xl border border-accent/40 bg-accent/[0.06] p-5 transition-colors hover:border-accent"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="6" cy="17" r="4" />
              <circle cx="18" cy="17" r="4" />
              <path d="M6 17l4-7h5l3 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="flex-1">
            <p className="font-display text-lg uppercase tracking-tight text-fg">
              {dict.account.garageCardTitle}
            </p>
            <p className="text-xs text-fg-muted">
              {dict.account.garageCardSubtitle}
            </p>
          </div>
          <svg viewBox="0 0 24 24" className="size-5 text-fg-muted transition-colors group-hover:text-accent" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-2xl uppercase tracking-tight md:text-3xl">
            {dict.account.recentOrders}
          </h2>
          {recent.length > 0 && (
            <Link
              href="/account/orders"
              className="text-[11px] font-bold uppercase tracking-wider text-accent hover:text-accent-hi"
            >
              {dict.account.allOrdersLink}
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface/40 p-10 text-center">
            <p className="text-sm text-fg-muted">{dict.account.noOrders}</p>
            <Link
              href="/shop"
              className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-fg hover:bg-accent-hi"
            >
              {dict.account.shopCatalog}
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
            {dict.account.defaultAddress}
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
            <p className="mt-2 text-sm text-fg-dim">{dict.account.noAddress}</p>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-surface/40 p-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-fg-dim">
            {dict.account.needHelp}
          </span>
          <p className="mt-2 text-sm text-fg-muted">
            {dict.account.needHelpBody}
          </p>
          <AskSickBot
            variant="ghost"
            label={dict.account.askSickBot}
            className="mt-3"
          />
        </div>
      </section>
    </div>
  );
}
