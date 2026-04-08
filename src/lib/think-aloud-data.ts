
/**
 * @fileOverview This file contains the prompts for the Collaborative Think Aloud Protocol.
 * Prompts are organized by activity IDs to trigger at specific milestones.
 */

export const STAGE_PROMPTS: Record<string, string[]> = {
  onboarding: [
    "Welcome! Take a moment to read through the 7 steps of our mission together.",
    "Discuss with your peer: Which of these steps do you think will be the most challenging?",
    "Confirm that you've both understood the collaborative layout before we start."
  ],
  intro_done: [
    "Discuss with your partner: What is the main goal of this logic problem?",
    "Verbalize your initial strategy for tackling the truth table.",
    "Talk through the input variables and what each one represents."
  ],
  truth_table_done: [
    "Describe your reasoning for each output you've filled in.",
    "Explain to your partner how the problem description led to this specific row's value.",
    "Double-check a row together: why is the output 0 or 1?"
  ],
  kmap_fill_done: [
    "Discuss the filling process: Which rows from the truth table correspond to which cells?",
    "Verbalize why you placed a 0, 1, or X in each specific cell."
  ],
  kmap_group_done: [
    "Explain your grouping strategy to your partner out loud. Why are these groups optimal?",
    "Talk through any overlapping or wrapping groups you identified together."
  ],
  equation_done: [
    "How did you derive this specific Boolean term? Explain it to your partner.",
    "Talk through your algebraic simplification process step-by-step.",
    "Compare your expressions: where exactly did your reasoning differ?"
  ],
  simulator_done: [
    "Reflect on your final circuit: How do these gate connections match your Boolean expression?",
    "Explain the signal flow from input to output as you wired it."
  ]
};
