import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuctions } from '../context/AuctionContext';
import { useAuth } from '../context/AuthContext';
import { AuctionCard } from '../components/auction/AuctionCard';
import { CurrencyDisplay } from '../components/common/CurrencyDisplay';
import { StatusBadge } from '../components/common/Badge';
import { formatRupees, paiseToRupees } from '../lib/currency';
import { Modal } from '../components/common/Modal';
import {
  Store,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Truck,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  Package,
} from 'lucide-react';

export const SellerDashboardPage: React.FC = () => {
  const { auctions, sales, approveSale, rejectSale, confirmHandover, recordFailedPickup, cancelAuction } =
    useAuctions();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'active' | 'awaiting' | 'reserved' | 'completed'>('active');
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [targetAuctionId, setTargetAuctionId] = useState<string | null>(null);
  const [failedPickupModalOpen, setFailedPickupModalOpen] = useState(false);
  const [failedPickupReason, setFailedPickupReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Please Sign In</h2>
        <p className="text-xs text-slate-500">Sign in to manage your campus sales and listings.</p>
        <Link to="/auth" className="inline-block px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs">
          Sign In
        </Link>
      </div>
    );
  }

  // Seller's auctions
  const myListings = auctions.filter((a) => a.seller_id === currentUser.id);
  const activeListings = myListings.filter((a) => a.status === 'ACTIVE');
  const awaitingDecisionListings = myListings.filter((a) => a.status === 'AWAITING_SELLER_DECISION');
  const reservedListings = myListings.filter((a) => a.status === 'RESERVED');
  const completedListings = myListings.filter((a) => a.status === 'SOLD');

  const mySales = sales.filter((s) => s.seller_id === currentUser.id);

  const handleApprove = async (auctionId: string) => {
    setActionLoading(true);
    await approveSale(auctionId);
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!targetAuctionId) return;
    setActionLoading(true);
    await rejectSale(targetAuctionId, rejectReason);
    setActionLoading(false);
    setRejectModalOpen(false);
    setRejectReason('');
  };

  const handleHandover = async (saleId: string) => {
    setActionLoading(true);
    await confirmHandover(saleId);
    setActionLoading(false);
  };

  const handleFailedPickup = async () => {
    if (!selectedSaleId) return;
    setActionLoading(true);
    await recordFailedPickup(selectedSaleId, failedPickupReason);
    setActionLoading(false);
    setFailedPickupModalOpen(false);
    setFailedPickupReason('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Seller Hub & Auction Decisions
            </h1>
            <p className="text-xs text-slate-500">
              Manage your listings, approve winning bids (Rule 9), and finalize campus handovers.
            </p>
          </div>
        </div>

        <Link
          to="/create"
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          List New Item
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'active'
              ? 'bg-brand-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Active Listings ({activeListings.length})
        </button>

        <button
          onClick={() => setActiveTab('awaiting')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'awaiting'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Awaiting Decision ({awaitingDecisionListings.length})
        </button>

        <button
          onClick={() => setActiveTab('reserved')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'reserved'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          Reserved & Handover ({reservedListings.length})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'completed'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Completed Sales ({completedListings.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeListings.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <Store className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">No active listings</h3>
                <p className="text-xs text-slate-500">List an item to start receiving student bids.</p>
                <Link to="/create" className="inline-block px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs">
                  List Item
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeListings.map((auc) => (
                  <AuctionCard key={auc.id} auction={auc} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'awaiting' && (
          <div className="space-y-4">
            {awaitingDecisionListings.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-xs text-slate-500">No auctions awaiting your decision right now.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {awaitingDecisionListings.map((auc) => (
                  <div
                    key={auc.id}
                    className="bg-white p-6 rounded-3xl border border-amber-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">{auc.title}</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Closed • Decision Required
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Final Leading Bid:{' '}
                        <strong className="text-brand-900 font-mono text-sm">
                          {formatRupees(paiseToRupees(auc.current_price_paise))}
                        </strong>{' '}
                        by Provisional Winner ID: {auc.provisional_winner_id?.substring(0, 8)}...
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(auc.id)}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve Price
                      </button>
                      <button
                        onClick={() => {
                          setTargetAuctionId(auc.id);
                          setRejectModalOpen(true);
                        }}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Price
                      </button>
                      <Link
                        to={`/auctions/${auc.id}`}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reserved' && (
          <div className="space-y-4">
            {reservedListings.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
                <Truck className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">No items currently reserved for pickup.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reservedListings.map((auc) => {
                  const saleItem = mySales.find((s) => s.auction_id === auc.id);
                  return (
                    <div
                      key={auc.id}
                      className="bg-white p-6 rounded-3xl border border-purple-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-base">{auc.title}</span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
                            Reserved for Pickup
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Reserved at {formatRupees(paiseToRupees(auc.current_price_paise))} • Recommended pickup spot: Hostel Common Room
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {saleItem && (
                          <button
                            onClick={() => handleHandover(saleItem.id)}
                            disabled={actionLoading}
                            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                          >
                            <Truck className="w-4 h-4" />
                            Confirm Campus Handover
                          </button>
                        )}
                        {saleItem && (
                          <button
                            onClick={() => {
                              setSelectedSaleId(saleItem.id);
                              setFailedPickupModalOpen(true);
                            }}
                            disabled={actionLoading}
                            className="px-3.5 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                          >
                            Record Failed Pickup
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="space-y-4">
            {completedListings.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-2">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">No completed sales yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedListings.map((auc) => (
                  <AuctionCard key={auc.id} auction={auc} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Winning Bid Price"
        description="Rule 9: Records rejection reason and prevents sale"
      >
        <div className="space-y-3 text-xs">
          <label className="block font-semibold text-slate-700">Reason for Rejection:</label>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="E.g. Price is lower than reserved threshold..."
            className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="px-3 py-1.5 text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold"
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
        description="Rule 11: Releases item reservation without erasing records"
      >
        <div className="space-y-3 text-xs">
          <label className="block font-semibold text-slate-700">Reason for Missed Handover:</label>
          <textarea
            rows={3}
            value={failedPickupReason}
            onChange={(e) => setFailedPickupReason(e.target.value)}
            placeholder="E.g. Buyer did not show up..."
            className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setFailedPickupModalOpen(false)}
              className="px-3 py-1.5 text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleFailedPickup}
              disabled={actionLoading || !failedPickupReason.trim()}
              className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold"
            >
              Release Reservation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
