
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Keep Input for potential future use if needed, but not used directly in this version of hero
import { ArrowRight } from "lucide-react";
// Link import is removed as we are using programmatic scroll

const HeroSection = () => {
  const handleScrollToWaitlist = () => {
    const waitlistForm = document.getElementById('waitlist-form');
    if (waitlistForm) {
      waitlistForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section 
      id="home" 
      className="bg-primary text-primary-foreground py-28 md:py-48 min-h-screen flex flex-col justify-center items-center"
    >
      <div className="container mx-auto px-6 text-center relative z-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl mb-6 animate-fade-in leading-normal max-w-3xl mx-auto font-heading">
          Amplify Your Legal Practice with AI
        </h1>
        <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto animate-slide-in-up animation-delay-300 font-body">
          Lexamplify leverages cutting-edge AI to streamline your legal workflows, from drafting and research to case management. Empower your practice, save time, and achieve better outcomes.
        </p>
        <div className="mt-8 max-w-lg mx-auto animate-slide-in-up animation-delay-600">
          {/* Email input removed from here */}
          <Button
            size="lg"
            className="text-lg py-3.5 px-8 transition-all duration-300 ease-in-out bg-white hover:bg-neutral-200 text-primary hover:shadow-lg hover:scale-105 group font-body"
            onClick={handleScrollToWaitlist}
          >
            <>
              Join Waitlist
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 text-primary" />
            </>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
