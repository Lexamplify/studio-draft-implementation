
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, MessageSquare, BarChart2, CalendarClock, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
}

const featureItems: FeatureItem[] = [
  {
    id: 'case-storing',
    icon: <FileText className="h-6 w-6" />,
    title: 'Smart Case Management',
    description: 'Effortlessly organize and access all your legal documents in one secure location.',
    imageUrl: '/Vault_mockup.png',
    imageAlt: 'Smart Case Management UI',
  },
  {
    id: 'legal-drafting',
    icon: <Brain className="h-6 w-6" />, 
    title: 'AI Legal Drafting',
    description: 'Enhance your drafting with AI-powered suggestions.',
    imageUrl: '/Draft_mockup.png',
    imageAlt: 'AI Legal Drafting UI',
  },
  {
    id: 'case-timeline',
    icon: <CalendarClock className="h-6 w-6" />,
    title: 'Case Timeline',
    description: 'Visualize and manage case progress effectively.',
    imageUrl: '/Calender_month_mockup.png',
    imageAlt: 'Case Timeline UI',
  },
  {
    id: 'ai-chat',
    icon: <MessageSquare className="h-6 w-6" />,
    title: 'AI Chat Assistant',
    description: 'Get instant answers to your legal queries.',
    imageUrl: '/Assistant_mockup.png',
    imageAlt: 'AI Chat UI',
  },
  {
    id: 'analytics',
    icon: <BarChart2 className="h-6 w-6" />,
    title: 'Legal Analytics',
    description: 'Unlock data-driven insights for your practice.',
    imageUrl: '/Analytics_mockup.png',
    imageAlt: 'Legal Analytics Dashboard',
  },
];

const ImageNavFull = () => {
  const [activeFeature, setActiveFeature] = useState<FeatureItem>(featureItems[0]);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 rounded-2xl bg-gradient-to-b from-[#020428] to-[#010048] shadow-2xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2">
          <motion.div
            key={activeFeature.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative aspect-video rounded-xl overflow-hidden shadow-lg"
          >
            <Image
              src={activeFeature.imageUrl}
              alt={activeFeature.imageAlt}
              fill
              className="object-cover"
            />
          </motion.div>
        </div>
        <div className="md:col-span-1">
          <motion.div
            key={activeFeature.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-2xl font-semibold mb-2">{activeFeature.title}</h3>
            <p className="text-gray-300 mb-6">{activeFeature.description}</p>
          </motion.div>

          <div className="flex flex-col gap-3">
            {featureItems.map((item, idx) => (
              <button 
                key={idx} 
                onMouseEnter={() => setActiveFeature(item)} 
                onFocus={() => setActiveFeature(item)} 
                className={cn(
                  "text-left p-3 rounded-lg transition-all duration-200",
                  activeFeature.id === item.id 
                    ? "bg-white/10 ring-1 ring-white/12" 
                    : "hover:bg-white/6"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "transition-colors",
                    activeFeature.id === item.id ? "text-white" : "text-gray-400"
                  )}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-sm text-gray-300">{item.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailedFeaturesSection = () => {
  return (
    <section id="detailed-features" className="h-screen snap-start flex items-center justify-center px-6 bg-[#010048]">
      <div className="max-w-6xl w-full">
        <ImageNavFull />
      </div>
    </section>
  );
};

export default DetailedFeaturesSection;
