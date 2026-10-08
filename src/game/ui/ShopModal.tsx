import React from 'react';
import { Game } from '../Game';
import { ITEMS, ItemDef } from '../config/items';
import { EconomySystem } from '../sim/Economy';
import { X, Utensils, Zap, Sparkles, Smile, ShoppingBag } from 'lucide-react';

interface ShopModalProps {
  game: Game;
  category: 'diner' | 'convenience';
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ game, category, onClose }) => {
  const moneyCents = game.economy.getMoneyCents();
  const isDiner = category === 'diner';

  const shopItems = Object.values(ITEMS).filter((item) => item.category === category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm pointer-events-auto">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-stone-900 border-2 border-stone-700/80 shadow-2xl text-stone-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-white">
                {isDiner ? "Mel's Diner Menu" : 'QuikStop Corner Market'}
              </h3>
              <p className="text-xs text-stone-400">
                {isDiner ? 'Hot meals and drinks served fresh to order' : 'Packaged groceries and daily supplies'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-stone-400">Your Balance</span>
              <p className="text-lg font-mono font-bold text-amber-400">{EconomySystem.formatCents(moneyCents)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Item Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shopItems.map((item) => {
            const canAfford = moneyCents >= item.priceCents;
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between p-4 rounded-2xl bg-stone-800/60 border border-stone-700/70 hover:border-stone-600 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="font-bold text-sm text-stone-100 font-display">{item.name}</h4>
                    <span className="font-mono font-bold text-sm text-amber-400 shrink-0">
                      {EconomySystem.formatCents(item.priceCents)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed mb-3">{item.description}</p>

                  {/* Effects badges */}
                  <div className="flex flex-wrap gap-2 mb-4 text-[11px] font-semibold">
                    {item.hunger !== 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-950/80 border border-orange-500/40 text-orange-300">
                        <Utensils className="w-3 h-3" />
                        {item.hunger > 0 ? `+${item.hunger}` : item.hunger} Hunger
                      </span>
                    )}
                    {item.energy !== 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/40 text-amber-300">
                        <Zap className="w-3 h-3" />
                        {item.energy > 0 ? `+${item.energy}` : item.energy} Energy
                      </span>
                    )}
                    {item.hygiene !== 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                        <Sparkles className="w-3 h-3" />
                        {item.hygiene > 0 ? `+${item.hygiene}` : item.hygiene} Hygiene
                      </span>
                    )}
                    {item.fun !== 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pink-950/80 border border-pink-500/40 text-pink-300">
                        <Smile className="w-3 h-3" />
                        {item.fun > 0 ? `+${item.fun}` : item.fun} Fun
                      </span>
                    )}
                    {item.requiresCooking && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/40 text-purple-300">
                        Cook at home
                      </span>
                    )}
                  </div>
                </div>

                {/* Purchase Button */}
                <button
                  disabled={!canAfford}
                  onClick={() => game.buyItem(item.id)}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    canAfford
                      ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md active:scale-98'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700/50'
                  }`}
                >
                  {canAfford
                    ? isDiner
                      ? 'Order & Eat Here'
                      : 'Buy & Add to Bag'
                    : 'Insufficient Cash'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
