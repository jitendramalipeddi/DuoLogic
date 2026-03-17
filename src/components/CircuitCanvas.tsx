"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GameState, CircuitComponent, WireConnection } from '@/hooks/useGameState';
import { suggestCircuitImprovements } from '@/ai/flows/suggest-circuit-improvements';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Zap, Info, MousePointer2 } from 'lucide-react';

interface CircuitCanvasProps {
  state: GameState;
  updateState: (updates: Partial<GameState>) => void;
  logEvent: (type: string, data: any) => void;
}

const GATE_WIDTH = 100;
const GATE_HEIGHT = 60;

export default function CircuitCanvas({ state, updateState, logEvent }: CircuitCanvasProps) {
  const [advice, setAdvice] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
  const [wireStart, setWireStart] = useState<{ id: string; pin: number; type: 'in' | 'out' } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.circuitComponents.length > 0) {
      const checkEfficiency = async () => {
        const result = await suggestCircuitImprovements({
          currentCircuitDescription: state.circuitComponents.map(c => c.type).join(', '),
          kMapOptimizedGateCount: 3,
          kMapOptimizedExpression: state.expressions[1]
        });
        setAdvice(result.suggestions);
      };
      checkEfficiency();
    }
  }, [state.circuitComponents.length]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (draggingCompId) {
      const newComps = state.circuitComponents.map(c => 
        c.id === draggingCompId ? { ...c, x: x - GATE_WIDTH/2, y: y - GATE_HEIGHT/2 } : c
      );
      updateState({ circuitComponents: newComps });
    }
  };

  const handlePinClick = (id: string, pin: number, type: 'in' | 'out') => {
    if (!wireStart) {
      setWireStart({ id, pin, type });
    } else {
      // Connect if compatible
      if (wireStart.id !== id && wireStart.type !== type) {
        const from = wireStart.type === 'out' ? wireStart : { id, pin, type };
        const to = wireStart.type === 'in' ? wireStart : { id, pin, type };
        
        const newWire: WireConnection = {
          id: Math.random().toString(),
          fromId: from.id,
          fromPin: from.pin,
          toId: to.id,
          toPin: to.pin
        };
        updateState({ wires: [...state.wires, newWire] });
      }
      setWireStart(null);
    }
  };

  const getPinPos = (compId: string, pinIndex: number, type: 'in' | 'out') => {
    const comp = state.circuitComponents.find(c => c.id === compId);
    if (!comp) return { x: 0, y: 0 };

    if (type === 'out') {
      return { x: comp.x + GATE_WIDTH, y: comp.y + GATE_HEIGHT / 2 };
    } else {
      // 2 inputs for AND/OR, 1 for NOT
      const inputCount = comp.type === 'NOT' ? 1 : 2;
      const spacing = GATE_HEIGHT / (inputCount + 1);
      return { x: comp.x, y: comp.y + spacing * (pinIndex + 1) };
    }
  };

  return (
    <div 
      className="relative h-full w-full bg-[#f8fafc] rounded-xl border-2 border-dashed border-slate-300 overflow-hidden"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={() => { setDraggingCompId(null); }}
      onMouseLeave={() => { setDraggingCompId(null); setWireStart(null); }}
    >
      {/* Background Grid */}
      <div className="absolute inset-0 grid grid-cols-[repeat(40,minmax(0,1fr))] grid-rows-[repeat(40,minmax(0,1fr))] opacity-[0.03] pointer-events-none">
         {Array.from({length: 1600}).map((_, i) => <div key={i} className="border-[0.5px] border-black" />)}
      </div>

      <div className="absolute top-4 left-4 z-30 space-y-2 max-w-sm pointer-events-none">
        <div className={`p-4 rounded-xl shadow-xl flex items-center space-x-3 pointer-events-auto ${isCorrect ? 'bg-green-600 text-white' : 'bg-slate-900 text-white opacity-95'}`}>
          <Zap className={`w-8 h-8 ${isCorrect ? 'animate-pulse text-yellow-300' : 'text-slate-400'}`} />
          <div>
            <div className="font-black text-lg tracking-tighter">CIRCUIT OUTPUT</div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">{isCorrect ? 'Logic High' : 'Logic Low / No Output'}</div>
          </div>
        </div>
        
        {advice && (
          <Alert className="bg-white/95 border-primary shadow-lg pointer-events-auto">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle className="text-xs font-bold uppercase tracking-wider text-primary">Efficiency Tips</AlertTitle>
            <AlertDescription className="text-[11px] leading-relaxed text-slate-600">{advice}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Wire SVG Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {state.wires.map(wire => {
          const start = getPinPos(wire.fromId, wire.fromPin, 'out');
          const end = getPinPos(wire.toId, wire.toPin, 'in');
          return (
            <path 
              key={wire.id}
              d={`M ${start.x} ${start.y} C ${start.x + 50} ${start.y}, ${end.x - 50} ${end.y}, ${end.x} ${end.y}`}
              stroke="#3b82f6"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          );
        })}
        {wireStart && (
          <path 
            d={`M ${getPinPos(wireStart.id, wireStart.pin, wireStart.type).x} ${getPinPos(wireStart.id, wireStart.pin, wireStart.type).y} L ${mousePos.x} ${mousePos.y}`}
            stroke="#94a3b8"
            strokeWidth="2"
            strokeDasharray="5,5"
            fill="none"
          />
        )}
      </svg>

      {/* Components Layer */}
      {state.circuitComponents.map((comp) => (
        <div 
          key={comp.id}
          className={`absolute group shadow-lg border-2 rounded-lg transition-shadow hover:shadow-2xl ${
            comp.userId === 1 ? 'border-red-400/50' : 'border-blue-400/50'
          } ${
            comp.type === 'AND' ? 'gate-and' : comp.type === 'OR' ? 'gate-or' : 'gate-not'
          } text-white`}
          style={{ top: comp.y, left: comp.x, width: `${GATE_WIDTH}px`, height: `${GATE_HEIGHT}px` }}
        >
          {/* Component Header/Drag Handle */}
          <div 
            className="h-1/3 w-full bg-black/20 flex items-center justify-between px-2 cursor-grab active:cursor-grabbing"
            onMouseDown={() => setDraggingCompId(comp.id)}
          >
            <span className="text-[8px] font-bold opacity-70">U{comp.userId}</span>
            <MousePointer2 className="w-2 h-2 opacity-50" />
          </div>

          <div className="h-2/3 flex items-center justify-center font-black text-sm tracking-widest">
            {comp.type}
          </div>

          {/* Output Pin */}
          <button 
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-slate-800 border-2 border-white hover:scale-125 transition-transform z-20"
            onClick={(e) => { e.stopPropagation(); handlePinClick(comp.id, 0, 'out'); }}
          />

          {/* Input Pins */}
          {(comp.type === 'NOT' ? [0] : [0, 1]).map((pinIdx) => {
            const spacing = GATE_HEIGHT / (comp.type === 'NOT' ? 2 : 3);
            return (
              <button 
                key={pinIdx}
                className="absolute left-0 w-4 h-4 rounded-full bg-slate-800 border-2 border-white hover:scale-125 transition-transform z-20 -translate-x-1/2"
                style={{ top: spacing * (pinIdx + 1) }}
                onClick={(e) => { e.stopPropagation(); handlePinClick(comp.id, pinIdx, 'in'); }}
              />
            );
          })}
        </div>
      ))}

      {state.circuitComponents.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none p-12 text-center">
          <div className="w-24 h-24 border-4 border-dashed rounded-full mb-6 opacity-20 flex items-center justify-center">
            <Zap className="w-12 h-12" />
          </div>
          <p className="text-xl font-headline font-semibold">Ready for Construction</p>
          <p className="max-w-xs text-sm mt-2 opacity-60">Add gates from your territory and connect pins to build your logic circuit.</p>
        </div>
      )}
    </div>
  );
}
