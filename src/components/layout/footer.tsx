
import LexamplifyLogo from '@/components/lexamplify-logo';
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
    <footer className="bg-neutral-950 text-neutral-300">
      <div className="container px-6 py-16">
        <div className="bg-neutral-900/70 border border-neutral-800 p-8 md:p-12 rounded-xl text-center mb-16 shadow-lg animate-fade-in">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Join Our Waitlist
          </h2>
          <p className="text-neutral-400 mb-6 max-w-xl mx-auto">
            Be the first to know when Lexamplify launches. Get exclusive early access and updates.
          </p>
          <div id="waitlist-form" className="flex flex-col sm:flex-row items-stretch justify-center gap-3 sm:gap-4 max-w-lg mx-auto">
            <Input
              type="email"
              placeholder="Enter your email address"
              className="flex-grow bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-400 focus-visible:ring-accent py-3 px-4 text-base"
            />
            <Button type="submit" size="lg" className="group shrink-0">
              <>
                Join Waitlist
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 animate-slide-in-up animation-delay-300">
          <div className="lg:col-span-2">
            <LexamplifyLogo />
            <p className="mt-4 text-sm text-neutral-400 max-w-xs">
              Empowering India's legal professionals with AI-driven tools for enhanced efficiency and insight.
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-accent" />
                <a href="mailto:contact@lexamplify.com" className="text-sm text-neutral-400 hover:text-white transition-colors">
                  contact@lexamplify.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-accent" />
                <span className="text-sm text-neutral-400">New Delhi, India</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">Legal</h3>
            <ul className="mt-4 space-y-2">
              {legalLinks.map(link => (
                <li key={link.label}><Link href={link.href} className="text-sm text-neutral-400 hover:text-white transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-neutral-800 pt-8 text-center animate-fade-in animation-delay-600">
          <p className="text-xs text-neutral-500">© {currentYear} Lexamplify. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
