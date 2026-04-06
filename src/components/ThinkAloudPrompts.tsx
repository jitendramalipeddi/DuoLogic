
"use client";

import React, { useState, useEffect } from 'react';
import { GameStage } from '@/hooks/useGameState';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquareQuote, Zap, CheckCircle2 } from 'lucide-react';
import { STAGE_PROMPTS } from '@/lib/think-aloud-data';
import { Button } from '@/components/ui/button';

interface ThinkAloudPromptsProps {
  stage: GameStage;
  completedIndices: number[];
  onMarkDone: (index: number) => void;
}

export default function ThinkAloudPrompts({ stage, completedIndices, onMarkDone }: ThinkAloudPromptsProps) {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const prompts = STAGE_PROMPTS[stage] || [];

  // Find the first uncompleted prompt or stay on the current if not completed
  useEffect(() => {
    const firstUncompleted = prompts.findIndex((_, i) => !completedIndices.includes(i));
    if (firstUncompleted !== -1) {
      setCurrentPromptIndex(firstUncompleted);
    }
  }, [stage, prompts.length, completedIndices]);

  if (prompts.length === 0) return null;

  const handleNext = () => {
    setCurrentPromptIndex((prev) => (prev + 1) % prompts.length);
  };

  const isCurrentDone = completedIndices.includes(currentPromptIndex);
  const allDone = completedIndices.length === prompts.length;

  return (
    <Card className={`transition-all duration-500 shadow-md ${allDone ? 'bg-green-50 border-green-200' : 'bg-primary/5 border-primary/20'}`}>
      <CardContent className="p-6 flex flex-col gap-4">
        <div className="flex items-center gap-6">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${allDone ? 'bg-green-100' : 'bg-primary/10'}`}>
            <MessageSquareQuote className={`w-7 h-7 ${allDone ? 'text-green-600' : 'text-primary'}`} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black uppercase tracking-widest ${allDone ? 'text-green-600' : 'text-primary/60'}`}>
                  Please talk to your peer about what you are thinking
                </span>
                {!allDone && <Zap className="w-4 h-4 text-amber-500 fill-current animate-pulse" />}
              </div>
              <div className="text-[10px] font-bold text-slate-400 tabular-nums">
                {completedIndices.length}/{prompts.length} DISCUSSION POINTS COMPLETED
              </div>
            </div>
            <p className={`text-lg md:text-xl font-bold italic leading-relaxed ${isCurrentDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
              "{prompts[currentPromptIndex]}"
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          {!isCurrentDone ? (
            <Button 
              size="lg" 
              onClick={() => onMarkDone(currentPromptIndex)}
              className="bg-primary hover:bg-primary/90 text-xs font-black h-12 px-8 rounded-xl gap-2 shadow-lg"
            >
              <CheckCircle2 className="w-5 h-5" /> MARK AS DISCUSSED
            </Button>
          ) : !allDone ? (
            <Button 
              size="lg" 
              variant="outline"
              onClick={handleNext}
              className="text-xs font-black h-12 px-8 rounded-xl border-2 shadow-sm"
            >
              NEXT PROMPT
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-green-700 font-black text-xs uppercase tracking-widest bg-green-100/50 px-6 py-3 rounded-xl border border-green-200">
              <CheckCircle2 className="w-5 h-5" /> All Discussions Complete for this Stage
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
