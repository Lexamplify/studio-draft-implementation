/**
 * Hook for Legal AI Editor Integration
 * 
 * This hook provides easy integration of the Legal AI Editor
 * with TipTap editor instances.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { EditorIntegration } from '@/lib/editor-integration';
import { LegalEditResponse } from '@/lib/legal-ai-service';
import { SelectionContext } from '@/lib/json-extractor';

export interface UseLegalAIEditorOptions {
  enableHistory?: boolean;
  showConfidence?: boolean;
  validateChanges?: boolean;
  autoSave?: boolean;
  onEditComplete?: (response: LegalEditResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseLegalAIEditorReturn {
  integration: EditorIntegration | null;
  isProcessing: boolean;
  hasSelection: boolean;
  selectedText: string;
  selectionContext: SelectionContext | null;
  lastResponse: LegalEditResponse | null;
  executeCommand: (command: string) => Promise<LegalEditResponse | null>;
  undoLastEdit: () => boolean;
  clearSelection: () => void;
  selectAll: () => void;
  getDocumentMetrics: () => any;
  exportAsJSON: () => any;
  importFromJSON: (json: any) => void;
  getHistory: () => any[];
  clearHistory: () => void;
}

export function useLegalAIEditor(
  editor: Editor | null,
  options: UseLegalAIEditorOptions = {}
): UseLegalAIEditorReturn {
  const [integration, setIntegration] = useState<EditorIntegration | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectionContext, setSelectionContext] = useState<SelectionContext | null>(null);
  const [lastResponse, setLastResponse] = useState<LegalEditResponse | null>(null);
  const historyRef = useRef<any[]>([]);

  const {
    enableHistory = true,
    showConfidence = true,
    validateChanges = true,
    autoSave = false,
    onEditComplete,
    onError
  } = options;

  // Initialize editor integration
  useEffect(() => {
    if (editor) {
      const editorIntegration = new EditorIntegration(editor, {
        enableHistory,
        showConfidence,
        validateChanges,
        autoSave
      });
      setIntegration(editorIntegration);
    } else {
      setIntegration(null);
    }
  }, [editor, enableHistory, showConfidence, validateChanges, autoSave]);

  // Update selection context when selection changes
  useEffect(() => {
    if (integration && editor) {
      const context = integration.getSelectionContext();
      setSelectionContext(context);
    }
  }, [integration, editor?.state.selection]);

  // Execute a legal command
  const executeCommand = useCallback(async (command: string): Promise<LegalEditResponse | null> => {
    if (!integration) {
      const error = new Error('Editor integration not available');
      onError?.(error);
      throw error;
    }

    if (!integration.hasSelection()) {
      const error = new Error('No text selected');
      onError?.(error);
      throw error;
    }

    if (!command.trim()) {
      const error = new Error('Command cannot be empty');
      onError?.(error);
      throw error;
    }

    setIsProcessing(true);
    try {
      const response = await integration.processLegalCommand(command);
      setLastResponse(response);
      onEditComplete?.(response);
      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [integration, onEditComplete, onError]);

  // Undo last edit
  const undoLastEdit = useCallback((): boolean => {
    if (!integration) return false;
    
    const success = integration.undoLastEdit();
    if (success) {
      setLastResponse(null);
    }
    return success;
  }, [integration]);

  // Clear selection
  const clearSelection = useCallback(() => {
    integration?.clearSelection();
  }, [integration]);

  // Select all text
  const selectAll = useCallback(() => {
    integration?.selectAll();
  }, [integration]);

  // Get document metrics
  const getDocumentMetrics = useCallback(() => {
    return integration?.getDocumentMetrics() || null;
  }, [integration]);

  // Export document as JSON
  const exportAsJSON = useCallback(() => {
    return integration?.exportAsJSON() || null;
  }, [integration]);

  // Import document from JSON
  const importFromJSON = useCallback((json: any) => {
    try {
      integration?.importFromJSON(json);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to import JSON');
      onError?.(err);
      throw err;
    }
  }, [integration, onError]);

  // Get edit history
  const getHistory = useCallback(() => {
    return integration?.getHistory() || [];
  }, [integration]);

  // Clear edit history
  const clearHistory = useCallback(() => {
    // This would need to be implemented in EditorIntegration
    // For now, we'll just clear the local state
    historyRef.current = [];
  }, []);

  // Get selected text
  const selectedText = integration?.getSelectedText() || '';
  const hasSelection = integration?.hasSelection() || false;

  return {
    integration,
    isProcessing,
    hasSelection,
    selectedText,
    selectionContext,
    lastResponse,
    executeCommand,
    undoLastEdit,
    clearSelection,
    selectAll,
    getDocumentMetrics,
    exportAsJSON,
    importFromJSON,
    getHistory,
    clearHistory
  };
}

/**
 * Hook for quick legal commands
 */
export function useQuickLegalCommands(editor: Editor | null) {
  const { executeCommand, isProcessing } = useLegalAIEditor(editor);

  const quickCommands = {
    rephrase: () => executeCommand('Rephrase this clause in formal legal language'),
    strengthen: () => executeCommand('Strengthen the legal language and enforceability'),
    simplify: () => executeCommand('Simplify this clause for better readability'),
    addBullet: (content: string) => executeCommand(`Add a bullet point: ${content}`),
    summarize: () => executeCommand('Summarize this section for client briefing'),
    removeRedundant: () => executeCommand('Remove redundant legal terms and phrases')
  };

  return {
    ...quickCommands,
    isProcessing
  };
}

/**
 * Hook for legal document analysis
 */
export function useLegalDocumentAnalysis(editor: Editor | null) {
  const { selectionContext, getDocumentMetrics } = useLegalAIEditor(editor);

  const analysis = {
    hasLegalElements: selectionContext?.legalElements.length > 0,
    legalElements: selectionContext?.legalElements || [],
    documentMetrics: getDocumentMetrics(),
    isLegalDocument: selectionContext?.legalElements.length > 5, // Heuristic
    complexity: selectionContext?.legalElements.length > 10 ? 'high' : 
               selectionContext?.legalElements.length > 5 ? 'medium' : 'low'
  };

  return analysis;
}
