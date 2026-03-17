"use client";

import React, { useState, useEffect } from 'react';
import CommonSpace from '@/components/CommonSpace';
import UserTerritory from '@/components/UserTerritory';
import { useGameState } from '@/hooks/useGameState';
import { generateInitialLogicProblem } from '@/ai/flows/generate-initial-logic-problem';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { ChevronLeft, HelpCircle, FileText } from 'lucide-react';

export default function DuoLogicApp() {
  const { 
    state, 
    updateState, 
    goBack,
    logEvent 
  } = useGameState();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      if (!state.problem) {
        try {
          const problem = await generateInitialLogicProblem();
          updateState({ problem, stage: 'intro' });
        } catch (e) {
          console.error("Failed to load problem", e);
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center text-primary font-headline text-2xl animate-pulse">
        Initializing DuoLogic...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b bg-white flex items-center justify-between px-6 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goBack} 
            disabled={state.stage === 'intro'}
            className="text-muted-foreground"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-primary font-headline tracking-tight">DuoLogic</h1>
        </div>

        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FileText className="w-4 h-4" />
                View Problem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Current Objective</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-lg leading-relaxed">{state.problem?.description}</p>
                <div className="flex gap-2 flex-wrap">
                  {state.problem?.variables.map(v => (
                    <span key={v} className="px-2 py-1 bg-primary/10 text-primary rounded font-mono text-sm font-bold">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Half: Common Space */}
        <div className="h-1/2 w-full p-4 overflow-hidden">
          <CommonSpace state={state} updateState={updateState} logEvent={logEvent} />
        </div>

        {/* Bottom Half: User Territories */}
        <div className="h-1/2 w-full flex border-t bg-white">
          <UserTerritory 
            userId={1} 
            state={state} 
            updateState={updateState} 
            logEvent={logEvent} 
            className="user1-zone w-1/2 p-4"
          />
          <UserTerritory 
            userId={2} 
            state={state} 
            updateState={updateState} 
            logEvent={logEvent} 
            className="user2-zone w-1/2 p-4"
          />
        </div>
      </div>
    </div>
  );
}
