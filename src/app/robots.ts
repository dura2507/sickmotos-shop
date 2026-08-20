import type { MetadataRoute } from "next";

const BASE = "https://sickmotos.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Google support (case 6-7428000041097) asked for explicit Googlebot
      // groups. A UA-specific group REPLACES the * group for that bot, so the
      // disallows must be repeated here or Googlebot would start crawling
      // /api/.
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      {
        userAgent: "Storebot-Google",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
