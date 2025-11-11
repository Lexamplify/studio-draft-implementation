/**
 * JSON Extractor for TipTap/ProseMirror Editor
 * 
 * This utility extracts JSON fragments from selected content in the editor
 * and provides context for legal AI processing.
 */

import { Editor } from '@tiptap/react';

export interface ExtractedContent {
  jsonSlice: any;
  textContent: string;
  selectionRange: {
    from: number;
    to: number;
  };
  context: {
    before: string;
    after: string;
    documentType?: string;
  };
}

export interface SelectionContext {
  selectedText: string;
  surroundingText: string;
  documentStructure: any;
  legalElements: string[];
}

/**
 * JSON Extractor Class for Legal Document Editing
 */
export class JSONExtractor {
  /**
   * Extract JSON slice from selected content
   */
  static extractSelectedContent(editor: Editor): ExtractedContent | null {
    if (!editor || !editor.state.selection) {
      return null;
    }

    const { from, to } = editor.state.selection;
    
    if (from === to) {
      return null; // No selection
    }

    try {
      // Extract the JSON slice of selected content
      const jsonSlice = editor.state.doc.slice(from, to).toJSON();
      
      // Get text content
      const textContent = editor.state.doc.textBetween(from, to);
      
      // Get surrounding context
      const context = this.getContext(editor, from, to);
      
      return {
        jsonSlice,
        textContent,
        selectionRange: { from, to },
        context
      };
    } catch (error) {
      console.error('Error extracting selected content:', error);
      return null;
    }
  }

  /**
   * Get context around the selection
   */
  private static getContext(editor: Editor, from: number, to: number): {
    before: string;
    after: string;
    documentType?: string;
  } {
    const doc = editor.state.doc;
    const contextLength = 100; // Characters before and after
    
    const beforeStart = Math.max(0, from - contextLength);
    const afterEnd = Math.min(doc.content.size, to + contextLength);
    
    const before = doc.textBetween(beforeStart, from);
    const after = doc.textBetween(to, afterEnd);
    
    // Try to detect document type from content
    const documentType = this.detectDocumentType(doc.textContent);
    
    return {
      before,
      after,
      documentType
    };
  }

  /**
   * Detect document type from content
   */
  private static detectDocumentType(content: string): string | undefined {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('agreement') || lowerContent.includes('contract')) {
      return 'contract';
    }
    
    if (lowerContent.includes('motion') || lowerContent.includes('court')) {
      return 'motion';
    }
    
    if (lowerContent.includes('brief') || lowerContent.includes('argument')) {
      return 'brief';
    }
    
    if (lowerContent.includes('settlement') || lowerContent.includes('mediation')) {
      return 'agreement';
    }
    
    return undefined;
  }

  /**
   * Extract legal elements from content
   */
  static extractLegalElements(content: string): string[] {
    const legalElements: string[] = [];
    
    // Common legal terms and phrases
    const legalPatterns = [
      /\b(whereas|hereby|therefore|notwithstanding)\b/gi,
      /\b(party|parties|agreement|contract|clause|section)\b/gi,
      /\b(liability|damages|indemnification|warranty)\b/gi,
      /\b(jurisdiction|governing law|venue|arbitration)\b/gi,
      /\b(confidentiality|non-disclosure|proprietary)\b/gi,
      /\b(termination|breach|remedy|enforcement)\b/gi,
      /\b(consideration|performance|obligation|duty)\b/gi,
      /\b(force majeure|act of god|unforeseen circumstances)\b/gi,
      /\b(severability|entire agreement|modification)\b/gi,
      /\b(notice|communication|delivery|service)\b/gi
    ];
    
    legalPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        legalElements.push(...matches.map(m => m.toLowerCase()));
      }
    });
    
    return [...new Set(legalElements)]; // Remove duplicates
  }

  /**
   * Get selection context for legal analysis
   */
  static getSelectionContext(editor: Editor): SelectionContext | null {
    const extracted = this.extractSelectedContent(editor);
    
    if (!extracted) {
      return null;
    }
    
    const { textContent, context } = extracted;
    const surroundingText = `${context.before}${textContent}${context.after}`;
    const legalElements = this.extractLegalElements(textContent);
    
    // Get document structure (simplified)
    const documentStructure = this.getDocumentStructure(editor);
    
    return {
      selectedText: textContent,
      surroundingText,
      documentStructure,
      legalElements
    };
  }

  /**
   * Get document structure for context
   */
  private static getDocumentStructure(editor: Editor): any {
    try {
      // Get the full document JSON
      const docJson = editor.getJSON();
      
      // Extract structure information
      return {
        totalParagraphs: this.countNodes(docJson, 'paragraph'),
        totalHeadings: this.countNodes(docJson, 'heading'),
        totalLists: this.countNodes(docJson, 'bulletList') + this.countNodes(docJson, 'orderedList'),
        hasTables: this.hasNode(docJson, 'table'),
        documentSize: editor.state.doc.content.size
      };
    } catch (error) {
      console.error('Error getting document structure:', error);
      return {};
    }
  }

  /**
   * Count nodes of a specific type
   */
  private static countNodes(json: any, type: string): number {
    if (!json || typeof json !== 'object') return 0;
    
    let count = 0;
    
    if (json.type === type) {
      count++;
    }
    
    if (json.content && Array.isArray(json.content)) {
      json.content.forEach((item: any) => {
        count += this.countNodes(item, type);
      });
    }
    
    return count;
  }

  /**
   * Check if document has a specific node type
   */
  private static hasNode(json: any, type: string): boolean {
    if (!json || typeof json !== 'object') return false;
    
    if (json.type === type) return true;
    
    if (json.content && Array.isArray(json.content)) {
      return json.content.some((item: any) => this.hasNode(item, type));
    }
    
    return false;
  }

  /**
   * Validate extracted JSON
   */
  static validateExtractedJSON(json: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!json) {
      errors.push('No JSON content extracted');
      return { isValid: false, errors, warnings };
    }
    
    if (typeof json !== 'object') {
      errors.push('Extracted content is not a valid JSON object');
      return { isValid: false, errors, warnings };
    }
    
    // Check for required fields
    if (!json.type) {
      warnings.push('JSON missing type field');
    }
    
    if (!json.content && !json.text) {
      warnings.push('JSON appears to have no content');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get word count and other metrics
   */
  static getContentMetrics(content: string): {
    wordCount: number;
    characterCount: number;
    sentenceCount: number;
    paragraphCount: number;
  } {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(para => para.trim().length > 0);
    
    return {
      wordCount: words.length,
      characterCount: content.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length
    };
  }
}
