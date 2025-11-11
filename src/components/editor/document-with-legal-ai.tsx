"use client";

import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { LegalAIPanel } from './legal-ai-panel';
import { LegalAIAnalyticsPanel } from './legal-ai-analytics-panel';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  FileText, 
  Settings, 
  History,
  Scale,
  Wand2
} from 'lucide-react';

interface DocumentWithLegalAIProps {
  initialContent?: any;
  documentId: string;
}

export const DocumentWithLegalAI: React.FC<DocumentWithLegalAIProps> = ({ 
  initialContent, 
  documentId 
}) => {
  const [activeTab, setActiveTab] = useState('editor');
  const [showLegalAI, setShowLegalAI] = useState(true);

  // Initialize the TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      // Add any additional extensions you need
    ],
    content: initialContent || '<p>Start writing your legal document...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4',
      },
    },
  });

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Legal Document Editor</h1>
            <Badge variant="outline" className="flex items-center gap-1">
              <Scale className="h-3 w-3" />
              Legal Mode
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={showLegalAI ? "default" : "outline"}
              size="sm"
              onClick={() => setShowLegalAI(!showLegalAI)}
            >
              <Brain className="h-4 w-4 mr-2" />
              Legal AI
            </Button>
            
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Analytics Panel (Left) */}
        {showLegalAI && (
          <div className="w-64 border-r bg-gray-50 overflow-auto">
            <div className="p-4">
              <LegalAIAnalyticsPanel editor={editor} />
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className={`flex-1 ${showLegalAI ? 'w-2/3' : 'w-full'} transition-all duration-300`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="h-full">
              <div className="h-full border-r">
                <div className="h-full overflow-auto">
                  <div className="p-4">
                    <div 
                      className="min-h-[600px] focus:outline-none"
                      ref={editor.setEditable}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="h-full">
              <div className="h-full overflow-auto p-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Document Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: editor.getHTML() 
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="h-full">
              <div className="h-full overflow-auto p-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Edit History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">
                        Edit history will appear here...
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat Interface Panel (Right) */}
        {showLegalAI && (
          <div className="w-80 border-l bg-gray-50 overflow-auto">
            <div className="p-4">
              <LegalAIPanel editor={editor} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-white px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>Document ID: {documentId}</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Words: {editor.storage.characterCount?.words() || 0}</span>
            <span>Characters: {editor.storage.characterCount?.characters() || 0}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Save
            </Button>
            <Button size="sm">
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Example usage component
export const LegalDocumentExample: React.FC = () => {
  const sampleContent = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'This is a sample legal document. Select any text and use the Legal AI panel to edit it.',
            marks: [{ type: 'bold' }]
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'The parties hereby agree to the following terms and conditions:'
          }
        ]
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Confidentiality obligations shall remain in effect for a period of five (5) years.'
                  }
                ]
              }
            ]
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Any disputes arising from this agreement shall be resolved through binding arbitration.'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  return (
    <DocumentWithLegalAI 
      initialContent={sampleContent}
      documentId="sample-legal-doc"
    />
  );
};
