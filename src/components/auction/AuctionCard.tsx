import React from 'react';
import { Link } from 'react-router-dom';
import { Auction } from '../../types';
import { CurrencyDisplay } from '../common/CurrencyDisplay';
import { CountdownTimer } from '../common/CountdownTimer';
import { ConditionBadge, StatusBadge } from '../common/Badge';
import { useAuctions } from '../../context/AuctionContext';
import { Heart, Users, MapPin, Eye } from 'lucide-react';

export const AuctionCard: React.FC<{ auction: Auction }> = ({ auction }) => {
  const { isItemInWatchlist, toggleWatchlist } = useAuctions();
  const isWatchlisted = isItemInWatchlist(auction.id);

  const mainImage =
    auction.images && auction.images.length > 0
      ? auction.images[0]
      : 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-subtle hover:shadow-floating transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1">
      {/* Image Container with Badges */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={mainImage}
          alt={auction.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Floating Tags */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-slate-800 shadow-sm border border-slate-200/60">
              {auction.category}
            </span>
            <ConditionBadge condition={auction.condition} />
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWatchlist(auction.id);
            }}
            className={`pointer-events-auto p-2 rounded-full backdrop-blur-md shadow-sm transition-transform active:scale-90 ${
              isWatchlisted
                ? 'bg-red-50 text-red-500 fill-red-500'
                : 'bg-white/80 hover:bg-white text-slate-600 hover:text-red-500'
            }`}
            title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
            aria-label="Toggle Watchlist"
          >
            <Heart className={`w-4 h-4 ${isWatchlisted ? 'fill-current text-red-500' : ''}`} />
          </button>
        </div>

        {/* Countdown Floating Pill at Bottom of Image */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <CountdownTimer endsAt={auction.ends_at} compact className="pointer-events-auto shadow-sm" />
          {auction.sniper_extended_count > 0 && (
            <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded shadow-sm">
              +{auction.sniper_extended_count}m sniper ext
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <Link to={`/auctions/${auction.id}`} className="block group-hover:text-brand-700 transition-colors">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-2 leading-snug">
            {auction.title}
          </h3>
        </Link>

        {/* Seller Info & Location */}
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate max-w-[150px]">
              {auction.seller?.hostel_block || 'Campus Resident'}
            </span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{auction.bids_count || 0} bids</span>
          </div>
        </div>

        {/* Price & Action Section */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wide">
              {auction.bids_count && auction.bids_count > 0 ? 'Current Bid' : 'Starting Bid'}
            </span>
            <CurrencyDisplay paise={auction.current_price_paise} size="md" />
          </div>

          <Link
            to={`/auctions/${auction.id}`}
            className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs transition-colors flex items-center gap-1"
          >
            {auction.status === 'ACTIVE' ? 'Bid Now' : 'View Details'}
          </Link>
        </div>
      </div>
    </div>
  );
};
