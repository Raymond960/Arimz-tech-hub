import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Search,
  ExternalLink,
  LogOut,
  Radio,
  CheckCircle2,
  Calendar,
  Building,
  User
} from 'lucide-react';
import { AdminNotification, AdminSectionId } from '../../types';

interface AdminHeaderProps {
  currentSection: AdminSectionId;
  activeUsersCount: number;
  notifications: AdminNotification[];
  adminEmail: string;
  onOpenSidebar: () => void;
  onNavigateSection: (section: AdminSectionId) => void;
  onMarkNotificationRead: (id: string) => void;
  onLogout: () => void;
  onReturnToApp: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentSection,
  activeUsersCount,
  notifications,
  adminEmail,
  onOpenSidebar,
  onNavigateSection,
  onMarkNotificationRead,
  onLogout,
  onReturnToApp,
  searchTerm,
  onSearchChange
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const sectionTitles: Record<AdminSectionId, string> = {
    overview: 'Management Overview',
    all_listings: 'All Shendam Listings (CMS)',
    hotels: 'Hotels & Accommodations',
    restaurants: 'Restaurants, Food & Dining',
    businesses: 'Local Businesses & Commercial',
    attractions: 'Tourist Spots & Heritage',
    events: 'Events & Community Gatherings',
    services: 'Tech & Professional Services',
    transport: 'Transport & Motor Parks',
    shopping: 'Shopping & Retail Markets',
    health: 'Healthcare & Pharmacies',
    emergency: 'Emergency & Safety Services',
    bookings: 'Bookings & Reservations',
    submissions: 'Merchant Submissions Queue',
    admin_management: 'Admin User Management & RBAC Roles',
    feedback: 'Citizen & Visitor Feedback Queue',
    revenue: 'Revenue & Commercial Finance',
    live_users: 'Real-time Active Users',
    analytics: 'Analytics & Traffic Insights',
    opportunities: 'Jobs & Opportunities Management',
    users: 'Visitor Anonymous Sessions',
    activity_log: 'System Audit Logs',
    branding: 'Branding & Logo Management',
    ads: 'Advertisements & Sponsorships CMS',
    settings: 'Platform Settings'
  };

  return (
    <header className="sticky top-0 z-30 bg-[#08254D]/95 backdrop-blur-md border-b border-white/12 px-4 sm:px-6 py-3.5 flex items-center justify-between text-white">
      {/* Left side: Hamburger + Section title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-black tracking-tight text-white font-brand-sans flex items-center gap-2">
            <span>{sectionTitles[currentSection] || 'Admin Dashboard'}</span>
          </h2>
        </div>
      </div>

      {/* Right side: Live users, Search, Notifications, User profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Live Active Users Pill */}
        <button
          onClick={() => onNavigateSection('live_users')}
          className="flex items-center gap-2 bg-[#04142F] hover:bg-[#030F24] border border-white/16 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer"
          title="Click to view real-time active sessions"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 font-bold hidden sm:inline">Active Now:</span>
          <span className="text-white font-bold">{activeUsersCount} Online</span>
        </button>

        {/* Global Search */}
        <div className="relative hidden md:block w-48 lg:w-64">
          <Search className="w-3.5 h-3.5 text-[#9BAABD] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#04142F] border border-white/14 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
          />
        </div>

        {/* Notifications Dropdown Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl bg-[#04142F] hover:bg-white/10 border border-white/14 text-white transition cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-[#04142F] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Flyout */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#08254D] border border-white/16 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-[#04142F]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#FFC928]" />
                  <span className="font-bold text-xs text-white uppercase tracking-wider">
                    Admin Notifications
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-[#9BAABD]">
                  {unreadCount} unread
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-white/8 no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#9BAABD]">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        onMarkNotificationRead(notif.id);
                        if (notif.linkSection) onNavigateSection(notif.linkSection);
                        setShowNotifications(false);
                      }}
                      className={`p-3 text-left transition cursor-pointer hover:bg-white/8 ${
                        notif.read ? 'opacity-70 bg-transparent' : 'bg-[#FFC928]/8'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FFC928]" />
                          )}
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-[#9BAABD] shrink-0">
                          {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#D5DCE8] mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Return to Public App */}
        <button
          onClick={onReturnToApp}
          className="hidden sm:flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/16 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#FFC928]" />
          <span>Public App</span>
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 transition cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
