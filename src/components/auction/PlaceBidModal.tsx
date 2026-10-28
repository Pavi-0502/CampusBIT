import React, { useState } from 'react';
import { Auction } from '../../types';
import { Modal } from '../common/Modal';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { paiseToRupees, rupeesToPaise, formatRupees } from '../../lib/currency';
import { useAuctions } from '../../context/AuctionContext';
import { useAuth } from '../../context/AuthContext';
import { Gavel, AlertCircle, Sparkles, Clock, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlaceBidModalProps {
  auction: Auction;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PlaceBidModal: React.FC<PlaceBidModalProps> = ({
  auction,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { placeBid } = useAuctions();
  const { currentUser } = useAuth();

  const minRequiredPaise =
    !auction.current_leader_id || (auction.bids_count || 0) === 0
      ? auction.starting_price_paise
      : auction.current_price_paise + auction.minimum_increment_paise;

  const minRequiredRupees = paiseToRupees(minRequiredPaise);
  const [bidRupees, setBidRupees] = useState<number>(minRequiredRupees);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const quickIncrements = [0, 50, 100, 200, 500];

  const handleQuickAdd = (inc: number) => {
    setBidRupees(minRequiredRupees + inc);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountPaise = rupeesToPaise(bidRupees);
    if (amountPaise < minRequiredPaise) {
      setError(`Minimum bid must be at least ${formatRupees(minRequiredRupees)}`);
      return;
    }

    setLoading(true);
    try {
      const result = await placeBid(auction.id, amountPaise);
      if (!result.success) {
        setError(result.error || 'Failed to place bid');
      } else {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });

        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while placing your bid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Place Your Bid"
      description={`Bidding for: ${auction.title}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current status summary */}
        <div className="p-3.5 bg-surface-100 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 block uppercase font-semibold">
              Current Leading Bid
            </span>
            <CurrencyDisplay paise={auction.current_price_paise} size="md" />
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-500 block uppercase font-semibold">
              Min. Required Next Bid
            </span>
            <span className="font-bold text-sm text-brand-700">
              {formatRupees(minRequiredRupees)}
            </span>
          </div>
        </div>

        {/* Quick increment pills */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Quick Bid Options:
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {quickIncrements.map((inc) => {
              const val = minRequiredRupees + inc;
              const isSelected = bidRupees === val;
              return (
                <button
                  type="button"
                  key={inc}
                  onClick={() => handleQuickAdd(inc)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300 hover:bg-brand-50/50'
                  }`}
                >
                  {inc === 0 ? 'Min' : `+₹${inc}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom amount input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Or enter custom amount in Rupees (₹):
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-base">
              ₹
            </span>
            <input
              type="number"
              min={minRequiredRupees}
              step="10"
              value={bidRupees || ''}
              onChange={(e) => {
                setBidRupees(Number(e.target.value));
                setError(null);
              }}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono font-bold text-base text-slate-900"
              required
            />
          </div>
        </div>

        {/* Anti-sniping Rule 7 reminder */}
        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2 text-xs text-amber-900">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold">Anti-Sniping Rule:</span> Bids placed in the final 30 seconds automatically extend the auction by 60 seconds to guarantee fair competition.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Gavel className="w-4 h-4" />
            {loading ? 'Submitting Bid...' : `Confirm Bid of ${formatRupees(bidRupees)}`}
          </button>
        </div>
      </form>
    </Modal>
  );
};
