
'use client';

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import LexamplifyLogo from "@/components/lexamplify-logo";

const HeroSection = () => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  
  const handleGetStarted = () => {
    router.push('/login');
  };

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const headingText = "Amplifying Legal Intelligence with AI";
  const letters = headingText.split("");

  return (
    <section 
      id="home" 
      className="h-screen snap-start flex flex-col items-center justify-center text-center px-6 bg-gradient-to-b from-black to-[#010048]"
    >
      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="mb-6"
        >
           <div className="flex justify-center mb-6">
             <div className="bg-white rounded-lg p-2">
               <LexamplifyLogo className="h-8 w-auto" />
             </div>
           </div>
        </motion.div>
        
        <motion.h1 
          className="text-5xl md:text-6xl font-extrabold leading-tight max-w-3xl mx-auto mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {letters.map((letter, idx) => (
            <motion.span 
              key={idx} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: idx * 0.01 }}
            >
              {letter}
            </motion.span>
          ))}
        </motion.h1>
        
        <motion.p 
          className="mt-6 text-lg text-gray-300 max-w-2xl mx-auto mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          Lexamplify brings modern AI to legal teams — faster research, smarter contracts, and compliance that scales.
        </motion.p>

        <motion.div 
          className="mt-8 flex gap-4 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <Button
            size="lg"
            className="bg-white text-black hover:bg-gray-100 text-lg py-3.5 px-8 transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-105 group font-body"
            onClick={handleGetStarted}
          >
            <>
              Get Started
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-white/6 text-white border border-white/10 hover:bg-white/10 text-lg py-3.5 px-8 transition-all duration-300 ease-in-out font-body"
          >
            Request Demo
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
