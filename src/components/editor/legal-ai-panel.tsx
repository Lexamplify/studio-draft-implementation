"use client";

import React from 'react';
import { Editor } from '@tiptap/react';
import { LegalAIEditor } from '@/components/legal-ai-editor';

interface LegalAIPanelProps {
  editor: Editor;
  caseData?: any;
  documentId?: string;
  className?: string;
}

export const LegalAIPanel: React.FC<LegalAIPanelProps> = ({ editor, caseData, documentId, className }) => {
  return (
    <div className={`legal-ai-panel ${className || ''}`}>
      {/* Chat Interface Only */}
      <LegalAIEditor 
        editor={editor} 
        caseData={caseData}
        documentId={documentId}
      />
    </div>
  );
};
