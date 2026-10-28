import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Gavel, ShieldCheck, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    signInWithCampusEmail,
    signUpWithCampusEmail,
    campusDomain,
    campusName,
    allDemoProfiles,
    switchDemoUser,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState(`student@${campusDomain}`);
  const [password, setPassword] = useState('Password@123');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signInWithCampusEmail(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          navigate('/marketplace');
        }
      } else if (mode === 'signup') {
        if (!displayName.trim()) {
          setError('Please provide your student name.');
          setLoading(false);
          return;
        }
        const res = await signUpWithCampusEmail(email, password, displayName);
        if (res.error) {
          setError(res.error);
        } else {
          navigate('/marketplace');
        }
      } else if (mode === 'reset') {
        if (!email.toLowerCase().endsWith(`@${campusDomain}`)) {
          setError(`Email must end with @${campusDomain}`);
        } else {
          setSuccess(`Password reset instructions dispatched to your campus email: ${email}`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoSelect = (userId: string) => {
    switchDemoUser(userId);
    navigate('/marketplace');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      {/* Brand logo */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-brand-900 text-white flex items-center justify-center mx-auto shadow-md">
          <Gavel className="w-6 h-6 text-brand-100" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          CampusBid Authentication
        </h1>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Restricted to {campusName}
        </div>
      </div>

      {/* Quick Demo Switcher Card for Hackathon Judges */}
      <div className="bg-gradient-to-br from-brand-900 to-indigo-950 p-4 rounded-3xl text-white shadow-floating space-y-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-accent-300 block">
          Hackathon Quick Login:
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickDemoSelect('user-aarav')}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-left border border-white/10 transition-colors"
          >
            <strong className="block text-white">Aarav Sharma</strong>
            <span className="text-[10px] text-brand-200">Final Yr CSE • Seller</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemoSelect('user-priya')}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-left border border-white/10 transition-colors"
          >
            <strong className="block text-white">Priya Patel</strong>
            <span className="text-[10px] text-brand-200">1st Yr ECE • Buyer</span>
          </button>
        </div>
      </div>

      {/* Main Auth Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
        {/* Tab selection */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-surface-100 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Student Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="E.g. Siddharth Rao"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Campus Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`yourname@${campusDomain}`}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-mono font-medium"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Domain restriction: <strong>@{campusDomain}</strong>
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-[11px] font-semibold text-brand-600 hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs sm:text-sm font-medium"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700 font-medium">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
          >
            {loading
              ? 'Verifying...'
              : mode === 'signin'
              ? 'Sign In to CampusBid'
              : mode === 'signup'
              ? 'Register Campus Account'
              : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
};
