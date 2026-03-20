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
    .describe('A 4x4 K-map grid in standard Grey code order (00, 01, 11, 10).'),
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
  isOptimal: z.boolean().describe('True if the user groupings represent an optimal K-map simplification (minimal Prime Implicants covering all 1s); false otherwise.'),
  feedback: z.string().describe('Constructive feedback. If suboptimal, explain why (e.g., missed 1s, non-power-of-2 group size, or groups could be merged).'),
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
  prompt: `You are an expert in digital logic design. Analyze the provided 4-variable K-map grid and the student's groupings.
  
K-map Grid (Rows AB: 00, 01, 11, 10; Columns CD: 00, 01, 11, 10):
{{#each kMapGrid}}
Row {{@index}}: {{#each this}} [{{this}}] {{/each}}
{{/each}}

User's Proposed Groups:
{{#each userGroupings}}
Group {{add @index 1}}: {{#each this}}({{this.row}},{{this.col}}) {{/each}}
{{/each}}

Your goal is to determine if these groups are optimal for Boolean simplification.
Criteria for optimality:
1. COMPLETE COVERAGE: Every '1' in the grid MUST be part of at least one group.
2. VALID SIZES: Every group size must be a power of 2 (1, 2, 4, 8, or 16 cells).
3. PRIME IMPLICANTS: Groups should be as large as possible. If a group can be doubled in size by including adjacent 1s (or Xs), the current group is not optimal.
4. MINIMALITY: Use the fewest number of groups necessary to cover all 1s.

Don't cares ('X') can be used to make groups larger, but do not need to be covered if they don't help.

Evaluate the student's work. If it's correct, set isOptimal to true. If not, provide helpful hints (e.g., "You missed a 1 at row 2, col 3" or "The group at (0,0) could be larger").`,
});

const adviseKMapGroupingOptimizationFlow = ai.defineFlow(
  {
    name: 'adviseKMapGroupingOptimizationFlow',
    inputSchema: AdviseKMapGroupingOptimizationInputSchema,
    outputSchema: AdviseKMapGroupingOptimizationOutputSchema,
  },
  async (input) => {
    const allOnesCount = input.kMapGrid.flat().filter(c => c === '1').length;
    if (allOnesCount === 0) {
      return {
        isOptimal: input.userGroupings.length === 0,
        feedback: input.userGroupings.length === 0 ? "Correct! No groupings needed for a map with no 1s." : "You have groups, but the map has no 1s to cover."
      };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
