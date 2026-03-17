"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GameState, CircuitComponent, WireConnection } from '@/hooks/useGameState';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Zap, Info, MousePointer2, Play, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';

interface CircuitCanvasProps {
  state: GameState;
  updateState: (updates: Partial<GameState>) => void;
  logEvent: (type: string, data: any) => void;
}

const GATE_WIDTH = 100;
const GATE_HEIGHT = 60;

export default function CircuitCanvas({ state, updateState, logEvent }: CircuitCanvasProps) {
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
  const [wireStart, setWireStart] = useState<{ id: string; pin: number; type: 'in' | 'out' } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isLidOn, setIsLidOn] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (draggingCompId) {
      const comp = state.circuitComponents.find(c => c.id === draggingCompId);
      if (comp && comp.userId !== 0) {
        const newComps = state.circuitComponents.map(c => 
          c.id === draggingCompId ? { ...c, x: x - GATE_WIDTH/2, y: y - GATE_HEIGHT/2 } : c
        );
        updateState({ circuitComponents: newComps });
      }
    }
  };

  const handlePinClick = (id: string, pin: number, type: 'in' | 'out') => {
    if (!wireStart) {
      setWireStart({ id, pin, type });
      logEvent('wire_start', { id, pin, type });
    } else {
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
        logEvent('wire_connect', { fromId: from.id, toId: to.id });
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
      const inputCount = comp.type === 'NOT' ? 1 : comp.type === 'LED' ? 1 : 2;
      const spacing = GATE_HEIGHT / (inputCount + 1);
      return { x: comp.x, y: comp.y + spacing * (pinIndex + 1) };
    }
  };

  const runSimulation = () => {
    if (!state.problem) return;
    
    let allMatch = true;
    const results = [];

    for (let i = 0; i < 16; i++) {
      const inputs = {
        'in-A': (i >> 3) & 1,
        'in-B': (i >> 2) & 1,
        'in-C': (i >> 1) & 1,
        'in-D': (i >> 0) & 1,
      };

      const gateValues: Record<string, number> = { ...inputs };
      const resolved = new Set(Object.keys(inputs));
      let changed = true;
      let iterations = 0;

      while (changed && iterations < 20) {
        changed = false;
        iterations++;

        state.circuitComponents.forEach(gate => {
          if (gate.type === 'INPUT' || gate.type === 'LED') return;
          
          const inWires = state.wires.filter(w => w.toId === gate.id);
          const inValues = inWires.map(w => gateValues[w.fromId]).filter(v => v !== undefined);

          let output: number | undefined;
          if (gate.type === 'AND' && inValues.length === 2) output = inValues[0] && inValues[1];
          if (gate.type === 'OR' && inValues.length === 2) output = inValues[0] || inValues[1];
          if (gate.type === 'NOT' && inValues.length === 1) output = inValues[0] === 0 ? 1 : 0;

          if (output !== undefined && gateValues[gate.id] !== output) {
            gateValues[gate.id] = output;
            resolved.add(gate.id);
            changed = true;
          }
        });

        const ledWire = state.wires.find(w => w.toId === 'out-LED');
        if (ledWire && gateValues[ledWire.fromId] !== undefined) {
          gateValues['out-LED'] = gateValues[ledWire.fromId];
        }
      }

      const actual = gateValues['out-LED'] ?? 0;
      const expected = state.problem.targetTruthTable[i];
      if (actual !== expected) allMatch = false;
      results.push({ i, actual, expected });
    }

    if (allMatch) {
      setTestResult({ success: true, message: "Perfect! The circuit logic matches the target truth table." });
      setIsLidOn(true);
      logEvent('simulation_success', { results });
    } else {
      setTestResult({ success: false, message: "Logic Mismatch. The LED behavior doesn't match the required truth table. Discuss with your partner where the signal path might be wrong." });
      setIsLidOn(false);
      logEvent('simulation_error', { results, error: 'Logic Mismatch' });
    }
  };

  const handleFinalSubmit = () => {
    updateState({ stage: 'finished', isComplete: true });
    logEvent('final_submission', { success: true });
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
        <div className="flex gap-2 pointer-events-auto">
          <Button size="lg" onClick={runSimulation} className="bg-primary hover:bg-primary/90 font-bold shadow-xl gap-2">
            <Play className="w-4 h-4" /> TEST CIRCUIT
          </Button>
          {testResult?.success && (
            <Button size="lg" onClick={handleFinalSubmit} className="bg-green-600 hover:bg-green-700 font-bold shadow-xl gap-2">
              <CheckCircle2 className="w-4 h-4" /> FINISH TASK
            </Button>
          )}
        </div>
        
        {testResult && (
          <Alert className={`${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} shadow-lg pointer-events-auto animate-in slide-in-from-top-4`}>
            {testResult.success ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />}
            <AlertTitle className={`text-xs font-bold uppercase tracking-wider ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {testResult.success ? 'Success' : 'Correction Needed'}
            </AlertTitle>
            <AlertDescription className="text-[11px] leading-relaxed text-slate-600">
              {testResult.message}
            </AlertDescription>
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
              strokeWidth="4"
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
          className={`absolute group shadow-lg border-2 rounded-lg transition-all ${
            comp.userId === 0 ? 'border-slate-400 bg-slate-100' :
            comp.userId === 1 ? 'border-red-400/50' : 'border-blue-400/50'
          } ${
            comp.type === 'AND' ? 'gate-and' : comp.type === 'OR' ? 'gate-or' : 
            comp.type === 'NOT' ? 'gate-not' : 'bg-white'
          } ${comp.type === 'LED' && isLidOn ? 'ring-4 ring-yellow-400 shadow-yellow-200' : ''}`}
          style={{ top: comp.y, left: comp.x, width: `${GATE_WIDTH}px`, height: `${GATE_HEIGHT}px` }}
        >
          <div 
            className={`h-1/3 w-full flex items-center justify-between px-2 ${comp.userId === 0 ? 'bg-slate-200' : 'bg-black/20'} cursor-grab active:cursor-grabbing text-slate-800`}
            onMouseDown={() => setDraggingCompId(comp.id)}
          >
            <span className="text-[8px] font-bold opacity-70">
              {comp.userId === 0 ? 'FIXED' : `U${comp.userId}`}
            </span>
            {comp.userId !== 0 && <MousePointer2 className="w-2 h-2 opacity-50" />}
          </div>

          <div className={`h-2/3 flex flex-col items-center justify-center ${comp.userId === 0 ? 'text-slate-800' : 'text-white'}`}>
             <span className="font-black text-xs tracking-widest">{comp.type}</span>
             {comp.label && <span className="text-[10px] font-bold opacity-70">{comp.label}</span>}
             {comp.type === 'LED' && <Lightbulb className={`w-4 h-4 mt-1 ${isLidOn ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400'}`} />}
          </div>

          {/* Pin Buttons */}
          {(comp.type !== 'LED') && (
            <button 
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full bg-slate-800 border-2 border-white hover:scale-125 transition-transform z-20"
              onClick={(e) => { e.stopPropagation(); handlePinClick(comp.id, 0, 'out'); }}
            />
          )}

          {(comp.type !== 'INPUT') && (
            (comp.type === 'NOT' || comp.type === 'LED' ? [0] : [0, 1]).map((pinIdx) => {
              const inputCount = comp.type === 'NOT' || comp.type === 'LED' ? 1 : 2;
              const spacing = GATE_HEIGHT / (inputCount + 1);
              return (
                <button 
                  key={pinIdx}
                  className="absolute left-0 w-5 h-5 rounded-full bg-slate-800 border-2 border-white hover:scale-125 transition-transform z-20 -translate-x-1/2"
                  style={{ top: spacing * (pinIdx + 1) }}
                  onClick={(e) => { e.stopPropagation(); handlePinClick(comp.id, pinIdx, 'in'); }}
                />
              );
            })
          )}
        </div>
      ))}
    </div>
  );
}
