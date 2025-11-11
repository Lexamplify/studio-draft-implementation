import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Define CSS variable for Inter font
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
        <body className={`${inter.variable} font-sans antialiased`}> {/* Apply Inter font variable and Tailwind's font-sans utility */}
          <NuqsAdapter>
            {children}
            <Toaster />
          </NuqsAdapter>
        </body>
      </html>
    </GoogleOAuthProvider>
  );
}
