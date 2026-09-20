import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, Info, X, Coins, Sparkles } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-20 right-4 sm:right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isPoints =
          toast.type === 'points' ||
          (toast.message.toLowerCase().includes('gained') && toast.message.toLowerCase().includes('point')) ||
          toast.message.includes('نقطة');
        const isSuccess = toast.type === 'success' && !isPoints;
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 animate-slide-up ${
              isPoints
                ? 'bg-gradient-to-r from-[#291a08] via-[#1a1005] to-[#291a08] border-2 border-amber-400/80 text-amber-100 shadow-[0_0_35px_rgba(245,158,11,0.4)]'
                : isSuccess
                ? 'bg-emerald-950/90 border border-emerald-500/50 text-emerald-200'
                : isError
                ? 'bg-rose-950/90 border border-rose-500/50 text-rose-200'
                : 'bg-violet-950/90 border border-violet-500/50 text-violet-200'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {isPoints && (
                <div className="w-8 h-8 rounded-xl bg-amber-500/30 border border-amber-400 flex items-center justify-center text-amber-300 shrink-0 shadow-md shadow-amber-500/40 animate-bounce">
                  <Coins className="w-5 h-5" />
                </div>
              )}
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
              {!isSuccess && !isError && !isPoints && <Info className="w-5 h-5 text-violet-400 shrink-0" />}
              
              <div className="min-w-0">
                <span className={`text-sm ${isPoints ? 'font-black tracking-wide text-amber-200' : 'font-medium'}`}>
                  {toast.message}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
