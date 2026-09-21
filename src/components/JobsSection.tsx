import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Building2,
  DollarSign,
  Sparkles,
  Info,
  X,
  Globe,
  Share2,
  Calendar,
  Check
} from 'lucide-react';
import { Opportunity, OpportunityCategory, OpportunityRemoteStatus, OpportunityPaidStatus } from '../types';

interface JobsSectionProps {
  onSelectCategory?: (category: string) => void;
}

const CATEGORY_TABS: { id: string; label: string; icon?: string }[] = [
  { id: 'all', label: 'All Opportunities' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'remote', label: 'Remote' },
  { id: 'surveys', label: 'Surveys' },
  { id: 'data_annotation', label: 'Data Annotation' },
  { id: 'research', label: 'Research' },
  { id: 'internship', label: 'Internship' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'ngo_community', label: 'NGO & Community' },
  { id: 'training', label: 'Training Opportunities' }
];

export const JobsSection: React.FC<JobsSectionProps> = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRemoteStatus, setSelectedRemoteStatus] = useState<string>('all');
  const [selectedPaidStatus, setSelectedPaidStatus] = useState<string>('all');
  const [showExpired, setShowExpired] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Safety banner dismiss state
  const [showSafetyWarning, setShowSafetyWarning] = useState(true);

  // Fetch opportunities
  useEffect(() => {
    fetchOpportunities();
  }, [selectedCategory, selectedRemoteStatus, selectedPaidStatus, showExpired]);

  const fetchOpportunities = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedRemoteStatus !== 'all') params.append('remoteStatus', selectedRemoteStatus);
      if (selectedPaidStatus !== 'all') params.append('paidStatus', selectedPaidStatus);
      if (showExpired) params.append('includeExpired', 'true');
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/opportunities?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || []);
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side search trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOpportunities();
  };

  // Helper for status badge
  const getDeadlineStatus = (deadlineStr?: string) => {
    if (!deadlineStr) return { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    const today = new Date().toISOString().split('T')[0];
    const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (deadlineStr < today) {
      return { label: 'Expired', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (deadlineStr <= inSevenDays) {
      return { label: 'Expiring Soon', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  // Handle Apply button click with server analytics tracking & Referral Link priority
  const handleApplyClick = async (opp: Opportunity, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let targetUrl = opp.referralUrl || opp.applicationUrl || opp.officialUrl;
    try {
      const res = await fetch(`/api/opportunities/${opp.id}/apply`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.applicationUrl || data.targetUrl) {
          targetUrl = data.applicationUrl || data.targetUrl;
        }
      }
    } catch (err) {
      console.error('Failed to log apply click:', err);
    }
    // Open referral/official application URL in a safe new tab
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle opening details modal + server view tracking
  const handleOpenDetails = async (opp: Opportunity) => {
    setSelectedOpp(opp);
    try {
      const res = await fetch(`/api/opportunities/${opp.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.opportunity) {
          setSelectedOpp(data.opportunity);
        }
      }
    } catch (err) {
      console.error('Failed to record opportunity view:', err);
    }
  };

  const handleShare = (opp: Opportunity, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: `${opp.title} - ${opp.organization}`,
        text: `Check out this opportunity on Shendam Connect: ${opp.title} by ${opp.organization}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 box-border pb-24 pt-4 px-3.5 sm:px-6 min-h-screen overflow-x-hidden">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#04142F] via-[#08224D] to-[#04142F] rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-white shadow-xl mb-5 sm:mb-6 border border-white/10 w-full max-w-full min-w-0 box-border">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#FFC928]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFC928]/20 text-[#FFC928] text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2.5 sm:mb-3 border border-[#FFC928]/30 shrink-0">
            <Briefcase className="w-3.5 h-3.5 shrink-0" />
            <span>Economic Empowerment Hub</span>
          </div>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-2 break-words">
            💼 Jobs & Opportunities
          </h1>
          <p className="text-xs sm:text-base text-[#9BAABD] leading-relaxed break-words">
            Discover verified jobs, remote work, data annotation projects, research surveys, internships, and freelance gigs available for Shendam LGA residents and Plateau youth.
          </p>
        </div>
      </div>

      {/* Scam & Safety Warning Box */}
      {showSafetyWarning && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 sm:p-5 mb-5 sm:mb-6 text-amber-900 dark:text-amber-200 relative flex gap-3 items-start backdrop-blur-sm w-full max-w-full min-w-0 box-border">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1 pr-6 flex-1 min-w-0">
            <p className="font-bold text-amber-800 dark:text-amber-300 break-words">
              🛡️ Job Safety & Scam Warning
            </p>
            <p className="text-amber-700/90 dark:text-amber-200/80 leading-relaxed break-words">
              Shendam Connect will <strong>never ask for money, OTPs, banking PINs, or registration fees</strong> to apply for jobs. Always verify the organization before sharing sensitive personal documents. Use official application links provided below.
            </p>
          </div>
          <button
            onClick={() => setShowSafetyWarning(false)}
            className="absolute top-3 right-3 text-amber-600 dark:text-amber-400 hover:opacity-80 p-1 cursor-pointer"
            title="Dismiss warning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar (White content box on light mode / navy on dark mode) */}
      <div className="bg-white dark:bg-[#08224D] rounded-2xl p-3.5 sm:p-5 shadow-sm border border-slate-200 dark:border-white/10 mb-5 sm:mb-6 space-y-3.5 sm:space-y-4 w-full max-w-full min-w-0 box-border overflow-hidden">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full min-w-0">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500 absolute left-3 sm:left-3.5 pointer-events-none shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, company, skills, or location..."
            className="w-full bg-slate-50 dark:bg-[#04142F] border border-slate-200 dark:border-white/10 rounded-xl pl-9 sm:pl-10 pr-20 sm:pr-24 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#FFC928] transition min-w-0 box-border"
          />
          <button
            type="submit"
            className="absolute right-1 sm:right-1.5 top-1 sm:top-1.5 bottom-1 sm:bottom-1.5 px-3 sm:px-4 bg-[#04142F] dark:bg-[#FFC928] text-white dark:text-[#04142F] font-bold text-xs rounded-lg hover:opacity-90 transition cursor-pointer flex items-center justify-center shrink-0"
          >
            Search
          </button>
        </form>

        {/* Category Horizontal Selector - strictly contained internal scrolling */}
        <div className="w-full max-w-full min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scrollbar-none touch-pan-x min-w-0 w-full">
            {CATEGORY_TABS.map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`flex-shrink-0 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 min-h-[36px] touch-manipulation ${
                    isActive
                      ? 'bg-[#04142F] text-white dark:bg-[#FFC928] dark:text-[#04142F] shadow-sm'
                      : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pt-2.5 border-t border-slate-100 dark:border-white/5 text-xs w-full min-w-0">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0">
            <span className="text-slate-400 font-semibold flex items-center gap-1 text-[11px] sm:text-xs shrink-0">
              <Filter className="w-3.5 h-3.5 shrink-0" /> Filters:
            </span>

            {/* Remote Status */}
            <select
              value={selectedRemoteStatus}
              onChange={(e) => setSelectedRemoteStatus(e.target.value)}
              className="flex-1 sm:flex-initial bg-slate-100 dark:bg-[#04142F] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 font-medium outline-none cursor-pointer text-xs min-w-[120px] max-w-full"
            >
              <option value="all">All Work Types</option>
              <option value="remote">Remote Only</option>
              <option value="hybrid">Hybrid</option>
              <option value="on_site">On-Site / Physical</option>
            </select>

            {/* Paid Status */}
            <select
              value={selectedPaidStatus}
              onChange={(e) => setSelectedPaidStatus(e.target.value)}
              className="flex-1 sm:flex-initial bg-slate-100 dark:bg-[#04142F] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 font-medium outline-none cursor-pointer text-xs min-w-[110px] max-w-full"
            >
              <option value="all">All Pay Status</option>
              <option value="paid">Paid Opportunities</option>
              <option value="unpaid">Unpaid / Volunteer</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none text-xs shrink-0 pt-0.5 sm:pt-0">
            <input
              type="checkbox"
              checked={showExpired}
              onChange={(e) => setShowExpired(e.target.checked)}
              className="rounded text-[#FFC928] focus:ring-0 cursor-pointer w-3.5 h-3.5 shrink-0"
            />
            <span className="text-xs">Include Expired Listings</span>
          </label>
        </div>
      </div>

      {/* Opportunities List Grid */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3 w-full">
          <div className="w-10 h-10 border-3 border-[#FFC928] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading verified opportunities...</p>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="bg-white dark:bg-[#08224D] rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center border border-slate-200 dark:border-white/10 my-6 sm:my-8 space-y-3 w-full max-w-full min-w-0 box-border">
          <Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            No Opportunities Found
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            No active listings match your current filters. Try resetting your search query or selecting "All Opportunities".
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedRemoteStatus('all');
              setSelectedPaidStatus('all');
              setSearchQuery('');
              setShowExpired(false);
            }}
            className="px-4 py-2 bg-[#04142F] dark:bg-[#FFC928] text-white dark:text-[#04142F] text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition inline-block"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 w-full max-w-full min-w-0">
          {opportunities.map((opp) => {
            const status = getDeadlineStatus(opp.deadline);
            return (
              <div
                key={opp.id}
                onClick={() => handleOpenDetails(opp)}
                className={`bg-white dark:bg-[#08224D] rounded-2xl p-4 sm:p-5 border transition-all duration-200 hover:shadow-lg flex flex-col justify-between cursor-pointer relative group w-full max-w-full min-w-0 box-border ${
                  opp.featured
                    ? 'border-[#FFC928]/50 ring-1 ring-[#FFC928]/30 dark:bg-gradient-to-b dark:from-[#08224D] dark:to-[#04142F]'
                    : 'border-slate-200 dark:border-white/10 hover:border-slate-300'
                }`}
              >
                <div className="w-full min-w-0">
                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5 sm:mb-3 w-full min-w-0">
                    {opp.featured && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FFC928] text-[#04142F] text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 shrink-0">
                        <Sparkles className="w-3 h-3" /> Featured
                      </span>
                    )}

                    {opp.verificationStatus === 'verified' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold inline-flex items-center gap-1 border border-emerald-500/20 shrink-0">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    )}

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${status.color}`}>
                      {status.label}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-semibold sm:ml-auto capitalize shrink-0">
                      {opp.category.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Title & Organization */}
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-[#FFC928] transition mb-1 break-words">
                    {opp.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2.5 sm:mb-3 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{opp.organization}</span>
                  </p>

                  {/* Key Metadata Pills */}
                  <div className="grid grid-cols-2 gap-2 my-2.5 sm:my-3 text-xs w-full min-w-0">
                    <div className="bg-slate-50 dark:bg-[#04142F] p-2 rounded-xl flex items-center gap-1.5 sm:gap-2 text-slate-700 dark:text-slate-300 min-w-0">
                      <Globe className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span className="truncate capitalize font-medium text-[11px] sm:text-xs">{opp.remoteStatus.replace('_', ' ')}</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#04142F] p-2 rounded-xl flex items-center gap-1.5 sm:gap-2 text-slate-700 dark:text-slate-300 min-w-0">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span className="truncate capitalize font-medium text-[11px] sm:text-xs">{opp.paidStatus}</span>
                    </div>
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 sm:mb-4 leading-relaxed break-words">
                    {opp.description}
                  </p>
                </div>

                {/* Card Footer: Deadline & Action CTA */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2 text-xs w-full min-w-0">
                  <div className="text-slate-400 font-medium flex items-center gap-1 min-w-0 flex-1 truncate text-[11px] sm:text-xs">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{opp.deadline ? `Due: ${opp.deadline}` : 'Open Enrollment'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => handleApplyClick(opp, e)}
                      className="px-3 py-1.5 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] font-bold text-xs rounded-xl flex items-center gap-1 transition shadow-sm cursor-pointer shrink-0"
                    >
                      <span>Apply</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OPPORTUNITY DETAILS MODAL */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#08224D] rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white relative p-4 sm:p-8 space-y-5 sm:space-y-6 box-border min-w-0">
            {/* Close Button */}
            <button
              onClick={() => setSelectedOpp(null)}
              className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 p-2 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition cursor-pointer text-slate-600 dark:text-slate-300 z-10"
              aria-label="Close details modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="pr-8 sm:pr-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2.5 sm:mb-3">
                {selectedOpp.featured && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FFC928] text-[#04142F] text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 shrink-0">
                    <Sparkles className="w-3 h-3" /> Featured
                  </span>
                )}
                {selectedOpp.verificationStatus === 'verified' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold inline-flex items-center gap-1 border border-emerald-500/20 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" /> Officially Verified
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold inline-flex items-center gap-1 border border-amber-500/20 shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5" /> Unverified Community Listing
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-xs font-medium capitalize shrink-0">
                  {selectedOpp.category.replace('_', ' ')}
                </span>
              </div>

              <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mb-1.5 sm:mb-2 leading-tight break-words">
                {selectedOpp.title}
              </h2>

              <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 break-words">
                <Building2 className="w-4 h-4 text-[#FFC928] shrink-0" />
                <span>{selectedOpp.organization}</span>
              </p>
            </div>

            {/* Overview Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#04142F] border border-slate-100 dark:border-white/5 text-xs w-full min-w-0">
              <div className="min-w-0">
                <span className="block text-slate-400 font-semibold mb-0.5 text-[11px] sm:text-xs">Location</span>
                <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1 truncate text-xs">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" /> <span className="truncate">{selectedOpp.location}</span>
                </span>
              </div>

              <div className="min-w-0">
                <span className="block text-slate-400 font-semibold mb-0.5 text-[11px] sm:text-xs">Work Type</span>
                <span className="font-bold text-slate-800 dark:text-white capitalize flex items-center gap-1 truncate text-xs">
                  <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" /> <span className="truncate">{selectedOpp.remoteStatus.replace('_', ' ')}</span>
                </span>
              </div>

              <div className="min-w-0">
                <span className="block text-slate-400 font-semibold mb-0.5 text-[11px] sm:text-xs">Paid Status</span>
                <span className="font-bold text-slate-800 dark:text-white capitalize flex items-center gap-1 truncate text-xs">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> <span className="truncate">{selectedOpp.paidStatus}</span>
                </span>
              </div>

              <div className="min-w-0">
                <span className="block text-slate-400 font-semibold mb-0.5 text-[11px] sm:text-xs">Deadline</span>
                <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1 truncate text-xs">
                  <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" /> <span className="truncate">{selectedOpp.deadline || 'Open'}</span>
                </span>
              </div>
            </div>

            {/* Compensation Info */}
            {selectedOpp.compensation && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 text-emerald-900 dark:text-emerald-300 text-xs sm:text-sm flex items-center justify-between gap-2 w-full min-w-0">
                <div className="min-w-0 flex-1">
                  <span className="font-bold block text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-[10px]">
                    Compensation & Stipend
                  </span>
                  <span className="font-black text-sm sm:text-base break-words">{selectedOpp.compensation}</span>
                </div>
                <DollarSign className="w-6 h-6 text-emerald-500 shrink-0" />
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5 sm:space-y-2 w-full min-w-0">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Opportunity Description
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line break-words">
                {selectedOpp.description}
              </p>
            </div>

            {/* Requirements */}
            {selectedOpp.requirements && selectedOpp.requirements.length > 0 && (
              <div className="space-y-1.5 sm:space-y-2 w-full min-w-0">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Key Requirements & Skills
                </h4>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  {selectedOpp.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="break-words flex-1">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Application Instructions */}
            {selectedOpp.applicationInstructions && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm space-y-1 w-full min-w-0">
                <span className="font-bold text-blue-800 dark:text-blue-300 block uppercase tracking-wider text-[10px]">
                  Application Instructions
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                  {selectedOpp.applicationInstructions}
                </p>
              </div>
            )}

            {/* Verification Badge Details */}
            <div className="p-3 bg-slate-50 dark:bg-[#04142F] rounded-xl text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 w-full min-w-0">
              <span className="break-words">
                Verified Status:{' '}
                <strong className="text-slate-700 dark:text-slate-200">
                  {selectedOpp.verificationStatus === 'verified'
                    ? `Verified by ${selectedOpp.verifiedBy || 'Shendam Connect Admin'}`
                    : 'Unverified - Exercise caution'}
                </strong>
              </span>
              <span className="shrink-0">Posted: {new Date(selectedOpp.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Mandatory Affiliate Disclosure */}
            {(selectedOpp.hasReferralLink || selectedOpp.isReferral || selectedOpp.referralUrl) && (
              <div className="p-3 sm:p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5 w-full min-w-0">
                <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed break-words flex-1">
                  <strong>Affiliate Disclosure:</strong> This opportunity uses an official referral/partner link. Shendam Connect may earn a commission or referral reward if you complete an eligible registration through this link, at no additional cost to you.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 sm:pt-4 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 w-full min-w-0">
              <button
                onClick={(e) => handleApplyClick(selectedOpp, e)}
                className="w-full sm:flex-1 py-3 sm:py-3.5 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
              >
                <span>Apply / Register Now</span>
                <ExternalLink className="w-4 h-4 shrink-0" />
              </button>

              <button
                onClick={(e) => handleShare(selectedOpp, e)}
                className="w-full sm:w-auto px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white font-bold text-xs rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Link Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 shrink-0" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
