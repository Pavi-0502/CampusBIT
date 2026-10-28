import React, { useState } from 'react';
import { useAuctions } from '../../context/AuctionContext';
import { queryAIAssistant, AIAssistantResponse } from '../../services/aiAssistantService';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { CountdownTimer } from '../common/CountdownTimer';
import { ConditionBadge } from '../common/Badge';
import { PlaceBidModal } from '../auction/PlaceBidModal';
import { Auction } from '../../types';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  ArrowRight,
  ShieldAlert,
  Gavel,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  response?: AIAssistantResponse;
  timestamp: string;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({ isOpen, onClose }) => {
  const { auctions } = useAuctions();
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-welcome',
      sender: 'assistant',
      text: "Hi! I'm your CampusBid AI Assistant. Ask me anything in natural language, for example:\n• \"Find me a scientific calculator under ₹1,000\"\n• \"Show cycles closing in the next hour\"\n• \"Find engineering books below ₹1,500\"",
      timestamp: new Date().toISOString(),
    },
  ]);

  // Modal for explicit authorization of proposed bids (Rule 14)
  const [targetAuctionForBid, setTargetAuctionForBid] = useState<Auction | null>(null);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      text: q,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const result = await queryAIAssistant(q, auctions);
      const assistantMsg: Message = {
        id: `msg-${Date.now()}-a`,
        sender: 'assistant',
        text: result.answerText,
        response: result,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizeProposedBid = (auctionId: string) => {
    const target = auctions.find((a) => a.id === auctionId);
    if (target) {
      setTargetAuctionForBid(target);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
        <div
          className="fixed inset-0"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-brand-900 to-accent-900 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-accent-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight">Campus AI Assistant</h3>
                <p className="text-[10px] text-accent-200">
                  Natural Language Search & Bidding Advisor
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
            {[
              'Cycles under ₹4,000',
              'Casio calculator',
              'Closing in next hour',
              'Hostel essentials',
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="shrink-0 text-[11px] font-medium bg-white hover:bg-brand-50 hover:text-brand-700 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-none font-medium'
                      : 'bg-surface-100 text-slate-800 rounded-tl-none border border-slate-200/80 shadow-2xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Applied filters badge */}
                  {msg.response?.appliedFilters && Object.keys(msg.response.appliedFilters).length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex flex-wrap gap-1">
                      {Object.entries(msg.response.appliedFilters).map(([k, v]) => (
                        <span
                          key={k}
                          className="bg-white text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200"
                        >
                          {k}: <strong className="text-slate-900">{v}</strong>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Matched Listings Cards */}
                  {msg.response?.matchedAuctions && msg.response.matchedAuctions.length > 0 && (
                    <div className="mt-3 space-y-2.5">
                      {msg.response.matchedAuctions.map((auc) => (
                        <div
                          key={auc.id}
                          className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs hover:shadow-subtle transition-all flex gap-3"
                        >
                          <img
                            src={auc.images[0]}
                            alt={auc.title}
                            className="w-16 h-16 rounded-lg object-cover shrink-0 bg-slate-100"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-xs truncate">
                              {auc.title}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1">
                              <ConditionBadge condition={auc.condition} />
                              <CountdownTimer endsAt={auc.ends_at} compact />
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <CurrencyDisplay paise={auc.current_price_paise} size="sm" />
                              <Link
                                to={`/auctions/${auc.id}`}
                                onClick={onClose}
                                className="text-[11px] font-bold text-brand-600 hover:text-brand-800 flex items-center gap-0.5"
                              >
                                View <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Proposed Bid Card (Rule 14: NEVER auto-places without confirmation) */}
                  {msg.response?.proposedBid && (
                    <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Proposed Bid Recommendation (Rule 14)</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-snug">
                        {msg.response.proposedBid.explanation}
                      </p>
                      <button
                        onClick={() => handleAuthorizeProposedBid(msg.response!.proposedBid!.auctionId)}
                        className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <Gavel className="w-3.5 h-3.5" />
                        Review & Authorize Proposed Bid
                      </button>
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-brand-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-xs text-slate-500">
                <div className="w-7 h-7 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <span>Searching live campus listings...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="E.g., Find cycle under ₹3,000 closing today..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white transition-colors shadow-2xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Place Bid Modal for Authorized Bid */}
      {targetAuctionForBid && (
        <PlaceBidModal
          auction={targetAuctionForBid}
          isOpen={true}
          onClose={() => setTargetAuctionForBid(null)}
          onSuccess={() => setTargetAuctionForBid(null)}
        />
      )}
    </>
  );
};
