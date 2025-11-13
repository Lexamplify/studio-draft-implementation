"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { useAppContext } from '@/context/app-context';
import { useCases } from '@/context/cases-context';
import GeneralWorkspace from '@/components/workspace/general-workspace';
import CaseWorkspace from '@/components/workspace/case-workspace';

interface RightPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onProgressUpdate?: (completed: number, total: number) => void;
}

export default function RightPanel({ isCollapsed, onToggleCollapse, onProgressUpdate }: RightPanelProps) {
  const { selectedCaseId, workspaceMode, setWorkspaceMode } = useAppContext();
  const { cases } = useCases();
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const prevCollapsedRef = useRef(isCollapsed);
  
  // Get current case data
  const currentCase = selectedCaseId ? cases.find(c => c.id === selectedCaseId) : null;
  
  // Note: Do not auto-switch workspaces on case selection.
  // Keep the user's chosen workspace mode until they explicitly switch.

  // Detect mobile/tablet view (< 1024px covers mobile and iPad)
  useEffect(() => {
    const checkMobileOrTablet = () => {
      setIsMobileOrTablet(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobileOrTablet();
    window.addEventListener('resize', checkMobileOrTablet);
    return () => window.removeEventListener('resize', checkMobileOrTablet);
  }, []);

  // Trigger animations when panel opens/closes
  useEffect(() => {
    if (isMobileOrTablet) {
      const wasCollapsed = prevCollapsedRef.current;
      const isNowCollapsed = isCollapsed;
      
      if (!wasCollapsed && isNowCollapsed) {
        // Panel is closing
        setIsClosing(true);
        const timer = setTimeout(() => {
          setIsClosing(false);
        }, 300);
        return () => clearTimeout(timer);
      } else if (wasCollapsed && !isNowCollapsed) {
        // Panel is opening
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 300);
        return () => clearTimeout(timer);
      }
      
      prevCollapsedRef.current = isCollapsed;
    }
  }, [isCollapsed, isMobileOrTablet]);

  const handleSwitchToGeneral = () => {
    setWorkspaceMode('general');
  };

  const handleSwitchToCase = () => {
    setWorkspaceMode('case');
  };

  // Handle backdrop click to close on mobile/tablet
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (isMobileOrTablet && !isCollapsed && e.target === e.currentTarget) {
      onToggleCollapse();
    }
  };

  // Mobile/Tablet: overlay mode with backdrop
  if (isMobileOrTablet) {
    // Don't show collapsed icon bar on mobile - handled by top button in layout
    if (isCollapsed) {
      return null;
    }

    // Show overlay panel when not collapsed
    return (
      <>
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={handleBackdropClick}
        />
        
        {/* Panel - slides in from right */}
        <div className={`fixed right-0 top-0 h-full w-[85vw] max-w-sm bg-white flex flex-col border-l border-gray-200 transition-transform duration-300 ease-in-out z-50 shadow-xl ${
          isClosing ? 'translate-x-full' : isAnimating ? 'animate-[slideInRight_0.3s_ease-in-out]' : ''
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                {workspaceMode === 'general' ? 'My Workspace' : 'Case Workspace'}
              </h2>
              <button
                onClick={onToggleCollapse}
                className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Icon name="x" className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {workspaceMode === 'general' ? (
              <GeneralWorkspace 
                onSwitchToCase={selectedCaseId ? handleSwitchToCase : undefined}
              />
            ) : currentCase ? (
              <CaseWorkspace
                caseId={currentCase.id}
                caseName={currentCase.caseName}
                onSwitchToGeneral={handleSwitchToGeneral}
                onProgressUpdate={onProgressUpdate}
              />
            ) : (
              <div className="text-center py-8">
                <Icon name="alertCircle" className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No case selected</p>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Desktop: normal side panel
  return (
    <div className="w-80 bg-white h-full flex flex-col border-l border-gray-200 transition-all duration-500 ease-in-out overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            {workspaceMode === 'general' ? 'My Workspace' : 'Case Workspace'}
          </h2>
          <button
            onClick={onToggleCollapse}
            className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <Icon name="chevronRight" className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {workspaceMode === 'general' ? (
          <GeneralWorkspace 
            onSwitchToCase={selectedCaseId ? handleSwitchToCase : undefined}
          />
        ) : currentCase ? (
          <CaseWorkspace
            caseId={currentCase.id}
            caseName={currentCase.caseName}
            onSwitchToGeneral={handleSwitchToGeneral}
            onProgressUpdate={onProgressUpdate}
          />
        ) : (
          <div className="text-center py-8">
            <Icon name="alertCircle" className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No case selected</p>
          </div>
        )}
      </div>
    </div>
  );
}
