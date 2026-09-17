import React from 'react';
import {
  X,
  Home,
  Compass,
  MapPin,
  Bookmark,
  PlusCircle,
  Shield,
  Crown,
  MessageSquarePlus,
  Briefcase,
  Sun,
  Moon
} from 'lucide-react';
import { TabId, FeedbackType } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAppBranding } from '../hooks/useAppBranding';
import { BrandLogoImage } from './BrandLogoImage';

interface SideMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: TabId) => void;
  onOpenAddBusiness: () => void;
  onOpenFeedback?: (initialType?: FeedbackType) => void;
  savedCount: number;
}

export const SideMenuDrawer: React.FC<SideMenuDrawerProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenAddBusiness,
  onOpenFeedback,
  savedCount
}) => {
  const { theme, toggleTheme } = useTheme();
  const { homepageLogo } = useAppBranding();
  const [logoError, setLogoError] = React.useState(false);

  React.useEffect(() => {
    setLogoError(false);
  }, [homepageLogo]);

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
      <div className="relative w-80 max-w-[85vw] bg-[#04142F] border-r border-white/16 h-full p-5 text-white flex flex-col justify-between shadow-2xl z-10 overflow-y-auto no-scrollbar side-menu-drawer">
        <div>
          {/* Top Brand & Close */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 side-menu-header">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow ring-1 ring-[#FFC928]/40 shrink-0 bg-[#04142F] flex items-center justify-center p-0.5 border border-[#FFC928]/20">
                <BrandLogoImage
                  src={homepageLogo}
                  alt="Shendam Connect"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <span className="font-bold text-base text-[#FFC928] tracking-wider side-menu-title">
                SHENDAM CONNECT
              </span>
            </div>

            <button
              onClick={onClose}
              aria-label="Close menu"
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer side-menu-close-btn transition"
            >
              <X className="w-4 h-4 stroke-[2]" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1.5 mt-5">
            <button
              onClick={() => navigate('home')}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl hover:bg-white/10 text-[#D5DCE8] hover:text-white transition cursor-pointer text-sm font-semibold side-menu-nav-link"
            >
              <Home className="w-5 h-5 text-[#FFC928] stroke-[2] side-menu-nav-icon shrink-0" />
              <span>Home & Discovery</span>
            </button>

            <button
              onClick={() => navigate('explore')}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl hover:bg-white/10 text-[#D5DCE8] hover:text-white transition cursor-pointer text-sm font-semibold side-menu-nav-link"
            >
              <Compass className="w-5 h-5 text-[#FFC928] stroke-[2] side-menu-nav-icon shrink-0" />
              <span>Explore Directory</span>
            </button>

            <button
              onClick={() => navigate('map')}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl hover:bg-white/10 text-[#D5DCE8] hover:text-white transition cursor-pointer text-sm font-semibold side-menu-nav-link"
            >
              <MapPin className="w-5 h-5 text-[#FFC928] stroke-[2] side-menu-nav-icon shrink-0" />
              <span>Interactive Map</span>
            </button>

            <button
              onClick={() => navigate('saved')}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl hover:bg-white/10 text-[#D5DCE8] hover:text-white transition cursor-pointer text-sm font-semibold side-menu-nav-link"
            >
              <div className="flex items-center gap-3.5">
                <Bookmark className="w-5 h-5 text-[#FFC928] stroke-[2] side-menu-nav-icon shrink-0" />
                <span>Saved Places</span>
              </div>
              {savedCount > 0 && (
                <span className="bg-[#FFC928] text-[#061B3A] text-xs font-bold px-2 py-0.5 rounded-full side-menu-saved-badge">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate('jobs')}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl hover:bg-white/10 text-[#D5DCE8] hover:text-white transition cursor-pointer text-sm font-semibold side-menu-nav-link"
            >
              <Briefcase className="w-5 h-5 text-[#FFC928] stroke-[2] side-menu-nav-icon shrink-0" />
              <span>Jobs & Opportunities</span>
            </button>

            <button
              onClick={() => navigate('profile')}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl hover:bg-white/10 text-[#D5DCE8] hover:text-white transition cursor-pointer text-sm font-semibold side-menu-nav-link"
            >
              <Crown className="w-5 h-5 text-[#FFC928] stroke-[2] side-menu-nav-icon shrink-0" />
              <span>Culture & Heritage</span>
            </button>

            {onOpenFeedback && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFeedback('feature_request');
                }}
                className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl hover:bg-white/10 text-[#D5DCE8] hover:text-white transition cursor-pointer text-sm font-semibold side-menu-nav-link"
              >
                <MessageSquarePlus className="w-5 h-5 text-[#FFC928] stroke-[2] side-menu-nav-icon shrink-0" />
                <span>Feedback & Requests</span>
              </button>
            )}

            <button
              onClick={() => navigate('admin')}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-[#0B2D5C]/60 hover:bg-[#0B2D5C] text-[#FFC928] hover:text-[#FFC928] transition cursor-pointer text-sm font-bold border border-white/10 mt-2 side-menu-admin-btn"
            >
              <div className="flex items-center gap-3.5">
                <Shield className="w-5 h-5 text-[#FFC928] stroke-[2] side-menu-nav-icon shrink-0" />
                <span className="side-menu-admin-title">Admin Management Portal</span>
              </div>
              <span className="bg-[#FFC928] text-[#061B3A] text-[9px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 side-menu-lga-badge">
                LGA
              </span>
            </button>
          </div>

          {/* Theme Status Information Row (No conflicting dual-toggle box) */}
          <div className="mt-4 p-3 rounded-2xl bg-[#0B2D5C]/60 border border-white/10 flex items-center justify-between side-drawer-theme-card">
            <div className="flex items-center gap-2.5">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-[#FFC928]" />
              ) : (
                <Sun className="w-5 h-5 text-[#F5C400]" />
              )}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#9BAABD] side-drawer-theme-label">
                  Active Theme
                </div>
                <div className="text-xs font-bold text-white side-drawer-theme-val">
                  {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                </div>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer bg-white/10 hover:bg-white/20 text-[#FFC928] border border-white/16 side-drawer-theme-btn"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>

          {/* Quick List Business CTA */}
          <div className="mt-5 p-4 rounded-2xl bg-[#0B2D5C] border border-white/16 shadow-lg side-menu-biz-card">
            <h4 className="text-xs font-bold text-[#FFC928] uppercase tracking-wider side-menu-biz-title">
              Local Businesses
            </h4>
            <p className="text-xs text-[#D5DCE8] mt-1 side-menu-biz-desc">
              Add your enterprise, restaurant or hotel to Shendam Connect.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenAddBusiness();
              }}
              className="w-full mt-3 py-2 bg-[#FFC928] hover:bg-[#F5B800] active:scale-95 text-[#061B3A] font-extrabold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer transition side-menu-biz-btn"
            >
              <PlusCircle className="w-3.5 h-3.5 stroke-[2]" />
              <span>List Your Business</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 text-[11px] text-[#9BAABD] side-menu-footer mt-5">
          <div className="text-white font-semibold side-menu-footer-gov">Shendam Local Government</div>
          <p className="text-[#9BAABD] mt-0.5 side-menu-footer-sub">Plateau State, Nigeria</p>
          <div className="text-[#FFC928] mt-1 font-semibold side-menu-footer-slogan">DISCOVER • CONNECT • EXPERIENCE</div>
        </div>
      </div>
    </div>
  );
};

export default SideMenuDrawer;

