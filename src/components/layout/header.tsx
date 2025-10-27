
'use client';
import Link from 'next/link';
import LexamplifyLogo from '@/components/lexamplify-logo';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLoginClick = () => {
    setIsLoginLoading(true);
    // The navigation will happen automatically via the Link component
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60 shadow-lg">
      <div className="container flex h-20 max-w-screen-2xl items-center justify-between px-6 md:px-10 lg:px-16 xl:px-20"> {/* Increased padding */}
        <Link href="#home" className="flex items-center space-x-2" onClick={handleLinkClick}>
          <LexamplifyLogo />
        </Link>

        <nav className="hidden md:flex gap-4 items-center">
          <Link 
            href="/login" 
            className={`px-5 py-2 rounded-full bg-primary text-white text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 ${isLoginLoading ? 'opacity-75 cursor-not-allowed' : ''}`} 
            onClick={(e) => {
              handleLoginClick();
              handleLinkClick();
            }}
          >
            {isLoginLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Login
          </Link>
          <Link href="#contact" className="text-sm text-foreground/80 hover:text-primary transition-colors" onClick={handleLinkClick}>Get in Touch</Link>
        </nav>

        {/* Mobile menu can be kept for future use or removed if not needed */}
        {/* <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs bg-background">
              <div className="p-4">
                <Link href="/" className="mb-8 flex items-center" onClick={handleLinkClick}>
                  <LexamplifyLogo />
                </Link>
                <nav className="flex flex-col space-y-4">
                  {navLinks.map((link) => (
                     <Button 
                        key={link.label} 
                        asChild 
                        variant={link.label === 'Book a Demo' ? "default" : "ghost"} 
                        className="justify-start text-base py-3"
                        onClick={handleLinkClick}
                      >
                        <Link href={link.href}>
                         <>
                           {link.icon}
                           {link.label}
                         </>
                        </Link>
                    </Button>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div> */}
      </div>
    </header>
  );
};

export default Header;
