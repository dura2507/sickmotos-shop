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
      { source: "/search", destination: "/shop", permanent: true },
      { source: "/pages/:slug*", destination: "/", permanent: true },
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
