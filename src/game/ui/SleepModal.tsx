import React from 'react';
import { Game } from '../Game';
import { Moon, Sunrise, X, Zap } from 'lucide-react';

interface SleepModalProps {
  game: Game;
  onClose: () => void;
}

export const SleepModal: React.FC<SleepModalProps> = ({ game, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm pointer-events-auto">
      <div className="w-full max-w-md p-6 rounded-3xl bg-stone-900 border-2 border-stone-700/80 shadow-2xl text-stone-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-white">Rest & Sleep</h3>
              <p className="text-xs text-stone-400">Recover energy in your Lindqvist Arms bed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-stone-300 leading-relaxed mb-6">
          Sleeping restores energy (+12/hr) while slowing hunger and hygiene decay to 40%.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => game.sleep(2)}
            className="w-full p-4 rounded-2xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-left transition-all cursor-pointer flex items-center justify-between group active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-100 font-display">Quick Power Nap</h4>
                <p className="text-xs text-stone-400">Rest for 2 in-game hours (+24 Energy)</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
              Nap &rarr;
            </span>
          </button>

          <button
            onClick={() => game.sleep(8)}
            className="w-full p-4 rounded-2xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/50 text-left transition-all cursor-pointer flex items-center justify-between group active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Sunrise className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-100 font-display">Deep Night's Rest</h4>
                <p className="text-xs text-stone-400">Rest for 8 in-game hours (+96 Energy)</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
              Sleep &rarr;
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
