'use client';

import HeroSection from "@/components/sections/hero-section";
import TrustedBySection from "@/components/sections/trusted-by-section";
import AlternatingFeaturesSection from "@/components/sections/alternating-features-section";
import IconBenefitsSection from "@/components/sections/icon-benefits-section";
import DetailedFeaturesSection from "@/components/sections/detailed-features-section";
import ContactSection from "@/components/sections/contact-section";
import Footer from "@/components/layout/footer";
import LexamplifyLogo from "@/components/lexamplify-logo";

export default function Home() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-black text-white min-h-screen snap-y snap-mandatory overflow-y-auto">
      {/* Fixed Logo Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/20">
        <div className="flex justify-start py-4 px-6">
          <button 
            onClick={scrollToTop}
            className="bg-white rounded-lg p-2 hover:bg-gray-100 transition-colors"
          >
            <LexamplifyLogo className="h-8 w-auto" />
          </button>
        </div>
      </div>
      
      <main className="flex-grow">
        <HeroSection />
        <TrustedBySection />
        <AlternatingFeaturesSection />
        <IconBenefitsSection />
        <DetailedFeaturesSection />
        <ContactSection />
        <Footer />
      </main>
    </div>
  );
}
