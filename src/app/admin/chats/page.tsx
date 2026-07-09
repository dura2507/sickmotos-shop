import Link from "next/link";
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

export default async function AdminChats({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const all = await listConversations(200);
  const list = filter === "new" ? all.filter((c) => !c.reviewed) : all;
  const unreviewed = all.filter((c) => !c.reviewed).length;

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-display text-4xl uppercase tracking-tight text-fg md:text-5xl">
          Bot-Chats
        </h1>
        <div className="flex gap-4 text-xs font-bold uppercase tracking-[0.15em]">
          <Link
            href="/admin/chats"
            className={
              filter !== "new"
                ? "text-accent"
                : "text-fg-muted hover:text-fg"
            }
          >
            Alle ({all.length})
          </Link>
          <Link
            href="/admin/chats?filter=new"
            className={
              filter === "new"
                ? "text-accent"
                : "text-fg-muted hover:text-fg"
            }
          >
            Ungelesen ({unreviewed})
          </Link>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/40 p-10 text-center text-sm text-fg-muted">
          {filter === "new"
            ? "Keine ungelesenen Chats."
            : "Noch keine Chats erfasst."}
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface/40">
          {list.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/chats/${c.id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface/80"
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
                    {c.messages.length} Nachrichten · vor {timeAgo(c.updatedAt)}
                  </p>
                </div>
                <span className="text-fg-dim">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
