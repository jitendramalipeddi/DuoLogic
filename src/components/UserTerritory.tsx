
"use client";

import React, { useState, useMemo } from 'react';
import { GameState } from '@/hooks/useGameState';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { adviseKMapGroupingOptimization } from '@/ai/flows/advise-kmap-grouping-optimization';
import { validateUserBooleanExpression } from '@/ai/flows/validate-user-boolean-expression-flow';
import { CheckCircle2, AlertCircle, Plus, Info, ShieldCheck, HelpCircle, Layers, MousePointer2, Loader2, ArrowRight, X, ListFilter, MonitorPlay, MessageSquareQuote, Rocket } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface UserTerritoryProps {
  userId: number;
  state: GameState;
  updateState: (updates: Partial<GameState>) => void;
  logEvent: (type: string, data: any) => void;
  className?: string;
}

export default function UserTerritory({ userId, state, updateState, logEvent, className }: UserTerritoryProps) {
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showSimInstructions, setShowSimInstructions] = useState(false);
  const { toast } = useToast();

  const isUser1 = userId === 1;
  const accentColor = isUser1 ? 'bg-red-500' : 'bg-blue-500';
  const textColor = isUser1 ? 'text-red-600' : 'text-blue-600';
  const borderColor = isUser1 ? 'border-red-200' : 'border-blue-200';
  
  const handleStartSession = () => {
    const newOnboarding = { ...state.onboardingAccepted, [userId]: true };
    updateState({ onboardingAccepted: newOnboarding });
    logEvent('onboarding_accepted', { userId });
    if (newOnboarding[1] && newOnboarding[2]) {
      updateState({ stage: 'intro' });
    }
  };

  const handleAccept = () => {
    const newAccepted = { ...state.accepted, [userId]: true };
    updateState({ accepted: newAccepted });
    logEvent('user_accepted', { userId });
    if (newAccepted[1] && newAccepted[2]) {
      updateState({ activityCompleted: { ...state.activityCompleted, intro: true } });
    }
  };

  const isSectionFilled = useMemo(() => {
    const range = isUser1 ? [0, 1, 2, 3, 4, 5, 6, 7] : [8, 9, 10, 11, 12, 13, 14, 15];
    return range.every(idx => state.userTruthTable[idx] !== -1);
  }, [state.userTruthTable, isUser1]);

  const bothTruthTablesFilled = useMemo(() => {
    return state.userTruthTable.every(val => val !== -1);
  }, [state.userTruthTable]);

  const handleTruthTableEntry = (rowIdx: number, val: number) => {
    const newTable = [...state.userTruthTable];
    newTable[rowIdx] = val;
    updateState({ userTruthTable: newTable });
    setValidationError(null);
    logEvent('truth_table_entry', { userId, row: rowIdx, value: val });
  };

  const validateTruthTable = () => {
    if (!state.problem) return;
    const errors = state.userTruthTable.filter((val, idx) => val !== -1 && val !== state.problem!.targetTruthTable[idx]);
    
    if (errors.length > 0) {
      setValidationError("Some truth table entries are incorrect. Review the mission requirement.");
      logEvent('truth_table_validation_fail', { errorCount: errors.length });
    } else {
      setValidationError(null);
      updateState({ activityCompleted: { ...state.activityCompleted, truth_table: true } });
      logEvent('truth_table_validation_success', {});
    }
  };

  const validateKMapFilling = () => {
    const errors = state.userKMapValues.filter((val, idx) => val !== -1 && val !== state.userTruthTable[idx]);
    const anyIncomplete = state.userKMapValues.some(val => val === -1);

    if (anyIncomplete) {
      setValidationError("Fill all cells in the K-map grid first.");
      return;
    }

    if (errors.length > 0) {
      setValidationError("K-map values don't match the truth table. Check the row indices.");
      logEvent('kmap_fill_validation_fail', { errorCount: errors.length });
    } else {
      setValidationError(null);
      updateState({ activityCompleted: { ...state.activityCompleted, kmap_fill: true } });
      logEvent('kmap_fill_validation_success', {});
    }
  };

  const validateKMapGroupings = async () => {
    if (!state.problem) return;
    setValidating(true);
    setValidationError(null);

    const greyOrder = [0, 1, 3, 2];
    const grid: string[][] = [];
    for (let r = 0; r < 4; r++) {
      const rowData: string[] = [];
      for (let c = 0; c < 4; c++) {
        const rowGrey = greyOrder[r];
        const colGrey = greyOrder[c];
        const idx = (rowGrey << 2) | colGrey;
        const v = state.userKMapValues[idx];
        rowData.push(v === 2 ? 'X' : (v === -1 ? '0' : v.toString()));
      }
      grid.push(rowData);
    }

    try {
      const result = await adviseKMapGroupingOptimization({
        kMapGrid: grid as any,
        userGroupings: state.userGroupings.map(g => g.cells)
      });

      if (result.isOptimal) {
        setValidationError(null);
        updateState({ activityCompleted: { ...state.activityCompleted, kmap_group: true } });
        logEvent('kmap_validation_success', {});
      } else {
        setValidationError(result.feedback || "Your groupings are not yet optimal.");
        logEvent('kmap_validation_fail', { feedback: result.feedback });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Validation Error", description: "System busy. Try again." });
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmExpression = async () => {
    if (!state.sharedExpression) {
      setValidationError("Enter the shared expression in the Laboratory first.");
      return;
    }

    const newConfirmed = { ...state.expressionConfirmed, [userId]: true };
    updateState({ expressionConfirmed: newConfirmed });
    logEvent('expression_agreed', { userId, expression: state.sharedExpression });

    if (newConfirmed[1] && newConfirmed[2]) {
      setValidating(true);
      setValidationError(null);
      
      try {
        const result = await validateUserBooleanExpression({
          userExpression: state.sharedExpression,
          idealExpression: state.problem!.hints.equation.level3,
          variables: state.problem!.variables
        });

        if (result.isCorrect) {
          updateState({ activityCompleted: { ...state.activityCompleted, equation: true } });
          logEvent('shared_expression_validated', { expression: state.sharedExpression });
        } else {
          setValidationError(result.feedback || "Expression mismatch. Discuss with your partner.");
          updateState({ expressionConfirmed: { 1: false, 2: false } });
          logEvent('shared_expression_validation_fail', { feedback: result.feedback });
        }
      } catch (e: any) {
        toast({ variant: "destructive", title: "Validation Error", description: "Logic engine busy. Try again." });
        updateState({ expressionConfirmed: { 1: false, 2: false } });
      } finally {
        setValidating(false);
      }
    }
  };

  const handleConfirmSimulator = () => {
    setShowSimInstructions(false);
    updateState({ stage: 'simulator' });
  };

  const handleFinishSimulator = () => {
     updateState({ activityCompleted: { ...state.activityCompleted, simulator: true } });
  }

  const addGate = (type: 'AND' | 'OR' | 'NOT') => {
    const newComp = {
      id: `gate-${Math.random().toString(36).substr(2, 9)}`,
      type,
      userId,
      x: 500 + Math.random() * 200, 
      y: 100 + Math.random() * 200
    };
    updateState({ circuitComponents: [...state.circuitComponents, newComp] });
    logEvent('add_gate', { userId, type, gateId: newComp.id });
  };

  const userGroups = state.userGroupings.filter(g => g.userId === userId);

  return (
    <div className={`${className} flex flex-col space-y-4 h-full overflow-hidden`} onContextMenu={(e) => e.preventDefault()}>
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${accentColor} shadow-sm animate-pulse`} />
          <h3 className={`text-sm font-black tracking-widest ${textColor}`}>
            PARTNER {userId}
          </h3>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {state.stage === 'onboarding' && (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            {!state.onboardingAccepted[userId] ? (
              <Button 
                size="lg" 
                className={`w-48 h-20 text-xl font-black shadow-xl rounded-2xl ${isUser1 ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} gap-2`}
                onClick={handleStartSession}
                disabled={!(state.completedPrompts.onboarding?.length === 3)}
              >
                <Rocket className="w-6 h-6" /> I'M READY
              </Button>
            ) : (
              <div className="text-center space-y-4 animate-pulse">
                <Loader2 className={`w-8 h-8 ${textColor} animate-spin mx-auto`} />
                <p className="font-black text-xl tracking-tight uppercase">Status: Prepared</p>
              </div>
            )}
          </div>
        )}

        {state.stage === 'intro' && (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            {!state.accepted[userId] ? (
              <Button 
                size="lg" 
                className={`w-48 h-20 text-2xl font-black shadow-xl rounded-2xl ${isUser1 ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                onClick={handleAccept}
              >
                ACCEPT
              </Button>
            ) : (
              <div className="text-center space-y-4 animate-pulse">
                <Loader2 className={`w-8 h-8 ${textColor} animate-spin mx-auto`} />
                <p className="font-black text-xl tracking-tight uppercase text-slate-400">Objective Confirmed</p>
              </div>
            )}
          </div>
        )}

        {state.stage === 'truth_table' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {(isUser1 ? [0,1,2,3,4,5,6,7] : [8,9,10,11,12,13,14,15]).map((rowIdx) => (
                <div key={rowIdx} className={`p-3 bg-white border-2 ${borderColor} rounded-xl shadow-sm flex items-center justify-between`}>
                  <div className="flex flex-col">
                    <span className="font-black text-[10px] text-muted-foreground uppercase leading-none">Row</span>
                    <span className="font-mono text-xl font-bold">{rowIdx}</span>
                  </div>
                  <div className="flex gap-2">
                    {[0, 1].map(v => (
                      <Button 
                        key={v}
                        size="sm"
                        variant={state.userTruthTable[rowIdx] === v ? 'default' : 'outline'}
                        className={`h-10 w-10 p-0 text-lg font-black border-2 ${state.userTruthTable[rowIdx] === v ? (isUser1 ? 'bg-red-600 border-red-700' : 'bg-blue-600 border-blue-700') : 'border-slate-100'}`}
                        onClick={() => handleTruthTableEntry(rowIdx, v)}
                      >
                        {v}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {validationError && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{validationError}</AlertDescription>
              </Alert>
            )}

            {bothTruthTablesFilled && (
               <Button 
                onClick={validateTruthTable} 
                className="w-full h-14 text-lg font-black bg-primary shadow-xl rounded-xl gap-2"
              >
                 <ShieldCheck className="w-5 h-5" /> VALIDATE MISSION DATA
               </Button>
            )}
          </div>
        )}

        {state.stage === 'kmap' && (
          <div className="flex flex-col items-center justify-center h-full space-y-6 px-4">
            {validationError && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-bold">{validationError}</AlertDescription>
              </Alert>
            )}

            {state.kmapSubStage === 'fill' ? (
              <Button 
                onClick={validateKMapFilling}
                className="w-full h-16 text-lg font-black bg-amber-600 shadow-xl rounded-xl gap-2"
              >
                CHECK MAPPING VALUES
              </Button>
            ) : (
              <Button 
                onClick={validateKMapGroupings} 
                disabled={validating}
                className="w-full h-16 text-lg font-black bg-slate-900 shadow-xl rounded-xl gap-2"
              >
                {validating ? <><Loader2 className="w-5 h-5 animate-spin" /> VERIFYING...</> : <><ShieldCheck className="w-5 h-5" /> VALIDATE OPTIMALITY</>}
              </Button>
            )}
          </div>
        )}

        {(state.stage === 'equation' || state.stage === 'discussion') && (
          <div className="space-y-4 p-6 bg-white rounded-2xl border-4 border-slate-50 shadow-inner h-full flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-2">
               <ShieldCheck className={`w-6 h-6 ${textColor}`} />
               <h4 className="font-black text-sm uppercase tracking-tighter">Agreement Required</h4>
             </div>
             
             {validationError && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{validationError}</AlertDescription>
              </Alert>
            )}
             
             <Button 
                onClick={handleConfirmExpression} 
                disabled={validating || state.expressionConfirmed[userId]}
                className={`w-full h-20 text-2xl font-black rounded-3xl shadow-2xl ${isUser1 ? 'bg-red-600' : 'bg-blue-600'} gap-2 transition-all active:scale-95`}
             >
                {state.expressionConfirmed[userId] ? (
                  <><CheckCircle2 className="w-8 h-8" /> AGREED</>
                ) : validating ? (
                  <><Loader2 className="w-8 h-8 animate-spin" /> ANALYZING...</>
                ) : (
                  'AGREE WITH EQUATION'
                )}
             </Button>
          </div>
        )}

        {state.stage === 'simulator' && (
          <div className="space-y-4">
             <div className="grid grid-cols-3 gap-3">
                {['AND', 'OR', 'NOT'].map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    className={`h-28 flex flex-col gap-2 border-4 rounded-2xl hover:border-primary transition-all shadow-md group ${isUser1 ? 'hover:bg-red-50 hover:border-red-300' : 'hover:bg-blue-50 hover:border-blue-300'}`}
                    onClick={() => addGate(type as any)}
                  >
                    <span className="font-black text-lg">{type}</span>
                    <Plus className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                  </Button>
                ))}
             </div>
             <Button 
                onClick={handleFinishSimulator}
                className="w-full h-14 bg-slate-900 text-white font-black rounded-xl mt-4"
              >
                FINISH CONSTRUCTION
              </Button>
          </div>
        )}
      </div>

      <Dialog open={showSimInstructions} onOpenChange={setShowSimInstructions}>
        <DialogContent className="max-w-2xl rounded-3xl p-8 border-4 border-primary shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase tracking-tight text-primary flex items-center gap-3">
              <MonitorPlay className="w-8 h-8" />
              Simulator Instructions
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-4 text-slate-700">
              <div className="flex gap-4 items-start p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-black shrink-0">1</div>
                <p className="font-bold">Add components via buttons in your territory.</p>
              </div>
              <div className="flex gap-4 items-start p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-black shrink-0">2</div>
                <p className="font-bold text-red-600">Double-tap wires or gates to remove them.</p>
              </div>
              <div className="flex gap-4 items-start p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-black shrink-0">3</div>
                <p className="font-bold">Touch and drag from black pins to connect wires.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleConfirmSimulator} className="w-full h-16 text-2xl font-black bg-primary rounded-2xl shadow-xl hover:bg-primary/90">
              START BUILDING
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
