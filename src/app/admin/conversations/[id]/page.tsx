import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../auth";
import { getConversation, markReviewed, saveNote } from "@/lib/adminStore";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function toggleReviewed(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const reviewed = formData.get("reviewed") === "1";
  await markReviewed(id, reviewed);
  revalidatePath(`/admin/conversations/${id}`);
  revalidatePath(`/admin/conversations`);
  revalidatePath(`/admin`);
}

async function updateNote(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const note = String(formData.get("note") || "");
  await saveNote(id, note);
  revalidatePath(`/admin/conversations/${id}`);
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ConversationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const conv = await getConversation(id);
  if (!conv) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin/conversations"
          className="text-xs font-bold uppercase tracking-wider text-fg-muted hover:text-fg"
        >
          ← Alle Chats
        </Link>
        <form action={toggleReviewed}>
          <input type="hidden" name="id" value={conv.id} />
          <input type="hidden" name="reviewed" value={conv.reviewed ? "0" : "1"} />
          <button
            type="submit"
            className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
              conv.reviewed
                ? "border border-border-strong text-fg-muted hover:text-fg"
                : "bg-accent text-white hover:bg-accent-hi"
            }`}
          >
            {conv.reviewed ? "Als ungelesen markieren" : "Als gelesen markieren"}
          </button>
        </form>
      </div>

      <div>
        <h1 className="font-display text-3xl uppercase tracking-tight md:text-4xl">
          {conv.preview || "(kein Betreff)"}
        </h1>
        <p className="mt-1 text-xs text-fg-dim">
          Erste Nachricht {fmtTime(conv.createdAt)} · zuletzt {fmtTime(conv.updatedAt)} ·{" "}
          {conv.messages.length} Nachrichten
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {conv.messages.map((m, i) => (
          <li
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "rounded-br-sm bg-accent text-white"
                  : "rounded-bl-sm bg-surface text-fg-muted"
              }`}
            >
              <div className="mb-1 text-[10px] font-bold uppercase tracking-widest opacity-70">
                {m.role === "user" ? "Kunde" : "SickBot"} · {fmtTime(m.at)}
              </div>
              <div>{m.content}</div>
            </div>
          </li>
        ))}
      </ul>

      <form action={updateNote} className="mt-4 flex flex-col gap-2 rounded-xl border border-border bg-surface/40 p-4">
        <input type="hidden" name="id" value={conv.id} />
        <label className="text-xs font-bold uppercase tracking-widest text-fg-dim">
          Interne Notiz
        </label>
        <textarea
          name="note"
          defaultValue={conv.note ?? ""}
          rows={3}
          placeholder='z.B. "Habe Kunden per Mail nachgeholfen" oder "Bot-Antwort ungenau, Wissensbasis anpassen"'
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="self-end rounded-full border border-border-strong px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-fg-muted hover:text-fg"
        >
          Notiz speichern
        </button>
      </form>
    </div>
  );
}
