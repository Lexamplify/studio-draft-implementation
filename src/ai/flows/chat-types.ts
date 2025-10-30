import { z } from 'genkit';

// Input schema for chat messages
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.date().optional(),
});

export const ChatInputSchema = z.object({
  message: z.string().describe('The user message'),
  chatHistory: z.array(ChatMessageSchema).optional().describe('Previous conversation history'),
  context: z.object({
    caseId: z.string().optional(),
    caseName: z.string().optional(),
    caseMetadata: z.object({
      caseName: z.string().optional(),
      tags: z.array(z.string()).optional(),
      details: z.object({
        caseNumber: z.string().optional(),
        caseType: z.string().optional(),
        courtName: z.string().optional(),
        petitionerName: z.string().optional(),
        respondentName: z.string().optional(),
        judgeName: z.string().optional(),
        filingDate: z.string().optional(),
        nextHearingDate: z.string().optional(),
        status: z.string().optional(),
        jurisdiction: z.string().optional(),
        caseCategory: z.string().optional(),
      }).optional(),
    }).optional(),
    draftId: z.string().optional(),
    userId: z.string().optional(),
    documentContext: z.array(z.object({
      docId: z.string(),
      fileName: z.string(),
      summary: z.string(),
    })).optional(),
  }).optional(),
  document: z.string().optional().describe('Uploaded document content'),
  documentName: z.string().optional().describe('Name of uploaded document'),
});

export const ChatOutputSchema = z.object({
  response: z.string().describe('AI response message'),
  citations: z.array(z.object({
    title: z.string(),
    url: z.string().optional(),
  })).optional().describe('Legal citations found'),
  suggestions: z.array(z.string()).optional().describe('Follow-up suggestions'),
  actionType: z.enum(['createCase', 'createDraft', 'addEvent', 'none']).optional().describe('Type of action if any'),
  caseData: z.object({
    caseId: z.string().optional(),
    caseName: z.string().optional(),
    tags: z.array(z.string()).optional(),
    details: z.object({
      petitionerName: z.string().optional(),
      respondentName: z.string().optional(),
      caseNumber: z.string().optional(),
      courtName: z.string().optional(),
      judgeName: z.string().optional(),
      petitionerCounsel: z.string().optional(),
      respondentCounsel: z.string().optional(),
      caseType: z.string().optional(),
      filingDate: z.string().optional(),
      nextHearingDate: z.string().optional(),
      summary: z.string().optional(),
      legalSections: z.array(z.string()).optional(),
      keyFacts: z.array(z.string()).optional(),
    }).optional(),
    createdAt: z.string().optional(),
  }).optional().describe('Case data if case creation is suggested or completed'),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatInput = z.infer<typeof ChatInputSchema>;
export type ChatOutput = z.infer<typeof ChatOutputSchema>;
