/**
 * Editor Integration for Legal AI Document Editing
 * 
 * This module handles the integration between the TipTap editor
 * and the legal AI service for seamless document editing.
 */

import { Editor } from '@tiptap/react';
import { LegalAIService, LegalEditRequest, LegalEditResponse } from './legal-ai-service';
import { JSONExtractor, ExtractedContent } from './json-extractor';

export interface LegalEditCommand {
  id: string;
  label: string;
  description: string;
  example: string;
}

export interface EditorIntegrationOptions {
  enableHistory: boolean;
  showConfidence: boolean;
  validateChanges: boolean;
  autoSave: boolean;
}

export class EditorIntegration {
  private editor: Editor;
  private options: EditorIntegrationOptions;
  private history: Array<{
    timestamp: number;
    before: any;
    after: any;
    command: string;
  }> = [];

  constructor(editor: Editor, options: Partial<EditorIntegrationOptions> = {}) {
    this.editor = editor;
    this.options = {
      enableHistory: true,
      showConfidence: true,
      validateChanges: true,
      autoSave: false,
      ...options
    };
  }

  /**
   * Process a legal editing command
   * If no content is selected, processes the entire document
   */
  async processLegalCommand(command: string): Promise<LegalEditResponse | null> {
    try {
      // Extract selected content, or use entire document if nothing is selected
      let extractedContent = JSONExtractor.extractSelectedContent(this.editor);
      
      // If no selection, extract the entire document
      if (!extractedContent) {
        const fullDocument = this.editor.getJSON();
        const fullText = this.editor.getText();
        
        // Create a synthetic extracted content for the full document
        extractedContent = {
          jsonSlice: fullDocument,
          textContent: fullText,
          selectionRange: { from: 0, to: this.editor.state.doc.content.size },
          context: {
            before: '',
            after: '',
            documentType: 'other'
          }
        };
      }

      // Validate extracted content
      const validation = JSONExtractor.validateExtractedJSON(extractedContent.jsonSlice);
      if (!validation.isValid) {
        throw new Error(`Invalid content: ${validation.errors.join(', ')}`);
      }

      // Prepare the legal edit request
      const request: LegalEditRequest = {
        selectedJsonSlice: extractedContent.jsonSlice,
        userCommand: command,
        documentContext: extractedContent.context.before + extractedContent.context.after,
        documentType: extractedContent.context.documentType as any
      };

      // Process with legal AI service
      const response = await LegalAIService.processLegalEdit(request);

      // Normalize the response to ensure it has the proper structure
      const normalizedResponse = this.normalizeResponse(response);

      // Apply changes to editor
      await this.applyChanges(extractedContent, normalizedResponse);

      // Save to history
      if (this.options.enableHistory) {
        // Extract the content array from the jsonSlice for proper storage
        const beforeContent = extractedContent.jsonSlice?.content || extractedContent.jsonSlice;
        this.saveToHistory(beforeContent, normalizedResponse.modifiedJson, command);
      }

      return normalizedResponse;
    } catch (error) {
      console.error('Error processing legal command:', error);
      throw error;
    }
  }

  /**
   * Normalize response to ensure proper structure
   */
  private normalizeResponse(response: LegalEditResponse): LegalEditResponse {
    let modifiedJson = response.modifiedJson;
    
    // Ensure the response has the proper structure
    if (modifiedJson) {
      if (Array.isArray(modifiedJson)) {
        // If response is just an array, wrap it
        modifiedJson = {
          type: "doc",
          content: modifiedJson
        };
      } else if (modifiedJson.content && !modifiedJson.type) {
        // If response has content but no type
        modifiedJson = {
          type: "doc",
          content: modifiedJson.content
        };
      } else if (!modifiedJson.type && !modifiedJson.content) {
        // If response is an object but has neither type nor content, try to use it as content
        modifiedJson = {
          type: "doc",
          content: [modifiedJson]
        };
      }
    }
    
    return {
      ...response,
      modifiedJson
    };
  }

