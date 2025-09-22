
import { Mail, MapPin, Linkedin, Twitter } from 'lucide-react';
import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0b2575] text-white py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="space-y-6">
            <div>
              <h3 className="font-serif text-2xl font-bold mb-2">Lexamplify</h3>
              <p className="text-white/80 leading-relaxed">AI-powered legal intelligence for modern law firms and enterprises.</p>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Product</h4>
            <ul className="space-y-2 text-white/80">
              <li><a href="#" className="hover:text-accent transition-colors">Smart Case Search</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">AI Drafting</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Compliance Insights</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Citations</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Company</h4>
            <ul className="space-y-2 text-white/80">
              <li><a href="#" className="hover:text-accent transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Press</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Contact</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Contact</h4>
            <div className="space-y-3 text-white/80">
              <div className="flex items-center gap-3"><Mail className="w-4 h-4" /><span>contact@lexamplify.com</span></div>
              <div className="flex items-center gap-3"><MapPin className="w-4 h-4" /><span>New Delhi, India</span></div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/60 text-sm">© {currentYear} Lexamplify. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <div className="flex gap-4">
              <Link href="#" className="text-white/60 hover:text-accent transition-colors"><Linkedin className="w-5 h-5" /></Link>
              <Link href="#" className="text-white/60 hover:text-accent transition-colors"><Twitter className="w-5 h-5" /></Link>
            </div>
            <div className="flex gap-6 text-sm text-white/60">
              <Link href="#" className="hover:text-accent transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-accent transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
