import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Users, Database, ShieldCheck, ChevronRight, HelpCircle } from 'lucide-react';
import { Modal } from '../common/Modal';

export const DemoBanner: React.FC = () => {
  const { isDemoMode, currentUser, allDemoProfiles, switchDemoUser, campusDomain } = useAuth();
  const [showSetupModal, setShowSetupModal] = useState(false);

  return (
    <>
      <div className="bg-brand-950 text-brand-100 text-xs py-2 px-4 border-b border-brand-900/60 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-white tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verified Campus Network:
            </span>
            <span className="bg-brand-900 px-2 py-0.5 rounded font-mono text-[11px] text-brand-200">
              @{campusDomain}
            </span>
            <span className="hidden sm:inline text-brand-400">|</span>
            <span className="hidden sm:inline text-brand-300">
              {isDemoMode ? 'Interactive Demo Mode' : 'Connected to Supabase DB'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-brand-900/80 px-2 py-1 rounded-lg border border-brand-800">
              <Users className="w-3.5 h-3.5 text-brand-300" />
              <span className="text-[11px] text-brand-200 hidden md:inline">Switch Role:</span>
              <select
                value={currentUser?.id || ''}
                onChange={(e) => switchDemoUser(e.target.value)}
                className="bg-transparent text-white text-[11px] font-medium focus:outline-none cursor-pointer"
              >
                {allDemoProfiles.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.display_name} ({p.id === 'user-aarav' ? 'Seller - Cycle/Laptop' : p.id === 'user-priya' ? 'Buyer - 1st Year' : 'Senior Student'})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowSetupModal(true)}
              className="text-[11px] text-brand-300 hover:text-white flex items-center gap-1 underline underline-offset-2 ml-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              DB Setup Info
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        title="Supabase Database & Realtime Architecture"
        description="How CampusBid integrates PostgreSQL transactions, RLS, and Realtime"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-brand-50 rounded-xl border border-brand-100 flex items-start gap-3">
            <Database className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-brand-900 text-sm">PostgreSQL Backend Ready</h4>
              <p className="mt-1 leading-relaxed text-brand-800">
                All 12 required tables, transactional bidding functions (<code className="font-mono bg-white px-1 py-0.5 rounded border border-brand-200">place_bid</code>), auto-proxy bidding, anti-sniping extension triggers, and Row Level Security policies are generated under <code className="font-mono bg-white px-1 py-0.5 rounded border border-brand-200">/supabase/migrations/</code>.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-semibold text-slate-900">How to Connect Your Real Supabase Project:</h5>
            <ol className="list-decimal pl-4 space-y-1.5 text-slate-600">
              <li>Create a new project at <span className="font-mono text-brand-700">supabase.com</span>.</li>
              <li>Run the SQL migration scripts in <span className="font-mono text-brand-700">supabase/migrations/</span> in the Supabase SQL Editor.</li>
              <li>Set <span className="font-mono text-brand-700">VITE_SUPABASE_URL</span> and <span className="font-mono text-brand-700">VITE_SUPABASE_ANON_KEY</span> in your <span className="font-mono">.env</span> file.</li>
              <li>Re-run <span className="font-mono text-brand-700">npm run dev</span>. CampusBid will immediately switch to live database operations!</li>
            </ol>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-800 block mb-1">Demo Mode Capabilities:</span>
            <p className="text-slate-600">
              When Supabase keys are not set, the platform uses an in-memory transactional engine that faithfully mirrors PostgreSQL functions, enforcing Rules 1 through 15 (sniper extensions, proxy bidding, seller decisions, handover workflows).
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setShowSetupModal(false)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
