import { apiClient } from './api-client';

export interface ParsedDocument {
  content: string;
  metadata: {
    title?: string;
    author?: string;
    pages?: number;
    wordCount?: number;
  };
}

export async function parseDocument(file: File): Promise<ParsedDocument> {
  try {
    // For text files, parse directly on client side
    if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
      return await parseText(file);
    }

    // For PDF, DOCX, and DOC files, use server-side parsing
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/api/parse-document', formData);

    return {
      content: response.content,
      metadata: response.metadata || {}
    };
  } catch (error) {
    console.error('Error parsing document:', error);
    throw new Error(`Failed to parse document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function parseText(file: File): Promise<ParsedDocument> {
  const content = await file.text();
  
  return {
    content,
    metadata: {
      wordCount: content.split(/\s+/).length
    }
  };
}

export function getSupportedFileTypes(): string[] {
  return [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ];
}

export function getSupportedExtensions(): string[] {
  return ['.pdf', '.docx', '.doc', '.txt'];
}

export function isFileTypeSupported(file: File): boolean {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  return getSupportedFileTypes().includes(fileType) || 
         getSupportedExtensions().some(ext => fileName.endsWith(ext));
}
