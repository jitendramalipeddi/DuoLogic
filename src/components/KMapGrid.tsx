
"use client";

import React, { useState, useRef } from 'react';
import { GameState, KMapGrouping } from '@/hooks/useGameState';
import { X, MousePointer2, Info, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KMapGridProps {
  state: GameState;
  updateState: (updates: Partial<GameState>) => void;
  logEvent: (type: string, data: any) => void;
  activeUserId?: number; 
  readOnly?: boolean;
}

export default function KMapGrid({ state, updateState, logEvent, activeUserId, readOnly = false }: KMapGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  
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
    
    // Prevent default to stop context menus/selection
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    setSelectionStart({ row: r, col: c });
    setCurrentHover({ row: r, col: c });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!selectionStart || readOnly || state.kmapSubStage !== 'group') return;
    
    const cell = getCellFromPointer(e);
    if (cell && (!currentHover || currentHover.row !== cell.row || currentHover.col !== cell.col)) {
      setCurrentHover(cell);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!selectionStart || readOnly || state.kmapSubStage !== 'group') {
      setSelectionStart(null);
      setCurrentHover(null);
      return;
    }
    
    const cell = getCellFromPointer(e) || currentHover || selectionStart;
    
    const minRow = Math.min(selectionStart.row, cell.row);
    const maxRow = Math.max(selectionStart.row, cell.row);
    const minCol = Math.min(selectionStart.col, cell.col);
    const maxCol = Math.max(selectionStart.col, cell.col);

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
    <div 
      className="flex flex-col items-center space-y-6 select-none touch-none" 
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex space-x-8">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-red-400 opacity-50 border-2 border-red-500 rounded"></div>
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">P1 Groups</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-blue-400 opacity-50 border-2 border-blue-500 rounded"></div>
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">P2 Groups</span>
        </div>
      </div>
      
      <div className="relative p-12 bg-slate-100/50 border-4 border-slate-200 rounded-3xl shadow-inner">
        <div className="absolute left-0 top-12 bottom-12 flex flex-col justify-around text-xs font-black font-mono -translate-x-full pr-6 text-slate-400">
          <span>AB=00</span><span>01</span><span>11</span><span>10</span>
        </div>
        <div className="absolute top-0 left-12 right-12 flex justify-around text-xs font-black font-mono -translate-y-full pb-6 text-slate-400">
          <span>CD=00</span><span>01</span><span>11</span><span>10</span>
        </div>

        <div 
          ref={gridRef}
          className="grid grid-cols-4 gap-0 border-[6px] border-slate-400 bg-white shadow-2xl overflow-hidden rounded-lg touch-none"
          onPointerMove={handlePointerMove}
        >
          {Array.from({ length: 4 }).map((_, r) => (
            Array.from({ length: 4 }).map((_, c) => {
              const idx = getCellIndex(r, c);
              const val = state.userKMapValues[idx];
              return (
                <div 
                  key={`${r}-${c}`}
                  className={`w-20 h-20 border border-slate-200 flex items-center justify-center text-2xl font-black font-mono transition-colors relative z-10 ${
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

        <div className="absolute inset-12 pointer-events-none">
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
                    className="w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {state.kmapSubStage === 'group' && !readOnly && (
        <div className="flex flex-col items-center gap-4 mt-2">
           <div className="flex items-center gap-3 px-6 py-3 bg-amber-100 border-2 border-amber-300 rounded-2xl text-amber-800 text-sm font-bold animate-pulse">
              <MousePointer2 className="w-5 h-5" />
              DRAG OVER CELLS TO GROUP (POWERS OF 2 ONLY: 1, 2, 4, 8)
           </div>
           
           <div className="flex gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl border-2 border-slate-200">
              <Layout className="w-4 h-4 text-slate-500" />
              <span className="text-[11px] font-bold text-slate-600 uppercase">Tip: Groups can wrap around edges</span>
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
        </div>
      )}
    </div>
  );
}
