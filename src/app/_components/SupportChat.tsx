"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING =
  "Hey! 👋 I'm the SickMotos assistant. Ask me about shipping, fitment, payments, returns or our parts. For order status or a custom setup, I'll point you to WhatsApp.";

const SUGGESTIONS = [
  "How long does shipping take?",
  "Does it fit my bike?",
  "Which payment methods?",
  "What's your return policy?",
];

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send only the real conversation (skip the canned greeting).
        body: JSON.stringify({ messages: next.slice(1) }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            data.reply ||
            data.error ||
            "Something went wrong — please message us on WhatsApp.",
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Connection issue — please message us on WhatsApp.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Launcher — sits above the WhatsApp button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="float-y fixed bottom-20 right-4 z-30 grid size-12 place-items-center rounded-full bg-accent text-fg shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-24 md:right-6 md:size-14"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-6 md:size-7" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 11.5a8.5 8.5 0 01-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1121 11.5z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed bottom-36 right-4 z-40 flex h-[60vh] max-h-[520px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-bg shadow-2xl md:bottom-40 md:right-6">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
            <span className="grid size-8 place-items-center rounded-full bg-accent/15">
              <span className="size-2.5 rounded-full bg-accent" />
            </span>
            <div className="min-w-0">
              <div className="font-display text-sm uppercase tracking-wide text-fg">
                SickMotos Assistant
              </div>
              <div className="text-[11px] text-fg-dim">Usually replies instantly</div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-sm bg-accent text-fg"
                      : "rounded-bl-sm bg-surface text-fg-muted"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-surface px-3.5 py-2.5 text-fg-dim">
                  <span className="inline-flex gap-1">
                    <span className="size-1.5 animate-bounce rounded-full bg-fg-dim [animation-delay:-0.3s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-fg-dim [animation-delay:-0.15s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-fg-dim" />
                  </span>
                </div>
              </div>
            )}

            {/* Quick suggestions, only before the first user message */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-fg-muted transition-colors hover:border-accent hover:text-fg"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border bg-surface/60 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="min-w-0 flex-1 rounded-full border border-border bg-bg px-4 py-2.5 text-sm text-fg outline-none placeholder:text-fg-dim focus:border-accent"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-fg transition-colors hover:bg-accent-hi disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-dim"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2}>
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
