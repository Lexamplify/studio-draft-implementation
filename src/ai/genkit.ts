import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // Use a more powerful model for better analysis
  model: 'googleai/gemini-1.5-pro-latest', 
});

/* import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-pro',
});

import {genkit} from 'genkit';
import {googleAI, gemini15Flash} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash, // Using the proper Gemini 1.5 Flash model
});
 */