import React from 'react';
import {
  Users,
  Radio,
  Eye,
  Building2,
  Store,
  Compass,
  CalendarDays,
  TrendingUp,
  PlusCircle,
  Megaphone,
  Inbox,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  DollarSign,
  Wallet,
  Receipt,
  Sparkles,
  Briefcase,
  Settings
} from 'lucide-react';
import { AdminSectionId, Place, Booking, AuditLogRecord, RevenueSummary, Opportunity, FeedbackItem } from '../../types';
import { INITIAL_REVENUE_DATA } from '../../data/mockData';

interface AdminOverviewProps {
  analytics: any;
  places: Place[];
  bookings: Booking[];
  opportunities?: Opportunity[];
  feedbackList?: FeedbackItem[];
  pendingSubmissionsCount: number;
  auditLogs: AuditLogRecord[];
  revenue?: RevenueSummary;
  onNavigateSection: (section: AdminSectionId) => void;
  onOpenCreatePlace: (category: 'hotels' | 'services' | 'tourist_spots') => void;
  onOpenBroadcastModal: () => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  analytics,
  places,
  bookings,
  opportunities = [],
  feedbackList = [],
  pendingSubmissionsCount,
  auditLogs,
  revenue = INITIAL_REVENUE_DATA,
  onNavigateSection,
  onOpenCreatePlace,
  onOpenBroadcastModal
}) => {
  const overview = analytics?.overview || {};
  const activeNow = overview.activeUsersNow !== undefined ? overview.activeUsersNow : 0;
  const totalHotels = places.filter((p) => p.category === 'hotels').length;
  const totalBusinesses = places.filter((p) => p.category !== 'hotels' && p.category !== 'tourist_spots').length;
  const totalAttractions = places.filter((p) => p.category === 'tourist_spots').length;
  const pendingBookings = bookings.filter((b) => b.status === 'pending').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner with Real-Time Indicator */}
      <div className="bg-gradient-to-r from-[#08254D] via-[#0B2D5C] to-[#04142F] border border-white/14 rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#FFC928]/15 border border-[#FFC928]/30 text-[#FFC928] px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                <span>Shendam LGA Digital Command Center</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-brand-sans tracking-tight">
              Portal Overview & Live Control
            </h1>
            <p className="text-xs text-[#D5DCE8] max-w-xl leading-relaxed">
              Real-time monitoring of Shendam LGA hospitality, local commercial directories, tourist attractions, and visitor reservations.
            </p>
          </div>

          {/* Live Indicator Box */}
          <div
            onClick={() => onNavigateSection('live_users')}
            className="bg-[#04142F]/90 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-4 shrink-0 shadow-lg cursor-pointer hover:border-emerald-400 transition"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Active Users
                </span>
              </div>
              <p className="text-xl font-black text-white font-brand-sans">
                {activeNow} <span className="text-xs font-normal text-[#9BAABD]">Online Now</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (10 Metrics Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Users */}
        <div 
          onClick={() => onNavigateSection('live_users')}
          className="bg-[#08254D] border border-white/12 rounded-2xl p-4 text-white space-y-1 shadow-sm cursor-pointer hover:bg-[#0A2E5E] transition"
        >
          <div className="flex items-center justify-between text-[#9BAABD]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-brand-sans">
            {(overview.totalVisitors || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-[#9BAABD]">Unique sessions base</p>
        </div>

        {/* Card 2: Active Users Now */}
        <div
          onClick={() => onNavigateSection('live_users')}
          className="bg-[#08254D] border border-emerald-500/30 rounded-2xl p-4 text-white space-y-1 shadow-sm cursor-pointer hover:bg-[#0A2E5E] transition"
        >
          <div className="flex items-center justify-between text-[#9BAABD]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Live Active</span>
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-300 font-brand-sans">
            {activeNow}
          </div>
          <p className="text-[10px] text-[#9BAABD]">Heartbeat presence</p>
        </div>

        {/* Card 3: Total Hotels */}
        <div
          onClick={() => onNavigateSection('hotels')}
          className="bg-[#08254D] border border-white/12 rounded-2xl p-4 text-white space-y-1 shadow-sm cursor-pointer hover:bg-[#0A2E5E] transition"
        >
          <div className="flex items-center justify-between text-[#9BAABD]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Hotels</span>
            <Building2 className="w-4 h-4 text-[#FFC928]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-brand-sans">
            {totalHotels}
          </div>
          <p className="text-[10px] text-[#FFC928] hover:underline">Manage hotels →</p>
        </div>

        {/* Card 4: Total Businesses */}
        <div
          onClick={() => onNavigateSection('businesses')}
          className="bg-[#08254D] border border-white/12 rounded-2xl p-4 text-white space-y-1 shadow-sm cursor-pointer hover:bg-[#0A2E5E] transition"
        >
          <div className="flex items-center justify-between text-[#9BAABD]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Businesses</span>
            <Store className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-brand-sans">
            {totalBusinesses}
          </div>
          <p className="text-[10px] text-emerald-400 hover:underline">Manage directory →</p>
        </div>

        {/* Card 5: Total Listings */}
        <div
          onClick={() => onNavigateSection('all_listings')}
          className="bg-[#08254D] border border-white/12 rounded-2xl p-4 text-white space-y-1 shadow-sm cursor-pointer hover:bg-[#0A2E5E] transition"
        >
          <div className="flex items-center justify-between text-[#9BAABD]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Listings</span>
            <Compass className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-brand-sans">
            {places.length}
          </div>
          <p className="text-[10px] text-amber-400 hover:underline">All categories →</p>
        </div>

        {/* Card 6: Total Booking Requests */}
        <div
          onClick={() => onNavigateSection('bookings')}
          className="bg-[#08254D] border border-white/12 rounded-2xl p-4 text-white space-y-1 shadow-sm cursor-pointer hover:bg-[#0A2E5E] transition"
        >
          <div className="flex items-center justify-between text-[#9BAABD]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Booking Requests</span>
            <CalendarDays className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-brand-sans flex items-baseline gap-2">
            {bookings.length}
            {pendingBookings > 0 && (
              <span className="text-[9px] font-bold bg-amber-500 text-[#04142F] px-1.5 py-0.5 rounded-full animate-pulse">
                {pendingBookings} New
              </span>
            )}
          </div>
          <p className="text-[10px] text-cyan-400 hover:underline">Manage stays →</p>
        </div>

        {/* Card 7: Total Opportunities */}
        <div
          onClick={() => onNavigateSection('opportunities')}
          className="bg-[#08254D] border border-white/12 rounded-2xl p-4 text-white space-y-1 shadow-sm cursor-pointer hover:bg-[#0A2E5E] transition"
        >
          <div className="flex items-center justify-between text-[#9BAABD]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Opportunities/Jobs</span>
            <Briefcase className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-brand-sans">
            {opportunities.length}
          </div>
          <p className="text-[10px] text-indigo-400 hover:underline">Manage postings →</p>
        </div>

        {/* Card 8: Total Feedback/Requests */}
        <div
          onClick={() => onNavigateSection('feedback')}
          className="bg-[#08254D] border border-white/12 rounded-2xl p-4 text-white space-y-1 shadow-sm cursor-pointer hover:bg-[#0A2E5E] transition"
        >
          <div className="flex items-center justify-between text-[#9BAABD]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Feedback & Requests</span>
            <Inbox className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-brand-sans flex items-baseline gap-2">
            {feedbackList.length}
            {feedbackList.filter(f => f.status === 'pending').length > 0 && (
              <span className="text-[9px] font-bold bg-amber-500 text-[#04142F] px-1.5 py-0.5 rounded-full animate-pulse">
                {feedbackList.filter(f => f.status === 'pending').length} New
              </span>
            )}
          </div>
          <p className="text-[10px] text-pink-400 hover:underline">View feedback list →</p>
        </div>

        {/* Card 9: Today's Sessions */}
        <div className="bg-[#08254D] border border-white/12 rounded-2xl p-4 text-white space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-[#9BAABD]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Sessions</span>
            <Eye className="w-4 h-4 text-[#FFC928]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-brand-sans">
            {overview.visitorsToday || 0}
          </div>
          <p className="text-[10px] text-[#9BAABD]">Sessions tracked today</p>
        </div>

        {/* Card 10: Total Page Views */}
        <div className="bg-[#08254D] border border-white/12 rounded-2xl p-4 text-white space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-[#9BAABD]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Page Views</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-brand-sans">
            {(overview.totalPageViews || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-[#9BAABD]">All-time traffic views</p>
        </div>
      </div>

      {/* 💰 REVENUE COMMAND CENTER */}
      <div className="bg-[#08254D] border border-white/14 rounded-3xl p-5 sm:p-6 text-white shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-bold shadow-inner">
              💰
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white font-brand-sans tracking-tight">
                  REVENUE & FINANCIAL SUMMARY
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Live Ledger
                </span>
              </div>
              <p className="text-xs text-[#9BAABD]">
                Real-time commercial revenue streams, commissions, advertising, and escrow settlements
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateSection('revenue')}
            className="px-3.5 py-2 bg-[#04142F] hover:bg-[#061D40] text-[#FFC928] border border-white/14 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shadow-sm"
          >
            <span>View Full Financial Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 7 Revenue KPI Matrix Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {/* 1. Today's Revenue */}
          <div
            onClick={() => onNavigateSection('revenue')}
            className="bg-[#04142F] border border-emerald-500/30 hover:border-emerald-400 rounded-2xl p-4 space-y-1.5 transition cursor-pointer shadow-sm"
          >
            <div className="flex items-center justify-between text-[#9BAABD]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Today's Revenue</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-brand-sans">
              ₦{revenue.todaysRevenue.toLocaleString()}
            </div>
            <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <span>●</span> Recorded today
            </p>
          </div>

          {/* 2. This Month */}
          <div
            onClick={() => onNavigateSection('revenue')}
            className="bg-[#04142F] border border-[#FFC928]/30 hover:border-[#FFC928] rounded-2xl p-4 space-y-1.5 transition cursor-pointer shadow-sm"
          >
            <div className="flex items-center justify-between text-[#9BAABD]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFC928]">This Month</span>
              <Receipt className="w-4 h-4 text-[#FFC928]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#FFC928] font-brand-sans">
              ₦{revenue.thisMonth.toLocaleString()}
            </div>
            <p className="text-[10px] text-[#D5DCE8] font-medium">
              August 2026 cumulative
            </p>
          </div>

          {/* 3. Booking Commission */}
          <div
            onClick={() => onNavigateSection('revenue')}
            className="bg-[#04142F] border border-white/12 hover:border-sky-400/50 rounded-2xl p-4 space-y-1.5 transition cursor-pointer shadow-sm"
          >
            <div className="flex items-center justify-between text-[#9BAABD]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300">Booking Commission</span>
              <Building2 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-brand-sans">
              ₦{revenue.bookingCommission.toLocaleString()}
            </div>
            <p className="text-[10px] text-[#9BAABD]">
              10% from hotel stays
            </p>
          </div>

          {/* 4. Pending Revenue */}
          <div
            onClick={() => onNavigateSection('revenue')}
            className="bg-[#04142F] border border-amber-500/30 hover:border-amber-400 rounded-2xl p-4 space-y-1.5 transition cursor-pointer shadow-sm"
          >
            <div className="flex items-center justify-between text-[#9BAABD]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Pending Revenue</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 font-brand-sans">
              ₦{revenue.pendingRevenue.toLocaleString()}
            </div>
            <p className="text-[10px] text-amber-400/90 font-medium">
              In escrow / settlement
            </p>
          </div>

          {/* 5. Advertising */}
          <div
            onClick={() => onNavigateSection('revenue')}
            className="bg-[#04142F] border border-white/12 hover:border-indigo-400/50 rounded-2xl p-4 space-y-1.5 transition cursor-pointer shadow-sm"
          >
            <div className="flex items-center justify-between text-[#9BAABD]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">Advertising</span>
              <Megaphone className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-brand-sans">
              ₦{revenue.advertising.toLocaleString()}
            </div>
            <p className="text-[10px] text-[#9BAABD]">
              Hero banners & promos
            </p>
          </div>

          {/* 6. Sponsored Listings */}
          <div
            onClick={() => onNavigateSection('revenue')}
            className="bg-[#04142F] border border-white/12 hover:border-[#FFC928]/50 rounded-2xl p-4 space-y-1.5 transition cursor-pointer shadow-sm"
          >
            <div className="flex items-center justify-between text-[#9BAABD]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFC928]">Sponsored Listings</span>
              <Sparkles className="w-4 h-4 text-[#FFC928]" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-brand-sans">
              ₦{revenue.sponsoredListings.toLocaleString()}
            </div>
            <p className="text-[10px] text-[#9BAABD]">
              Featured directory pins
            </p>
          </div>

          {/* 7. Premium Accounts */}
          <div
            onClick={() => onNavigateSection('revenue')}
            className="bg-[#04142F] border border-white/12 hover:border-emerald-400/50 rounded-2xl p-4 space-y-1.5 transition cursor-pointer shadow-sm col-span-2 sm:col-span-1 lg:col-span-2"
          >
            <div className="flex items-center justify-between text-[#9BAABD]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Premium Accounts</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-brand-sans">
              ₦{revenue.premiumAccounts.toLocaleString()}
            </div>
            <p className="text-[10px] text-[#9BAABD]">
              Verified merchant subscriptions
            </p>
          </div>
        </div>

        {/* Breakdown Metric Comparison Table matching user schema */}
        <div className="bg-[#04142F] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/8 text-[11px] font-bold uppercase tracking-wider text-[#9BAABD]">
            <span>Metric</span>
            <span>Recorded Value / Example</span>
          </div>

          <div className="divide-y divide-white/6 text-xs font-medium">
            <div className="py-2 flex items-center justify-between">
              <span className="text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Today's Revenue
              </span>
              <span className="font-black text-emerald-400 font-brand-sans">₦{revenue.todaysRevenue.toLocaleString()}</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FFC928]" />
                This Month
              </span>
              <span className="font-black text-[#FFC928] font-brand-sans">₦{revenue.thisMonth.toLocaleString()}</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-white flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                Booking Commission
              </span>
              <span className="font-black text-white font-brand-sans">₦{revenue.bookingCommission.toLocaleString()}</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-white flex items-center gap-2">
                <Megaphone className="w-3.5 h-3.5 text-indigo-400" />
                Advertising
              </span>
              <span className="font-black text-white font-brand-sans">₦{revenue.advertising.toLocaleString()}</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-white flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#FFC928]" />
                Sponsored Listings
              </span>
              <span className="font-black text-white font-brand-sans">₦{revenue.sponsoredListings.toLocaleString()}</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-white flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Premium Accounts
              </span>
              <span className="font-black text-white font-brand-sans">₦{revenue.premiumAccounts.toLocaleString()}</span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <span className="text-amber-300 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Pending Revenue
              </span>
              <span className="font-black text-amber-300 font-brand-sans">₦{revenue.pendingRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts Bar */}
      <div className="bg-[#08254D] border border-white/12 rounded-3xl p-5 text-white">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#FFC928] mb-3">
          Quick Management Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onOpenCreatePlace('hotels')}
            className="flex items-center gap-2.5 bg-[#04142F] hover:bg-[#061D40] border border-white/14 p-3 rounded-2xl text-xs font-bold text-white transition cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-[#FFC928]/15 border border-[#FFC928]/30 flex items-center justify-center text-[#FFC928] shrink-0">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="block">Add Hotel</span>
              <span className="text-[10px] text-[#9BAABD] font-normal">New accommodation</span>
            </div>
          </button>

          <button
            onClick={() => onOpenCreatePlace('services')}
            className="flex items-center gap-2.5 bg-[#04142F] hover:bg-[#061D40] border border-white/14 p-3 rounded-2xl text-xs font-bold text-white transition cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="block">Add Business</span>
              <span className="text-[10px] text-[#9BAABD] font-normal">Merchant listing</span>
            </div>
          </button>

          <button
            onClick={() => onOpenCreatePlace('tourist_spots')}
            className="flex items-center gap-2.5 bg-[#04142F] hover:bg-[#061D40] border border-white/14 p-3 rounded-2xl text-xs font-bold text-white transition cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="block">Add Attraction</span>
              <span className="text-[10px] text-[#9BAABD] font-normal">Heritage / Tourism</span>
            </div>
          </button>

          <button
            onClick={onOpenBroadcastModal}
            className="flex items-center gap-2.5 bg-[#04142F] hover:bg-[#061D40] border border-white/14 p-3 rounded-2xl text-xs font-bold text-white transition cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <span className="block">Broadcast Alert</span>
              <span className="text-[10px] text-[#9BAABD] font-normal">LGA announcement</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateSection('admin_management')}
            className="flex items-center gap-2.5 bg-[#04142F] hover:bg-[#061D40] border border-white/14 p-3 rounded-2xl text-xs font-bold text-white transition cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="block">Manage Admins</span>
              <span className="text-[10px] text-[#9BAABD] font-normal">Add / remove admins</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateSection('settings')}
            className="flex items-center gap-2.5 bg-[#04142F] hover:bg-[#061D40] border border-white/14 p-3 rounded-2xl text-xs font-bold text-white transition cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <span className="block">Platform Settings</span>
              <span className="text-[10px] text-[#9BAABD] font-normal">System & LGA config</span>
            </div>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Recent Bookings & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings Box */}
        <div className="bg-[#08254D] border border-white/12 rounded-3xl p-5 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4 text-[#FFC928]" />
                <h3 className="font-bold text-sm text-white font-brand-sans">
                  Recent Guest Reservations
                </h3>
              </div>
              <button
                onClick={() => onNavigateSection('bookings')}
                className="text-xs text-[#FFC928] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({bookings.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-white/8 mt-2">
              {bookings.slice(0, 4).map((b) => (
                <div key={b.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{b.customerName}</span>
                      <span className="text-[10px] text-[#9BAABD]">({b.id})</span>
                    </div>
                    <p className="text-[11px] text-[#9BAABD] mt-0.5">
                      {b.placeName} • {b.checkInDate}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        b.status === 'confirmed'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : b.status === 'pending'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-white/10 text-[#9BAABD] border-white/14'
                      }`}
                    >
                      {b.status}
                    </span>
                    <span className="block text-[11px] font-semibold text-white mt-0.5">
                      {b.amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Activity Trail */}
        <div className="bg-[#08254D] border border-white/12 rounded-3xl p-5 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white font-brand-sans">
                  System Audit Logs
                </h3>
              </div>
              <button
                onClick={() => onNavigateSection('activity_log')}
                className="text-xs text-[#FFC928] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Log</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-white/8 mt-2">
              {auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="py-3 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[#9BAABD]">
                    <span className="font-bold text-white text-[11px] uppercase tracking-wider">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px]">{log.dateStr}</span>
                  </div>
                  <p className="text-[11px] text-[#D5DCE8] leading-relaxed">
                    {log.details}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
