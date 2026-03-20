"use client";

import React, { useState, useMemo } from 'react';
import { GameState } from '@/hooks/useGameState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { adviseKMapGroupingOptimization } from '@/ai/flows/advise-kmap-grouping-optimization';
import { validateUserBooleanExpression } from '@/ai/flows/validate-user-boolean-expression-flow';
import KMapGrid from './KMapGrid';
import { CheckCircle2, AlertCircle, Plus, Info, ShieldCheck, HelpCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface UserTerritoryProps {
  userId: number;
  state: GameState;
  updateState: (updates: Partial<GameState>) => void;
  logEvent: (type: string, data: any) => void;
  className?: string;
}

export default function UserTerritory({ userId, state, updateState, logEvent, className }: UserTerritoryProps) {
  const [expressionInput, setExpressionInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { toast } = useToast();

  const isUser1 = userId === 1;
  const accentColor = isUser1 ? 'bg-red-500' : 'bg-blue-500';
  const textColor = isUser1 ? 'text-red-600' : 'text-blue-600';
  const borderColor = isUser1 ? 'border-red-200' : 'border-blue-200';
  
  const handleAccept = () => {
    const newAccepted = { ...state.accepted, [userId]: true };
    updateState({ accepted: newAccepted });
    logEvent('user_accepted', { userId });
    if (newAccepted[1] && newAccepted[2]) {
      updateState({ stage: 'truth_table' });
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
      setValidationError("Some truth table entries are incorrect. Please review the problem description and your logic.");
      logEvent('truth_table_validation_fail', { errorCount: errors.length });
    } else {
      setValidationError(null);
      updateState({ stage: 'kmap' });
      logEvent('truth_table_validation_success', {});
      toast({ title: "Truth Table Verified", description: "All entries match the target logic." });
    }
  };

  const validateKMapGroupings = async () => {
    if (!state.problem) return;
    setValidating(true);
    setValidationError(null);

    // Convert flat array to 4x4 grid
    const grid: any[][] = [];
    for (let i = 0; i < 4; i++) {
      grid.push(state.userTruthTable.slice(i * 4, (i + 1) * 4).map(v => v.toString()));
    }

    try {
      const result = await adviseKMapGroupingOptimization({
        kMapGrid: grid,
        userGroupings: state.userGroupings.map(g => g.cells)
      });

      if (result.isOptimal) {
        updateState({ stage: 'equation' });
        logEvent('kmap_validation_success', {});
        toast({ title: "K-Map Optimized", description: "Your groupings are optimal Prime Implicants." });
      } else {
        setValidationError(result.feedback || "Your K-map groupings are not optimal. Check for prime implicants or redundant groups.");
        logEvent('kmap_validation_fail', { feedback: result.feedback });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Validation Error", description: "Could not verify K-map groupings. Please try again." });
    } finally {
      setValidating(false);
    }
  };

  const handleSubmitExpression = async () => {
    if (!state.problem) return;
    setValidating(true);
    setValidationError(null);
    logEvent('expression_submit_attempt', { userId, expression: expressionInput });
    
    try {
      // For MVP, we use the fallback problem's equation if it exists, or just a simple check
      // Ideally, we'd have an "idealEquation" in the problem object
      const result = await validateUserBooleanExpression({
        userExpression: expressionInput,
        idealExpression: state.problem.hints.equation.level3, // Level 3 hint often contains the answer
        variables: state.problem.variables
      });

      if (result.isCorrect) {
        const newExpressions = { ...state.expressions, [userId]: expressionInput };
        updateState({ expressions: newExpressions });
        
        if (newExpressions[1] && newExpressions[2]) {
          updateState({ stage: 'simulator' });
          logEvent('expressions_matched', { expression: expressionInput });
        }
      } else {
        setValidationError(result.feedback || "The equation does not logically match the truth table.");
        logEvent('expression_validation_fail', { feedback: result.feedback });
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "The logic engine is currently busy. Please try again.",
      });
    } finally {
      setValidating(false);
    }
  };

  const addGate = (type: 'AND' | 'OR' | 'NOT') => {
    const newComp = {
      id: `gate-${Math.random().toString(36).substr(2, 9)}`,
      type,
      userId,
      x: 200 + Math.random() * 200,
      y: 100 + Math.random() * 200
    };
    updateState({ circuitComponents: [...state.circuitComponents, newComp] });
    logEvent('add_gate', { userId, type, gateId: newComp.id });
  };

  return (
    <div className={`${className} flex flex-col space-y-4 h-full overflow-hidden`}>
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${accentColor} shadow-sm animate-pulse`} />
          <h3 className={`text-sm font-black tracking-widest ${textColor}`}>
            PARTNER {userId}
          </h3>
        </div>
        {isSectionFilled && state.stage === 'truth_table' && (
          <div className="flex items-center text-green-600 text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            FILLED
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {state.stage === 'intro' && !state.accepted[userId] && (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="text-center space-y-2">
              <p className="font-bold text-lg">Ready to begin?</p>
              <p className="text-muted-foreground text-sm px-8">Confirm your participation to start the logic design challenge.</p>
            </div>
            <Button 
              size="lg" 
              className={`w-48 h-20 text-2xl font-black shadow-xl rounded-2xl ${isUser1 ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              onClick={handleAccept}
            >
              ACCEPT
            </Button>
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
                <AlertTitle>Review Needed</AlertTitle>
                <AlertDescription className="text-xs">{validationError}</AlertDescription>
              </Alert>
            )}

            {bothTruthTablesFilled ? (
               <Button onClick={validateTruthTable} className="w-full h-14 text-lg font-black bg-primary shadow-xl rounded-xl gap-2">
                 <ShieldCheck className="w-5 h-5" /> VALIDATE & PROCEED
               </Button>
            ) : isSectionFilled ? (
              <div className="p-4 bg-slate-50 rounded-xl text-sm font-bold text-center border-2 border-dashed border-slate-200 text-slate-400 italic">
                Waiting for Peer to complete their section...
              </div>
            ) : null}
          </div>
        )}

        {state.stage === 'kmap' && (
          <div className="flex flex-col items-center h-full space-y-4">
            <div className="scale-75 origin-top">
              <KMapGrid state={state} updateState={updateState} logEvent={logEvent} activeUserId={userId} />
            </div>
            {validationError && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{validationError}</AlertDescription>
              </Alert>
            )}
            <Button 
              onClick={validateKMapGroupings} 
              disabled={validating}
              className="w-full h-14 text-lg font-black bg-slate-900 shadow-xl rounded-xl gap-2"
            >
              {validating ? "VERIFYING OPTIMALITY..." : "VALIDATE GROUPINGS"}
            </Button>
          </div>
        )}

        {(state.stage === 'equation' || state.stage === 'discussion') && (
          <div className="space-y-4 p-6 bg-white rounded-2xl border-4 border-slate-50 shadow-inner">
             <div className="flex items-center gap-2 mb-2">
               <HelpCircle className={`w-5 h-5 ${textColor}`} />
               <h4 className="font-black text-sm uppercase tracking-tighter">Final Equation</h4>
             </div>
             <Input 
                value={expressionInput}
                onChange={(e) => setExpressionInput(e.target.value)}
                placeholder="e.g. A'B + CD"
                className="font-mono text-2xl h-16 border-2 border-slate-100 focus-visible:ring-offset-2 rounded-xl text-center"
                disabled={state.expressions[userId] !== ''}
             />
             {validationError && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{validationError}</AlertDescription>
              </Alert>
            )}
             <Button 
                onClick={handleSubmitExpression} 
                disabled={validating || state.expressions[userId] !== ''}
                className={`w-full h-16 text-xl font-black rounded-xl shadow-xl ${isUser1 ? 'bg-red-600' : 'bg-blue-600'} gap-2`}
             >
                {state.expressions[userId] ? 'AWAITING PEER...' : validating ? 'ANALYZING...' : 'SUBMIT SOLUTION'}
             </Button>
          </div>
        )}

        {state.stage === 'simulator' && (
          <div className="space-y-4">
             <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400 px-1">Logic Gate Library</h4>
             <div className="grid grid-cols-3 gap-3">
                {['AND', 'OR', 'NOT'].map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    className={`h-28 flex flex-col gap-2 border-4 rounded-2xl hover:border-primary transition-all shadow-md group ${isUser1 ? 'hover:bg-red-50 hover:border-red-300' : 'hover:bg-blue-50 hover:border-blue-300'}`}
                    onClick={() => addGate(type as any)}
                  >
                    <Plus className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{type}</span>
                    <div className={`w-10 h-5 rounded-md ${type === 'AND' ? 'gate-and' : type === 'OR' ? 'gate-or' : 'gate-not'} shadow-sm`} />
                  </Button>
                ))}
             </div>
             <div className="p-4 bg-muted/20 rounded-2xl border-2 border-dashed border-slate-200 flex gap-3 items-start">
               <Info className="w-5 h-5 text-slate-400 shrink-0" />
               <p className="text-[11px] font-bold text-slate-500 leading-tight">
                 Add components and drag them onto the common space. Connect output pins (black) to input pins (white) to build your circuit.
               </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
