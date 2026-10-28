import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuctions } from '../context/AuctionContext';
import { useAuth } from '../context/AuthContext';
import { AuctionCard } from '../components/auction/AuctionCard';
import {
  Gavel,
  Search,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Users,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const LandingPage: React.FC<{ onOpenAI?: () => void }> = ({ onOpenAI }) => {
  const { auctions } = useAuctions();
  const { campusName, campusDomain } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/marketplace');
    }
  };

  // Filter sections
  const activeAuctions = auctions.filter((a) => a.status === 'ACTIVE');
  const endingSoon = [...activeAuctions].sort(
    (a, b) => new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime()
  ).slice(0, 4);

  const recentlyListed = [...activeAuctions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 4);

  const featured = activeAuctions.slice(0, 4);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 sm:pt-16 pb-12 sm:pb-20 border-b border-slate-200 bg-gradient-to-b from-brand-50/70 via-white to-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Campus Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100/80 border border-brand-200 text-brand-900 text-xs font-semibold shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Student-Exclusive Marketplace for {campusName}</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-6xl font-black text-brand-950 tracking-tight leading-[1.1] font-sans">
              Your Campus.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-700 via-indigo-600 to-accent-600">
                Your Marketplace.
              </span>{' '}
              Your Bid.
            </h1>

            {/* Tagline & Subtext */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Give It a Second Life. Bid It Fair. Replace chaotic WhatsApp group bargaining with transparent student auctions, anti-sniping protection, and verified hostel handovers.
            </p>

            {/* Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="mt-8 flex flex-col sm:flex-row items-center gap-2 max-w-xl mx-auto p-2 bg-white rounded-2xl shadow-floating border border-slate-200"
            >
              <div className="flex items-center gap-2 flex-1 px-3 w-full">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cycles, calculators, textbooks, electronics..."
                  className="w-full py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-900 hover:bg-brand-950 text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
              >
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                to="/marketplace"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2"
              >
                <Gavel className="w-4 h-4" />
                Browse All Auctions
              </Link>
              <Link
                to="/create"
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs sm:text-sm shadow-2xs transition-all flex items-center gap-2"
              >
                List an Item to Sell
              </Link>
              {onOpenAI && (
                <button
                  onClick={onOpenAI}
                  className="px-5 py-2.5 rounded-xl bg-accent-50 hover:bg-accent-100 text-accent-800 border border-accent-200 font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-accent-600" />
                  Ask AI Assistant
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-center">
              <span className="block text-2xl font-black text-brand-950 font-mono">100%</span>
              <span className="text-xs text-slate-500 font-medium">Verified Campus Students</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-center">
              <span className="block text-2xl font-black text-brand-950 font-mono">₹0</span>
              <span className="text-xs text-slate-500 font-medium">Platform / Broker Fees</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-center">
              <span className="block text-2xl font-black text-brand-950 font-mono">30s</span>
              <span className="text-xs text-slate-500 font-medium">Sniper Extension Rule</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-center">
              <span className="block text-2xl font-black text-brand-950 font-mono">₹12,400+</span>
              <span className="text-xs text-slate-500 font-medium">Avg Senior Clearance Value</span>
            </div>
          </div>
        </div>
      </section>

      {/* Ending Soon Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>Final Countdown</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Ending Soon on Campus
            </h2>
          </div>
          <Link
            to="/marketplace?tab=ending-soon"
            className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
          >
            See all ending soon <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {endingSoon.map((auc) => (
            <AuctionCard key={auc.id} auction={auc} />
          ))}
        </div>
      </section>

      {/* Featured Auctions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-1 block">
              Graduating Senior Listings
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Campus Auctions
            </h2>
          </div>
          <Link
            to="/marketplace"
            className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
          >
            Explore marketplace <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((auc) => (
            <AuctionCard key={auc.id} auction={auc} />
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-surface-100 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-accent-700 uppercase tracking-wider">
              Fair & Transparent
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              How CampusBid Works
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Designed specifically for college campuses to eliminate price gouging and ghosting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base">Verified Student Sign In</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Only students with approved @{campusDomain} email addresses can participate. No outside brokers or spam accounts.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base">Real-Time Bids & Auto-Proxy</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bid manually or set a confidential maximum. Our proxy engine outbids competitors deterministically without exposing your limit.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base">Anti-Sniping Guarantee</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Any bid placed during the final 30 seconds extends the timer by 60 seconds, ensuring fair bidding without bot snipers.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base">Hostel Handover</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seller approves the final winning price. Meet safely at the campus hostel gate or SAC to inspect the item and finalize exchange.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Buyer & Seller Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* For Buyers */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-900 to-brand-950 text-white space-y-5 shadow-floating">
            <span className="text-xs font-bold text-accent-300 uppercase tracking-wider">
              For Junior Students & Buyers
            </span>
            <h3 className="text-2xl font-black tracking-tight">
              Get Campus Essentials at Fair Second-Hand Prices
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-indigo-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Save up to 70% on cycles, engineering books & hostel appliances</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Inspect items in person at the hostel before confirming handover</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AI assistant finds matching listings within your semester budget</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Private pseudonym protects your identity during public bidding</span>
              </li>
            </ul>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors"
            >
              Start Bidding Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* For Sellers */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-floating space-y-5">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              For Graduating Seniors & Sellers
            </span>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Clear Out Your Hostel Room Rapidly and Fairly
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No endless WhatsApp DM negotiation or "Is this available?" spam</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Competitive bidding discovers the true market value of your gear</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>You retain final approval rights over the provisional closing bid</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Convenient handover right inside your hostel block or quadrangle</span>
              </li>
            </ul>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors"
            >
              List an Item in 2 Minutes <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
