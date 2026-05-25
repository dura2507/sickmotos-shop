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
      </head>
      <body className="min-h-screen bg-bg text-fg flex flex-col">
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
