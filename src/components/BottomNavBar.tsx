import React from 'react';
import { Home, Compass, MapPin, Bookmark, User } from 'lucide-react';
import { TabId } from '../types';

interface BottomNavBarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  savedCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  savedCount = 0
}) => {
  if (activeTab === 'admin') return null;

  return (
    <nav
      id="shendam-bottom-nav"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      className="fixed bottom-0 inset-x-0 w-full z-40 bg-[#04142F]/95 backdrop-blur-lg border-t border-white/16 px-3 sm:px-4 pt-2 flex flex-col items-center select-none shadow-[0_-8px_30px_rgba(0,0,0,0.65)] bottom-nav-container"
    >
      <div className="w-full grid grid-cols-5 items-end justify-items-center max-w-md mx-auto">
        {/* Tab 1: Home */}
        <button
          onClick={() => onSelectTab('home')}
          className="flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition active:scale-95"
        >
          <Home
            className={`w-5 h-5 stroke-[2.2] transition-all duration-200 ${
              activeTab === 'home'
                ? 'text-[#FFC928] drop-shadow-[0_0_6px_rgba(255,201,40,0.5)]'
                : 'text-[#9BAABD] hover:text-white'
            }`}
          />
          <span
            className={`text-[10px] font-semibold tracking-tight transition-colors ${
              activeTab === 'home' ? 'text-[#FFC928]' : 'text-[#9BAABD]'
            }`}
          >
            Home
          </span>
        </button>

        {/* Tab 2: Explore */}
        <button
          onClick={() => onSelectTab('explore')}
          className="flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition active:scale-95"
        >
          <Compass
            className={`w-5 h-5 stroke-[2.2] transition-all duration-200 ${
              activeTab === 'explore'
                ? 'text-[#FFC928] drop-shadow-[0_0_6px_rgba(255,201,40,0.5)]'
                : 'text-[#9BAABD] hover:text-white'
            }`}
          />
          <span
            className={`text-[10px] font-semibold tracking-tight transition-colors ${
              activeTab === 'explore' ? 'text-[#FFC928]' : 'text-[#9BAABD]'
            }`}
          >
            Explore
          </span>
        </button>

        {/* Tab 3: Center Elevated Map Button */}
        <button
          onClick={() => onSelectTab('map')}
          className="flex flex-col items-center -mt-6 cursor-pointer group active:scale-95"
        >
          <div className={`w-13 h-13 rounded-full bg-[#FFC928] group-hover:bg-[#F5B800] text-[#04142F] flex items-center justify-center shadow-[0_4px_20px_rgba(255,201,40,0.5)] border-4 border-[#04142F] transition-all duration-200 ${
            activeTab === 'map' ? 'ring-2 ring-[#FFC928]/60' : ''
          }`}>
            <MapPin className="w-6 h-6 stroke-[2.2] text-[#04142F] fill-[#04142F]" />
          </div>
          <span
            className={`text-[10px] font-semibold tracking-tight mt-0.5 transition-colors ${
              activeTab === 'map' ? 'text-[#FFC928]' : 'text-[#9BAABD]'
            }`}
          >
            Map
          </span>
        </button>

        {/* Tab 4: Saved */}
        <button
          onClick={() => onSelectTab('saved')}
          className="relative flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition active:scale-95"
        >
          <Bookmark
            className={`w-5 h-5 stroke-[2.2] transition-all duration-200 ${
              activeTab === 'saved'
                ? 'text-[#FFC928] fill-[#FFC928]/20 drop-shadow-[0_0_6px_rgba(255,201,40,0.5)]'
                : 'text-[#9BAABD] hover:text-white'
            }`}
          />
          <span
            className={`text-[10px] font-semibold tracking-tight transition-colors ${
              activeTab === 'saved' ? 'text-[#FFC928]' : 'text-[#9BAABD]'
            }`}
          >
            Saved
          </span>
          {savedCount > 0 && (
            <span className="absolute -top-0.5 right-2 min-w-[16px] h-4 px-1 bg-[#FFC928] text-[#04142F] text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.4)] border border-[#04142F]">
              {savedCount}
            </span>
          )}
        </button>

        {/* Tab 5: Profile */}
        <button
          onClick={() => onSelectTab('profile')}
          className="flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition active:scale-95"
        >
          <User
            className={`w-5 h-5 stroke-[2.2] transition-all duration-200 ${
              activeTab === 'profile'
                ? 'text-[#FFC928] drop-shadow-[0_0_6px_rgba(255,201,40,0.5)]'
                : 'text-[#9BAABD] hover:text-white'
            }`}
          />
          <span
            className={`text-[10px] font-semibold tracking-tight transition-colors ${
              activeTab === 'profile' ? 'text-[#FFC928]' : 'text-[#9BAABD]'
            }`}
          >
            Profile
          </span>
        </button>
      </div>
    </nav>
  );
};
