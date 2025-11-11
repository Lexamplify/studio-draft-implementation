"use client";

import { AppProvider } from "@/context/app-context";
import { CasesProvider } from "@/context/cases-context";
import { ChatsProvider } from "@/context/chats-context";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <CasesProvider>
        <ChatsProvider>
          {children}
        </ChatsProvider>
      </CasesProvider>
    </AppProvider>
  );
}

