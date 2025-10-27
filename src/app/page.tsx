import HeroSection from "@/components/sections/hero-section";
import TrustedBySection from "@/components/sections/trusted-by-section";
import AlternatingFeaturesSection from "@/components/sections/alternating-features-section";
import SecuritySection from "@/components/sections/security-section";
// import IconBenefitsSection from "@/components/sections/icon-benefits-section"; // ss4 removed
// import DetailedFeaturesSection from "@/components/sections/detailed-features-section"; // ss2 commented out
// import TestimonialsSection from "@/components/sections/testimonials-section"; // Not currently used
import ContactSection from "@/components/sections/contact-section";

import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
export default function Home() {
  return (
    <main className="flex-grow">
      <Header />
      <HeroSection />
      <AlternatingFeaturesSection />
  {/*     <TrustedBySection /> */}
      <SecuritySection />
      {/** ss4 removed: <IconBenefitsSection /> */}
      {/** ss2 commented out: <DetailedFeaturesSection /> */}
      <ContactSection />
      <Footer />
      </main>
  );
}
