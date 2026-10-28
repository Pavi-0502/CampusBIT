import React, { useState, useEffect } from 'react';
import { formatTimeRemaining } from '../../lib/utils';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  endsAt: string;
  onExpire?: () => void;
  showLabels?: boolean;
  compact?: boolean;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  endsAt,
  onExpire,
  showLabels = false,
  compact = false,
  className = '',
}) => {
  const [time, setTime] = useState(() => formatTimeRemaining(endsAt));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = formatTimeRemaining(endsAt);
      setTime(remaining);
      if (remaining.isExpired) {
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endsAt, onExpire]);

  if (time.isExpired) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 ${className}`}>
        <Clock className="w-3.5 h-3.5" />
        Bidding Closed
      </span>
    );
  }

  // Very urgent: less than 60 seconds (anti-sniping danger zone!)
  const isSuperUrgent = time.totalSeconds <= 60;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
          isSuperUrgent
            ? 'bg-red-50 text-red-600 font-bold animate-pulse'
            : time.isUrgent
            ? 'bg-amber-50 text-amber-700'
            : 'bg-indigo-50 text-indigo-700'
        } ${className}`}
      >
        {isSuperUrgent ? (
          <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-bounce" />
        ) : (
          <Clock className="w-3.5 h-3.5" />
        )}
        {time.days > 0 && `${time.days}d `}
        {time.hours > 0 && `${time.hours}h `}
        {time.minutes}m {time.seconds}s
      </span>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 p-2.5 rounded-xl border ${
        isSuperUrgent
          ? 'bg-red-50/80 border-red-300 text-red-900 animate-pulse'
          : time.isUrgent
          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
          : 'bg-brand-50/60 border-brand-100 text-brand-950'
      } ${className}`}
    >
      {isSuperUrgent ? (
        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
      ) : (
        <Clock className="w-5 h-5 text-brand-600 shrink-0" />
      )}
      <div className="flex items-center gap-1.5 font-mono font-bold text-sm sm:text-base">
        {time.days > 0 && (
          <div className="text-center">
            <span className="bg-white px-2 py-1 rounded shadow-sm border border-slate-200">
              {String(time.days).padStart(2, '0')}
            </span>
            {showLabels && <span className="block text-[10px] font-sans font-normal text-slate-500 mt-0.5">days</span>}
          </div>
        )}
        {(time.days > 0 || time.hours > 0) && (
          <>
            <div className="text-center">
              <span className="bg-white px-2 py-1 rounded shadow-sm border border-slate-200">
                {String(time.hours).padStart(2, '0')}
              </span>
              {showLabels && <span className="block text-[10px] font-sans font-normal text-slate-500 mt-0.5">hrs</span>}
            </div>
            <span className="text-slate-400 font-sans">:</span>
          </>
        )}
        <div className="text-center">
          <span className="bg-white px-2 py-1 rounded shadow-sm border border-slate-200">
            {String(time.minutes).padStart(2, '0')}
          </span>
          {showLabels && <span className="block text-[10px] font-sans font-normal text-slate-500 mt-0.5">min</span>}
        </div>
        <span className="text-slate-400 font-sans">:</span>
        <div className="text-center">
          <span className={`bg-white px-2 py-1 rounded shadow-sm border ${isSuperUrgent ? 'border-red-400 text-red-600 font-extrabold' : 'border-slate-200'}`}>
            {String(time.seconds).padStart(2, '0')}
          </span>
          {showLabels && <span className="block text-[10px] font-sans font-normal text-slate-500 mt-0.5">sec</span>}
        </div>
      </div>
      {isSuperUrgent && (
        <span className="text-xs font-semibold text-red-700 uppercase tracking-wider ml-auto">
          Sniper Zone!
        </span>
      )}
    </div>
  );
};
