"use client";

import { useEffect, useState } from "react";

// Thomas's three slogans (Telegram, 2026-06-01). Main headline stays
// "Ride wild. Ride free." — this line cycles his taglines underneath.
const SLOGANS = ["Ride wild and free", "Ride in style", "Faster than others"];

export function RotatingSlogan() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setI((prev) => (prev + 1) % SLOGANS.length),
      2800,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <span className="relative block h-5 select-none">
      {SLOGANS.map((s, idx) => (
        <span
          key={s}
          aria-hidden={idx !== i}
          className="absolute left-0 top-0 flex items-center gap-2 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.28em] text-accent transition-all duration-500 ease-out"
          style={{
            opacity: idx === i ? 1 : 0,
            transform: idx === i ? "translateY(0)" : "translateY(6px)",
          }}
        >
          <span aria-hidden className="text-accent/60">/</span>
          {s}
        </span>
      ))}
    </span>
  );
}
