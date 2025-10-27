
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Keep Input for potential future use if needed
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const HeroSection = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleGetStarted = () => {
    setIsLoading(true);
    router.push('/login');
  };

  return (
    <section
      id="home"
      className="bg-white text-foreground py-24 md:py-40 min-h-[80vh] flex flex-col justify-center items-center"
    >
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 text-sm mb-6 animate-fade-in">
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
          Backed by AI Innovation
        </div>
        <h1 className="text-[32px] sm:text-5xl md:text-7xl leading-tight mb-6 animate-fade-in max-w-4xl mx-auto font-heading">
          Amplify Your Legal Practice with AI
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto animate-slide-in-up animation-delay-300 font-body">
          Lexamplify leverages cutting-edge AI to streamline your legal workflows, from drafting and research to case management. Empower your practice, save time, and achieve better outcomes.
        </p>
        <div className="mt-8 max-w-lg mx-auto animate-slide-in-up animation-delay-600">
          <Button
            size="lg"
            className="text-lg py-3.5 px-8 transition-all duration-300 ease-in-out bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:scale-105 group font-body rounded-full"
            onClick={handleGetStarted}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
