import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export type BlogPost = {
  slug: string;
  title: string;
  published: string; // e.g. "16 Jun 2025"
  cover: string;
  excerpt: string;
  body: string;
};

const BLOG_DIR = join(process.cwd(), "src", "data", "blog");

function parseDate(s: string): number {
  if (!s) return 0;
  const t = Date.parse(s);
  if (!isNaN(t)) return t;
  // Fallback: "16 Jun 2025" via German locale strip
  const m = s.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (!m) return 0;
  return Date.parse(`${m[2]} ${m[1]}, ${m[3]}`) || 0;
}

let cache: BlogPost[] | null = null;

export function getAllPosts(): BlogPost[] {
  if (cache) return cache;
  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".json"));
  const posts: BlogPost[] = files.map((f) => {
    const raw = readFileSync(join(BLOG_DIR, f), "utf8");
    const p = JSON.parse(raw) as BlogPost;
    // Normalize cover URLs to https so next/image accepts them.
    if (p.cover?.startsWith("http://")) p.cover = "https://" + p.cover.slice(7);
    return p;
  });
  // Newest first
  posts.sort((a, b) => parseDate(b.published) - parseDate(a.published));
  cache = posts;
  return posts;
}

export function getPostBySlug(slug: string): BlogPost | null {
  return getAllPosts().find((p) => p.slug === slug) ?? null;
}
