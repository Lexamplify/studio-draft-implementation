import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ChatInputSchema, ChatOutputSchema, ChatInput, ChatOutput } from './chat-types';
import { 
  createCalendarEventTool, 
  checkCalendarAvailabilityTool,
  listUpcomingEventsTool 
} from '@/ai/tools/calendar-tools';

// Legal advice chat prompt
const legalChatPrompt = ai.definePrompt({
  name: 'legalChatPrompt',
  input: { schema: ChatInputSchema },
  output: { schema: ChatOutputSchema },
  prompt: `You are **LexAI**, a specialized legal assistant for the Indian legal system. You help legal professionals with case analysis, document review, legal research, and general legal guidance.

**Core Guidelines:**
- Focus exclusively on Indian law, statutes, and case law
- Provide accurate, well-researched legal information
- Always cite relevant cases, statutes, and legal provisions
- Maintain professional, clear communication
- If uncertain, recommend consulting a licensed advocate

**Context Information:**
{{#if context.caseId}}
- **Linked Case ID:** {{context.caseId}}
{{/if}}
{{#if context.draftId}}
- **Linked Draft ID:** {{context.draftId}}
{{/if}}
{{#if context.userId}}
- **User ID:** {{context.userId}}
{{/if}}

**Previous Conversation:**
{{#if chatHistory}}
{{#each chatHistory}}
**{{role}}:** {{content}}
{{/each}}
{{/if}}

**Uploaded Document:**
{{#if document}}
**Document Name:** {{documentName}}
**Content:** {{document}}
{{/if}}

**Current Message:** {{message}}

**Response Requirements:**
1. Provide a direct, helpful response to the user's message
2. **// UPDATED:** If an **Uploaded Document** is present, your primary goal is to use its content to answer the **Current Message** (e.g., "Summarize this document," "What are the key arguments in this filing?").
3. Include relevant legal citations with working links when applicable
4. Suggest 2-3 follow-up questions or actions
5. Maintain conversation context and flow
6. Use clear markdown formatting with **bold** headings and bullet points

**Important Notes:**
- Always provide real, verifiable legal citations
- Include working links to Indian Kanoon, SCC Online, or official court websites
- If you cannot find a real, working link for a case, state "No verified case law link available"
- Never provide fake or placeholder links
- Focus on recent, relevant Indian case law and statutes

**Calendar Integration:**
You can help users schedule events in their calendar. When users ask to schedule something:
1. Extract event details: title, date, time, attendees, case context
2. Use \`checkCalendarAvailability\` to check for conflicts
3. Use \`createCalendarEvent\` to create the event
4. Confirm with the user and provide next steps
5. If a case is mentioned, try to link the event to that case

**Available Calendar Functions:**
- \`createCalendarEvent\`: Create events in the user's calendar
- \`checkCalendarAvailability\`: Check if a time slot is available
- \`listUpcomingEvents\`: Show upcoming events

Respond with a comprehensive, helpful legal analysis:`,
});

