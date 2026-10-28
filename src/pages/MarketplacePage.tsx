import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuctions } from '../context/AuctionContext';
import { useAuth } from '../context/AuthContext';
import { AuctionCard } from '../components/auction/AuctionCard';
import { ItemCategory, ItemCondition } from '../types';
import { rupeesToPaise } from '../lib/currency';
import {
  Search,
  SlidersHorizontal,
  BookmarkPlus,
  RotateCcw,
  Clock,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Tag,
} from 'lucide-react';

const CATEGORIES: (ItemCategory | 'All')[] = [
  'All',
  'Cycles',
  'Calculators',
  'Books',
  'Electronics',
  'Furniture',
  'Hostel Essentials',
  'Accessories',
  'Other',
];

const CONDITIONS: (ItemCondition | 'All')[] = ['All', 'Like New', 'Good', 'Fair', 'Needs Repair'];

export const MarketplacePage: React.FC = () => {
  const { auctions, saveSearch } = useAuctions();
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & filter state initialized from URL query params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'All'>(
    (searchParams.get('category') as ItemCategory) || 'All'
  );
  const [selectedCondition, setSelectedCondition] = useState<ItemCondition | 'All'>('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<
    'ending-soon' | 'newest' | 'price-asc' | 'price-desc' | 'bids-count'
  >('ending-soon');
  const [statusTab, setStatusTab] = useState<'active' | 'ending-soon' | 'completed'>(
    (searchParams.get('tab') as any) || 'active'
  );

  const [savedSearchSuccess, setSavedSearchSuccess] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Filtered and sorted auctions
  const filteredAuctions = useMemo(() => {
    return auctions.filter((auc) => {
      // Status tab
      const now = Date.now();
      const endsAtMs = new Date(auc.ends_at).getTime();

      if (statusTab === 'active') {
        if (auc.status !== 'ACTIVE') return false;
      } else if (statusTab === 'ending-soon') {
        if (auc.status !== 'ACTIVE') return false;
        const hoursLeft = (endsAtMs - now) / (3600 * 1000);
        if (hoursLeft > 24) return false; // Ending in < 24 hours
      } else if (statusTab === 'completed') {
        if (!['ENDED', 'UNSOLD', 'AWAITING_SELLER_DECISION', 'RESERVED', 'SOLD', 'REJECTED', 'CANCELLED'].includes(auc.status)) {
          return false;
        }
      }

      // Keyword search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = auc.title.toLowerCase().includes(term);
        const matchesDesc = auc.description.toLowerCase().includes(term);
        const matchesCat = auc.category.toLowerCase().includes(term);
        if (!matchesTitle && !matchesDesc && !matchesCat) return false;
      }

      // Category
      if (selectedCategory !== 'All' && auc.category !== selectedCategory) {
        return false;
      }

      // Condition
      if (selectedCondition !== 'All' && auc.condition !== selectedCondition) {
        return false;
      }

      // Price filter
      if (minPrice && auc.current_price_paise < rupeesToPaise(Number(minPrice))) {
        return false;
      }
      if (maxPrice && auc.current_price_paise > rupeesToPaise(Number(maxPrice))) {
        return false;
      }

      return true;
    });
  }, [auctions, statusTab, searchTerm, selectedCategory, selectedCondition, minPrice, maxPrice]);

  // Sorting
  const sortedAuctions = useMemo(() => {
    const list = [...filteredAuctions];
    switch (sortBy) {
      case 'ending-soon':
        return list.sort(
          (a, b) => new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime()
        );
      case 'newest':
        return list.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case 'price-asc':
        return list.sort((a, b) => a.current_price_paise - b.current_price_paise);
      case 'price-desc':
        return list.sort((a, b) => b.current_price_paise - a.current_price_paise);
      case 'bids-count':
        return list.sort((a, b) => (b.bids_count || 0) - (a.bids_count || 0));
      default:
        return list;
    }
  }, [filteredAuctions, sortBy]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedCondition('All');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('ending-soon');
  };

  const handleSaveSearch = async () => {
    if (!currentUser) return;
    await saveSearch({
      query: searchTerm || undefined,
      category: selectedCategory !== 'All' ? selectedCategory : undefined,
      condition: selectedCondition !== 'All' ? selectedCondition : undefined,
      maximum_price_paise: maxPrice ? rupeesToPaise(Number(maxPrice)) : undefined,
      active: true,
    });
    setSavedSearchSuccess(true);
    setTimeout(() => setSavedSearchSuccess(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Campus Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Discover active second-hand student auctions with verified hostel pickup.
          </p>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setStatusTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusTab === 'active'
                ? 'bg-white text-brand-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Active
          </button>
          <button
            onClick={() => setStatusTab('ending-soon')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusTab === 'ending-soon'
                ? 'bg-red-50 text-red-600 shadow-sm border border-red-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-red-500" />
            Ending Soon (&lt;24h)
          </button>
          <button
            onClick={() => setStatusTab('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusTab === 'completed'
                ? 'bg-white text-brand-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Past / Completed
          </button>
        </div>
      </div>

      {/* Main Search & Quick Category Chips */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by keywords (e.g. cycle, Casio FX-991CW, CLRS book, laptop)..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium"
          />
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-brand-900 text-white border-brand-950 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Filters & Results layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Desktop Sidebar Filters */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5 lg:sticky lg:top-28">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-brand-600" />
              Filter Auctions
            </span>
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-brand-700 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          {/* Condition Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Item Condition</label>
            <div className="space-y-1.5">
              {CONDITIONS.map((cond) => (
                <label key={cond} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="radio"
                    name="condition"
                    checked={selectedCondition === cond}
                    onChange={() => setSelectedCondition(cond)}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <span>{cond}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Price Range (₹)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min ₹"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Save Search Alert (Section 4J) */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleSaveSearch}
              className="w-full py-2 px-3 rounded-xl bg-surface-100 hover:bg-brand-50 text-brand-900 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-brand-600" />
              Save Search & Get Alerts
            </button>
            {savedSearchSuccess && (
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 justify-center mt-1.5">
                <CheckCircle className="w-3 h-3" /> Saved! You'll be alerted on matches.
              </span>
            )}
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Sort bar & count */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-600 font-semibold">
              Showing <strong className="text-slate-900">{sortedAuctions.length}</strong> items
            </span>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-surface-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                <option value="ending-soon">Closing Soon</option>
                <option value="newest">Recently Listed</option>
                <option value="price-asc">Lowest Price</option>
                <option value="price-desc">Highest Price</option>
                <option value="bids-count">Most Bids</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {sortedAuctions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-2xs">
              <Tag className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No matching auctions found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try widening your price range or clearing category filters. You can also save this search to be notified when a fellow student posts it.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-brand-50 text-brand-700 font-bold text-xs rounded-xl hover:bg-brand-100 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {sortedAuctions.map((auc) => (
                <AuctionCard key={auc.id} auction={auc} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
