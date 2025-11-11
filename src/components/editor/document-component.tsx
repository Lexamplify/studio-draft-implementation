"use client";

import { useEffect, useState } from 'react';
import { useEditorStore } from '@/store/use-editor-store';
import { processTemplateContent } from '@/lib/template-processor';
import { Document as DocumentType } from '@/lib/firebase-document-service';
import { Editor } from './editor';
import { Navbar } from './navbar';
import { Toolbar } from './toolbar';

interface DocumentComponentProps {
  document: DocumentType;
}

export const DocumentComponent = ({ document }: DocumentComponentProps) => {
  const { editor } = useEditorStore();

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

  return (
    <div className="min-h-screen bg-[#FAFBFD] flex">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col mr-96">
        <div className="flex flex-col px-4 pt-2 gap-y-2 fixed top-0 left-0 z-10 bg-[#FAFBFD] print:hidden h-[112px] w-full border-b border-gray-200">
          <Navbar document={document} />
          <Toolbar />
        </div>
        <div className="pt-[114px] print:pt-0 flex-1">
          <Editor 
            initialContent={processedContent} 
            onLegalAI={() => {}}
            document={document}
          />
        </div>
      </div>

      {/* Legal AI Panel - Always Visible Right Side Below Header */}
      {editor && (
        <div className="fixed right-0 top-[112px] h-[calc(100vh-112px)] w-96 z-20 print:hidden bg-white border-l border-gray-200 overflow-y-auto">
          {/* Legal AI Panel placeholder - can be added later */}
          <div className="p-4">
            <h3 className="font-semibold mb-2">Legal AI Assistant</h3>
            <p className="text-sm text-gray-500">AI features coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
};

