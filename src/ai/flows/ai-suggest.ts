
'use server';
/**
 * @fileOverview AI Suggest feature for document assistance.
 *
 * - aiSuggest - A function that provides citation suggestions (using RAG) or rephrasing options for selected text.
 * - AiSuggestInput - The input type for the aiSuggest function.
 * - AiSuggestOutput - The return type for the aiSuggest function.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

const AiSuggestInputSchema = z.object({
  selectedText: z.string().describe('The text selected by the user in the document editor.'),
  actionType: z
    .enum(['citation', 'rephrase'])
    .describe('The type of suggestion requested: citation or rephrase.'),
});
export type AiSuggestInput = z.infer<typeof AiSuggestInputSchema>;

const AiSuggestOutputSchema = z.object({
  suggestion: z.string().describe('The AI-generated suggestion for the selected text.'),
});
export type AiSuggestOutput = z.infer<typeof AiSuggestOutputSchema>;

// Mock Seed Citation Database (for RAG simulation)
// In a real app, this would come from a proper knowledge base / vector DB.
const seedCitations: Array<{ textSnippetKeywords: string[]; citation: string; sourceDocumentHint: string }> = [
  {
    textSnippetKeywords: ["court", "inherent power", "stay proceedings"],
    citation: "Order XLI, Rule 5, Code of Civil Procedure, 1908. This rule grants appellate courts the power to stay proceedings under the decree or order appealed from.",
    sourceDocumentHint: "Civil Drafting Stay Application"
  },
  {
    textSnippetKeywords: ["national commission", "jurisdiction", "claims exceeding", "crore"],
    citation: "Consumer Protection Act, 2019, Section 58(1)(a)(i). The National Commission has jurisdiction for complaints where the value of goods or services paid as consideration exceeds ten crore rupees.",
    sourceDocumentHint: "APPEAL TO NATIONAL COMMISSION UNDER SECTION 19 OF CONSUMER PROTECTION ACT"
  },
  {
    textSnippetKeywords: ["compensation", "motor accident", "just and reasonable"],
    citation: "Raj Kumar v. Ajay Kumar, (2011) 1 SCC 343. The Supreme Court reiterated that compensation in motor accident claims must be just, fair, and equitable.",
    sourceDocumentHint: "Appeal under Section 173 of Motor Vehicles Act, 1988"
  },
  {
    textSnippetKeywords: ["market value", "land", "notification", "section 4"],
    citation: "Land Acquisition Act, 1894, Section 23(1). This section outlines matters to be considered in determining compensation, including the market value of the land at the date of the publication of the notification under section 4, sub-section (1).",
    sourceDocumentHint: "Appeal under Section 54 of Land Acquisition Act"
  },
  {
    textSnippetKeywords: ["appeal", "limitation period", "sufficient cause"],
    citation: "Section 5, Limitation Act, 1963. This section allows for the extension of prescribed period in certain cases if the appellant or applicant satisfies the court that he had sufficient cause for not preferring the appeal or making the application within such period.",
    sourceDocumentHint: "General Civil/Appellate Matters"
  }
];

// Input schema for the prompt, including retrieved context for RAG and action flags
const AiSuggestPromptInputSchema = z.object({
  selectedText: z.string(),
  actionType: z.enum(['citation', 'rephrase']), // Retained for general info if needed
  retrievedCitationsJson: z.string().optional().describe("A JSON string array of pre-retrieved relevant citations from the knowledge base. The AI should prioritize these for citation suggestions."),
  isCitationAction: z.boolean().optional().describe("True if the action type is 'citation'."),
  isRephraseAction: z.boolean().optional().describe("True if the action type is 'rephrase'."),
});


export async function aiSuggest(input: AiSuggestInput): Promise<AiSuggestOutput> {
  return aiSuggestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiSuggestPrompt',
  input: {schema: AiSuggestPromptInputSchema},
  output: {schema: AiSuggestOutputSchema},
  prompt: `You are a legal AI assistant. A user has selected the following text in their document:
"{{{selectedText}}}"

They have requested a "{{{actionType}}}" suggestion.

{{#if isCitationAction}}
  This is a CITATION request.
  {{#if retrievedCitationsJson}}
    Please use the following retrieved citations as primary context to generate your suggestion for "{{{selectedText}}}".
    If the retrieved citations are not directly relevant, explain why and provide the best possible citation based on the selected text itself.
    Retrieved Citations (JSON):
    {{{retrievedCitationsJson}}}
  {{else}}
    No specific citations were retrieved for "{{{selectedText}}}". Provide the most relevant legal citation you can determine. If it's too generic or not possible to determine a specific citation, state that more context might be needed.
  {{/if}}
{{/if}}

{{#if isRephraseAction}}
  This is a REPHRASE request.
  Provide a concise and improved version of "{{{selectedText}}}", maintaining its legal meaning.
{{/if}}

Provide only the suggestion.
Suggestion:`,
});

const aiSuggestFlow = ai.defineFlow(
  {
    name: 'aiSuggestFlow',
    inputSchema: AiSuggestInputSchema,
    outputSchema: AiSuggestOutputSchema,
  },
  async (input: AiSuggestInput): Promise<AiSuggestOutput> => {
    let retrievedCitationsJson: string | undefined = undefined;
    const isCitationAction = input.actionType === 'citation';
    const isRephraseAction = input.actionType === 'rephrase';

    if (isCitationAction) {
      // Simulate RAG: Filter seedCitations based on keywords in selectedText
      const lowerSelectedText = input.selectedText.toLowerCase();
      const relevantCitations = seedCitations.filter(entry =>
        entry.textSnippetKeywords.some(keyword => lowerSelectedText.includes(keyword.toLowerCase()))
      ).map(c => ({ citation: c.citation, sourceHint: c.sourceDocumentHint }));

      if (relevantCitations.length > 0) {
        retrievedCitationsJson = JSON.stringify(relevantCitations);
      }
    }

    const {output} = await prompt({
      selectedText: input.selectedText,
      actionType: input.actionType,
      retrievedCitationsJson: retrievedCitationsJson,
      isCitationAction,
      isRephraseAction,
    });
    return output!;
  }
);

