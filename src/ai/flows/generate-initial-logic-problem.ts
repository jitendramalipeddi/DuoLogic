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
  description: "Advanced Challenge: Output 1 if 3 or more than 3 inputs (A, B, C, D) are ON (Logic 1).",
  targetTruthTable: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1],
  hints: {
    truth_table: {
      level1: "Count how many inputs are '1' in each binary row (0-15).",
      level2: "You need at least three '1's. Look at rows like 0111 (7) or 1011 (11).",
      level3: "Rows with output 1 are: 7, 11, 13, 14, and 15."
    },
    kmap: {
      level1: "Place '1's in the cells for rows 7, 11, 13, 14, 15. Look for groups of 2.",
      level2: "There are four distinct pairs of adjacent 1s that cover all the 1s in the map.",
      level3: "You should find four groups of 2: ABC, ABD, ACD, and BCD."
    },
    equation: {
      level1: "The final expression is a sum of four distinct product terms.",
      level2: "Each term will involve 3 of the 4 variables. For example, ABC covers rows 14 and 15.",
      level3: "F = ABC + ABD + ACD + BCD"
    },
    simulator: {
      level1: "Use AND gates to create the 3-variable terms and an OR gate to combine them.",
      level2: "Since your AND gates have 2 inputs, you'll need to cascade them (e.g., (A AND B) AND C).",
      level3: "Implement four cascaded AND branches for ABC, ABD, ACD, and BCD, then feed all four results into an OR network."
    }
  }
};

const prompt = ai.definePrompt({
  name: 'generateInitialLogicProblemPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: GenerateInitialLogicProblemInputSchema },
  output: { schema: GenerateInitialLogicProblemOutputSchema },
  prompt: `Generate a challenging 4-variable digital logic problem. 
Specific requirement: The problem must be "Output 1 if 3 or more than 3 inputs (A, B, C, D) are ON".

- List four input variables (A, B, C, D) where A is MSB.
- Description: "Output 1 if 3 or more than 3 inputs are ON."
- Provide a 16-element truth table (outputs only) matching this logic.
- Ensure the simplified Boolean expression requires multiple terms.
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
