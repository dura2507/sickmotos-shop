"use client";

import Image from "next/image";
import { useState } from "react";

export function Gallery({
  images,
}: {
  images: { src: string; alt: string }[];
}) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse md:gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface-2 to-bg">
        <Image
          key={active}
          src={images[active].src}
          alt={images[active].alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 60vw"
          className="reveal-soft object-cover"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(80% 60% at 50% 100%, rgba(225,6,0,0.18), transparent 70%)",
          }}
        />
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 md:mx-0 md:w-20 md:flex-col md:overflow-visible md:px-0">
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Show image ${i + 1}`}
            className={`relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors md:h-auto md:w-full ${
              active === i
                ? "border-accent"
                : "border-border hover:border-border-strong"
            }`}
          >
            <Image
              src={img.src}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
