import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Map the old Shopify storefront URLs to the new routes so existing Google
  // rankings and shared links don't 404 after the domain switch. Product URLs
  // (/products/:handle) are identical on both, so they need no redirect.
  async redirects() {
    return [
      // Shopify policy pages -> our legal pages
      { source: "/policies/refund-policy", destination: "/legal/widerruf", permanent: true },
      { source: "/policies/shipping-policy", destination: "/legal/versand", permanent: true },
      { source: "/policies/privacy-policy", destination: "/legal/datenschutz", permanent: true },
      { source: "/policies/terms-of-service", destination: "/legal/agb", permanent: true },
      { source: "/policies/legal-notice", destination: "/legal/impressum", permanent: true },
      { source: "/policies/contact-information", destination: "/legal/impressum", permanent: true },
      // Shopify blog -> our blog
      { source: "/blogs/:blog/:slug", destination: "/blog/:slug", permanent: true },
      { source: "/blogs/:blog", destination: "/blog", permanent: true },
      // Shopify collections -> shop (we filter via /shop?category=, no per-collection pages)
      { source: "/collections/all", destination: "/shop", permanent: true },
      { source: "/collections/:handle*", destination: "/shop", permanent: true },
      // Misc Shopify routes with no direct equivalent
      { source: "/cart", destination: "/shop", permanent: true },
      { source: "/checkout", destination: "/shop", permanent: true },
      { source: "/checkout/:path*", destination: "/shop", permanent: true },
      { source: "/search", destination: "/shop", permanent: true },
      // Shopify content pages with a real counterpart first, the rest to home
      { source: "/pages/impressum", destination: "/legal/impressum", permanent: true },
      { source: "/pages/datenschutz", destination: "/legal/datenschutz", permanent: true },
      { source: "/pages/datenschutzerklarung", destination: "/legal/datenschutz", permanent: true },
      { source: "/pages/datenschutzerklaerung", destination: "/legal/datenschutz", permanent: true },
      { source: "/pages/agb", destination: "/legal/agb", permanent: true },
      { source: "/pages/widerruf", destination: "/legal/widerruf", permanent: true },
      { source: "/pages/widerrufsbelehrung", destination: "/legal/widerruf", permanent: true },
      { source: "/pages/versand", destination: "/legal/versand", permanent: true },
      { source: "/pages/contact", destination: "/legal/impressum", permanent: true },
      { source: "/pages/kontakt", destination: "/legal/impressum", permanent: true },
      { source: "/pages/:slug*", destination: "/", permanent: true },
      { source: "/apps/:slug*", destination: "/shop", permanent: true },
      { source: "/services/:slug*", destination: "/shop", permanent: true },
      { source: "/discount/:slug*", destination: "/shop", permanent: false },
    ];
  },
  // Responses render in the language of Accept-Language (or the sm_lang
  // cookie), so tell caches and crawlers that HTML varies by it. Set here
  // because Next overwrites a Vary set in the middleware.
  async headers() {
    return [
      {
        source: "/((?!_next/|api/).*)",
        headers: [{ key: "Vary", value: "Accept-Language" }],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.sick-motos.com",
        pathname: "/cdn/**",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.instant.so",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
