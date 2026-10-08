import React, { useEffect, useRef, useState } from 'react';
import { GameSnapshot } from '../Game';
import { InputManager } from '../input/InputManager';
import {
  Utensils,
  Zap,
  Sparkles,
  Smile,
  Home,
  DollarSign,
  Compass,
  MapPin,
  Package,
  Pause,
} from 'lucide-react';

interface HUDProps {
  snapshot: GameSnapshot;
  onOpenInventory: () => void;
  onOpenPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({ snapshot, onOpenInventory, onOpenPause }) => {
  const prevMoneyRef = useRef(snapshot.moneyCents);
  const [moneyFlash, setMoneyFlash] = useState<'up' | 'down' | null>(null);
  const [showFullObjective, setShowFullObjective] = useState(false);
  const isTouch = InputManager.isTouchDevice();

  useEffect(() => {
    if (snapshot.moneyCents > prevMoneyRef.current) {
      setMoneyFlash('up');
      const t = setTimeout(() => setMoneyFlash(null), 1200);
      prevMoneyRef.current = snapshot.moneyCents;
      return () => clearTimeout(t);
    } else if (snapshot.moneyCents < prevMoneyRef.current) {
      setMoneyFlash('down');
      const t = setTimeout(() => setMoneyFlash(null), 1200);
      prevMoneyRef.current = snapshot.moneyCents;
      return () => clearTimeout(t);
    }
  }, [snapshot.moneyCents]);

  const { hunger, energy, hygiene, fun } = snapshot.needs;

  const renderNeedBar = (
    label: string,
    value: number,
    icon: React.ReactNode,
    colorClass: string,
    isMobile: boolean = false
  ) => {
    const isCritical = value <= 30;
    if (isMobile) {
      return (
        <div key={label} className="flex items-center gap-1.5 flex-1 min-w-[62px]">
          <span className={`text-[10px] ${isCritical ? 'text-red-400 animate-pulse' : 'text-stone-300'}`}>
            {icon}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-stone-950/70 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${colorClass} ${
                isCritical ? 'bg-red-500 animate-pulse' : ''
              }`}
              style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
            />
          </div>
          <span className={`text-[9px] font-mono ${isCritical ? 'text-red-400 font-bold' : 'text-stone-400'}`}>
            {Math.round(value)}
          </span>
        </div>
      );
    }

    return (
      <div key={label} className="flex flex-col gap-1 w-28 sm:w-32">
        <div className="flex items-center justify-between text-[11px] font-semibold text-stone-300">
          <div className="flex items-center gap-1.5">
            <span className={isCritical ? 'text-red-400 animate-pulse' : 'text-stone-300'}>{icon}</span>
            <span>{label}</span>
          </div>
          <span className={`font-mono ${isCritical ? 'text-red-400 font-bold animate-pulse' : 'text-stone-400'}`}>
            {Math.round(value)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-stone-950/70 p-0.5 border border-stone-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${colorClass} ${
              isCritical ? 'bg-red-500 animate-pulse' : ''
            }`}
            style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none p-3 sm:p-5 flex flex-col justify-between overflow-hidden">
      {/* ================= TOP SECTION ================= */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          {/* Top-Left: Cash & Zone */}
          <div className="flex flex-col gap-1.5">
            {/* Cash Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-stone-900/90 backdrop-blur-md border border-stone-700/80 shadow-xl pointer-events-auto">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <DollarSign className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider hidden sm:block">Wallet</span>
                <span
                  className={`text-base sm:text-2xl font-bold font-mono tracking-tight transition-colors duration-300 ${
                    moneyFlash === 'up'
                      ? 'text-emerald-400 font-extrabold scale-105'
                      : moneyFlash === 'down'
                      ? 'text-red-400 font-extrabold scale-105'
                      : 'text-amber-400'
                  }`}
                >
                  {snapshot.formattedMoney}
                </span>
              </div>
            </div>

            {/* Rent Pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-900/80 backdrop-blur-md border border-stone-800 text-[10px] sm:text-xs text-stone-300 shadow-md">
              <Home className="w-3 h-3 text-stone-400 shrink-0" />
              <span>
                Rent: <strong className={snapshot.rentIsLate ? 'text-red-400' : 'text-stone-100'}>${(snapshot.rentTotalDueCents / 100).toFixed(2)}</strong>
              </span>
              <span className="text-stone-500">&bull;</span>
              <span className={snapshot.rentDaysRemaining <= 1 ? 'text-amber-400 font-semibold' : 'text-stone-400'}>
                {snapshot.rentIsLate ? 'OVERDUE!' : `${snapshot.rentDaysRemaining}d`}
              </span>
            </div>
          </div>

          {/* Top-Center: Clock & Zone (Desktop & Tablet) */}
          <div className="hidden sm:flex flex-col items-center">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-stone-900/90 backdrop-blur-md border border-stone-700/80 shadow-xl pointer-events-auto">
              <div className="flex items-center gap-1 text-stone-400 text-xs font-semibold">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>{snapshot.zoneName}</span>
              </div>
              <div className="h-3.5 w-px bg-stone-700" />
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-base font-bold text-white tracking-wider">{snapshot.timeString}</span>
                <span className="text-[10px] font-semibold text-amber-400">{snapshot.period}</span>
              </div>
              <div className="h-3.5 w-px bg-stone-700" />
              <div className="text-[11px] font-bold text-stone-300">{snapshot.dayString}</div>
            </div>
          </div>

          {/* Top-Right: Quick buttons & Objective Badge */}
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5 pointer-events-auto">
              {/* Mobile Clock Pill */}
              <div className="sm:hidden flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-900/80 backdrop-blur-md border border-stone-800 text-[11px] font-mono font-bold text-stone-200">
                <span>{snapshot.timeString}</span>
                <span className="text-[9px] text-amber-400">{snapshot.period}</span>
              </div>

              <button
                onClick={onOpenInventory}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-stone-900/85 hover:bg-stone-800 border border-stone-700/80 text-stone-200 shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
                title="Open Duffel Bag"
              >
                <Package className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Bag</span>
              </button>

              <button
                onClick={onOpenPause}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-stone-900/85 hover:bg-stone-800 border border-stone-700/80 text-stone-200 shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
                title="Pause Game"
              >
                <Pause className="w-4 h-4 text-stone-400" />
                <span className="hidden sm:inline">Menu</span>
              </button>
            </div>

            {/* Current Objective Pill / Box */}
            {snapshot.currentObjective && (
              <div
                onClick={() => setShowFullObjective(!showFullObjective)}
                className="max-w-[210px] sm:max-w-xs p-2 sm:p-3 rounded-2xl bg-stone-900/90 backdrop-blur-md border border-amber-500/40 shadow-xl pointer-events-auto text-right cursor-pointer"
              >
                <div className="flex items-center justify-end gap-1 text-[9px] sm:text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  <span>Goal</span>
                  <Compass className="w-3 h-3" />
                </div>
                <h4 className="font-bold text-stone-100 text-xs sm:text-sm font-display truncate">
                  {snapshot.currentObjective.title}
                </h4>
                <p className={`text-[10px] sm:text-xs text-stone-300 mt-0.5 leading-tight ${showFullObjective ? '' : 'line-clamp-1 sm:line-clamp-2'}`}>
                  {snapshot.currentObjective.instruction}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Compact Need Bars (Top Row below header so bottom is free for touch controls) */}
        <div className="sm:hidden flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-stone-900/85 backdrop-blur-md border border-stone-800/80 shadow-lg pointer-events-auto">
          {renderNeedBar('Hunger', hunger, <Utensils className="w-3 h-3" />, 'bg-orange-500', true)}
          {renderNeedBar('Energy', energy, <Zap className="w-3 h-3" />, 'bg-amber-400', true)}
          {renderNeedBar('Hygiene', hygiene, <Sparkles className="w-3 h-3" />, 'bg-cyan-400', true)}
          {renderNeedBar('Fun', fun, <Smile className="w-3 h-3" />, 'bg-pink-500', true)}
        </div>
      </div>

      {/* ================= CENTER: INTERACTION PROMPT ================= */}
      {snapshot.prompt && (
        <div className="self-center mb-16 sm:mb-8 flex flex-col items-center pointer-events-auto">
          <div className="flex items-center gap-2.5 px-4 py-2 sm:px-6 sm:py-3.5 rounded-2xl bg-stone-900/95 backdrop-blur-md border-2 border-amber-500 shadow-2xl text-stone-100 max-w-[90vw]">
            <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-xl bg-amber-500 text-stone-950 font-black text-xs sm:text-sm shadow shrink-0">
              E
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs sm:text-base text-white tracking-wide truncate">{snapshot.prompt.verb}</span>
              <span className="text-[10px] sm:text-xs text-stone-400 truncate">{snapshot.prompt.label}</span>
            </div>
            {snapshot.prompt.disabledReason && (
              <span className="ml-1 px-2 py-0.5 rounded-md bg-red-950/80 border border-red-500/60 text-[10px] font-bold text-red-300 shrink-0">
                {snapshot.prompt.disabledReason}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ================= BOTTOM BAR (Desktop Only - Mobile uses TouchControls) ================= */}
      <div className="hidden sm:flex items-end justify-between gap-4">
        {/* Needs Bars (Bottom-Left) */}
        <div className="flex flex-wrap gap-3 sm:gap-4 p-3.5 rounded-2xl bg-stone-900/90 backdrop-blur-md border border-stone-700/80 shadow-xl pointer-events-auto">
          {renderNeedBar('Hunger', hunger, <Utensils className="w-3.5 h-3.5" />, 'bg-orange-500', false)}
          {renderNeedBar('Energy', energy, <Zap className="w-3.5 h-3.5" />, 'bg-amber-400', false)}
          {renderNeedBar('Hygiene', hygiene, <Sparkles className="w-3.5 h-3.5" />, 'bg-cyan-400', false)}
          {renderNeedBar('Fun', fun, <Smile className="w-3.5 h-3.5" />, 'bg-pink-500', false)}
        </div>

        {/* Small Navigation / Controls reminder */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-stone-900/70 backdrop-blur-sm border border-stone-800 text-[11px] text-stone-400">
          <span>{isTouch ? 'Virtual Joystick to move &bull; Drag to look' : 'WASD: Move &bull; Mouse: Look &bull; Shift: Sprint'}</span>
        </div>
      </div>
    </div>
  );
};
