import { Hero } from "./_components/Hero";
import { BikeBrandStrip } from "./_components/BikeBrandStrip";
import { TrustBar } from "./_components/TrustBar";
import { Bestsellers } from "./_components/Bestsellers";
import { ActionBanner } from "./_components/ActionBanner";
import { LatestArrivals } from "./_components/LatestArrivals";
import { DNA } from "./_components/DNA";
import { GraphicsKits } from "./_components/GraphicsKits";
import { Stats } from "./_components/Stats";
import { Categories } from "./_components/Categories";
import { Merchandise } from "./_components/Merchandise";
import { Founder } from "./_components/Founder";
import { Reviews } from "./_components/Reviews";
import { FAQ } from "./_components/FAQ";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <BikeBrandStrip />
      <Bestsellers />
      <ActionBanner />
      <LatestArrivals />
      <DNA />
      <GraphicsKits />
      <Stats />
      <Categories />
      <Merchandise />
      <Founder />
      <Reviews />
      <FAQ />
    </>
  );
}
