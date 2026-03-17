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
import { ChevronLeft, FileText, Download, CheckCircle, RefreshCcw } from 'lucide-react';

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
          logEvent('problem_initialized', { description: problem.description });
        } catch (e) {
          console.error("Failed to load problem", e);
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  const downloadLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.logs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `duologic_session_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    logEvent('logs_downloaded', { count: state.logs.length });
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center text-primary font-headline text-2xl animate-pulse">
        Initializing DuoLogic...
      </div>
    );
  }

  if (state.stage === 'finished') {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-white p-12 text-center space-y-8">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold font-headline text-slate-900">Task Completed!</h1>
        <p className="text-xl text-muted-foreground max-w-lg">
          Excellent collaboration. You have successfully designed and verified the digital logic circuit.
        </p>
        <div className="flex gap-4">
          <Button size="lg" onClick={downloadLogs} className="gap-2 px-8">
            <Download className="w-5 h-5" /> Download Session Logs
          </Button>
          <Button variant="outline" size="lg" onClick={() => window.location.reload()} className="gap-2 px-8">
            <RefreshCcw className="w-5 h-5" /> Start New Session
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
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
          <Button variant="ghost" size="sm" onClick={downloadLogs} className="text-muted-foreground">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-1/2 w-full p-4 overflow-hidden">
          <CommonSpace state={state} updateState={updateState} logEvent={logEvent} />
        </div>

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
