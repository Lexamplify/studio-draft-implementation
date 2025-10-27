"use client";

import { Button } from '@/components/ui/button';
import { FolderOpen, FileText, MessageSquare } from 'lucide-react';

interface SidebarNavProps {
  activeTab: 'cases' | 'drafts' | 'chats';
  onTabChange: (tab: 'cases' | 'drafts' | 'chats') => void;
}

export default function SidebarNav({ activeTab, onTabChange }: SidebarNavProps) {
  const tabs = [
    { id: 'cases' as const, label: 'Cases', icon: FolderOpen },
    { id: 'drafts' as const, label: 'Drafts', icon: FileText },
    { id: 'chats' as const, label: 'Chat', icon: MessageSquare },
  ];

  return (
    <div className="flex border-b border-gray-200">
      {tabs.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant="ghost"
          onClick={() => onTabChange(id)}
          className={`flex-1 rounded-none h-12 px-4 ${
            activeTab === id
              ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Icon className="h-4 w-4 mr-2" />
          {label}
        </Button>
      ))}
    </div>
  );
}
