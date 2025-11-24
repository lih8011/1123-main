import React, { useRef, useState } from 'react';
import { GameState } from '../types';

interface UIOverlayProps {
  gameState: GameState;
  startGame: () => void;
  gameLog: string[];
  stats: { size: number, eaten: number };
  inputRef: React.MutableRefObject<{ x: number, y: number }>;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ gameState, startGame, gameLog, stats, inputRef }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 }); // Visual offset
  const joystickTouchId = useRef<number | null>(null);

  // Joystick Logic
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    joystickTouchId.current = touch.identifier;
    setJoystickActive(true);
    updateJoystick(touch);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!joystickActive) return;
    
    // Find the touch matching our joystick tracker
    for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joystickTouchId.current) {
            updateJoystick(e.changedTouches[i]);
            break;
        }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joystickTouchId.current) {
            setJoystickActive(false);
            setJoystickPos({ x: 0, y: 0 });
            inputRef.current = { x: 0, y: 0 };
            joystickTouchId.current = null;
            break;
        }
    }
  };

  const updateJoystick = (touch: React.Touch) => {
    if (!joystickRef.current) return;
    
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const maxRadius = rect.width / 2;
    
    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    
    // Clamp visual
    if (dist > maxRadius) {
        const ratio = maxRadius / dist;
        dx *= ratio;
        dy *= ratio;
    }
    
    setJoystickPos({ x: dx, y: dy });
    
    // Update Input Ref (Normalized -1 to 1)
    inputRef.current = {
        x: dx / maxRadius,
        y: dy / maxRadius
    };
  };

  if (gameState === GameState.MENU) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-white z-50 font-['Rajdhani'] p-4">
        <h1 className="text-5xl md:text-8xl font-['Black_Ops_One'] text-red-600 mb-2 tracking-widest drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] text-center">SUBJECT 09</h1>
        <h2 className="text-xl md:text-2xl text-blue-400 tracking-[0.3em] md:tracking-[0.5em] mb-12 uppercase text-center">Containment Breach</h2>
        
        <div className="bg-slate-900/80 p-6 md:p-8 rounded border-t-2 border-b-2 border-red-600 backdrop-blur-md text-center max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <p className="text-base md:text-xl text-slate-300 mb-8 leading-relaxed">
            <strong className="text-white block mb-2">MISSION PARAMETERS:</strong>
            1. CONSUME personnel.<br/>
            2. BREAK walls.<br/>
            3. SURVIVE.
          </p>
          <button 
            onClick={startGame}
            className="w-full md:w-auto px-10 py-4 bg-red-700 hover:bg-red-600 text-white font-['Black_Ops_One'] text-2xl tracking-widest rounded-sm shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all transform hover:scale-105 active:scale-95 border border-red-500"
          >
            INITIATE
          </button>
        </div>
      </div>
    );
  }

  if (gameState === GameState.GAME_OVER) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm text-white z-50 font-['Rajdhani'] p-4">
        <h1 className="text-5xl md:text-7xl font-['Black_Ops_One'] text-red-600 mb-4 tracking-widest text-center">TERMINATED</h1>
        <p className="text-lg md:text-2xl mb-8 text-gray-400 uppercase tracking-widest">Subject Neutralized</p>
        
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 mb-12 w-full max-w-md">
            <div className="bg-slate-900/50 p-6 border border-red-900/50 flex-1 text-center">
                <div className="text-xs text-red-500 uppercase tracking-widest mb-2">Casualties</div>
                <div className="text-4xl font-mono">{stats.eaten}</div>
            </div>
            <div className="bg-slate-900/50 p-6 border border-red-900/50 flex-1 text-center">
                <div className="text-xs text-red-500 uppercase tracking-widest mb-2">Mass</div>
                <div className="text-4xl font-mono">{Math.floor(stats.size)}<span className="text-sm">kg</span></div>
            </div>
        </div>

        <button 
          onClick={startGame}
          className="px-8 py-3 bg-slate-800 hover:bg-red-900 text-white font-bold font-mono border border-gray-600 hover:border-red-500 transition-colors w-full md:w-auto"
        >
          RETRY SEQUENCE
        </button>
      </div>
    );
  }

  if (gameState === GameState.VICTORY) {
     return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/20 backdrop-blur-md text-white z-50 font-['Rajdhani'] p-4">
        <h1 className="text-4xl md:text-7xl font-['Black_Ops_One'] text-emerald-500 mb-4 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] text-center">BREACH SUCCESS</h1>
        <p className="text-lg md:text-2xl mb-8 text-emerald-100 tracking-wider uppercase text-center">Subject has entered the ecosystem</p>
        
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 mb-12 w-full max-w-md">
            <div className="bg-black/60 p-6 border-t-2 border-emerald-500 flex-1 text-center">
                <div className="text-xs text-emerald-400 uppercase tracking-widest mb-2">Casualties</div>
                <div className="text-4xl font-mono text-emerald-200">{stats.eaten}</div>
            </div>
            <div className="bg-black/60 p-6 border-t-2 border-emerald-500 flex-1 text-center">
                <div className="text-xs text-emerald-400 uppercase tracking-widest mb-2">Mass</div>
                <div className="text-4xl font-mono text-emerald-200">{Math.floor(stats.size)}<span className="text-sm">kg</span></div>
            </div>
        </div>

        <button 
          onClick={startGame}
          className="px-8 py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold font-mono shadow-lg border border-emerald-500 w-full md:w-auto"
        >
          RESTART SIMULATION
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none p-4 md:p-6 flex flex-col justify-between font-['Rajdhani']">
      {/* Top HUD */}
      <div className="flex justify-between items-start">
        {/* Mass Indicator */}
        <div className="relative bg-slate-900/90 px-4 py-2 md:px-6 md:py-3 border-l-4 border-r border-t border-b border-r-slate-700 border-t-slate-700 border-b-slate-700 border-l-red-500 shadow-lg transform skew-x-[-10deg]">
          <div className="transform skew-x-[10deg]">
            <div className="text-red-500 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase mb-1">Mass</div>
            <div className="text-2xl md:text-4xl text-white font-['Black_Ops_One'] flex items-baseline gap-2">
                {Math.floor(stats.size)} 
                <span className="text-xs md:text-sm text-slate-500 font-sans">KG</span>
            </div>
          </div>
        </div>
        
        {/* Kill Count */}
        <div className="relative bg-slate-900/90 px-4 py-2 md:px-6 md:py-3 border-r-4 border-l border-t border-b border-l-slate-700 border-t-slate-700 border-b-slate-700 border-r-blue-500 shadow-lg transform skew-x-[10deg]">
            <div className="transform skew-x-[-10deg] text-right">
                <div className="text-blue-400 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase mb-1">Kills</div>
                <div className="text-2xl md:text-4xl text-white font-['Black_Ops_One']">{stats.eaten}</div>
            </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-end justify-between w-full h-full pb-20 md:pb-0 pointer-events-none">
          
          <div className="hidden md:block">
            {/* Spacer for desktop layout balance */}
          </div>
          
          {/* Controls Hint / Desktop Only */}
          <div className="hidden md:block text-slate-500 text-xs text-right font-mono tracking-widest opacity-70">
              <div className="border border-slate-700 px-3 py-1 inline-block bg-black/40 mb-1">WASD / ARROWS : MOVE</div>
              <br/>
              <div className="border border-slate-700 px-3 py-1 inline-block bg-black/40">CONTACT : CONSUME</div>
          </div>

      </div>

      {/* VIRTUAL JOYSTICK - Mobile Only Visuals but Active on Touch Devices */}
      <div className="absolute bottom-6 left-6 w-32 h-32 pointer-events-auto md:hidden touch-none">
          <div 
             ref={joystickRef}
             className="w-full h-full rounded-full border-2 border-slate-600 bg-slate-900/50 backdrop-blur relative"
             onTouchStart={handleTouchStart}
             onTouchMove={handleTouchMove}
             onTouchEnd={handleTouchEnd}
          >
              <div 
                className="absolute w-12 h-12 bg-red-600/80 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-red-400"
                style={{
                    top: '50%', left: '50%',
                    transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px))`
                }}
              />
          </div>
      </div>
    </div>
  );
};

export default UIOverlay;