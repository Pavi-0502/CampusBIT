import React from 'react';
import { Gavel, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <Gavel className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-white">CampusBid</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Give It a Second Life. Bid It Fair. The fair, student-exclusive campus auction platform replacing unorganized WhatsApp group selling.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified College Domain Only
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Marketplace</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/marketplace" className="hover:text-white transition-colors">All Live Auctions</Link></li>
              <li><Link to="/marketplace?category=Cycles" className="hover:text-white transition-colors">Campus Cycles</Link></li>
              <li><Link to="/marketplace?category=Calculators" className="hover:text-white transition-colors">Scientific Calculators</Link></li>
              <li><Link to="/marketplace?category=Books" className="hover:text-white transition-colors">GATE & Engineering Books</Link></li>
              <li><Link to="/marketplace?category=Hostel Essentials" className="hover:text-white transition-colors">Hostel Appliances</Link></li>
            </ul>
          </div>

          {/* Fair Bidding Rules */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Fair Bidding Charter</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• Strict Minimum Bid Increments</li>
              <li>• 30s Anti-Sniping Time Extension</li>
              <li>• Private Automatic Proxy Bidding</li>
              <li>• Seller Approval & Handover Assurance</li>
              <li>• Zero Platform Fees for Students</li>
            </ul>
          </div>

          {/* Campus Handover Safety */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Safety & Handover</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              All physical handovers must occur at designated public campus locations (Hostel Gates, SAC, Library Quadrangle). Inspect items before confirming handover.
            </p>
            <div className="pt-2 text-xs text-slate-400 flex items-center gap-1.5">
              <span>Built with</span>
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              <span>for Student Campuses</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 CampusBid. All rights reserved. Built for College Hackathon.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-300">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-300">Campus Guidelines</span>
            <span>•</span>
            <span className="hover:text-slate-300">Auction Rules</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
