
'use client';
import Link from 'next/link';
import LexamplifyLogo from '@/components/lexamplify-logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogIn, CalendarPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

const navLinks = [
  { href: '#home', label: 'Home' },
  { href: '#trusted-by', label: 'Why Lexamplify' },
  { href: '#alternating-features', label: 'Features' },
  { href: '#icon-benefits', label: 'Benefits' },
  { href: '#detailed-features', label: 'How It Works' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#contact', label: 'Contact' },
];

const actionLinks = [
  { href: '#contact', label: 'Book a Demo', icon: <CalendarPlus className="mr-2 h-4 w-4"/>, variant: "default" },
  { href: '/login', label: 'Login', icon: <LogIn className="mr-2 h-4 w-4"/>, variant: "ghost" },
];

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLinkClick = (href: string) => {
    setIsMobileMenuOpen(false);
    
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };

  return (
    <header className={`sticky top-0 z-50 w-full transition-colors duration-300 ${scrolled ? 'border-b border-white/20 bg-black/90 backdrop-blur supports-[backdrop-filter]:bg-black/70 shadow-md' : 'bg-transparent'}`}>
      <div className="container flex h-20 max-w-screen-2xl items-center justify-between px-6 md:px-10 lg:px-16 xl:px-20">
        <Link href="/" className="flex items-center space-x-2" onClick={() => handleLinkClick('/')}>
          <LexamplifyLogo />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex gap-6 items-center">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleLinkClick(link.href)}
              className="relative text-white/80 hover:text-teal-400 transition-colors duration-200 font-medium text-sm after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex gap-2 items-center">
          {actionLinks.map((link) => (
            <Button 
              key={link.label} 
              variant={link.variant as any}
              size="sm" 
              className={`${link.variant === "default" ? "transition-all duration-300 ease-out hover:shadow-lg group bg-teal-400 text-black hover:bg-teal-400/90" : "text-white/80 hover:text-teal-400"} px-4 py-2`}
              onClick={() => handleLinkClick(link.href)}
            >
              <>
                {link.icon}
                {link.label}
              </>
            </Button>
          ))}
        </div>

        {/* Mobile Menu */}
        <div className="lg:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs bg-black border-white/20">
              <div className="p-4">
                <Link href="/" className="mb-8 flex items-center" onClick={() => handleLinkClick('/')}>
                  <LexamplifyLogo />
                </Link>
                
                {/* Mobile Navigation Links */}
                <nav className="flex flex-col space-y-4 mb-8">
                  {navLinks.map((link) => (
                    <button
                      key={link.label}
                      onClick={() => handleLinkClick(link.href)}
                      className="text-left text-base py-2 text-white/80 hover:text-teal-400 transition-colors duration-200 font-medium"
                    >
                      {link.label}
                    </button>
                  ))}
                </nav>

                {/* Mobile Action Buttons */}
                <div className="flex flex-col space-y-3">
                  {actionLinks.map((link) => (
                    <Button 
                      key={link.label} 
                      variant={link.variant as any}
                      className="justify-start text-base py-3"
                      onClick={() => handleLinkClick(link.href)}
                    >
                      <>
                        {link.icon}
                        {link.label}
                      </>
                    </Button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
