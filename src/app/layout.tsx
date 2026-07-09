import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Bebas_Neue } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { PromoBar } from "./_components/PromoBar";
import { Header } from "./_components/Header";
import { Footer } from "./_components/Footer";
import { SupportChat } from "./_components/SupportChat";
import { CookieConsent } from "./_components/CookieConsent";
import { VisitTracker } from "./_components/VisitTracker";

// Plausible.io analytics. GDPR-friendly, no cookies, no banner needed.
// Set NEXT_PUBLIC_PLAUSIBLE_DOMAIN in Vercel to the domain registered at
// plausible.io (e.g. 'sick-motos.com'). If unset, the script is omitted.
const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

// Google Tag Manager. Set NEXT_PUBLIC_GTM_ID to e.g. 'GTM-XXXXX'. Inside
// GTM configure GA4 Config tag + GA4 Event tags for view_item,
// add_to_cart, begin_checkout, plus Google Ads Conversion tag. Lets
// Thomas swap pixels (Meta, TikTok, Klaviyo) without code changes.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const display = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sick-motos.com"),
  title: "SickMotos. Performance Parts Built by a Mechatronics Master",
  description:
    "Premium performance parts for supermoto & enduro: titanium exhausts, LED headlights, ECU tuning, carbon. Engineered in Germany by Thomas Krawietz.",
  icons: {
    icon: "/sickmotos-favicon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "SickMotos",
    title: "SickMotos. Ride in style, faster than others.",
    description:
      "Premium performance parts for supermoto & enduro: titanium exhausts, LED headlights, ECU tuning, carbon. Engineered in Germany.",
    url: "https://sick-motos.com",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SickMotos. Ride in style, faster than others.",
    description:
      "Premium performance parts for supermoto & enduro: titanium exhausts, LED headlights, ECU tuning, carbon.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Suppress storefront chrome (promo bar, header, footer, chat, cookie
  // banner) on internal admin routes. The admin panel provides its own
  // top nav and lives at a bg-bg backdrop, so overlaying the store shell
  // on top would only add noise and confuse the visitor filter for GA.
  const { headers } = await import("next/headers");
  const h = await headers();
  const pathname = h.get("x-sm-path") || "";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <head>
        {PLAUSIBLE_DOMAIN && (
          <Script
            defer
            src="https://plausible.io/js/script.outbound-links.tagged-events.js"
            data-domain={PLAUSIBLE_DOMAIN}
            strategy="afterInteractive"
          />
        )}
        {GTM_ID && (
          <>
            {/* Google Consent Mode v2: everything denied by default so GTM
                boots but ad/analytics tags stay dormant until the user clicks
                accept in the cookie banner (see CookieConsent.tsx). Must run
                BEFORE gtm.js so the default state is set on the first tick. */}
            <Script id="gtm-consent-default" strategy="beforeInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});`}
            </Script>
            <Script id="gtm-init" strategy="afterInteractive">
              {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-screen bg-bg text-fg flex flex-col">
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <span aria-hidden className="scroll-progress" />
        {isAdmin ? (
          children
        ) : (
          <>
            <PromoBar />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <SupportChat />
            {GTM_ID && <CookieConsent />}
            <VisitTracker />
          </>
        )}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
