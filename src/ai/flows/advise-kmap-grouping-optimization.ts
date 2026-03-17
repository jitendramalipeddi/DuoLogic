'use server';
/**
 * @fileOverview An AI advisor for K-map grouping optimization.
 *
 * - adviseKMapGroupingOptimization - A function that provides feedback on K-map groupings.
 * - AdviseKMapGroupingOptimizationInput - The input type for the adviseKMapGroupingOptimization function.
 * - AdviseKMapGroupingOptimizationOutput - The return type for the adviseKMapGroupingOptimization function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const KMapCellValueSchema = z.union([z.literal('0'), z.literal('1'), z.literal('X')]).describe("A cell value in the K-map grid: '0' for logic 0, '1' for logic 1, 'X' for don't care.");

const AdviseKMapGroupingOptimizationInputSchema = z.object({
  kMapGrid: z.array(z.array(KMapCellValueSchema))
    .length(4, { message: 'K-map grid must be a 4x4 array.' })
    .transform(grid => grid.map(row => z.array(KMapCellValueSchema).length(4).parse(row))) // Ensure each row is also length 4
    .describe('A 4x4 K-map grid. Rows and columns follow standard Gray code order for a 4-variable map (e.g., A,B for rows and C,D for columns).'),
  userGroupings: z.array(
    z.array(
      z.object({
        row: z.number().int().min(0).max(3).describe('The row index (0-3) of a cell in a grouping.'),
        col: z.number().int().min(0).max(3).describe('The column index (0-3) of a cell in a grouping.'),
      })
    )
  ).describe('An array where each element is a list of {row, col} coordinates representing a single user-defined group of 1s or Xs on the K-map.'),
});
export type AdviseKMapGroupingOptimizationInput = z.infer<typeof AdviseKMapGroupingOptimizationInputSchema>;

const AdviseKMapGroupingOptimizationOutputSchema = z.object({
  isOptimal: z.boolean().describe('True if the user groupings represent an optimal K-map simplification; false otherwise.'),
  feedback: z.string().describe(
    'Constructive feedback and suggestions for improving the K-map groupings, if they are not optimal. ' +
    'Explain why certain groups are not prime implicants, or if larger groups could be formed, or if fewer groups could achieve the same simplification. ' +
    'If optimal, provide positive reinforcement. Include specific references to cell coordinates or group properties where possible.'
  ),
});
export type AdviseKMapGroupingOptimizationOutput = z.infer<typeof AdviseKMapGroupingOptimizationOutputSchema>;

export async function adviseKMapGroupingOptimization(input: AdviseKMapGroupingOptimizationInput): Promise<AdviseKMapGroupingOptimizationOutput> {
  return adviseKMapGroupingOptimizationFlow(input);
}

const KMAP_GRID_LAYOUT_DESCRIPTION = `
The K-map grid provided is a 4x4 grid representing a 4-variable Boolean function.
Rows and columns follow standard Gray code order, meaning adjacent cells (including wrap-around) differ by only one variable.
'0' means a logic 0, '1' means a logic 1, and 'X' means a don't care condition.
`;

const prompt = ai.definePrompt({
  name: 'adviseKMapGroupingOptimizationPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: AdviseKMapGroupingOptimizationInputSchema },
  output: { schema: AdviseKMapGroupingOptimizationOutputSchema },
  prompt: `You are an expert in digital logic design and K-map simplification. Your task is to analyze user-provided groupings on a 4-variable K-map and provide constructive feedback on their optimality.

${KMAP_GRID_LAYOUT_DESCRIPTION}

Here is the current K-map grid:
{{#each kMapGrid}}
  {{#each this}} {{this}} {{/each}}
{{/each}}

Here are the user's defined groups:
{{#each userGroupings}}
  Group {{add @index 1}}:
  Cells:
  {{#each this}}
    ({{this.row}}, {{this.col}})
  {{/each}}
{{/each}}

Evaluate the user's groupings based on the following criteria for optimal K-map simplification:
1.  All '1's in the K-map must be covered by at least one group.
2.  Each group must be a valid power-of-2 rectangle (1, 2, 4, 8, 16 cells) of adjacent '1's or 'X's. Groups can wrap around the edges of the map.
3.  All groups must be prime implicants (cannot be combined with another group to form a larger group).
4.  The set of groups should be a minimal cover (covering all '1's with the fewest possible prime implicants). Prioritize essential prime implicants.

Based on these criteria, determine if the user's groupings are optimal. If not optimal, provide detailed, constructive feedback, explaining why certain groups are suboptimal or suggesting how they could be improved. Reference specific cell coordinates or groups if it helps clarify the feedback. If the groupings are optimal, provide positive reinforcement.

Please output your analysis as a JSON object strictly following this schema:
```json
{{jsonSchema AdviseKMapGroupingOptimizationOutputSchema}}
```
`,
});

const adviseKMapGroupingOptimizationFlow = ai.defineFlow(
  {
    name: 'adviseKMapGroupingOptimizationFlow',
    inputSchema: AdviseKMapGroupingOptimizationInputSchema,
    outputSchema: AdviseKMapGroupingOptimizationOutputSchema,
  },
  async (input) => {
    // Check if there are no '1's in the K-map.
    const allOnesInGrid = input.kMapGrid.flat().filter(cell => cell === '1').length;

    // If there are no '1's, an optimal solution would have no groupings.
    if (allOnesInGrid === 0) {
      return {
        isOptimal: input.userGroupings.length === 0,
        feedback: input.userGroupings.length === 0
          ? "Great job! Since there are no '1's in the K-map, an optimal simplification requires no groupings." // Optimal case
          : "There are no '1's in the K-map that need to be covered. Please remove all groups to achieve an optimal simplification." // Suboptimal case
      };
    }

    const { output } = await prompt(input);
    return output!;
  }
);
