"use client";

import { useEffect, useState } from "react";

const activity = [
  { who: "Marco", country: "🇮🇹", action: "ordered Titanium Beta RR header" },
  { who: "Jonas", country: "🇩🇪", action: "added Hexagon V7 RGBW to cart" },
  { who: "Anna", country: "🇦🇹", action: "left a 5-star review" },
  { who: "Dominik", country: "🇷🇴", action: "ordered Beta brake discs" },
  { who: "Jim", country: "🇱🇺", action: "ordered Razor Blade graphics kit" },
  { who: "Lukas", country: "🇨🇭", action: "added Carbon Collector Cover" },
  { who: "El", country: "🇪🇸", action: "ordered ECU tuning module" },
];

export function ActivityTicker() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % activity.length);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  const current = activity[index];

  return (
    <section className="border-b border-border bg-bg/60">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-6 py-3 text-xs text-fg-muted">
        <span className="relative flex size-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-accent" />
        </span>
        <span className="font-semibold uppercase tracking-wider text-fg-dim">
          Live
        </span>
        <span className="hidden h-3 w-px bg-border-strong sm:inline-block" />
        <span
          key={index}
          className="reveal-soft truncate"
          style={{ animation: "reveal-in 0.6s ease-out" }}
        >
          <span className="mr-1">{current.country}</span>
          <span className="font-semibold text-fg">{current.who}</span>{" "}
          {current.action}
        </span>
      </div>
    </section>
  );
}
