import React, { useState, useCallback, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { GameState } from './types';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameLog, setGameLog] = useState<string[]>(["Subject 09 has awakened..."]);
  const [stats, setStats] = useState({ size: 25, eaten: 0 });
  
  // Shared input ref to pass joystick data without re-renders
  const inputRef = useRef({ x: 0, y: 0 });

  const startGame = useCallback(() => {
    setGameState(GameState.PLAYING);
    setGameLog(["Containment breach initiated..."]);
    setStats({ size: 25, eaten: 0 });
  }, []);

  const handleLogUpdate = useCallback((newLog: string) => {
    setGameLog(prev => [...prev.slice(-4), newLog]);
  }, []);

  const handleStatsUpdate = useCallback((newStats: { size: number, eaten: number }) => {
    setStats(newStats);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-neutral-900 overflow-hidden font-sans">
      <GameCanvas 
        gameState={gameState} 
        setGameState={setGameState}
        onLogUpdate={handleLogUpdate}
        onStatsUpdate={handleStatsUpdate}
        inputRef={inputRef}
      />
      <UIOverlay 
        gameState={gameState} 
        startGame={startGame}
        gameLog={gameLog}
        stats={stats}
        inputRef={inputRef}
      />
    </div>
  );
}

export default App;