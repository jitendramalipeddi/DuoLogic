"use client";

import React, { useState, useEffect } from 'react';
import { GameState, CircuitComponent } from '@/hooks/useGameState';
import { suggestCircuitImprovements } from '@/ai/flows/suggest-circuit-improvements';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Zap, Info } from 'lucide-react';

interface CircuitCanvasProps {
  state: GameState;
  updateState: (updates: Partial<GameState>) => void;
  logEvent: (type: string, data: any) => void;
}

export default function CircuitCanvas({ state, updateState, logEvent }: CircuitCanvasProps) {
  const [advice, setAdvice] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    // Mock circuit check
    if (state.circuitComponents.length > 0) {
      // Simulate efficiency check
      const checkEfficiency = async () => {
        const result = await suggestCircuitImprovements({
          currentCircuitDescription: state.circuitComponents.map(c => c.type).join(', '),
          kMapOptimizedGateCount: 3, // Mock target
          kMapOptimizedExpression: state.expressions[1]
        });
        setAdvice(result.suggestions);
      };
      checkEfficiency();
    }
  }, [state.circuitComponents.length]);

  return (
    <div className="relative h-full w-full bg-[#f8fafc] rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
      <div className="absolute top-4 left-4 z-20 space-y-2 max-w-sm">
        <div className={`p-4 rounded-lg shadow-lg flex items-center space-x-3 ${isCorrect ? 'bg-green-500 text-white' : 'bg-gray-800 text-white opacity-90'}`}>
          <Zap className={`w-8 h-8 ${isCorrect ? 'animate-pulse' : ''}`} />
          <div>
            <div className="font-bold text-lg">LED OUTPUT</div>
            <div className="text-xs uppercase tracking-widest">{isCorrect ? 'System ON' : 'System OFF'}</div>
          </div>
        </div>
        
        {advice && (
          <Alert className="bg-white/95 border-primary">
            <Info className="h-4 w-4" />
            <AlertTitle>Efficiency Advisor</AlertTitle>
            <AlertDescription className="text-xs">{advice}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] grid-rows-[repeat(20,minmax(0,1fr))] h-full w-full opacity-10 pointer-events-none">
         {Array.from({length: 400}).map((_, i) => <div key={i} className="border-[0.5px] border-gray-400" />)}
      </div>

      {state.circuitComponents.map((comp) => (
        <div 
          key={comp.id}
          className={`absolute p-4 rounded-lg shadow-xl cursor-move border-2 ${
            comp.userId === 1 ? 'border-red-500' : 'border-blue-500'
          } ${
            comp.type === 'AND' ? 'gate-and' : comp.type === 'OR' ? 'gate-or' : 'gate-not'
          } text-white font-bold text-center flex flex-col items-center justify-center`}
          style={{ top: comp.y, left: comp.x, width: '80px', height: '80px' }}
        >
          <span className="text-xs block mb-1">U{comp.userId}</span>
          {comp.type}
        </div>
      ))}

      {state.circuitComponents.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
          <p className="text-xl italic">Drag logic gates from your territory to start building...</p>
        </div>
      )}
    </div>
  );
}
