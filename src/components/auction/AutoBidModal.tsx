import React, { useState } from 'react';
import { Auction } from '../../types';
import { Modal } from '../common/Modal';
import { paiseToRupees, rupeesToPaise, formatRupees } from '../../lib/currency';
import { useAuctions } from '../../context/AuctionContext';
import { Bot, Shield, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

interface AutoBidModalProps {
  auction: Auction;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AutoBidModal: React.FC<AutoBidModalProps> = ({
  auction,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { setAutoBid, getUserAutoBidForAuction, removeAutoBid } = useAuctions();
  const existingAutoBid = getUserAutoBidForAuction(auction.id);

  const minNextPaise = auction.current_price_paise + auction.minimum_increment_paise;
  const minNextRupees = paiseToRupees(minNextPaise);

  const [maxRupees, setMaxRupees] = useState<number>(
    existingAutoBid ? paiseToRupees(existingAutoBid.maximum_amount_paise) : minNextRupees + 200
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const maxPaise = rupeesToPaise(maxRupees);
    if (maxPaise < minNextPaise) {
      setError(`Your maximum budget must be at least ${formatRupees(minNextRupees)}`);
      return;
    }

    setLoading(true);
    try {
      const res = await setAutoBid(auction.id, maxPaise);
      if (!res.success) {
        setError(res.error || 'Failed to configure auto-bid');
      } else {
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Error configuring auto-bid');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setLoading(true);
    await removeAutoBid(auction.id);
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Automatic Proxy Bidding"
      description={`Set your private maximum budget for: ${auction.title}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Privacy badge */}
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-900">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Strict Privacy Guaranteed (Rule 13):</span>
            <p className="mt-0.5 text-emerald-800 leading-relaxed">
              Your maximum budget is encrypted and completely hidden from the seller, other bidders, and the AI assistant. The system only bids the minimum increment needed to keep you ahead.
            </p>
          </div>
        </div>

        {existingAutoBid && (
          <div className="p-3 bg-accent-50 rounded-xl border border-accent-200 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-accent-900 block">Active Auto-Bid Configured</span>
              <span className="text-accent-700">
                Current limit: {formatRupees(paiseToRupees(existingAutoBid.maximum_amount_paise))}
              </span>
            </div>
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={loading}
              className="text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Cancel Auto-Bid
            </button>
          </div>
        )}

        {/* Max budget input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Your Maximum Bid Budget (in ₹):
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-base">
              ₹
            </span>
            <input
              type="number"
              min={minNextRupees}
              step="50"
              value={maxRupees || ''}
              onChange={(e) => {
                setMaxRupees(Number(e.target.value));
                setError(null);
              }}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent-500 font-mono font-bold text-base text-slate-900"
              required
            />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Minimum required to activate: {formatRupees(minNextRupees)}
          </span>
        </div>

        {/* How Proxy Bidding Works */}
        <div className="bg-surface-100 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
          <h5 className="font-bold text-slate-800">How Proxy Bidding Works:</h5>
          <ul className="list-disc pl-4 space-y-1 text-slate-600">
            <li>We place bids automatically only when someone challenges your lead.</li>
            <li>We never bid more than your confirmed maximum.</li>
            <li>If another student has equal maximum, earlier registration wins tie-breaks.</li>
          </ul>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Buttons */}
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
            className="px-5 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Bot className="w-4 h-4" />
            {loading ? 'Activating...' : `Activate Auto-Bid up to ${formatRupees(maxRupees)}`}
          </button>
        </div>
      </form>
    </Modal>
  );
};
