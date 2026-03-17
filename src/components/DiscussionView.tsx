"use client";

import React from 'react';
import { GameState } from '@/hooks/useGameState';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

interface DiscussionViewProps {
  state: GameState;
}

export default function DiscussionView({ state }: DiscussionViewProps) {
  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-red-200 bg-red-50/20">
          <CardHeader className="py-2">
            <CardTitle className="text-sm text-red-600">User 1 Expression</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-xl">{state.expressions[1] || '---'}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/20">
          <CardHeader className="py-2">
            <CardTitle className="text-sm text-blue-600">User 2 Expression</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-xl">{state.expressions[2] || '---'}</p>
          </CardContent>
        </Card>
      </div>

      {state.stage === 'discussion' && (
        <div className="flex-1 overflow-auto bg-white rounded-lg border p-6">
          <div className="flex items-center space-x-2 mb-4 text-primary">
            <MessageSquare className="w-6 h-6" />
            <h3 className="text-xl font-bold font-headline">AI Discussion Guide</h3>
          </div>
          <div className="space-y-4">
            {state.discussionPrompts.map((p, i) => (
              <div key={i} className="p-4 bg-muted/40 rounded-lg border-l-4 border-primary">
                {p}
              </div>
            ))}
          </div>
        </div>
      )}

      {state.stage === 'equation' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-muted/20 rounded-xl border-2 border-dashed">
          <div className="animate-bounce mb-4 text-4xl">🤔</div>
          <h3 className="text-2xl font-bold mb-2">Analyzing Simplification...</h3>
          <p className="text-muted-foreground">Waiting for both users to submit their final Boolean expression.</p>
        </div>
      )}
    </div>
  );
}
