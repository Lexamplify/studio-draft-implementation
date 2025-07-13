import type { Metadata } from "next";
import AppShell from "./_components/app-shell";

export const metadata: Metadata = {
  title: "LegalEase AI Dashboard",
  description: "AI-powered legal assistance and document management.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
