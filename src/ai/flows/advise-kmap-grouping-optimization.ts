'use server';
/**
 * @fileOverview An AI advisor for K-map grouping optimization.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const KMapCellValueSchema = z.union([z.literal('0'), z.literal('1'), z.literal('X')]).describe("A cell value in the K-map grid: '0' for logic 0, '1' for logic 1, 'X' for don't care.");

const AdviseKMapGroupingOptimizationInputSchema = z.object({
  kMapGrid: z.array(z.array(KMapCellValueSchema))
    .length(4)
    .describe('A 4x4 K-map grid.'),
  userGroupings: z.array(
    z.array(
      z.object({
        row: z.number().int().min(0).max(3),
        col: z.number().int().min(0).max(3),
      })
    )
  ).describe('User-defined groups of cells.'),
});
export type AdviseKMapGroupingOptimizationInput = z.infer<typeof AdviseKMapGroupingOptimizationInputSchema>;

const AdviseKMapGroupingOptimizationOutputSchema = z.object({
  isOptimal: z.boolean().describe('True if the user groupings represent an optimal K-map simplification; false otherwise.'),
  feedback: z.string().describe('Constructive feedback and suggestions for improvement.'),
});
export type AdviseKMapGroupingOptimizationOutput = z.infer<typeof AdviseKMapGroupingOptimizationOutputSchema>;

export async function adviseKMapGroupingOptimization(input: AdviseKMapGroupingOptimizationInput): Promise<AdviseKMapGroupingOptimizationOutput> {
  return adviseKMapGroupingOptimizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adviseKMapGroupingOptimizationPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: AdviseKMapGroupingOptimizationInputSchema },
  output: { schema: AdviseKMapGroupingOptimizationOutputSchema },
  prompt: `You are an expert in digital logic design. Analyze the following 4-variable K-map grid and the user's defined groups.
  
Grid (4x4, Gray code order):
{{#each kMapGrid}}
  {{#each this}} {{this}} {{/each}}
{{/each}}

User's Groups:
{{#each userGroupings}}
  Group {{add @index 1}}: {{#each this}}({{this.row}},{{this.col}}) {{/each}}
{{/each}}

Criteria for optimality:
1. All '1's must be covered.
2. Groups must be powers of 2 (1, 2, 4, 8, 16).
3. Groups must be Prime Implicants (cannot be expanded).
4. Minimal number of groups must be used.

Determine if optimal and provide feedback.`,
});

const adviseKMapGroupingOptimizationFlow = ai.defineFlow(
  {
    name: 'adviseKMapGroupingOptimizationFlow',
    inputSchema: AdviseKMapGroupingOptimizationInputSchema,
    outputSchema: AdviseKMapGroupingOptimizationOutputSchema,
  },
  async (input) => {
    const allOnes = input.kMapGrid.flat().filter(c => c === '1').length;
    if (allOnes === 0) {
      return {
        isOptimal: input.userGroupings.length === 0,
        feedback: input.userGroupings.length === 0 ? "Correct! No groupings needed." : "Remove groupings for an empty map."
      };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
