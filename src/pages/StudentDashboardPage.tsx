import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuctions } from '../context/AuctionContext';
import { useAuth } from '../context/AuthContext';
import { AuctionCard } from '../components/auction/AuctionCard';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';
import { StatusBadge, ConditionBadge } from '../components/common/Badge';
import { formatRupees, paiseToRupees } from '../lib/currency';
import {
  Gavel,
  Trophy,
  AlertTriangle,
  Heart,
  Bookmark,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  User,
  Settings,
  Package,
} from 'lucide-react';

export const StudentDashboardPage: React.FC = () => {
  const { auctions, bids, watchlist, savedSearches, sales, confirmHandover } = useAuctions();
  const { currentUser, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'bids' | 'leading' | 'outbid' | 'won' | 'watchlist' | 'settings'
  >('bids');

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Please Sign In</h2>
        <p className="text-xs text-slate-500">
          Sign in with your campus email to view your student bidding hub.
        </p>
        <Link
          to="/auth"
          className="inline-block px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // Calculate user bids
  const myBids = bids.filter((b) => b.bidder_id === currentUser.id);
  const myBidAuctionIds = Array.from(new Set(myBids.map((b) => b.auction_id)));
  const myBidAuctions = auctions.filter((a) => myBidAuctionIds.includes(a.id));

  // Auctions leading
  const leadingAuctions = myBidAuctions.filter(
    (a) => a.status === 'ACTIVE' && a.current_leader_id === currentUser.id
  );

  // Outbid auctions
  const outbidAuctions = myBidAuctions.filter(
    (a) => a.status === 'ACTIVE' && a.current_leader_id !== currentUser.id
  );

  // Won auctions (awaiting approval, reserved, or sold)
  const wonSales = sales.filter((s) => s.buyer_id === currentUser.id);

  // Watchlisted auctions
  const watchlistedAuctions = auctions.filter((a) =>
    watchlist.some((w) => w.auction_id === a.id && w.user_id === currentUser.id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Student Profile Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {currentUser.avatar_url ? (
            <img
              src={currentUser.avatar_url}
              alt={currentUser.display_name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-100"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-xl">
              {currentUser.display_name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {currentUser.display_name}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified Student
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser.hostel_block || 'Campus Resident'} • {currentUser.campus_domain}
            </p>
          </div>
        </div>

        {/* Quick stats pills */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-surface-100 rounded-xl text-center">
            <span className="block text-sm font-black text-slate-900 font-mono">
              {myBidAuctions.length}
            </span>
            <span className="text-[10px] text-slate-500">Auctions Bid</span>
          </div>
          <div className="px-4 py-2 bg-emerald-50 rounded-xl text-center border border-emerald-100">
            <span className="block text-sm font-black text-emerald-700 font-mono">
              {leadingAuctions.length}
            </span>
            <span className="text-[10px] text-emerald-700">Leading</span>
          </div>
          <div className="px-4 py-2 bg-amber-50 rounded-xl text-center border border-amber-100">
            <span className="block text-sm font-black text-amber-700 font-mono">
              {outbidAuctions.length}
            </span>
            <span className="text-[10px] text-amber-700">Outbid</span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('bids')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'bids'
              ? 'bg-brand-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Gavel className="w-3.5 h-3.5" />
          All My Bids ({myBidAuctions.length})
        </button>

        <button
          onClick={() => setActiveTab('leading')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'leading'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          Leading ({leadingAuctions.length})
        </button>

        <button
          onClick={() => setActiveTab('outbid')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'outbid'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Outbid ({outbidAuctions.length})
        </button>

        <button
          onClick={() => setActiveTab('won')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'won'
              ? 'bg-accent-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Won & Pickup ({wonSales.length})
        </button>

        <button
          onClick={() => setActiveTab('watchlist')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'watchlist'
              ? 'bg-brand-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          Watchlist ({watchlistedAuctions.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'bids' && (
          <div className="space-y-4">
            {myBidAuctions.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <Gavel className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">You haven't placed any bids yet</h3>
                <p className="text-xs text-slate-500">Browse live student auctions to find second-hand campus items.</p>
                <Link to="/marketplace" className="inline-block px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs">
                  Browse Marketplace
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myBidAuctions.map((auc) => (
                  <AuctionCard key={auc.id} auction={auc} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'leading' && (
          <div className="space-y-4">
            {leadingAuctions.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
                <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">You are not leading any active auctions right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {leadingAuctions.map((auc) => (
                  <AuctionCard key={auc.id} auction={auc} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'outbid' && (
          <div className="space-y-4">
            {outbidAuctions.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-xs text-slate-500">You have no outbid listings. You're in the lead!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {outbidAuctions.map((auc) => (
                  <div key={auc.id} className="relative">
                    <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      Outbid! Counter-bid to win
                    </div>
                    <AuctionCard auction={auc} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'won' && (
          <div className="space-y-4">
            {wonSales.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">No won auctions yet. Keep bidding!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {wonSales.map((s) => {
                  const targetAuction = auctions.find((a) => a.id === s.auction_id);
                  return (
                    <div
                      key={s.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {targetAuction?.title || 'Campus Item'}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            {s.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Agreed Price: <strong>{formatRupees(paiseToRupees(s.agreed_price_paise))}</strong> • Pickup spot: {s.campus_pickup_location}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {s.status === 'RESERVED_FOR_PICKUP' && (
                          <button
                            onClick={() => confirmHandover(s.id)}
                            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs"
                          >
                            Confirm Campus Pickup
                          </button>
                        )}
                        <Link
                          to={`/auctions/${s.auction_id}`}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                        >
                          View Listing
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'watchlist' && (
          <div className="space-y-4">
            {watchlistedAuctions.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
                <Heart className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">Your watchlist is currently empty.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {watchlistedAuctions.map((auc) => (
                  <AuctionCard key={auc.id} auction={auc} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
