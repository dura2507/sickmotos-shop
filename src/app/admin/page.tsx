import Link from "next/link";
import { isPersistent, listConversations } from "@/lib/adminStore";

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
  const conversations = await listConversations(200);
  const persistent = isPersistent();

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
          label="Chats heute"
          value={String(chatsToday)}
          sub={`${chats7d} in den letzten 7 Tagen`}
        />
        <StatCard
          label="Ungelesen"
          value={String(unreviewed)}
          sub={unreviewed > 0 ? "wollen deine Aufmerksamkeit" : "alles sauber"}
        />
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
      </section>

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
