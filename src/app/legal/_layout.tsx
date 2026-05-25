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
