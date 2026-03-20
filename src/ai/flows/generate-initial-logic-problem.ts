'use server';
/**
 * @fileOverview A Genkit flow for generating a challenging 4-variable digital logic problem with tiered hints.
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
  description: "Advanced Challenge: Output 1 if the 4-bit binary input (A is MSB) represents a Prime Number (2, 3, 5, 7, 11, 13) OR if the number is exactly 8.",
  targetTruthTable: [0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0],
  hints: {
    truth_table: {
      level1: "Identify all prime numbers between 0 and 15. Don't forget that 1 is not a prime number.",
      level2: "Primes in this range are 2, 3, 5, 7, 11, and 13. Also include the binary for 8 (1000).",
      level3: "Rows with output 1 are: 2, 3, 5, 7, 8, 11, and 13."
    },
    kmap: {
      level1: "This K-map will have 7 '1's. Look for groups of 2 and 4.",
      level2: "There is a group of four '1's in the middle (Rows 01 and 11, Columns 01 and 11).",
      level3: "You should find three main groups: A'CD, BC'D, and AB'C'D' (for the 8)."
    },
    equation: {
      level1: "The equation requires combining three distinct product terms.",
      level2: "Try to group the primes separately from the value 8.",
      level3: "F = A'BD + A'BC + AB'C'D' + B'CD is one way, but check for simpler Prime Implicants."
    },
    simulator: {
      level1: "You will need multiple AND gates feeding into a single OR gate.",
      level2: "Use NOT gates for inversions of variables like A' or D'.",
      level3: "Implement the terms derived in the equation stage and combine them with a 4-input OR (or cascaded 2-input ORs)."
    }
  }
};

const prompt = ai.definePrompt({
  name: 'generateInitialLogicProblemPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: GenerateInitialLogicProblemInputSchema },
  output: { schema: GenerateInitialLogicProblemOutputSchema },
  prompt: `Generate an ADVANCED and CHALLENGING 4-variable digital logic problem for senior engineering students.
- List four input variables (A, B, C, D) where A is MSB.
- Provide a complex description (e.g., Prime numbers, Fibonacci numbers, or specific mathematical conditions like 'X is a multiple of 3 but not 9').
- Provide a 16-element truth table (outputs only).
- Ensure the simplified Boolean expression requires at least 3-4 terms to prevent trivial solutions.
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
