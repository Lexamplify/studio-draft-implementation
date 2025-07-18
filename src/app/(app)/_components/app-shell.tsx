"use client";
import { usePathname } from "next/navigation";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import AppSidebarContent from "./app-sidebar-content";
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
      <SidebarProvider defaultOpen={true}>
        <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
          <AppSidebarContent />
        </Sidebar>
        <SidebarInset>
          <div className="p-4 sm:p-6 md:p-8 min-h-screen">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}