
"use client";

import React, { useState, useRef } from 'react';
import { GameState, KMapGrouping } from '@/hooks/useGameState';
import { X, MousePointer2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KMapGridProps {
  state: GameState;
  updateState: (updates: Partial<GameState>) => void;
  logEvent: (type: string, data: any) => void;
  activeUserId?: number; // If provided, only allow this user to interact
  readOnly?: boolean;
}

export default function KMapGrid({ state, updateState, logEvent, activeUserId, readOnly = false }: KMapGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Grey code indices for 4-variable K-map (00, 01, 11, 10)
  const greyOrder = [0, 1, 3, 2];
  
  const getCellIndex = (r: number, c: number) => {
    const rowGrey = greyOrder[r];
    const colGrey = greyOrder[c];
    return (rowGrey << 2) | colGrey;
  };

  const [selectionStart, setSelectionStart] = useState<{row: number, col: number} | null>(null);
  const [currentHover, setCurrentHover] = useState<{row: number, col: number} | null>(null);

  const handleCellClick = (r: number, c: number) => {
    if (readOnly || state.kmapSubStage !== 'fill') return;
    
    const idx = getCellIndex(r, c);
    const currentVal = state.userKMapValues[idx];
    
    // Cycle values: -1 -> 0 -> 1 -> X (2) -> -1
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

  const handlePointerDown = (r: number, c: number) => {
    if (readOnly || state.kmapSubStage !== 'group') return;
    setSelectionStart({ row: r, col: c });
    setCurrentHover({ row: r, col: c });
  };

  const handlePointerEnter = (r: number, c: number) => {
    if (selectionStart) {
      setCurrentHover({ row: r, col: c });
    }
  };

  const handlePointerUp = (r: number, c: number) => {
    if (!selectionStart || readOnly || state.kmapSubStage !== 'group') {
      setSelectionStart(null);
      setCurrentHover(null);
      return;
    }
    
    const minRow = Math.min(selectionStart.row, r);
    const maxRow = Math.max(selectionStart.row, r);
    const minCol = Math.min(selectionStart.col, c);
    const maxCol = Math.max(selectionStart.col, c);

    const cells = [];
    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
        cells.push({ row: i, col: j });
      }
    }

    // Only allow powers of 2 (1, 2, 4, 8, 16)
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

    setSelectionStart(null);
    setCurrentHover(null);
  };

  const removeGrouping = (id: string) => {
    if (readOnly) return;
    updateState({ userGroupings: state.userGroupings.filter(g => g.id !== id) });
    logEvent('group_deletion', { groupId: id });
  };

  const renderGhostSelection = () => {
    if (!selectionStart || !currentHover) return null;

    const minRow = Math.min(selectionStart.row, currentHover.row);
    const maxRow = Math.max(selectionStart.row, currentHover.row);
    const minCol = Math.min(selectionStart.col, currentHover.col);
    const maxCol = Math.max(selectionStart.col, currentHover.col);
    
    const style = {
      top: `${minRow * 25}%`,
      left: `${minCol * 25}%`,
      width: `${(maxCol - minCol + 1) * 25}%`,
      height: `${(maxRow - minRow + 1) * 25}%`,
    };

    return (
      <div 
        className="absolute border-4 border-dashed border-amber-500 bg-amber-500/10 rounded-md pointer-events-none z-20"
        style={style}
      />
    );
  };

  return (
    <div className="flex flex-col items-center space-y-4 select-none touch-none">
      <div className="flex space-x-8 mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-400 opacity-50 border-2 border-red-500 rounded"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">P1 Groups</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-400 opacity-50 border-2 border-blue-500 rounded"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">P2 Groups</span>
        </div>
      </div>
      
      <div className="relative p-10 bg-slate-100/50 border-2 border-slate-200 rounded-2xl shadow-inner" ref={containerRef}>
        {/* Row labels */}
        <div className="absolute left-0 top-10 bottom-10 flex flex-col justify-around text-[10px] font-black font-mono -translate-x-full pr-4 text-slate-400">
          <span>AB=00</span><span>01</span><span>11</span><span>10</span>
        </div>
        {/* Col labels */}
        <div className="absolute top-0 left-10 right-10 flex justify-around text-[10px] font-black font-mono -translate-y-full pb-4 text-slate-400">
          <span>CD=00</span><span>01</span><span>11</span><span>10</span>
        </div>

        <div className="grid grid-cols-4 gap-0 border-4 border-slate-400 bg-white shadow-2xl overflow-hidden rounded-sm">
          {Array.from({ length: 4 }).map((_, r) => (
            Array.from({ length: 4 }).map((_, c) => {
              const idx = getCellIndex(r, c);
              const val = state.userKMapValues[idx];
              return (
                <div 
                  key={`${r}-${c}`}
                  className={`w-16 h-16 border border-slate-200 flex items-center justify-center text-xl font-black font-mono transition-colors relative z-10 ${
                    state.kmapSubStage === 'fill' ? 'hover:bg-amber-50 cursor-pointer' : 'hover:bg-blue-50 cursor-crosshair'
                  }`}
                  onPointerDown={() => state.kmapSubStage === 'fill' ? handleCellClick(r, c) : handlePointerDown(r, c)}
                  onPointerEnter={() => handlePointerEnter(r, c)}
                  onPointerUp={() => handlePointerUp(r, c)}
                >
                  {val === -1 ? '?' : val === 2 ? 'X' : val}
                </div>
              )
            })
          ))}
        </div>

        {/* Grouping Overlays */}
        {state.kmapSubStage === 'group' && (
          <div className="absolute inset-10 pointer-events-none">
            {renderGhostSelection()}
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
                      className="w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {state.kmapSubStage === 'group' && !readOnly && (
        <div className="flex gap-4 mt-2">
           <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-xs font-bold">
              <MousePointer2 className="w-4 h-4" />
              DRAG TO SELECT BLOCKS
           </div>
           <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => updateState({ userGroupings: [] })}
            className="text-red-600 font-bold hover:bg-red-50"
           >
             CLEAR ALL GROUPS
           </Button>
        </div>
      )}
    </div>
  );
}

