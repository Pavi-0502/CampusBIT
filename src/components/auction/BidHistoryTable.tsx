import React from 'react';
import { Bid } from '../../types';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { Trophy, Bot, User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BidHistoryTableProps {
  bids: Bid[];
  currentLeaderId?: string | null;
}

export const BidHistoryTable: React.FC<BidHistoryTableProps> = ({ bids, currentLeaderId }) => {
  if (bids.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-700">No bids yet</p>
        <p className="text-xs text-slate-500 mt-0.5">Be the first verified student to bid on this item!</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-surface-100 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Bidder (Pseudonym)</th>
              <th className="px-4 py-3">Bid Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bids.map((bid, index) => {
              const isLeading = index === 0;
              return (
                <tr
                  key={bid.id}
                  className={`transition-colors ${
                    isLeading ? 'bg-amber-50/50 font-medium text-slate-900' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Bidder name */}
                  <td className="px-4 py-3 flex items-center gap-2">
                    {isLeading ? (
                      <span className="p-1 rounded-full bg-amber-100 text-amber-700 shrink-0" title="Current Leading Bidder">
                        <Trophy className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="p-1 rounded-full bg-slate-100 text-slate-500 shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span className="font-semibold text-slate-900 truncate max-w-[140px] sm:max-w-none">
                      {bid.bidder_pseudonym || 'Campus Bidder'}
                    </span>
                    {isLeading && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 hidden sm:inline-block">
                        Leading
                      </span>
                    )}
                  </td>

                  {/* Bid type */}
                  <td className="px-4 py-3">
                    {bid.bid_type === 'AUTOMATIC' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent-700 bg-accent-50 px-2 py-0.5 rounded-md border border-accent-200">
                        <Bot className="w-3 h-3 text-accent-600" />
                        Auto-Bid
                      </span>
                    ) : (
                      <span className="text-slate-500">Manual Bid</span>
                    )}
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3">
                    <CurrencyDisplay paise={bid.amount_paise} size="sm" />
                  </td>

                  {/* Timestamp */}
                  <td className="px-4 py-3 text-right text-slate-400 font-mono text-[11px]" title={new Date(bid.created_at).toLocaleString()}>
                    {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