// Document analysis prompt for case creation
const documentAnalysisPrompt = ai.definePrompt({
  name: 'documentAnalysisPrompt',
  input: {
    schema: z.object({
      document: z.string(),
      documentName: z.string(),
    }),
  },
  output: {
    schema: z.object({
      caseName: z.string().describe('Suggested case name (e.g., "Petitioner vs. Respondent")'),
      petitionerName: z.string().optional().describe('Petitioner/complainant name if found'),
      respondentName: z.string().optional().describe('Respondent/accused name if found'),
      caseNumber: z.string().optional().describe('Case number if found (e.g., "CRL.A. 123/2024")'),
      courtName: z.string().optional().describe('Court name if mentioned'),
      judgeName: z.string().optional().describe('Name of the judge if mentioned'),
      petitionerCounsel: z.string().optional().describe("Petitioner's counsel/lawyer name"),
      respondentCounsel: z.string().optional().describe("Respondent's counsel/lawyer name"),
      caseType: z.string().optional().describe('Type of case (Civil/Criminal/Family/etc.)'),
      filingDate: z.string().optional().describe('Date the case was filed (format YYYY-MM-DD)'),
      nextHearingDate: z.string().optional().describe('Next hearing date if mentioned (format YYYY-MM-DD)'),
      summary: z.string().describe('Brief 2-3 sentence case summary'),
      tags: z.array(z.string()).describe('Relevant tags for the case'),
      legalSections: z.array(z.string()).describe('Legal sections involved'),
      keyFacts: z.array(z.string()).describe('Key facts of the case'),
    }),
  },
  // UPDATED PROMPT:
  prompt: `You are a meticulous legal analysis AI. Your sole task is to analyze the provided legal document and extract specific, structured data.

{{#if document}}
**Uploaded Document Context:**
Document Name: {{documentName}}
Content: {{document}}
{{/if}}

**Extraction Instructions:**
Analyze the document and extract the following fields. Follow the guidelines strictly.

1.  **Case Name:** Find the petitioner and respondent names. Format as "Petitioner Name vs. Respondent Name". If not found, use the document name.
2.  **Petitioner Name:** Identify the primary petitioner(s). This is often listed after "PETITIONER :".
3.  **Respondent Name:** Identify the primary respondent(s). This is often listed after "RESPONDENT :" or "VERSUS".
4.  **Case Number:** Extract the primary case number for this filing (e.g., the Writ Petition number). If it's a blank draft, extract it as-is.
5.  **Court Name:** Identify the court this document is being filed in.
6.  **Judge Name:** Look for a specific judge's name. If not mentioned, leave empty.
7.  **Petitioner Counsel:** Look for the counsel's name, often at the end of the document above "COUNSEL FOR THE PETITIONER".
8.  **Respondent Counsel:** Look for the respondent's counsel. If not mentioned, leave empty.
9.  **Case Type:** Determine the nature of the case (e.g., "S.B.CIVIL MISC. WRIT PETITION" under "Article 226/227").
10. **Filing Date:** Look for a specific filing date. If blank, leave empty. Do not guess.
11. **Next Hearing Date:** Search for any mention of a future or next hearing date. If not present, leave empty.
12. **Summary:** Write a 2-3 sentence summary of the case.
13. **Tags:** Generate 3-5 relevant tags (e.g., "Insurance", "Writ Petition", "Court Case").
14. **Legal Sections:** List all specific acts, articles, or sections mentioned.
15. **Key Facts:** List 3-5 key factual points from the document.

**CRITICAL REQUIREMENTS:**
- You MUST return a valid JSON object that matches the schema exactly.
- If any field cannot be extracted, use empty string "" for strings or empty array [] for arrays.
- NEVER return null or undefined values.
- ALL fields are REQUIRED: caseName, summary, tags, legalSections, and keyFacts must have valid values.
- For keyFacts, extract 3-5 key factual points from the document.
- If the document is empty or unreadable, still return a valid JSON with appropriate fallback values.
- Return ONLY the JSON object, no additional text, explanations, or markdown formatting.

**Output Format:**
Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just pure JSON):
{
  "caseName": "string",
  "petitionerName": "string or empty",
  "respondentName": "string or empty",
  "caseNumber": "string or empty",
  "courtName": "string or empty",
  "judgeName": "string or empty",
  "petitionerCounsel": "string or empty",
  "respondentCounsel": "string or empty",
  "caseType": "string or empty",
  "filingDate": "string or empty",
  "nextHearingDate": "string or empty",
  "summary": "string (required)",
  "tags": ["array of strings (required)"],
  "legalSections": ["array of strings (required)"],
  "keyFacts": ["array of strings (required)"]
}
`,
});
// Main chat flow
const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input: ChatInput): Promise<ChatOutput> => {
    try {
      console.log('[Chat Flow] Processing message:', input.message);
      
      // Use the legal chat prompt with calendar tools
      const response = await legalChatPrompt(input, {
        model: 'googleai/gemini-2.5-flash',
        config: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
        tools: [
          createCalendarEventTool,
          checkCalendarAvailabilityTool,
          listUpcomingEventsTool,
        ],
      });

      return response.output || {
        response: "I apologize, but I encountered an issue processing your message. Please try again.",
        suggestions: ["Could you rephrase your question?", "Would you like to upload a document for analysis?"]
      };
    } catch (error) {
      console.error('[Chat Flow] Error:', error);
      return {
        response: "I apologize, but I encountered a technical issue. Please try again or contact support if the problem persists.",
        suggestions: ["Try rephrasing your question", "Check your internet connection", "Contact support"]
      };
    }
  }
);

