import React, { useState } from 'react';
import { Game } from '../Game';
import { SaveManager } from '../save/SaveManager';
import { Play, RotateCcw, Sliders, Info, ShieldAlert, Sparkles } from 'lucide-react';

interface TitleScreenProps {
  game: Game;
  onOpenSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ game, onOpenSettings }) => {
  const hasSave = SaveManager.hasSave();
  const [showConfirmNew, setShowConfirmNew] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  const handleNewGame = () => {
    if (hasSave) {
      setShowConfirmNew(true);
    } else {
      game.startNewGame();
    }
  };

  const confirmStartNew = () => {
    setShowConfirmNew(false);
    game.startNewGame();
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-8 sm:p-12 pointer-events-none">
      {/* Background radial gradient overlay that leaves 3D orbit visible */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-stone-950/40 to-stone-950/85 pointer-events-none" />

      {/* Top Header / Location Badge */}
      <div className="relative z-10 flex justify-between items-start">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900/80 backdrop-blur-md border border-stone-700/60 text-xs font-semibold text-amber-300 tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Brightwater &bull; Dunmore Square</span>
        </div>

        <div className="text-right text-xs text-stone-400 hidden sm:block">
          <p className="font-semibold text-stone-300">Third-Person 3D Life Simulator</p>
          <p className="text-stone-500">Built for Browser &bull; v1.0.0</p>
        </div>
      </div>

      {/* Center Hero & Wordmark */}
      <div className="relative z-10 max-w-xl">
        <div className="mb-4 sm:mb-6">
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-white drop-shadow-2xl">
            Every<span className="text-amber-400">day</span>
          </h1>
          <p className="mt-2 text-stone-300 text-sm sm:text-lg font-medium leading-relaxed max-w-md drop-shadow">
            Arrive with a duffel bag, $60, and a rented room. Cook burgers at Mel’s, pay your rent, stay fed, and make a life in Brightwater.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 sm:gap-3 max-w-xs pointer-events-auto">
          {hasSave && (
            <button
              onClick={() => game.continueGame()}
              className="flex items-center justify-center gap-3 px-5 py-3.5 sm:px-6 sm:py-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 font-bold text-sm sm:text-base shadow-xl shadow-amber-500/25 transition-all duration-150 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5 stroke-[2.5]" />
              Continue Routine
            </button>
          )}

          <button
            onClick={handleNewGame}
            className={`flex items-center justify-center gap-3 px-5 py-3.5 sm:px-6 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-150 cursor-pointer shadow-lg ${
              hasSave
                ? 'bg-stone-800/90 hover:bg-stone-700/90 text-stone-200 border border-stone-600/50'
                : 'bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 shadow-amber-500/25'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            New Life
          </button>

          <div className="flex gap-2">
            <button
              onClick={onOpenSettings}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-stone-900/80 hover:bg-stone-800/90 text-stone-300 hover:text-white border border-stone-700/60 font-semibold text-xs sm:text-sm transition-all duration-150 cursor-pointer backdrop-blur-sm"
            >
              <Sliders className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={() => setShowCredits(true)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-stone-900/80 hover:bg-stone-800/90 text-stone-300 hover:text-white border border-stone-700/60 font-semibold text-xs sm:text-sm transition-all duration-150 cursor-pointer backdrop-blur-sm"
            >
              <Info className="w-4 h-4" />
              About
            </button>
          </div>
        </div>
      </div>

      {/* Footer Controls Bar */}
      <div className="relative z-10 flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] sm:text-xs text-stone-400 bg-stone-900/70 backdrop-blur-md px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-stone-800 self-start pointer-events-auto">
        <span className="font-semibold text-stone-300">Controls:</span>
        <span className="sm:hidden text-amber-300 font-semibold">Touchscreen Joystick & Touch Look Supported</span>
        <span className="hidden sm:inline"><kbd className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-200 border border-stone-700">WASD</kbd> Move</span>
        <span className="hidden sm:inline"><kbd className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-200 border border-stone-700">Mouse</kbd> Look</span>
        <span className="hidden sm:inline"><kbd className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-200 border border-stone-700">Shift</kbd> Sprint</span>
        <span className="hidden sm:inline"><kbd className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-200 border border-stone-700">E</kbd> Interact</span>
      </div>

      {/* Confirm Overwrite New Game Modal */}
      {showConfirmNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm pointer-events-auto">
          <div className="w-full max-w-md p-6 rounded-2xl bg-stone-900 border-2 border-amber-500/80 shadow-2xl text-stone-100">
            <div className="flex items-center gap-3 text-amber-400 mb-3">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold font-display">Start Fresh?</h3>
            </div>
            <p className="text-sm text-stone-300 leading-relaxed">
              Starting a new life will erase your current room, savings, and shifts in Dunmore Square. Are you sure you want to start over?
            </p>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmNew(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 font-semibold text-sm cursor-pointer"
              >
                Keep Existing Save
              </button>
              <button
                onClick={confirmStartNew}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm cursor-pointer"
              >
                Erase & Start New Life
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credits / About Modal */}
      {showCredits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm pointer-events-auto">
          <div className="w-full max-w-md p-6 rounded-2xl bg-stone-900 border border-stone-700 shadow-2xl text-stone-100">
            <h3 className="text-xl font-bold font-display text-white mb-2">Everyday: Dunmore Square</h3>
            <p className="text-xs text-amber-400 font-semibold mb-4">Original 3D Life Simulation</p>
            <div className="text-xs text-stone-300 space-y-2.5 leading-relaxed">
              <p>
                Inspired by the cozy rhythms of daily urban life, working a diner grill, paying your landlord on time, and resting after a hard day.
              </p>
              <p>
                <strong>Engine:</strong> Babylon.js 3D rendering with procedural low-poly geometry and custom sliding physics.
              </p>
              <p>
                <strong>Audio:</strong> 100% procedural WebAudio synthesis — footsteps, coins, fryers, and ambient city noise.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowCredits(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
