import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer, getCustomerToken } from "@/lib/customerStorefront";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Orders — My account — SickMotos",
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

export default async function OrdersPage() {
  if (!(await getCustomerToken())) {
    redirect("/account/login?returnTo=/account/orders");
  }

  const customer = await getCustomer();
  const orders = customer?.orders.nodes ?? [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:py-20">
      <Link
        href="/account"
        className="mb-6 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-fg-muted hover:text-accent"
      >
        <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Account
      </Link>

      <h1 className="font-display text-4xl uppercase tracking-tight md:text-5xl">
        All orders
      </h1>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border bg-surface/40 p-10 text-center">
          <p className="text-sm text-fg-muted">No orders yet.</p>
        </div>
      ) : (
        <ul className="mt-10 flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface/40">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-6">
              <div className="flex min-w-[160px] flex-col">
                <span className="font-display text-xl uppercase tracking-tight text-fg">
                  {o.name}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-fg-dim">
                  {fmtDate(o.processedAt)}
                </span>
              </div>
              <div className="flex flex-1 items-center gap-2 overflow-hidden">
                {o.lineItems.nodes.slice(0, 5).map((li, i) => (
                  <div
                    key={i}
                    className="relative size-12 shrink-0 overflow-hidden rounded border border-border bg-surface"
                    title={li.title}
                  >
                    {li.variant?.image && (
                      <Image
                        src={li.variant.image.url}
                        alt={li.variant.image.altText ?? li.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                {o.financialStatus && (
                  <span className="rounded-full border border-border-strong px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-fg-muted">
                    {o.financialStatus.toLowerCase()}
                  </span>
                )}
                {o.fulfillmentStatus && (
                  <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
                    {o.fulfillmentStatus.toLowerCase()}
                  </span>
                )}
                <span className="font-display text-xl text-fg">
                  {fmt(o.totalPrice.amount, o.totalPrice.currencyCode)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
