"use client";

import React from 'react';
import { GameState } from '@/hooks/useGameState';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface TruthTableGridProps {
  state: GameState;
}

export default function TruthTableGrid({ state }: TruthTableGridProps) {
  const vars = state.problem?.variables || ['A', 'B', 'C', 'D'];

  return (
    <div className="max-h-full overflow-auto border rounded-lg bg-white">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          <TableRow>
            <TableHead className="w-16">Row</TableHead>
            {vars.map(v => <TableHead key={v} className="text-center">{v}</TableHead>)}
            <TableHead className="text-center font-bold text-primary">Output (F)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 16 }).map((_, i) => {
            const binary = i.toString(2).padStart(4, '0').split('');
            const userVal = state.userTruthTable[i];
            
            return (
              <TableRow key={i}>
                <TableCell className="font-mono text-muted-foreground">{i}</TableCell>
                {binary.map((b, idx) => (
                  <TableCell key={idx} className="text-center font-mono">{b}</TableCell>
                ))}
                <TableCell className="text-center">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg border-2 transition-colors ${
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
