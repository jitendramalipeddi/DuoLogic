'use server';
/**
 * @fileOverview This file implements a Genkit flow to validate a user's Boolean expression
 * against an ideal solution, providing constructive feedback if they are not logically equivalent.
 *
 * - validateUserBooleanExpression - The main function to call for validating expressions.
 * - ValidateBooleanExpressionInput - The input type for the validation.
 * - ValidateBooleanExpressionOutput - The output type after validation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateBooleanExpressionInputSchema = z.object({
  userExpression: z
    .string()
    .describe("The Boolean expression provided by the user."),
  idealExpression: z
    .string()
    .describe("The correct or ideal Boolean expression to compare against."),
  variables: z
    .array(z.string())
    .describe("An array of variable names (e.g., ['A', 'B', 'C', 'D']) used in the expressions."),
});
export type ValidateBooleanExpressionInput = z.infer<
  typeof ValidateBooleanExpressionInputSchema
>;

const ValidateBooleanExpressionOutputSchema = z.object({
  isCorrect: z
    .boolean()
    .describe("True if the user's expression is logically equivalent to the ideal expression, false otherwise."),
  feedback: z
    .string()
    .describe(
      "Constructive feedback explaining any discrepancies if the expressions are not equivalent."
    ),
});
export type ValidateBooleanExpressionOutput = z.infer<
  typeof ValidateBooleanExpressionOutputSchema
>;

const validateUserBooleanExpressionPrompt = ai.definePrompt({
  name: 'validateUserBooleanExpressionPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: ValidateBooleanExpressionInputSchema},
  output: {schema: ValidateBooleanExpressionOutputSchema},
  prompt: `You are an expert in Boolean algebra and digital logic. Your task is to compare two Boolean expressions and determine if they are logically equivalent. If they are not, you must explain why and provide constructive feedback.

Variables used in the expressions: {{{variables}}}

User's Expression: {{{userExpression}}}
Ideal Expression: {{{idealExpression}}}

Determine if the User's Expression is logically equivalent to the Ideal Expression. Focus on logical equivalence, not just syntactic match. For example, 'A + B' and 'B + A' are logically equivalent.

If they are logically equivalent, set 'isCorrect' to true and 'feedback' to an empty string. You may also provide positive reinforcement if you wish.
If they are NOT logically equivalent, set 'isCorrect' to false and provide detailed, constructive feedback in the 'feedback' field. The feedback should explain the discrepancy, point out the logical error, and offer guidance on how to correct the user's expression or simplify it to match the ideal. Do not just state it's wrong; explain the logical error with an example or common simplification rules.
`,
});

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

export async function validateUserBooleanExpression(
  input: ValidateBooleanExpressionInput
): Promise<ValidateBooleanExpressionOutput> {
  return validateUserBooleanExpressionFlow(input);
}
