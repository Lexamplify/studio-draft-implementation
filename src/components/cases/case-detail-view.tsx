"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FileText } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { useCases } from '@/context/cases-context';
import DynamicCaseHeader from './dynamic-case-header';
import SlidingNavBar from './sliding-nav-bar';
import { 
  CaseDocumentsView, 
  CaseChatsView, 
  CaseEventsView,
  CaseOverview,
  CaseDetails,
  CaseDraftsView
} from './case-content-views';

interface CaseDetailViewProps {
  onTaskProgressUpdate?: (completed: number, total: number) => void;
}

export default function CaseDetailView({ onTaskProgressUpdate }: CaseDetailViewProps = {}) {
  const { selectedCaseId } = useAppContext();
  const { cases, loading: casesLoading } = useCases();
  const [caseData, setCaseData] = useState<any>(null);
  const [isShrunken, setIsShrunken] = useState(false);
  const [hideDetails, setHideDetails] = useState(false);
  const [hideDescription, setHideDescription] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [taskProgress, setTaskProgress] = useState({ completed: 0, total: 0 });
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle task progress updates from right panel
  const handleTaskProgressUpdate = (completed: number, total: number) => {
    setTaskProgress({ completed, total });
    if (onTaskProgressUpdate) {
      onTaskProgressUpdate(completed, total);
    }
  };
  
  useEffect(() => {
    if (selectedCaseId && cases.length > 0) {
      const case_ = cases.find(c => c.id === selectedCaseId);
      if (case_) {
        setCaseData(case_);
      }
    }
  }, [selectedCaseId, cases]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      
      // Progressive hiding based on scroll position
      // First hide details (petitioner/respondent info)
      setHideDetails(scrollTop > 50);
      // Then hide description
      setHideDescription(scrollTop > 100);
      // Keep isShrunken for any future collapsed state
      setIsShrunken(scrollTop > 150);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (casesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No case selected</h3>
          <p className="text-gray-500">Select a case from the sidebar to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-gray-100 h-full overflow-y-auto" ref={contentRef}>
      {/* Scrollable Header with progressive sections */}
      <DynamicCaseHeader 
        isShrunken={isShrunken} 
        hideDetails={hideDetails}
        hideDescription={hideDescription}
        caseData={caseData} 
      />
      
      {/* Sticky navigation bar */}
      <div className="sticky top-0 z-20 bg-gray-100/95 backdrop-blur-sm border-b border-gray-200">
        <div className="p-4">
          <SlidingNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>
      
      {/* Content area */}
      <div className="px-8 pb-8">
        <div className="pt-6">
          {activeTab === 'overview' && <CaseOverview caseData={caseData} taskProgress={taskProgress} />}
          {activeTab === 'docs' && <CaseDocumentsView />}
          {activeTab === 'drafts' && <CaseDraftsView />}
          {activeTab === 'chats' && <CaseChatsView />}
          {activeTab === 'events' && <CaseEventsView />}
          {activeTab === 'about' && <CaseDetails caseData={caseData} />}
        </div>
      </div>
    </div>
  );
}
