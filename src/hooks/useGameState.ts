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

export interface WireConnection {
  id: string;
  fromId: string;
  fromPin: number; // 0 for output
  toId: string;
  toPin: number; // 0, 1 for inputs
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
  stageHistory: GameStage[];
  problem: LogicProblem | null;
  accepted: { [key: number]: boolean };
  userTruthTable: number[]; // 16 entries, 0 or 1. -1 if not set.
  userGroupings: KMapGrouping[];
  expressions: { [key: number]: string };
  discussionPrompts: string[];
  circuitComponents: CircuitComponent[];
  wires: WireConnection[];
}

const initialState: GameState = {
  stage: 'intro',
  stageHistory: [],
  problem: null,
  accepted: { 1: false, 2: false },
  userTruthTable: new Array(16).fill(-1),
  userGroupings: [],
  expressions: { 1: '', 2: '' },
  discussionPrompts: [],
  circuitComponents: [],
  wires: [],
};

const STAGE_ORDER: GameStage[] = ['intro', 'truth_table', 'kmap', 'equation', 'discussion', 'simulator'];

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState);

  const updateState = useCallback((updates: Partial<GameState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      // If stage changed, handle history
      if (updates.stage && updates.stage !== prev.stage) {
        newState.stageHistory = [...prev.stageHistory, prev.stage];
      }
      return newState;
    });
  }, []);

  const goBack = useCallback(() => {
    setState(prev => {
      if (prev.stageHistory.length === 0) return prev;
      const newHistory = [...prev.stageHistory];
      const lastStage = newHistory.pop()!;
      return { ...prev, stage: lastStage, stageHistory: newHistory };
    });
  }, []);

  const logEvent = useCallback((type: string, data: any) => {
    console.log(`[LOG] ${type}:`, data);
  }, []);

  return { state, updateState, goBack, logEvent };
}
