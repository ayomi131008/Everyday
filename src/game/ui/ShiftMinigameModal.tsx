import React, { useState } from 'react';
import { Game } from '../Game';
import { DinerShiftMinigame } from '../jobs/DinerShiftMinigame';
import { Flame, Clock, DollarSign, Check, AlertCircle, X } from 'lucide-react';

interface ShiftMinigameModalProps {
  game: Game;
  minigame: DinerShiftMinigame;
}

export const ShiftMinigameModal: React.FC<ShiftMinigameModalProps> = ({ game, minigame }) => {
  const [lastFeedback, setLastFeedback] = useState<{ text: string; success: boolean } | null>(null);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);

  const currentOrder = minigame.currentOrder;
  const isFinished = minigame.isFinished || !currentOrder;

  const handleIngredientClick = (ingredient: string) => {
    if (!currentOrder || currentOrder.completed || currentOrder.failed) return;

    const res = minigame.submitIngredient(ingredient);
    if (res.correct) {
      game.audio.playUiClick();
      if (res.orderFinished) {
        game.audio.playCoin();
        setLastFeedback({ text: `Order Up! +$${(res.earnedTipCents / 100).toFixed(2)} Tip`, success: true });
      } else {
        setLastFeedback({ text: `Added ${ingredient}`, success: true });
      }
    } else {
      game.audio.playError();
      setLastFeedback({ text: `Wrong item! Needed ${res.expectedStep}`, success: false });
    }
  };

  const timerRatio = currentOrder ? currentOrder.timeRemainingSec / currentOrder.totalTimeSec : 0;
  const timerColor = timerRatio > 0.5 ? 'bg-emerald-500' : timerRatio > 0.25 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md pointer-events-auto">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto flex flex-col rounded-3xl bg-stone-900 border-2 border-amber-500/80 shadow-2xl text-stone-100">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-stone-800 bg-stone-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-stone-950 font-black">
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-white">Mel's Line Cook Shift</h3>
              <p className="text-xs text-stone-400">Assemble orders in recipe order before tickets expire</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-800 border border-stone-700 font-mono text-xs">
              <span className="text-stone-400">Order:</span>
              <strong className="text-amber-400">
                {minigame.currentOrderIndex + 1} / {minigame.orders.length}
              </strong>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-xs font-bold">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Est. Tips: ${(minigame.totalTipsCents / 100).toFixed(2)}</span>
            </div>

            <button
              onClick={() => setShowForfeitConfirm(true)}
              className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-red-950/80 hover:text-red-300 border border-stone-700 text-xs font-semibold text-stone-400 transition-all cursor-pointer"
            >
              Walk Off Line
            </button>
          </div>
        </div>

        {/* Current Order Ticket Section */}
        {currentOrder && (
          <div className="p-6 bg-stone-950/40 border-b border-stone-800">
            {/* Ticket Header & Timer Bar */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Kitchen Ticket #{minigame.currentOrderIndex + 1}</span>
                <h4 className="text-xl font-bold font-display text-stone-100">{currentOrder.recipe.name}</h4>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-300">
                <Clock className="w-4 h-4 text-stone-400" />
                <span>{Math.max(0, currentOrder.timeRemainingSec).toFixed(1)}s</span>
              </div>
            </div>

            {/* Time progress bar */}
            <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden mb-5">
              <div
                className={`h-full transition-all duration-100 ${timerColor}`}
                style={{ width: `${Math.max(0, timerRatio * 100)}%` }}
              />
            </div>

            {/* Step sequence visualization */}
            <div className="flex flex-wrap items-center gap-2.5">
              {currentOrder.recipe.steps.map((step, idx) => {
                const isDone = idx < currentOrder.currentStepIndex;
                const isCurrent = idx === currentOrder.currentStepIndex;

                return (
                  <div
                    key={`${step}_${idx}`}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                      isDone
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                        : isCurrent
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-2 ring-amber-500/30 scale-105'
                        : 'bg-stone-800/60 border-stone-700/60 text-stone-500'
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-stone-700 text-stone-300 text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                    )}
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>

            {/* Feedback alert */}
            {lastFeedback && (
              <div
                className={`mt-4 py-1.5 px-3 rounded-xl text-xs font-bold inline-flex items-center gap-2 ${
                  lastFeedback.success
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                    : 'bg-red-950/80 text-red-300 border border-red-500/40 animate-shake'
                }`}
              >
                {lastFeedback.success ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{lastFeedback.text}</span>
              </div>
            )}
          </div>
        )}

        {/* Ingredients Grill Shelf (Clickable buttons) */}
        <div className="p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
            Pantry & Griddle Ingredients (Click in Order)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {minigame.availableIngredients.map((item) => {
              const isNextStep =
                currentOrder && currentOrder.recipe.steps[currentOrder.currentStepIndex] === item;

              return (
                <button
                  key={item}
                  onClick={() => handleIngredientClick(item)}
                  className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between min-h-[58px] ${
                    isNextStep
                      ? 'bg-stone-800 hover:bg-amber-950/50 border-amber-500/80 hover:border-amber-400 text-stone-100 shadow-lg'
                      : 'bg-stone-800/70 hover:bg-stone-700/80 border-stone-700 text-stone-300'
                  }`}
                >
                  <span>{item}</span>
                  <span className="text-[10px] text-stone-500 font-mono">Grill Station</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Forfeit Confirm Modal */}
      {showForfeitConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-stone-900 border border-red-500/60 shadow-2xl text-stone-100">
            <h4 className="text-lg font-bold font-display text-white mb-2">Leave Kitchen?</h4>
            <p className="text-xs text-stone-300 leading-relaxed mb-6">
              Walking off the line early forfeits all shift wages and tips. Mel won't be pleased.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForfeitConfirm(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold cursor-pointer"
              >
                Keep Cooking
              </button>
              <button
                onClick={() => {
                  setShowForfeitConfirm(false);
                  game.cancelShift();
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
              >
                Forfeit Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
