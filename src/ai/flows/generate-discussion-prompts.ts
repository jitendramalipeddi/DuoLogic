'use server';
/**
 * @fileOverview This file implements a Genkit flow to generate discussion prompts
 * when two users' boolean expressions do not match.
 *
 * - generateDiscussionPrompts - A function that handles the generation of discussion prompts.
 * - GenerateDiscussionPromptsInput - The input type for the generateDiscussionPrompts function.
 * - GenerateDiscussionPromptsOutput - The return type for the generateDiscussionPrompts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDiscussionPromptsInputSchema = z.object({
  expression1: z.string().describe("The first user's derived Boolean expression."),
  expression2: z.string().describe("The second user's derived Boolean expression."),
});
export type GenerateDiscussionPromptsInput = z.infer<typeof GenerateDiscussionPromptsInputSchema>;

const GenerateDiscussionPromptsOutputSchema = z.object({
  prompts: z.array(z.string()).describe('An array of discussion prompts to help users identify reasoning flaws.'),
});
export type GenerateDiscussionPromptsOutput = z.infer<typeof GenerateDiscussionPromptsOutputSchema>;

const FALLBACK_PROMPTS = [
  "Your expressions don't match. Compare your K-map groupings to see where you differ.",
  "Check your Boolean algebra simplification steps together.",
  "Look at the truth table again and verify your minterms.",
  "Discuss how you handled 'don't care' conditions if there were any."
];

const discussionPromptsPrompt = ai.definePrompt({
  name: 'discussionPromptsPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: GenerateDiscussionPromptsInputSchema},
  output: {schema: GenerateDiscussionPromptsOutputSchema},
  prompt: `You are an AI assistant designed to help two students collaboratively identify reasoning flaws in their Boolean expression simplification.

Two students have independently derived Boolean expressions for the same logic problem, but their expressions do not match.
Your task is to provide targeted questions and discussion prompts to guide them in finding where their reasoning diverged and reaching a consensus.

Do NOT provide the correct answer or directly correct their expressions. Instead, ask open-ended questions that encourage critical thinking.

Focus on aspects like:
- How they derived specific terms.
- Their K-map grouping strategies.
- Application of Boolean algebra identities.
- Differences in their initial interpretation of the truth table or problem statement.

Here are the two expressions:
User 1's expression: {{{expression1}}}
User 2's expression: {{{expression2}}}

Generate at least 3 distinct discussion prompts.`,
});

export async function generateDiscussionPrompts(
  input: GenerateDiscussionPromptsInput
): Promise<GenerateDiscussionPromptsOutput> {
  return generateDiscussionPromptsFlow(input);
}

const generateDiscussionPromptsFlow = ai.defineFlow(
  {
    name: 'generateDiscussionPromptsFlow',
    inputSchema: GenerateDiscussionPromptsInputSchema,
    outputSchema: GenerateDiscussionPromptsOutputSchema,
  },
  async input => {
    try {
      const {output} = await discussionPromptsPrompt(input);
      if (!output || !output.prompts) {
        return { prompts: FALLBACK_PROMPTS };
      }
      return output;
    } catch (error) {
      console.error('Discussion prompt generation failed:', error);
      return { prompts: FALLBACK_PROMPTS };
    }
  }
);
