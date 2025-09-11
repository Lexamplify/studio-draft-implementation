
'use client';

import { ContactForm } from "@/components/contact-form";
import { motion } from "framer-motion";
import { Mail, MapPin, MessageSquareHeart } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="h-screen snap-start flex items-center justify-center px-6 bg-gradient-to-b from-[#010048] to-black"> 
      <div className="max-w-6xl w-full">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-4xl md:text-5xl font-serif font-bold text-white"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            Ready to Amplify Your Practice?
          </motion.h2>
          <motion.p 
            className="text-lg text-gray-300 mt-4 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Join the waitlist for early access, request a personalized demo, or simply share your thoughts. We're eager to connect with you!
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-stretch">
          {/* Left Card: Contact Details */}
          <motion.div 
            className="flex flex-col h-full space-y-8 bg-[#010057] text-white p-8 sm:p-10 rounded-xl shadow-lg"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          > 
            <div>
              <h3 className="text-2xl font-serif font-semibold text-white mb-4">Contact Details</h3>
              <p className="text-gray-300 mb-6">
                Reach out to us via the form or through the channels below. We look forward to hearing from you.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <a href="mailto:contact@lexamplify.com" className="text-white hover:text-gray-300 transition-colors">
                    contact@lexamplify.com
                  </a>
                </div>
                 <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-blue-400" />
                  <span className="text-white">New Delhi, India</span>
                </div>
              </div>
            </div>
            <div className="flex-grow"></div>
          </motion.div>

          {/* Right Card: Form */}
          <motion.div 
            className="rounded-2xl p-6 shadow-lg backdrop-blur-sm bg-opacity-10 border border-white/6 bg-[#03002e] shadow-xl overflow-hidden"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          > 
            <ContactForm />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;


