
"use client";

import React, { useState, useEffect } from 'react';
import { GameStage, GameState } from '@/hooks/useGameState';
import { MessageCircle, MessageSquareQuote, CheckCircle2 } from 'lucide-react';
import { STAGE_PROMPTS } from '@/lib/think-aloud-data';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ThinkAloudPromptsProps {
  state: GameState;
  onMarkDone: (activityId: string, index: number) => void;
  onAllFinished?: (activityId: string) => void;
}

export default function ThinkAloudPrompts({ state, onMarkDone, onAllFinished }: ThinkAloudPromptsProps) {
  const [activeActivity, setActiveActivity] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Determine which activity needs prompts based on game state
  useEffect(() => {
    let targetActivity: string | null = null;

    if (state.stage === 'onboarding') {
      targetActivity = 'onboarding';
    } else if (state.activityCompleted.intro && !(state.completedPrompts.intro_done?.length === STAGE_PROMPTS.intro_done.length)) {
      targetActivity = 'intro_done';
    } else if (state.activityCompleted.truth_table && !(state.completedPrompts.truth_table_done?.length === STAGE_PROMPTS.truth_table_done.length)) {
      targetActivity = 'truth_table_done';
    } else if (state.activityCompleted.kmap_fill && !(state.completedPrompts.kmap_fill_done?.length === STAGE_PROMPTS.kmap_fill_done.length)) {
      targetActivity = 'kmap_fill_done';
    } else if (state.activityCompleted.kmap_group && !(state.completedPrompts.kmap_group_done?.length === STAGE_PROMPTS.kmap_group_done.length)) {
      targetActivity = 'kmap_group_done';
    } else if (state.activityCompleted.equation && !(state.completedPrompts.equation_done?.length === STAGE_PROMPTS.equation_done.length)) {
      targetActivity = 'equation_done';
    } else if (state.activityCompleted.simulator && !(state.completedPrompts.simulator_done?.length === STAGE_PROMPTS.simulator_done.length)) {
      targetActivity = 'simulator_done';
    }

    if (targetActivity) {
      setActiveActivity(targetActivity);
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setActiveActivity(null);
    }
  }, [state.stage, state.activityCompleted, state.completedPrompts]);

  if (!activeActivity) return null;

  const prompts = STAGE_PROMPTS[activeActivity] || [];
  const completedIndices = state.completedPrompts[activeActivity] || [];
  const nextIndex = prompts.findIndex((_, i) => !completedIndices.includes(i));

  if (nextIndex === -1) return null;

  const handleConfirm = () => {
    onMarkDone(activeActivity, nextIndex);
    
    // If this was the last prompt, trigger finish callback
    if (completedIndices.length + 1 === prompts.length && onAllFinished) {
      onAllFinished(activeActivity);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Prevent manual closing
      if (completedIndices.length < prompts.length) {
        setIsOpen(true);
      } else {
        setIsOpen(open);
      }
    }}>
      <DialogContent className="max-w-4xl rounded-[3rem] p-12 border-4 border-primary shadow-2xl bg-white">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-4 text-primary justify-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-7 h-7" />
            </div>
            <DialogTitle className="text-4xl font-black uppercase tracking-tighter">
              Discussion Protocol
            </DialogTitle>
          </div>
          <DialogDescription className="text-xl font-bold text-slate-600 text-center">
            Please talk to your peer about what you are thinking
          </DialogDescription>
        </DialogHeader>

        <div className="py-10">
          <div className="bg-slate-50 rounded-[3rem] p-12 border-2 border-slate-100 relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
            <MessageSquareQuote className="w-20 h-20 text-primary/10 mb-8" />
            <p className="text-4xl font-black italic leading-tight text-slate-800 tracking-tight text-center max-w-2xl mb-12">
              "{prompts[nextIndex]}"
            </p>
            
            <div className="flex items-center gap-6 bg-white px-12 py-6 rounded-3xl border-2 border-slate-200 shadow-lg hover:border-primary transition-all active:scale-95 cursor-pointer" onClick={handleConfirm}>
              <Checkbox 
                id={`prompt-${nextIndex}`} 
                checked={false} 
                className="w-12 h-12 rounded-2xl border-4 border-primary data-[state=checked]:bg-primary"
              />
              <label 
                htmlFor={`prompt-${nextIndex}`}
                className="text-2xl font-black uppercase text-primary tracking-widest cursor-pointer"
              >
                Mark as Discussed
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-slate-100">
          <div className="flex gap-3">
            {prompts.map((_, i) => (
              <div 
                key={i} 
                className={`w-16 h-3 rounded-full transition-all ${
                  i === nextIndex ? 'bg-primary w-24' : 
                  completedIndices.includes(i) ? 'bg-green-400' : 'bg-slate-200'
                }`} 
              />
            ))}
          </div>
          <span className="text-base font-black text-slate-400 uppercase tracking-widest">
            Prompt {completedIndices.length + 1} of {prompts.length}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
