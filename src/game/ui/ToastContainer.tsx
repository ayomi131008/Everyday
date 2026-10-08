import React, { useEffect, useState } from 'react';
import { ToastMessage } from '../core/Types';
import { globalEvents } from '../core/EventBus';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const unsub = globalEvents.on<ToastMessage>('toast', (newToast) => {
      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, newToast.durationMs || 3500);
    });
    return unsub;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const isAlert = toast.type === 'alert';
        const isWarn = toast.type === 'warning';
        const isSuccess = toast.type === 'success';

        const borderColor = isAlert
          ? 'border-red-500/80 bg-stone-900/95 text-red-100 shadow-red-950/40'
          : isWarn
          ? 'border-amber-500/80 bg-stone-900/95 text-amber-100 shadow-amber-950/40'
          : isSuccess
          ? 'border-emerald-500/80 bg-stone-900/95 text-emerald-100 shadow-emerald-950/40'
          : 'border-cyan-500/70 bg-stone-900/95 text-stone-100 shadow-stone-950/40';

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-3.5 rounded-xl border-2 backdrop-blur-md shadow-xl transition-all duration-300 pointer-events-auto ${borderColor}`}
          >
            <div className="mt-0.5 shrink-0">
              {isAlert && <AlertCircle className="w-5 h-5 text-red-400" />}
              {isWarn && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {isSuccess && <CheckCircle className="w-5 h-5 text-emerald-400" />}
              {!isAlert && !isWarn && !isSuccess && <Info className="w-5 h-5 text-cyan-400" />}
            </div>
            <div className="flex-1 text-sm">
              <h4 className="font-bold text-white text-sm tracking-wide font-display">{toast.title}</h4>
              {toast.description && <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">{toast.description}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};
