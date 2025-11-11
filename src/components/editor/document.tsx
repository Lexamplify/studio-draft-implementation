"use client";

import { Preloaded, usePreloadedQuery } from "convex/react";

import { Room } from "./room";
import { Editor } from "./editor";
import { Navbar } from "./navbar";
import { Toolbar } from "./toolbar";
import { LegalAIPanel } from "./legal-ai-panel";
import { api } from "../../../../convex/_generated/api";
import { processTemplateContent } from "@/lib/template-processor";
import { useEditorStore } from "@/store/use-editor-store";

interface DocumentProps {
  preloadedDocument: Preloaded<typeof api.documents.getById>;
}

export const Document = ({ preloadedDocument }: DocumentProps) => {
  const document = usePreloadedQuery(preloadedDocument);
  const { editor } = useEditorStore();
  

  // Process initial content to ensure proper TipTap JSON format
  const processedContent = processTemplateContent(document.initialContent);

  // Console logging to show how document contents are passed
  console.log("📄 Document Data:", {
    documentId: document._id,
    title: document.title,
    initialContent: document.initialContent,
    processedContent: processedContent,
    contentType: typeof processedContent,
    isTipTapJSON: typeof processedContent === 'object' && processedContent?.type === 'doc'
  });





  return (
    <Room>
      <div className="min-h-screen bg-editor-bg flex">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col mr-96">
          <div className="flex flex-col px-4 pt-2 gap-y-2 fixed top-0 left-0 z-10 bg-[#FAFBFD] print:hidden h-[112px] w-full">
            <Navbar data={document} />
            <Toolbar />
          </div>
          <div className="pt-[114px] print:pt-0 flex-1">
            <Editor 
              initialContent={processedContent} 
              onLegalAI={() => {}}
            />
          </div>
        </div>

        {/* Legal AI Panel - Always Visible Right Side Below Header */}
        {editor && (
          <div className="fixed right-0 top-[112px] h-[calc(100vh-112px)] w-96 z-20 print:hidden bg-white border-l border-gray-200 overflow-y-auto">
            <LegalAIPanel editor={editor} />
          </div>
        )}


      </div>
    </Room>
  );
};
