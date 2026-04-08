"use client";

import React from 'react';
import { GameState } from '@/hooks/useGameState';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface TruthTableGridProps {
  state: GameState;
  compact?: boolean;
}

export default function TruthTableGrid({ state, compact = false }: TruthTableGridProps) {
  const vars = state.problem?.variables || ['A', 'B', 'C', 'D'];

  return (
    <div className={`max-h-full overflow-auto border rounded-3xl bg-white ${compact ? 'text-[10px]' : ''}`}>
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          <TableRow>
            <TableHead className={compact ? 'w-8 p-2' : 'w-16 p-4'}>Row</TableHead>
            {vars.map(v => <TableHead key={v} className="text-center p-2">{v}</TableHead>)}
            <TableHead className={`text-center font-bold text-primary ${compact ? 'p-2' : 'p-4'}`}>F</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 16 }).map((_, i) => {
            const binary = i.toString(2).padStart(4, '0').split('');
            const userVal = state.userTruthTable[i];
            
            return (
              <TableRow key={i} className={compact ? 'h-8' : ''}>
                <TableCell className={`font-mono text-muted-foreground ${compact ? 'p-2' : 'p-4'}`}>{i}</TableCell>
                {binary.map((b, idx) => (
                  <TableCell key={idx} className={`text-center font-mono ${compact ? 'p-1' : 'p-4'}`}>{b}</TableCell>
                ))}
                <TableCell className={`text-center ${compact ? 'p-1' : 'p-4'}`}>
                  <div className={`inline-flex items-center justify-center rounded-lg border-2 transition-colors ${
                    compact ? 'w-6 h-6' : 'w-10 h-10'
                  } ${
                    userVal === -1 
                      ? 'border-dashed border-slate-200' 
                      : 'border-slate-400 bg-slate-50 text-slate-900 font-bold'
                  }`}>
                    {userVal === -1 ? '' : userVal}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
