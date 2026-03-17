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

const FALLBACK_PROBLEMS = [
  {
    variables: ["A", "B", "C", "D"],
    description: "Output 1 if the binary number (A is MSB, D is LSB) is greater than 7 and even.",
    targetTruthTable: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0]
  },
  {
    variables: ["A", "B", "C", "D"],
    description: "Output 1 if at least three of the inputs are high (logic 1).",
    targetTruthTable: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1]
  }
];

const prompt = ai.definePrompt({
  name: 'generateInitialLogicProblemPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: GenerateInitialLogicProblemInputSchema },
  output: { schema: GenerateInitialLogicProblemOutputSchema },
  prompt: `Generate a unique 4-variable digital logic problem for engineering students.
- List four input variables (e.g., A, B, C, D).
- Provide a clear description of the logic circuit's required behavior.
- Provide a 16-element truth table array (outputs only, index 0 is 0000, index 15 is 1111).

Example:
{
  "variables": ["A", "B", "C", "D"],
  "description": "Output 1 if the binary value represented by ABCD is a prime number.",
  "targetTruthTable": [0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0]
}

Ensure the truth table is logically consistent with the description.`,
});

export async function generateInitialLogicProblem(input: GenerateInitialLogicProblemInput): Promise<GenerateInitialLogicProblemOutput> {
  return generateInitialLogicProblemFlow(input);
}

const generateInitialLogicProblemFlow = ai.defineFlow(
  {
    name: 'generateInitialLogicProblemFlow',
    inputSchema: GenerateInitialLogicProblemInputSchema,
    outputSchema: GenerateInitialLogicProblemOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('No output returned from GenAI.');
      }
      return output;
    } catch (error: any) {
      console.error('Logic Problem Generation failed, using fallback:', error.message);
      return FALLBACK_PROBLEMS[Math.floor(Math.random() * FALLBACK_PROBLEMS.length)];
    }
  }
);
