"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export function BotTest() {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);

  async function send() {
    const q = input.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: data.reply || data.error || "Fehler." },
      ]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Verbindungsfehler." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
        {msgs.length === 0 && (
          <p className="text-xs text-fg-muted">
            Stell hier eine Frage wie ein Kunde. Die Antwort nutzt bereits alle
            Korrekturen, so prüfst du ob deine Korrektur wirkt.
          </p>
        )}
        {msgs.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                m.role === "user"
                  ? "rounded-br-sm bg-accent text-white"
                  : "rounded-bl-sm bg-surface text-fg"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && <p className="text-xs text-fg-dim">SickBot denkt …</p>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Testfrage eingeben …"
          className="min-w-0 flex-1 rounded-full border border-border bg-bg px-4 py-2.5 text-sm text-fg outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="shrink-0 rounded-full bg-accent px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-accent-hi disabled:opacity-50"
        >
          Fragen
        </button>
      </form>
    </div>
  );
}
