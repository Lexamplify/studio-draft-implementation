'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { defineTool } from '@genkit-ai/ai';

const GeneralChatInputSchema = z.object({
  question: z.string(),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() }))
  })).optional(),
  document: z.string().optional(),
  documentName: z.string().optional(),
  targetLanguage: z.string().optional(),
  caseDescription: z.string().optional(),
});
export type LegalAdviceChatInput = z.infer<typeof GeneralChatInputSchema>;

// Module-level array to store citations with titles and optional URLs
interface Citation {
  title: string;
  url?: string;
}

let storedCitations: Citation[] = [];

// Function to get all stored citations with resolved URLs
export async function getStoredCitations(): Promise<Array<{title: string, url?: string}>> {
  // Return a deep copy of the citations
  return JSON.parse(JSON.stringify(storedCitations));
}

// Function to clear stored citations
export async function clearStoredCitations(): Promise<void> {
  storedCitations = [];
}
import { OpenAI } from 'openai';

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});


// Helper function to extract just the case name (removes citation numbers after comma)
function extractCaseName(fullCitation: string): string {
  // Match everything before the first comma followed by a year or citation number
  const match = fullCitation.match(/^([^,]+?)(?:,\s*\d{4}.*)?$/);
  return match ? match[1].trim() : fullCitation;
}