// Document analysis flow for case creation
const documentAnalysisFlow = ai.defineFlow(
  {
    name: 'documentAnalysisFlow',
    inputSchema: z.object({
      document: z.string(),
      documentName: z.string(),
    }),
    // UPDATED: Output schema matches the prompt's new output
    outputSchema: z.object({
      caseName: z.string(),
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
      summary: z.string(),
      tags: z.array(z.string()),
      legalSections: z.array(z.string()),
      keyFacts: z.array(z.string()),
    }),
  },
  async (input) => {
    try {
      console.log('[Document Analysis] Processing document:', input.documentName);
      
      // Validate input
      if (!input.document || input.document.trim() === '') {
        console.log('[Document Analysis] Empty document content');
        return {
          caseName: input.documentName.replace(/\.[^/.]+$/, ""), // Remove file extension
          summary: 'Document appears to be empty or could not be read. Please review manually.',
          tags: ['Empty Document'],
          legalSections: [],
          keyFacts: ['Document content is empty or unreadable']
        };
      }

      const response = await documentAnalysisPrompt(input, {
        model: 'googleai/gemini-2.5-flash',
        config: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        }
      });

      console.log('[Document Analysis] Raw AI response:', JSON.stringify(response, null, 2));

      // Check if response is valid
      if (!response || !response.output) {
        console.log('[Document Analysis] No valid response from AI');
        return {
          caseName: input.documentName.replace(/\.[^/.]+$/, ""),
          summary: 'AI analysis failed. Please review the document manually.',
          tags: ['Analysis Failed'],
          legalSections: [],
          keyFacts: ['AI could not process the document content']
        };
      }

      // The AI should return a properly structured object due to the schema
      const output = response.output;
      console.log('[Document Analysis] AI response:', JSON.stringify(output, null, 2));

      // Simple validation with fallbacks for missing required fields
      return {
        caseName: output.caseName || input.documentName.replace(/\.[^/.]+$/, ""),
        petitionerName: output.petitionerName || "",
        respondentName: output.respondentName || "",
        caseNumber: output.caseNumber || "",
        courtName: output.courtName || "",
        judgeName: output.judgeName || "",
        petitionerCounsel: output.petitionerCounsel || "",
        respondentCounsel: output.respondentCounsel || "",
        caseType: output.caseType || "",
        filingDate: output.filingDate || "",
        nextHearingDate: output.nextHearingDate || "",
        summary: output.summary || 'Analysis incomplete. Please review manually.',
        tags: Array.isArray(output.tags) ? output.tags : ['Analysis Incomplete'],
        legalSections: Array.isArray(output.legalSections) ? output.legalSections : [],
        keyFacts: Array.isArray(output.keyFacts) ? output.keyFacts : ['Analysis incomplete']
      };
    } catch (error) {
      console.error('[Document Analysis] Error:', error);
      
      return {
        caseName: input.documentName.replace(/\.[^/.]+$/, ""),
        summary: 'Document analysis failed due to an error. Please review the document manually.',
        tags: ['Analysis Error'],
        legalSections: [],
        keyFacts: ['Error occurred during document processing']
      };
    }
  }
);

// Export the main functions
export async function processChatMessage(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

// UPDATED: Export function return type matches the new flow output
export async function analyzeDocumentForCase(input: {
  document: string;
  documentName: string;
}): Promise<{
  caseName: string;
  petitionerName?: string;
  respondentName?: string;
  caseNumber?: string;
  courtName?: string;
  judgeName?: string;
  petitionerCounsel?: string;
  respondentCounsel?: string;
  caseType?: string;
  filingDate?: string;
  nextHearingDate?: string;
  summary: string;
  tags: string[];
  legalSections: string[];
  keyFacts: string[];
}> {
  return documentAnalysisFlow(input);
}