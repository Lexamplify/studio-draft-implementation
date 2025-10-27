"use client";

import { useState } from 'react';
import SidebarHeader from './sidebar-header';
import SidebarNav from './sidebar-nav';
import SidebarLists from './sidebar-lists';
import ProfileSection from './profile-section';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<'cases' | 'drafts' | 'chats'>('chats');

  return (
    <div className="flex flex-col h-full">
      <SidebarHeader />
      <SidebarNav activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 overflow-hidden">
        <SidebarLists activeTab={activeTab} />
      </div>
      <ProfileSection />
    </div>
  );
}
