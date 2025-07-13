'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

const DocumentProcessingInputSchema = z.object({
  fileData: z.string().describe('Base64 encoded file data'),
  mimeType: z.string().describe('MIME type of the file (e.g., application/pdf)'),
  fileName: z.string().optional().describe('Original file name'),
  prompt: z.string().optional().describe('Custom prompt for document analysis'),
});
export type DocumentProcessingInput = z.infer<typeof DocumentProcessingInputSchema>;

const DocumentProcessingOutputSchema = z.object({
  extractedText: z.string().describe('Extracted and analyzed text from the document'),
  documentType: z.string().optional().describe('Identified document type'),
  keyInformation: z.array(z.string()).optional().describe('Key information points extracted'),
});
export type DocumentProcessingOutput = z.infer<typeof DocumentProcessingOutputSchema>;

// Define the document processing prompt
const documentProcessingPrompt = ai.definePrompt({
  name: 'documentProcessingPrompt',
  input: { schema: DocumentProcessingInputSchema },
  output: { schema: DocumentProcessingOutputSchema },
  prompt: `You are an expert document analysis AI. Analyze the provided document and extract all relevant information.

{{#if fileName}}Document: {{fileName}}{{/if}}

{{#if prompt}}
Custom Instructions: {{prompt}}
{{else}}
Please:
1. Extract all text content from this document
2. If it's a legal document, identify the document type, key sections, and any information that needs to be filled
3. Summarize the main points and important details
4. Identify any forms, fields, or sections that require completion
{{/if}}

Focus on accuracy and completeness in your analysis.`,
});

// Define the document processing flow
const documentProcessingFlow = ai.defineFlow(
  {
    name: 'documentProcessingFlow',
    inputSchema: DocumentProcessingInputSchema,
    outputSchema: DocumentProcessingOutputSchema,
  },
  async (input: DocumentProcessingInput): Promise<DocumentProcessingOutput> => {
    
    try {
      let extractedText = '';

      // If the file is a PDF, try to extract text using pdf-parse
      if (input.mimeType === 'application/pdf') {
        const pdfBuffer = Buffer.from(input.fileData, 'base64');
        try {
          const parsed = await pdfParse(pdfBuffer);
          extractedText = parsed.text.trim();
        } catch (pdfErr) {
          console.error('pdf-parse error:', pdfErr);
        }
      }

      // Fallback: if extraction failed or not PDF, create a document reference summary
      if (!extractedText) {
        extractedText = `[DOCUMENT UPLOADED: ${input.fileName || 'Document'}]\nType: ${input.mimeType}\nSize: ${Math.round(input.fileData.length * 0.75 / 1024)} KB`;
      }

      // For uploaded documents, provide a standard document type based on MIME type
      let documentType = 'Uploaded Document';
      if (input.mimeType === 'application/pdf') {
        documentType = 'PDF Document';
      } else if (input.mimeType.includes('image')) {
        documentType = 'Image Document';
      } else if (input.mimeType.includes('word') || input.mimeType.includes('document')) {
        documentType = 'Word Document';
      } else if (input.mimeType.includes('text')) {
        documentType = 'Text Document';
      }

      // Standard key information for uploaded documents
      const keyInformation: string[] = [
        'Document uploaded and ready for analysis',
        'Ask specific questions about content',
        'Describe document type for targeted help',
        'Legal guidance available based on description'
      ];

      return {
        extractedText,
        documentType: documentType !== 'Unknown' ? documentType : undefined,
        keyInformation: keyInformation.length > 0 ? keyInformation : undefined,
      };
    } catch (error) {
      console.error('Document processing error:', error);
      
      return {
        extractedText: `Error processing document: ${error instanceof Error ? error.message : 'Unknown error'}. The document was uploaded but could not be analyzed. You can still ask questions about it.`,
        documentType: 'Error',
        keyInformation: ['Document processing failed - please try asking specific questions about the document'],
      };
    }
  }
);

export async function processDocument(input: DocumentProcessingInput): Promise<DocumentProcessingOutput> {
  return documentProcessingFlow(input);
} 