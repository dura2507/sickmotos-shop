import { Hero } from "./_components/Hero";
import { BikeBrandStrip } from "./_components/BikeBrandStrip";
import { TrustBar } from "./_components/TrustBar";
import { FeaturedBuilds } from "./_components/FeaturedBuilds";
import { Bestsellers } from "./_components/Bestsellers";
import { SignatureParts } from "./_components/SignatureParts";
import { ActionBanner } from "./_components/ActionBanner";
import { LatestArrivals } from "./_components/LatestArrivals";
import { DNA } from "./_components/DNA";
import { GraphicsKits } from "./_components/GraphicsKits";
import { Categories } from "./_components/Categories";
import { Merchandise } from "./_components/Merchandise";
import { TestCenter } from "./_components/TestCenter";
import { Founder } from "./_components/Founder";
import { Reviews } from "./_components/Reviews";
import { FAQ } from "./_components/FAQ";
import { BrandMarquee } from "./_components/BrandMarquee";
import { Spotlight } from "./_components/Spotlight";
import { UniqueClaim } from "./_components/UniqueClaim";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <UniqueClaim />
      <FeaturedBuilds />
      <BikeBrandStrip />
      <Bestsellers />
      <SignatureParts />
      <Spotlight />
      <ActionBanner />
      <LatestArrivals />
      <BrandMarquee />
      <DNA />
      <GraphicsKits />
      <Categories />
      <Merchandise />
      <TestCenter />
      <Founder />
      <Reviews />
      <FAQ />
    </>
  );
}
