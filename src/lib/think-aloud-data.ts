import { GameStage } from '@/hooks/useGameState';

export const STAGE_PROMPTS: Record<GameStage, string[]> = {
  intro: [
    "Discuss with your partner: What is the main goal of this logic problem?",
    "Verbalize your initial strategy for tackling the truth table.",
    "Talk through the input variables and what each one represents."
  ],
  truth_table: [
    "Describe your reasoning for each output you're filling in.",
    "Explain to your partner how the problem description leads to this specific row's value.",
    "Double-check a row together: why is the output 0 or 1?"
  ],
  kmap: [
    "Discuss and fill the K-map together: Which rows from the truth table correspond to which cells?",
    "Verbalize why you are placing a 0, 1, or X in each specific cell.",
    "Now that it's filled, explain your grouping strategy to your partner out loud. Why are these groups optimal?"
  ],
  equation: [
    "How did you derive this specific Boolean term? Explain it to your partner.",
    "Talk through your algebraic simplification process step-by-step.",
    "Compare your expressions: where exactly does your reasoning differ?"
  ],
  discussion: [
    "Read your partner's expression out loud and explain what you think it does.",
    "Discuss: What happens to the logic if we change one of these terms?",
    "Voice your uncertainty: is there a part of the simplification you're both unsure about?"
  ],
  simulator: [
    "Explain how this gate connection matches your Boolean expression.",
    "What is the role of this specific gate? Tell your partner your thoughts.",
    "Let's narrate the signal flow from input to output as we wire it."
  ],
  finished: [
    "Reflect out loud: What was the most challenging part of this collaboration?",
    "Explain to each other how you reached the final successful design."
  ]
};
