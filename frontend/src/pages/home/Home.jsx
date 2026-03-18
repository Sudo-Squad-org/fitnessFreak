import React, { useEffect } from "react";
import { HeroSection } from "./components/HeroSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { ClassesPreview } from "./components/ClassesPreview";
import { HowItWorks } from "./components/HowItWorks";
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
      <FeaturesSection />
      <HowItWorks />
      <ClassesPreview />
      <Testimonials />
      <CTASection />
    </div>
  );
};

export default Home;
