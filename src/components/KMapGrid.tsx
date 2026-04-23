
"use client";

import React, { useState, useRef } from 'react';
import { GameState, KMapGrouping } from '@/hooks/useGameState';
import { X, MousePointer2, Info, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface KMapGridProps {
  state: GameState;
  updateState: (updates: Partial<GameState>) => void;
  logEvent: (type: string, data: any) => void;
  activeUserId?: number; 
  readOnly?: boolean;
}

export default function KMapGrid({ state, updateState, logEvent, activeUserId, readOnly = false }: KMapGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Grey code order for K-map axes
  const greyOrder = [0, 1, 3, 2];
  
  const getCellIndex = (r: number, c: number) => {
    const rowGrey = greyOrder[r];
    const colGrey = greyOrder[c];
    return (rowGrey << 2) | colGrey;
  };

  // Multi-touch selection tracking
  const [activeSelections, setActiveSelections] = useState<Record<number, { start: {row: number, col: number}, current: {row: number, col: number} }>>({});

  const handleCellClick = (r: number, c: number) => {
    if (readOnly || state.kmapSubStage !== 'fill') return;
    
    const idx = getCellIndex(r, c);
    const currentVal = state.userKMapValues[idx];
    
    let newVal;
    if (currentVal === -1) newVal = 0;
    else if (currentVal === 0) newVal = 1;
    else if (currentVal === 1) newVal = 2; // Don't care
    else newVal = 0;

    const newKMapValues = [...state.userKMapValues];
    newKMapValues[idx] = newVal;
    updateState({ userKMapValues: newKMapValues });
    logEvent('kmap_value_toggle', { userId: activeUserId, row: r, col: c, value: newVal });
  };

  const getCellFromPointer = (e: React.PointerEvent) => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.max(0, Math.min(3, Math.floor((x / rect.width) * 4)));
    const row = Math.max(0, Math.min(3, Math.floor((y / rect.height) * 4)));
    return { row, col };
  };

  const handlePointerDown = (e: React.PointerEvent, r: number, c: number) => {
    if (readOnly || state.kmapSubStage !== 'group') return;
    
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    setActiveSelections(prev => ({
      ...prev,
      [e.pointerId]: { start: { row: r, col: c }, current: { row: r, col: c } }
    }));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (readOnly || state.kmapSubStage !== 'group') return;
    const selection = activeSelections[e.pointerId];
    if (!selection) return;

    const cell = getCellFromPointer(e);
    if (cell && (selection.current.row !== cell.row || selection.current.col !== cell.col)) {
      setActiveSelections(prev => ({
        ...prev,
        [e.pointerId]: { ...selection, current: cell }
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const selection = activeSelections[e.pointerId];
    if (!selection || readOnly || state.kmapSubStage !== 'group') {
      setActiveSelections(prev => {
        const next = { ...prev };
        delete next[e.pointerId];
        return next;
      });
      return;
    }
    
    const cell = getCellFromPointer(e) || selection.current;
    
    const minRow = Math.min(selection.start.row, cell.row);
    const maxRow = Math.max(selection.start.row, cell.row);
    const minCol = Math.min(selection.start.col, cell.col);
    const maxCol = Math.max(selection.start.col, cell.col);

    const cells = [];
    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
        cells.push({ row: i, col: j });
      }
    }

    const size = cells.length;
    const isPowerOfTwo = (size & (size - 1)) === 0 && size > 0;

    if (isPowerOfTwo) {
      const newGrouping: KMapGrouping = {
        id: Math.random().toString(36).substr(2, 9),
        userId: activeUserId || 1,
        cells
      };

      updateState({ userGroupings: [...state.userGroupings, newGrouping] });
      logEvent('group_creation', { userId: activeUserId, cells, size });
    }

    setActiveSelections(prev => {
      const next = { ...prev };
      delete next[e.pointerId];
      return next;
    });
  };

  const removeGrouping = (id: string) => {
    if (readOnly) return;
    updateState({ userGroupings: state.userGroupings.filter(g => g.id !== id) });
    logEvent('group_deletion', { groupId: id });
  };

  return (
    <div 
      className="flex flex-col items-center space-y-4 select-none touch-none w-full max-w-2xl mx-auto" 
      onContextMenu={(e) => e.preventDefault()}
    >
      {state.kmapSubStage === 'group' && (
        <div className="w-full animate-in slide-in-from-top-4 duration-500">
          <Alert className="bg-primary border-4 border-primary/20 shadow-2xl rounded-[2rem] text-white p-6">
            <Layers className="h-8 w-8 text-white" />
            <div className="ml-4">
              <AlertTitle className="text-xl font-black uppercase tracking-tighter">Phase 2: Grouping Active</AlertTitle>
              <AlertDescription className="text-sm font-bold opacity-90 mt-1">
                Drag your finger over the '1's in the grid to create groups.
              </AlertDescription>
            </div>
          </Alert>
        </div>
      )}

      <div className="flex space-x-8 py-2">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-400 opacity-50 border-2 border-red-500 rounded"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">P1 Groups</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-400 opacity-50 border-2 border-blue-500 rounded"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">P2 Groups</span>
        </div>
      </div>
      
      <div className="relative p-10 bg-slate-100/50 border-4 border-slate-200 rounded-[3rem] shadow-inner">
        <div className="absolute left-0 top-10 bottom-10 flex flex-col justify-around text-[10px] font-black font-mono -translate-x-full pr-4 text-slate-400">
          <span>AB=00</span><span>01</span><span>11</span><span>10</span>
        </div>
        <div className="absolute top-0 left-10 right-10 flex justify-around text-[10px] font-black font-mono -translate-y-full pb-4 text-slate-400">
          <span>CD=00</span><span>01</span><span>11</span><span>10</span>
        </div>

        <div 
          ref={gridRef}
          className="grid grid-cols-4 gap-0 border-[6px] border-slate-400 bg-white shadow-2xl overflow-hidden rounded-2xl touch-none"
          onPointerMove={handlePointerMove}
        >
          {Array.from({ length: 4 }).map((_, r) => (
            Array.from({ length: 4 }).map((_, c) => {
              const idx = getCellIndex(r, c);
              const val = state.userKMapValues[idx];
              return (
                <div 
                  key={`${r}-${c}`}
                  className={`w-16 h-16 border border-slate-200 flex items-center justify-center text-xl font-black font-mono transition-colors relative z-10 ${
                    state.kmapSubStage === 'fill' ? 'hover:bg-amber-50 cursor-pointer' : 'cursor-crosshair'
                  }`}
                  onPointerDown={(e) => state.kmapSubStage === 'fill' ? handleCellClick(r, c) : handlePointerDown(e, r, c)}
                  onPointerUp={handlePointerUp}
                >
                  {val === -1 ? '?' : val === 2 ? 'X' : val}
                </div>
              )
            })
          ))}
        </div>

        <div className="absolute inset-10 pointer-events-none">
          {Object.entries(activeSelections).map(([ptrId, selection]) => {
            const minRow = Math.min(selection.start.row, selection.current.row);
            const maxRow = Math.max(selection.start.row, selection.current.row);
            const minCol = Math.min(selection.start.col, selection.current.col);
            const maxCol = Math.max(selection.start.col, selection.current.col);
            
            return (
              <div 
                key={`selection-${ptrId}`}
                className="absolute border-4 border-dashed border-primary bg-primary/10 rounded-md pointer-events-none z-20"
                style={{
                  top: `${minRow * 25}%`,
                  left: `${minCol * 25}%`,
                  width: `${(maxCol - minCol + 1) * 25}%`,
                  height: `${(maxRow - minRow + 1) * 25}%`,
                }}
              />
            );
          })}
          
          {state.userGroupings.map((g) => {
            const minRow = Math.min(...g.cells.map(c => c.row));
            const maxRow = Math.max(...g.cells.map(c => c.row));
            const minCol = Math.min(...g.cells.map(c => c.col));
            const maxCol = Math.max(...g.cells.map(c => c.col));
            
            const style = {
              top: `${minRow * 25}%`,
              left: `${minCol * 25}%`,
              width: `${(maxCol - minCol + 1) * 25}%`,
              height: `${(maxRow - minRow + 1) * 25}%`,
            };

            return (
              <div 
                key={g.id}
                className={`absolute border-2 rounded-lg flex items-start justify-end p-1 pointer-events-auto group ${
                  g.userId === 1 ? 'bg-red-500/20 border-red-500' : 'bg-blue-500/20 border-blue-500'
                }`}
                style={style}
              >
                {!readOnly && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeGrouping(g.id); }}
                    className="w-5 h-5 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {state.kmapSubStage === 'group' && !readOnly && (
        <div className="flex flex-col items-center gap-4 w-full">
           <div className="flex items-center gap-4 px-8 py-4 bg-amber-50 border-2 border-amber-200 rounded-[2rem] shadow-sm animate-pulse">
              <div className="bg-amber-100 p-2 rounded-xl">
                <MousePointer2 className="w-6 h-6 text-amber-700" />
              </div>
              <p className="text-sm font-black text-amber-900 uppercase tracking-tight">
                Identify Optimal Groups: Drag across adjacent '1's
              </p>
           </div>
           
           <div className="flex gap-4 w-full px-4">
            <div className="flex-1 flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 text-slate-500">
              <Info className="w-5 h-5 shrink-0" />
              <p className="text-[10px] font-bold leading-tight uppercase">
                Rules: Groups must be rectangles of size 1, 2, 4, or 8.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => updateState({ userGroupings: [] })}
              className="px-6 rounded-xl border-2 border-red-100 text-red-600 font-black hover:bg-red-50 hover:border-red-200"
            >
              CLEAR GROUPS
            </Button>
           </div>
        </div>
      )}
    </div>
  );
}
