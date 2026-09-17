import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Building2,
  DollarSign,
  Sparkles,
  Edit2,
  Trash2,
  Eye,
  Globe,
  Filter,
  BarChart3,
  X,
  Check,
  Lock,
  Calendar,
  Link,
  Copy,
  Receipt,
  TrendingUp,
  Info
} from 'lucide-react';
import { Opportunity, OpportunityStats, OpportunityCategory, OpportunityMonetizationStatus } from '../../types';

interface AdminOpportunitiesProps {
  authToken: string;
}

export const AdminOpportunities: React.FC<AdminOpportunitiesProps> = ({ authToken }) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [stats, setStats] = useState<OpportunityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonetization, setFilterMonetization] = useState<string>('all');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Commission Recording Modal State
  const [commissionOpp, setCommissionOpp] = useState<Opportunity | null>(null);
  const [commAmount, setCommAmount] = useState('');
  const [commPayer, setCommPayer] = useState('');
  const [commRef, setCommRef] = useState('');
  const [commNote, setCommNote] = useState('Conversions are reported by the external referral platform.');
  const [isSubmittingComm, setIsSubmittingComm] = useState(false);

  // Copy URL Feedback
  const [copiedOppId, setCopiedOppId] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    category: 'jobs' as OpportunityCategory,
    description: '',
    requirements: '',
    location: 'Shendam LGA / Remote',
    remoteStatus: 'remote' as 'remote' | 'hybrid' | 'on_site',
    paidStatus: 'paid' as 'paid' | 'unpaid',
    compensation: '',
    deadline: '',
    applicationUrl: '',
    officialUrl: '',
    referralUrl: '',
    monetizationStatus: 'no_referral' as OpportunityMonetizationStatus,
    applicationInstructions: '',
    contactInfo: '',
    verificationStatus: 'verified' as 'verified' | 'unverified',
    featured: false,
    published: true
  });

  useEffect(() => {
    if (authToken) {
      fetchOpportunitiesAndStats();
    }
  }, [authToken]);

  const fetchOpportunitiesAndStats = async () => {
    setIsLoading(true);
    try {
      const [oppsRes, statsRes] = await Promise.all([
        fetch('/api/admin/opportunities', {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        fetch('/api/admin/opportunities/stats', {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ]);

      if (oppsRes.ok) {
        const data = await oppsRes.json();
        setOpportunities(data.opportunities || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }
    } catch (err) {
      console.error('Failed to load admin opportunities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingOpp(null);
    setFormError(null);
    setFormData({
      title: '',
      organization: '',
      category: 'jobs',
      description: '',
      requirements: '',
      location: 'Shendam LGA / Remote',
      remoteStatus: 'remote',
      paidStatus: 'paid',
      compensation: '',
      deadline: '',
      applicationUrl: '',
      officialUrl: '',
      referralUrl: '',
      monetizationStatus: 'no_referral',
      applicationInstructions: '',
      contactInfo: '',
      verificationStatus: 'verified',
      featured: false,
      published: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (opp: Opportunity) => {
    setEditingOpp(opp);
    setFormError(null);
    const targetOfficial = opp.officialUrl || opp.applicationUrl || '';
    setFormData({
      title: opp.title,
      organization: opp.organization,
      category: opp.category,
      description: opp.description,
      requirements: opp.requirements ? opp.requirements.join('\n') : '',
      location: opp.location,
      remoteStatus: opp.remoteStatus,
      paidStatus: opp.paidStatus,
      compensation: opp.compensation || '',
      deadline: opp.deadline || '',
      applicationUrl: targetOfficial,
      officialUrl: targetOfficial,
      referralUrl: opp.referralUrl || '',
      monetizationStatus: opp.monetizationStatus || (opp.referralUrl ? 'referral_link' : 'no_referral'),
      applicationInstructions: opp.applicationInstructions || '',
      contactInfo: opp.contactInfo || '',
      verificationStatus: opp.verificationStatus,
      featured: opp.featured,
      published: opp.published
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const official = (formData.officialUrl || formData.applicationUrl).trim();

    if (!formData.title.trim() || !formData.organization.trim() || !formData.description.trim() || !official) {
      setFormError('Please fill in required fields: Title, Organization, Description, and Official URL.');
      return;
    }

    try {
      const urlParsed = new URL(official);
      if (urlParsed.protocol !== 'http:' && urlParsed.protocol !== 'https:') {
        throw new Error();
      }
    } catch {
      setFormError('Official URL must be a valid HTTP or HTTPS address (e.g. https://company.com/careers).');
      return;
    }

    if (formData.referralUrl.trim()) {
      try {
        const refParsed = new URL(formData.referralUrl.trim());
        if (refParsed.protocol !== 'http:' && refParsed.protocol !== 'https:') {
          throw new Error();
        }
      } catch {
        setFormError('Referral URL must be a valid HTTP or HTTPS address (e.g. https://outlier.ai/signup?ref=ABC).');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        applicationUrl: official,
        officialUrl: official,
        referralUrl: formData.referralUrl.trim(),
        requirements: formData.requirements
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean)
      };

      const endpoint = editingOpp
        ? `/api/admin/opportunities/${editingOpp.id}`
        : '/api/admin/opportunities';
      const method = editingOpp ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save opportunity.');
      }

      setIsModalOpen(false);
      fetchOpportunitiesAndStats();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving the opportunity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyReferralUrl = (opp: Opportunity) => {
    const link = opp.referralUrl || opp.applicationUrl;
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedOppId(opp.id);
    setTimeout(() => setCopiedOppId(null), 2000);
  };

  const handlePreviewReferralUrl = (opp: Opportunity) => {
    const link = opp.referralUrl || opp.applicationUrl;
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleRemoveReferralUrl = async (opp: Opportunity) => {
    if (!window.confirm(`Are you sure you want to remove the referral link for "${opp.title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/opportunities/${opp.id}/referral-url`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) fetchOpportunitiesAndStats();
    } catch (err) {
      console.error('Failed to remove referral URL:', err);
    }
  };

  const handleOpenCommissionModal = (opp: Opportunity) => {
    setCommissionOpp(opp);
    setCommAmount('');
    setCommPayer(opp.organization || '');
    setCommRef(`COMM-${Date.now().toString().slice(-6)}`);
    setCommNote('Conversions are reported by the external referral platform.');
  };

  const handleSubmitCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commissionOpp || !commAmount) return;
    const num = parseFloat(commAmount);
    if (isNaN(num) || num <= 0) return;

    setIsSubmittingComm(true);
    try {
      const res = await fetch(`/api/admin/opportunities/${commissionOpp.id}/commission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          amount: num,
          payer: commPayer.trim() || commissionOpp.organization,
          reference: commRef.trim(),
          note: commNote.trim()
        })
      });

      if (res.ok) {
        setCommissionOpp(null);
        fetchOpportunitiesAndStats();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to record commission.');
      }
    } catch (err) {
      console.error('Failed to record commission:', err);
    } finally {
      setIsSubmittingComm(false);
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/opportunities/${id}/publish`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) fetchOpportunitiesAndStats();
    } catch (err) {
      console.error('Failed to toggle publish:', err);
    }
  };

  const handleToggleVerify = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/opportunities/${id}/verify`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) fetchOpportunitiesAndStats();
    } catch (err) {
      console.error('Failed to toggle verify:', err);
    }
  };

  const handleToggleFeature = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/opportunities/${id}/feature`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) fetchOpportunitiesAndStats();
    } catch (err) {
      console.error('Failed to toggle feature:', err);
    }
  };

  const handleDelete = async (opp: Opportunity) => {
    if (!window.confirm(`Are you sure you want to archive/delete "${opp.title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/opportunities/${opp.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) fetchOpportunitiesAndStats();
    } catch (err) {
      console.error('Failed to delete opportunity:', err);
    }
  };

  // Filter list
  const filteredOpportunities = opportunities.filter((o) => {
    const matchesSearch =
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'all' || o.category === filterCategory;

    const today = new Date().toISOString().split('T')[0];
    let matchesStatus = true;
    if (filterStatus === 'active') matchesStatus = o.published && (!o.deadline || o.deadline >= today);
    if (filterStatus === 'expired') matchesStatus = o.deadline !== '' && o.deadline < today;
    if (filterStatus === 'draft') matchesStatus = !o.published;
    if (filterStatus === 'verified') matchesStatus = o.verificationStatus === 'verified';

    let matchesMonetization = true;
    if (filterMonetization === 'referral') matchesMonetization = !!(o.referralUrl && o.referralUrl.trim());
    if (filterMonetization === 'no_referral') matchesMonetization = !(o.referralUrl && o.referralUrl.trim());

    return matchesSearch && matchesCategory && matchesStatus && matchesMonetization;
  });

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#FFC928]" />
            <span>Jobs & Referral Opportunities Management</span>
          </h2>
          <p className="text-xs text-[#9BAABD]">
            Publish job listings, manage referral/affiliate links, track referral clicks, and record confirmed commissions.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] font-black text-xs rounded-xl shadow-lg inline-flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Opportunity</span>
        </button>
      </div>

      {/* KPI Metrics Dashboard Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-10 gap-2.5">
          <div className="bg-[#08224D] border border-white/10 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-[#9BAABD] uppercase">Total Listings</span>
            <span className="block text-lg font-black text-white">{stats.total}</span>
          </div>

          <div className="bg-[#08224D] border border-emerald-500/20 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-emerald-400 uppercase">Active</span>
            <span className="block text-lg font-black text-emerald-400">{stats.active}</span>
          </div>

          <div className="bg-[#08224D] border border-amber-500/20 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-amber-400 uppercase">Expiring</span>
            <span className="block text-lg font-black text-amber-400">{stats.expiringSoon}</span>
          </div>

          <div className="bg-[#08224D] border border-rose-500/20 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-rose-400 uppercase">Expired</span>
            <span className="block text-lg font-black text-rose-400">{stats.expired}</span>
          </div>

          <div className="bg-[#08224D] border border-[#FFC928]/20 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-[#FFC928] uppercase">Featured</span>
            <span className="block text-lg font-black text-[#FFC928]">{stats.featured}</span>
          </div>

          <div className="bg-[#08224D] border border-blue-500/20 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-blue-400 uppercase">Verified</span>
            <span className="block text-lg font-black text-blue-400">{stats.verified}</span>
          </div>

          <div className="bg-[#08224D] border border-white/10 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-[#9BAABD] uppercase">Views</span>
            <span className="block text-lg font-black text-white">{stats.totalViews}</span>
          </div>

          <div className="bg-[#08224D] border border-white/10 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-[#9BAABD] uppercase">Apply Clicks</span>
            <span className="block text-lg font-black text-slate-200">{stats.totalApplyClicks}</span>
          </div>

          <div className="bg-[#08224D] border border-cyan-500/30 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-cyan-300 uppercase">Referral Clicks</span>
            <span className="block text-lg font-black text-cyan-300">{stats.totalReferralClicks || 0}</span>
          </div>

          <div className="bg-[#08224D] border border-emerald-400/40 rounded-2xl p-3 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-emerald-300 uppercase">Confirmed Rev.</span>
            <span className="block text-lg font-black text-emerald-400 font-brand-sans">
              ₦{(stats.confirmedReferralRevenue || 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-[#08224D] rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#9BAABD] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, organization..."
            className="w-full bg-[#04142F] border border-white/16 rounded-xl pl-9 pr-3 py-2 text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#04142F] text-white border border-white/16 rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="jobs">Jobs</option>
            <option value="remote">Remote</option>
            <option value="surveys">Surveys</option>
            <option value="data_annotation">Data Annotation</option>
            <option value="research">Research</option>
            <option value="internship">Internship</option>
            <option value="freelance">Freelance</option>
            <option value="ngo_community">NGO / Community</option>
            <option value="training">Training</option>
          </select>

          <select
            value={filterMonetization}
            onChange={(e) => setFilterMonetization(e.target.value)}
            className="bg-[#04142F] text-white border border-white/16 rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="all">All Monetization</option>
            <option value="referral">🔗 Referral Link Active</option>
            <option value="no_referral">🌐 Official Link Only</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#04142F] text-white border border-white/16 rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="verified">Verified Only</option>
            <option value="expired">Expired Only</option>
            <option value="draft">Unpublished (Drafts)</option>
          </select>
        </div>
      </div>

      {/* Table of Opportunities */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-[#9BAABD]">
          Loading administrative listings...
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="bg-[#08224D] rounded-2xl p-8 text-center border border-white/10 text-[#9BAABD] text-xs">
          No opportunities match your filter criteria.
        </div>
      ) : (
        <div className="bg-[#08224D] rounded-2xl border border-white/10 overflow-x-auto">
          <table className="w-full text-left text-xs text-white">
            <thead className="bg-[#04142F] text-[#9BAABD] uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Title & Partner</th>
                <th className="py-3 px-4">Referral Status</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4">Clicks & Revenue</th>
                <th className="py-3 px-4 text-center">Badges</th>
                <th className="py-3 px-4 text-right">Referral & Record Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOpportunities.map((opp) => {
                const today = new Date().toISOString().split('T')[0];
                const isExpired = opp.deadline && opp.deadline < today;
                const hasRef = !!(opp.referralUrl && opp.referralUrl.trim());

                return (
                  <tr key={opp.id} className="hover:bg-white/5 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold flex items-center gap-1.5">
                        {opp.featured && <Sparkles className="w-3.5 h-3.5 text-[#FFC928]" />}
                        <span className="text-sm">{opp.title}</span>
                      </div>
                      <div className="text-[11px] text-[#9BAABD]">{opp.organization}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {hasRef ? (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold inline-flex items-center gap-1">
                          <Link className="w-3 h-3" /> Referral Link
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/30 text-[10px] font-medium inline-flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Official Only
                        </span>
                      )}
                      {opp.monetizationStatus && (
                        <div className="text-[10px] text-[#9BAABD] capitalize mt-0.5">
                          Status: {opp.monetizationStatus.replace('_', ' ')}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {opp.verificationStatus === 'verified' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Unverified
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {opp.deadline ? (
                        <span className={isExpired ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {opp.deadline} {isExpired && '(Expired)'}
                        </span>
                      ) : (
                        <span className="text-slate-400">Open</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="text-[#9BAABD]">👁️ {opp.viewsCount || 0} views</div>
                      <div className="text-cyan-300">🔗 {opp.referralClicks || 0} ref clicks</div>
                      <div className="text-emerald-400 font-bold">
                        ₦{(opp.confirmedCommissions || 0).toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center space-x-1">
                      {/* Publish toggle */}
                      <button
                        onClick={() => handleTogglePublish(opp.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                          opp.published
                            ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                        title="Toggle Publish Status"
                      >
                        {opp.published ? 'Published' : 'Draft'}
                      </button>

                      {/* Verify toggle */}
                      <button
                        onClick={() => handleToggleVerify(opp.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                          opp.verificationStatus === 'verified'
                            ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                            : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                        }`}
                        title="Toggle Verification"
                      >
                        {opp.verificationStatus === 'verified' ? 'Verified' : 'Verify'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right space-y-1">
                      <div className="flex items-center justify-end gap-1.5">
                        {hasRef && (
                          <>
                            <button
                              onClick={() => handleCopyReferralUrl(opp)}
                              className="p-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg transition cursor-pointer"
                              title="Copy Referral Link"
                            >
                              {copiedOppId === opp.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => handlePreviewReferralUrl(opp)}
                              className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition cursor-pointer"
                              title="Preview Link in New Tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleRemoveReferralUrl(opp)}
                              className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg transition cursor-pointer"
                              title="Remove Referral Link"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleOpenCommissionModal(opp)}
                          className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] rounded-lg transition cursor-pointer inline-flex items-center gap-1"
                          title="Record Confirmed Commission Payout"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>+ Comm.</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(opp)}
                          className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition cursor-pointer"
                          title="Edit Opportunity"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(opp)}
                          className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg transition cursor-pointer"
                          title="Delete / Archive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* RECORD CONFIRMED COMMISSION MODAL */}
      {commissionOpp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#08224D] rounded-3xl max-w-md w-full p-6 border border-white/10 text-white relative shadow-2xl space-y-4">
            <button
              onClick={() => setCommissionOpp(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <span>Record Confirmed Referral Revenue</span>
            </h3>

            <p className="text-xs text-[#9BAABD] leading-relaxed">
              Record verified commission payout for <strong>{commissionOpp.title}</strong> when confirmed by the external affiliate platform.
            </p>

            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs text-cyan-300 space-y-1">
              <span className="font-bold block text-[10px] uppercase">Compliance Notice</span>
              <p className="text-[11px] leading-relaxed">
                Conversions are reported directly by the external referral platform. Only enter confirmed earnings reported by your partner dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmitCommission} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#9BAABD] font-bold uppercase mb-1">
                  Confirmed Commission Amount (₦) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={commAmount}
                  onChange={(e) => setCommAmount(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3 py-2.5 text-white font-bold outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[#9BAABD] font-bold uppercase mb-1">
                  Payer / Affiliate Network Name
                </label>
                <input
                  type="text"
                  value={commPayer}
                  onChange={(e) => setCommPayer(e.target.value)}
                  placeholder="e.g. Outlier AI Partner Network"
                  className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFC928]"
                />
              </div>

              <div>
                <label className="block text-[#9BAABD] font-bold uppercase mb-1">
                  Reference / Payout Transaction ID
                </label>
                <input
                  type="text"
                  value={commRef}
                  onChange={(e) => setCommRef(e.target.value)}
                  placeholder="e.g. REF-TXN-99810"
                  className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFC928]"
                />
              </div>

              <div>
                <label className="block text-[#9BAABD] font-bold uppercase mb-1">
                  Payout Notes
                </label>
                <input
                  type="text"
                  value={commNote}
                  onChange={(e) => setCommNote(e.target.value)}
                  placeholder="Conversions are reported by the external referral platform."
                  className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFC928]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCommissionOpp(null)}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingComm}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingComm ? 'Recording...' : 'Record Revenue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT OPPORTUNITY FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#08224D] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-white/10 text-white relative shadow-2xl space-y-5">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#FFC928]" />
              <span>{editingOpp ? 'Edit Opportunity Listing' : 'Create New Opportunity'}</span>
            </h3>

            {formError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#9BAABD] font-bold uppercase mb-1">
                    Opportunity Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Remote AI Data Annotation & Prompt Evaluator"
                    className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFC928]"
                  />
                </div>

                <div>
                  <label className="block text-[#9BAABD] font-bold uppercase mb-1">
                    Organization / Company *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="e.g. Global Data Insights (Outlier Partner)"
                    className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#9BAABD] font-bold uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as OpportunityCategory })
                    }
                    className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFC928] cursor-pointer"
                  >
                    <option value="jobs">Jobs</option>
                    <option value="remote">Remote Jobs</option>
                    <option value="surveys">Surveys</option>
                    <option value="data_annotation">Data Annotation</option>
                    <option value="research">Research</option>
                    <option value="internship">Internship</option>
                    <option value="freelance">Freelance / Gig</option>
                    <option value="ngo_community">NGO / Community</option>
                    <option value="training">Training</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#9BAABD] font-bold uppercase mb-1">
                    Work Type
                  </label>
                  <select
                    value={formData.remoteStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        remoteStatus: e.target.value as 'remote' | 'hybrid' | 'on_site'
                      })
                    }
                    className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFC928] cursor-pointer"
                  >
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="on_site">On-Site / Physical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#9BAABD] font-bold uppercase mb-1">
                    Paid Status
                  </label>
                  <select
                    value={formData.paidStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paidStatus: e.target.value as 'paid' | 'unpaid'
                      })
                    }
                    className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFC928] cursor-pointer"
                  >
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid / Volunteer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#9BAABD] font-bold uppercase mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Shendam LGA / Remote"
                    className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFC928]"
                  />
                </div>

                <div>
                  <label className="block text-[#9BAABD] font-bold uppercase mb-1">
                    Compensation / Salary Details
                  </label>
                  <input
                    type="text"
                    value={formData.compensation}
                    onChange={(e) => setFormData({ ...formData, compensation: e.target.value })}
                    placeholder="e.g. ₦120,000 / month or $15/hr"
                    className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>

              {/* URL Management Section */}
              <div className="p-4 bg-[#04142F] rounded-2xl border border-white/10 space-y-3">
                <span className="block text-xs font-bold text-[#FFC928] uppercase flex items-center gap-1.5">
                  <Link className="w-4 h-4" /> Destination & Referral Link Configuration
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[#9BAABD] font-bold uppercase mb-1">
                      Official Opportunity URL * (Validated HTTP/HTTPS)
                    </label>
                    <input
                      type="url"
                      required
                      value={formData.officialUrl || formData.applicationUrl}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          officialUrl: e.target.value,
                          applicationUrl: e.target.value
                        })
                      }
                      placeholder="https://company.com/careers/position"
                      className="w-full bg-[#08224D] border border-white/16 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFC928]"
                    />
                  </div>

                  <div>
                    <label className="block text-cyan-300 font-bold uppercase mb-1 flex items-center justify-between">
                      <span>My Referral / Affiliate URL (Optional)</span>
                      <span className="text-[10px] text-[#9BAABD] normal-case font-normal">
                        Securely stored & prioritize for clicks
                      </span>
                    </label>
                    <input
                      type="url"
                      value={formData.referralUrl}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          referralUrl: e.target.value,
                          monetizationStatus: e.target.value.trim() ? 'referral_link' : 'no_referral'
                        })
                      }
                      placeholder="https://outlier.ai/signup?ref=SHENDAM_CONNECT_2026"
                      className="w-full bg-[#08224D] border border-cyan-500/40 rounded-xl px-3 py-2.5 text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[#9BAABD] font-bold uppercase mb-1">
                      Monetization Status
                    </label>
                    <select
                      value={formData.monetizationStatus}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monetizationStatus: e.target.value as OpportunityMonetizationStatus
                        })
                      }
                      className="w-full bg-[#08224D] border border-white/16 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFC928] cursor-pointer"
                    >
                      <option value="no_referral">No Referral (Standard Listing)</option>
                      <option value="referral_link">Referral Link Active</option>
                      <option value="sponsored">Sponsored Placement</option>
                      <option value="other">Other Partnership</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[#9BAABD] font-bold uppercase mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Comprehensive description of the role or opportunity..."
                  className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-white outline-none focus:border-[#FFC928]"
                />
              </div>

              <div>
                <label className="block text-[#9BAABD] font-bold uppercase mb-1">
                  Requirements (One per line)
                </label>
                <textarea
                  rows={3}
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Minimum qualifications...&#10;Computer literacy...&#10;Reside in Shendam LGA..."
                  className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-white outline-none focus:border-[#FFC928]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#9BAABD] font-bold uppercase mb-1">
                    Deadline (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFC928]"
                  />
                </div>

                <div>
                  <label className="block text-[#9BAABD] font-bold uppercase mb-1">
                    Contact Email / Phone
                  </label>
                  <input
                    type="text"
                    value={formData.contactInfo}
                    onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                    placeholder="e.g. hr@company.org"
                    className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#9BAABD] font-bold uppercase mb-1">
                  Application Instructions
                </label>
                <input
                  type="text"
                  value={formData.applicationInstructions}
                  onChange={(e) => setFormData({ ...formData, applicationInstructions: e.target.value })}
                  placeholder="e.g. Complete online assessment after registration..."
                  className="w-full bg-[#04142F] border border-white/16 rounded-xl px-3 py-2.5 text-white outline-none focus:border-[#FFC928]"
                />
              </div>

              {/* Status Toggles */}
              <div className="p-4 bg-[#04142F] rounded-2xl border border-white/10 space-y-3">
                <span className="block text-xs font-bold text-[#FFC928] uppercase">
                  Administrative Badges & Statuses
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.verificationStatus === 'verified'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          verificationStatus: e.target.checked ? 'verified' : 'unverified'
                        })
                      }
                      className="rounded text-emerald-500 cursor-pointer"
                    />
                    <span>✅ Mark as Verified</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="rounded text-[#FFC928] cursor-pointer"
                    />
                    <span>⭐ Mark as Featured</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.published}
                      onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                      className="rounded text-blue-500 cursor-pointer"
                    />
                    <span>🌐 Publish Immediately</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] font-black rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Listing...' : editingOpp ? 'Update Opportunity' : 'Publish Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
