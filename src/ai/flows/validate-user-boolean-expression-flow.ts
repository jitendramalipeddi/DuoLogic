'use server';
/**
 * @fileOverview Validates user boolean expressions against an ideal solution.
 * Focuses on logical equivalence regardless of term order.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateBooleanExpressionInputSchema = z.object({
  userExpression: z.string(),
  idealExpression: z.string(),
  variables: z.array(z.string()),
});
export type ValidateBooleanExpressionInput = z.infer<typeof ValidateBooleanExpressionInputSchema>;

const ValidateBooleanExpressionOutputSchema = z.object({
  isCorrect: z.boolean().describe("True if the expressions are logically equivalent."),
  feedback: z.string().describe("Feedback explaining any errors."),
});
export type ValidateBooleanExpressionOutput = z.infer<typeof ValidateBooleanExpressionOutputSchema>;

const validateUserBooleanExpressionPrompt = ai.definePrompt({
  name: 'validateUserBooleanExpressionPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: ValidateBooleanExpressionInputSchema},
  output: {schema: ValidateBooleanExpressionOutputSchema},
  prompt: `You are a digital logic expert. Your task is to determine if two Boolean expressions are logically equivalent for the variables: {{{variables}}}.

User's Expression: {{{userExpression}}}
Ideal Reference: {{{idealExpression}}}

CRITICAL RULES:
1. ORDER INDEPENDENCE: The order of terms in a sum-of-products (SOP) expression DOES NOT MATTER. For example, "ABC + ABD" is identical to "ABD + ABC".
2. LOGICAL EQUIVALENCE: Use Boolean algebra rules (Commutative, Associative, Distributive, etc.) to determine if they describe the same truth table.
3. PREFIXES: Ignore common prefixes like "F =", "Output =", etc.
4. SYNTAX: Treat '+' as OR, juxtaposition as AND, and symbols like ' (apostrophe) or ! as NOT.

If the expressions are logically equivalent (even if the order of terms or variables within terms differs), set isCorrect to true.
If they are NOT equivalent, provide a concise explanation focusing on what logic is missing or incorrect.`,
});

export async function validateUserBooleanExpression(input: ValidateBooleanExpressionInput): Promise<ValidateBooleanExpressionOutput> {
  return validateUserBooleanExpressionFlow(input);
}

const validateUserBooleanExpressionFlow = ai.defineFlow(
  {
    name: 'validateUserBooleanExpressionFlow',
    inputSchema: ValidateBooleanExpressionInputSchema,
    outputSchema: ValidateBooleanExpressionOutputSchema,
  },
  async input => {
    try {
      const {output} = await validateUserBooleanExpressionPrompt(input);
      if (!output) throw new Error('No output from validation AI');
      return output;
    } catch (error) {
      console.error('Validation flow failed:', error);
      
      // Fallback: Basic normalization check
      const normalize = (s: string) => s.replace(/\s/g, '').toUpperCase().replace(/^F=/, '').split('+').sort().join('+');
      const normalizedUser = normalize(input.userExpression);
      const normalizedIdeal = normalize(input.idealExpression);
      
      if (normalizedUser === normalizedIdeal) {
        return { isCorrect: true, feedback: "Direct match verified by fallback logic." };
      }
      
      return { 
        isCorrect: false, 
        feedback: "The logic engine encountered an error. Please double-check your Boolean syntax (e.g. ABC + BCD)." 
      };
    }
  }
);
