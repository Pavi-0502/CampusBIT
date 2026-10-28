import React from 'react';
import { Link } from 'react-router-dom';
import { useAuctions } from '../context/AuctionContext';
import { useAuth } from '../context/AuthContext';
import { formatRupees, paiseToRupees } from '../lib/currency';
import { Bookmark, Trash2, Search, Bell, ExternalLink } from 'lucide-react';

export const SavedSearchesPage: React.FC = () => {
  const { savedSearches, removeSavedSearch } = useAuctions();
  const { currentUser } = useAuth();

  const userSearches = savedSearches.filter((s) => !currentUser || s.user_id === currentUser.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-brand-600" />
            Saved Searches & Match Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            When a graduating student lists an item matching your criteria, you'll receive an instant in-app notification.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {userSearches.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-2xs">
            <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No saved searches yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Save any search criteria directly from the marketplace page to get automated alerts whenever fellow students list matching gear.
            </p>
            <Link
              to="/marketplace"
              className="inline-block px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs"
            >
              Go to Marketplace
            </Link>
          </div>
        ) : (
          userSearches.map((ss) => (
            <div
              key={ss.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {ss.query ? `"${ss.query}"` : 'All items'}
                  </span>
                  {ss.category && (
                    <span className="bg-brand-50 text-brand-700 text-xs px-2 py-0.5 rounded-full font-semibold border border-brand-200">
                      {ss.category}
                    </span>
                  )}
                  {ss.condition && (
                    <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                      {ss.condition}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {ss.maximum_price_paise && (
                    <span>Max Price: {formatRupees(paiseToRupees(ss.maximum_price_paise))}</span>
                  )}
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <Bell className="w-3 h-3" /> Realtime Alerts Active
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/marketplace?${ss.query ? `q=${encodeURIComponent(ss.query)}&` : ''}${
                    ss.category ? `category=${encodeURIComponent(ss.category)}` : ''
                  }`}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1"
                >
                  View Matches <ExternalLink className="w-3 h-3" />
                </Link>
                <button
                  onClick={() => removeSavedSearch(ss.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50"
                  title="Delete alert"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
