import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  listCorrections,
  getBotKnowledge,
  setBotKnowledge,
  deleteCorrection,
  isPersistent,
} from "@/lib/adminStore";
import { BotTest } from "./BotTest";
import { StoreNotice } from "../StoreNotice";

export const dynamic = "force-dynamic";

// Gleicher Platzhalter wie im Dashboard, als Escape damit kein Gedankenstrich
// im Quelltext steht.
const NO_VALUE = "\u2014";

async function saveDoc(formData: FormData) {
  "use server";
  await setBotKnowledge(String(formData.get("doc") || ""));
  revalidatePath("/admin/bot");
}

async function removeCorrection(formData: FormData) {
  "use server";
  await deleteCorrection(String(formData.get("id")));
  revalidatePath("/admin/bot");
}

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function BotKnowledgePage() {
  const [doc, corrections] = await Promise.all([
    getBotKnowledge(),
    listCorrections(300),
  ]);
  const persistent = isPersistent();
  // undefined heisst der Speicher hat nicht geantwortet. Der Editor muss dann
  // verborgen bleiben: sein Textfeld waere leer und ein Klick auf Speichern
  // wuerde das komplette Bot-Wissen mit einem leeren Feld ueberschreiben.
  const storeOk = doc !== undefined && corrections !== undefined;
  const knowledge = doc ?? "";
  const list = corrections ?? [];
  const chars = knowledge.length;

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8">
      <div className="mb-6">
        <h1 className="font-display text-4xl uppercase tracking-tight text-fg md:text-5xl">
          Bot-Wissen
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Deine Korrekturen fließen sofort in jede Bot-Antwort ein und
          überschreiben falsche Infos zum selben Thema. Korrekturen gibst du
          direkt unter der jeweiligen Bot-Antwort in einem Chat.
        </p>
      </div>

      {!persistent && (
        <div className="mb-6 rounded-xl border border-accent/50 bg-accent/[0.06] p-4 text-sm text-fg-muted">
          Datenspeicher wird eingerichtet. Korrekturen bleiben erst dauerhaft,
          sobald die Verbindung steht.
        </div>
      )}

      {!storeOk && <StoreNotice what="Bot-Wissen" />}

      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface/40 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fg-dim">
            Korrekturen gesamt
          </p>
          <p className="mt-1 font-display text-4xl leading-none text-fg tabular-nums">
            {storeOk ? list.length : NO_VALUE}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fg-dim">
            Wissens-Umfang
          </p>
          <p className="mt-1 font-display text-4xl leading-none text-fg tabular-nums">
            {storeOk ? chars : NO_VALUE}
          </p>
          <p className="mt-1 text-xs text-fg-muted">Zeichen</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fg-dim">
            Status
          </p>
          <p className="mt-1 font-display text-2xl leading-tight text-fg">
            {!storeOk ? NO_VALUE : knowledge.trim() ? "Aktiv" : "Leer"}
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            {!storeOk
              ? "keine Verbindung"
              : knowledge.trim()
                ? "fließt in jede Antwort ein"
                : "noch keine Korrekturen"}
          </p>
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-border bg-surface/40 p-4">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-fg">
          Test-Chat
        </h2>
        <BotTest />
      </section>

      {!storeOk ? (
        <section className="mb-8 rounded-xl border border-accent/50 bg-accent/[0.06] p-4 text-sm text-fg-muted">
          Der Wissens-Text wird ausgeblendet, solange der Speicher nicht
          antwortet. Sonst würde ein Speichern das vorhandene Wissen mit einem
          leeren Feld überschreiben.
        </section>
      ) : (
      <section className="mb-8">
        <form action={saveDoc} className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-[0.12em] text-fg">
            Was der Bot aus deinen Korrekturen gelernt hat
          </label>
          <p className="text-xs text-fg-muted">
            Wird automatisch aus deinen Korrekturen gepflegt. Du kannst hier
            direkt bearbeiten oder etwas löschen, das der Bot vergessen soll.
          </p>
          <textarea
            name="doc"
            defaultValue={knowledge}
            rows={14}
            placeholder="Noch leer. Sobald du eine Korrektur abschickst, erscheint hier das strukturierte Wissen."
            className="rounded-lg border border-border bg-bg px-3 py-2 font-mono text-xs leading-relaxed text-fg outline-none transition-colors focus:border-accent"
          />
          <button
            type="submit"
            className="self-end rounded-full bg-accent px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-accent-hi"
          >
            Wissen speichern
          </button>
        </form>
      </section>
      )}

      <section className="rounded-xl border border-border bg-surface/40">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-fg">
            Verlauf deiner Korrekturen
          </h2>
        </div>
        {!storeOk ? (
          <div className="p-8 text-center text-sm text-fg-muted">
            Verlauf kann gerade nicht geladen werden.
          </div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-sm text-fg-muted">
            Noch keine Korrekturen. Öffne einen{" "}
            <Link href="/admin/chats" className="text-accent hover:text-accent-hi">
              Bot-Chat
            </Link>{" "}
            und schreib unter eine Antwort, was der Bot hätte sagen sollen.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((c) => (
              <li key={c.id} className="flex flex-col gap-1 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[11px] text-fg-dim">
                    {fmtTime(c.at)}
                    {c.chatId && (
                      <>
                        {" · "}
                        <Link
                          href={`/admin/chats/${c.chatId}`}
                          className="text-accent hover:text-accent-hi"
                        >
                          Chat öffnen
                        </Link>
                      </>
                    )}
                  </p>
                  <form action={removeCorrection}>
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-fg-dim transition-colors hover:text-accent"
                    >
                      Aus Verlauf löschen
                    </button>
                  </form>
                </div>
                {c.question && (
                  <p className="text-xs text-fg-muted">
                    <span className="font-semibold text-fg-dim">Frage:</span>{" "}
                    {c.question.length > 140 ? c.question.slice(0, 137) + "…" : c.question}
                  </p>
                )}
                <p className="text-sm text-fg">
                  <span className="font-semibold text-accent">Korrektur:</span>{" "}
                  {c.correction}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="border-t border-border px-4 py-3 text-[11px] text-fg-dim">
          Hinweis: „Aus Verlauf löschen“ entfernt nur den Protokoll-Eintrag. Um
          etwas aus dem aktiven Bot-Wissen zu nehmen, bearbeite das Feld oben.
        </p>
      </section>
    </div>
  );
}
