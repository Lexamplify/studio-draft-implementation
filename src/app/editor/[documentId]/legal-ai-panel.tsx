"use client";

import React from 'react';
import { Editor } from '@tiptap/react';
import { LegalAIEditor } from '@/components/legal-ai-editor';

interface LegalAIPanelProps {
  editor: Editor;
  caseData?: any;
  documentId: string;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const LegalAIPanel: React.FC<LegalAIPanelProps> = ({ editor, caseData, documentId, className, isCollapsed, onToggleCollapse }) => {
  return (
    <div className={`legal-ai-panel h-full flex flex-col ${className || ''}`}>
      {/* Chat Interface Only */}
      <LegalAIEditor 
        editor={editor} 
        caseData={caseData}
        documentId={documentId}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
      />
    </div>
  );
};
