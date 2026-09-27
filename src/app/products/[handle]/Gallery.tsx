"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useVariantImage } from "./VariantImageContext";
import { shopifyImage, SHOPIFY_IMAGE_WIDTH } from "@/lib/shopifyImage";

export function Gallery({
  images,
}: {
  images: { src: string; alt: string }[];
}) {
  const safeImages = images.length > 0 ? images : [];
  const [active, setActive] = useState(0);
  const current = safeImages[active] ?? safeImages[0];

  // When a variant with its own image is selected, jump the gallery to it.
  const vi = useVariantImage();
  useEffect(() => {
    if (!vi?.activeSrc) return;
    const idx = safeImages.findIndex((img) => img.src === vi.activeSrc);
    if (idx >= 0) setActive(idx);
  }, [vi?.activeSrc, safeImages]);

  if (!current) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface-2 to-bg">
        <div className="absolute inset-0 grid place-items-center text-xs uppercase tracking-wider text-fg-dim">
          No image available
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse md:items-start md:gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface-2 to-bg">
        {/*
          The first photo is the LCP of the product page, so only it gets a
          preload link; later photos are always in view and load eagerly
          without polluting <head> with one preload per click. The column is
          capped at md:max-w-[520px] minus the 80 px thumbnail strip, so the
          main image never exceeds 424 px on desktop.
        */}
        <Image
          key={active}
          src={shopifyImage(current.src, SHOPIFY_IMAGE_WIDTH.hero)}
          alt={current.alt}
          fill
          preload={active === 0}
          loading="eager"
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 40vw, 424px"
          className="object-contain p-3 md:p-5"
        />
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 md:mx-0 md:w-20 md:flex-col md:overflow-visible md:px-0">
        {safeImages.map((img, i) => (
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
            {/*
              No loading="eager" here: React 19 emits a <link rel="preload">
              for every eagerly loaded img during SSR, which put up to 20
              thumbnail preloads in <head> ahead of the main photo (the LCP).
              The strip sits inside the first viewport, so the browser fetches
              the thumbnails right after layout anyway.
            */}
            <Image
              src={shopifyImage(img.src, SHOPIFY_IMAGE_WIDTH.thumb)}
              alt=""
              fill
              sizes="80px"
              className="object-contain p-1"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
