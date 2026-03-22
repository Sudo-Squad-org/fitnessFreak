import React, { useEffect } from "react";
import { HeroSection } from "./components/HeroSection";
import { PlatformModules } from "./components/FeaturesSection";
import { HowItWorks } from "./components/HowItWorks";
import { RoadmapSection } from "./components/RoadmapSection";
import { Testimonials } from "./components/Testimonials";
import { CTASection } from "./components/CTASection";

const Home = () => {
  // Ensure the page scrolls fully to top on load/revisiting
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex min-h-screen flex-col w-full">
      <HeroSection />
      <PlatformModules />
      <HowItWorks />
      <RoadmapSection />
      <Testimonials />
      <CTASection />
    </div>
  );
};

export default Home;
