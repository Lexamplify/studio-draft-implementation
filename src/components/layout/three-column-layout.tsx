"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppContext } from '@/context/app-context';
import { Icon } from '@/components/ui/icon';
import LeftPanel from './left-panel';
import MiddlePanel from './middle-panel';
import RightPanel from './right-panel';

export default function ThreeColumnLayout() {
  const { selectedChatId, activeView } = useAppContext();
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  
  // Initialize left panel as collapsed on mobile/tablet
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024; // lg breakpoint (covers mobile and iPad)
    }
    return false;
  });
  // Initialize right panel as collapsed on mobile/tablet
  const [isRightCollapsed, setIsRightCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024; // lg breakpoint (covers mobile and iPad)
    }
    return false;
  });
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null);
  const [taskProgress, setTaskProgress] = useState({ completed: 0, total: 0 });

  // Detect mobile/tablet view
  useEffect(() => {
    const checkMobileOrTablet = () => {
      setIsMobileOrTablet(window.innerWidth < 1024);
    };
    
    checkMobileOrTablet();
    window.addEventListener('resize', checkMobileOrTablet);
    return () => window.removeEventListener('resize', checkMobileOrTablet);
  }, []);
  
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
    <div className="h-screen bg-gray-50 flex flex-row transition-all duration-500 ease-in-out overflow-hidden relative">
      {/* Mobile: Single top button to toggle left panel */}
      {isMobileOrTablet && (
        <button
          onClick={handleLeftToggle}
          className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-200"
          aria-label="Toggle menu"
        >
          <Icon name="menu" className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Mobile: Right panel toggle button */}
      {isMobileOrTablet && (
        <button
          onClick={handleRightToggle}
          className="lg:hidden fixed top-4 right-4 z-50 w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-200"
          aria-label="Toggle workspace"
        >
          <Icon name="briefcase" className="w-5 h-5 text-gray-700" />
        </button>
      )}

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
