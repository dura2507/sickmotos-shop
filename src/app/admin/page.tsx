import Link from "next/link";
import { requireAdmin } from "./auth";
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

export default async function AdminHome() {
  await requireAdmin();
  const conversations = await listConversations(50);
  const persistent = isPersistent();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = conversations.filter((c) => c.createdAt >= today.getTime()).length;
  const unreviewed = conversations.filter((c) => !c.reviewed).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl uppercase tracking-tight md:text-5xl">
          Übersicht
        </h1>
        <p className="text-sm text-fg-muted">
          Live-Blick auf SickBot. Details in den einzelnen Bereichen.
        </p>
      </div>

      {!persistent && (
        <div className="rounded-xl border border-accent/40 bg-accent/[0.06] p-4 text-sm text-fg">
          <p className="font-semibold text-accent">Achtung: Kein persistenter Speicher aktiv.</p>
          <p className="mt-1 text-fg-muted">
            Um Bot-Konversationen dauerhaft zu speichern, in Vercel Marketplace
            eine Upstash Redis Instanz anlegen und die Env-Variablen{" "}
            <code className="rounded bg-surface-2 px-1">KV_REST_API_URL</code> +{" "}
            <code className="rounded bg-surface-2 px-1">KV_REST_API_TOKEN</code>{" "}
            hinzufügen. Aktuell werden Chats nur im Speicher gehalten, ein
            Server-Neustart löscht sie.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Bot-Chats heute" value={String(todayCount)} />
        <Stat label="Ungelesen" value={String(unreviewed)} tone={unreviewed > 0 ? "accent" : undefined} />
        <Stat label="Chats insgesamt (letzte 50)" value={String(conversations.length)} />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl uppercase tracking-tight">
            Neueste Bot-Chats
          </h2>
          <Link
            href="/admin/conversations"
            className="text-xs font-bold uppercase tracking-wider text-accent hover:text-accent-hi"
          >
            Alle anzeigen →
          </Link>
        </div>
        {conversations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/40 p-8 text-center text-sm text-fg-muted">
            Noch keine Bot-Konversationen erfasst.
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface/40">
            {conversations.slice(0, 8).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/conversations/${c.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-surface/80"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      {!c.reviewed && (
                        <span className="inline-flex size-1.5 shrink-0 rounded-full bg-accent" aria-label="neu" />
                      )}
                      <p className="truncate text-sm text-fg">{c.preview || "(kein Text)"}</p>
                    </div>
                    <p className="text-xs text-fg-dim">
                      {c.messages.length} Nachrichten · vor {timeAgo(c.updatedAt)}
                    </p>
                  </div>
                  <span className="text-xs text-fg-dim">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "accent" }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface/40 p-4">
      <span className="text-[10px] font-bold uppercase tracking-widest text-fg-dim">
        {label}
      </span>
      <span
        className={`font-display text-3xl ${
          tone === "accent" ? "text-accent" : "text-fg"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
