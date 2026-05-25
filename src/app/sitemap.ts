import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { allProducts } from "@/lib/products";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sick-motos.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/legal/impressum`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE}/legal/agb`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE}/legal/datenschutz`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE}/legal/widerruf`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${BASE}/legal/versand`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const products: MetadataRoute.Sitemap = allProducts.map((p) => ({
    url: `${BASE}/products/${p.handle}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const posts: MetadataRoute.Sitemap = getAllPosts().map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...products, ...posts];
}
