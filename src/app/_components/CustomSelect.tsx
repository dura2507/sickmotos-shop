"use client";

import { useEffect, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

type Props = {
  options: SelectOption[];
  value: string;
  onChange: (v: string) => void;
  label?: string;
  ariaLabel?: string;
  className?: string;
  /** Width of the trigger button. Tailwind class. */
  triggerClassName?: string;
};

export function CustomSelect({
  options,
  value,
  onChange,
  label,
  ariaLabel,
  className,
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 rounded-full border border-border-strong bg-surface px-4 py-2.5 text-left text-sm text-fg-muted transition-all hover:border-fg/30 focus:border-accent focus:outline-none ${
          open ? "border-accent" : ""
        } ${triggerClassName ?? ""}`}
      >
        <span className="truncate">
          {label && (
            <span className="mr-1 text-fg-dim">{label}</span>
          )}
          <span className="text-fg">{current?.label ?? ""}</span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`size-4 shrink-0 text-fg-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        role="listbox"
        aria-label={ariaLabel}
        className={`absolute z-50 mt-2 w-full min-w-[200px] origin-top overflow-hidden rounded-2xl border border-border bg-bg/95 shadow-2xl backdrop-blur-md transition-all duration-200 ${
          open
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <ul className="max-h-72 overflow-y-auto p-1.5">
          {options.map((o) => {
            const active = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "bg-accent/15 text-accent"
                      : "text-fg-muted hover:bg-surface hover:text-fg"
                  }`}
                >
                  <span>{o.label}</span>
                  {active && (
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.2}
                    >
                      <path d="M5 12l4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
