import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getConversation, markReviewed, saveNote } from "@/lib/adminStore";
import { applyCorrection } from "@/lib/botCorrections";

export const dynamic = "force-dynamic";

async function toggleReviewed(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const reviewed = formData.get("reviewed") === "1";
  await markReviewed(id, reviewed);
  revalidatePath(`/admin/chats/${id}`);
  revalidatePath(`/admin/chats`);
  revalidatePath(`/admin`);
}

async function updateNote(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const note = String(formData.get("note") || "");
  await saveNote(id, note);
  revalidatePath(`/admin/chats/${id}`);
}

async function submitCorrection(formData: FormData) {
  "use server";
  const chatId = String(formData.get("chatId"));
  const question = String(formData.get("question") || "");
  const wrongAnswer = String(formData.get("wrongAnswer") || "");
  const correction = String(formData.get("correction") || "").trim();
  if (!correction) return;
  await applyCorrection({ chatId, question, wrongAnswer, correction });
  revalidatePath(`/admin/chats/${chatId}`);
  revalidatePath("/admin/bot");
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

export default async function ChatDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conv = await getConversation(id);
  if (!conv) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href="/admin/chats"
          className="text-xs font-bold uppercase tracking-[0.15em] text-fg-muted transition-colors hover:text-fg"
        >
          ← Alle Chats
        </Link>
        <form action={toggleReviewed}>
          <input type="hidden" name="id" value={conv.id} />
          <input
            type="hidden"
            name="reviewed"
            value={conv.reviewed ? "0" : "1"}
          />
          <button
            type="submit"
            className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
              conv.reviewed
                ? "border border-border-strong text-fg-muted hover:text-fg"
                : "bg-accent text-white hover:bg-accent-hi"
            }`}
          >
            {conv.reviewed
              ? "Als ungelesen markieren"
              : "Als gelesen markieren"}
          </button>
        </form>
      </div>

      <div className="mb-6">
        <h1 className="font-display text-3xl uppercase tracking-tight text-fg md:text-4xl">
          {conv.preview || "(kein Betreff)"}
        </h1>
        <p className="mt-1 text-xs text-fg-dim">
          Erste Nachricht {fmtTime(conv.createdAt)} · zuletzt{" "}
          {fmtTime(conv.updatedAt)} · {conv.messages.length} Nachrichten
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {conv.messages.map((m, i) => {
          // nearest preceding customer question, for the correction context
          let question = "";
          for (let j = i - 1; j >= 0; j--) {
            if (conv.messages[j].role === "user") {
              question = conv.messages[j].content;
              break;
            }
          }
          return (
            <li
              key={i}
              className={`flex flex-col gap-1.5 ${
                m.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "rounded-br-sm bg-accent text-white"
                    : "rounded-bl-sm bg-surface text-fg"
                }`}
              >
                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest opacity-70">
                  {m.role === "user" ? "Kunde" : "SickBot"} · {fmtTime(m.at)}
                </div>
                <div>{m.content}</div>
              </div>

              {m.role === "assistant" && (
                <details className="w-full max-w-[85%] group">
                  <summary className="inline-flex cursor-pointer items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-fg-dim transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
                    <svg viewBox="0 0 24 24" className="size-3.5 transition-transform group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth={2.4}>
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    Korrektur, was hätte der Bot sagen sollen?
                  </summary>
                  <form
                    action={submitCorrection}
                    className="mt-2 flex flex-col gap-2 rounded-xl border border-accent/40 bg-accent/[0.05] p-3"
                  >
                    <input type="hidden" name="chatId" value={conv.id} />
                    <input type="hidden" name="question" value={question} />
                    <input type="hidden" name="wrongAnswer" value={m.content} />
                    <textarea
                      name="correction"
                      rows={3}
                      required
                      placeholder="Die richtige Antwort oder Regel. Fließt sofort in den Bot ein und überschreibt falsche Infos zum selben Thema."
                      className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-accent"
                    />
                    <button
                      type="submit"
                      className="self-end rounded-full bg-accent px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-accent-hi"
                    >
                      An Bot senden
                    </button>
                  </form>
                </details>
              )}
            </li>
          );
        })}
      </ul>

      <form
        action={updateNote}
        className="mt-6 flex flex-col gap-2 rounded-xl border border-border bg-surface/40 p-4"
      >
        <input type="hidden" name="id" value={conv.id} />
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-fg-dim">
          Interne Notiz (nur für dich, geht nicht an den Bot)
        </label>
        <textarea
          name="note"
          defaultValue={conv.note ?? ""}
          rows={3}
          placeholder='z.B. "Habe Kunden per Mail nachgeholfen". Fürs Bot-Lernen die Korrektur direkt unter der Bot-Antwort nutzen.'
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-accent"
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
