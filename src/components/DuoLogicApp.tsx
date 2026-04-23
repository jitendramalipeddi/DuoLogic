"use client";

import React, { useState, useEffect } from 'react';
import CommonSpace from '@/components/CommonSpace';
import UserTerritory from '@/components/UserTerritory';
import HintSystem from '@/components/HintSystem';
import { useGameState } from '@/hooks/useGameState';
import { generateInitialLogicProblem } from '@/ai/flows/generate-initial-logic-problem';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, FileText, Download, CheckCircle, RefreshCcw, AlertTriangle, Loader2, PartyPopper } from 'lucide-react';

export default function LogicLabApp() {
  const { 
    state, 
    updateState, 
    goBack,
    goForward,
    logEvent,
    markPromptDone
  } = useGameState();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function init() {
      if (!state.problem) {
        try {
          const problem = await generateInitialLogicProblem();
          updateState({ problem });
          logEvent('problem_initialized', { description: problem.description });
        } catch (e: any) {
          console.error("Failed to load problem", e);
          const message = "The AI laboratory is currently resetting. Please try again in a moment.";
          setError(message);
          toast({
            variant: "destructive",
            title: "Initialization Error",
            description: message,
          });
        }
      }
      setLoading(false);
    }
    init();
  }, [state.problem, updateState, logEvent, toast]);

  const downloadLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.logs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `logiclab_session_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    logEvent('logs_downloaded', { count: state.logs.length });
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <div className="text-primary font-black text-2xl tracking-tighter">
          SYNCHRONIZING LABORATORY...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 p-6 text-center space-y-4">
        <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mb-2">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-3xl font-black tracking-tight">System Initialization Error</h2>
        <p className="text-muted-foreground max-w-md font-medium">{error}</p>
        <Button onClick={() => window.location.reload()} size="lg" className="gap-2 rounded-xl font-bold px-8">
          <RefreshCcw className="w-4 h-4" /> RESTART SESSION
        </Button>
      </div>
    );
  }

  if (state.stage === 'finished') {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-white p-12 text-center space-y-8 animate-in fade-in duration-1000">
        <div className="w-32 h-32 bg-green-100 rounded-[3rem] flex items-center justify-center mb-4 animate-bounce">
          <PartyPopper className="w-16 h-16 text-green-600" />
        </div>
        <div className="space-y-4">
          <h1 className="text-6xl font-black tracking-tighter text-slate-900 uppercase">MISSION COMPLETE!</h1>
          <p className="text-4xl font-black text-primary max-w-3xl mx-auto leading-tight italic">
            "The task is successfully completed. Congrats!"
          </p>
        </div>
        <div className="flex gap-6 mt-8">
          <Button size="lg" onClick={downloadLogs} className="h-20 gap-3 px-12 rounded-[2rem] font-black text-xl bg-slate-900 shadow-2xl hover:scale-105 transition-transform">
            <Download className="w-7 h-7" /> DOWNLOAD LOGS
          </Button>
          <Button variant="outline" size="lg" onClick={() => window.location.reload()} className="h-20 gap-3 px-12 rounded-[2rem] font-black text-xl border-4 hover:bg-slate-50 hover:scale-105 transition-transform">
            <RefreshCcw className="w-7 h-7" /> NEW TASK
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      <header className="h-16 border-b bg-white flex items-center justify-between px-8 z-50 shadow-sm shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black">LL</div>
            <h1 className="text-2xl font-black text-primary tracking-tighter">LogicLab</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goBack} 
              disabled={state.stage === 'onboarding'}
              className="text-slate-400 font-bold hover:text-primary transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              BACK
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goForward} 
              disabled={state.stageFuture.length === 0}
              className="text-slate-400 font-bold hover:text-primary transition-colors"
            >
              FORWARD
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl font-black px-6 bg-primary text-white hover:bg-primary/90 shadow-md transition-all active:scale-95">
                <FileText className="w-5 h-5" />
                VIEW TASK
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl rounded-3xl p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Current Objective</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
                  <p className="text-xl font-bold leading-relaxed text-slate-800 italic">"{state.problem?.description || 'Loading task...'}"</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Available Inputs</p>
                  <div className="flex gap-3">
                    {(state.problem?.variables || ['A', 'B', 'C', 'D']).map(v => (
                      <span key={v} className="px-5 py-3 bg-primary/10 text-primary rounded-2xl font-mono text-xl font-black border-2 border-primary/20">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" onClick={downloadLogs} className="text-slate-300 hover:text-slate-900">
            <Download className="w-6 h-6" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-[65%] w-full p-4 overflow-hidden bg-slate-100/50 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <CommonSpace 
              state={state} 
              updateState={updateState} 
              markPromptDone={markPromptDone} 
              logEvent={logEvent} 
            />
          </div>
          
          <div className="mt-4 flex justify-center">
             <div className="w-full max-w-3xl px-4">
               <HintSystem state={state} updateState={updateState} logEvent={logEvent} />
             </div>
          </div>
        </div>

        <div className="h-[35%] w-full flex border-t-2 border-slate-200 bg-white">
          <UserTerritory 
            userId={1} 
            state={state} 
            updateState={updateState} 
            logEvent={logEvent} 
            className="user1-zone w-1/2 p-6 border-r-2 border-slate-100 overflow-y-auto"
          />
          <UserTerritory 
            userId={2} 
            state={state} 
            updateState={updateState} 
            logEvent={logEvent} 
            className="user2-zone w-1/2 p-6 overflow-y-auto"
          />
        </div>
      </div>
    </div>
  );
}
