"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";
import { Flag } from "./Flag";

export function LanguageSwitcher({ current }: { current: Locale }) {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>(current);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pick = (next: Locale) => {
    setOpen(false);
    if (next === locale) return;
    setLocale(next);
    startTransition(async () => {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      window.location.reload();
    });
  };

  const label = LOCALE_LABELS[locale];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className="flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-fg transition-colors hover:border-border-strong disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Flag code={label.flag} className="h-3 w-[18px]" />
        <span>{label.short}</span>
        <span aria-hidden className="text-fg-dim">▾</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-50 mt-2 min-w-[160px] overflow-hidden rounded-lg border border-border bg-surface shadow-xl"
        >
          {LOCALES.map((code) => {
            const l = LOCALE_LABELS[code];
            const isActive = code === locale;
            return (
              <li key={code}>
                <button
                  type="button"
                  onClick={() => pick(code)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2 ${
                    isActive ? "text-accent" : "text-fg"
                  }`}
                  role="option"
                  aria-selected={isActive}
                >
                  <Flag code={l.flag} className="h-3.5 w-[21px]" />
                  <span className="flex-1">{l.name}</span>
                  {isActive && <span className="text-accent">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
