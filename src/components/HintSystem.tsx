"use client";

import React from 'react';
import { GameState, GameStage } from '@/hooks/useGameState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, ChevronRight, HelpCircle } from 'lucide-react';

interface HintSystemProps {
  state: GameState;
  updateState: (updates: Partial<GameState>) => void;
  logEvent: (type: string, data: any) => void;
}

export default function HintSystem({ state, updateState, logEvent }: HintSystemProps) {
  const currentStage = state.stage;
  const hintLevel = state.hintLevels[currentStage] || 0;
  
  // Mapping stages to hint keys in the problem object
  const stageToHintKey: Record<string, keyof NonNullable<GameState['problem']>['hints']> = {
    'truth_table': 'truth_table',
    'kmap': 'kmap',
    'equation': 'equation',
    'discussion': 'equation', // Share hints with equation stage
    'simulator': 'simulator'
  };

  const hintKey = stageToHintKey[currentStage];
  const stageHints = state.problem?.hints?.[hintKey];

  if (!stageHints || currentStage === 'intro' || currentStage === 'finished') {
    return null;
  }

  const handleNextHint = () => {
    const nextLevel = Math.min(hintLevel + 1, 3);
    const newHintLevels = { ...state.hintLevels, [currentStage]: nextLevel };
    updateState({ hintLevels: newHintLevels });
    logEvent('hint_requested', { stage: currentStage, level: nextLevel });
  };

  const getHintContent = () => {
    if (hintLevel === 1) return stageHints.level1;
    if (hintLevel === 2) return stageHints.level2;
    if (hintLevel === 3) return stageHints.level3;
    return null;
  };

  const hintContent = getHintContent();

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-600">
          <Lightbulb className="w-5 h-5 fill-current" />
          <h4 className="font-black text-xs uppercase tracking-widest">Learning Support</h4>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleNextHint}
          disabled={hintLevel >= 3}
          className="h-8 gap-2 rounded-lg border-2 border-amber-200 text-amber-700 hover:bg-amber-50 font-bold"
        >
          {hintLevel === 0 ? 'GET HINT' : `NEXT HINT (${hintLevel}/3)`}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {hintLevel > 0 && hintContent && (
        <Card className="border-2 border-amber-100 bg-amber-50/30 overflow-hidden animate-in slide-in-from-top-2">
          <CardContent className="p-4 flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <span className="text-amber-700 font-black text-sm">{hintLevel}</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase text-amber-800 tracking-tight">
                Level {hintLevel} {hintLevel === 3 ? 'Scaffolding' : 'Hint'}
              </p>
              <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                "{hintContent}"
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
