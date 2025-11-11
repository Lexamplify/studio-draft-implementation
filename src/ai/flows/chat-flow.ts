import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ChatInputSchema, ChatOutputSchema, ChatInput, ChatOutput } from './chat-types';
import { 
  createCalendarEventTool, 
  checkCalendarAvailabilityTool,
  listUpcomingEventsTool 
} from '@/ai/tools/calendar-tools';
import { createCaseTool } from '@/ai/tools/case-tools';

// Legal advice chat prompt
const legalChatPrompt = ai.definePrompt({
  name: 'legalChatPrompt',
  input: { schema: ChatInputSchema },
  // Use lenient schema to avoid hard validation failures from the model
  output: { schema: z.any() },
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

**Previous Conversation History:**
{{#if chatHistory}}
You have access to the full conversation history below. Use this context to understand references to previous messages, documents, or questions. When the user asks about "previous conversation", "above text", "earlier message", or similar phrases, they are referring to content in the conversation history below:
{{#each chatHistory}}
**{{role}}:** {{content}}
{{/each}}
{{else}}
This is the start of the conversation. No previous messages available.
{{/if}}

**Uploaded Document (Current Message):**
{{#if document}}
**Document Name:** {{documentName}}
**Content:** {{document}}
{{else}}
No new document uploaded with this message. However, documents may have been uploaded in previous messages (see conversation history above).
{{/if}}

**Current Message:** {{message}}

**Response Requirements:**
1. Provide a direct, helpful response to the user's message
2. **IMPORTANT:** You have full access to the **Previous Conversation History** above. If the user references "previous conversation", "above text", "earlier", "from the prev conversation", or similar phrases, look through the conversation history to find the relevant content they're referring to.
3. If a document was discussed in previous messages, you can reference its content from the conversation history.
4. If an **Uploaded Document** is present in the current message, your primary goal is to use its content to answer the **Current Message**.
5. Include relevant legal citations with working links when applicable
6. Suggest 2-3 follow-up questions or actions
7. Maintain conversation context and flow - reference previous messages when relevant
8. Use clear markdown formatting with **bold** headings and bullet points

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

**Case Creation:**
When a user uploads a case document (like a writ petition, FIR, complaint, etc.) or explicitly asks to "create a case":
1. Analyze the document to extract case details (parties, case number, court, etc.)
2. If the user says "create a case" or "analyze and create case", use the \`createCase\` tool
3. If a legal case document is detected, proactively suggest case creation: "I've analyzed this document. Would you like me to create a case entry with the extracted details?"
4. When using \`createCase\`, extract:
   - Case name (format: "Petitioner vs. Respondent")
   - Case number, court name, case type
   - Party names and counsel
   - Key facts, legal sections, summary
   - Dates (filing, next hearing)
5. Return structured response with caseData in your output

**Available Case Functions:**
- \`createCase\`: Create a new legal case from document analysis or user input. Use this when:
  - User explicitly requests case creation ("create a case", "analyze and create case")
  - A legal case document is uploaded and user wants to proceed
  - Document analysis reveals case details and user confirms creation

\n\nCRITICAL OUTPUT FORMAT:\n- Return ONLY a valid JSON object that matches this structure (no markdown, no prose outside JSON):\n{\n  "response": "string",\n  "suggestions": ["string", "string"]\n}\n- The \"response\" field is REQUIRED and must be a helpful answer.\n- You may include optional fields like \"citations\", \"actionType\", and \"caseData\" if relevant.\n`,
});

// Case-scoped legal assistant prompt (FLOW 2)
const caseScopedChatPrompt = ai.definePrompt({
  name: 'caseScopedChatPrompt',
  input: { schema: ChatInputSchema },
  // Use lenient schema to avoid hard validation failures from the model
  output: { schema: z.any() },
  prompt: `You are LexAI, an expert senior legal paralegal. Your user is a lawyer who is also an expert.

**IMPORTANT: PERSONA & GOAL**
- DO NOT give academic lessons or define basic legal terms.
- DO be concise, direct, and actionable. Your goal is to assist with tasks, not to teach.
- Be confident and capable: "Done." "I can handle that." "Here is the information."
- Always refer to the case. Be contextual: "Adding this to the '{{context.caseName}}' calendar."
- Never mention any other case, document, or user. Your world is only this case.

**CURRENT CONTEXT (MANDATORY)**
You are in a "Case-Scoped Chat". Your knowledge and actions are restricted only to the case provided in this context.

Case ID: {{context.caseId}}
Case Name: {{context.caseName}}

Case Metadata: You have access to the following case information:
{{#if context.caseMetadata}}
{{#if context.caseMetadata.details}}
- **Case Number:** {{context.caseMetadata.details.caseNumber}}
- **Case Type:** {{context.caseMetadata.details.caseType}}
- **Court Name:** {{context.caseMetadata.details.courtName}}
- **Petitioner:** {{context.caseMetadata.details.petitionerName}}
- **Respondent:** {{context.caseMetadata.details.respondentName}}
- **Judge Name:** {{context.caseMetadata.details.judgeName}}
- **Filing Date:** {{context.caseMetadata.details.filingDate}}
- **Next Hearing Date:** {{context.caseMetadata.details.nextHearingDate}}
- **Status:** {{context.caseMetadata.details.status}}
- **Jurisdiction:** {{context.caseMetadata.details.jurisdiction}}
- **Case Category:** {{context.caseMetadata.details.caseCategory}}
{{/if}}
{{#if context.caseMetadata.tags}}
- **Tags:** {{#each context.caseMetadata.tags}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
{{else}}
No case metadata available.
{{/if}}

Document Context: You have access to the following documents for this case. Use their content exclusively to answer file-based questions.

{{#if context.documentContext}}
{{#each context.documentContext}}
- **Document {{docId}}:** {{fileName}}
  Summary: {{summary}}
{{/each}}
{{else}}
No documents are currently linked to this case.
{{/if}}

**Previous Conversation History:**
{{#if chatHistory}}
{{#each chatHistory}}
**{{role}}:** {{content}}
{{/each}}
{{else}}
This is the start of the conversation. No previous messages available.
{{/if}}

**Uploaded Document (Current Message):**
{{#if document}}
**Document Name:** {{documentName}}
**Content:** {{document}}
{{else}}
No new document uploaded with this message. However, documents may have been uploaded in previous messages (see conversation history above).
{{/if}}

**Current Message:** {{message}}

**CORE TASK: QUESTION ANSWERING**

When the user asks a question, you have two sources of information:

1. **Case Metadata**: For questions about case information (case number, case type, court name, parties, dates, status, etc.), use the Case Metadata provided above. This information is stored directly in the case record.

2. **Document Context**: For questions about content within uploaded documents (arguments, legal positions, evidence, etc.), check the documentContext and base your answer on the provided summaries and file content.

Response Format for document-based questions: "Based on the file '{{fileName}}', the respondent's main argument is that {{argument}}."

Response Format for case metadata questions: Use the case metadata directly, e.g., "The Case Number is {{context.caseMetadata.details.caseNumber}}" or "The Case Type is {{context.caseMetadata.details.caseType}}".

**CORE TASK: TOOL INTEGRATION (ADD EVENT)**

The user may ask to schedule an event (e.g., "Find the 'Next Hearing Date' and schedule it.").

Your workflow MUST be:

Acknowledge & Find: Acknowledge the request. Scan the documentContext for the requested date.

Verify: If a date is found (e.g., "November 5, 2025"), confirm it with the user.

Propose Action: You cannot call any tools directly. You must propose the action to the user with a special, formatted link.

Format (CRITICAL): Your response must be formatted exactly like this:
"I found a 'Next Hearing Date' of November 5, 2025. Because we are in a case-specific chat, I've pre-filled the event and linked it to '{{context.caseName}}'.

$$Click here to add to calendar$$

"

Handling Ambiguity:
- If the user is vague (e.g., "schedule a meeting next Tuesday"), you MUST ask for clarifying details ("What time on Tuesday? And what is the meeting about?").
- If no date is found in the documents, state that: "I could not find a 'Next Hearing Date' mentioned in the available case documents. You can add an event manually or upload the relevant order."

**TONE & GUIDELINES**

- Confident & Capable: "Done." "I can handle that." "Here is the information."
- Contextual: Always refer to the case. "Adding this to the '{{context.caseName}}' calendar."
- Secure: Never mention any other case, document, or user. Your world is only this case.`,
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
      
      // Check if this is a case-scoped chat
      const isCaseScoped = !!input.context?.caseId;
      
      // Helper to coerce model output to ChatOutput shape
      const normalizeOutput = (raw: any): ChatOutput => {
        try {
          if (!raw) {
            return { response: 'I apologize, but I encountered an issue processing your message.', suggestions: [] } as ChatOutput;
          }
          if (typeof raw === 'string') {
            return { response: raw, suggestions: [] } as ChatOutput;
          }
          if (typeof raw === 'object' && typeof raw.response === 'string') {
            return raw as ChatOutput;
          }
          // Some models return { text: '...' }
          if (typeof raw.text === 'string') {
            return { response: raw.text, suggestions: [] } as ChatOutput;
          }
        } catch {}
        return { response: 'I apologize, but I encountered an issue processing your message.', suggestions: [] } as ChatOutput;
      };
      
      if (isCaseScoped) {
        console.log('[Chat Flow] Using case-scoped prompt for case:', input.context.caseId);
        // Use case-scoped prompt without calendar tools (AI will propose actions instead)
        const response = await caseScopedChatPrompt(input, {
          model: 'googleai/gemini-2.5-flash',
          config: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
          // No tools - AI must propose calendar actions instead of calling tools
        });

        const coerced = normalizeOutput(response.output);
        return coerced;
      } else {
        console.log('[Chat Flow] Using general legal chat prompt');
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
            createCaseTool,
          ],
        });
      
      // Continue with existing logic for general chat...

      // Log the full response structure for debugging
      console.log('[Chat Flow] Full response structure:', JSON.stringify(response, null, 2));
      console.log('[Chat Flow] Response calls:', response.calls);
      console.log('[Chat Flow] Response output:', response.output);
      
      // Check if the AI used the createCase tool
      // Genkit may structure tool calls differently - check multiple possible structures
      let caseData = null;
      const calls = response.calls || response.toolCalls || [];
      
      if (calls && calls.length > 0) {
        console.log('[Chat Flow] Found tool calls:', calls.length);
        const caseCall = calls.find((call: any) => 
          call.name === 'createCase' || 
          call.tool === 'createCase' ||
          (typeof call === 'string' && call === 'createCase')
        );
        
        if (caseCall) {
          console.log('[Chat Flow] Found createCase tool call:', JSON.stringify(caseCall, null, 2));
          
          // Handle different response structures
          const result = caseCall.result || caseCall.output || caseCall;
          const toolInput = caseCall.input || caseCall.arguments || {};
          
          if (result?.success && result?.caseId) {
            // Case was created successfully by the tool
            console.log('[Chat Flow] Case created successfully via tool:', result.caseId);
            caseData = {
              caseId: result.caseId,
              caseName: result.caseName || toolInput?.caseName,
              tags: toolInput?.tags || [],
              details: toolInput?.details || {},
              createdAt: new Date().toISOString()
            };
          } else if (toolInput && toolInput.caseName) {
            // Tool was called but we need to extract case data from input for modal pre-fill
            console.log('[Chat Flow] Tool called with input, extracting case data for modal');
            caseData = {
              caseName: toolInput.caseName,
              tags: toolInput.tags || [],
              details: toolInput.details || {},
            };
          }
        }
      } else {
        console.log('[Chat Flow] No tool calls found in response');
      }

      const output = normalizeOutput(response.output);

      // Add case data to output if tool was used
      if (caseData) {
        console.log('[Chat Flow] Returning response with case data:', caseData);
        return {
          ...output,
          actionType: 'createCase' as const,
          caseData: caseData
        };
      }

      // FALLBACK: If user asked to create case and document is present, but tool wasn't called,
      // try to extract case data from document using document analysis
      const userWantsCaseCreation = input.message.toLowerCase().includes('create a case') || 
                                    input.message.toLowerCase().includes('create case') ||
                                    input.message.toLowerCase().includes('analyze and create');
      
      if (userWantsCaseCreation && input.document && !caseData) {
        console.log('[Chat Flow] User wants case creation but tool wasn\'t called, using fallback document analysis...');
        try {
          const docAnalysis = await analyzeDocumentForCase({
            document: input.document,
            documentName: input.documentName || 'Document'
          });
          
          // Create case data structure from analysis
          caseData = {
            caseName: docAnalysis.caseName,
            tags: docAnalysis.tags || [],
            details: {
              petitionerName: docAnalysis.petitionerName,
              respondentName: docAnalysis.respondentName,
              caseNumber: docAnalysis.caseNumber,
              courtName: docAnalysis.courtName,
              judgeName: docAnalysis.judgeName,
              petitionerCounsel: docAnalysis.petitionerCounsel,
              respondentCounsel: docAnalysis.respondentCounsel,
              caseType: docAnalysis.caseType,
              filingDate: docAnalysis.filingDate,
              nextHearingDate: docAnalysis.nextHearingDate,
              summary: docAnalysis.summary,
              legalSections: docAnalysis.legalSections,
              keyFacts: docAnalysis.keyFacts,
            }
          };
          
          console.log('[Chat Flow] Extracted case data from document analysis:', caseData);
          
          // If user explicitly requested creation AND we have userId, create the case directly via API
          // This ensures immediate creation without requiring modal confirmation
          if (input.context?.userId && caseData.caseName) {
            try {
              console.log('[Chat Flow] Creating case directly via API for explicit user request...');
              // Import and use Firestore directly
              const { db } = await import('@/lib/firebase-admin');
              
              const caseDataForFirestore = {
                caseName: caseData.caseName,
                tags: caseData.tags || [],
                details: caseData.details || {},
                createdAt: new Date(),
                updatedAt: new Date()
              };
              
              const docRef = await db
                .collection('users')
                .doc(input.context.userId)
                .collection('cases')
                .add(caseDataForFirestore);
              
              console.log('[Chat Flow] ✅ Case created directly via fallback API, ID:', docRef.id);
              
              // Add caseId to caseData
              caseData.caseId = docRef.id;
              caseData.createdAt = new Date().toISOString();
              
              // Update output response to mention case creation
              output.response = `${output.response}\n\n✅ **Case "${caseData.caseName}" has been successfully created in your records with the ID **${docRef.id}**. You can view it using the case box below.`;
            } catch (apiError) {
              console.error('[Chat Flow] Error creating case via API fallback:', apiError);
              // Continue without caseId - UI will show modal for manual creation
            }
          } else {
            console.log('[Chat Flow] userId missing or caseName missing, returning caseData without caseId for modal');
          }
          
          return {
            ...output,
            actionType: 'createCase' as const,
            caseData: caseData
          };
        } catch (analysisError) {
          console.error('[Chat Flow] Error in fallback document analysis:', analysisError);
        }
      }

      return output;
      } // Close else block for general chat
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