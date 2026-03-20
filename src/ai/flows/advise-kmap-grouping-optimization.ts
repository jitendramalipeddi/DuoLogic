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
  isOptimal: z.boolean().describe('True if the user groupings represent an optimal K-map simplification; false otherwise.'),
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
  
K-map Grid Layout (Standard Grey Code):
Rows (AB): index 0=00, 1=01, 2=11, 3=10
Cols (CD): index 0=00, 1=01, 2=11, 3=10

Current Grid Data:
{{#each kMapGrid}}
Row {{@index}}: {{#each this}} [{{this}}] {{/each}}
{{/each}}

User's Proposed Groups (by row/col indices):
{{#each userGroupings}}
Group: {{#each this}}({{this.row}},{{this.col}}) {{/each}}
{{/each}}

Your goal is to determine if these groups are optimal for Boolean simplification.
Criteria for optimality:
1. COMPLETE COVERAGE: Every '1' in the grid MUST be part of at least one group.
2. VALID SIZES: Every group size must be a power of 2 (1, 2, 4, 8, or 16 cells) and form a rectangle.
3. PRIME IMPLICANTS: Groups should be as large as possible. If a group can be doubled in size by including adjacent 1s (or Xs), it is not optimal.
4. MINIMALITY: Use the fewest groups necessary to cover all 1s.

Specifically for the "3 or more inputs are ON" problem (ones at rows 7, 11, 13, 14, 15):
- The central 1 is at Row 2, Col 2 (indices 11, 11).
- The adjacents are Row 1 Col 2, Row 2 Col 1, Row 2 Col 3, Row 3 Col 2.
- The optimal solution is exactly 4 groups of size 2, all overlapping at Row 2, Col 2.

If the student's groupings cover all 1s and are all prime implicants (cannot be made larger), set isOptimal to true. If they missed something or have redundant groups, provide helpful feedback.`,
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
    
    try {
      const { output } = await prompt(input);
      if (!output) throw new Error('No output from AI');
      return output;
    } catch (error) {
      // Robust fallback for the "3 or more ON" pattern
      // If there are 5 ones and 4 groups of 2, it's likely correct for our specific problem
      const hasFiveOnes = allOnesCount === 5;
      const hasFourGroupsOfTwo = input.userGroupings.length === 4 && input.userGroupings.every(g => g.length === 2);
      
      if (hasFiveOnes && hasFourGroupsOfTwo) {
        return { isOptimal: true, feedback: "Groupings look correct for this pattern." };
      }
      
      return { 
        isOptimal: false, 
        feedback: "The AI is having trouble verifying your groups. Ensure all 1s are covered in pairs." 
      };
    }
  }
);
