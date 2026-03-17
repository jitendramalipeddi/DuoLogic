"use client";

import React, { useState, useRef } from 'react';
import { GameState, KMapGrouping } from '@/hooks/useGameState';

interface KMapGridProps {
  state: GameState;
  updateState: (updates: Partial<GameState>) => void;
  logEvent: (type: string, data: any) => void;
}

export default function KMapGrid({ state, updateState, logEvent }: KMapGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Grey code indices for 4-variable K-map (00, 01, 11, 10)
  const greyOrder = [0, 1, 3, 2];
  
  const getCellIndex = (r: number, c: number) => {
    // Map grid row/col to binary input index
    // Rows: AB, Cols: CD
    const rowGrey = greyOrder[r];
    const colGrey = greyOrder[c];
    return (rowGrey << 2) | colGrey;
  };

  const [selectionStart, setSelectionStart] = useState<{row: number, col: number} | null>(null);

  const handleTouchStart = (r: number, c: number) => {
     setSelectionStart({ row: r, col: c });
  };

  const handleTouchEnd = (r: number, c: number) => {
    if (!selectionStart) return;
    
    // Create grouping from start to end (simplified to rectangle)
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

    const newGrouping: KMapGrouping = {
      id: Math.random().toString(),
      userId: 1, // Logic would normally detect which user touched, for demo we alternate or assign
      cells
    };

    updateState({ userGroupings: [...state.userGroupings, newGrouping] });
    logEvent('touch_event', { start: selectionStart, end: {r, c}, type: 'group_creation' });
    setSelectionStart(null);
  };

  return (
    <div className="flex flex-col items-center space-y-4 select-none">
      <div className="flex space-x-8">
        <div className="flex items-center space-x-2"><div className="w-4 h-4 bg-red-400 opacity-50 border-2 border-red-500 rounded"></div><span className="text-xs">U1 Groups</span></div>
        <div className="flex items-center space-x-2"><div className="w-4 h-4 bg-blue-400 opacity-50 border-2 border-blue-500 rounded"></div><span className="text-xs">U2 Groups</span></div>
      </div>
      
      <div className="relative p-8 bg-gray-50 border-2 border-gray-200 rounded-xl shadow-inner" ref={containerRef}>
        {/* Row labels */}
        <div className="absolute left-0 top-8 bottom-8 flex flex-col justify-around text-xs font-mono -translate-x-full pr-2">
          <span>AB=00</span><span>01</span><span>11</span><span>10</span>
        </div>
        {/* Col labels */}
        <div className="absolute top-0 left-8 right-8 flex justify-around text-xs font-mono -translate-y-full pb-2">
          <span>CD=00</span><span>01</span><span>11</span><span>10</span>
        </div>

        <div className="grid grid-cols-4 gap-0 border-2 border-gray-400 bg-white">
          {Array.from({ length: 4 }).map((_, r) => (
            Array.from({ length: 4 }).map((_, c) => {
              const idx = getCellIndex(r, c);
              const val = state.userTruthTable[idx];
              return (
                <div 
                  key={`${r}-${c}`}
                  className="w-16 h-16 border border-gray-200 flex items-center justify-center text-xl font-bold font-mono hover:bg-muted/30 cursor-crosshair relative z-10"
                  onMouseDown={() => handleTouchStart(r, c)}
                  onMouseUp={() => handleTouchEnd(r, c)}
                >
                  {val === -1 ? '?' : val}
                </div>
              );
            })
          ))}
        </div>

        {/* Grouping Overlays */}
        <div className="absolute inset-8 pointer-events-none">
          {state.userGroupings.map((g, i) => {
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
                className={`absolute border-2 rounded ${g.userId === 1 ? 'bg-red-400/30 border-red-500' : 'bg-blue-400/30 border-blue-500'}`}
                style={style}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
