import Image from "next/image";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog — SickMotos",
  description:
    "Tech-Insights, Tuning-Guides und Build-Stories rund um Beta, Fantic, KTM und mehr.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <header className="mb-12 border-b border-border pb-8">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
          The garage
        </span>
        <h1 className="mt-2 font-display text-4xl uppercase tracking-tight md:text-5xl">
          Blog
        </h1>
        <p className="mt-3 max-w-xl text-sm text-fg-muted">
          Tuning-Guides, Material-Vergleiche und Build-Insights von Thomas und
          dem SickMotos-Team.
        </p>
      </header>

      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/blog/${p.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent"
            >
              {p.cover && (
                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-surface-2 to-bg">
                  <Image
                    src={p.cover}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-3 p-5">
                {p.published && (
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-fg-dim">
                    {p.published}
                  </span>
                )}
                <h2 className="line-clamp-3 font-display text-xl uppercase leading-tight tracking-tight text-fg">
                  {p.title}
                </h2>
                <p className="line-clamp-3 text-sm text-fg-muted">
                  {p.excerpt}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-accent transition-colors group-hover:text-accent-hi">
                  Read more
                  <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
