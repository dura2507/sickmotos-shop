"use client";

import { useState } from "react";
import type { DetailViewModel } from "@/lib/products";
import type { Inline, RichBlock } from "@/lib/richDescription";
import { useDictionary } from "@/app/_components/LocaleProvider";

type TabKey = "description" | "specs";

export function InfoTabs({ product: p }: { product: DetailViewModel }) {
  const dict = useDictionary();
  const [active, setActive] = useState<TabKey>("description");
  const blocks: RichBlock[] = p.descriptionBlocks;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "description", label: dict.infoTabs.description },
    { key: "specs", label: dict.infoTabs.specifications },
  ];

  const specMap = dict.specs as Record<string, string>;
  function specLabel(key: string, fallback: string): string {
    if (key.startsWith("delivery")) return specMap.delivery;
    return specMap[key] ?? fallback;
  }
  const catCards = dict.categoryCards as Record<string, { name: string }>;
  function specValue(key: string, fallback: string): string {
    if (key === "delivery-standard") return specMap.deliveryStandard;
    if (key === "delivery-mto") return `${dict.product.madeToOrder}, ${dict.product.madeToOrderNormal}`;
    if (key === "delivery-mto-long") return `${dict.product.madeToOrder}, ${dict.product.madeToOrderLong}`;
    if (key === "warranty") return specMap.warrantyValue;
    if (key === "category") return catCards[fallback]?.name ?? fallback;
    return fallback;
  }

  return (
    <section className="relative isolate border-y border-border py-16 md:py-20" style={{ overflowX: "clip" }}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20"
        style={{
          background:
            "linear-gradient(180deg, #141414 0%, #101010 50%, #141414 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(118deg, transparent 34%, rgba(255,255,255,0.03) 49%, rgba(225,6,0,0.05) 53%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="drift-glow pointer-events-none absolute right-[-18%] top-1/2 -z-10 size-[520px] -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(225,6,0,0.18), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(225,6,0,0.45) 50%, transparent 100%)",
        }}
      />
      <div className="mx-auto max-w-4xl px-6">
        <div className="-mx-6 flex gap-1 overflow-x-auto whitespace-nowrap border-b border-border px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className={`relative shrink-0 px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                active === t.key
                  ? "text-fg"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              {t.label}
              {active === t.key && (
                <span aria-hidden className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-8 text-sm leading-relaxed text-fg-muted">
          {active === "description" && (
            <div className="flex flex-col gap-3">
              {blocks.length > 0 ? (
                blocks.map((b, i) => <DescriptionBlock key={i} block={b} first={i === 0} />)
              ) : (
                <p>{dict.infoTabs.noDescription}</p>
              )}
            </div>
          )}

          {active === "specs" && (
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2">
              {p.specs.map((s) => (
                <div
                  key={s.key}
                  className="flex flex-col gap-1 bg-bg p-4"
                >
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-fg-dim">
                    {specLabel(s.key, s.label)}
                  </dt>
                  <dd className="text-sm text-fg">{specValue(s.key, s.value)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}

function InlineNodes({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        if (n.t === "text") return <span key={i}>{n.v}</span>;
        if (n.t === "strong")
          return (
            <strong key={i} className="font-semibold text-fg">
              <InlineNodes nodes={n.c} />
            </strong>
          );
        if (n.t === "em")
          return (
            <em key={i}>
              <InlineNodes nodes={n.c} />
            </em>
          );
        const external = /^https?:/i.test(n.href);
        return (
          <a
            key={i}
            href={n.href}
            className="text-accent underline underline-offset-2 hover:text-accent-hi"
            {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
          >
            <InlineNodes nodes={n.c} />
          </a>
        );
      })}
    </>
  );
}

// Struktur aus Thomas' Shopify-Text: Zwischentitel, Listen, fette Stichworte.
function DescriptionBlock({ block, first }: { block: RichBlock; first: boolean }) {
  if (block.type === "heading") {
    return (
      <h3
        className={`font-display uppercase tracking-tight text-fg ${
          first ? "text-xl md:text-2xl" : "mt-4 text-lg md:text-xl"
        }`}
      >
        <InlineNodes nodes={block.c} />
      </h3>
    );
  }
  if (block.type === "list") {
    const Tag = block.ordered ? "ol" : "ul";
    return (
      <Tag className={`flex flex-col gap-2 pl-1 ${block.ordered ? "list-decimal pl-5" : ""}`}>
        {block.items.map((item, i) =>
          block.ordered ? (
            <li key={i} className="text-fg">
              <InlineNodes nodes={item} />
            </li>
          ) : (
            <li key={i} className="flex gap-3 text-fg">
              <span aria-hidden className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-accent" />
              <span className="min-w-0">
                <InlineNodes nodes={item} />
              </span>
            </li>
          )
        )}
      </Tag>
    );
  }
  return (
    <p className="text-fg">
      <InlineNodes nodes={block.c} />
    </p>
  );
}
