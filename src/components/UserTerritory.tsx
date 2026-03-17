"use client";

import React, { useState } from 'react';
import { GameState, updateState } from '@/hooks/useGameState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { validateUserBooleanExpression } from '@/ai/flows/validate-user-boolean-expression-flow';
import { generateDiscussionPrompts } from '@/ai/flows/generate-discussion-prompts';

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

  const isUser1 = userId === 1;
  const accentColor = isUser1 ? 'bg-red-500' : 'bg-blue-500';
  const textColor = isUser1 ? 'text-red-600' : 'text-blue-600';
  
  const handleAccept = () => {
    const newAccepted = { ...state.accepted, [userId]: true };
    updateState({ accepted: newAccepted });
    if (newAccepted[1] && newAccepted[2]) {
      updateState({ stage: 'truth_table' });
    }
  };

  const handleTruthTableEntry = (rowIdx: number, val: number) => {
    const newTable = [...state.userTruthTable];
    newTable[rowIdx] = val;
    updateState({ userTruthTable: newTable });
    
    // Log error event if incorrect
    if (val !== -1 && val !== state.problem?.targetTruthTable[rowIdx]) {
      logEvent('error_event', { userId, row: rowIdx, valueEntered: val });
    }
  };

  const handleNextToKmap = () => {
    updateState({ stage: 'kmap' });
  };

  const handleSubmitExpression = async () => {
    setValidating(true);
    const newExpressions = { ...state.expressions, [userId]: expressionInput };
    updateState({ expressions: newExpressions });

    // Check if both submitted
    if (newExpressions[1] && newExpressions[2]) {
      if (newExpressions[1] === newExpressions[2]) {
        updateState({ stage: 'simulator' });
      } else {
        const prompts = await generateDiscussionPrompts({
          expression1: newExpressions[1],
          expression2: newExpressions[2]
        });
        updateState({ stage: 'discussion', discussionPrompts: prompts.prompts });
      }
    } else {
       // Only one submitted, wait for other
       updateState({ stage: 'equation' });
    }
    setValidating(false);
  };

  return (
    <div className={`${className} flex flex-col space-y-4`}>
      <div className="flex items-center space-x-2">
        <div className={`w-4 h-4 rounded-full ${accentColor}`} />
        <h3 className={`text-xl font-bold font-headline ${textColor}`}>
          USER {userId} TERRITORY
        </h3>
      </div>

      <div className="flex-1 overflow-auto">
        {state.stage === 'intro' && !state.accepted[userId] && (
          <div className="flex items-center justify-center h-full">
            <Button 
              size="lg" 
              className={`w-48 h-20 text-2xl font-bold shadow-xl ${isUser1 ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              onClick={handleAccept}
            >
              ACCEPT
            </Button>
          </div>
        )}
        {state.stage === 'intro' && state.accepted[userId] && (
          <div className="text-center italic text-muted-foreground animate-pulse">
            Waiting for Peer...
          </div>
        )}

        {state.stage === 'truth_table' && (
          <div className="grid grid-cols-2 gap-2">
            {(isUser1 ? [0,1,2,3,4,5,6,7] : [8,9,10,11,12,13,14,15]).map((rowIdx) => (
              <div key={rowIdx} className="p-3 bg-white border rounded shadow-sm flex items-center justify-between">
                <span className="font-mono text-sm">Row {rowIdx}</span>
                <div className="flex space-x-1">
                  {[0, 1].map(v => (
                    <Button 
                      key={v}
                      size="sm"
                      variant={state.userTruthTable[rowIdx] === v ? 'default' : 'outline'}
                      className={state.userTruthTable[rowIdx] === v ? (isUser1 ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600') : ''}
                      onClick={() => handleTruthTableEntry(rowIdx, v)}
                    >
                      {v}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            <div className="col-span-2 pt-4">
               {isUser1 && <Button onClick={handleNextToKmap} className="w-full">Proceed to K-Map</Button>}
            </div>
          </div>
        )}

        {state.stage === 'kmap' && (
          <div className="flex items-center justify-center h-full flex-col space-y-4">
             <p className="text-center font-medium">Use the common space to group terms.</p>
             <Button onClick={() => updateState({ stage: 'equation'})}>Go to Equation Entry</Button>
          </div>
        )}

        {(state.stage === 'equation' || state.stage === 'discussion') && (
          <div className="space-y-4 p-4 bg-white rounded-lg shadow-inner">
             <h4 className="font-bold">Enter Boolean Expression:</h4>
             <Input 
                value={expressionInput}
                onChange={(e) => setExpressionInput(e.target.value)}
                placeholder="e.g. A'BC + D"
                className="font-mono text-lg"
             />
             <Button 
                onClick={handleSubmitExpression} 
                disabled={validating || state.expressions[userId] !== ''}
                className={`w-full ${isUser1 ? 'bg-red-600' : 'bg-blue-600'}`}
             >
                {state.expressions[userId] ? 'Submitted' : validating ? 'Validating...' : 'Submit Expression'}
             </Button>
             {state.stage === 'discussion' && (
               <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  Equations don't match. Review the discussion prompts in common space.
               </div>
             )}
             {state.stage === 'discussion' && isUser1 && (
               <Button variant="outline" onClick={() => updateState({ stage: 'simulator' })} className="w-full mt-2">Force Proceed to Simulator</Button>
             )}
          </div>
        )}

        {state.stage === 'simulator' && (
          <div className="grid grid-cols-1 gap-4">
             <h4 className="font-bold">Logic Components:</h4>
             <div className="flex flex-wrap gap-2">
                {['AND', 'OR', 'NOT'].map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    className="h-16 w-16 flex flex-col"
                    onClick={() => {
                      const newComp = {
                        id: Math.random().toString(),
                        type: type as any,
                        userId,
                        x: 50 + Math.random() * 200,
                        y: 50 + Math.random() * 100
                      };
                      updateState({ circuitComponents: [...state.circuitComponents, newComp] });
                      logEvent('component_added', { userId, type });
                    }}
                  >
                    <span className="text-xs">{type}</span>
                  </Button>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
