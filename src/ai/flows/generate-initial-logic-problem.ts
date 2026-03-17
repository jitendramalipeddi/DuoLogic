'use server';
/**
 * @fileOverview A Genkit flow for generating a unique 4-variable digital logic problem.
 *
 * - generateInitialLogicProblem - A function that handles the generation of the logic problem.
 * - GenerateInitialLogicProblemInput - The input type for the generateInitialLogicProblem function.
 * - GenerateInitialLogicProblemOutput - The return type for the generateInitialLogicProblem function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateInitialLogicProblemInputSchema = z.void();
export type GenerateInitialLogicProblemInput = z.infer<typeof GenerateInitialLogicProblemInputSchema>;

const GenerateInitialLogicProblemOutputSchema = z.object({
  variables: z.array(z.string()).describe('The input variables for the logic problem, e.g., ["A", "B", "C", "D"].'),
  description: z.string().describe('A clear description of the digital logic problem.'),
  targetTruthTable: z.array(z.number().int().min(0).max(1)).length(16).describe('A 16-element array representing the target output (0 or 1) for each row of the truth table, in standard binary order (0000 to 1111).'),
});
export type GenerateInitialLogicProblemOutput = z.infer<typeof GenerateInitialLogicProblemOutputSchema>;

export async function generateInitialLogicProblem(input: GenerateInitialLogicProblemInput): Promise<GenerateInitialLogicProblemOutput> {
  return generateInitialLogicProblemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInitialLogicProblemPrompt',
  input: { schema: GenerateInitialLogicProblemInputSchema },
  output: { schema: GenerateInitialLogicProblemOutputSchema },
  prompt: `Generate a unique 4-variable digital logic problem. The problem should include:
- A list of the four input variables (e.g., A, B, C, D).
- A clear, concise description of the logic problem.
- A 16-element array representing the desired output (0 or 1) for every possible combination of the four input variables (from 0000 to 1111 in binary order).

Example Output format:
{
  "variables": ["A", "B", "C", "D"],
  "description": "Design a logic circuit that outputs 1 if exactly two of its four inputs are 1.",
  "targetTruthTable": [0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0]
}

Ensure the problem is solvable and distinct. Focus on generating a unique truth table.`,
});

const generateInitialLogicProblemFlow = ai.defineFlow(
  {
    name: 'generateInitialLogicProblemFlow',
    inputSchema: GenerateInitialLogicProblemInputSchema,
    outputSchema: GenerateInitialLogicProblemOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate initial logic problem output.');
    }
    return output;
  }
);
