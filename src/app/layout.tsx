import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { GoogleOAuthProvider } from '@react-oauth/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Define CSS variable for Inter font
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
});

export const metadata: Metadata = {
  title: 'LegalEase AI',
  description: 'AI-powered legal assistance and document management.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.error('Google OAuth client ID not configured');
  }

  return (
    <GoogleOAuthProvider clientId={clientId ?? ''}>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
          {children}
          <Toaster />
        </body>
      </html>
    </GoogleOAuthProvider>
  );
}
