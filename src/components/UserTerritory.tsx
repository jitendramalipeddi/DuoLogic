"use client";

import React, { useState, useMemo } from 'react';
import { GameState } from '@/hooks/useGameState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { generateDiscussionPrompts } from '@/ai/flows/generate-discussion-prompts';
import KMapGrid from './KMapGrid';
import { CheckCircle2, AlertCircle, Plus } from 'lucide-react';

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

  const isTruthTableComplete = useMemo(() => {
    const range = isUser1 ? [0, 1, 2, 3, 4, 5, 6, 7] : [8, 9, 10, 11, 12, 13, 14, 15];
    return range.every(idx => state.userTruthTable[idx] !== -1);
  }, [state.userTruthTable, isUser1]);

  const bothTruthTablesComplete = useMemo(() => {
    return state.userTruthTable.every(val => val !== -1);
  }, [state.userTruthTable]);

  const handleTruthTableEntry = (rowIdx: number, val: number) => {
    const newTable = [...state.userTruthTable];
    newTable[rowIdx] = val;
    updateState({ userTruthTable: newTable });
    
    if (val !== -1 && val !== state.problem?.targetTruthTable[rowIdx]) {
      logEvent('truth_table_error', { userId, row: rowIdx, value: val });
    } else {
      logEvent('truth_table_entry', { userId, row: rowIdx, value: val });
    }
  };

  const handleSubmitExpression = async () => {
    setValidating(true);
    logEvent('expression_submit_attempt', { userId, expression: expressionInput });
    
    try {
      const newExpressions = { ...state.expressions, [userId]: expressionInput };
      updateState({ expressions: newExpressions });

      if (newExpressions[1] && newExpressions[2]) {
        if (newExpressions[1] === newExpressions[2]) {
          updateState({ stage: 'simulator' });
          logEvent('expressions_matched', { expression: expressionInput });
        } else {
          const prompts = await generateDiscussionPrompts({
            expression1: newExpressions[1],
            expression2: newExpressions[2]
          });
          updateState({ stage: 'discussion', discussionPrompts: prompts.prompts });
          logEvent('expressions_mismatch', { exp1: newExpressions[1], exp2: newExpressions[2] });
        }
      } else {
         updateState({ stage: 'equation' });
      }
    } catch (e: any) {
      console.error("AI Error:", e);
      const isQuotaError = e.message?.includes('429') || e.message?.includes('RESOURCE_EXHAUSTED');
      toast({
        variant: "destructive",
        title: "Expression Submission Error",
        description: isQuotaError 
          ? "AI Quota exceeded. Please wait a moment and try again." 
          : "An error occurred while processing your expression.",
      });
      // Reset expression in state if it failed to process discussion prompts
      const resetExpressions = { ...state.expressions, [userId]: '' };
      updateState({ expressions: resetExpressions });
    } finally {
      setValidating(false);
    }
  };

  const addGate = (type: 'AND' | 'OR' | 'NOT') => {
    const newComp = {
      id: `gate-${Math.random().toString(36).substr(2, 9)}`,
      type,
      userId,
      x: 150 + Math.random() * 200,
      y: 100 + Math.random() * 200
    };
    updateState({ circuitComponents: [...state.circuitComponents, newComp] });
    logEvent('add_gate', { userId, type, gateId: newComp.id });
  };

  return (
    <div className={`${className} flex flex-col space-y-4 h-full overflow-hidden`}>
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${accentColor} shadow-sm`} />
          <h3 className={`text-sm font-bold tracking-wider ${textColor}`}>
            USER {userId} TERRITORY
          </h3>
        </div>
        {isTruthTableComplete && state.stage === 'truth_table' && (
          <div className="flex items-center text-green-600 text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            SECTION COMPLETE
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {state.stage === 'intro' && !state.accepted[userId] && (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <p className="text-muted-foreground text-sm text-center px-8">Confirm your participation in the collaborative session</p>
            <Button 
              size="lg" 
              className={`w-40 h-16 text-xl font-bold shadow-lg ${isUser1 ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              onClick={handleAccept}
            >
              ACCEPT
            </Button>
          </div>
        )}

        {state.stage === 'truth_table' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {(isUser1 ? [0,1,2,3,4,5,6,7] : [8,9,10,11,12,13,14,15]).map((rowIdx) => (
                <div key={rowIdx} className={`p-2 bg-white border ${borderColor} rounded-lg shadow-sm flex items-center justify-between`}>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">Row {rowIdx}</span>
                  <div className="flex gap-1">
                    {[0, 1].map(v => (
                      <Button 
                        key={v}
                        size="sm"
                        variant={state.userTruthTable[rowIdx] === v ? 'default' : 'outline'}
                        className={`h-8 w-8 p-0 text-xs font-bold ${state.userTruthTable[rowIdx] === v ? (isUser1 ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600') : ''}`}
                        onClick={() => handleTruthTableEntry(rowIdx, v)}
                      >
                        {v}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {bothTruthTablesComplete ? (
               <Button onClick={() => updateState({ stage: 'kmap' })} className="w-full font-bold shadow-md">Proceed to K-Map</Button>
            ) : isTruthTableComplete ? (
              <div className="p-3 bg-muted/40 rounded-lg text-xs text-center border-dashed border border-muted-foreground/30 italic">
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
            <div className="w-full space-y-2">
              <Button onClick={() => updateState({ stage: 'equation'})} className="w-full font-bold">Next: Derive Equation</Button>
            </div>
          </div>
        )}

        {(state.stage === 'equation' || state.stage === 'discussion') && (
          <div className="space-y-4 p-4 bg-white rounded-xl border-2 border-slate-100 shadow-inner">
             <div className="flex items-center gap-2">
               <AlertCircle className={`w-4 h-4 ${textColor}`} />
               <h4 className="font-bold text-sm">Boolean Simplification</h4>
             </div>
             <Input 
                value={expressionInput}
                onChange={(e) => setExpressionInput(e.target.value)}
                placeholder="e.g. A'BC + D"
                className="font-mono text-lg h-12 border-2 focus-visible:ring-offset-1"
             />
             <Button 
                onClick={handleSubmitExpression} 
                disabled={validating || state.expressions[userId] !== ''}
                className={`w-full h-12 font-bold ${isUser1 ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
             >
                {state.expressions[userId] ? 'Awaiting Peer...' : validating ? 'Validating...' : 'Submit Expression'}
             </Button>
          </div>
        )}

        {state.stage === 'simulator' && (
          <div className="space-y-4">
             <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Component Library</h4>
             <div className="grid grid-cols-3 gap-3">
                {['AND', 'OR', 'NOT'].map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    className={`h-24 flex flex-col gap-2 border-2 hover:border-primary transition-all shadow-md group ${isUser1 ? 'hover:bg-red-50' : 'hover:bg-blue-50'}`}
                    onClick={() => addGate(type as any)}
                  >
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                    <span className="text-[10px] font-bold uppercase">{type}</span>
                    <div className={`w-8 h-4 rounded-sm ${type === 'AND' ? 'gate-and' : type === 'OR' ? 'gate-or' : 'gate-not'}`} />
                  </Button>
                ))}
             </div>
             <div className="p-4 bg-muted/30 rounded-lg border border-dashed text-xs text-muted-foreground leading-relaxed">
               <strong>Collaboration:</strong> Drag gates onto the shared board. Connect pins to build the circuit described in your equation.
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
