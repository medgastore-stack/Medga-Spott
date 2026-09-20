import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface PreorderCountdownProps {
  targetDate?: string;
  releaseDateLabel?: string;
  compact?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export const PreorderCountdown: React.FC<PreorderCountdownProps> = ({
  targetDate,
  releaseDateLabel,
  compact = false,
}) => {
  const calculateTime = (): TimeRemaining => {
    if (!targetDate) {
      // Default future fallback (e.g. 60 days from now)
      return { days: 45, hours: 12, minutes: 30, seconds: 0, isExpired: false };
    }

    const target = new Date(targetDate).getTime();
    const now = Date.now();
    const diff = target - now;

    if (isNaN(diff) || diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds, isExpired: false };
  };

  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(calculateTime);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.isExpired) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black">
        <span>Available Now!</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="font-mono font-black text-amber-200">
          {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </span>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/40 shadow-md shadow-amber-950/30">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-amber-300 text-xs font-black uppercase tracking-wider">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Release Countdown</span>
        </div>
        {releaseDateLabel && (
          <span className="text-[11px] font-bold text-amber-200/90">{releaseDateLabel}</span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1.5 text-center">
        <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl py-1.5 px-1">
          <span className="block text-base sm:text-lg font-black text-amber-300 font-mono leading-none">
            {timeLeft.days}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Days</span>
        </div>
        <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl py-1.5 px-1">
          <span className="block text-base sm:text-lg font-black text-amber-300 font-mono leading-none">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Hours</span>
        </div>
        <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl py-1.5 px-1">
          <span className="block text-base sm:text-lg font-black text-amber-300 font-mono leading-none">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mins</span>
        </div>
        <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl py-1.5 px-1">
          <span className="block text-base sm:text-lg font-black text-amber-400 font-mono leading-none">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Secs</span>
        </div>
      </div>
    </div>
  );
};
