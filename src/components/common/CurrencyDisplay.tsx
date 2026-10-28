import React from 'react';
import { formatPaise, formatRupees, paiseToRupees } from '../../lib/currency';

interface CurrencyDisplayProps {
  paise: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showSubtext?: string;
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  paise,
  size = 'md',
  showSubtext,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-bold',
    lg: 'text-xl font-bold tracking-tight',
    xl: 'text-2xl sm:text-3xl font-extrabold tracking-tight',
    '2xl': 'text-3xl sm:text-4xl font-black tracking-tight',
  };

  return (
    <div className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <span className={`text-slate-900 font-sans ${sizeClasses[size]}`}>
        {formatPaise(paise)}
      </span>
      {showSubtext && (
        <span className="text-xs font-normal text-slate-500">
          {showSubtext}
        </span>
      )}
    </div>
  );
};
