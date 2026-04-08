
"use client";

import React from 'react';
import { GameState } from '@/hooks/useGameState';
import TruthTableGrid from './TruthTableGrid';
import KMapGrid from './KMapGrid';
import CircuitCanvas from './CircuitCanvas';
import DiscussionView from './DiscussionView';
import ThinkAloudPrompts from './ThinkAloudPrompts';
import { CheckCircle2, MessageSquare, ClipboardList, Grid3X3, Layers, Calculator, PlayCircle, Info, Beaker } from 'lucide-react';

interface CommonSpaceProps {
  state: GameState;
  updateState: (updates: Partial<GameState>) => void;
  markPromptDone: (activityId: string, index: number) => void;
  logEvent: (type: string, data: any) => void;
}

export default function CommonSpace({ state, updateState, markPromptDone, logEvent }: CommonSpaceProps) {
  
  const handleAllPromptsFinished = (activityId: string) => {
    // Handle stage transitions after discussions are done
    if (activityId === 'intro_done') {
      updateState({ stage: 'truth_table' });
    } else if (activityId === 'truth_table_done') {
      updateState({ stage: 'kmap', kmapSubStage: 'fill' });
    } else if (activityId === 'kmap_fill_done') {
      updateState({ kmapSubStage: 'group' });
    } else if (activityId === 'kmap_group_done') {
      updateState({ stage: 'equation' });
    } else if (activityId === 'equation_done') {
      updateState({ stage: 'simulator' });
    } else if (activityId === 'simulator_done') {
      updateState({ stage: 'finished' });
    }
  };

  return (
    <div className="h-full w-full bg-white rounded-2xl shadow-2xl border border-border p-8 flex flex-col overflow-hidden relative">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Beaker className="w-7 h-7" />
          </div>
          <h2 className="text-3xl font-headline font-black text-primary flex items-center gap-3 uppercase tracking-tighter">
            LogicLab Shared Laboratory
          </h2>
        </div>
      </div>

      <ThinkAloudPrompts 
        state={state}
        onMarkDone={markPromptDone}
        onAllFinished={handleAllPromptsFinished}
      />

      <div className="flex-1 overflow-hidden">
        {state.stage === 'onboarding' && (
          <div className="flex flex-col items-center py-4 px-8 w-full space-y-12 h-full justify-center">
            <div className="text-center space-y-4">
              <h3 className="text-6xl font-black text-slate-900 tracking-tighter uppercase">Welcome to LogicLab</h3>
              <p className="text-2xl font-bold text-muted-foreground italic max-w-4xl">
                "Please follow the instructions for your collaborative mission."
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4 w-full max-w-7xl">
              {[
                { icon: MessageSquare, title: "1. Discussion", desc: "Follow the instructions on screen." },
                { icon: ClipboardList, title: "2. The Problem", desc: "Read your logic challenge carefully." },
                { icon: Grid3X3, title: "3. Truth Table", desc: "Map requirements to binary outputs." },
                { icon: Layers, title: "4. K-Map Filling", desc: "Transfer data to the shared grid." },
                { icon: CheckCircle2, title: "5. Grouping", desc: "Find optimal pairs of 1s together." },
                { icon: Calculator, title: "6. Equation", desc: "Derive the simplified expression." },
                { icon: PlayCircle, title: "7. Simulation", desc: "Build and test the final circuit." }
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center text-center p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white mb-4">
                    <step.icon className="w-7 h-7" />
                  </div>
                  <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm mb-2">{step.title}</h4>
                  <p className="text-xs font-bold text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.stage === 'intro' && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-4xl mx-auto space-y-8">
            <h3 className="text-5xl font-headline font-black uppercase tracking-tighter">Mission Objective</h3>
            <div className="p-16 bg-muted/30 rounded-[4rem] border-4 border-dashed border-primary/20 shadow-inner relative w-full">
              <p className="text-4xl font-bold text-slate-800 leading-relaxed italic">
                "{state.problem?.description}"
              </p>
            </div>
          </div>
        )}

        {state.stage === 'truth_table' && (
          <div className="h-full p-4">
            <TruthTableGrid state={state} />
          </div>
        )}

        {state.stage === 'kmap' && (
          <div className="h-full flex gap-8">
            <div className="w-1/3 flex flex-col space-y-4">
              <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs px-2">
                <ClipboardList className="w-4 h-4" /> Reference: Truth Table
              </div>
              <div className="flex-1 border rounded-3xl overflow-hidden shadow-inner bg-slate-50/50">
                <TruthTableGrid state={state} compact />
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center bg-slate-50/30 rounded-[3rem] border-2 border-slate-100">
              <KMapGrid state={state} updateState={updateState} logEvent={logEvent} />
            </div>
          </div>
        )}

        {(state.stage === 'equation' || state.stage === 'discussion') && (
           <DiscussionView state={state} updateState={updateState} />
        )}

        {state.stage === 'simulator' && (
          <div className="h-full flex flex-col space-y-4">
            <div className="bg-primary/5 border-2 border-primary/10 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calculator className="w-6 h-6 text-primary" />
                <span className="text-xs font-black uppercase tracking-widest text-primary/60">Blueprint Expression:</span>
              </div>
              <div className="text-2xl font-mono font-black text-primary tracking-wider">
                {state.sharedExpression}
              </div>
              <div className="w-24"></div>
            </div>
            <div className="flex-1">
              <CircuitCanvas state={state} updateState={updateState} logEvent={logEvent} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
