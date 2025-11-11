"use client";

import { Room } from "./room";
import { Editor } from "./editor";
import { Navbar } from "./navbar";
import { Toolbar } from "./toolbar";
import { LegalAIPanel } from "./legal-ai-panel";
import { DocumentInfoPanel } from "@/components/editor/document-info-panel";
import { processTemplateContent } from "@/lib/template-processor";
import { useEditorStore } from "@/store/use-editor-store";
import { Document as DocumentType } from "@/lib/firebase-document-service";

interface DocumentProps {
  document: DocumentType;
  caseData?: any;
}

export const Document = ({ document, caseData }: DocumentProps) => {
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





  // Map document to match navbar interface (uses _id instead of id)
  const documentForNavbar = {
    ...document,
    _id: document.id,
  };

  return (
    <Room>
      <div className="min-h-screen bg-editor-bg flex">
        {/* Document Info Panel - Left Side */}
        {editor && (
          <div className="fixed left-0 top-[112px] h-[calc(100vh-112px)] w-80 z-20 print:hidden bg-white border-r border-gray-200 overflow-y-auto">
            <DocumentInfoPanel editor={editor} />
          </div>
        )}

        {/* Main Editor Area */}
        <div className={`flex-1 flex flex-col ${editor ? 'ml-80 mr-[512px]' : 'mr-[512px]'}`}>
          <div className="flex flex-col px-4 pt-2 gap-y-2 fixed top-0 left-0 z-10 bg-[#FAFBFD] print:hidden h-[112px] w-full">
            <Navbar data={documentForNavbar} />
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
          <div className="fixed right-0 top-[112px] h-[calc(100vh-112px)] w-[512px] z-20 print:hidden bg-white border-l border-gray-200 overflow-hidden">
            <LegalAIPanel editor={editor} caseData={caseData} documentId={document.id} />
          </div>
        )}


      </div>
    </Room>
  );
};
