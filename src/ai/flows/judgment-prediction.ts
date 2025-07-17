// 'use server';
/**
 * @fileOverview Provides AI-powered judgment predictions based on the type of legal argument.
 *
 * - judgmentPrediction - A function that takes a legal argument type and returns a prediction of the likely outcome.
 * - JudgmentPredictionInput - The input type for the judgmentPrediction function.
 * - JudgmentPredictionOutput - The return type for the judgmentPrediction function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const JudgmentPredictionInputSchema = z.object({
  legalArgumentType: z
    .string()
    .describe('The type of legal argument for which a judgment prediction is desired.'),
});
export type JudgmentPredictionInput = z.infer<typeof JudgmentPredictionInputSchema>;

const JudgmentPredictionOutputSchema = z.object({
  likelyOutcome: z
    .string()
    .describe(
      'A prediction of the likely outcome of the legal argument based on prevailing case law.'
    ),
  reasoning: z
    .string()
    .describe('The reasoning behind the predicted outcome, citing relevant case law.'),
});
export type JudgmentPredictionOutput = z.infer<typeof JudgmentPredictionOutputSchema>;

export async function judgmentPrediction(input: JudgmentPredictionInput): Promise<JudgmentPredictionOutput> {
  return judgmentPredictionFlow(input);
}

const judgmentPredictionPrompt = ai.definePrompt({
  name: 'judgmentPredictionPrompt',
  input: {schema: JudgmentPredictionInputSchema},
  output: {schema: JudgmentPredictionOutputSchema},
  prompt: `You are an AI legal assistant specializing in predicting legal judgment outcomes.

  Based on the type of legal argument provided, research relevant case law and predict the likely outcome.
  Provide reasoning for your prediction, citing specific cases where possible.

  Legal Argument Type: {{{legalArgumentType}}}
  `, // Ensure this is valid Handlebars
});

const judgmentPredictionFlow = ai.defineFlow(
  {
    name: 'judgmentPredictionFlow',
    inputSchema: JudgmentPredictionInputSchema,
    outputSchema: JudgmentPredictionOutputSchema,
  },
  async input => {
    const {output} = await judgmentPredictionPrompt(input);
    return output!;
  }
);
