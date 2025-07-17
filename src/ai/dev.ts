import { config } from 'dotenv';
config();

import '@/ai/flows/judgment-prediction.ts';
import '@/ai/flows/legal-advice-chat.ts';
import '@/ai/flows/template-search.ts';
import '@/ai/flows/ai-suggest.ts';
import '@/ai/flows/document-processing.ts';
import '@/ai/tools/google-docs-editor-tool.ts';