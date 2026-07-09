import {
  loadOrdersSnapshot,
  formatEUR,
  customerName,
  type OrderSummary,
} from "@/lib/orders";
import { hasAdminToken } from "@/lib/shopifyAdmin";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fg-dim">
        {label}
      </p>
      <p className="mt-1 font-display text-4xl leading-none text-fg tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-fg-muted">{sub}</p>
    </div>
  );
}

function financialStatusStyle(s: string | null): string {
  const key = (s ?? "").toLowerCase();
  if (key.includes("paid")) return "bg-accent/15 text-accent";
  if (key.includes("pending") || key.includes("authorized"))
    return "bg-amber-500/15 text-amber-300";
  if (key.includes("refund")) return "bg-fg-dim/15 text-fg-dim";
  return "bg-surface-2 text-fg-muted";
}

function OrderRow({ o }: { o: OrderSummary }) {
  const d = new Date(o.createdAt);
  const time = d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-fg">
            {o.name}
          </span>
          {o.displayFinancialStatus && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${financialStatusStyle(
                o.displayFinancialStatus
              )}`}
            >
              {o.displayFinancialStatus}
            </span>
          )}
        </div>
        <p className="line-clamp-1 text-sm text-fg-muted">
          {customerName(o)}
        </p>
        <p className="text-[11px] text-fg-dim">
          {time} · {o.lineItemsCount === 1 ? "1 Position" : `${o.lineItemsCount} Positionen`}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-base font-bold text-fg tabular-nums">
          {formatEUR(Number.parseFloat(o.totalPrice.amount))}
        </p>
      </div>
    </li>
  );
}

export default async function AdminOrders() {
  const configured = hasAdminToken();
  const data = await loadOrdersSnapshot();
  const maxDay = data.perDay.reduce((m, d) => Math.max(m, d.revenue), 0);
  const orderTrend =
    data.yesterdayOrderCount === 0
      ? data.todayOrderCount > 0
        ? "+"
        : ""
      : `${data.todayOrderCount >= data.yesterdayOrderCount ? "+" : ""}${
          data.todayOrderCount - data.yesterdayOrderCount
        } vs gestern`;

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-display text-4xl uppercase tracking-tight text-fg md:text-5xl">
          Bestellungen
        </h1>
        <p className="text-xs text-fg-muted">
          Shopify Admin · live · in Deutsch
        </p>
      </div>

      {!configured && (
        <div className="mb-6 rounded-xl border border-accent/50 bg-accent/[0.06] p-4">
          <p className="font-semibold text-accent">
            Kein Shopify Admin API Token gesetzt
          </p>
          <p className="mt-1 text-sm text-fg-muted">
            In Vercel → Environment Variables{" "}
            <code className="rounded bg-surface-2 px-1">SHOPIFY_ADMIN_API_TOKEN</code>{" "}
            hinterlegen. Token generierst du in Shopify Admin → Settings → Apps
            → Develop apps → App erstellen → Admin API access → read_orders.
          </p>
        </div>
      )}

      <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Umsatz heute"
          value={formatEUR(data.todayRevenueEUR)}
          sub={
            data.todayOrderCount === 1
              ? "1 Bestellung"
              : `${data.todayOrderCount} Bestellungen`
          }
        />
        <StatCard
          label="Umsatz 7 Tage"
          value={formatEUR(data.revenue7dEUR)}
          sub={`${data.orders7dCount} Bestellungen`}
        />
        <StatCard
          label="Umsatz 30 Tage"
          value={formatEUR(data.revenue30dEUR)}
          sub={`${data.orders30dCount} Bestellungen`}
        />
        <StatCard
          label="Ø Warenkorb 30 T"
          value={
            data.orders30dCount > 0
              ? formatEUR(data.revenue30dEUR / data.orders30dCount)
              : formatEUR(0)
          }
          sub={orderTrend}
        />
      </section>

      <section className="mb-8 rounded-xl border border-border bg-surface/40 p-4">
        <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-fg-dim">
          Umsatz letzte 30 Tage
        </h2>
        {maxDay === 0 ? (
          <p className="text-xs text-fg-muted">
            Noch keine Bestellungen im 30-Tage-Fenster.
          </p>
        ) : (
          <>
            <div className="flex h-32 items-end gap-1">
              {data.perDay.map((d) => {
                const heightPct = maxDay > 0 ? (d.revenue / maxDay) * 100 : 0;
                return (
                  <div
                    key={d.date}
                    className="group relative flex h-full flex-1 flex-col items-center justify-end"
                    title={`${d.date}: ${formatEUR(d.revenue)} · ${d.orders} Bestellungen`}
                  >
                    <div
                      className="w-full bg-accent/70 transition-colors hover:bg-accent"
                      style={{
                        height: `${heightPct}%`,
                        minHeight: d.revenue > 0 ? "2px" : "0",
                      }}
                    />
                    <span className="invisible absolute bottom-full z-10 mb-1 whitespace-nowrap rounded border border-border bg-bg px-1.5 py-0.5 text-[10px] font-bold text-fg group-hover:visible">
                      {formatEUR(d.revenue)} · {d.orders}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-fg-dim">
              <span>{data.perDay[0]?.date.slice(5)}</span>
              <span>heute</span>
            </div>
          </>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface/40">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-fg">
            Neueste Bestellungen
          </h2>
        </div>
        {data.recent.length === 0 ? (
          <div className="p-10 text-center text-sm text-fg-muted">
            {configured
              ? "Keine Bestellungen in den letzten 30 Tagen."
              : "Setze SHOPIFY_ADMIN_API_TOKEN, dann erscheinen hier die Bestellungen live."}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {data.recent.map((o) => (
              <OrderRow key={o.id} o={o} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
