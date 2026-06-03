import { Hero } from "./_components/Hero";
import { TrustBar } from "./_components/TrustBar";
import { Categories } from "./_components/Categories";
import { ShopByModel } from "./_components/ShopByModel";
import { Bestsellers } from "./_components/Bestsellers";
import { SignatureParts } from "./_components/SignatureParts";
import { FeaturedBuilds } from "./_components/FeaturedBuilds";
import { LatestArrivals } from "./_components/LatestArrivals";
import { Spotlight } from "./_components/Spotlight";
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

export default function Home() {
  return (
    <>
      {/* Shopping focus up top (Thomas: fast selection, category + model) */}
      <Hero />
      <TrustBar />
      <Categories />
      <ShopByModel />
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
