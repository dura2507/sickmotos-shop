import type { MetadataRoute } from "next";

const BASE = "https://sickmotos.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Google support (case 6-7428000041097) asked for explicit Googlebot
      // groups. A UA-specific group REPLACES the * group for that bot, so the
      // disallows must be repeated here or Googlebot would start crawling
      // /api/. /_next/ is deliberately NOT blocked: it holds the JS/CSS
      // chunks Google needs to render pages and every optimised product image
      // (/_next/image). Blocking it produced "Indexiert, obwohl durch
      // robots.txt blockiert" in Search Console (2026-09-17) and kept product
      // photos out of Google Images.
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: "Storebot-Google",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
