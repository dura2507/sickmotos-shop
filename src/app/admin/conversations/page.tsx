import Link from "next/link";
import { requireAdmin } from "../auth";
import { listConversations } from "@/lib/adminStore";

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

export default async function AdminConversations({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireAdmin();
  const { filter } = await searchParams;
  const all = await listConversations(200);
  const list = filter === "new" ? all.filter((c) => !c.reviewed) : all;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-4xl uppercase tracking-tight">
          Bot-Chats
        </h1>
        <div className="flex gap-3 text-xs font-bold uppercase tracking-wider">
          <Link
            href="/admin/conversations"
            className={filter !== "new" ? "text-accent" : "text-fg-muted hover:text-fg"}
          >
            Alle ({all.length})
          </Link>
          <Link
            href="/admin/conversations?filter=new"
            className={filter === "new" ? "text-accent" : "text-fg-muted hover:text-fg"}
          >
            Ungelesen ({all.filter((c) => !c.reviewed).length})
          </Link>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/40 p-10 text-center text-sm text-fg-muted">
          Keine Konversationen.
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface/40">
          {list.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/conversations/${c.id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface/80"
              >
                <span
                  className={`size-2 shrink-0 rounded-full ${
                    c.reviewed ? "bg-border" : "bg-accent"
                  }`}
                  aria-label={c.reviewed ? "gelesen" : "neu"}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="line-clamp-1 text-sm text-fg">
                    {c.preview || "(kein Text)"}
                  </p>
                  <p className="text-xs text-fg-dim">
                    {c.messages.length} Nachrichten · aktualisiert vor {timeAgo(c.updatedAt)}
                  </p>
                </div>
                <span className="text-xs text-fg-dim">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
