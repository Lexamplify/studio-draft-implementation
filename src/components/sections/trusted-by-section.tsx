
'use client';

import { motion } from "framer-motion";

const features = [
  { title: "AI Legal Research", desc: "Auto-summarize statutes, case law and extract relevant precedent in seconds." },
  { title: "Contract Review", desc: "Highlight risk, obligations and missing clauses with AI-powered accuracy." },
  { title: "Compliance Insights", desc: "Get timeline-aware regulatory guidance and audit-ready reports." },
];

const TrustedBySection = () => {
  return (
    <section id="trusted-by" className="h-screen snap-start flex items-center justify-center px-6 bg-black"> 
      <div className="max-w-6xl w-full">
        <h2 className="text-4xl font-semibold text-center mb-12">Core Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 30 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: i * 0.12 }}
            >
              <div className="rounded-2xl p-6 shadow-lg backdrop-blur-sm bg-opacity-10 border border-white/6 bg-[#010057]">
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-gray-300">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBySection;
