
'use client';

import LexamplifyLogo from '@/components/lexamplify-logo';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const legalLinks = [
    { href: '#', label: 'Privacy Policy' },
    { href: '#', label: 'Terms of Service' },
  ];

  return (
    <footer className="snap-start min-h-screen flex items-center justify-center px-6" style={{ background: "linear-gradient(180deg,#000 0%,#03002e 100%)" }}>
      <div className="max-w-6xl w-full text-center text-gray-400">
        <motion.div 
          className="mb-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-28 mx-auto mb-4 bg-white rounded-lg p-2">
            <LexamplifyLogo className="h-8 w-auto" />
          </div>
          <p>© {currentYear} Lexamplify — All rights reserved.</p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
