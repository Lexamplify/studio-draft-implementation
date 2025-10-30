import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase-admin';

export interface CaseCreationInput {
  caseName: string;
  tags?: string[];
  details?: {
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
    summary?: string;
    legalSections?: string[];
    keyFacts?: string[];
  };
  userId: string;
  documentContent?: string;
  documentName?: string;
}

export interface CaseCreationOutput {
  success: boolean;
  caseId?: string;
  caseName?: string;
  message?: string;
  error?: string;
}

export const createCaseTool = ai.defineTool(
  {
    name: 'createCase',
    description: 'Create a new legal case from document analysis or user input. Use this tool when the user explicitly requests to create a case, or when a case document is detected and the user wants to proceed with case creation.',
    inputSchema: z.object({
      caseName: z.string().describe('Case name (e.g., "Petitioner vs. Respondent")'),
      tags: z.array(z.string()).optional().describe('Relevant tags for the case (e.g., ["Insurance", "Writ Petition", "Court Case"])'),
      details: z.object({
        petitionerName: z.string().optional().describe('Petitioner/complainant name'),
        respondentName: z.string().optional().describe('Respondent/accused name'),
        caseNumber: z.string().optional().describe('Case number if available'),
        courtName: z.string().optional().describe('Court name'),
        judgeName: z.string().optional().describe('Judge name if mentioned'),
        petitionerCounsel: z.string().optional().describe('Petitioner counsel/lawyer name'),
        respondentCounsel: z.string().optional().describe('Respondent counsel/lawyer name'),
        caseType: z.string().optional().describe('Type of case (Civil/Criminal/Family/etc.)'),
        filingDate: z.string().optional().describe('Filing date in YYYY-MM-DD format'),
        nextHearingDate: z.string().optional().describe('Next hearing date in YYYY-MM-DD format'),
        summary: z.string().optional().describe('Brief case summary'),
        legalSections: z.array(z.string()).optional().describe('Legal sections involved'),
        keyFacts: z.array(z.string()).optional().describe('Key facts of the case'),
      }).optional().describe('Case details extracted from document'),
      userId: z.string().describe('User ID'),
      documentContent: z.string().optional().describe('Original document content for reference'),
      documentName: z.string().optional().describe('Name of the document used for case creation'),
    }),
  },
  async (input: CaseCreationInput): Promise<CaseCreationOutput> => {
    try {
      console.log('[Create Case Tool] ========== TOOL CALLED ==========');
      console.log('[Create Case Tool] Input received:', {
        caseName: input.caseName,
        userId: input.userId,
        hasTags: !!input.tags,
        hasDetails: !!input.details
      });
      
      if (!input.userId) {
        console.error('[Create Case Tool] ERROR: userId is missing!');
        return {
          success: false,
          error: 'userId is required to create a case',
        };
      }
      
      if (!input.caseName) {
        console.error('[Create Case Tool] ERROR: caseName is missing!');
        return {
          success: false,
          error: 'caseName is required to create a case',
        };
      }
      
      // Prepare case data
      const caseData = {
        caseName: input.caseName,
        tags: input.tags || [],
        details: input.details || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('[Create Case Tool] Creating case in Firestore...');
      
      // Create case in Firestore
      const docRef = await db
        .collection('users')
        .doc(input.userId)
        .collection('cases')
        .add(caseData);
      
      console.log('[Create Case Tool] ✅ Case created successfully with ID:', docRef.id);
      console.log('[Create Case Tool] ================================================');
      
      return {
        success: true,
        caseId: docRef.id,
        caseName: input.caseName,
        message: `Case "${input.caseName}" created successfully with ID ${docRef.id}.`,
      };
    } catch (error) {
      console.error('[Create Case Tool] ❌ ERROR:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create case',
      };
    }
  }
);

