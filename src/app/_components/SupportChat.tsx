"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING =
  "Hey, I'm SickBot, your go-to for anything supermoto: shipping, fitment, converters, payments, returns or parts. How can I help?";

const SUGGESTIONS = [
  "How long does shipping take?",
  "Does it fit my bike?",
  "Which payment methods?",
  "What's your return policy?",
];

// Light markdown rendering for the bot's replies: **bold**, "- " bullets and
// line breaks — so structured answers look clean instead of showing raw **.
function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part) ? (
      <strong key={i} className="font-semibold text-fg">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function renderRich(text: string): ReactNode {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = (key: string) => {
    if (bullets.length) {
      blocks.push(
        <ul key={key} className="my-1 list-disc space-y-0.5 pl-4">
          {bullets.map((b, i) => (
            <li key={i}>{renderInline(b)}</li>
          ))}
        </ul>
      );
      bullets = [];
    }
  };
  lines.forEach((line, i) => {
    const t = line.trim();
    const m = t.match(/^[-*•]\s+(.*)/);
    if (m) {
      bullets.push(m[1]);
    } else {
      flush(`ul-${i}`);
      if (t) blocks.push(<p key={`p-${i}`} className="[&:not(:first-child)]:mt-1.5">{renderInline(t)}</p>);
    }
  });
  flush("ul-end");
  return blocks;
}

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

  // Let any "Ask the SickBot" CTA on the page open the chat.
  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener("sickmotos:open-chat", openChat);
    return () => window.removeEventListener("sickmotos:open-chat", openChat);
  }, []);

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
            "Something went wrong — please try again in a moment.",
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Connection issue — please try again in a moment.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Launcher: closed shows an animated "Ask SickBot" nudge + pulsing
          button; open shows the close button. */}
      {open ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close chat"
          className="fixed bottom-4 right-4 z-30 grid size-12 place-items-center rounded-full bg-accent text-fg shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-6 md:right-6 md:size-14"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      ) : (
        <div className="fixed bottom-4 right-4 z-30 flex items-center gap-2.5 md:bottom-6 md:right-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="float-y pop-in rounded-full border border-accent/40 bg-bg/90 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-fg shadow-lg backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
          >
            Ask <span className="text-accent">SickBot</span>
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open chat"
            className="pulse-accent grid size-12 shrink-0 place-items-center rounded-full bg-accent text-fg shadow-lg transition-transform hover:scale-110 active:scale-95 md:size-14"
          >
            <svg viewBox="0 0 24 24" className="size-6 md:size-7" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 11.5a8.5 8.5 0 01-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1121 11.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      {open && (
        <div className="fixed bottom-20 right-4 z-40 flex h-[60vh] max-h-[520px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-bg shadow-2xl md:bottom-24 md:right-6">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-fg">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 11.5a8.5 8.5 0 01-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1121 11.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="min-w-0">
              <div className="font-display text-base uppercase tracking-wide text-fg">
                SickBot
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-fg-dim">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-70" />
                  <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                </span>
                Online
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "flex justify-end"
                    : "flex items-end justify-start gap-2"
                }
              >
                {m.role === "assistant" && (
                  <span className="grid size-7 shrink-0 place-items-center self-end rounded-full bg-accent text-fg">
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M21 11.5a8.5 8.5 0 01-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1121 11.5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "whitespace-pre-wrap rounded-br-sm bg-accent text-fg"
                      : "rounded-bl-sm bg-surface text-fg-muted"
                  }`}
                >
                  {m.role === "assistant" ? renderRich(m.content) : m.content}
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
              <div className="flex flex-col items-start gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-surface/60 px-3.5 py-2 text-xs text-fg-muted transition-colors hover:border-accent hover:text-fg"
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
