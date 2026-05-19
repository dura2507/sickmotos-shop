"use client";

import { useEffect, useRef, useState } from "react";

type Stat = {
  target: number;
  suffix?: string;
  prefix?: string;
  label: string;
};

const stats: Stat[] = [
  { target: 482, label: "Products in catalog" },
  { target: 30, suffix: "+", label: "Countries shipped" },
  { target: 15, suffix: "+", label: "Years of racing" },
  { target: 100, suffix: "%", label: "Made in Germany" },
];

function CountUp({ stat }: { stat: Stat }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const duration = 1600;
            const startTime = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - startTime) / duration);
              const eased = 1 - Math.pow(1 - t, 3);
              setValue(Math.round(stat.target * eased));
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [stat.target]);

  return (
    <span ref={ref} className="font-display text-5xl uppercase tracking-tight text-accent md:text-6xl">
      {stat.prefix}
      {value}
      {stat.suffix}
    </span>
  );
}

export function Stats() {
  return (
    <section className="relative border-b border-border bg-bg">
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 0%, rgba(225,6,0,0.10), transparent 60%)",
        }}
      />
      <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-6 py-14 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="reveal flex flex-col items-center text-center">
            <CountUp stat={s} />
            <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-fg-muted">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
