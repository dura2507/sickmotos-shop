import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { LegalText } from "../../legal/_layout";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getPostBySlug(slug);
  if (!p) return { title: "Post not found — SickMotos" };
  return {
    title: `${p.title} — SickMotos`,
    description: p.excerpt,
    openGraph: {
      title: p.title,
      description: p.excerpt,
      type: "article",
      images: p.cover ? [{ url: p.cover }] : [],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-12 md:py-20">
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-fg-muted transition-colors hover:text-accent"
      >
        <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All posts
      </Link>

      <header className="mb-10">
        {post.published && (
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
            {post.published}
          </span>
        )}
        <h1 className="mt-3 font-display text-3xl uppercase leading-[1.05] tracking-tight md:text-5xl">
          {post.title}
        </h1>
      </header>

      {post.cover && (
        <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-surface">
          <Image
            src={post.cover}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="prose prose-invert max-w-none text-fg-muted [&_a]:text-accent [&_a]:underline-offset-4 [&_a]:hover:underline [&_h2]:font-display [&_h2]:text-fg [&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl md:[&_h2]:text-2xl [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:text-base md:[&_p]:text-lg [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:mb-1 [&_strong]:text-fg">
        <LegalText source={post.body} />
      </div>
    </article>
  );
}
