
'use client';

import Image from "next/image";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonial = {
  quote: "We are a future-focused law firm and have been looking for an AI solution that understands the Indian legal system. Lexamplify has been a game-changer – truly built by lawyers, for lawyers. It's a must-have for any modern Indian law firm.",
  name: "Mr. Rohan Mehra",
  title: "Managing Partner, Lex Legal Chambers",
  imageUrl: "https://placehold.co/800x600.png",
  dataAiHint: "modern office interior",
};

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="h-screen snap-start flex items-center justify-center px-6 bg-black">
      <div className="max-w-6xl w-full">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl p-6 shadow-lg backdrop-blur-sm bg-opacity-10 border border-white/6 bg-[#03002e] shadow-xl overflow-hidden md:grid md:grid-cols-2 items-center"
        >
          <div className="relative h-64 md:h-full w-full md:aspect-[3/4]">
            <Image
              src={testimonial.imageUrl}
              alt="Professional legal environment"
              fill
              className="object-cover"
              data-ai-hint={testimonial.dataAiHint}
            />
          </div>
          <div className="p-8 md:p-12 lg:p-16">
            <Quote className="h-10 w-10 text-blue-400 mb-6" />
            <blockquote className="text-xl md:text-2xl font-medium text-white leading-relaxed mb-6">
              "{testimonial.quote}"
            </blockquote>
            <div className="mt-6">
              <p className="font-semibold text-lg text-white">{testimonial.name}</p>
              <p className="text-md text-blue-400">{testimonial.title}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
