"use client";

import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { EditorIntegration } from '@/lib/editor-integration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  History, 
  Clock,
  User
} from 'lucide-react';
import { useFirebaseUser } from '@/hooks/use-firebase-user';
import { ClientSideSuspense } from '@liveblocks/react/suspense';

interface DocumentInfoPanelProps {
  editor: Editor;
  className?: string;
}

interface EditHistoryItem {
  timestamp: number;
  command: string;
  userId?: string;
  userName?: string;
}

function DocumentInfoPanelContent({ editor, className }: DocumentInfoPanelProps) {
  const [integration, setIntegration] = useState<EditorIntegration | null>(null);
  const [documentMetrics, setDocumentMetrics] = useState<any>(null);
  const [editHistory, setEditHistory] = useState<EditHistoryItem[]>([]);
  const { user } = useFirebaseUser();

  // Initialize editor integration
  useEffect(() => {
    if (editor) {
      const editorIntegration = new EditorIntegration(editor, {
        enableHistory: true,
        showConfidence: false,
        validateChanges: true,
        autoSave: false
      });
      setIntegration(editorIntegration);
    }
  }, [editor]);

  // Update metrics and history when editor changes
  useEffect(() => {
    if (!integration || !editor) return;

    const updateMetrics = () => {
      const metrics = integration.getDocumentMetrics();
      setDocumentMetrics(metrics);
    };

    const updateHistory = () => {
      const history = integration.getHistory();
      // Map history to include user info
      const historyWithUsers: EditHistoryItem[] = history.map((item: any) => ({
        timestamp: item.timestamp,
        command: item.command,
        userId: user?.uid,
        userName: user?.displayName || user?.email || 'You'
      }));
      setEditHistory(historyWithUsers);
    };

    // Initial update
    updateMetrics();
    updateHistory();

    // Listen to editor changes
    const handleUpdate = () => {
      updateMetrics();
      updateHistory();
    };

    editor.on('update', handleUpdate);
    editor.on('transaction', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
      editor.off('transaction', handleUpdate);
    };
  }, [integration, editor, user]);

  // Note: Active collaborators would be shown here if using Liveblocks
  // For now, we'll show edit history with user info from Firebase

  return (
    <div className={`document-info-panel h-full flex flex-col ${className || ''}`}>
      {/* Document Metrics */}
      <Card className="border-0 rounded-none border-b">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Document Metrics</CardTitle>
          </div>
          <CardDescription>
            Real-time document statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documentMetrics ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Words</div>
                <div className="text-2xl font-semibold text-gray-900">{documentMetrics.wordCount || 0}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Characters</div>
                <div className="text-2xl font-semibold text-gray-900">{documentMetrics.characterCount || 0}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Sentences</div>
                <div className="text-2xl font-semibold text-gray-900">{documentMetrics.sentenceCount || 0}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Paragraphs</div>
                <div className="text-2xl font-semibold text-gray-900">{documentMetrics.paragraphCount || 0}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Loading metrics...</div>
          )}
        </CardContent>
      </Card>


      {/* Edit History */}
      <Card className="border-0 rounded-none flex-1 flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Edit History</CardTitle>
          </div>
          <CardDescription>
            Recent document changes
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-3">
              {editHistory.length > 0 ? (
                editHistory.slice().reverse().map((edit, index) => (
                  <div key={index} className="p-3 rounded-lg border border-gray-200 bg-white">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {edit.userName || 'Unknown User'}
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">
                            {new Date(edit.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 truncate" title={edit.command}>
                          {edit.command}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(edit.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No edit history yet</p>
                  <p className="text-xs mt-1">Changes will appear here as you edit</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export const DocumentInfoPanel: React.FC<DocumentInfoPanelProps> = ({ editor, className }) => {
  return (
    <ClientSideSuspense fallback={
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading panel...</p>
        </div>
      </div>
    }>
      <DocumentInfoPanelContent editor={editor} className={className} />
    </ClientSideSuspense>
  );
};

