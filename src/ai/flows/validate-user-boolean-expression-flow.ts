'use server';
/**
 * @fileOverview Validates user boolean expressions against an ideal solution.
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

Guidelines:
1. Ignore common prefixes like "F =", "F(A,B,C,D) =", or "Output =".
2. Treat '+' as OR, juxtaposition or '.' as AND, and symbols like ' (apostrophe) or ! as NOT.
3. Expressions are equivalent if they produce the same truth table.
4. If the user expression is a valid simplification (even if it uses different identities than the ideal), it should be marked as correct.

If they are equivalent, set isCorrect to true.
If they are NOT equivalent, provide a concise explanation of which minterm/row might be wrong or what logic is missing.`,
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
      // Fallback: If AI fails, do a normalized string comparison for the "3 or more ON" case
      const normalizedUser = input.userExpression.replace(/\s/g, '').toUpperCase();
      const normalizedIdeal = input.idealExpression.replace(/\s/g, '').toUpperCase().replace(/^F=/, '');
      
      if (normalizedUser === normalizedIdeal) {
        return { isCorrect: true, feedback: "Direct match verified by fallback." };
      }
      
      return { 
        isCorrect: false, 
        feedback: "The logic engine encountered an error. Please double-check your syntax (e.g. ABC + BCD)." 
      };
    }
  }
);
