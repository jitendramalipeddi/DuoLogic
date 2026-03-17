"use client";

import React, { useState, useEffect } from 'react';
import CommonSpace from '@/components/CommonSpace';
import UserTerritory from '@/components/UserTerritory';
import { useGameState } from '@/hooks/useGameState';
import { Card } from '@/components/ui/card';
import { generateInitialLogicProblem } from '@/ai/flows/generate-initial-logic-problem';

export default function DuoLogicApp() {
  const { 
    state, 
    updateState, 
    logEvent 
  } = useGameState();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      if (!state.problem) {
        try {
          const problem = await generateInitialLogicProblem();
          updateState({ problem, stage: 'intro' });
        } catch (e) {
          console.error("Failed to load problem", e);
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center text-primary font-headline text-2xl animate-pulse">
        Initializing DuoLogic...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Half: Common Space */}
      <div className="h-1/2 w-full p-4 overflow-hidden">
        <CommonSpace state={state} updateState={updateState} logEvent={logEvent} />
      </div>

      {/* Bottom Half: User Territories */}
      <div className="h-1/2 w-full flex">
        <UserTerritory 
          userId={1} 
          state={state} 
          updateState={updateState} 
          logEvent={logEvent} 
          className="user1-zone w-1/2 p-4"
        />
        <UserTerritory 
          userId={2} 
          state={state} 
          updateState={updateState} 
          logEvent={logEvent} 
          className="user2-zone w-1/2 p-4"
        />
      </div>
    </div>
  );
}
