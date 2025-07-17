import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'], // Added more weights
  variable: '--font-playfair-display',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'], // Added more weights
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'Lexamplify — AI for Lawyers in India',
  description: 'Lexamplify empowers Indian legal professionals with AI tools for smarter drafting, research, and case management. Join the waitlist today.',
  keywords: 'ai for lawyers, legaltech India, case law AI, legal drafting assistant, Indian legal research, Lexamplify',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${playfairDisplay.variable} ${dmSans.variable} font-body antialiased`}>
        <Header />
        {children}
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