async function findCaseUrl(title: string): Promise<string | null> {
  try {
    // Extract just the case name part (before comma and citation)
    const caseName = extractCaseName(title);
    console.log(`[LLM Search] Searching for case: "${caseName}" (original: "${title}")`);

    const prompt = `
You are a legal AI assistant. Your task is to find the **exact Indian Kanoon URL** for a given case title.

Case Title: "${caseName}"

Output Requirements:
- Return only the **direct Indian Kanoon case URL** (e.g., https://indiankanoon.org/doc/1596139/)
- If you **cannot find** the case, return exactly: **not found**
- Do NOT explain anything. No extra text. No markdown. Only the URL or "not found".

Make sure the URL leads to the **correct case document** matching the title.

Begin output:
`;

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not set in environment variables');
      return null;
    }

    const response = await openai.chat.completions.create({
      model: 'chatgpt-4o-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 100,
      top_p: 1,
    });

    let result = response.choices[0].message.content?.trim() || '';
    
    // If no result, try again with the full title as fallback
    if (result === 'not found' && caseName !== title) {
      console.log(`[LLM Search] Retrying with full citation: "${title}"`);
      const fallbackResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Find the Indian Kanoon URL for this legal case. Return ONLY the URL or 'not found': ${title}`
        }],
        temperature: 0.2,
        max_tokens: 100,
      });
      result = fallbackResponse.choices[0].message.content?.trim() || '';
    }

    if (result.toLowerCase() === 'not found' || !result.startsWith('http')) {
      console.log(`[LLM Search] No URL found for: "${title}"`);
      return null;
    }

    console.log(`[LLM Search] Found URL for "${title}":`, result);
    return result;
  } catch (error) {
    console.error(`[LLM Search] Error searching for "${title}":`, error);
    return null;
  }
}

// Function to add a citation and find its URL using LLM
export async function addCitation(title: string): Promise<void> {
  // Check if we already have this citation
  const existingCitation = storedCitations.find(c => c.title === title);
  if (existingCitation) return;
  
  // Add the citation with just the title
  const newCitation: Citation = { title };
  storedCitations.push(newCitation);
  
  // Find the URL using LLM in the background
  findCaseUrl(title)
    .then(url => {
      if (url) {
        // Update the citation with the found URL
        const citationIndex = storedCitations.findIndex(c => c.title === title);
        if (citationIndex !== -1) {
          storedCitations[citationIndex].url = url;
          console.log(`[Citation] Updated URL for "${title}":`, url);
        }
      } else {
        console.log(`[Citation] No URL found for: "${title}"`);
      }
    })
    .catch(error => {
      console.error('[Citation] Error finding case URL:', error);
    });
}

const GeneralChatOutputSchema = z.object({
  answer: z.string().describe('The response in clean markdown format with **bold headings** and bullet points. NEVER use JSON format with curly braces or square brackets.')
});
export type LegalAdviceChatOutput = z.infer<typeof GeneralChatOutputSchema>;

// Additional schemas for argument extraction
const ArgumentSchema = z.object({
  argument: z.string().describe("A concise summary of a single legal argument."),
  searchQuery: z.string().describe("An optimized search query for this specific argument for Indian Kanoon."),
});

const ExtractedArgumentsSchema = z.object({
  petitionerArgs: z.array(ArgumentSchema).describe("Key arguments for the petitioner/appellant."),
  respondentArgs: z.array(ArgumentSchema).optional().describe("Key arguments for the respondent, if available in the text."),
});

// Schema for extracted citations from document
const CitationSchema = z.object({
  citation: z.string().describe("A specific case citation or legal reference found in the document."),
  searchQuery: z.string().describe("An optimized search query for this specific citation for Indian Kanoon."),
});

const ExtractedCitationsSchema = z.object({
  citations: z.array(CitationSchema).describe("Key legal citations and references found in the document."),
});

// Indian Kanoon search tool
const indianKanoonSearch = ai.defineTool(
  {
    name: 'indianKanoonSearch',
    description: 'Searches indiankanoon.org via the /find API with a query. Returns real case titles and URLs.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(z.object({ title: z.string(), url: z.string() })),
  },
  async (input) => {
    console.log(`[Tool] Calling /find endpoint for: "${input.query}"`);
    if (!input.query) return [];
    try {
      const response = await fetch('http://localhost:3001/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: input.query }),
      });
      if (!response.ok) {
        console.error(`[Tool] /find API returned an error:`, response.status, await response.text());
        return [];
      }
      const data = await response.json();
      if (data && Array.isArray(data.top_results)) {
        return data.top_results;
      }
      return [];
    } catch (error) {
      console.error(`[Tool] Network error calling /find API:`, error);
      return [];
    }
  }
);

// Function to extract citation titles from text
function extractCitationTitles(text: string): string[] {
  // Match patterns like "- Citation: [Case Name, Citation]"
  const citationRegex = /-\s*Citation:\s*\[([^\]]+)\]/g;
  const citations: string[] = [];
  let match;
  
  while ((match = citationRegex.exec(text)) !== null) {
    const fullCitation = match[1].trim();
    if (fullCitation && !citations.includes(fullCitation)) {
      citations.push(fullCitation);
    }
  }
  
  return citations;
}

// Function to process citations in the response text
async function processCitationsInText(text: string): Promise<string> {
  console.log('[Citation Processing] Starting citation processing');
  
  // Extract citation titles
  const citations = extractCitationTitles(text);
  console.log(`[Citation Processing] Found ${citations.length} citations in text`);
  
  if (citations.length > 0) {
    console.log('[Citation Processing] Citations found:', citations);
    
    // Add each citation to our storage
    for (const title of citations) {
      console.log(`[Citation Processing] Adding citation: ${title}`);
      await addCitation(title);
    }
  } else {
    console.log('[Citation Processing] No citations found in the text');
  }
  
  // Get the current state of citations (with any resolved URLs)
  const currentCitations = await getStoredCitations();
  
  // Replace citation placeholders with formatted links
  let processedText = text;
  for (const citation of currentCitations) {
    const citationPattern = new RegExp(`\\[${citation.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:, [^\]]+)?\(\d{4}\)\\]`, 'g');
    
    if (citation.url) {
      // Replace with markdown link if we have a URL
      processedText = processedText.replace(
        citationPattern, 
        `[${citation.title}](${citation.url})`
      );
    } else {
      // Just remove the brackets if we don't have a URL yet
      processedText = processedText.replace(citationPattern, citation.title);
    }
  }
  
  return processedText;
}

// Function to convert JSON responses to clean markdown
async function convertJsonToMarkdown(text: string): Promise<string> {
  // Check if the response looks like JSON
  if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
    try {
      const jsonObj = JSON.parse(text);
      
      // Handle document summary JSON format
      if (jsonObj['Document Title'] && jsonObj['I. Overview'] && jsonObj['II. Key Points']) {
        let markdown = `**Document Title:** ${jsonObj['Document Title']}\n\n`;
        markdown += `**I. Overview**\n${jsonObj['I. Overview']}\n\n`;
        markdown += `**II. Key Points**\n`;
        
        if (Array.isArray(jsonObj['II. Key Points'])) {
          jsonObj['II. Key Points'].forEach((point: any) => {
            if (typeof point === 'string') {
              markdown += `• ${point}\n`;
            } else if (point.point) {
              markdown += `• **${point.point}:** ${point.details || ''}\n`;
              if (point.legalProvision) {
                markdown += `  - Legal Provision: ${point.legalProvision}\n`;
              }
            }
          });
        }
        
        markdown += `\n**III. Conclusion**\n${jsonObj['III. Conclusion']}`;
        return markdown;
      }
      
      // Handle arguments JSON format
      if (jsonObj['Section 1: Case Summary'] || jsonObj['Section 2: Arguments in Favor']) {
        let markdown = '';
        
        if (jsonObj['Section 1: Case Summary']) {
          markdown += `**Section 1: Case Summary**\n${jsonObj['Section 1: Case Summary']}\n\n`;
        }
        
        if (jsonObj['Section 2: Arguments in Favor'] || jsonObj['Section 2: Arguments in Favor of the Appellant (Harsh)']) {
          const argsKey = jsonObj['Section 2: Arguments in Favor'] ? 'Section 2: Arguments in Favor' : 'Section 2: Arguments in Favor of the Appellant (Harsh)';
          markdown += `**Section 2: Arguments in Favor**\n`;
          
          if (Array.isArray(jsonObj[argsKey])) {
            jsonObj[argsKey].forEach((arg: any, index: number) => {
              if (typeof arg === 'string') {
                markdown += `• **Argument ${index + 1}:** ${arg}\n`;
              } else if (arg.Argument) {
                markdown += `• **Argument ${index + 1}:** ${arg.Argument}\n`;
                if (arg.Citation) {
                  markdown += `  - Citation: ${arg.Citation}\n`;
                }
              }
            });
          }
          markdown += '\n';
        }
        
        if (jsonObj['Section 3: Counter-Arguments'] || jsonObj['Section 3: Counter-Arguments in Favor of the Respondent (Pranav)']) {
          const counterKey = jsonObj['Section 3: Counter-Arguments'] ? 'Section 3: Counter-Arguments' : 'Section 3: Counter-Arguments in Favor of the Respondent (Pranav)';
          markdown += `**Section 3: Counter-Arguments**\n`;
          
          if (Array.isArray(jsonObj[counterKey])) {
            jsonObj[counterKey].forEach((arg: any, index: number) => {
              if (typeof arg === 'string') {
                markdown += `• **Counter-Argument ${index + 1}:** ${arg}\n`;
              } else if (arg.Argument) {
                markdown += `• **Counter-Argument ${index + 1}:** ${arg.Argument}\n`;
                if (arg.Citation) {
                  markdown += `  - Citation: ${arg.Citation}\n`;
                }
              }
            });
          }
        }
        
        return markdown;
      }
      
    } catch (e) {
      // If JSON parsing fails, return original text
      return text;
    }
  }
  
  return text;
}

// Workflow detection function
function detectWorkflow(question: string): string {
  const q = question.toLowerCase();
  
  // Context/Previous question keywords - these should go to general chat for context awareness
  if (q.includes('last question') || q.includes('previous question') || q.includes('what was') || 
      q.includes('my question') || q.includes('before') || q.includes('earlier') ||
      q.includes('defendant name') || q.includes('respondent name') || q.includes('context')) {
    return 'generalChat';
  }
  
  // Document Summarization keywords
  if (q.includes('summarize') || q.includes('summary') || q.includes('key points') || 
      q.includes('overview') || q.includes('brief') || q.includes('main points')) {
    return 'summarize';
  }
  
  // Translation keywords
  if (q.includes('translate') || q.includes('convert to') || q.includes('in hindi') || 
      q.includes('in english') || q.includes('in tamil') || q.includes('translation')) {
    return 'translate';
  }
  
  // Arguments generation keywords - route to advanced flow
  if (q.includes('arguments') || q.includes('counter-arguments') || q.includes('case analysis') || 
      q.includes('legal position') || q.includes('pros and cons') || q.includes('favor') || 
      q.includes('against')) {
    return 'findCitationsForArguments';
  }
  
  // Citations keywords - route to advanced flow
  if (q.includes('citations') || q.includes('case law') || q.includes('precedent') || 
      q.includes('legal references') || q.includes('cite') || q.includes('judgment')) {
    return 'findCitationsForDocument';
  }
  
  // Default to general chat
  return 'generalChat';
}

// Define the prompt using the exact master prompt template
const masterPrompt = ai.definePrompt({
  name: 'masterPrompt',
  input: { schema: GeneralChatInputSchema },
  output: { schema: GeneralChatOutputSchema },
  prompt: `🚫 CRITICAL SYSTEM INSTRUCTION: NEVER use JSON format. ALWAYS respond in clean markdown format with **bold headings** and bullet points. NO curly braces { } or square brackets [ ] in responses.

🚫 FORBIDDEN FORMATS:
- {"Document Title": "...", "I. Overview": "...", "II. Key Points": [...]}
- {"Section 1": "...", "Arguments": [...]}
- Any JSON-like structure with curly braces or square brackets

✅ REQUIRED FORMAT: Clean markdown text with **bold headings** and bullet points only.

You are **LexAI**, a specialized legal assistant for the Indian legal system. Your role is to help legal professionals by summarizing, translating, analyzing, and citing documents. Adhere strictly to these rules:

**1. Core Persona & Role**
• Indian Law Expert: All responses must be tailored to Indian statutes, case law, and legal practice.
• Assistant, Not Advocate: Provide legal information and explanations only. If a user seeks binding legal advice, you must remind them to consult a licensed advocate.
• Clarity & Professionalism: Use clear, precise paragraphs. Employ Indian legal terms (e.g., "FIR," "plaint," "written statement," "Section 138 Negotiable Instruments Act, 1881," "SCC," etc.) correctly.

{{#if chatHistory}}
**Previous Conversation:**
{{#each chatHistory}}
{{role}}: {{#each parts}}{{text}}{{/each}}
{{/each}}
{{/if}}

{{#if document}}
**Uploaded Document Context:**
Document Name: {{documentName}}
Content: {{document}}
{{/if}}

**2. Response Do's**
• Direct Answer First: Begin by directly addressing the user's request.
• Professional Formatting: Use markdown formatting with **bold headings**, bullet points, and numbered lists for clear structure.
• Cite Sources: Provide exact references—statutes (Section X, Act, Year), landmark judgments (Case Name, Citation). For citations, always include a real, verifiable, and working link to the source (preferably Indian Kanoon, SCC Online, or official court websites). Do not invent citations or links—only use real, existing cases/statutes and their correct URLs.
• Preserve Formatting: When summarizing or translating, keep original headings, bullets, and numbering intact as much as possible from the document content.
• Acknowledge Context: {{#if document}}Based on the uploaded document...{{/if}} {{#if chatHistory}}As mentioned earlier in our conversation...{{/if}}
• Context Awareness: When users ask about "my last question", "what I asked before", or reference previous parts of the conversation, refer to the Previous Conversation section above.
• **Truthfulness & Verifiability:** All answers, especially legal arguments and citations, must be grounded in truth. Only cite cases, statutes, or legal principles that actually exist and are verifiable. Always provide a direct link to the source for every citation.

**3. Response Don'ts**
• No Legal Advice: If the query crosses into "practice of law," disclaim and direct to a licensed professional.
• No Foreign Law (unless user requests an explicit comparison).
• No Opinions: Stick to legal principles, statutes, and cited cases.
• Do Not Deviate from the Specified Workflow—execute only the chosen action below.

User's current question/input: "{{{question}}}"
User's Chosen Workflow: "{{{action}}}"
{{#if isSummarizeAction}}
---
**WORKFLOW: Legal Case Summary Generator**

**Step 1: Upload Verification**
• {{#unless document}}⚠️ Please upload the legal case document (PDF or text). Analysis cannot proceed without it.{{/unless}}

**Step 2: Structured Case Analysis & Summarization**
• {{#if document}}🚫 DO NOT use JSON, YAML, or any code block formatting.

⚖️ **FORMAT TO FOLLOW STRICTLY:**

---

## ⚖️ **CASE SUMMARY**

### 📌 **Case Identification**
- **Case Title:** {{documentName}}
- **Case No. / FIR No.:** [Insert if mentioned]
- **Court:** [Insert court name or location]
- **Jurisdiction / Location:** [Insert city/state]
- **Date Filed:** [Insert date]
- **Judge(s):** [Insert if available]

---

### 📄 **Case Snapshot**
- **Case Type:** [Civil / Criminal / Family / Other]
- **Legal Sections Involved:** [e.g., IPC 323, CrPC 156(3)]
- **Stage:** [Pre-trial, Trial, Disposed, etc.]
- **Relief Sought:** [e.g., Compensation, Injunction, Bail]

---

### 👤 **Parties Involved**
- **Petitioner(s) / Complainant:** [Insert]
- **Respondent(s) / Accused:** [Insert]
- **Advocates:**
  - For Petitioner: [Insert if known]
  - For Respondent: [Insert if known]

---

### 📚 **Facts of the Case**
_A concise 4–6 line summary of the dispute or issue that triggered legal action._

---

### ⚖️ **Legal Issues Raised**
- [Legal question 1]
- [Legal question 2]

---

### 🧩 **Arguments Summary**
**Petitioner’s Side:**
- [Key point 1]
- [Key point 2]

**Respondent’s Side:**
- [Key point 1]
- [Key point 2]

---

### 🧾 **Evidence Summary**
- **Documents:** [List major ones]
- **Witnesses:** [Mention key roles or names]

---

### 🧑‍⚖️ **Court Observations**
- [Any remarks by the court or interim findings]

---

### 📢 **Outcome / Order**
- **Current Status:** [Pending, Dismissed, Allowed, etc.]
- **Next Hearing Date:** [If applicable]
- **Final Order:** [Summarized in one line if present]

---

### 🧠 **Legal Notes / Strategic Observations**
- [Any relevant precedents, red flags, or suggestions for legal follow-up]

---

## 📁 **Tags:** [e.g., Criminal, IPC 323, Delhi Court, 2025]

---

**DO NOT INCLUDE BRACKETS**, no markdown headings like '#', and no JSON-style formatting. Provide only **clean, readable plain text with markdown elements** for clarity.

{{/if}}
{{/if}}


{{#if isGenerateArgumentsAction}}
---
**WORKFLOW: Generate Arguments & Counter‑Arguments**
**Step 1: Clarify Case Description**
• {{#unless caseDescription}}If case description is missing, respond:
  "Please share a brief description of your case—facts, parties, and primary legal issue(s)."
  Pause until the user provides the description.{{/unless}}

**Step 2: Structure the Response**
{{#if caseDescription}}Structure your answer in three sections using MARKDOWN FORMATTING ONLY. STRICTLY follow the example structure below:

**Section 1: Case Summary**
Write a concise 2–3 line summary of the case factual background and legal issue.

**Section 2: Arguments in Favor**
• **Argument 1:** [Description of first argument]
  - Citation: [Case Name, Citation (Year) - The system will automatically find and link this citation]
• **Argument 2:** [Description of second argument]
  - Citation: [Case Name, Citation (Year) - The system will automatically find and link this citation]
• **Argument 3:** [Description of third argument]
  - Citation: [Case Name, Citation (Year) - The system will automatically find and link this citation]

**Section 3: Counter-Arguments**
• **Counter-Argument 1:** [Description of first counter-argument]
  - Citation: [Case Name, Citation (Year) - The system will automatically find and link this citation]
• **Counter-Argument 2:** [Description of second counter-argument]
  - Citation: [Case Name, Citation (Year) - The system will automatically find and link this citation]
• **Counter-Argument 3:** [Description of third counter-argument]
  - Citation: [Case Name, Citation (Year) - The system will automatically find and link this citation]

**CRITICAL LINK VALIDATION REQUIREMENTS:**
🚫 **ABSOLUTELY FORBIDDEN:**
- Fake or invented links (e.g., https://indiankanoon.org/doc/123456/ when that case doesn't exist)
- Generic placeholder links (e.g., https://indiankanoon.org/doc/xxxxxx/)
- Links that don't match the cited case name
- Links to non-existent cases or judgments
- Any link you cannot verify is real and working

✅ **MANDATORY REQUIREMENTS:**
- ONLY provide links to cases you KNOW exist and are accessible
- The link MUST be the exact, correct URL for the specific case cited
- The case name in the citation MUST match the case accessible at that link
- If you cannot find a real, working link for a case, DO NOT provide any link
- Test every link mentally - if you're unsure if it works, don't provide it

**CRITICAL:**
- Use markdown formatting with **bold headings** and bullet points.
- Each argument/counter-argument must be a bullet (•) with Citation as a markdown hyperlink on its own line, exactly as in the example.
- DO NOT use JSON format like {"Section 1": "...", "Arguments": [...]}.
- Present as readable professional text.
- **Every argument and counter-argument MUST include at least one real, relevant, and recent Indian case law citation as a markdown hyperlink with the correct, real, and matching link. Do NOT cite only statutes or general legal principles.**
- If you cannot find a real, working link for a relevant case, state: "No real case law with a public link found for this point."
- Do NOT mention legal databases or suggest consulting them—always provide a real, working link or state none exists.

**EXAMPLE:**
• **Argument 1:** Self-defense may be claimed if the accused reasonably apprehended imminent harm.
  - Citation: [Darshan Singh v. State of Punjab, (2010) 2 SCC 333](https://indiankanoon.org/doc/1836979/)
• **Argument 2:** ...
  - Citation: [Another Case Name, Citation](https://indiankanoon.org/doc/xxxxxx/)
• **Argument 3:** ...
  - Citation: No real case law with a public link found for this point.
{{/if}}
{{/if}}

{{#if isGenerateCitationsAction}}
---
**WORKFLOW: Generate Citations**
**Step 1: Clarify & Require Document Upload**
• {{#unless document}}If no document has been uploaded, respond:
  "Please upload the document for which you need legal citations."
  Pause until the user provides the file.{{/unless}}

**Step 2: Extract Relevant Issues & Find Case Law Citations**
• {{#if document}}Scan the document content to identify all major legal issues, key terms, and statutory references.
• For each significant issue or statutory reference, locate the most relevant **case law citation** (not just statutory references) from Indian Kanoon or official sources.
• **CRITICAL: Provide specific case law citations with real hyperlinks, NOT just statutory references like "IPC Section 307".**
• Return a numbered list of **case law citations**, each as a markdown hyperlink with the correct, real, and matching link to the cited case (e.g., [Case Name, Citation](https://indiankanoon.org/doc/xxxxxx/)).
• If no relevant case law exists for a particular issue, state: "No relevant case law found for this issue."
• Do NOT mention legal databases or suggest consulting them—always provide a real, working link or state none exists.

**CRITICAL LINK VALIDATION REQUIREMENTS:**
🚫 **ABSOLUTELY FORBIDDEN:**
- Fake or invented links (e.g., https://indiankanoon.org/doc/123456/ when that case doesn't exist)
- Generic placeholder links (e.g., https://indiankanoon.org/doc/xxxxxx/)
- Links that don't match the cited case name
- Links to non-existent cases or judgments
- Any link you cannot verify is real and working

✅ **MANDATORY REQUIREMENTS:**
- ONLY provide links to cases you KNOW exist and are accessible
- The link MUST be the exact, correct URL for the specific case cited
- The case name in the citation MUST match the case accessible at that link
- If you cannot find a real, working link for a case, DO NOT provide any link
- Test every link mentally - if you're unsure if it works, don't provide it

**REQUIRED FORMAT:**
1. [Specific Case Name, (Year) Court Citation](https://indiankanoon.org/doc/xxxxxx/)
2. [Another Specific Case Name, (Year) Court Citation](https://indiankanoon.org/doc/xxxxxx/)
3. No relevant case law found for this issue.

**EXAMPLE:**
1. [Darshan Singh v. State of Punjab, (2010) 2 SCC 333](https://indiankanoon.org/doc/1836979/)
2. [Another Case Name, Citation](https://indiankanoon.org/doc/xxxxxx/)
3. No relevant case law found for this issue.
{{/if}}
{{/if}}

{{#if isGeneralChatAction}}
---
**WORKFLOW: General Chat**
Answer "{{{question}}}" directly with full context awareness:

**Context Guidelines:**
• {{#if chatHistory}}**Reference Previous Conversation**: Use the previous conversation context above to provide relevant, contextual responses.{{/if}}
• {{#if document}}**Reference Uploaded Document**: Base your response on the uploaded document content when relevant.{{/if}}
• **Professional Legal Guidance**: Follow all core persona guidelines and provide citations where appropriate.
• **Focus on Indian Law**: Provide responses based on Indian legal principles and statutes.
• **Maintain Conversation Flow**: If the user asks about previous questions or responses, refer to the conversation history above.

**Response Format:**
• Use clear, professional language
• Provide direct answers first
• Include relevant legal citations when applicable
• Maintain conversation continuity
{{/if}}

**Final Instruction:**
Based on the user's selection (workflow "{{{action}}}"), the "User's current question/input" above, and any uploaded document, previous chat history, target language, or case description, produce the requested output.

**ABSOLUTELY CRITICAL - FORMATTING REQUIREMENTS:**
🚫 **NEVER EVER use JSON format** - This is strictly forbidden
🚫 **NEVER wrap responses in JSON objects like {"Section 1": "...", "Section 2": [...]}**
🚫 **NEVER use curly braces { } or square brackets [ ] for structuring responses**
🚫 **NEVER return data structures - only readable text**

✅ **ALWAYS use clean markdown formatting:**
✅ **Use **bold headings** for sections**
✅ **Use bullet points (•) and numbered lists (1., 2., 3.)**
✅ **Present information as readable professional text**
✅ **Output clean, professional text directly without any JSON wrappers**

**EXAMPLE OF CORRECT FORMAT:**
**Section 1: Case Summary**
This case involves...

**Section 2: Arguments in Favor**
• **Argument 1:** Description here
  - Citation: Case name or statute
  - Link: https://indiankanoon.org/doc/123456/
• **Argument 2:** Description here
  - Citation: Case name or statute
  - Link: https://www.scconline.com/supreme-court/12345

**NEVER FORMAT LIKE THIS:** {"Section 1": "...", "Arguments": [...]}

If any required input for a specific workflow is missing, ask that clarifying question. Otherwise, proceed with generating the response for the chosen workflow using ONLY markdown formatting.

Answer:`,
});

// Argument extraction prompt
const argumentExtractorPrompt = ai.definePrompt({
    name: 'argumentExtractor',
    input: { schema: z.string().describe("The full text of a legal document like an SLP.") },
    output: { schema: ExtractedArgumentsSchema },
    prompt: `You are an expert legal analyst. Extract arguments from the legal document and return ONLY valid JSON.

CRITICAL: You must return ONLY a valid JSON object in this exact format. Do not include any explanatory text, analysis, or additional content.

Required JSON format:
{
  "petitionerArgs": [
    {
      "argument": "Specific legal argument for petitioner",
      "searchQuery": "5-10 word search query for Indian Kanoon"
    }
  ],
  "respondentArgs": [
    {
      "argument": "Specific legal argument for respondent", 
      "searchQuery": "5-10 word search query for Indian Kanoon"
    }
  ]
}

Instructions:
1. Extract 2-4 key arguments for the petitioner/appellant
2. Extract 2-4 key arguments for the respondent (if present in document)
3. Each argument should be 1-2 sentences maximum
4. Each search query should be 5-10 words optimized for case law search
5. If no respondent arguments found, use empty array: "respondentArgs": []

Document Text:
{{{input}}}

JSON Response:`,
});

// Citation extraction prompt
const citationExtractorPrompt = ai.definePrompt({
    name: 'citationExtractor',
    input: { schema: z.string().describe("The full text of a legal document like an SLP.") },
    output: { schema: ExtractedCitationsSchema },
    prompt: `You are an expert legal analyst. Extract legal citations and references from the legal document and return ONLY valid JSON.

CRITICAL: You must return ONLY a valid JSON object in this exact format. Do not include any explanatory text, analysis, or additional content.

Required JSON format:
{
  "citations": [
    {
      "citation": "Specific case citation or legal reference found in document",
      "searchQuery": "5-10 word search query for Indian Kanoon"
    }
  ]
}

Instructions:
1. Extract 3-6 key legal citations, case names, or legal references from the document
2. Each citation should be the exact text as it appears in the document
3. Each search query should be 5-10 words optimized for case law search
4. Focus on landmark cases, important legal precedents, and statutory references
5. Include both case names and any citation numbers if present

Document Text:
{{{input}}}

JSON Response:`,
});

// Citation synthesis prompt
const citationSynthesizerPrompt = ai.definePrompt({
    name: 'citationSynthesizer',
    input: { schema: z.any() },
    output: { schema: GeneralChatOutputSchema },
    prompt: `You are LexAI, a specialized legal assistant. You have analyzed a user's document and conducted targeted research for each legal citation found.

    Your task is to synthesize this information into a comprehensive, well-formatted response.

    **User's Original Request:** "{{question}}"

    ---
    **Legal Citations Found in Document:**
    {{#each citationResults}}
    - **Citation:** {{this.citation}}
      - **Top 2 Relevant Cases Found:**
        {{#if this.citations.length}}
          {{#each this.citations}}
          - <a href="{{this.url}}" target="_blank" rel="noopener noreferrer">{{this.title}}</a>
          {{/each}}
        {{else}}
          - No specific case law was found for this citation.
        {{/if}}
    {{/each}}
    ---

    Now, generate the final answer in clean, professional markdown with HTML for links.
    Answer:
    `,
});

// Argument synthesis prompt
const argumentSynthesizerPrompt = ai.definePrompt({
    name: 'argumentSynthesizer',
    input: { schema: z.any() },
    output: { schema: GeneralChatOutputSchema },
    prompt: `You are LexAI, a specialized legal assistant. You have performed a detailed analysis of a user's document and conducted targeted research for each legal point.

    Your task is to synthesize this information into a comprehensive, well-formatted response.

    **User's Original Request:** "{{question}}"

    ---
    **Arguments for the Petitioner:**
    {{#each petitionerResults}}
    - **Argument:** {{this.argument}}
      - **Supporting Citations Found:**
        {{#if this.citations.length}}
          {{#each this.citations}}
          - <a href="{{this.url}}" target="_blank" rel="noopener noreferrer">{{this.title}}</a>
          {{/each}}
        {{else}}
          - No specific case law was found for this argument.
        {{/if}}
    {{/each}}
    ---
    **Arguments for the Respondent:**
    {{#if respondentResults.length}}
      {{#each respondentResults}}
      - **Argument:** {{this.argument}}
        - **Supporting Citations Found:**
          {{#if this.citations.length}}
            {{#each this.citations}}
            - <a href="{{this.url}}" target="_blank" rel="noopener noreferrer">{{this.title}}</a>
            {{/each}}
          {{else}}
            - No specific case law was found for this argument.
          {{/if}}
      {{/each}}
    {{else}}
    - No respondent arguments were identified in the document.
    {{/if}}
    ---

    Now, generate the final answer in clean, professional markdown with HTML for links.
    Answer:
    `,
});

// Advanced argument generation flow
const findCitationsForArgumentsFlow = ai.defineFlow(
  {
    name: 'findCitationsForArgumentsFlow',
    inputSchema: GeneralChatInputSchema,
    outputSchema: GeneralChatOutputSchema,
  },
  async (input) => {
    console.log('[Flow: Argument-Aware] Starting advanced citation search.');

    // Step 1: Extract structured arguments and targeted search queries from the document.
    const extractionResponse = await argumentExtractorPrompt(
      input.document || input.question,
      {
        model: 'googleai/gemini-1.5-pro-latest',
      }
    );
    
    // DEBUG: Log the raw response
    console.log('======== RAW EXTRACTION RESPONSE ========');
    console.log('Raw response:', JSON.stringify(extractionResponse, null, 2));
    console.log('=========================================');
    
    const extractedData = extractionResponse.output;

    // ADDED CONSOLE LOG
    console.log('======== EXTRACTED ARGUMENTS & QUERIES ========');
    console.log(JSON.stringify(extractedData, null, 2));
    console.log('=============================================');

    // Validate the extracted data
    if (!extractedData || !extractedData.petitionerArgs) {
      console.error('Invalid extraction response:', extractedData);
      throw new Error("Failed to extract arguments from the document. Model returned invalid format.");
    }

    if (!extractedData) {
      throw new Error("Failed to extract arguments from the document.");
    }

    // Step 2: Search for citations for each individual argument or use predefined ones
    const petitionerSearchTasks = extractedData.petitionerArgs.map(async (arg: { argument: string; searchQuery: string }) => {
      // Check if the argument matches any predefined categories
      let citations: Array<{title: string, url: string}> = [];
      
      // Define predefined citations for common legal arguments
      const predefinedCitations: Record<string, Array<{title: string, url: string}>> = {
        'misinterpretation of section 302': [
          { title: 'State of Andhra Pradesh v. Rayavarapu Punnayya (1976) 4 SCC 382', url: 'https://indiankanoon.org/doc/1092725/' },
          { title: 'Virsa Singh v. State of Punjab AIR 1958 SC 465', url: 'https://indiankanoon.org/doc/1163283/' }
        ],
        'insufficient evidence': [
          { title: 'Sharad Birdhichand Sarda v. State of Maharashtra (1984) 4 SCC 116', url: 'https://indiankanoon.org/doc/965360/' },
          { title: 'Hanumant v. State of Madhya Pradesh AIR 1952 SC 343', url: 'https://indiankanoon.org/doc/1768255/' }
        ],
        'mitigating factors': [
          { title: 'K.M. Nanavati v. State of Maharashtra AIR 1962 SC 605', url: 'https://indiankanoon.org/doc/1053585/' },
          { title: 'Sankappa v. State of Karnataka (2010) 9 SCC 399', url: 'https://indiankanoon.org/doc/1929999/' }
        ],
        'due process violation': [
          { title: 'Zahira Habibullah Sheikh v. State of Gujarat (2006) 3 SCC 374', url: 'https://indiankanoon.org/doc/1478318/' },
          { title: 'Hussainara Khatoon v. Home Secretary, State of Bihar (1980) 1 SCC 98', url: 'https://indiankanoon.org/doc/1307021/' }
        ]
      };

      // Try to match the argument with predefined categories
      const lowerArg = arg.argument.toLowerCase();
      for (const [key, value] of Object.entries(predefinedCitations)) {
        if (lowerArg.includes(key)) {
          citations = value;
          break;
        }
      }

      // If no predefined citations found, try to search
      if (citations.length === 0) {
        const searchResults = await indianKanoonSearch.run({ query: arg.searchQuery });
        // Handle the ActionResult type properly
        if (searchResults && searchResults.result && Array.isArray(searchResults.result)) {
          citations = searchResults.result.map((result: { title: string; url: string }) => ({
            title: result.title,
            url: result.url
          }));
        }
      }

      console.log(`\n[SEARCH RESULT for Petitioner Arg]: "${arg.argument}"`);
      console.log(JSON.stringify(citations, null, 2));
      
      return {
        argument: arg.argument,
        citations: citations,
      };
    });

    const respondentSearchTasks = extractedData.respondentArgs
      ? extractedData.respondentArgs.map(async (arg: { argument: string; searchQuery: string }) => {
          // Check if the argument matches any predefined categories
          let citations: Array<{title: string, url: string}> = [];
          
          // Define predefined citations for common legal arguments (respondent side)
          const predefinedCitations: Record<string, Array<{title: string, url: string}>> = {
            'correct interpretation of section 302': [
              { title: 'State of Rajasthan v. Dhool Singh (2004) 12 SCC 546', url: 'https://indiankanoon.org/doc/1940799/' },
              { title: 'State of U.P. v. Satish (2005) 3 SCC 114', url: 'https://indiankanoon.org/doc/1002907/' }
            ],
            'sufficient evidence': [
              { title: 'State of Haryana v. Bhagirath (1999) 5 SCC 96', url: 'https://indiankanoon.org/doc/1137752/' },
              { title: 'State of U.P. v. Krishna Master (2010) 12 SCC 324', url: 'https://indiankanoon.org/doc/1913404/' }
            ],
            'absence of mitigating factors': [
              { title: 'Daya Bhaga v. State of Haryana (2011) 14 SCC 517', url: 'https://indiankanoon.org/doc/1289010/' },
              { title: 'State of U.P. v. Lakhmi (1998) 4 SCC 336', url: 'https://indiankanoon.org/doc/1801512/' }
            ],
            'adherence to due process': [
              { title: 'Kathi Kalu Oghad v. State of Bombay AIR 1961 SC 1808', url: 'https://indiankanoon.org/doc/1724950/' },
              { title: 'State of Punjab v. Baldev Singh (1999) 6 SCC 172', url: 'https://indiankanoon.org/doc/501436/' }
            ]
          };

          // Try to match the argument with predefined categories
          const lowerArg = arg.argument.toLowerCase();
          for (const [key, value] of Object.entries(predefinedCitations)) {
            if (lowerArg.includes(key)) {
              citations = value;
              break;
            }
          }

          // If no predefined citations found, try to search
          if (citations.length === 0) {
            const searchResults = await indianKanoonSearch.run({ query: arg.searchQuery });
            // Handle the ActionResult type properly
            if (searchResults && searchResults.result && Array.isArray(searchResults.result)) {
              citations = searchResults.result.map((result: { title: string; url: string }) => ({
                title: result.title,
                url: result.url
              }));
            }
          }

          console.log(`\n[SEARCH RESULT for Respondent Arg]: "${arg.argument}"`);
          console.log(JSON.stringify(citations, null, 2));
          
          return {
            argument: arg.argument,
            citations: citations,
          };
        })
      : [];

    const petitionerResults = await Promise.all(petitionerSearchTasks);
    const respondentResults = await Promise.all(respondentSearchTasks);
    
    // ADDED CONSOLE LOG
    console.log('\n======== FINAL DATA FOR SYNTHESIZER ========');
    console.log('Petitioner Results:', JSON.stringify(petitionerResults, null, 2));
    console.log('Respondent Results:', JSON.stringify(respondentResults, null, 2));
    console.log('============================================');

    // Step 3: Synthesize the final, formatted answer.
    const finalResponse = await argumentSynthesizerPrompt({
        question: input.question,
        petitionerResults,
        respondentResults,
    });

    return finalResponse.output || { answer: "Could not synthesize the final arguments." };
  }
);

// Advanced citation generation flow
const findCitationsForDocumentFlow = ai.defineFlow(
  {
    name: 'findCitationsForDocumentFlow',
    inputSchema: GeneralChatInputSchema,
    outputSchema: GeneralChatOutputSchema,
  },
  async (input) => {
    console.log('[Flow: Citation-Aware] Starting advanced citation search.');

    // Step 1: Extract structured citations from the document.
    const extractionResponse = await citationExtractorPrompt(
      input.document || input.question,
      {
        model: 'googleai/gemini-1.5-pro-latest',
      }
    );
    
    // DEBUG: Log the raw response
    console.log('======== RAW CITATION EXTRACTION RESPONSE ========');
    console.log('Raw response:', JSON.stringify(extractionResponse, null, 2));
    console.log('===============================================');
    
    const extractedData = extractionResponse.output;

    // ADDED CONSOLE LOG
    console.log('======== EXTRACTED CITATIONS & QUERIES ========');
    console.log(JSON.stringify(extractedData, null, 2));
    console.log('=============================================');

    // Validate the extracted data
    if (!extractedData || !extractedData.citations) {
      console.error('Invalid extraction response:', extractedData);
      throw new Error("Failed to extract citations from the document. Model returned invalid format.");
    }

    if (!extractedData) {
      throw new Error("Failed to extract citations from the document.");
    }

    // Step 2: Search for citations for each extracted citation (limit to top 2 results)
    const citationSearchTasks = extractedData.citations.map(async (citation: { citation: string; searchQuery: string }) => {
      let citations: Array<{title: string, url: string}> = [];
      
      // Search for the citation using Indian Kanoon API
      const searchResults = await indianKanoonSearch.run({ query: citation.searchQuery });
      
      // Handle the ActionResult type properly and limit to top 2 results
      if (searchResults && searchResults.result && Array.isArray(searchResults.result)) {
        citations = searchResults.result
          .slice(0, 2) // Limit to top 2 results
          .map((result: { title: string; url: string }) => ({
            title: result.title,
            url: result.url
          }));
      }

      console.log(`\n[SEARCH RESULT for Citation]: "${citation.citation}"`);
      console.log(`Found ${citations.length} results:`, JSON.stringify(citations, null, 2));
      
      return {
        citation: citation.citation,
        citations: citations,
      };
    });

    const citationResults = await Promise.all(citationSearchTasks);
    
    // ADDED CONSOLE LOG
    console.log('\n======== FINAL CITATION DATA FOR SYNTHESIZER ========');
    console.log('Citation Results:', JSON.stringify(citationResults, null, 2));
    console.log('==================================================');

    // Step 3: Synthesize the final, formatted answer.
    const finalResponse = await citationSynthesizerPrompt({
        question: input.question,
        citationResults,
    });

    return finalResponse.output || { answer: "Could not synthesize the final citations." };
  }
);

// Define the flow with workflow detection
const legalAdviceChatFlow = ai.defineFlow(
  {
    name: 'legalAdviceChatFlow',
    inputSchema: GeneralChatInputSchema,
    outputSchema: GeneralChatOutputSchema,
  },
  async (input: LegalAdviceChatInput): Promise<LegalAdviceChatOutput> => {
    try {
      console.log('[Process Flow] Starting legal advice chat flow');
      
      // Detect workflow from the question
      const detectedAction = detectWorkflow(input.question);
      
      // ROUTING LOGIC: If the intent is to find arguments or citations,
      // use the new, more powerful flow.
      if (detectedAction === 'findCitationsForArguments') {
        if (!input.document) {
          return { answer: "Please upload a document first to generate arguments and citations." };
        }
        return await findCitationsForArgumentsFlow(input);
      }

      if (detectedAction === 'findCitationsForDocument') {
        if (!input.document) {
          return { answer: "Please upload a document first to find relevant citations." };
        }
        return await findCitationsForDocumentFlow(input);
      }
      
      // Extract additional context for specific workflows
      let targetLanguage = input.targetLanguage;
      let caseDescription = input.caseDescription;
      
      // For translation workflow, try to extract target language from question
      if (detectedAction === 'translate' && !targetLanguage) {
        const langMatch = input.question.match(/(?:in|to|into)\s+(hindi|english|tamil|bengali|gujarati|marathi|telugu|kannada|malayalam|punjabi|urdu)/i);
        if (langMatch) {
          targetLanguage = langMatch[1];
        }
      }
      
      // For arguments workflow, use the question as case description if not provided
      if (detectedAction === 'generateArguments' && !caseDescription) {
        caseDescription = input.question;
      }
      
      // Prepare template variables
      const templateVars = {
        ...input,
        action: detectedAction,
        targetLanguage,
        caseDescription,
        isSummarizeAction: detectedAction === 'summarize',
        isTranslateAction: detectedAction === 'translate',
        isGenerateArgumentsAction: detectedAction === 'generateArguments',
        isGenerateCitationsAction: detectedAction === 'generateCitations',
        isGeneralChatAction: detectedAction === 'generalChat',
      };
      
      const { output } = await masterPrompt(templateVars);
      
      let finalAnswer = '';
      if (typeof output === 'string') {
        finalAnswer = output;
      } else if (output && typeof output.answer === 'string') {
        finalAnswer = output.answer;
      } else {
        return { answer: 'I apologize, but I encountered an issue processing your request. Please try rephrasing your question or contact support if the issue persists.' };
      }
      
      // Post-process to convert JSON to markdown if AI still returns JSON
      finalAnswer = await convertJsonToMarkdown(finalAnswer);
      
      // Process citations in the final answer
      console.log('[Process Flow] Before processing citations:', finalAnswer);
      finalAnswer = await processCitationsInText(finalAnswer);
      console.log('[Process Flow] After processing citations:', finalAnswer);
      
      return { answer: finalAnswer };
    } catch (error) {
      console.error('LexAI Master Prompt Error:', error);
      return { 
        answer: 'I apologize, but I encountered a technical issue while processing your legal query. Please try again, and if the problem persists, consider consulting with a licensed advocate for immediate assistance.' 
      };
    }
  }
);

export async function legalAdviceChat(input: LegalAdviceChatInput): Promise<LegalAdviceChatOutput> {
  return legalAdviceChatFlow(input);
}
