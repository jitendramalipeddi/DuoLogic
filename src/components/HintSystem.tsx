"use client";

import React, { useState } from 'react';
import { GameState } from '@/hooks/useGameState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, ChevronRight, ChevronLeft, EyeOff, Eye } from 'lucide-react';

interface HintSystemProps {
  state: GameState;
  updateState: (updates: Partial<GameState>) => void;
  logEvent: (type: string, data: any) => void;
}

export default function HintSystem({ state, updateState, logEvent }: HintSystemProps) {
  const currentStage = state.stage;
  const hintLevel = state.hintLevels[currentStage] || 0;
  const [isMinimized, setIsMinimized] = useState(false);
  
  const stageToHintKey: Record<string, keyof NonNullable<GameState['problem']>['hints']> = {
    'truth_table': 'truth_table',
    'kmap': 'kmap',
    'equation': 'equation',
    'discussion': 'equation',
    'simulator': 'simulator'
  };

  const hintKey = stageToHintKey[currentStage];
  const stageHints = state.problem?.hints?.[hintKey];

  if (!stageHints || currentStage === 'intro' || currentStage === 'finished') {
    return null;
  }

  const setHintLevel = (level: number) => {
    const newHintLevels = { ...state.hintLevels, [currentStage]: level };
    updateState({ hintLevels: newHintLevels });
    logEvent('hint_navigation', { stage: currentStage, level });
    if (level > 0) setIsMinimized(false);
  };

  const handleNextHint = () => {
    setHintLevel(Math.min(hintLevel + 1, 3));
  };

  const handlePrevHint = () => {
    setHintLevel(Math.max(hintLevel - 1, 0));
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
      <div className="flex items-center justify-between bg-white/50 p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-amber-600">
            <Lightbulb className="w-5 h-5 fill-current" />
            <h4 className="font-black text-xs uppercase tracking-widest">Support</h4>
          </div>
          
          {hintLevel > 0 && (
            <div className="flex items-center gap-1 border-l pl-4 border-slate-200">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handlePrevHint}
                className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-[10px] font-black text-slate-500 w-12 text-center">
                LEVEL {hintLevel}/3
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleNextHint}
                disabled={hintLevel >= 3}
                className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hintLevel > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 gap-2 text-slate-500 font-bold hover:text-primary"
            >
              {isMinimized ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {isMinimized ? 'SHOW' : 'HIDE'}
            </Button>
          )}
          
          {hintLevel === 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextHint}
              className="h-8 gap-2 rounded-lg border-2 border-amber-200 text-amber-700 hover:bg-amber-50 font-bold"
            >
              GET HINT
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {!isMinimized && hintLevel > 0 && hintContent && (
        <Card className="border-2 border-amber-100 bg-amber-50/40 overflow-hidden animate-in slide-in-from-top-2 shadow-sm">
          <CardContent className="p-4 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 shadow-sm border border-amber-200">
              <span className="text-amber-700 font-black text-lg">{hintLevel}</span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-amber-800 tracking-widest opacity-60">
                {hintLevel === 3 ? 'Direct Scaffolding' : `Level ${hintLevel} Guidance`}
              </p>
              <p className="text-sm font-bold text-slate-800 leading-relaxed italic">
                "{hintContent}"
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
