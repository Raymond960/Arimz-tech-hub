import React, { useState } from 'react';
import { FeedbackItem, FeedbackStatus, FeedbackType } from '../../types';
import {
  MessageSquarePlus,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Mail,
  Smartphone,
  Trash2,
  Save,
  ChevronDown,
  ArrowUpDown,
  Tag
} from 'lucide-react';

interface AdminFeedbackQueueProps {
  feedbackList: FeedbackItem[];
  onUpdateStatus: (id: string, status: FeedbackStatus, adminNotes?: string) => Promise<void>;
  onDeleteFeedback: (id: string) => Promise<void>;
}

export const AdminFeedbackQueue: React.FC<AdminFeedbackQueueProps> = ({
  feedbackList,
  onUpdateStatus,
  onDeleteFeedback
}) => {
  const [filterType, setFilterType] = useState<'all' | FeedbackType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | FeedbackStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filtered items
  const filtered = feedbackList.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCat = item.category?.toLowerCase().includes(q);
      const matchName = item.contactName?.toLowerCase().includes(q);
      const matchId = item.id.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat && !matchName && !matchId) return false;
    }
    return true;
  });

  const pendingCount = feedbackList.filter((f) => f.status === 'pending').length;
  const inReviewCount = feedbackList.filter((f) => f.status === 'in_review').length;
  const resolvedCount = feedbackList.filter((f) => f.status === 'resolved').length;
  const featureRequestsCount = feedbackList.filter((f) => f.type === 'feature_request').length;
  const issueReportsCount = feedbackList.filter((f) => f.type === 'issue_report').length;

  const handleStatusChange = async (id: string, newStatus: FeedbackStatus) => {
    setProcessingId(id);
    try {
      await onUpdateStatus(id, newStatus);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveNotes = async (id: string) => {
    setProcessingId(id);
    try {
      const currentItem = feedbackList.find((f) => f.id === id);
      await onUpdateStatus(id, currentItem?.status || 'pending', noteDraft);
      setEditingNotesId(null);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete the feedback ticket "${title}"?`)) {
      setProcessingId(id);
      try {
        await onDeleteFeedback(id);
      } finally {
        setProcessingId(null);
      }
    }
  };

  const getTypeBadge = (type: FeedbackType) => {
    switch (type) {
      case 'feature_request':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFC928]/20 text-[#FFC928] border border-[#FFC928]/30">
            <Sparkles className="w-3 h-3" />
            <span>Feature Request</span>
          </span>
        );
      case 'issue_report':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3" />
            <span>Issue Report</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <HelpCircle className="w-3 h-3" />
            <span>General Feedback</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Pending
          </span>
        );
      case 'in_review':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            In Review
          </span>
        );
      case 'resolved':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Resolved
          </span>
        );
      case 'dismissed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
            Dismissed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#08254D] border border-white/12 rounded-3xl p-5 text-white">
        <div>
          <h2 className="text-lg font-black text-white font-brand-sans flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-[#FFC928]" />
            <span>Citizen & Visitor Feedback Queue ({feedbackList.length})</span>
          </h2>
          <p className="text-xs text-[#9BAABD]">
            Review feature suggestions, issue reports, and community recommendations for Shendam Connect.
          </p>
        </div>

        {/* Quick Metric Pills */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-[#061B3A] border border-white/10 text-xs flex items-center gap-1.5">
            <span className="text-[#9BAABD]">Pending:</span>
            <span className="font-bold text-amber-300">{pendingCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#061B3A] border border-white/10 text-xs flex items-center gap-1.5">
            <span className="text-[#9BAABD]">Features:</span>
            <span className="font-bold text-[#FFC928]">{featureRequestsCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#061B3A] border border-white/10 text-xs flex items-center gap-1.5">
            <span className="text-[#9BAABD]">Issues:</span>
            <span className="font-bold text-rose-300">{issueReportsCount}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#08254D] border border-white/12 rounded-3xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAABD]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, category, user or reference ID..."
              className="w-full pl-9 pr-4 py-2 bg-[#061B3A] border border-white/14 rounded-2xl text-xs text-white placeholder:text-[#9BAABD]/60 focus:outline-none focus:border-[#FFC928]"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#FFC928] text-[#061B3A] font-bold'
                  : 'bg-[#061B3A] text-[#9BAABD] hover:text-white border border-white/10'
              }`}
            >
              All Types ({feedbackList.length})
            </button>
            <button
              onClick={() => setFilterType('feature_request')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
                filterType === 'feature_request'
                  ? 'bg-[#FFC928] text-[#061B3A] font-bold'
                  : 'bg-[#061B3A] text-[#9BAABD] hover:text-white border border-white/10'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Features ({featureRequestsCount})</span>
            </button>
            <button
              onClick={() => setFilterType('issue_report')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer flex items-center gap-1.5 ${
                filterType === 'issue_report'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'bg-[#061B3A] text-[#9BAABD] hover:text-white border border-white/10'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Issues ({issueReportsCount})</span>
            </button>
          </div>
        </div>

        {/* Secondary Status Filter */}
        <div className="flex items-center gap-2 text-xs pt-1 border-t border-white/10">
          <span className="text-[#9BAABD] text-[11px] font-semibold">Status:</span>
          {(['all', 'pending', 'in_review', 'resolved', 'dismissed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition cursor-pointer ${
                filterStatus === st
                  ? 'bg-white/20 text-white font-bold'
                  : 'text-[#9BAABD] hover:text-white'
              }`}
            >
              {st === 'all' ? 'All Statuses' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket Cards Grid */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="py-16 text-center bg-[#08254D] border border-white/12 rounded-3xl text-[#9BAABD] text-xs">
            No feedback or feature tickets match the selected filters.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-[#08254D] border border-white/12 rounded-3xl p-5 sm:p-6 text-white space-y-4 shadow-lg hover:border-white/20 transition"
            >
              {/* Card Top Row */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {getTypeBadge(item.type)}
                    {getStatusBadge(item.status)}
                    <span className="text-[11px] text-[#9BAABD] flex items-center gap-1">
                      <Tag className="w-3 h-3 text-[#FFC928]" />
                      <span>{item.category}</span>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {item.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-[#9BAABD] bg-[#061B3A] px-2.5 py-1 rounded-lg border border-white/10">
                    {item.id}
                  </span>
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    disabled={processingId === item.id}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                    title="Delete ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Description Body */}
              <div className="bg-[#061B3A] rounded-2xl p-4 text-xs text-[#D5DCE8] leading-relaxed border border-white/8">
                {item.description}
              </div>

              {/* Submitter Details & Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#9BAABD] pt-1">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[#FFC928] shrink-0" />
                  <span>
                    Submitter: <strong className="text-white">{item.contactName || 'Anonymous Visitor'}</strong>
                  </span>
                  {(item.contactPhone || item.contactEmail) && (
                    <span className="text-[#FFC928]">
                      ({item.contactPhone || item.contactEmail})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:justify-end">
                  <Clock className="w-3.5 h-3.5 text-[#FFC928] shrink-0" />
                  <span>{new Date(item.submittedAt).toLocaleString()}</span>
                  {item.deviceInfo && (
                    <span className="text-[#9BAABD]/70">({item.deviceInfo})</span>
                  )}
                </div>
              </div>

              {/* Admin Note Section & Status Actions */}
              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Status Dropdown / Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-[#9BAABD]">Update Status:</span>
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value as FeedbackStatus)}
                    disabled={processingId === item.id}
                    className="bg-[#061B3A] border border-white/16 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#FFC928] cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_review">In Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>

                  {editingNotesId !== item.id && (
                    <button
                      onClick={() => {
                        setEditingNotesId(item.id);
                        setNoteDraft(item.adminNotes || '');
                      }}
                      className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/16 text-[11px] text-[#D5DCE8] transition cursor-pointer"
                    >
                      {item.adminNotes ? 'Edit Admin Notes' : '+ Add Note'}
                    </button>
                  )}
                </div>

                {item.adminNotes && editingNotesId !== item.id && (
                  <div className="text-[11px] text-amber-200 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
                    <strong>Admin Note:</strong> {item.adminNotes}
                  </div>
                )}
              </div>

              {/* Note Editing Form */}
              {editingNotesId === item.id && (
                <div className="bg-[#061B3A] p-3 rounded-2xl border border-[#FFC928]/30 space-y-2 animate-in fade-in">
                  <label className="text-[11px] font-bold text-[#FFC928]">Internal Admin Notes / Action Plan:</label>
                  <input
                    type="text"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="e.g. Assigned to ICT team for next release; Contacted hotel manager..."
                    className="w-full bg-[#08254D] border border-white/14 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FFC928]"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingNotesId(null)}
                      className="px-2.5 py-1 rounded-lg text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveNotes(item.id)}
                      disabled={processingId === item.id}
                      className="px-3 py-1 rounded-lg bg-[#FFC928] text-[#061B3A] font-bold text-[11px] shadow transition cursor-pointer"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminFeedbackQueue;
