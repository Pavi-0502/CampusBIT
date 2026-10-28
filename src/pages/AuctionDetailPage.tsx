import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuctions } from '../context/AuctionContext';
import { useAuth } from '../context/AuthContext';
import { ImageGallery } from '../components/auction/ImageGallery';
import { BidHistoryTable } from '../components/auction/BidHistoryTable';
import { PlaceBidModal } from '../components/auction/PlaceBidModal';
import { AutoBidModal } from '../components/auction/AutoBidModal';
import { QASection } from '../components/auction/QASection';
import { CountdownTimer } from '../components/common/CountdownTimer';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';
import { StatusBadge, ConditionBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { formatRupees, paiseToRupees } from '../lib/currency';
import {
  Gavel,
  Bot,
  Heart,
  ShieldCheck,
  MapPin,
  Star,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  Share2,
  Lock,
} from 'lucide-react';

export const AuctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getAuctionById,
    getBidsForAuction,
    isItemInWatchlist,
    toggleWatchlist,
    sales,
    approveSale,
    rejectSale,
    confirmHandover,
    recordFailedPickup,
    cancelAuction,
  } = useAuctions();
  const { currentUser } = useAuth();

  const auction = getAuctionById(id || '');
  const bids = getBidsForAuction(id || '');
  const sale = sales.find((s) => s.auction_id === id);

  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [autoBidModalOpen, setAutoBidModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [failedPickupModalOpen, setFailedPickupModalOpen] = useState(false);
  const [failedPickupReason, setFailedPickupReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!auction) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Auction Listing Not Found</h2>
        <p className="text-xs text-slate-500">The listing may have been removed or does not exist.</p>
        <Link
          to="/marketplace"
          className="inline-block px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const isSeller = currentUser?.id === auction.seller_id;
  const isLeader = currentUser?.id === auction.current_leader_id;
  const isWatchlisted = isItemInWatchlist(auction.id);
  const isAuctionActive = auction.status === 'ACTIVE';

  const minNextPaise =
    !auction.current_leader_id || bids.length === 0
      ? auction.starting_price_paise
      : auction.current_price_paise + auction.minimum_increment_paise;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleApproveWinningBid = async () => {
    setActionLoading(true);
    await approveSale(auction.id);
    setActionLoading(false);
  };

  const handleRejectWinningBid = async () => {
    setActionLoading(true);
    await rejectSale(auction.id, rejectReason);
    setActionLoading(false);
    setRejectModalOpen(false);
  };

  const handleConfirmHandover = async () => {
    if (!sale) return;
    setActionLoading(true);
    await confirmHandover(sale.id);
    setActionLoading(false);
  };

  const handleRecordFailedPickup = async () => {
    if (!sale) return;
    setActionLoading(true);
    await recordFailedPickup(sale.id, failedPickupReason);
    setActionLoading(false);
    setFailedPickupModalOpen(false);
  };

  const handleCancelAuction = async () => {
    setActionLoading(true);
    await cancelAuction(auction.id, cancelReason);
    setActionLoading(false);
    setCancelModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb & Top Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Link to="/marketplace" className="hover:text-brand-700">Marketplace</Link>
          <span>/</span>
          <span>{auction.category}</span>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-md">
            {auction.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-medium text-slate-700"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copiedLink ? 'Link Copied!' : 'Share'}
          </button>
          <button
            onClick={() => toggleWatchlist(auction.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-medium ${
              isWatchlisted
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-current text-red-600' : ''}`} />
            {isWatchlisted ? 'Watchlisted' : 'Watchlist'}
          </button>
        </div>
      </div>

      {/* Main Grid: Gallery + Bidding Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Gallery & Description & Q&A */}
        <div className="lg:col-span-7 space-y-6">
          <ImageGallery images={auction.images} title={auction.title} />

          {/* Description & Item Specs */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Item Description</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {auction.description}
            </p>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-surface-100 rounded-xl">
                <span className="text-slate-500 block text-[11px]">Category</span>
                <span className="font-bold text-slate-900">{auction.category}</span>
              </div>
              <div className="p-3 bg-surface-100 rounded-xl">
                <span className="text-slate-500 block text-[11px]">Condition</span>
                <span className="font-bold text-slate-900">{auction.condition}</span>
              </div>
              <div className="p-3 bg-surface-100 rounded-xl">
                <span className="text-slate-500 block text-[11px]">Handover Spot</span>
                <span className="font-bold text-slate-900 truncate">
                  {auction.seller?.hostel_block || 'Hostel Quadrangle'}
                </span>
              </div>
            </div>
          </div>

          {/* Q&A Component */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
            <QASection auctionId={auction.id} sellerId={auction.seller_id} />
          </div>
        </div>

        {/* Right column: Price, Live Countdown, Actions & Bid History */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-floating space-y-5">
            {/* Title & Badges */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={auction.status} />
                <ConditionBadge condition={auction.condition} />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {auction.title}
              </h1>
            </div>

            {/* Live Countdown Display */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Time Remaining:
              </span>
              <CountdownTimer endsAt={auction.ends_at} showLabels={true} />
              {auction.sniper_extended_count > 0 && (
                <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Extended by {auction.sniper_extended_count} min{auction.sniper_extended_count > 1 ? 's' : ''} via 30s anti-sniping protection rule.
                  </span>
                </div>
              )}
            </div>

            {/* Current Price and Minimum Increment */}
            <div className="p-4 bg-surface-100 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-semibold block uppercase">
                    {bids.length > 0 ? 'Current Leading Bid' : 'Starting Price'}
                  </span>
                  <CurrencyDisplay paise={auction.current_price_paise} size="2xl" />
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 font-semibold block uppercase">
                    Min Increment
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    +{formatRupees(paiseToRupees(auction.minimum_increment_paise))}
                  </span>
                </div>
              </div>

              {auction.current_leader_id && (
                <div className="text-xs pt-2 border-t border-slate-200/60 flex items-center justify-between text-slate-600">
                  <span>Current Leader:</span>
                  <span className="font-bold text-slate-900">
                    {auction.current_leader_pseudonym || 'Campus Bidder'}
                    {isLeader && ' (You!)'}
                  </span>
                </div>
              )}
            </div>

            {/* Main Action Buttons */}
            {isAuctionActive && !isSeller && (
              <div className="space-y-2.5">
                <button
                  onClick={() => setBidModalOpen(true)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Gavel className="w-5 h-5" />
                  Place Bid (Min. {formatRupees(paiseToRupees(minNextPaise))})
                </button>

                <button
                  onClick={() => setAutoBidModalOpen(true)}
                  className="w-full py-2.5 px-4 rounded-2xl bg-accent-50 hover:bg-accent-100 text-accent-800 border border-accent-200/80 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Bot className="w-4 h-4 text-accent-600" />
                  Set Private Auto-Bid Budget
                </button>
              </div>
            )}

            {/* Seller Management Panel */}
            {isSeller && (
              <div className="p-4 bg-brand-50/70 rounded-2xl border border-brand-200 space-y-3">
                <div className="flex items-center gap-2 text-brand-900 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-brand-600" />
                  <span>You Are the Seller</span>
                </div>

                {auction.status === 'ACTIVE' && bids.length === 0 && (
                  <button
                    onClick={() => setCancelModalOpen(true)}
                    className="w-full py-2 px-3 rounded-xl bg-white border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors"
                  >
                    Cancel Listing (0 Bids)
                  </button>
                )}

                {auction.status === 'AWAITING_SELLER_DECISION' && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Auction closed at <strong>{formatRupees(paiseToRupees(auction.current_price_paise))}</strong>. Please approve or decline the provisional winning bid:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleApproveWinningBid}
                        disabled={actionLoading}
                        className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve Price
                      </button>
                      <button
                        onClick={() => setRejectModalOpen(true)}
                        disabled={actionLoading}
                        className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Price
                      </button>
                    </div>
                  </div>
                )}

                {auction.status === 'RESERVED' && (
                  <div className="space-y-2">
                    <p className="text-xs text-purple-900 font-medium">
                      Item is currently reserved for buyer. Meet on campus to finalize:
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={handleConfirmHandover}
                        disabled={actionLoading}
                        className="w-full py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <Truck className="w-4 h-4" />
                        Confirm Campus Handover
                      </button>
                      <button
                        onClick={() => setFailedPickupModalOpen(true)}
                        disabled={actionLoading}
                        className="w-full py-2 px-3 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs"
                      >
                        Record Failed Pickup
                      </button>
                    </div>
                  </div>
                )}

                {auction.status === 'SOLD' && (
                  <div className="p-2.5 bg-emerald-100/70 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    Sale and campus handover successfully completed!
                  </div>
                )}
              </div>
            )}

            {/* Seller Public Profile Card */}
            <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
              {auction.seller?.avatar_url ? (
                <img
                  src={auction.seller.avatar_url}
                  alt={auction.seller.display_name}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-base">
                  {auction.seller?.display_name?.charAt(0) || 'S'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-sm truncate">
                    {auction.seller?.display_name || 'Senior Student'}
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {auction.seller?.rating || '5.0'}
                  </span>
                  <span>•</span>
                  <span>{auction.seller?.total_sales || 0} completed sales</span>
                </div>
              </div>
            </div>
          </div>

          {/* Full Public Bid History Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Public Bid History ({bids.length})
              </h3>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                Pseudonymized IDs
              </span>
            </div>
            <BidHistoryTable bids={bids} currentLeaderId={auction.current_leader_id} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <PlaceBidModal
        auction={auction}
        isOpen={bidModalOpen}
        onClose={() => setBidModalOpen(false)}
      />

      <AutoBidModal
        auction={auction}
        isOpen={autoBidModalOpen}
        onClose={() => setAutoBidModalOpen(false)}
      />

      {/* Cancel Listing Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Auction Listing"
        description="Rule 12: Reason is recorded for audit purposes"
      >
        <div className="space-y-3 text-xs">
          <label className="block font-semibold text-slate-700">Reason for Cancellation:</label>
          <textarea
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="E.g. Decided to keep item, damaged during move..."
            className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setCancelModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-slate-600"
            >
              Back
            </button>
            <button
              onClick={handleCancelAuction}
              disabled={actionLoading || !cancelReason.trim()}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Price Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Winning Price"
        description="Rule 9: Declines the sale. Item will not be sold to provisional winner."
      >
        <div className="space-y-3 text-xs">
          <label className="block font-semibold text-slate-700">Reason for Rejection:</label>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="E.g. Reserve price not met, will re-list next semester..."
            className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectWinningBid}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>

      {/* Failed Pickup Modal */}
      <Modal
        isOpen={failedPickupModalOpen}
        onClose={() => setFailedPickupModalOpen(false)}
        title="Record Failed Pickup"
        description="Rule 11: Releases item reservation without erasing historical records"
      >
        <div className="space-y-3 text-xs">
          <label className="block font-semibold text-slate-700">Explanation of Missed Handover:</label>
          <textarea
            rows={3}
            value={failedPickupReason}
            onChange={(e) => setFailedPickupReason(e.target.value)}
            placeholder="E.g. Buyer did not arrive at hostel gate after 48h agreement..."
            className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setFailedPickupModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleRecordFailedPickup}
              disabled={actionLoading || !failedPickupReason.trim()}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Release Reservation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
