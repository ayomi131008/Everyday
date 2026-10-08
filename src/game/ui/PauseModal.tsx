import React, { useState } from 'react';
import { Game } from '../Game';
import { EconomySystem } from '../sim/Economy';
import {
  Play,
  Sliders,
  Wallet,
  Save,
  LogOut,
  HelpCircle,
  X,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface PauseModalProps {
  game: Game;
  onResume: () => void;
  onOpenSettings: () => void;
  onQuit: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  game,
  onResume,
  onOpenSettings,
  onQuit,
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'wallet' | 'controls'>('menu');
  const [saveToast, setSaveToast] = useState(false);

  const handleManualSave = () => {
    game.saveGame();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const transactions = game.economy.getRecentTransactions();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md pointer-events-auto">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col rounded-3xl bg-stone-900 border-2 border-stone-700/80 shadow-2xl text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-800 bg-stone-900/90">
          <div>
            <h3 className="text-xl font-bold font-display text-white">Everyday Paused</h3>
            <p className="text-xs text-stone-400">Dunmore Square, Brightwater</p>
          </div>
          {activeTab !== 'menu' && (
            <button
              onClick={() => setActiveTab('menu')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
            >
              &larr; Back
            </button>
          )}
        </div>

        {/* Content body */}
        <div className="p-6">
          {activeTab === 'menu' && (
            <div className="space-y-3">
              <button
                onClick={onResume}
                className="w-full py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-stone-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2.5"
              >
                <Play className="w-4 h-4 fill-current" />
                Resume Game [Esc]
              </button>

              <button
                onClick={() => setActiveTab('wallet')}
                className="w-full py-3 px-5 rounded-2xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 font-semibold text-xs transition-all cursor-pointer flex items-center justify-between"
              >
                <span className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-amber-400" />
                  Wallet & Financial History
                </span>
                <span className="font-mono font-bold text-amber-400">{game.economy.getFormattedMoney()}</span>
              </button>

              <button
                onClick={() => setActiveTab('controls')}
                className="w-full py-3 px-5 rounded-2xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 font-semibold text-xs transition-all cursor-pointer flex items-center justify-between"
              >
                <span className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  Controls & How to Play
                </span>
                <span className="text-stone-500">&rarr;</span>
              </button>

              <button
                onClick={onOpenSettings}
                className="w-full py-3 px-5 rounded-2xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 font-semibold text-xs transition-all cursor-pointer flex items-center justify-between"
              >
                <span className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-stone-400" />
                  Audio & Graphics Settings
                </span>
                <span className="text-stone-500">&rarr;</span>
              </button>

              <button
                onClick={handleManualSave}
                className="w-full py-3 px-5 rounded-2xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 font-semibold text-xs transition-all cursor-pointer flex items-center justify-between"
              >
                <span className="flex items-center gap-2.5">
                  <Save className="w-4 h-4 text-emerald-400" />
                  Save Game to Browser Storage
                </span>
                {saveToast && <span className="text-emerald-400 font-bold text-xs flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</span>}
              </button>

              <div className="pt-2">
                <button
                  onClick={onQuit}
                  className="w-full py-2.5 px-4 rounded-xl hover:bg-red-950/60 text-stone-400 hover:text-red-300 font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Save & Return to Title Screen
                </button>
              </div>
            </div>
          )}

          {activeTab === 'wallet' && (
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-800">
                <span className="text-xs uppercase font-bold text-stone-400">Recent Transactions</span>
                <span className="text-base font-bold font-mono text-amber-400">{game.economy.getFormattedMoney()}</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {transactions.length === 0 ? (
                  <p className="text-xs text-stone-500 py-6 text-center">No transactions recorded yet.</p>
                ) : (
                  transactions.map((tx) => {
                    const isPositive = tx.amountCents > 0;
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-stone-800/60 border border-stone-700/60 text-xs"
                      >
                        <div className="max-w-[70%]">
                          <p className="font-semibold text-stone-200 truncate">{tx.reason}</p>
                          <span className="text-[10px] text-stone-500 font-mono">
                            Balance: {EconomySystem.formatCents(tx.balanceAfterCents)}
                          </span>
                        </div>
                        <span
                          className={`font-mono font-bold ${
                            isPositive ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {EconomySystem.formatCents(tx.amountCents)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-3 text-xs text-stone-300">
              <div className="grid grid-cols-2 gap-2 text-stone-200 font-mono text-[11px]">
                <div className="p-2.5 rounded-xl bg-stone-800 border border-stone-700">
                  <strong className="text-amber-400 block font-display">WASD</strong> Move Around
                </div>
                <div className="p-2.5 rounded-xl bg-stone-800 border border-stone-700">
                  <strong className="text-amber-400 block font-display">Mouse</strong> Rotate Camera
                </div>
                <div className="p-2.5 rounded-xl bg-stone-800 border border-stone-700">
                  <strong className="text-amber-400 block font-display">Shift</strong> Sprint (uses energy)
                </div>
                <div className="p-2.5 rounded-xl bg-stone-800 border border-stone-700">
                  <strong className="text-amber-400 block font-display">Wheel</strong> Zoom In / Out
                </div>
                <div className="p-2.5 rounded-xl bg-stone-800 border border-stone-700">
                  <strong className="text-amber-400 block font-display">E</strong> Interact with World
                </div>
                <div className="p-2.5 rounded-xl bg-stone-800 border border-stone-700">
                  <strong className="text-amber-400 block font-display">Tab / I</strong> Open Bag
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700/80 text-xs leading-relaxed text-stone-300">
                <strong className="text-amber-300 block mb-1">Everyday Tips:</strong>
                &bull; Rent is $90 every 3 days. Pay at the notice board in your room.<br />
                &bull; Talk to Manager Mel in the diner to start shifts and earn cash + tips.<br />
                &bull; Keep hunger, energy, hygiene, and fun high to maximize diner tips!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
