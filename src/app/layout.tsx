import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { PromoBar } from "./_components/PromoBar";
import { Header } from "./_components/Header";
import { Footer } from "./_components/Footer";
import { WhatsAppFloat } from "./_components/WhatsAppFloat";

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
  title: "SickMotos. Performance Parts Built by a Mechatronics Master",
  description:
    "Premium performance parts for supermoto & enduro: titanium exhausts, LED headlights, ECU tuning, carbon. Engineered in Germany by Thomas Krawietz.",
  icons: {
    icon: "/sickmotos-favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
          <Script id="gtm-init" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
          </Script>
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
        <PromoBar />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
