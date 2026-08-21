import React from 'react';
import {
  X,
  Home,
  Compass,
  MapPin,
  Bookmark,
  User,
  PlusCircle,
  Shield,
  PhoneCall,
  Crown
} from 'lucide-react';
import { TabId } from '../types';
import shendamLogoImg from '../assets/shendam_logo.jpg';

interface SideMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: TabId) => void;
  onOpenAddBusiness: () => void;
  savedCount: number;
}

export const SideMenuDrawer: React.FC<SideMenuDrawerProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenAddBusiness,
  savedCount
}) => {
  if (!isOpen) return null;

  const navigate = (tab: TabId) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Drawer */}
      <div className="relative w-80 max-w-[85vw] bg-[#04142F] border-r border-white/16 h-full p-5 text-white flex flex-col justify-between shadow-2xl z-10 overflow-y-auto no-scrollbar">
        <div>
          {/* Top Brand & Close */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl overflow-hidden shadow ring-1 ring-[#FFC928]/40 shrink-0 bg-[#04142F]">
                <img
                  src={shendamLogoImg}
                  alt="Shendam Connect"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <span className="font-bold text-base text-[#FFC928] tracking-wider">
                SHENDAM CONNECT
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1.5 mt-5">
            <button
              onClick={() => navigate('home')}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl hover:bg-white/10 text-[#D5DCE8] hover:text-white transition cursor-pointer text-sm font-semibold"
            >
              <Home className="w-5 h-5 text-[#FFC928] stroke-[2]" />
              <span>Home & Discovery</span>
            </button>

            <button
              onClick={() => navigate('explore')}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl hover:bg-white/10 text-[#D5DCE8] hover:text-white transition cursor-pointer text-sm font-semibold"
            >
              <Compass className="w-5 h-5 text-[#FFC928] stroke-[2]" />
              <span>Explore Directory</span>
            </button>

            <button
              onClick={() => navigate('map')}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl hover:bg-white/10 text-[#D5DCE8] hover:text-white transition cursor-pointer text-sm font-semibold"
            >
              <MapPin className="w-5 h-5 text-[#FFC928] stroke-[2]" />
              <span>Interactive Map</span>
            </button>

            <button
              onClick={() => navigate('saved')}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl hover:bg-white/10 text-[#D5DCE8] hover:text-white transition cursor-pointer text-sm font-semibold"
            >
              <div className="flex items-center gap-3.5">
                <Bookmark className="w-5 h-5 text-[#FFC928] stroke-[2]" />
                <span>Saved Places</span>
              </div>
              {savedCount > 0 && (
                <span className="bg-[#FFC928] text-[#061B3A] text-xs font-bold px-2 py-0.5 rounded-full">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('profile')}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl hover:bg-white/10 text-[#D5DCE8] hover:text-white transition cursor-pointer text-sm font-semibold"
            >
              <Crown className="w-5 h-5 text-[#FFC928] stroke-[2]" />
              <span>Culture & Heritage</span>
            </button>
          </div>

          {/* Quick List Business CTA */}
          <div className="mt-6 p-4 rounded-2xl bg-[#0B2D5C] border border-white/16 shadow-lg">
            <h4 className="text-xs font-bold text-[#FFC928] uppercase tracking-wider">
              Local Businesses
            </h4>
            <p className="text-xs text-[#D5DCE8] mt-1">
              Add your enterprise, restaurant or hotel to Shendam Connect.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenAddBusiness();
              }}
              className="w-full mt-3 py-2 bg-[#FFC928] hover:bg-[#F5B800] active:scale-95 text-[#061B3A] font-extrabold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <PlusCircle className="w-3.5 h-3.5 stroke-[2]" />
              <span>List Your Business</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 text-[11px] text-[#9BAABD]">
          <div className="text-white font-semibold">Shendam Local Government</div>
          <p className="text-[#9BAABD] mt-0.5">Plateau State, Nigeria</p>
          <div className="text-[#FFC928] mt-1 font-semibold">DISCOVER • CONNECT • EXPERIENCE</div>
        </div>
      </div>
    </div>
  );
};
