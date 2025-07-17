
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
    <footer className="border-t border-border/40 bg-muted/40 text-foreground">
      <div className="container mx-auto px-6 py-16">
        <div className="bg-primary/10 p-8 md:p-12 rounded-xl text-center mb-16 shadow-lg animate-fade-in">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Join Our Waitlist
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Be the first to know when Lexamplify launches. Get exclusive early access and updates.
          </p>
          <div id="waitlist-form" className="flex flex-col sm:flex-row items-stretch justify-center gap-3 sm:gap-4 max-w-lg mx-auto">
            <Input
              type="email"
              placeholder="Enter your email address"
              className="flex-grow bg-background border-border focus:ring-primary py-3 px-4 text-base"
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
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              Empowering India's legal professionals with AI-driven tools for enhanced efficiency and insight.
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <a href="mailto:contact@lexamplify.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  contact@lexamplify.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">New Delhi, India</span>
              </div>
            </div>
            {/* Social links commented out
            <div className="mt-6 flex space-x-4">
              {socialLinks.map(social => (
                <Link key={social.label} href={social.href} aria-label={social.label} className="text-muted-foreground hover:text-primary transition-colors">
                  {social.icon}
                </Link>
              ))}
            </div> */}
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Legal</h3>
            <ul className="mt-4 space-y-2">
              {legalLinks.map(link => (
                <li key={link.label}><Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/40 pt-8 text-center animate-fade-in animation-delay-600">
          {/* Removed orphaned </p> tag from here */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
