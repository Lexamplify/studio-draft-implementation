
import HeroSection from "@/components/sections/hero-section";
// import TrustedBySection from "@/components/sections/trusted-by-section";
// import AlternatingFeaturesSection from "@/components/sections/alternating-features-section";
// import IconBenefitsSection from "@/components/sections/icon-benefits-section";
// import DetailedFeaturesSection from "@/components/sections/detailed-features-section";
// import TestimonialsSection from "@/components/sections/testimonials-section";
import ContactSection from "@/components/sections/contact-section";

export default function Home() {
  return (
    <main className="flex-grow">
      <HeroSection />
      {/* <TrustedBySection /> */}
      {/* <AlternatingFeaturesSection /> */}
      {/* <IconBenefitsSection /> */}
      {/* <DetailedFeaturesSection /> */}
      {/* <TestimonialsSection /> */}
      <ContactSection />
    </main>
  );
}
