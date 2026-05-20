"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type { SearchEntry } from "@/lib/products";

const fmt = (n: number) =>
  n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

type Variant = "hero" | "header";

type Props = {
  index: SearchEntry[];
  placeholder?: string;
  variant?: Variant;
  /** Append this brand to /shop link on free-text submit. */
  brand?: string;
};

export function SearchSuggest({
  index,
  placeholder = "Search your bike or part...",
  variant = "hero",
  brand,
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const suggestions = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const words = term.split(/\s+/);
    return index
      .map((e) => {
        const hay = (e.t + " " + e.f.join(" ")).toLowerCase();
        let score = 0;
        for (const w of words) {
          if (!hay.includes(w)) return null;
          // Title hits score higher than fits hits
          if (e.t.toLowerCase().includes(w)) score += 2;
          else score += 1;
          // Starts-with bonus
          if (e.t.toLowerCase().startsWith(w)) score += 3;
        }
        return { e, score };
      })
      .filter((x): x is { e: SearchEntry; score: number } => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 7)
      .map((x) => x.e);
  }, [q, index]);

  function go(handle: string) {
    setOpen(false);
    router.push(`/products/${handle}`);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (active >= 0 && suggestions[active]) {
      go(suggestions[active].h);
      return;
    }
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (brand && brand !== "all") params.set("brand", brand);
    router.push(`/shop?${params.toString()}`);
    setOpen(false);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(suggestions.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const isHero = variant === "hero";
  const inputClass = isHero
    ? "min-w-0 flex-1 bg-transparent py-2 pr-3 text-xs text-fg placeholder:text-fg-dim focus:outline-none md:text-sm"
    : "flex-1 bg-transparent py-2.5 text-sm text-fg placeholder:text-fg-dim focus:outline-none";

  const wrapClass = isHero
    ? "relative mt-2 w-full max-w-md"
    : "relative flex flex-1 items-center gap-2 rounded-full border border-border-strong bg-surface px-4 transition-colors focus-within:border-accent";

  return (
    <div ref={wrapRef} className={wrapClass}>
      <form
        role="search"
        action="/shop"
        method="get"
        onSubmit={onSubmit}
        className={
          isHero
            ? "flex w-full items-center overflow-hidden rounded-full border border-fg/25 bg-bg/60 backdrop-blur-sm transition-colors focus-within:border-accent"
            : "flex flex-1 items-center gap-2"
        }
      >
        {brand && <input type="hidden" name="brand" value={brand} />}
        {isHero ? (
          <span className="grid size-9 shrink-0 place-items-center text-fg-muted">
            <SearchIcon />
          </span>
        ) : (
          <SearchIcon small />
        )}
        <input
          type="search"
          name="q"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={placeholder}
          autoComplete="off"
          className={inputClass}
        />
        {isHero ? (
          <button
            type="submit"
            className="shrink-0 pr-4 text-[11px] font-semibold uppercase tracking-wider text-accent transition-colors hover:text-accent-hi"
          >
            Find
          </button>
        ) : (
          <button
            type="submit"
            aria-label="Search"
            className="grid size-9 place-items-center rounded-full text-fg-muted transition-colors hover:bg-accent/15 hover:text-accent"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </form>

      {open && suggestions.length > 0 && (
        <div
          className={`absolute left-0 right-0 z-50 mt-2 max-h-[420px] overflow-hidden rounded-2xl border border-border bg-bg/95 shadow-2xl backdrop-blur-md ${
            isHero ? "" : "min-w-[320px]"
          }`}
        >
          <ul className="no-scrollbar max-h-[420px] overflow-y-auto p-1.5">
            {suggestions.map((s, i) => (
              <li key={s.h}>
                <button
                  type="button"
                  onClick={() => go(s.h)}
                  onMouseEnter={() => setActive(i)}
                  className={`group flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors ${
                    active === i ? "bg-accent/10" : "hover:bg-surface"
                  }`}
                >
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-md border border-border bg-gradient-to-br from-surface-2 to-bg">
                    {s.i && (
                      <Image
                        src={s.i}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm text-fg">{s.t}</span>
                    {s.f.length > 0 && (
                      <span className="truncate text-[10px] text-fg-dim">
                        Fits {s.f.join(", ")}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-accent">
                    {fmt(s.p)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-border p-1.5">
            <button
              type="button"
              onClick={onSubmit}
              className="block w-full rounded-xl p-2 text-left text-xs font-semibold uppercase tracking-wider text-fg-muted hover:bg-surface hover:text-accent"
            >
              See all results for &ldquo;{q}&rdquo; →
            </button>
          </div>
        </div>
      )}

      {open && q.trim().length >= 2 && suggestions.length === 0 && (
        <div className="absolute left-0 right-0 z-50 mt-2 rounded-2xl border border-border bg-bg/95 p-4 text-center text-xs text-fg-muted shadow-2xl backdrop-blur-md">
          No matches for &ldquo;{q}&rdquo;.{" "}
          <button
            type="button"
            onClick={onSubmit}
            className="font-semibold text-accent hover:underline"
          >
            Search the catalog
          </button>
        </div>
      )}
    </div>
  );
}

function SearchIcon({ small }: { small?: boolean } = {}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={small ? "size-4 text-fg-muted" : "size-4"}
      fill="none"
      stroke="currentColor"
      strokeWidth={small ? 2 : 1.8}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
