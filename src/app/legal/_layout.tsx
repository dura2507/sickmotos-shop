import type { ReactNode } from "react";

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="font-display text-4xl uppercase tracking-tight md:text-5xl">
          {title}
        </h1>
        {updated && (
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-fg-dim">
            Last updated: {updated}
          </p>
        )}
      </header>
      <div className="prose prose-invert max-w-none text-fg-muted [&_a]:text-accent [&_a]:underline-offset-4 [&_a]:hover:underline [&_h2]:font-display [&_h2]:text-fg [&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h3]:text-fg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:mb-1 [&_strong]:text-fg">
        {children}
      </div>
    </article>
  );
}

// Very small Markdown-ish renderer for legal text imported from
// src/data/legal/*.md (the existing Shopify policies). Handles ##
// headings, "- " bullets, paragraph breaks (blank line), and a few
// inline links via the link map. Anything else is rendered as plain
// text paragraphs. Keeps us off any third-party markdown dependency.

type Block =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

function parseBlocks(src: string): Block[] {
  const lines = src.split(/\r?\n/);
  const out: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      out.push({ type: "p", text: paragraph.join(" ").trim() });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list && list.length) {
      out.push({ type: "ul", items: list });
    }
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      out.push({ type: "h2", text: line.slice(3).trim() });
      continue;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      if (!list) list = [];
      list.push(line.slice(2).trim());
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return out;
}

// Inline email/url -> <a>. Keep the regex tight so we don't mangle
// numbers or other prose.
function autoLink(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})|(https?:\/\/[^\s)]+)/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const matched = m[0];
    if (matched.includes("@")) {
      parts.push(
        <a key={key++} href={`mailto:${matched}`}>
          {matched}
        </a>
      );
    } else {
      parts.push(
        <a key={key++} href={matched} target="_blank" rel="noopener noreferrer">
          {matched}
        </a>
      );
    }
    last = m.index + matched.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function LegalText({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === "h2") return <h2 key={i}>{b.text}</h2>;
        if (b.type === "ul") {
          return (
            <ul key={i}>
              {b.items.map((it, j) => (
                <li key={j}>{autoLink(it)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{autoLink(b.text)}</p>;
      })}
    </>
  );
}