  /**
   * Apply changes to the editor
   */
  private async applyChanges(extractedContent: ExtractedContent, response: LegalEditResponse): Promise<void> {
    const { selectionRange } = extractedContent;
    const { modifiedJson } = response;

    try {
      // Store current state for undo
      const beforeState = this.editor.getJSON();

      // Check if this is a full document replacement (no selection was made)
      const isFullDocumentReplacement = selectionRange.from === 0 && 
        selectionRange.to === this.editor.state.doc.content.size;

      // Extract content array from the modified JSON
      // TipTap's insertContent expects content array, not the full doc structure
      let contentToInsert: any = modifiedJson;
      
      // If it's a document with content, extract the content array
      if (modifiedJson && modifiedJson.type === 'doc' && Array.isArray(modifiedJson.content)) {
        contentToInsert = modifiedJson.content;
      }
      // If it's already an array, use it directly
      else if (Array.isArray(modifiedJson)) {
        contentToInsert = modifiedJson;
      }
      // If it has a content property that's an array, use that
      else if (modifiedJson && Array.isArray(modifiedJson.content)) {
        contentToInsert = modifiedJson.content;
      }

      // Validate that we have valid content to insert
      if (!contentToInsert || (Array.isArray(contentToInsert) && contentToInsert.length === 0)) {
        throw new Error('No valid content to insert');
      }

      // Log the structure for debugging
      console.log('📝 Inserting content structure:', {
        isArray: Array.isArray(contentToInsert),
        length: Array.isArray(contentToInsert) ? contentToInsert.length : 'not array',
        firstItemType: Array.isArray(contentToInsert) && contentToInsert[0] ? contentToInsert[0].type : 'N/A',
        isFullDocumentReplacement
      });

      // Apply the changes
      if (isFullDocumentReplacement) {
        // Replace entire document
        this.editor
          .chain()
          .focus()
          .setContent(modifiedJson)
          .run();
      } else {
        // Replace selected content
        this.editor
          .chain()
          .focus()
          .deleteSelection()
          .insertContent(contentToInsert)
          .run();
      }

      // Validate the result
      if (this.options.validateChanges) {
        const validation = this.validateEditorState();
        if (!validation.isValid) {
          console.warn('Editor state validation failed:', validation.errors);
        }
      }

      // Auto-save if enabled
      if (this.options.autoSave) {
        await this.autoSave();
      }

    } catch (error) {
      console.error('Error applying changes to editor:', error);
      throw new Error(`Failed to apply changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate editor state after changes
   */
  private validateEditorState(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      const doc = this.editor.getJSON();
      
      // Basic validation
      if (!doc || typeof doc !== 'object') {
        errors.push('Invalid document structure');
      }
      
      // Type field is optional - we can add it if missing
      if (!doc.type && !doc.content) {
        errors.push('Document must have either type field or content array');
      }
      
      if (!doc.content) {
        errors.push('Document appears to have no content');
      }
      
      // Check for malformed nodes
      this.validateNodes(doc, errors);
      
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Recursively validate nodes
   */
  private validateNodes(node: any, errors: string[]): void {
    if (!node || typeof node !== 'object') return;
    
    // Check for required fields - type is optional for some nodes
    if (!node.type && !node.text && !node.content) {
      errors.push('Node must have type, text, or content');
    }
    
    // Validate content array
    if (node.content && !Array.isArray(node.content)) {
      errors.push('Node content must be an array');
    }
    
    // Recursively validate child nodes
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach((child: any, index: number) => {
        try {
          this.validateNodes(child, errors);
        } catch (error) {
          errors.push(`Error validating child node at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    }
  }

  /**
   * Save changes to history
   */
  private saveToHistory(before: any, after: any, command: string): void {
    console.log('💾 Saving to history:', {
      command,
      beforeStructure: {
        type: typeof before,
        isArray: Array.isArray(before),
        hasContent: !!before?.content,
        keys: before ? Object.keys(before) : []
      },
      afterStructure: {
        type: typeof after,
        isArray: Array.isArray(after),
        hasContent: !!after?.content,
        keys: after ? Object.keys(after) : []
      }
    });
    
    this.history.push({
      timestamp: Date.now(),
      before,
      after,
      command
    });
    
    // Limit history size
    if (this.history.length > 50) {
      this.history = this.history.slice(-50);
    }
  }

  /**
   * Get available legal commands
   */
  getLegalCommands(): LegalEditCommand[] {
    return LegalAIService.getLegalCommands();
  }

  /**
   * Get editing history
   */
  getHistory(): Array<{
    timestamp: number;
    before: any;
    after: any;
    command: string;
  }> {
    return [...this.history];
  }

  /**
   * Undo last legal edit
   */
  undoLastEdit(): boolean {
    if (this.history.length === 0) {
      return false;
    }
    
    const lastEdit = this.history.pop();
    if (!lastEdit) {
      return false;
    }
    
    try {
      // Restore the previous state
      this.editor
        .chain()
        .focus()
        .setContent(lastEdit.before)
        .run();
      
      return true;
    } catch (error) {
      console.error('Error undoing last edit:', error);
      return false;
    }
  }

  /**
   * Auto-save functionality
   */
  private async autoSave(): Promise<void> {
    try {
      // This would integrate with your document saving logic
      // For now, just log the action
      console.log('Auto-saving document...');
      
      // Example: Save to Convex or your backend
      // await saveDocument(this.editor.getJSON());
      
    } catch (error) {
      console.error('Error auto-saving:', error);
    }
  }

  /**
   * Get current selection context
   */
  getSelectionContext() {
    return JSONExtractor.getSelectionContext(this.editor);
  }

  /**
   * Check if content is selected
   */
  hasSelection(): boolean {
    const { from, to } = this.editor.state.selection;
    return from !== to;
  }

  /**
   * Get selected text
   */
  getSelectedText(): string {
    const { from, to } = this.editor.state.selection;
    return this.editor.state.doc.textBetween(from, to);
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.editor.commands.blur();
  }

  /**
   * Select all text
   */
  selectAll(): void {
    this.editor.commands.selectAll();
  }

  /**
   * Get document metrics
   */
  getDocumentMetrics() {
    const content = this.editor.getText();
    return JSONExtractor.getContentMetrics(content);
  }

  /**
   * Export document as JSON
   */
  exportAsJSON(): any {
    return this.editor.getJSON();
  }

  /**
   * Import document from JSON - restores only the selected content
   */
  importFromJSON(json: any): void {
    try {
      // Handle different JSON structures
      let contentToInsert = json;
      
      // If it's a ProseMirror slice with content array, extract the content
      if (json && json.content && Array.isArray(json.content)) {
        contentToInsert = json.content;
      }
      // If it's a document with content, extract the content
      else if (json && json.type === 'doc' && json.content) {
        contentToInsert = json.content;
      }
      // If it's already an array, use it directly
      else if (Array.isArray(json)) {
        contentToInsert = json;
      }
      
      // Ensure we have valid content to insert
      if (!contentToInsert || (Array.isArray(contentToInsert) && contentToInsert.length === 0)) {
        console.warn('No valid content to insert');
        return;
      }
      
      // Insert the content
      this.editor
        .chain()
        .focus()
        .deleteSelection()
        .insertContent(contentToInsert)
        .run();
    } catch (error) {
      console.error('Error importing JSON:', error);
      console.error('JSON structure:', json);
      throw new Error(`Failed to import JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Restore a previous edit - replaces current selection with the before state
   */
  restoreEdit(beforeJson: any): void {
    try {
      console.log('🔄 Restoring edit:', {
        originalStructure: {
          type: typeof beforeJson,
          isArray: Array.isArray(beforeJson),
          hasContent: !!beforeJson?.content,
          keys: beforeJson ? Object.keys(beforeJson) : []
        }
      });
      
      // Handle different JSON structures
      let contentToInsert = beforeJson;
      
      // If it's a ProseMirror slice with content array, extract the content
      if (beforeJson && beforeJson.content && Array.isArray(beforeJson.content)) {
        contentToInsert = beforeJson.content;
        console.log('🔧 Extracted content from ProseMirror slice');
      }
      // If it's a document with content, extract the content
      else if (beforeJson && beforeJson.type === 'doc' && beforeJson.content) {
        contentToInsert = beforeJson.content;
        console.log('🔧 Extracted content from document');
      }
      // If it's already an array, use it directly
      else if (Array.isArray(beforeJson)) {
        contentToInsert = beforeJson;
        console.log('🔧 Using array directly');
      }
      
      console.log('📝 Final content to insert:', {
        type: typeof contentToInsert,
        isArray: Array.isArray(contentToInsert),
        length: Array.isArray(contentToInsert) ? contentToInsert.length : 'not array'
      });
      
      // Ensure we have valid content to insert
      if (!contentToInsert || (Array.isArray(contentToInsert) && contentToInsert.length === 0)) {
        console.warn('No valid content to restore');
        return;
      }
      
      // Check if there's a current selection
      const { from, to } = this.editor.state.selection;
      
      if (from === to) {
        // No selection, just insert at cursor position
        this.editor
          .chain()
          .focus()
          .insertContent(contentToInsert)
          .run();
      } else {
        // Replace current selection with the before content
        this.editor
          .chain()
          .focus()
          .deleteSelection()
          .insertContent(contentToInsert)
          .run();
      }
    } catch (error) {
      console.error('Error restoring edit:', error);
      console.error('JSON structure:', beforeJson);
      throw new Error(`Failed to restore edit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update integration options
   */
  updateOptions(newOptions: Partial<EditorIntegrationOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Get current options
   */
  getOptions(): EditorIntegrationOptions {
    return { ...this.options };
  }
}
