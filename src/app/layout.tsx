import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { PromoBar } from "./_components/PromoBar";
import { Header } from "./_components/Header";
import { Footer } from "./_components/Footer";
import { WhatsAppFloat } from "./_components/WhatsAppFloat";

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
      <body className="min-h-screen bg-bg text-fg flex flex-col">
        <PromoBar />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
