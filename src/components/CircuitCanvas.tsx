"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GameState, CircuitComponent, WireConnection } from '@/hooks/useGameState';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Zap, Play, CheckCircle2, AlertTriangle, Lightbulb, X } from 'lucide-react';

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
  const [simulatedLedOutput, setSimulatedLedOutput] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (draggingCompId) {
      const comp = state.circuitComponents.find(c => c.id === draggingCompId);
      // Allow dragging any component that isn't a primary fixed input
      if (comp && comp.type !== 'INPUT') {
        const newComps = state.circuitComponents.map(c => 
          c.id === draggingCompId ? { ...c, x: x - GATE_WIDTH/2, y: y - GATE_HEIGHT/2 } : c
        );
        updateState({ circuitComponents: newComps });
      }
    }
  };

  const startWiring = (e: React.PointerEvent, id: string, pin: number, type: 'in' | 'out') => {
    e.stopPropagation();
    setWireStart({ id, pin, type });
    logEvent('wire_start', { id, pin, type });
  };

  const endWiring = (e: React.PointerEvent, id: string, pin: number, type: 'in' | 'out') => {
    e.stopPropagation();
    if (wireStart && wireStart.id !== id && wireStart.type !== type) {
      const from = wireStart.type === 'out' ? wireStart : { id, pin, type };
      const to = wireStart.type === 'in' ? wireStart : { id, pin, type };
      
      const newWire: WireConnection = {
        id: `wire-${Math.random().toString(36).substr(2, 9)}`,
        fromId: from.id,
        fromPin: from.pin,
        toId: to.id,
        toPin: to.pin
      };

      const filteredWires = state.wires.filter(w => !(w.toId === to.id && w.toPin === to.pin));
      updateState({ wires: [...filteredWires, newWire] });
      logEvent('wire_connect', { fromId: from.id, toId: to.id });
    }
    setWireStart(null);
  };

  const getPinPos = (compId: string, pinIndex: number, type: 'in' | 'out') => {
    const comp = state.circuitComponents.find(c => c.id === compId);
    if (!comp) return { x: 0, y: 0 };

    if (type === 'out') {
      return { x: comp.x + GATE_WIDTH, y: comp.y + GATE_HEIGHT / 2 };
    } else {
      const inputCount = comp.type === 'NOT' || comp.type === 'LED' ? 1 : 2;
      const spacing = GATE_HEIGHT / (inputCount + 1);
      return { x: comp.x, y: comp.y + spacing * (pinIndex + 1) };
    }
  };

  const deleteWire = (wireId: string) => {
    updateState({ wires: state.wires.filter(w => w.id !== wireId) });
    logEvent('wire_delete', { wireId });
  };

  const runSimulation = () => {
    if (!state.problem) return;
    
    let allMatch = true;
    const failures = [];

    for (let i = 0; i < 16; i++) {
      const inputs = {
        'in-A': (i >> 3) & 1,
        'in-B': (i >> 2) & 1,
        'in-C': (i >> 1) & 1,
        'in-D': (i >> 0) & 1,
      };

      const gateValues: Record<string, number> = { ...inputs };
      let changed = true;
      let iterations = 0;

      while (changed && iterations < 30) {
        changed = false;
        iterations++;

        state.circuitComponents.forEach(gate => {
          if (gate.type === 'INPUT' || gate.type === 'LED') return;
          
          const inWires = state.wires.filter(w => w.toId === gate.id);
          const inValues = inWires.map(w => gateValues[w.fromId]);

          let output: number | undefined;
          if (gate.type === 'AND' && inValues.length === 2 && inValues.every(v => v !== undefined)) 
            output = inValues[0] && inValues[1];
          if (gate.type === 'OR' && inValues.length === 2 && inValues.every(v => v !== undefined)) 
            output = inValues[0] || inValues[1];
          if (gate.type === 'NOT' && inValues.length === 1 && inValues[0] !== undefined) 
            output = inValues[0] === 0 ? 1 : 0;

          if (output !== undefined && gateValues[gate.id] !== output) {
            gateValues[gate.id] = output;
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
      if (actual !== expected) {
        allMatch = false;
        failures.push(i);
      }
    }

    if (allMatch) {
      setTestResult({ success: true, message: "Perfect! Your circuit design matches the required logic. Click FINISH TASK to submit." });
      setSimulatedLedOutput(1);
      logEvent('simulation_success', { totalTests: 16 });
    } else {
      setTestResult({ success: false, message: `The circuit logic is incorrect for ${failures.length} combinations (e.g., input row ${failures[0]}). Discuss with your partner to identify the missing gates or wrong connections.` });
      setSimulatedLedOutput(0);
      logEvent('simulation_error', { failureCount: failures.length, failures });
    }
  };

  const handleFinalSubmit = () => {
    updateState({ stage: 'finished', isComplete: true });
    logEvent('final_submission', { success: true });
  };

  return (
    <div 
      className="relative h-full w-full bg-slate-50 rounded-xl border-2 border-slate-200 overflow-hidden touch-none"
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={() => { setDraggingCompId(null); setWireStart(null); }}
      onPointerLeave={() => { setDraggingCompId(null); setWireStart(null); }}
    >
      <div className="absolute top-4 left-4 z-40 flex flex-col gap-3 max-w-sm">
        <div className="flex gap-2">
          <Button size="lg" onClick={runSimulation} className="bg-primary hover:bg-primary/90 font-bold shadow-xl gap-2 h-14 px-6 text-lg">
            <Play className="w-5 h-5 fill-current" /> TEST CIRCUIT
          </Button>
          {testResult?.success && (
            <Button size="lg" onClick={handleFinalSubmit} className="bg-green-600 hover:bg-green-700 font-bold shadow-xl gap-2 h-14 px-6 text-lg animate-bounce">
              <CheckCircle2 className="w-5 h-5" /> FINISH TASK
            </Button>
          )}
        </div>
        
        {testResult && (
          <Alert className={`${testResult.success ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} shadow-lg animate-in slide-in-from-top-2`}>
            {testResult.success ? <CheckCircle2 className="h-5 w-5 text-green-700" /> : <AlertTriangle className="h-5 w-5 text-red-700" />}
            <AlertTitle className={`font-black uppercase tracking-widest text-xs ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
              {testResult.success ? 'Verification Success' : 'Logical Error'}
            </AlertTitle>
            <AlertDescription className="text-xs font-medium leading-relaxed opacity-80">
              {testResult.message}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orientation="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
          </marker>
        </defs>
        {state.wires.map(wire => {
          const start = getPinPos(wire.fromId, wire.fromPin, 'out');
          const end = getPinPos(wire.toId, wire.toPin, 'in');
          return (
            <g key={wire.id} className="pointer-events-auto cursor-pointer group">
              <path 
                d={`M ${start.x} ${start.y} C ${start.x + 40} ${start.y}, ${end.x - 40} ${end.y}, ${end.x} ${end.y}`}
                stroke="#3b82f6"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                className="hover:stroke-red-400 transition-colors"
                onClick={() => deleteWire(wire.id)}
              />
              <path 
                d={`M ${start.x} ${start.y} C ${start.x + 40} ${start.y}, ${end.x - 40} ${end.y}, ${end.x} ${end.y}`}
                stroke="white"
                strokeWidth="2"
                fill="none"
                opacity="0.3"
              />
            </g>
          );
        })}
        {wireStart && (
          <path 
            d={`M ${getPinPos(wireStart.id, wireStart.pin, wireStart.type).x} ${getPinPos(wireStart.id, wireStart.pin, wireStart.type).y} L ${mousePos.x} ${mousePos.y}`}
            stroke="#94a3b8"
            strokeWidth="3"
            strokeDasharray="8,4"
            fill="none"
          />
        )}
      </svg>

      {state.circuitComponents.map((comp) => (
        <div 
          key={comp.id}
          className={`absolute group shadow-xl border-2 rounded-xl transition-all select-none ${
            comp.userId === 0 ? 'border-slate-400 bg-slate-100' :
            comp.userId === 1 ? 'border-red-500/50' : 'border-blue-500/50'
          } ${
            comp.type === 'AND' ? 'gate-and' : comp.type === 'OR' ? 'gate-or' : 
            comp.type === 'NOT' ? 'gate-not' : 'bg-white'
          } ${comp.type === 'LED' && simulatedLedOutput === 1 ? 'ring-8 ring-yellow-400 shadow-yellow-300' : ''}`}
          style={{ top: comp.y, left: comp.x, width: `${GATE_WIDTH}px`, height: `${GATE_HEIGHT}px` }}
        >
          <div 
            className={`h-1/3 w-full flex items-center justify-between px-3 rounded-t-xl ${comp.userId === 0 ? 'bg-slate-300' : 'bg-black/30'} cursor-grab active:cursor-grabbing text-slate-800`}
            onPointerDown={(e) => { e.stopPropagation(); if(comp.type !== 'INPUT') setDraggingCompId(comp.id); }}
          >
            <span className="text-[10px] font-black tracking-widest opacity-80">
              {comp.userId === 0 ? 'FIXED' : `P${comp.userId}`}
            </span>
            <Zap className="w-3 h-3 opacity-50" />
          </div>

          <div className={`h-2/3 flex flex-col items-center justify-center ${comp.userId === 0 ? 'text-slate-800' : 'text-white'}`}>
             <span className="font-black text-sm tracking-widest">{comp.type}</span>
             {comp.label && <span className="text-[10px] font-bold opacity-80">{comp.label}</span>}
             {comp.type === 'LED' && <Lightbulb className={`w-5 h-5 mt-1 transition-colors ${simulatedLedOutput === 1 ? 'text-yellow-400 fill-yellow-400' : 'text-slate-400'}`} />}
          </div>

          {(comp.type !== 'LED') && (
            <div 
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 flex items-center justify-center z-30"
              onPointerDown={(e) => startWiring(e, comp.id, 0, 'out')}
              onPointerUp={(e) => endWiring(e, comp.id, 0, 'out')}
            >
              <div className="w-4 h-4 rounded-full bg-slate-900 border-2 border-white group-hover:scale-125 transition-transform" />
            </div>
          )}

          {(comp.type !== 'INPUT') && (
            (comp.type === 'NOT' || comp.type === 'LED' ? [0] : [0, 1]).map((pinIdx) => {
              const inputCount = comp.type === 'NOT' || comp.type === 'LED' ? 1 : 2;
              const spacing = GATE_HEIGHT / (inputCount + 1);
              return (
                <div 
                  key={pinIdx}
                  className="absolute left-0 w-8 h-8 flex items-center justify-center z-30 -translate-x-1/2"
                  style={{ top: spacing * (pinIdx + 1) - 16 }}
                  onPointerDown={(e) => startWiring(e, comp.id, pinIdx, 'in')}
                  onPointerUp={(e) => endWiring(e, comp.id, pinIdx, 'in')}
                >
                  <div className="w-4 h-4 rounded-full bg-slate-900 border-2 border-white group-hover:scale-125 transition-transform" />
                </div>
              );
            })
          )}
        </div>
      ))}
    </div>
  );
}
