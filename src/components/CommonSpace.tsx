
"use client";

import React from 'react';
import { GameState } from '@/hooks/useGameState';
import TruthTableGrid from './TruthTableGrid';
import KMapGrid from './KMapGrid';
import CircuitCanvas from './CircuitCanvas';
import DiscussionView from './DiscussionView';
import ThinkAloudPrompts from './ThinkAloudPrompts';
import { CheckCircle2, MessageSquare, ClipboardList, Grid3X3, Layers, Calculator, PlayCircle, Info } from 'lucide-react';

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
        <h2 className="text-2xl font-headline font-bold text-primary flex items-center gap-2 uppercase tracking-tighter">
          Shared Laboratory
        </h2>
        <div className="px-4 py-1 bg-accent/10 rounded-full text-accent font-bold uppercase tracking-widest text-xs">
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
        {state.stage === 'onboarding' && (
          <div className="flex flex-col items-center py-4 px-8 max-w-3xl mx-auto space-y-8 h-full overflow-y-auto">
            <div className="text-center space-y-2">
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Welcome to DuoLogic!</h3>
              <p className="text-lg font-bold text-muted-foreground italic">"Here are the steps we will take in this intervention..."</p>
            </div>

            <div className="grid grid-cols-1 gap-4 w-full">
              {[
                { icon: MessageSquare, title: "1. Discussion Protocol", desc: "Please follow the instructions that are there on the top of the screen about discussion." },
                { icon: ClipboardList, title: "2. Reading the Problem", desc: "Read your specific logic challenge carefully and identify the input requirements." },
                { icon: Grid3X3, title: "3. Truth Table Phase", desc: "Filling the truth table as per the requirement." },
                { icon: Layers, title: "4. K-Map Phase", desc: "Fill the kmap as per the truth table." },
                { icon: CheckCircle2, title: "5. Grouping Phase", desc: "Grouping the 1's in the kmap grid to simplify logic." },
                { icon: Calculator, title: "6. Derive Equation", desc: "Come up with the Boolean expression from your groups." },
                { icon: PlayCircle, title: "7. Circuit Simulation", desc: "Simulate the expression by building the circuit, and Finish." }
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-primary/20 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shrink-0 shadow-lg">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm">{step.title}</h4>
                    <p className="text-xs font-bold text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 text-center">
              <p className="text-sm font-black text-primary uppercase tracking-widest animate-pulse flex items-center gap-2">
                <Info className="w-4 h-4" />
                Waiting for both partners to confirm they are ready...
              </p>
            </div>
          </div>
        )}

        {state.stage === 'intro' && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto space-y-6">
            <h3 className="text-3xl font-headline font-black uppercase tracking-tighter">Current Mission Goal</h3>
            <div className="p-8 bg-muted/30 rounded-3xl border-4 border-dashed border-primary/20 shadow-inner relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-[10px] font-black rounded-full uppercase tracking-widest">Logic Requirement</div>
              <p className="text-2xl font-bold text-slate-800 leading-relaxed italic">
                "{state.problem?.description}"
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Input Variables:</span>
              <div className="flex gap-2">
                {state.problem?.variables.map(v => (
                  <span key={v} className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-mono text-lg font-black border-2 border-primary/20">
                    {v}
                  </span>
                ))}
              </div>
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
