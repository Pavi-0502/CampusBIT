import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NotificationPopover } from '../notifications/NotificationPopover';
import {
  Gavel,
  PlusCircle,
  Search,
  Sparkles,
  LayoutDashboard,
  Store,
  Menu,
  X,
  LogOut,
  User,
  ShieldCheck,
} from 'lucide-react';

export const Header: React.FC<{ onOpenAIAssistant?: () => void }> = ({ onOpenAIAssistant }) => {
  const { currentUser, signOut, campusName } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
      isActive
        ? 'bg-brand-50 text-brand-700 font-bold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
    }`;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-[33px] z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-900 to-accent-700 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Gavel className="w-5 h-5 text-brand-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-brand-950 font-sans">
                Campus<span className="text-accent-600">Bid</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                Verified
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
              Give It a Second Life. Bid It Fair.
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/marketplace" className={navLinkClasses}>
            <Search className="w-4 h-4 text-slate-400" />
            Marketplace
          </NavLink>

          <NavLink to="/create" className={navLinkClasses}>
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            List an Item
          </NavLink>

          {onOpenAIAssistant && (
            <button
              onClick={onOpenAIAssistant}
              className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-accent-700 bg-accent-50/80 hover:bg-accent-100 border border-accent-200/60 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-accent-600 animate-spin-slow" />
              AI Assistant
            </button>
          )}

          <NavLink to="/dashboard" className={navLinkClasses}>
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            Student Hub
          </NavLink>

          <NavLink to="/seller" className={navLinkClasses}>
            <Store className="w-4 h-4 text-slate-400" />
            Seller Hub
          </NavLink>
        </nav>

        {/* Right side: Notifications & User profile */}
        <div className="flex items-center gap-2">
          {currentUser && <NotificationPopover />}

          {currentUser ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                title="View Student Profile"
              >
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.display_name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-100"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-xs">
                    {currentUser.display_name.charAt(0)}
                  </div>
                )}
                <div className="hidden lg:block text-left text-xs leading-tight">
                  <span className="font-bold text-slate-900 block truncate max-w-[110px]">
                    {currentUser.display_name}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {currentUser.hostel_block || 'Hostel Resident'}
                  </span>
                </div>
              </Link>

              <button
                onClick={handleSignOut}
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-2 rounded-xl bg-brand-900 hover:bg-brand-950 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm"
            >
              Sign In
            </Link>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top duration-150">
          <Link
            to="/marketplace"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            <Search className="w-4 h-4 text-slate-500" />
            Marketplace
          </Link>
          <Link
            to="/create"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            List an Item
          </Link>
          {onOpenAIAssistant && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAIAssistant();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-accent-700 bg-accent-50"
            >
              <Sparkles className="w-4 h-4 text-accent-600" />
              AI Campus Assistant
            </button>
          )}
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            <LayoutDashboard className="w-4 h-4 text-slate-500" />
            Student Dashboard (Bids & Won)
          </Link>
          <Link
            to="/seller"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            <Store className="w-4 h-4 text-slate-500" />
            Seller Dashboard (Approvals & Handover)
          </Link>
          <Link
            to="/saved-searches"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            Saved Searches & Alerts
          </Link>
        </div>
      )}
    </header>
  );
};
