"use client";
import { usePathname } from "next/navigation";
import Script from "next/script";
import AuthGuard from "@/components/auth/auth-guard";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't wrap login page with AuthGuard or layout
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      {/* Google Picker API Script */}
      <Script src="https://apis.google.com/js/api.js" strategy="afterInteractive" />
      <div className="h-screen bg-gray-50">
        {children}
      </div>
    </AuthGuard>
  );
}