"use client";

import { useState, useCallback } from 'react';

export type GameStage = 'intro' | 'truth_table' | 'kmap' | 'equation' | 'discussion' | 'simulator' | 'finished';

export interface StageHints {
  level1: string;
  level2: string;
  level3: string;
}

export interface LogicProblem {
  variables: string[];
  description: string;
  targetTruthTable: number[];
  hints: {
    truth_table: StageHints;
    kmap: StageHints;
    equation: StageHints;
    simulator: StageHints;
  };
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
  type: 'AND' | 'OR' | 'NOT' | 'INPUT' | 'LED';
  userId: number;
  x: number;
  y: number;
  label?: string;
}

export interface LogEntry {
  timestamp: string;
  stage: GameStage;
  interactionType: string;
  details: any;
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
  logs: LogEntry[];
  isComplete: boolean;
  hintLevels: { [key in GameStage]?: number };
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
  circuitComponents: [
    { id: 'in-A', type: 'INPUT', userId: 0, x: 50, y: 50, label: 'A' },
    { id: 'in-B', type: 'INPUT', userId: 0, x: 50, y: 130, label: 'B' },
    { id: 'in-C', type: 'INPUT', userId: 0, x: 50, y: 210, label: 'C' },
    { id: 'in-D', type: 'INPUT', userId: 0, x: 50, y: 290, label: 'D' },
    { id: 'out-LED', type: 'LED', userId: 0, x: 700, y: 170, label: 'LED' },
  ],
  wires: [],
  logs: [],
  isComplete: false,
  hintLevels: {},
};

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState);

  const logEvent = useCallback((type: string, details: any) => {
    setState(prev => ({
      ...prev,
      logs: [
        ...prev.logs,
        {
          timestamp: new Date().toISOString(),
          stage: prev.stage,
          interactionType: type,
          details,
        }
      ]
    }));
  }, []);

  const updateState = useCallback((updates: Partial<GameState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
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

  return { state, updateState, goBack, logEvent };
}
