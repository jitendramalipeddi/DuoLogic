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
  prompt: `Compare these Boolean expressions for variables {{{variables}}}.
User: {{{userExpression}}}
Ideal: {{{idealExpression}}}

Determine if they are logically equivalent. If not, explain why.`,
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
    const {output} = await validateUserBooleanExpressionPrompt(input);
    return output!;
  }
);
