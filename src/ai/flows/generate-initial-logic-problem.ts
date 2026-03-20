'use server';
/**
 * @fileOverview A Genkit flow for generating a unique 4-variable digital logic problem with tiered hints.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StageHintsSchema = z.object({
  level1: z.string().describe('A general hint or concept reminder.'),
  level2: z.string().describe('A more specific hint providing strategic guidance.'),
  level3: z.string().describe('A strong hint or partial scaffolding/solution detail.'),
});

const GenerateInitialLogicProblemInputSchema = z.void();
export type GenerateInitialLogicProblemInput = z.infer<typeof GenerateInitialLogicProblemInputSchema>;

const GenerateInitialLogicProblemOutputSchema = z.object({
  variables: z.array(z.string()).describe('The input variables for the logic problem, e.g., ["A", "B", "C", "D"].'),
  description: z.string().describe('A clear description of the digital logic problem.'),
  targetTruthTable: z.array(z.number().int().min(0).max(1)).length(16).describe('A 16-element array representing the target output (0 or 1) for each row of the truth table.'),
  hints: z.object({
    truth_table: StageHintsSchema,
    kmap: StageHintsSchema,
    equation: StageHintsSchema,
    simulator: StageHintsSchema,
  }).describe('Tiered hints for each stage of the problem-solving process.'),
});
export type GenerateInitialLogicProblemOutput = z.infer<typeof GenerateInitialLogicProblemOutputSchema>;

const FALLBACK_PROBLEM: GenerateInitialLogicProblemOutput = {
  variables: ["A", "B", "C", "D"],
  description: "Output 1 if the binary number (A is MSB, D is LSB) is greater than 7 and even.",
  targetTruthTable: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  hints: {
    truth_table: {
      level1: "Recall that 'even' means the Least Significant Bit (D) must be 0.",
      level2: "Check rows 8, 10, 12, and 14 specifically.",
      level3: "Rows 0-7 are all 0 because the value must be greater than 7."
    },
    kmap: {
      level1: "Group the '1's in the bottom half of the map where A is 1.",
      level2: "Look for a single vertical column or a large block in the rows representing A=1.",
      level3: "You can form a group of four '1's if you consider the property of the even numbers in the 8-15 range."
    },
    equation: {
      level1: "The equation will likely involve A and D'.",
      level2: "Since A must be 1 and D must be 0, look for a term like A · D'.",
      level3: "The simplest expression for this specific problem is F = A · D'."
    },
    simulator: {
      level1: "You only need one AND gate and one NOT gate.",
      level2: "Connect input A and the inverse of input D to the AND gate.",
      level3: "Wire A to Pin 1 of AND, and D through a NOT gate to Pin 2 of AND."
    }
  }
};

const prompt = ai.definePrompt({
  name: 'generateInitialLogicProblemPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: GenerateInitialLogicProblemInputSchema },
  output: { schema: GenerateInitialLogicProblemOutputSchema },
  prompt: `Generate a unique 4-variable digital logic problem for engineering students.
- List four input variables (A, B, C, D).
- Provide a clear description.
- Provide a 16-element truth table (outputs only).
- Provide 3 levels of hints for each stage:
  - Level 1: Conceptual hint.
  - Level 2: Strategic hint.
  - Level 3: Direct scaffolding or partial solution.

Ensure logical consistency. Output strictly JSON.`,
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
      if (!output) throw new Error('No output');
      return output;
    } catch (error) {
      console.error('Logic Problem Generation failed, using fallback');
      return FALLBACK_PROBLEM;
    }
  }
);
