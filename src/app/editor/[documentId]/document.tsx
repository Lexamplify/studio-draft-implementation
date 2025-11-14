"use client";

import { useState, useEffect } from 'react';
import { Room } from "./room";
import { Editor } from "./editor";
import { Navbar } from "./navbar";
import { Toolbar } from "./toolbar";
import { LegalAIPanel } from "./legal-ai-panel";
import { DocumentInfoPanel } from "@/components/editor/document-info-panel";
import { processTemplateContent } from "@/lib/template-processor";
import { useEditorStore } from "@/store/use-editor-store";
import { Document as DocumentType } from "@/lib/firebase-document-service";
import { Icon } from '@/components/ui/icon';

interface DocumentProps {
  document: DocumentType;
  caseData?: any;
}

export const Document = ({ document, caseData }: DocumentProps) => {
  const { editor } = useEditorStore();
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(() => {
    // Always start collapsed (both mobile and desktop)
    return true;
  });
  const [isRightCollapsed, setIsRightCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      // Start collapsed on mobile/tablet, open on desktop
      return window.innerWidth < 1024;
    }
    // Default to open (not collapsed) on server-side
    return false;
  });
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  // Detect mobile/tablet view
  useEffect(() => {
    const checkMobileOrTablet = () => {
      const isMobile = window.innerWidth < 1024;
      setIsMobileOrTablet(isMobile);
      // Auto-collapse panels on mobile/tablet if they're open
      if (isMobile && (!isLeftCollapsed || !isRightCollapsed)) {
        setIsLeftCollapsed(true);
        setIsRightCollapsed(true);
      } else if (!isMobile && (isLeftCollapsed || isRightCollapsed)) {
        // Auto-expand panels on desktop if they're collapsed
        // Only if they were collapsed due to mobile view
        // Don't force expand if user manually collapsed them
      }
    };
    
    checkMobileOrTablet();
    window.addEventListener('resize', checkMobileOrTablet);
    return () => window.removeEventListener('resize', checkMobileOrTablet);
  }, []);
  

  // Process initial content to ensure proper TipTap JSON format
  const processedContent = processTemplateContent(document.initialContent);

  // Console logging to show how document contents are passed
  console.log("📄 Document Data:", {
    documentId: document.id,
    title: document.title,
    initialContent: document.initialContent,
    processedContent: processedContent,
    contentType: typeof processedContent,
    isTipTapJSON: typeof processedContent === 'object' && processedContent?.type === 'doc'
  });





  // Map document to match navbar interface (uses _id instead of id)
  const documentForNavbar = {
    ...document,
    _id: document.id,
  };

  return (
    <Room>
      <div className="min-h-screen bg-editor-bg flex flex-col relative">
        {/* Header - Fixed at top */}
        <div className="flex flex-col px-4 pt-2 gap-y-2 fixed top-0 left-0 z-10 bg-[#FAFBFD] print:hidden h-[112px] w-full">
          <Navbar data={documentForNavbar} />
          <Toolbar />
        </div>

        {/* Toggle Buttons - Fixed positions (works for both mobile and desktop) */}
        {editor && (
          <>
            {/* Left Panel Toggle Button */}
            <button
              onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
              className={`fixed z-50 w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-200 print:hidden ${
                isMobileOrTablet 
                  ? 'left-4 top-[120px]' 
                  : 'left-4 top-4'
              }`}
              aria-label="Toggle Document Info"
              title={isLeftCollapsed ? 'Show Document Info' : 'Hide Document Info'}
            >
              <Icon name="menu" className="w-5 h-5 text-gray-700" />
            </button>
            
            {/* Right Panel Toggle Button */}
            <button
              onClick={() => setIsRightCollapsed(!isRightCollapsed)}
              className={`fixed z-50 w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-200 print:hidden ${
                isMobileOrTablet 
                  ? 'right-4 top-[120px]' 
                  : 'right-4 top-4'
              }`}
              aria-label="Toggle AI Assistant"
              title={isRightCollapsed ? 'Show AI Assistant' : 'Hide AI Assistant'}
            >
              <Icon name="message" className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}

        {/* Main Content Area - Fixed panels with independent scrolling */}
        <div className="flex-1 pt-[112px] print:pt-0 relative">
          {/* Desktop: Document Info Panel - Left Side (fixed, scrolls independently) */}
          {editor && !isMobileOrTablet && !isLeftCollapsed && (
            <div className="fixed left-0 top-[112px] h-[calc(100vh-112px)] w-80 print:hidden bg-white border-r border-gray-200 overflow-y-auto z-20 transition-all duration-300">
              <DocumentInfoPanel 
                editor={editor} 
                isCollapsed={isLeftCollapsed}
                onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
              />
            </div>
          )}

          {/* Mobile: Document Info Panel (overlay) */}
          {editor && isMobileOrTablet && (
            <DocumentInfoPanel 
              editor={editor} 
              isCollapsed={isLeftCollapsed}
              onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
            />
          )}

          {/* Desktop: Legal AI Panel - Right Side (fixed, independent from editor scrolling) */}
          {editor && !isMobileOrTablet && !isRightCollapsed && (
            <div className="fixed right-0 top-[112px] h-[calc(100vh-112px)] w-1/2 print:hidden bg-white border-l border-gray-200 overflow-hidden z-20 transition-all duration-300">
              <div className="h-full flex flex-col">
                <LegalAIPanel 
                  editor={editor} 
                  caseData={caseData} 
                  documentId={document.id}
                  isCollapsed={isRightCollapsed}
                  onToggleCollapse={() => setIsRightCollapsed(!isRightCollapsed)}
                />
              </div>
            </div>
          )}

          {/* Mobile: Legal AI Panel (overlay) */}
          {editor && isMobileOrTablet && (
            <LegalAIPanel 
              editor={editor} 
              caseData={caseData} 
              documentId={document.id}
              isCollapsed={isRightCollapsed}
              onToggleCollapse={() => setIsRightCollapsed(!isRightCollapsed)}
            />
          )}

          {/* Main Editor Area - Independent, scrolls separately from panels */}
          <div className={`h-full transition-all duration-300 ${
            !isMobileOrTablet && !isLeftCollapsed ? 'ml-80' : ''
          } ${!isMobileOrTablet && !isRightCollapsed ? 'mr-[50%]' : ''}`}>
            <div className="h-full overflow-y-auto">
              <Editor 
                initialContent={processedContent} 
                onLegalAI={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </Room>
  );
};
