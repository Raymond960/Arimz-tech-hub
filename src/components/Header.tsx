import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { ShendamLogo } from './ShendamLogo';

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
  return (
    <header className="relative w-full px-5 pt-1 pb-3 flex items-center justify-between z-20">
      {/* Left: Hamburger Menu Icon */}
      <button
        onClick={onOpenMenu}
        aria-label="Open navigation menu"
        className="w-10 h-10 -ml-1 flex items-center justify-center text-white hover:text-[#FFC928] transition cursor-pointer active:scale-95"
      >
        <Menu className="w-7 h-7 stroke-[2.2]" />
      </button>

      {/* Center: Logo & Brand */}
      <div className="flex-1 flex justify-center py-1">
        <ShendamLogo />
      </div>

      {/* Right: Notification Bell with Gold Badge */}
      <button
        onClick={onOpenNotifications}
        aria-label="View notifications"
        className="relative w-10 h-10 -mr-1 flex items-center justify-center text-white hover:text-[#FFC928] transition cursor-pointer active:scale-95"
      >
        <Bell className="w-6 h-6 stroke-[2]" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[17px] h-[17px] bg-[#FFC928] text-[#061B3A] text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-[#061B3A] shadow-md">
            {unreadCount}
          </span>
        )}
      </button>
    </header>
  );
};
