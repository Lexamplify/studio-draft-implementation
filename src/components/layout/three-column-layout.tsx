"use client";

import { useState, useCallback, useRef } from 'react';
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
  
  // Track render count and function recreation
  const renderCountRef = useRef(0);
  const handleProgressUpdateRef = useRef(0);
  renderCountRef.current += 1;
  
  console.log('[ThreeColumnLayout] Render #', renderCountRef.current, {
    taskProgress,
    selectedChatId
  });

  const handleLeftToggle = () => {
    setIsLeftCollapsed(!isLeftCollapsed);
  };

  const handleRightToggle = () => {
    setIsRightCollapsed(!isRightCollapsed);
  };

  // Memoize handleProgressUpdate to prevent infinite loops
  const handleProgressUpdate = useCallback((completed: number, total: number) => {
    handleProgressUpdateRef.current += 1;
    console.log('[ThreeColumnLayout] handleProgressUpdate called #', handleProgressUpdateRef.current, {
      completed,
      total
    });
    
    // Only update if values actually changed (using functional update to avoid stale closure)
    setTaskProgress(prev => {
      console.log('[ThreeColumnLayout] Current progress:', prev, 'New progress:', { completed, total });
      if (prev.completed === completed && prev.total === total) {
        console.log('[ThreeColumnLayout] Progress unchanged, skipping update');
        return prev;
      }
      console.log('[ThreeColumnLayout] Updating progress:', { completed, total });
      return { completed, total };
    });
  }, []); // Empty deps - function should be stable

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
