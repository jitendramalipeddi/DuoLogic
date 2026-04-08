"use client";

import React, { useState, useEffect } from 'react';
import { GameStage } from '@/hooks/useGameState';
import { MessageSquareQuote, Zap, CheckCircle2, ChevronRight, MessageCircle } from 'lucide-react';
import { STAGE_PROMPTS } from '@/lib/think-aloud-data';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface ThinkAloudPromptsProps {
  stage: GameStage;
  completedIndices: number[];
  onMarkDone: (index: number) => void;
}

export default function ThinkAloudPrompts({ stage, completedIndices, onMarkDone }: ThinkAloudPromptsProps) {
  const prompts = STAGE_PROMPTS[stage] || [];
  const [currentPromptIndex, setCurrentPromptIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  // Trigger modal when stage changes or a prompt is completed
  useEffect(() => {
    const nextUncompleted = prompts.findIndex((_, i) => !completedIndices.includes(i));
    if (nextUncompleted !== -1) {
      setCurrentPromptIndex(nextUncompleted);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [stage, prompts.length, completedIndices]);

  if (prompts.length === 0 || currentPromptIndex === -1) return null;

  const handleConfirm = () => {
    onMarkDone(currentPromptIndex);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Prevent manual closing if prompts are pending
      if (completedIndices.length < prompts.length) {
        setIsOpen(true);
      } else {
        setIsOpen(open);
      }
    }}>
      <DialogContent className="max-w-3xl rounded-[3rem] p-10 border-4 border-primary shadow-2xl bg-white">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-4 text-primary">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-7 h-7" />
            </div>
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter">
              Discussion Protocol
            </DialogTitle>
          </div>
          <DialogDescription className="text-lg font-bold text-slate-600">
            Please talk to your peer about what you are thinking.
          </DialogDescription>
        </DialogHeader>

        <div className="py-8">
          <div className="bg-slate-50 rounded-[2.5rem] p-10 border-2 border-slate-100 relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
            <div className="flex flex-col items-center gap-8 text-center">
              <MessageSquareQuote className="w-16 h-16 text-primary/20" />
              <p className="text-3xl md:text-4xl font-black italic leading-tight text-slate-800 tracking-tight">
                "{prompts[currentPromptIndex]}"
              </p>
              
              <div className="flex items-center gap-4 bg-white px-8 py-4 rounded-2xl border-2 border-slate-200 shadow-sm">
                <Checkbox 
                  id={`prompt-${currentPromptIndex}`} 
                  checked={false} 
                  onCheckedChange={handleConfirm}
                  className="w-10 h-10 rounded-xl border-4 border-primary data-[state=checked]:bg-primary"
                />
                <label 
                  htmlFor={`prompt-${currentPromptIndex}`}
                  className="text-xl font-black uppercase text-primary tracking-widest cursor-pointer"
                >
                  Mark as Discussed
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <div className="flex gap-2">
            {prompts.map((_, i) => (
              <div 
                key={i} 
                className={`w-12 h-2 rounded-full transition-all ${
                  i === currentPromptIndex ? 'bg-primary w-24' : 
                  completedIndices.includes(i) ? 'bg-green-400' : 'bg-slate-200'
                }`} 
              />
            ))}
          </div>
          <span className="text-sm font-black text-slate-400 uppercase tracking-widest">
            {completedIndices.length + 1} of {prompts.length} Discussion Points
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
