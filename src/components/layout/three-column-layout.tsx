"use client";

import { useState } from 'react';
import { useAppContext } from '@/context/app-context';
import LeftPanel from './left-panel';
import MiddlePanel from './middle-panel';
import RightPanel from './right-panel';

export default function ThreeColumnLayout() {
  const { selectedChatId } = useAppContext();
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null);
  const [taskProgress, setTaskProgress] = useState({ completed: 0, total: 0 });

  const handleLeftToggle = () => {
    setIsLeftCollapsed(!isLeftCollapsed);
  };

  const handleRightToggle = () => {
    setIsRightCollapsed(!isRightCollapsed);
  };

  const handleProgressUpdate = (completed: number, total: number) => {
    setTaskProgress({ completed, total });
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-row transition-all duration-500 ease-in-out overflow-hidden">
      {/* Left Panel */}
      <LeftPanel
        isCollapsed={isLeftCollapsed}
        onToggleCollapse={handleLeftToggle}
        loadingChatId={loadingChatId}
        setLoadingChatId={setLoadingChatId}
      />

      {/* Middle Panel - 50% of total width */}
      <div className="flex-1 flex flex-col transition-all duration-500 ease-in-out overflow-hidden">
        <MiddlePanel 
          chatId={selectedChatId} 
          setLoadingChatId={setLoadingChatId}
          onTaskProgressUpdate={handleProgressUpdate}
        />
      </div>

      {/* Right Panel */}
      <RightPanel
        isCollapsed={isRightCollapsed}
        onToggleCollapse={handleRightToggle}
        onProgressUpdate={handleProgressUpdate}
      />
    </div>
  );
}
