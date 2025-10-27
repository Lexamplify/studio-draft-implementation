"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

type ActiveView = 'chatView' | 'caseDetailView' | 'draftEditorView' | 'draftListView' | 'mainChatView' | 'mainDraftEditorView' | 'libraryView';
type WorkspaceMode = 'general' | 'case';

interface ChatFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

interface AppContextType {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedChatId: string | null;
  setSelectedChatId: (id: string | null) => void;
  selectedCaseId: string | null;
  setSelectedCaseId: (id: string | null) => void;
  selectedDraftId: string | null;
  setSelectedDraftId: (id: string | null) => void;
  sourceChatId: string | null;
  setSourceChatId: (id: string | null) => void;
  workspaceMode: WorkspaceMode;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  chatFiles: Record<string, ChatFile[]>;
  addFileToChat: (chatId: string, file: ChatFile) => void;
  removeFileFromChat: (chatId: string, fileId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState<ActiveView>('chatView');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [sourceChatId, setSourceChatId] = useState<string | null>(null);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('general');
  const [chatFiles, setChatFiles] = useState<Record<string, ChatFile[]>>({});

  const addFileToChat = (chatId: string, file: ChatFile) => {
    setChatFiles(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), file]
    }));
  };

  const removeFileFromChat = (chatId: string, fileId: string) => {
    setChatFiles(prev => ({
      ...prev,
      [chatId]: (prev[chatId] || []).filter(file => file.id !== fileId)
    }));
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        selectedChatId,
        setSelectedChatId,
        selectedCaseId,
        setSelectedCaseId,
        selectedDraftId,
        setSelectedDraftId,
        sourceChatId,
        setSourceChatId,
        workspaceMode,
        setWorkspaceMode,
        chatFiles,
        addFileToChat,
        removeFileFromChat,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
