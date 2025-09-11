
'use client';

import { motion } from "framer-motion";
import { Navigation, Edit3, FolderGit2 } from "lucide-react"; 

const benefits = [
  {
    icon: <Navigation className="h-10 w-10" />,
    title: "Intuitive Navigation",
    description: "Easily find the tools and information you need with a clear, user-friendly interface designed for legal professionals.",
  },
  {
    icon: <Edit3 className="h-10 w-10" />,
    title: "Streamlined Case Workflow",
    description: "Manage your cases from start to finish with tools that simplify drafting, research, and client communication.",
  },
  {
    icon: <FolderGit2 className="h-10 w-10" />,
    title: "Organized Document Hub",
    description: "Keep all your case documents, notes, and correspondence securely organized and accessible anytime, anywhere.",
  },
];

const IconBenefitsSection = () => {
  return (
    <section id="icon-benefits" className="h-screen snap-start flex items-center justify-center px-6 bg-gradient-to-b from-black to-[#010048]"> 
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white font-heading">
            Effortless Navigation, Simple & Intuitive
          </h2>
          <p className="text-lg text-gray-300 mt-4 max-w-2xl mx-auto font-body">
            Lexamplify is designed to be powerful yet easy to use, ensuring you can focus on your legal work, not on learning complex software.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 30 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: index * 0.12 }}
              className="rounded-2xl p-6 shadow-lg backdrop-blur-sm bg-opacity-10 border border-white/6 bg-[#010057] hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1"
            >
              <div className="items-center text-center pt-8">
                <div className="p-4 bg-white/10 rounded-full mb-4 inline-block">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-white font-heading mb-2">{benefit.title}</h3>
                <p className="text-gray-300 text-sm font-body">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IconBenefitsSection;
