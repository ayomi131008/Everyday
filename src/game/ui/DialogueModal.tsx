import React from 'react';
import { MessageSquare, X } from 'lucide-react';

interface DialogueModalProps {
  title: string;
  lines: string[];
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  title,
  lines,
  actionLabel,
  onAction,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm pointer-events-auto">
      <div className="w-full max-w-lg p-6 rounded-3xl bg-stone-900 border-2 border-amber-500/80 shadow-2xl text-stone-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-white">{title}</h3>
              <p className="text-xs text-stone-400">Dunmore Square Resident</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 space-y-2.5 text-sm text-stone-200 leading-relaxed mb-6 font-medium">
          {lines.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs cursor-pointer"
          >
            Later
          </button>
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-stone-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
