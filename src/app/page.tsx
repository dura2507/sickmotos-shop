import type { Metadata } from "next";
import { Hero } from "./_components/Hero";
import { TrustBar } from "./_components/TrustBar";
import { Categories } from "./_components/Categories";
import { ShopByModel } from "./_components/ShopByModel";
import { Bestsellers } from "./_components/Bestsellers";
import { SignatureParts } from "./_components/SignatureParts";
import { FeaturedBuilds } from "./_components/FeaturedBuilds";
import { LatestArrivals } from "./_components/LatestArrivals";
import { Spotlight } from "./_components/Spotlight";
import { NewHighlight } from "./_components/NewHighlight";
import { ActionBanner } from "./_components/ActionBanner";
import { GraphicsKits } from "./_components/GraphicsKits";
import { Merchandise } from "./_components/Merchandise";
import { BrandMarquee } from "./_components/BrandMarquee";
import { UniqueClaim } from "./_components/UniqueClaim";
import { DNA } from "./_components/DNA";
import { TestCenter } from "./_components/TestCenter";
import { Founder } from "./_components/Founder";
import { Reviews } from "./_components/Reviews";
import { FAQ } from "./_components/FAQ";

// Self-canonical so Google prefers this page over the Shopify duplicate
// storefront on checkout.sickmotos.com (Search Console: "Duplikat, Google hat
// eine andere Seite als kanonisch bestimmt", 2026-09-06).
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      {/* Shopping focus up top (Thomas: fast selection, category + model) */}
      <Hero />
      <TrustBar />
      <Categories />
      <ShopByModel />
      <NewHighlight />
      <Bestsellers />
      <SignatureParts />
      <FeaturedBuilds />
      <LatestArrivals />
      <Spotlight />
      <ActionBanner />
      <GraphicsKits />
      <Merchandise />

      {/* Bottom third: info, examples, company (Thomas: ab 2/3 Infos/Firma) */}
      <BrandMarquee />
      <UniqueClaim />
      <DNA />
      <TestCenter />
      <Founder />
      <Reviews />
      <FAQ />
    </>
  );
}
