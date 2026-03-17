import { config } from 'dotenv';
config();

import '@/ai/flows/generate-discussion-prompts.ts';
import '@/ai/flows/generate-initial-logic-problem.ts';
import '@/ai/flows/validate-user-boolean-expression-flow.ts';
import '@/ai/flows/suggest-circuit-improvements.ts';
import '@/ai/flows/advise-kmap-grouping-optimization.ts';