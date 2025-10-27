"use client";

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/app-context';
import { useChats } from '@/context/chats-context';

export default function SidebarHeader() {
  const { setActiveView, setSelectedChatId } = useAppContext();
  const { createChat } = useChats();

  const handleNewChat = async () => {
    try {
      const newChat = await createChat({
        title: 'New Chat',
      });
      setSelectedChatId(newChat.id);
      setActiveView('chat');
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <h1 className="text-xl font-semibold text-gray-900">Lexamplify</h1>
      <Button
        onClick={handleNewChat}
        size="sm"
        className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        <Plus className="h-4 w-4 mr-1" />
        New Chat
      </Button>
    </div>
  );
}
