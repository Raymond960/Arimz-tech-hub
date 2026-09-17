import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  Radio,
  BarChart3,
  Building2,
  Store,
  Compass,
  Wrench,
  Utensils,
  Car,
  ShoppingBag,
  HeartPulse,
  ShieldAlert,
  Layers,
  CalendarDays,
  Inbox,
  MessageSquarePlus,
  Users2,
  History,
  Settings,
  Image as ImageIcon,
  X,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Briefcase,
  Megaphone,
  Calendar
} from 'lucide-react';
import { useAppBranding } from '../../hooks/useAppBranding';
import { BrandLogoImage } from '../BrandLogoImage';
import { AdminSectionId, AdminRole } from '../../types';

interface AdminSidebarProps {
  currentSection: AdminSectionId;
  onNavigateSection: (section: AdminSectionId) => void;
  isOpen: boolean;
  onClose: () => void;
  counts: {
    hotels: number;
    restaurants?: number;
    businesses: number;
    services?: number;
    attractions: number;
    transport?: number;
    shopping?: number;
    health?: number;
    emergency?: number;
    all_listings?: number;
    bookings: number;
    pendingBookings: number;
    pendingSubmissions: number;
    pendingFeedback?: number;
    activeUsers: number;
  };
  adminEmail: string;
  adminRole?: AdminRole;
  adminTitle?: string;
  adminName?: string;
  onLogout: () => void;
  onReturnToApp: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentSection,
  onNavigateSection,
  isOpen,
  onClose,
  counts,
  adminEmail,
  adminRole = 'SUPER_ADMIN',
  adminTitle,
  adminName,
  onLogout,
  onReturnToApp
}) => {
  const { homepageLogo } = useAppBranding();
  const rawMenuItems: Array<{
    id: AdminSectionId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
    allowedRoles?: AdminRole[];
  }> = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard
    },
    {
      id: 'admin_management',
      label: 'Admin Management',
      icon: ShieldCheck,
      badge: 'RBAC',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-black'
    },
    {
      id: 'all_listings',
      label: 'All Shendam Listings (CMS)',
      icon: Layers,
      badge: counts.all_listings,
      allowedRoles: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'VIEWER']
    },
    {
      id: 'hotels',
      label: 'Hotels & Lodging',
      icon: Building2,
      badge: counts.hotels,
      allowedRoles: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'VIEWER']
    },
    {
      id: 'restaurants',
      label: 'Restaurants & Dining',
      icon: Utensils,
      badge: counts.restaurants,
      allowedRoles: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'VIEWER']
    },
    {
      id: 'businesses',
      label: 'Local Businesses',
      icon: Store,
      badge: counts.businesses,
      allowedRoles: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'VIEWER']
    },
    {
      id: 'services',
      label: 'Tech & Services',
      icon: Wrench,
      badge: counts.services,
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      allowedRoles: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'VIEWER']
    },
    {
      id: 'attractions',
      label: 'Tourist Attractions',
      icon: Compass,
      badge: counts.attractions,
      allowedRoles: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'VIEWER']
    },
    {
      id: 'transport',
      label: 'Transport & Motor Parks',
      icon: Car,
      badge: counts.transport,
      allowedRoles: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'VIEWER']
    },
    {
      id: 'shopping',
      label: 'Shopping & Markets',
      icon: ShoppingBag,
      badge: counts.shopping,
      allowedRoles: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'VIEWER']
    },
    {
      id: 'health',
      label: 'Healthcare & Clinics',
      icon: HeartPulse,
      badge: counts.health,
      allowedRoles: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'VIEWER']
    },
    {
      id: 'emergency',
      label: 'Emergency Services',
      icon: ShieldAlert,
      badge: counts.emergency,
      allowedRoles: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'VIEWER']
    },
    {
      id: 'revenue',
      label: 'Revenue & Finance',
      icon: Wallet,
      badge: '₦450k',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold',
      allowedRoles: ['SUPER_ADMIN', 'ADVERTISING_ADMIN', 'VIEWER']
    },
    {
      id: 'live_users',
      label: 'Live Users',
      icon: Radio,
      badge: `${counts.activeUsers} Live`,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      allowedRoles: ['SUPER_ADMIN', 'VIEWER']
    },
    {
      id: 'analytics',
      label: 'Analytics & Traffic',
      icon: BarChart3,
      allowedRoles: ['SUPER_ADMIN', 'VIEWER']
    },
    {
      id: 'bookings',
      label: 'Bookings & Stays',
      icon: CalendarDays,
      badge: counts.pendingBookings > 0 ? `${counts.pendingBookings} New` : counts.bookings,
      badgeColor: counts.pendingBookings > 0 ? 'bg-amber-500 text-[#04142F] font-black' : undefined,
      allowedRoles: ['SUPER_ADMIN', 'BOOKING_ADMIN', 'VIEWER']
    },
    {
      id: 'submissions',
      label: 'Merchant Queue',
      icon: Inbox,
      badge: counts.pendingSubmissions > 0 ? counts.pendingSubmissions : undefined,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      allowedRoles: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'SUPPORT_ADMIN']
    },
    {
      id: 'feedback',
      label: 'Feedback & Ideas',
      icon: MessageSquarePlus,
      badge: counts.pendingFeedback && counts.pendingFeedback > 0 ? counts.pendingFeedback : undefined,
      badgeColor: 'bg-[#FFC928]/20 text-[#FFC928] border-[#FFC928]/30',
      allowedRoles: ['SUPER_ADMIN', 'SUPPORT_ADMIN', 'VIEWER']
    },
    {
      id: 'opportunities',
      label: 'Jobs & Opportunities',
      icon: Briefcase,
      allowedRoles: ['SUPER_ADMIN', 'CONTENT_ADMIN', 'ADVERTISING_ADMIN']
    },
    {
      id: 'events',
      label: 'Events & Festivals',
      icon: Calendar,
      badge: 'CMS',
      badgeColor: 'bg-[#FFC928]/20 text-[#FFC928] border-[#FFC928]/30 font-bold',
      allowedRoles: ['SUPER_ADMIN', 'CONTENT_ADMIN']
    },
    {
      id: 'ads',
      label: 'Advertisements & Ads',
      icon: Megaphone,
      badge: 'PROMO',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold',
      allowedRoles: ['SUPER_ADMIN', 'ADVERTISING_ADMIN']
    },
    {
      id: 'users',
      label: 'Visitor Sessions',
      icon: Users2,
      allowedRoles: ['SUPER_ADMIN', 'VIEWER']
    },
    {
      id: 'activity_log',
      label: 'Audit & Activity',
      icon: History,
      allowedRoles: ['SUPER_ADMIN', 'VIEWER']
    },
    {
      id: 'branding',
      label: 'Branding & Logos',
      icon: ImageIcon,
      badge: 'New',
      badgeColor: 'bg-[#FFC928] text-[#04142F] font-black',
      allowedRoles: ['SUPER_ADMIN', 'CONTENT_ADMIN']
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings
    }
  ];

  // Filter items based on current admin role (Super Admin sees all)
  const menuItems = rawMenuItems.filter((item) => {
    if (adminRole === 'SUPER_ADMIN') return true;
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(adminRole as AdminRole);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#08254D] border-r border-white/12 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#04142F] border border-[#FFC928]/30 flex items-center justify-center shadow-inner shrink-0 p-0.5">
              <BrandLogoImage src={homepageLogo} alt="Shendam Connect" className="h-10 w-auto object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-white font-brand-sans tracking-tight">
                Shendam Connect
              </h1>
              <p className="text-[10px] font-bold text-[#FFC928] uppercase tracking-wider">
                Admin Management
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
          <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#9BAABD]/80">
            Core Modules
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigateSection(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-[#FFC928] text-[#04142F] font-bold shadow-md'
                    : 'text-[#D5DCE8] hover:bg-white/8 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#04142F]' : 'text-[#9BAABD]'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      isActive
                        ? 'bg-[#04142F]/20 text-[#04142F] border-black/20 font-black'
                        : item.badgeColor || 'bg-white/10 text-[#9BAABD] border-white/12'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Area: Admin Info, Public App, Logout */}
        <div className="p-3 border-t border-white/10 space-y-2 bg-[#04142F]/60">
          <button
            onClick={onReturnToApp}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/6 hover:bg-white/12 text-xs font-semibold text-[#D5DCE8] hover:text-white transition cursor-pointer border border-white/8"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-[#FFC928]" />
              <span>Back to Public App</span>
            </div>
          </button>

          <div className="flex items-center justify-between px-2 pt-1">
            <div className="truncate pr-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {adminRole.replace('_', ' ')}
                </span>
              </div>
              <span className="text-xs font-bold text-white truncate block max-w-[140px]">
                {adminName || adminEmail}
              </span>
              <span className="text-[10px] text-[#9BAABD] truncate block max-w-[140px]">
                {adminTitle || adminEmail}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 transition cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
