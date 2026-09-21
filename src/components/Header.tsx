import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAppBranding } from '../hooks/useAppBranding';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogoImage } from './BrandLogoImage';
import { getSeasonalThemeDetails } from '../utils/seasonalThemes';

interface HeaderProps {
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMenu,
  onOpenNotifications,
  unreadCount = 2
}) => {
  const { homepageLogo, seasonal } = useAppBranding();
  const seasonalDetails = getSeasonalThemeDetails(seasonal);

  return (
    <header className="relative w-full px-4 sm:px-5 pt-1.5 pb-2.5 flex items-center justify-between z-20">
      {/* LEFT: ☰ Hamburger Menu & App Logo */}
      <div className="flex items-center gap-2.5 -ml-1">
        <button
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          className="w-10 h-10 flex items-center justify-center text-white hover:text-[#FFC928] transition cursor-pointer active:scale-95 rounded-full bg-white/12 hover:bg-white/20 border border-white/20 shadow-sm"
        >
          <Menu className="w-5 h-5 stroke-[2.4]" />
        </button>

        {/* Brand Logo & Title on Left Side */}
        <div className="flex items-center gap-2 select-none">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-[0_3px_12px_rgba(8,120,209,0.38)] ring-1 ring-[#FFC928]/35 shrink-0 bg-[#04142F] flex items-center justify-center">
            <BrandLogoImage
              src={homepageLogo}
              alt="Shendam Connect"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[#FFC928] font-black text-sm sm:text-base tracking-[0.14em] uppercase leading-none font-brand-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                SHENDAM
              </span>
              {seasonalDetails.isActive && seasonalDetails.showBadge && (
                <span
                  title={seasonalDetails.title}
                  className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-black shadow-sm border border-white/20 animate-pulse"
                  style={{
                    backgroundColor: `${seasonalDetails.accentColor}30`,
                    color: seasonalDetails.accentColor
                  }}
                >
                  {seasonalDetails.theme.icon}
                </span>
              )}
            </div>
            <div className="text-white font-extrabold text-[9px] sm:text-[10px] tracking-[0.28em] uppercase leading-none mt-0.5 font-brand-sans">
              CONNECT
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: 🔔 Notification Icon + 🌙/☀️ Theme Circular Icon Button */}
      <div className="flex items-center gap-1.5 -mr-1">
        {/* 🔔 Notification Icon */}
        <button
          onClick={onOpenNotifications}
          aria-label="View notifications"
          className="relative w-10 h-10 flex items-center justify-center text-white hover:text-[#FFC928] transition cursor-pointer active:scale-95 rounded-full hover:bg-white/10"
        >
          <Bell className="w-5 h-5 stroke-[2.2]" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] bg-[#FFC928] text-[#061B3A] text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#061B3A] shadow-md px-0.5">
              {unreadCount}
            </span>
          )}
        </button>

        {/* 🌙/☀️ Single Circular Theme Icon Button */}
        <ThemeToggle variant="icon-button" />
      </div>
    </header>
  );
};
