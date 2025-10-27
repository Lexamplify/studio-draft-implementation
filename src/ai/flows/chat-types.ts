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
    draftId: z.string().optional(),
    userId: z.string().optional(),
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
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatInput = z.infer<typeof ChatInputSchema>;
export type ChatOutput = z.infer<typeof ChatOutputSchema>;
