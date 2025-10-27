"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuthToken } from '@/hooks/use-auth-token';

interface Chat {
  id: string;
  title: string;
  linkedCaseId?: string | null;
  messageCount?: number;
  description?: string;
  lastMessage?: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  files?: any[];
}

interface ChatsContextType {
  chats: Chat[];
  loading: boolean;
  error: string | null;
  createChat: (chatData: { title?: string; linkedCaseId?: string; initialMessage?: string }) => Promise<Chat>;
  updateChat: (id: string, updates: Partial<Chat>) => Promise<Chat>;
  deleteChat: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

interface MessagesContextType {
  messages: Message[];
  loading: boolean;
  error: string | null;
  addMessage: (role: 'user' | 'assistant', content: string) => Promise<Message>;
  refetch: () => Promise<void>;
}

const ChatsContext = createContext<ChatsContextType | undefined>(undefined);

export function ChatsProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, loading: authLoading } = useAuthToken();

  const fetchChats = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get('/api/chats');
      setChats(data.chats);
    } catch (err) {
      console.log('API failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch chats');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createChat = useCallback(async (chatData: { title?: string; linkedCaseId?: string; initialMessage?: string }) => {
    try {
      const newChat = await apiClient.post('/api/chats', chatData);
      setChats(prev => [newChat, ...prev]);
      return newChat;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chat');
      throw err;
    }
  }, []);

  const updateChat = useCallback(async (id: string, updates: Partial<Chat>) => {
    try {
      const updatedChat = await apiClient.put(`/api/chats/${id}`, updates);
      setChats(prev => {
        const newChats = prev.map(c => c.id === id ? { ...c, ...updatedChat } : c);
        return newChats;
      });
      return updatedChat;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update chat');
      throw err;
    }
  }, []);

  const deleteChat = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/api/chats/${id}`);
      setChats(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chat');
      throw err;
    }
  }, []);

  useEffect(() => {
    if (!authLoading && token) {
      fetchChats();
    } else if (!authLoading && !token) {
      setLoading(false);
      setChats([]);
    }
  }, [fetchChats, authLoading, token]);

  const contextValue = useMemo(() => ({
    chats,
    loading,
    error,
    createChat,
    updateChat,
    deleteChat,
    refetch: fetchChats,
  }), [chats, loading, error, createChat, updateChat, deleteChat, fetchChats]);

  return (
    <ChatsContext.Provider value={contextValue}>
      {children}
    </ChatsContext.Provider>
  );
}

export function useChats() {
  const context = useContext(ChatsContext);
  if (context === undefined) {
    throw new Error('useChats must be used within a ChatsProvider');
  }
  return context;
}

export function useMessages(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get(`/api/chats/${chatId}/messages`);
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  const addMessage = useCallback(async (role: 'user' | 'assistant', content: string, files?: any[]) => {
    if (!chatId) return;
    
    try {
      const newMessage = await apiClient.post(`/api/chats/${chatId}/messages`, { 
        role, 
        content, 
        files: files || [] 
      });
      setMessages(prev => [...prev, newMessage]);
      return newMessage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add message');
      throw err;
    }
  }, [chatId]);

  useEffect(() => {
    if (chatId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [chatId, fetchMessages]);

  return useMemo(() => ({
    messages,
    loading,
    error,
    addMessage,
    refetch: fetchMessages,
  }), [messages, loading, error, addMessage, fetchMessages]);
}
