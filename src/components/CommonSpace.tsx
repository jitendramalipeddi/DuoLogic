"use client";

import React from 'react';
import { GameState } from '@/hooks/useGameState';
import TruthTableGrid from './TruthTableGrid';
import KMapGrid from './KMapGrid';
import CircuitCanvas from './CircuitCanvas';
import DiscussionView from './DiscussionView';
import ThinkAloudPrompts from './ThinkAloudPrompts';

interface CommonSpaceProps {
  state: GameState;
  updateState: (updates: Partial<GameState>) => void;
  markPromptDone: (stage: any, index: number) => void;
  logEvent: (type: string, data: any) => void;
}

export default function CommonSpace({ state, updateState, markPromptDone, logEvent }: CommonSpaceProps) {
  return (
    <div className="h-full w-full bg-white rounded-xl shadow-2xl border border-border p-6 flex flex-col overflow-hidden">
      <div className="mb-4 flex items-center justify-between border-b pb-2">
        <h2 className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
          COMMON SPACE
        </h2>
        <div className="px-4 py-1 bg-accent/10 rounded-full text-accent font-bold uppercase tracking-widest text-sm">
          Stage: {state.stage.replace('_', ' ')}
        </div>
      </div>

      <div className="mb-4">
        <ThinkAloudPrompts 
          stage={state.stage} 
          completedIndices={state.completedPrompts[state.stage] || []}
          onMarkDone={(index) => markPromptDone(state.stage, index)}
        />
      </div>

      <div className="flex-1 overflow-auto">
        {state.stage === 'intro' && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto space-y-6">
            <h3 className="text-3xl font-headline font-semibold">Project Goal</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {state.problem?.description}
            </p>
            <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-primary/30">
              <span className="font-mono font-bold text-primary">Variables: {state.problem?.variables.join(', ')}</span>
            </div>
          </div>
        )}

        {state.stage === 'truth_table' && (
          <div className="h-full">
            <TruthTableGrid state={state} />
          </div>
        )}

        {state.stage === 'kmap' && (
          <div className="h-full flex items-center justify-center">
            <KMapGrid state={state} updateState={updateState} logEvent={logEvent} />
          </div>
        )}

        {(state.stage === 'equation' || state.stage === 'discussion') && (
           <DiscussionView state={state} />
        )}

        {state.stage === 'simulator' && (
          <div className="h-full">
            <CircuitCanvas state={state} updateState={updateState} logEvent={logEvent} />
          </div>
        )}
      </div>
    </div>
  );
}
