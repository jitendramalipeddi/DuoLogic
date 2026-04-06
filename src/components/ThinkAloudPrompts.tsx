"use client";

import React, { useState, useEffect } from 'react';
import { GameStage } from '@/hooks/useGameState';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, MessageSquareQuote, Zap } from 'lucide-react';

interface ThinkAloudPromptsProps {
  stage: GameStage;
}

const STAGE_PROMPTS: Record<GameStage, string[]> = {
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
    "Explain your grouping strategy to your partner out loud.",
    "Why is this group a power of two? Tell your partner your reasoning.",
    "Describe the adjacency you see in the map before you click."
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

export default function ThinkAloudPrompts({ stage }: ThinkAloudPromptsProps) {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const prompts = STAGE_PROMPTS[stage] || [];

  useEffect(() => {
    setCurrentPromptIndex(0);
    const interval = setInterval(() => {
      setCurrentPromptIndex((prev) => (prev + 1) % (prompts.length || 1));
    }, 15000); // Rotate prompts every 15 seconds
    return () => clearInterval(interval);
  }, [stage, prompts.length]);

  if (prompts.length === 0) return null;

  return (
    <Card className="bg-primary/5 border-primary/20 shadow-sm animate-in fade-in slide-in-from-top-1 duration-500">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <MessageSquareQuote className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">
              Think Aloud Protocol
            </span>
            <Zap className="w-3 h-3 text-amber-500 fill-current animate-pulse" />
          </div>
          <p className="text-sm font-bold text-slate-800 italic leading-relaxed">
            "{prompts[currentPromptIndex]}"
          </p>
        </div>
        <div className="text-[10px] font-bold text-slate-400 tabular-nums">
          {currentPromptIndex + 1}/{prompts.length}
        </div>
      </CardContent>
    </Card>
  );
}
