"use client";

// CTA that opens the SickBot support chat. Drop it anywhere (works inside
// server components) — it fires a global event the SupportChat widget
// listens for. Use it wherever a customer might be unsure and would
// otherwise have to message a human.

import { useDictionary } from "./LocaleProvider";

function openChat() {
  window.dispatchEvent(new CustomEvent("sickmotos:open-chat"));
}

function ChatIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path
        d="M21 11.5a8.5 8.5 0 01-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1121 11.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Variant = "solid" | "ghost" | "link" | "icon";

const STYLES: Record<Variant, string> = {
  solid:
    "inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi",
  ghost:
    "inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-accent transition-colors hover:border-accent hover:bg-accent/15",
  link: "inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent-hi",
  icon: "grid size-10 place-items-center rounded-full border border-border-strong text-fg-muted transition-all hover:border-accent hover:text-accent hover:-translate-y-0.5",
};

export function AskSickBot({
  label,
  variant = "solid",
  className = "",
}: {
  label?: string;
  variant?: Variant;
  className?: string;
}) {
  const dict = useDictionary();
  const resolvedLabel = label ?? dict.askSickBot.defaultLabel;
  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={openChat}
        aria-label={resolvedLabel}
        className={`${STYLES.icon} ${className}`}
      >
        <ChatIcon className="size-5" />
      </button>
    );
  }
  return (
    <button type="button" onClick={openChat} className={`${STYLES[variant]} ${className}`}>
      <ChatIcon className="size-4" />
      {resolvedLabel}
      {variant === "link" && (
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.4}>
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
