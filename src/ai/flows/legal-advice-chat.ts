import { genkit } from 'genkit';
import { z } from 'genkit';
import { ai } from '@/ai/genkit';

export const legalAdviceChat = ai.defineFlow(
  {
    name: 'legalAdviceChat',
    inputSchema: z.object({
      message: z.string(),
      chatHistory: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        timestamp: z.string().optional(),
      })).optional(),
      context: z.object({
        chatId: z.string().optional(),
        files: z.array(z.any()).optional(),
        metadata: z.any().optional(),
      }).optional(),
      document: z.string().optional(),
      documentName: z.string().optional(),
    }),
    outputSchema: z.object({
      response: z.string(),
      suggestions: z.array(z.string()).optional(),
      relatedCases: z.array(z.string()).optional(),
    }),
  },
  async ({ message, chatHistory = [], context, document, documentName }) => {
    let promptContent = `You are a legal assistant AI. Provide helpful, accurate legal advice based on the user's query.`;
    
    if (documentName) {
      promptContent += ` The user has uploaded a document: "${documentName}".`;
    }
    
    if (context?.files && context.files.length > 0) {
      promptContent += `\n\nThe user has attached ${context.files.length} file(s) to this chat:`;
      context.files.forEach((file: any, index: number) => {
        promptContent += `\n${index + 1}. ${file.name} (${file.type}) - ${Math.round(file.size / 1024)} KB`;
        if (file.content) {
          promptContent += `\n   Content: ${file.content.substring(0, 1000)}${file.content.length > 1000 ? '...' : ''}`;
        } else {
          promptContent += `\n   [File uploaded to chat - you can reference this document by name: "${file.name}"]`;
        }
      });
      promptContent += `\n\nYou can reference these uploaded documents when answering the user's questions.`;
    }
    
    promptContent += `\n\nUser's question: "${message}"`;
    
    if (chatHistory.length > 0) {
      promptContent += `\n\nPrevious conversation:\n`;
      chatHistory.forEach(msg => {
        promptContent += `${msg.role}: ${msg.content}\n`;
      });
    }
    
    promptContent += `\n\nPlease provide a helpful legal response. If you need more information, ask clarifying questions.`;

    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: promptContent,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    return {
      response: response.text,
      suggestions: [
        "Would you like me to analyze any specific legal documents?",
        "Do you need help with case law research?",
        "Would you like me to draft a legal document?",
      ],
      relatedCases: [],
    };
  }
);

