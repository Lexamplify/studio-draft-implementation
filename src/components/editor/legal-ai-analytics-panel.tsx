"use client";

import React from 'react';
import { Editor } from '@tiptap/react';
import { useLegalAIEditor } from '@/hooks/use-legal-ai-editor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Scale, FileText, Brain, AlertTriangle, History } from 'lucide-react';

interface LegalAIAnalyticsPanelProps {
  editor: Editor;
  className?: string;
}

export const LegalAIAnalyticsPanel: React.FC<LegalAIAnalyticsPanelProps> = ({ editor, className }) => {
  const [showHistory, setShowHistory] = React.useState(false);
  
  const {
    hasSelection,
    selectedText,
    selectionContext,
    lastResponse,
    executeCommand,
    getDocumentMetrics,
    getHistory,
    integration
  } = useLegalAIEditor(editor, {
    enableHistory: true,
    showConfidence: true,
    validateChanges: true,
    autoSave: false,
    onEditComplete: (response) => {
      console.log('Legal edit completed:', response);
    },
    onError: (error) => {
      console.error('Legal AI error:', error);
    }
  });

  const documentMetrics = getDocumentMetrics();
  const editHistory = getHistory();

  return (
    <div className={`legal-ai-analytics-panel ${className || ''}`}>
      {/* Selection Analysis */}
      {selectionContext && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <CardTitle className="text-sm">Selection Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Selected Text Preview */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Selected Text:</p>
              <div className="p-2 bg-gray-50 rounded text-sm max-h-20 overflow-y-auto">
                {selectedText || 'No text selected'}
              </div>
            </div>

            {/* Legal Elements */}
            {selectionContext.legalElements.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Legal Elements:</p>
                <div className="flex flex-wrap gap-1">
                  {selectionContext.legalElements.map((element, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {element}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Document Structure */}
            {selectionContext.documentStructure && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Document Structure:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Paragraphs:</span>
                    <span className="ml-1 font-medium">
                      {selectionContext.documentStructure.totalParagraphs || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Headings:</span>
                    <span className="ml-1 font-medium">
                      {selectionContext.documentStructure.totalHeadings || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Lists:</span>
                    <span className="ml-1 font-medium">
                      {selectionContext.documentStructure.totalLists || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tables:</span>
                    <span className="ml-1 font-medium">
                      {selectionContext.documentStructure.hasTables ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Quick Actions</CardTitle>
          <CardDescription className="text-xs">
            Common legal editing tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => executeCommand('Rephrase this clause in formal legal language')}
              disabled={!hasSelection}
              className="text-left p-2 text-xs bg-blue-50 hover:bg-blue-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-medium">Rephrase Clause</div>
              <div className="text-gray-600">Make language more formal</div>
            </button>
            
            <button
              onClick={() => executeCommand('Strengthen the legal language and enforceability')}
              disabled={!hasSelection}
              className="text-left p-2 text-xs bg-green-50 hover:bg-green-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-medium">Strengthen Language</div>
              <div className="text-gray-600">Improve enforceability</div>
            </button>
            
            <button
              onClick={() => executeCommand('Simplify this clause for better readability')}
              disabled={!hasSelection}
              className="text-left p-2 text-xs bg-purple-50 hover:bg-purple-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-medium">Simplify Language</div>
              <div className="text-gray-600">Improve readability</div>
            </button>
            
            <button
              onClick={() => executeCommand('Remove redundant legal terms and phrases')}
              disabled={!hasSelection}
              className="text-left p-2 text-xs bg-orange-50 hover:bg-orange-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-medium">Remove Redundancy</div>
              <div className="text-gray-600">Clean up repetitive text</div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Last Response Summary */}
      {lastResponse && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-green-600" />
              <CardTitle className="text-sm">Last Edit Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Confidence:</span>
              <Badge 
                variant={
                  lastResponse.confidence >= 0.8 ? 'default' :
                  lastResponse.confidence >= 0.6 ? 'secondary' : 'destructive'
                }
              >
                {Math.round(lastResponse.confidence * 100)}%
              </Badge>
            </div>
            
            {lastResponse.changes.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Changes Made:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  {lastResponse.changes.map((change, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {lastResponse.warnings && lastResponse.warnings.length > 0 && (
              <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-yellow-800">Warnings:</p>
                  <ul className="text-xs text-yellow-700">
                    {lastResponse.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Document Metrics */}
      {documentMetrics && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm">Document Metrics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Words:</span>
                <span className="ml-2 font-medium">{documentMetrics.wordCount}</span>
              </div>
              <div>
                <span className="text-gray-600">Characters:</span>
                <span className="ml-2 font-medium">{documentMetrics.characterCount}</span>
              </div>
              <div>
                <span className="text-gray-600">Sentences:</span>
                <span className="ml-2 font-medium">{documentMetrics.sentenceCount}</span>
              </div>
              <div>
                <span className="text-gray-600">Paragraphs:</span>
                <span className="ml-2 font-medium">{documentMetrics.paragraphCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legal Elements from Selection */}
      {selectionContext && selectionContext.legalElements && selectionContext.legalElements.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm">Legal Elements Detected</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {selectionContext.legalElements.map((element, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {element}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit History */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-gray-600" />
            <CardTitle className="text-sm">Edit History</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Dialog open={showHistory} onOpenChange={setShowHistory}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" size="sm">
                <History className="h-4 w-4 mr-2" />
                View Edit History ({editHistory.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit History</DialogTitle>
                <DialogDescription>
                  View and restore previous edits. Select text in your document and click "Restore" to replace the selected content with the previous version.
                </DialogDescription>
              </DialogHeader>
              
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {editHistory.map((edit: any, index: number) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{edit.command}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(edit.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            try {
                              integration?.restoreEdit(edit.before);
                              setShowHistory(false);
                              console.log('✅ Edit restored successfully');
                            } catch (error) {
                              console.error('❌ Failed to restore edit:', error);
                            }
                          }}
                        >
                          Restore
                        </Button>
                      </div>
                    </Card>
                  ))}
                  
                  {editHistory.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No edit history available</p>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};



