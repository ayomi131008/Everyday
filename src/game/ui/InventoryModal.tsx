import React from 'react';
import { Game } from '../Game';
import { ITEMS } from '../config/items';
import { X, Package, Utensils, Zap, Sparkles, Smile } from 'lucide-react';

interface InventoryModalProps {
  game: Game;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ game, onClose }) => {
  const items = game.inventory.getItems();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm pointer-events-auto">
      <div className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl bg-stone-900 border-2 border-stone-700/80 shadow-2xl text-stone-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-white">Your Duffel Bag</h3>
              <p className="text-xs text-stone-400">Snacks, supplies, and sundries carried on you</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {items.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <Package className="w-12 h-12 mx-auto mb-3 text-stone-600" />
              <p className="font-semibold text-sm">Your duffel bag is empty.</p>
              <p className="text-xs text-stone-500 mt-1">Visit QuikStop Corner Market on Dunmore Ave to stock up.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {items.map((item) => {
                const def = ITEMS[item.id];
                if (!def) return null;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between p-4 rounded-2xl bg-stone-800/60 border border-stone-700/70"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-bold text-sm text-stone-100 font-display">{def.name}</h4>
                        <span className="px-2 py-0.5 rounded-md bg-stone-700 text-xs font-mono font-bold text-amber-300">
                          x{item.quantity}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 leading-relaxed mb-3">{def.description}</p>

                      {/* Effects */}
                      <div className="flex flex-wrap gap-1.5 mb-3 text-[11px] font-semibold">
                        {def.hunger !== 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-950/70 text-orange-300">
                            <Utensils className="w-3 h-3" />
                            +{def.hunger}
                          </span>
                        )}
                        {def.energy !== 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300">
                            <Zap className="w-3 h-3" />
                            +{def.energy}
                          </span>
                        )}
                        {def.hygiene !== 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/70 text-cyan-300">
                            <Sparkles className="w-3 h-3" />
                            +{def.hygiene}
                          </span>
                        )}
                        {def.fun !== 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-pink-950/70 text-pink-300">
                            <Smile className="w-3 h-3" />
                            +{def.fun}
                          </span>
                        )}
                      </div>
                    </div>

                    {def.consumable ? (
                      <button
                        onClick={() => game.consumeInventoryItem(def.id)}
                        className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-stone-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        Eat / Consume
                      </button>
                    ) : def.requiresCooking ? (
                      <div className="text-center py-1.5 px-3 rounded-xl bg-stone-800 text-purple-300 text-xs font-semibold">
                        Cook at your apartment hot plate
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
