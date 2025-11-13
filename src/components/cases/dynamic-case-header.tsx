"use client";

import React from 'react';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/app-context';
import { useChats } from '@/context/chats-context';

interface DynamicCaseHeaderProps {
  isShrunken: boolean;
  hideDetails: boolean;
  hideDescription: boolean;
  caseData?: any;
}

export default function DynamicCaseHeader({ isShrunken, hideDetails, hideDescription, caseData }: DynamicCaseHeaderProps) {
  const { sourceChatId, setSourceChatId, setActiveView, setSelectedChatId } = useAppContext();
  const { chats } = useChats();
  
  const sourceChat = sourceChatId ? chats.find(chat => chat.id === sourceChatId) : null;
  
  const handleBackToChat = () => {
    if (sourceChatId) {
      setSelectedChatId(sourceChatId);
      setActiveView('chatView');
      setSourceChatId(null); // Clear the source chat
    }
  };
  
  const caseName = caseData?.caseName || caseData?.details?.caseName || "Sharma vs. State of UP";
  const aiSubtitle = caseData?.aiSubtitle || caseData?.details?.aiSubtitle || "A commercial suit for the recovery of INR 2.5 Crores involving breach of contract and payment disputes.";
  const summary = caseData?.summary || caseData?.details?.summary || "An appeal against the lower court's decision in a criminal matter involving IPC sections 302 and 307.";
  const petitionerName = caseData?.details?.petitionerName || "Mr. Alok Sharma";
  const respondentName = caseData?.details?.respondentName || "State of UP";
  const judgeName = caseData?.details?.judgeName || "Hon. Justice R.K. Agrawal";
  const status = caseData?.details?.status || caseData?.details?.caseStatus || "Active";
  const caseNumber = caseData?.details?.caseNumber || "CRL.A. 123/2024";
  const courtName = caseData?.details?.courtName || "Allahabad High Court";
  const filingDate = caseData?.details?.filingDate || "2024-01-15";
  const caseType = caseData?.details?.caseType || "Criminal Appeal";
  const jurisdiction = caseData?.details?.jurisdiction || "High Court";
  const lastModified = caseData?.updatedAt ? new Date(caseData.updatedAt).toLocaleDateString() : null;

  return (
    <div className="bg-white shadow-sm">
      {/* Section 1: Navigation Breadcrumb - Scrolls away */}
      {sourceChatId && (
        <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-gray-200">
          <nav className="flex items-center space-x-2 text-sm overflow-x-auto">
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">From Chat</span>
            </div>
            <Icon name="chevronRight" className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <button
              onClick={handleBackToChat}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-all duration-200 group hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-blue-200 flex-shrink-0"
            >
              <Icon name="arrowLeft" className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
              <span className="font-medium truncate max-w-32">{sourceChat?.title || 'Untitled Chat'}</span>
            </button>
            <Icon name="chevronRight" className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <span className="text-gray-900 font-medium truncate flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg flex-shrink-0">
              <Icon name="folder" className="w-4 h-4 text-gray-500" />
              <span className="truncate max-w-40">{caseName}</span>
            </span>
          </nav>
        </div>
      )}

      {/* Section 2: Case Title - STICKY (Always visible) */}
      <div className="sticky top-0 z-30 bg-white px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 border-b border-gray-200 relative">
        <div className="flex items-start justify-center gap-3 w-full pr-12 lg:pr-0">
          {/* Centered case name and subtitle */}
          <div className="flex-1 flex flex-col items-center min-w-0 max-w-full">
            <div className="w-full max-w-[calc(100%-80px)] flex flex-col items-center min-w-0">
              <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 text-center truncate w-full" title={caseName}>
                {caseName}
              </h2>
              {/* AI-Generated Subtitle */}
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed text-center truncate w-full" title={aiSubtitle}>
                {aiSubtitle}
              </p>
              <div className="mt-2 sm:mt-3 flex flex-wrap items-center justify-center gap-2">
                <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  status === 'Active' ? 'bg-green-100 text-green-800' :
                  status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                  status === 'On Hold' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {status}
                </span>
                <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">•</span>
                <span className="text-xs sm:text-sm text-gray-500 truncate">{caseNumber}</span>
              </div>
            </div>
          </div>
          {/* Action buttons on the right */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 absolute right-4 sm:right-6 lg:right-8">
            <button className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Share case">
              <Icon name="share" className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="More options">
              <Icon name="ellipsis" className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Description - Hides when hideDescription is true */}
      <div className={`px-4 sm:px-6 lg:px-8 transition-all duration-500 ease-in-out ${
        hideDescription ? 'opacity-0 max-h-0 overflow-hidden py-0' : 'opacity-100 max-h-32 py-3 sm:py-4'
      }`}>
        <p className="text-gray-500 text-xs sm:text-sm lg:text-base leading-relaxed break-words">{summary}</p>
      </div>

      {/* Section 4: Details Grid - Hides when hideDetails is true */}
      <div className={`px-4 sm:px-6 lg:px-8 transition-all duration-500 ease-in-out ${
        hideDetails ? 'opacity-0 max-h-0 overflow-hidden py-0' : 'opacity-100 max-h-64 py-3 sm:py-4 lg:py-6'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 xl:gap-8 text-xs sm:text-sm">
          <div className="space-y-1">
            <strong className="text-gray-500 font-medium block text-xs sm:text-sm">Petitioner</strong> 
            <span className="font-semibold text-gray-800 text-xs sm:text-sm lg:text-base break-words">{petitionerName}</span>
          </div>
          <div className="space-y-1">
            <strong className="text-gray-500 font-medium block text-xs sm:text-sm">Respondent</strong> 
            <span className="font-semibold text-gray-800 text-xs sm:text-sm lg:text-base break-words">{respondentName}</span>
          </div>
          <div className="space-y-1">
            <strong className="text-gray-500 font-medium block text-xs sm:text-sm">Judge</strong> 
            <button 
              className="font-semibold text-blue-600 hover:text-blue-800 text-xs sm:text-sm lg:text-base hover:underline transition-colors break-words text-left"
              onClick={() => console.log('Filter by judge:', judgeName)}
            >
              {judgeName}
            </button>
          </div>
          <div className="space-y-1">
            <strong className="text-gray-500 font-medium block text-xs sm:text-sm">Court</strong> 
            <button 
              className="font-semibold text-blue-600 hover:text-blue-800 text-xs sm:text-sm lg:text-base hover:underline transition-colors break-words text-left"
              onClick={() => console.log('Filter by court:', courtName)}
            >
              {courtName}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 xl:gap-8 text-xs sm:text-sm mt-3 sm:mt-4">
          <div className="space-y-1">
            <strong className="text-gray-500 font-medium block text-xs sm:text-sm">Filing Date</strong> 
            <span className="font-semibold text-gray-800 text-xs sm:text-sm lg:text-base">{filingDate}</span>
          </div>
          <div className="space-y-1">
            <strong className="text-gray-500 font-medium block text-xs sm:text-sm">Case Number</strong> 
            <span className="font-semibold text-gray-800 text-xs sm:text-sm lg:text-base break-words">{caseNumber}</span>
          </div>
          <div className="space-y-1">
            <strong className="text-gray-500 font-medium block text-xs sm:text-sm">Case Type</strong> 
            <span className="font-semibold text-gray-800 text-xs sm:text-sm lg:text-base break-words">{caseType}</span>
          </div>
          <div className="space-y-1">
            <strong className="text-gray-500 font-medium block text-xs sm:text-sm">Jurisdiction</strong> 
            <span className="font-semibold text-gray-800 text-xs sm:text-sm lg:text-base break-words">{jurisdiction}</span>
          </div>
        </div>
        {/* Last Modified - Only show if valid date */}
        {lastModified && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 xl:gap-8 text-xs sm:text-sm mt-3 sm:mt-4">
            <div className="space-y-1">
              <strong className="text-gray-500 font-medium block text-xs sm:text-sm">Last Modified</strong> 
              <span className="font-semibold text-gray-800 text-xs sm:text-sm lg:text-base">{lastModified}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}