"use client";

import { useState, useEffect } from 'react';
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
  
  // Get current case data
  const currentCase = selectedCaseId ? cases.find(c => c.id === selectedCaseId) : null;
  
  // Auto-switch to case workspace when case is selected
  useEffect(() => {
    if (selectedCaseId && workspaceMode === 'general') {
      setWorkspaceMode('case');
    }
  }, [selectedCaseId, workspaceMode, setWorkspaceMode]);

  const handleSwitchToGeneral = () => {
    setWorkspaceMode('general');
  };

  const handleSwitchToCase = () => {
    setWorkspaceMode('case');
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white h-full flex flex-col items-center py-4 space-y-4 border-l border-gray-200 transition-all duration-500 ease-in-out">
        {/* Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <Icon name="chevronLeft" className="w-4 h-4 text-gray-700" />
        </button>

        {/* Workspace Icon */}
        <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
          <Icon name="layout" className="w-4 h-4 text-gray-700" />
        </button>

        {/* Events Icon */}
        <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
          <Icon name="calendar" className="w-4 h-4 text-gray-700" />
        </button>

        {/* Tasks Icon */}
        <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
          <Icon name="checkSquare" className="w-4 h-4 text-gray-700" />
        </button>

        {/* Notes Icon */}
        <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
          <Icon name="stickyNote" className="w-4 h-4 text-gray-700" />
        </button>
      </div>
    );
  }

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
