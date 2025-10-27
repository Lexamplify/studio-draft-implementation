import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Smart fallback title generation based on message content
function generateSmartFallbackTitle(message: string): string {
  const words = message.toLowerCase().split(' ');
  
  // Look for legal keywords to create a better title
  const legalKeywords = ['contract', 'breach', 'dispute', 'legal', 'case', 'court', 'agreement', 'liability', 'damages', 'defendant', 'plaintiff', 'lawsuit', 'settlement', 'arguments', 'defense', 'criminal', 'civil', 'property', 'employment', 'family', 'immigration'];
  const foundKeywords = words.filter(word => legalKeywords.includes(word));
  
  if (foundKeywords.length > 0) {
    // Create title from found keywords
    const keyPhrases = [];
    if (words.includes('contract') && words.includes('breach')) {
      keyPhrases.push('Contract Breach');
    } else if (words.includes('defendant') && words.includes('arguments')) {
      keyPhrases.push('Defense Arguments');
    } else if (words.includes('legal') && words.includes('advice')) {
      keyPhrases.push('Legal Advice');
    } else if (words.includes('case') && words.includes('analysis')) {
      keyPhrases.push('Case Analysis');
    } else if (words.includes('criminal') && words.includes('defense')) {
      keyPhrases.push('Criminal Defense');
    } else if (words.includes('property') && words.includes('law')) {
      keyPhrases.push('Property Law');
    } else if (words.includes('employment') && words.includes('law')) {
      keyPhrases.push('Employment Law');
    } else {
      keyPhrases.push(foundKeywords[0].charAt(0).toUpperCase() + foundKeywords[0].slice(1));
    }
    return keyPhrases.join(' ');
  } else {
    // Fallback to first few meaningful words
    const meaningfulWords = message.split(' ').filter(word => 
      word.length > 3 && 
      !['the', 'and', 'for', 'with', 'this', 'that', 'will', 'can', 'help', 'need', 'want', 'would', 'could', 'should', 'please', 'thank', 'thanks'].includes(word.toLowerCase())
    ).slice(0, 3);
    
    if (meaningfulWords.length > 0) {
      return meaningfulWords.join(' ');
    } else {
      return 'Legal Discussion';
    }
  }
}

// Title generation prompt for concise chat titles
const titleGenerationPrompt = ai.definePrompt({
  name: 'titleGenerationPrompt',
  input: { schema: z.object({
    message: z.string(),
    documentName: z.string().optional(),
  }) },
  output: { schema: z.object({
    title: z.string().describe('Concise chat title (3-7 words, max 50 characters)'),
  }) },
  prompt: `You are a legal assistant that creates concise, professional titles for legal chat conversations.

**User Message:** {{message}}
{{#if documentName}}
**Document:** {{documentName}}
{{/if}}

**Requirements:**
- Create a title that captures the main legal topic or question
- Use 3-7 words maximum
- Keep it under 50 characters
- Make it professional and clear
- Focus on the primary legal issue or document type
- Use proper legal terminology when appropriate

**Examples:**
- "Contract Dispute Analysis"
- "Criminal Defense Consultation" 
- "Property Law Question"
- "Document Review Request"
- "Legal Research Help"

Generate a concise title:`,
});

// Title generation flow
const titleGenerationFlow = ai.defineFlow(
  {
    name: 'titleGenerationFlow',
    inputSchema: z.object({
      message: z.string(),
      documentName: z.string().optional(),
    }),
    outputSchema: z.object({
      title: z.string(),
    }),
  },
  async (input) => {
    try {
      console.log('[Title Generation] Processing message for title:', input.message.substring(0, 100));
      
      const response = await titleGenerationPrompt(input, {
        model: 'googleai/gemini-2.5-flash',
        config: {
          temperature: 0.3,
          maxOutputTokens: 50,
        }
      });

      // Ensure we always return a valid title
      if (response.output && response.output.title) {
        return response.output;
      }
      
      // Fallback title based on input
      const fallbackTitle = input.documentName 
        ? `Document Review - ${input.documentName.split('.')[0]}`
        : input.message.length > 20 
          ? input.message.substring(0, 20) + '...'
          : generateSmartFallbackTitle(input.message);
          
      return {
        title: fallbackTitle
      };
    } catch (error) {
      console.error('[Title Generation] Error:', error);
      return {
        title: generateSmartFallbackTitle(input.message)
      };
    }
  }
);

// Export the main function
export async function generateChatTitle(input: {
  message: string;
  documentName?: string;
}): Promise<{ title: string }> {
  return titleGenerationFlow(input);
}
