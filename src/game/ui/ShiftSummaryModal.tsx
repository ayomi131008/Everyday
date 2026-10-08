import React from 'react';
import { ShiftSummary } from '../jobs/JobSystem';
import { EconomySystem } from '../sim/Economy';
import { Award, Clock, DollarSign, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

interface ShiftSummaryModalProps {
  summary: ShiftSummary;
  onCollect: () => void;
}

export const ShiftSummaryModal: React.FC<ShiftSummaryModalProps> = ({ summary, onCollect }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md pointer-events-auto">
      <div className="w-full max-w-md flex flex-col rounded-3xl bg-stone-900 border-2 border-emerald-500/80 shadow-2xl text-stone-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-b from-emerald-950/60 to-stone-900 border-b border-stone-800 text-center">
          <div className="w-14 h-14 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto mb-3 shadow-lg">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">Shift Completed!</span>
          <h3 className="text-2xl font-black font-display text-white mt-1">{summary.jobName}</h3>
          <p className="text-xs text-stone-400 mt-1">4 in-game hours on the line at Mel's Diner</p>
        </div>

        {/* Breakdown Card */}
        <div className="p-6 space-y-3.5">
          {summary.promotedNow && (
            <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/60 flex items-center gap-3 text-amber-200">
              <Award className="w-6 h-6 text-amber-400 shrink-0" />
              <div className="text-xs">
                <strong className="block font-bold font-display text-white">Employee of the Week!</strong>
                You've completed 5 shifts. Hourly rate raised to $10.50/hr!
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs py-1 border-b border-stone-800 text-stone-300">
            <span className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              Hours Worked
            </span>
            <span className="font-mono font-bold text-stone-100">{summary.hoursWorked} hrs</span>
          </div>

          <div className="flex items-center justify-between text-xs py-1 border-b border-stone-800 text-stone-300">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" />
              Orders Finished
            </span>
            <span className="font-mono font-bold text-stone-100">
              {summary.ordersCompleted} / {summary.totalOrders} ({summary.accuracyPercent}%)
            </span>
          </div>

          <div className="flex items-center justify-between text-xs py-1 border-b border-stone-800 text-stone-300">
            <span className="flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-stone-400" />
              Base Shift Pay
            </span>
            <span className="font-mono font-bold text-stone-100">{EconomySystem.formatCents(summary.basePayCents)}</span>
          </div>

          <div className="flex items-center justify-between text-xs py-1 border-b border-stone-800 text-stone-300">
            <span className="flex items-center gap-2 text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              Customer Tips Earned
            </span>
            <span className="font-mono font-bold text-emerald-400">+{EconomySystem.formatCents(summary.tipsCents)}</span>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-sm font-bold font-display text-white">Total Paycheck</span>
            <span className="text-2xl font-black font-mono text-emerald-400">
              {EconomySystem.formatCents(summary.totalPayCents)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <button
            onClick={onCollect}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-stone-950 font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <DollarSign className="w-5 h-5 stroke-[2.5]" />
            Pocket Paycheck & Clock Out
          </button>
        </div>
      </div>
    </div>
  );
};
