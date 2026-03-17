'use server';
/**
 * @fileOverview An AI agent that assesses circuit efficiency against K-map optimization
 * and offers non-blocking suggestions for simplification.
 *
 * - suggestCircuitImprovements - A function that handles the circuit efficiency assessment.
 * - SuggestCircuitImprovementsInput - The input type for the suggestCircuitImprovements function.
 * - SuggestCircuitImprovementsOutput - The return type for the suggestCircuitImprovements function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestCircuitImprovementsInputSchema = z.object({
  currentCircuitDescription: z
    .string()
    .describe(
      'A textual description of the user\'s currently constructed circuit, including the types of logic gates and their connections. Example: "AND gate with inputs A and B, OR gate with inputs C and D, output of AND connected to input of NOT, output of OR connected to input of NOT"'
    ),
  kMapOptimizedGateCount: z
    .number()
    .describe(
      'The minimal number of logic gates required for the K-map optimized solution.'
    ),
  kMapOptimizedExpression: z
    .string()
    .optional()
    .describe(
      'The simplified Boolean expression derived from the K-map. Used for providing more targeted suggestions if available.'
    ),
});
export type SuggestCircuitImprovementsInput = z.infer<
  typeof SuggestCircuitImprovementsInputSchema
>;

const SuggestCircuitImprovementsOutputSchema = z.object({
  isOptimal: z
    .boolean()
    .describe(
      'True if the current circuit\'s gate count matches the K-map optimized gate count, false otherwise.'
    ),
  suggestions: z
    .string()
    .describe(
      'Non-blocking suggestions for simplification if the circuit is not optimal, or a message confirming optimality.'
    ),
});
export type SuggestCircuitImprovementsOutput = z.infer<
  typeof SuggestCircuitImprovementsOutputSchema
>;

export async function suggestCircuitImprovements(
  input: SuggestCircuitImprovementsInput
): Promise<SuggestCircuitImprovementsOutput> {
  return suggestCircuitImprovementsFlow(input);
}

const suggestCircuitImprovementsPrompt = ai.definePrompt({
  name: 'suggestCircuitImprovementsPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: SuggestCircuitImprovementsInputSchema },
  output: { schema: SuggestCircuitImprovementsOutputSchema },
  prompt: `You are an expert in digital logic design and circuit optimization. Your task is to analyze a user's constructed circuit and compare its efficiency to a K-map optimized solution.

Here is the user's current circuit description:
{{{currentCircuitDescription}}}

The minimal number of gates required for the K-map optimized solution is: {{{kMapOptimizedGateCount}}}

{{#if kMapOptimizedExpression}}
The K-map optimized Boolean expression is: {{{kMapOptimizedExpression}}}
{{/if}}

First, estimate the number of logic gates in the 'currentCircuitDescription'. Count each AND, OR, NOT, XOR, XNOR gate as one gate. Do not count inputs or outputs as gates.

Then, compare this estimated gate count to the 'kMapOptimizedGateCount'.

If the estimated gate count is greater than the 'kMapOptimizedGateCount', set 'isOptimal' to false and provide clear, non-blocking suggestions for how the user can simplify their circuit to reach the optimal gate count. Focus on identifying areas where gates could be merged, eliminated, or replaced with simpler equivalents, potentially referencing the 'kMapOptimizedExpression' if it helps. The suggestions should be encouraging and educational, helping the user understand the principles of efficiency.

If the estimated gate count is equal to or less than the 'kMapOptimizedGateCount', set 'isOptimal' to true and provide a positive message confirming that the circuit is optimal or very efficient. Acknowledge good design.

Your response MUST strictly adhere to the following JSON schema.`,
});

const suggestCircuitImprovementsFlow = ai.defineFlow(
  {
    name: 'suggestCircuitImprovementsFlow',
    inputSchema: SuggestCircuitImprovementsInputSchema,
    outputSchema: SuggestCircuitImprovementsOutputSchema,
  },
  async (input) => {
    const { output } = await suggestCircuitImprovementsPrompt(input);
    return output!;
  }
);
