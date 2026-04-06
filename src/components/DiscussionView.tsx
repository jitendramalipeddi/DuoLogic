
"use client";

import React from 'react';
import { GameState } from '@/hooks/useGameState';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MessageSquare, Calculator, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DiscussionViewProps {
  state: GameState;
  updateState: (updates: Partial<GameState>) => void;
}

export default function DiscussionView({ state, updateState }: DiscussionViewProps) {
  const isEquationStage = state.stage === 'equation';
  const isDiscussionStage = state.stage === 'discussion';

  return (
    <div className="flex flex-col h-full space-y-8">
      <div className="flex flex-col items-center justify-center space-y-6 bg-slate-50/50 p-10 rounded-[2.5rem] border-2 border-slate-100 shadow-inner">
        <div className="flex items-center gap-3 text-primary">
          <Calculator className="w-8 h-8" />
          <h3 className="text-2xl font-black uppercase tracking-tighter">Shared Boolean Expression</h3>
        </div>
        
        <div className="w-full max-w-2xl relative">
          <Input 
            value={state.sharedExpression}
            onChange={(e) => updateState({ sharedExpression: e.target.value, expressionConfirmed: { 1: false, 2: false } })}
            placeholder="Derive your simplified logic here (e.g., ABC + ABD)"
            className="h-20 text-3xl font-mono text-center border-4 border-primary/20 focus-visible:border-primary rounded-3xl shadow-xl transition-all"
            disabled={state.expressionConfirmed[1] && state.expressionConfirmed[2]}
          />
          {state.sharedExpression && (
            <div className="absolute -bottom-10 left-0 right-0 flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${state.expressionConfirmed[1] ? 'bg-green-500' : 'bg-slate-300'}`} />
                <span className="text-[10px] font-black uppercase text-slate-500">P1 Agreement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${state.expressionConfirmed[2] ? 'bg-green-500' : 'bg-slate-300'}`} />
                <span className="text-[10px] font-black uppercase text-slate-500">P2 Agreement</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {isDiscussionStage && (
        <div className="flex-1 overflow-auto bg-white rounded-[2rem] border-4 border-primary/10 p-8 shadow-xl">
          <div className="flex items-center space-x-3 mb-6 text-primary border-b pb-4">
            <MessageSquare className="w-8 h-8" />
            <h3 className="text-2xl font-black uppercase tracking-tighter">AI Discussion Facilitator</h3>
          </div>
          <div className="space-y-6">
            {state.discussionPrompts.map((p, i) => (
              <div key={i} className="p-6 bg-muted/40 rounded-2xl border-l-[6px] border-primary text-lg font-bold italic text-slate-700 shadow-sm">
                "{p}"
              </div>
            ))}
          </div>
        </div>
      )}

      {isEquationStage && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-primary/5 rounded-[2rem] border-4 border-dashed border-primary/20">
          <div className="animate-bounce mb-6">
            <Calculator className="w-16 h-16 text-primary opacity-40" />
          </div>
          <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-3">Consensus Formation</h3>
          <p className="text-lg font-bold text-muted-foreground max-w-md">
            Collaboratively enter your derived expression above. Both partners must confirm the logic in their personal space to proceed.
          </p>
        </div>
      )}
    </div>
  );
}
