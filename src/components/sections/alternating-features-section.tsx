
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FeatureDetail {
  title: string;
  description: string;
  category: string;
}

const features: FeatureDetail[] = [
  {
    title: "Personalized AI",
    subtitle: "Tailored to Your Expertise",
    description: "Lexamplify adapts to your specific area of law, providing relevant insights, document templates, and case law that match your unique practice needs.",
  },
  {
    title: "Intelligent Search",
    subtitle: "Rapid Research, Grounded Results",
    description: "Our AI-powered research engine scans millions of documents in seconds, delivering accurate and contextually relevant results grounded in verified sources.",
  },
  {
    title: "Efficient Drafting",
    subtitle: "Automated Document Drafting",
    description: "Generate precise first drafts of legal documents — notices, petitions — the AI understands local legal nuances.",
  },
  {
    title: "Organized Workflow",
    subtitle: "Strategic Case Management",
    description: "Organize case files, track deadlines, and manage client communication effortlessly with our centralized hub.",
  },
];

const PrevIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NextIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BroadSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const next = () => setCurrentIndex((x) => (x + 1) % features.length);
  const prev = () => setCurrentIndex((x) => (x - 1 + features.length) % features.length);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-11/12 max-w-4xl h-72 md:h-80 lg:h-96 flex items-center justify-center">
        <button 
          onClick={prev} 
          className="absolute left-2 z-30 p-2 rounded-full bg-white/6 hover:bg-white/10 transition-colors"
        >
          <PrevIcon />
        </button>

        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex} 
            initial={{ opacity: 0, y: 10, scale: 0.98 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -10, scale: 0.98 }} 
            transition={{ duration: 0.5 }} 
            className="bg-[#03002e] rounded-2xl shadow-2xl p-10 text-center w-full"
          >
            <h2 className="text-3xl font-bold mb-2">{features[currentIndex].title}</h2>
            <h3 className="text-lg text-blue-400 mb-4">{features[currentIndex].subtitle}</h3>
            <p className="text-gray-300 max-w-3xl mx-auto">{features[currentIndex].description}</p>
          </motion.div>
        </AnimatePresence>

        <button 
          onClick={next} 
          className="absolute right-2 z-30 p-2 rounded-full bg-white/6 hover:bg-white/10 transition-colors"
        >
          <NextIcon />
        </button>
      </div>
    </div>
  );
};

const AlternatingFeaturesSection = () => {
  return (
    <section id="alternating-features" className="h-screen snap-start flex items-center justify-center px-6 bg-gradient-to-b from-[#010048] to-black">
      <div className="max-w-6xl w-full">
        <BroadSlider />
      </div>
    </section>
  );
};

export default AlternatingFeaturesSection;
