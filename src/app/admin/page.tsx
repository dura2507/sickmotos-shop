import Link from "next/link";
import { isPersistent, listConversations } from "@/lib/adminStore";
import { loadAnalytics } from "@/lib/analyticsStore";
import { loadOrdersSnapshot, formatEUR, customerName } from "@/lib/orders";

export const dynamic = "force-dynamic";

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

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

export default async function AdminHome() {
  const [conversations, analytics, orders] = await Promise.all([
    listConversations(200),
    loadAnalytics(),
    loadOrdersSnapshot(),
  ]);
  const persistent = isPersistent();
  const maxDay = analytics.perDay.reduce((m, d) => Math.max(m, d.views), 0);
  const todaysVisitors = analytics.perDay[analytics.perDay.length - 1]?.visitors ?? 0;
  const todaysViews = analytics.perDay[analytics.perDay.length - 1]?.views ?? 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const midnight = today.getTime();
  const last7 = midnight - 6 * 24 * 60 * 60 * 1000;
  const chatsToday = conversations.filter((c) => c.createdAt >= midnight).length;
  const chats7d = conversations.filter((c) => c.createdAt >= last7).length;
  const unreviewed = conversations.filter((c) => !c.reviewed).length;

  const totalMessages = conversations.reduce(
    (sum, c) => sum + c.messages.length,
    0
  );
  const avgMsgs =
    conversations.length > 0
      ? (totalMessages / conversations.length).toFixed(1)
      : "0";

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-display text-4xl uppercase tracking-tight text-fg md:text-5xl">
          Dashboard
        </h1>
        <p className="text-xs text-fg-muted">
          SickBot Support · {new Date().toLocaleDateString("de-DE")}
        </p>
      </div>

      {!persistent && (
        <div className="mb-6 rounded-xl border border-accent/50 bg-accent/[0.06] p-4">
          <p className="font-semibold text-accent">
            Kein persistenter Speicher aktiv
          </p>
          <p className="mt-1 text-sm text-fg-muted">
            Bot-Chats gehen beim nächsten Server-Neustart verloren. In Vercel →
            Storage → Upstash Redis anlegen und die Env-Variablen{" "}
            <code className="rounded bg-surface-2 px-1">KV_REST_API_URL</code>{" "}
            +{" "}
            <code className="rounded bg-surface-2 px-1">KV_REST_API_TOKEN</code>{" "}
            eintragen.
          </p>
        </div>
      )}

      <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Umsatz heute"
          value={formatEUR(orders.todayRevenueEUR)}
          sub={
            orders.todayOrderCount === 1
              ? "1 Bestellung"
              : `${orders.todayOrderCount} Bestellungen`
          }
        />
        <StatCard
          label="Besucher heute"
          value={String(todaysVisitors)}
          sub={`${todaysViews} Seitenaufrufe`}
        />
        <StatCard
          label="Chats heute"
          value={String(chatsToday)}
          sub={`${chats7d} in den letzten 7 Tagen`}
        />
        <StatCard
          label="Ungelesen"
          value={String(unreviewed)}
          sub={unreviewed > 0 ? "wollen deine Aufmerksamkeit" : "alles sauber"}
        />
      </section>

      <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Umsatz 7 Tage"
          value={formatEUR(orders.revenue7dEUR)}
          sub={`${orders.orders7dCount} Bestellungen`}
        />
        <StatCard
          label="Umsatz 30 Tage"
          value={formatEUR(orders.revenue30dEUR)}
          sub={`${orders.orders30dCount} Bestellungen`}
        />
        <StatCard
          label="Besucher 7 Tage"
          value={String(analytics.totalVisitors7d)}
          sub={`${analytics.totalViews7d} Seitenaufrufe`}
        />
      </section>

      <section className="mb-8 rounded-xl border border-border bg-surface/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-fg-dim">
            Besucher letzte 30 Tage
          </h2>
          <Link
            href="/admin/visitors"
            className="text-[11px] font-bold uppercase tracking-widest text-accent hover:text-accent-hi"
          >
            Details →
          </Link>
        </div>
        {maxDay === 0 ? (
          <p className="text-xs text-fg-muted">
            Noch keine Besuche gezählt. Sobald jemand die Seite aufruft,
            erscheint hier ein Balken.
          </p>
        ) : (
          <>
            <div className="flex h-24 items-end gap-1">
              {analytics.perDay.map((d) => {
                const heightPct = maxDay > 0 ? (d.views / maxDay) * 100 : 0;
                return (
                  <div
                    key={d.date}
                    className="group relative flex h-full flex-1 flex-col items-center justify-end"
                    title={`${d.date}: ${d.views} Aufrufe · ${d.visitors} Besucher`}
                  >
                    <div
                      className="w-full bg-accent/70 transition-colors hover:bg-accent"
                      style={{
                        height: `${heightPct}%`,
                        minHeight: d.views > 0 ? "2px" : "0",
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-fg-dim">
              <span>{analytics.perDay[0]?.date.slice(5)}</span>
              <span>heute</span>
            </div>
          </>
        )}
      </section>

      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Ø Nachrichten/Chat"
          value={avgMsgs}
          sub={`${totalMessages} insgesamt`}
        />
        <StatCard
          label="Chats gesamt"
          value={String(conversations.length)}
          sub="in Live-Ansicht"
        />
        <StatCard
          label="Top-Land 30 T"
          value={
            analytics.topCountries[0]?.key === "??"
              ? "?"
              : analytics.topCountries[0]?.key ?? "—"
          }
          sub={
            analytics.topCountries[0]
              ? `${analytics.topCountries[0].views} Aufrufe`
              : "keine Daten"
          }
        />
        <StatCard
          label="Top-Referrer 30 T"
          value={
            analytics.topReferrers[0]?.key.slice(0, 12) ?? "—"
          }
          sub={
            analytics.topReferrers[0]
              ? `${analytics.topReferrers[0].views} Aufrufe`
              : "keine Daten"
          }
        />
      </section>

      {orders.recent.length > 0 && (
        <section className="mb-6 rounded-xl border border-border bg-surface/40">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-fg">
              Neueste Bestellungen
            </h2>
            <Link
              href="/admin/orders"
              className="text-[11px] font-bold uppercase tracking-widest text-accent hover:text-accent-hi"
            >
              Alle anzeigen →
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {orders.recent.slice(0, 5).map((o) => {
              const t = new Date(o.createdAt).toLocaleString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <li key={o.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-fg">
                        {o.name}
                      </span>
                      <span className="text-xs text-fg-muted line-clamp-1">
                        {customerName(o)}
                      </span>
                    </div>
                    <p className="text-[11px] text-fg-dim">{t}</p>
                  </div>
                  <p className="shrink-0 font-mono text-sm font-bold text-fg tabular-nums">
                    {formatEUR(Number.parseFloat(o.totalPrice.amount))}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-border bg-surface/40">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-fg">
            Neueste Bot-Chats
          </h2>
          <Link
            href="/admin/chats"
            className="text-[11px] font-bold uppercase tracking-widest text-accent hover:text-accent-hi"
          >
            Alle anzeigen →
          </Link>
        </div>
        {conversations.length === 0 ? (
          <div className="p-10 text-center text-sm text-fg-muted">
            Noch keine Chats erfasst. Sobald Kunden mit SickBot sprechen,
            landen sie hier.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {conversations.slice(0, 8).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/chats/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface/80"
                >
                  <span
                    className={`size-2 shrink-0 rounded-full ${
                      c.reviewed ? "bg-border-strong" : "bg-accent"
                    }`}
                    aria-hidden
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="line-clamp-1 text-sm text-fg">
                      {c.preview || "(kein Text)"}
                    </p>
                    <p className="text-[11px] text-fg-dim">
                      {c.messages.length} Nachrichten · vor{" "}
                      {timeAgo(c.updatedAt)}
                    </p>
                  </div>
                  <span className="text-fg-dim">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
