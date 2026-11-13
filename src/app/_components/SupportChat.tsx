"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useDictionary, useLocale } from "./LocaleProvider";

// Agency credit under the input. krileo.de is the German site, krileo.com
// the English one, so German visitors land on German.
const KRILEO_UTM = "?utm_source=sickmotos-shop&utm_medium=chatbot";

type Msg = { role: "user" | "assistant"; content: string };

// Nur Links auf sickmotos.com werden klickbar (die Route hat erfundene
// Produktlinks schon entfernt). Interne Links laufen ueber next/link, dann
// bleibt der Chat beim Seitenwechsel offen und der Verlauf erhalten.
function internalPath(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.hostname !== "sickmotos.com" && u.hostname !== "www.sickmotos.com") return null;
    return u.pathname + u.search;
  } catch {
    return null;
  }
}

function renderLink(url: string, label: string, key: number, onNav?: () => void): ReactNode {
  const path = internalPath(url);
  if (!path) return <span key={key}>{label}</span>;
  return (
    <Link
      key={key}
      href={path}
      onClick={onNav}
      className="font-semibold text-accent underline underline-offset-2 [overflow-wrap:anywhere] hover:text-accent-hi"
    >
      {label}
    </Link>
  );
}

// Light markdown rendering for the bot's replies: **bold**, [links](url),
// bare sickmotos.com URLs, "- " bullets and line breaks.
const INLINE_TOKEN = /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s)\]]+|\*\*[^*]+\*\*)/g;

function renderInline(text: string, onNav?: () => void): ReactNode[] {
  const out: ReactNode[] = [];
  text.split(INLINE_TOKEN).forEach((part, i) => {
    if (!part) return;
    const md = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (md) {
      out.push(renderLink(md[2], md[1].replace(/\*\*/g, ""), i, onNav));
      return;
    }
    if (/^https?:\/\//.test(part)) {
      const trail = part.match(/[.,;:!?]+$/)?.[0] ?? "";
      const url = trail ? part.slice(0, -trail.length) : part;
      const path = internalPath(url);
      const label = path ? "sickmotos.com" + (path.length > 34 ? path.slice(0, 33) + "…" : path) : url;
      out.push(renderLink(url, label, i, onNav));
      if (trail) out.push(<span key={`${i}-t`}>{trail}</span>);
      return;
    }
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      out.push(
        <strong key={i} className="font-semibold text-fg">
          {part.slice(2, -2)}
        </strong>
      );
      return;
    }
    out.push(<span key={i}>{part}</span>);
  });
  return out;
}

function renderRich(text: string, onNav?: () => void): ReactNode {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = (key: string) => {
    if (bullets.length) {
      blocks.push(
        <ul key={key} className="my-1 list-disc space-y-0.5 pl-4">
          {bullets.map((b, i) => (
            <li key={i}>{renderInline(b, onNav)}</li>
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
      if (t) blocks.push(<p key={`p-${i}`} className="[&:not(:first-child)]:mt-1.5">{renderInline(t, onNav)}</p>);
    }
  });
  flush("ul-end");
  return blocks;
}

export function SupportChat() {
  const dict = useDictionary();
  const locale = useLocale();
  const bot = dict.bot;
  const krileoUrl =
    (locale === "de" ? "https://krileo.de/" : "https://krileo.com/") + KRILEO_UTM;
  const SUGGESTIONS = [
    bot.suggestions.shipping,
    bot.suggestions.fitment,
    bot.suggestions.payment,
    bot.suggestions.returns,
  ];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: bot.greeting },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auf dem Handy deckt der Chat den Grossteil der Seite ab. Nach einem Klick
  // auf einen Produktlink schliessen, damit die Seite sichtbar ist (Verlauf
  // bleibt erhalten, der Chat laesst sich wieder oeffnen).
  const closeOnPhone = () => {
    if (window.matchMedia("(max-width: 767px)").matches) setOpen(false);
  };

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
        body: JSON.stringify({
          messages: next.slice(1),
          conversationId,
        }),
      });
      const data = await res.json();
      if (data.conversationId) setConversationId(data.conversationId);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.reply || data.error || bot.errorGeneric,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: bot.errorConnection,
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
          aria-label={bot.closeAria}
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
            {bot.ask} <span className="text-accent">{bot.sickbot}</span>
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={bot.openAria}
            className="pulse-accent grid size-12 shrink-0 place-items-center rounded-full bg-accent text-fg shadow-lg transition-transform hover:scale-110 active:scale-95 md:size-14"
          >
            <svg viewBox="0 0 24 24" className="size-6 md:size-7" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 11.5a8.5 8.5 0 01-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1121 11.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      {open && (
        <div className="fixed bottom-20 right-4 z-40 flex h-[60vh] max-h-[520px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-accent/60 bg-bg shadow-2xl shadow-accent/10 ring-1 ring-accent/20 md:bottom-24 md:right-6">
          {/* Header (red bar, per the reference design) */}
          <div className="flex items-center gap-3 bg-accent px-4 py-3 text-white">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-accent shadow-sm">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 11.5a8.5 8.5 0 01-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1121 11.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="min-w-0">
              <div className="text-base font-bold leading-tight tracking-tight text-white">
                {bot.sickbot}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/85">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-70" />
                  <span className="relative inline-flex size-2 rounded-full bg-white" />
                </span>
                {bot.online}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user" ? "flex justify-end" : "flex justify-start"
                }
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "whitespace-pre-wrap rounded-br-sm bg-accent text-fg"
                      : "rounded-bl-sm bg-surface text-fg-muted"
                  }`}
                >
                  {m.role === "assistant" ? renderRich(m.content, closeOnPhone) : m.content}
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
              placeholder={bot.inputPlaceholder}
              className="min-w-0 flex-1 rounded-full border border-border bg-bg px-4 py-2.5 text-sm text-fg outline-none placeholder:text-fg-dim focus:border-accent"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label={bot.sendAria}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-fg transition-colors hover:bg-accent-hi disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-dim"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2}>
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>

          {/* Agency credit, deliberately small and quiet */}
          <div className="flex justify-center bg-surface/60 pb-2">
            <a
              href={krileoUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] leading-none text-fg-dim transition-colors hover:text-fg-muted"
            >
              <Image
                src="/krileo-k.png"
                alt=""
                width={14}
                height={14}
                unoptimized
                className="size-3.5"
              />
              <span>
                {bot.poweredBy} <span className="font-semibold text-fg-muted">Krileo</span>
              </span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}
