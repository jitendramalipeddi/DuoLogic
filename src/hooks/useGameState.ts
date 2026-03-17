"use client";

import { useState, useCallback } from 'react';

export type GameStage = 'intro' | 'truth_table' | 'kmap' | 'equation' | 'discussion' | 'simulator';

export interface LogicProblem {
  variables: string[];
  description: string;
  targetTruthTable: number[];
}

export interface KMapGrouping {
  id: string;
  userId: number;
  cells: { row: number; col: number }[];
}

export interface CircuitComponent {
  id: string;
  type: 'AND' | 'OR' | 'NOT';
  userId: number;
  x: number;
  y: number;
}

export interface GameState {
  stage: GameStage;
  problem: LogicProblem | null;
  accepted: { [key: number]: boolean };
  userTruthTable: number[]; // 16 entries, 0 or 1. -1 if not set.
  userGroupings: KMapGrouping[];
  expressions: { [key: number]: string };
  discussionPrompts: string[];
  circuitComponents: CircuitComponent[];
}

const initialState: GameState = {
  stage: 'intro',
  problem: null,
  accepted: { 1: false, 2: false },
  userTruthTable: new Array(16).fill(-1),
  userGroupings: [],
  expressions: { 1: '', 2: '' },
  discussionPrompts: [],
  circuitComponents: [],
};

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState);

  const updateState = useCallback((updates: Partial<GameState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const logEvent = useCallback((type: string, data: any) => {
    console.log(`[LOG] ${type}:`, data);
    // In a real app, this would write to Firestore collection 'events'
  }, []);

  return { state, updateState, logEvent };
}
