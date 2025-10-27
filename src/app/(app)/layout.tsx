import type { Metadata } from "next";
import AppShell from "./_components/app-shell";
import { AppProvider } from "@/context/app-context";
import { ChatsProvider } from "@/context/chats-context";
import { CasesProvider } from "@/context/cases-context";

export const metadata: Metadata = {
  title: "Lexamplify - AI Legal Assistant",
  description: "AI-powered legal assistance and document management for Indian law.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <CasesProvider>
        <ChatsProvider>
          <AppShell>{children}</AppShell>
        </ChatsProvider>
      </CasesProvider>
    </AppProvider>
  );
}
