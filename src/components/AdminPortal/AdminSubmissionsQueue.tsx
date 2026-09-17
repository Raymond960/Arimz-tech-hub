import React, { useState } from 'react';
import { PendingBusinessSubmission } from '../../types';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  MessageCircle,
  Eye,
  Check,
  X,
  User,
  Clock,
  Building2,
  Package,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Mail,
  AlertTriangle,
  Edit3,
  PauseCircle,
  ChevronRight,
  ExternalLink,
  Layers,
  Search,
  Sparkles,
  FileText
} from 'lucide-react';

interface AdminSubmissionsQueueProps {
  submissions: PendingBusinessSubmission[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
  onSuspend?: (id: string, reason?: string) => Promise<void>;
  onEdit?: (id: string, updates: Partial<PendingBusinessSubmission>) => Promise<void>;
}

export const AdminSubmissionsQueue: React.FC<AdminSubmissionsQueueProps> = ({
  submissions,
  onApprove,
  onReject,
  onSuspend,
  onEdit
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Detail Modal State
  const [selectedSub, setSelectedSub] = useState<PendingBusinessSubmission | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  // Reject Modal State
  const [rejectingSub, setRejectingSub] = useState<PendingBusinessSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState('Incomplete business address or unverified phone number');

  // Edit Modal State
  const [editingSub, setEditingSub] = useState<PendingBusinessSubmission | null>(null);
  const [editForm, setEditForm] = useState<{
    businessName: string;
    category: string;
    address: string;
    area: string;
    phone: string;
    whatsapp: string;
    description: string;
    priceRange: string;
  }>({
    businessName: '',
    category: 'businesses',
    address: '',
    area: '',
    phone: '',
    whatsapp: '',
    description: '',
    priceRange: '₦₦'
  });

  const filteredList = submissions.filter((s) => {
    if (activeTab === 'pending' && s.status !== 'pending') return false;
    if (activeTab === 'approved' && s.status !== 'approved') return false;
    if (activeTab === 'rejected' && s.status !== 'rejected') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.businessName.toLowerCase().includes(q);
      const matchPhone = (s.phone || '').toLowerCase().includes(q);
      const matchContact = (s.contactName || '').toLowerCase().includes(q);
      const matchArea = (s.area || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchContact || matchArea;
    }
    return true;
  });

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await onApprove(id);
      if (selectedSub?.id === id) {
        setSelectedSub(null);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingSub) return;
    setProcessingId(rejectingSub.id);
    try {
      await onReject(rejectingSub.id, rejectReason);
      setRejectingSub(null);
      if (selectedSub?.id === rejectingSub.id) {
        setSelectedSub(null);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleSuspend = async (id: string) => {
    if (!onSuspend) return;
    setProcessingId(id);
    try {
      await onSuspend(id, 'Temporarily suspended by administration');
      if (selectedSub?.id === id) {
        setSelectedSub(null);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenEdit = (sub: PendingBusinessSubmission) => {
    setEditingSub(sub);
    setEditForm({
      businessName: sub.businessName,
      category: sub.category,
      address: sub.address,
      area: sub.area || 'Shendam Main Town',
      phone: sub.phone,
      whatsapp: sub.whatsapp || '',
      description: sub.fullDescription || sub.description || sub.shortDescription || '',
      priceRange: sub.priceRange || '₦₦'
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSub || !onEdit) return;
    setProcessingId(editingSub.id);
    try {
      await onEdit(editingSub.id, {
        businessName: editForm.businessName,
        category: editForm.category as any,
        address: editForm.address,
        area: editForm.area,
        phone: editForm.phone,
        whatsapp: editForm.whatsapp || undefined,
        description: editForm.description,
        priceRange: editForm.priceRange as any
      });
      setEditingSub(null);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#08254D] border border-white/12 rounded-3xl p-5 text-white">
        <div>
          <h2 className="text-lg font-black text-white font-brand-sans flex items-center gap-2">
            <Inbox className="w-5 h-5 text-[#FFC928]" />
            <span>Merchant Submissions & Verification Desk</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#04142F] text-[#FFC928] border border-white/10 font-bold">
              {pendingCount} Pending Review
            </span>
          </h2>
          <p className="text-xs text-[#9BAABD] mt-1">
            Authenticate real photos, verify contact identity, detect duplicates, and approve merchant listings for live Shendam Connect publication.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center bg-[#04142F] p-1 rounded-2xl border border-white/12 text-xs shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'pending'
                ? 'bg-[#FFC928] text-[#04142F]'
                : 'text-[#9BAABD] hover:text-white'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'approved'
                ? 'bg-[#FFC928] text-[#04142F]'
                : 'text-[#9BAABD] hover:text-white'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'rejected'
                ? 'bg-[#FFC928] text-[#04142F]'
                : 'text-[#9BAABD] hover:text-white'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'all'
                ? 'bg-[#FFC928] text-[#04142F]'
                : 'text-[#9BAABD] hover:text-white'
            }`}
          >
            All ({submissions.length})
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#9BAABD] absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter submissions by business name, phone, owner name, or area..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#08254D] border border-white/14 rounded-2xl py-3 pl-11 pr-4 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-[#FFC928]"
        />
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredList.length === 0 ? (
          <div className="py-16 text-center bg-[#08254D] border border-white/12 rounded-3xl text-[#9BAABD] text-xs space-y-2">
            <Inbox className="w-8 h-8 mx-auto text-white/30" />
            <p>No business submissions found in this category.</p>
          </div>
        ) : (
          filteredList.map((sub) => {
            const photosList = Array.isArray(sub.submittedPhotos) && sub.submittedPhotos.length > 0
              ? sub.submittedPhotos
              : sub.imageUrl
              ? [sub.imageUrl]
              : [];

            return (
              <div
                key={sub.id}
                className={`bg-[#08254D] border rounded-3xl p-5 text-white transition-all space-y-4 ${
                  sub.potentialDuplicateOf
                    ? 'border-amber-400/50 bg-[#0B254D]'
                    : 'border-white/12 hover:border-white/20'
                }`}
              >
                {/* Duplicate Alert Banner */}
                {sub.potentialDuplicateOf && (
                  <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-start gap-2.5 text-xs text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-amber-300">
                        Duplicate Protection Warning:
                      </p>
                      <p>
                        {sub.potentialDuplicateOf.matchReason} (ID: {sub.potentialDuplicateOf.id})
                      </p>
                    </div>
                  </div>
                )}

                {/* Main Card Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Primary Photo Thumbnail */}
                    <div
                      onClick={() => photosList[0] && setLightboxPhoto(photosList[0])}
                      className="w-20 h-20 rounded-2xl overflow-hidden border border-white/16 shrink-0 bg-[#04142F] relative cursor-pointer group"
                    >
                      {photosList.length > 0 ? (
                        <>
                          <img
                            src={photosList[0]}
                            alt={sub.businessName}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white">
                            {photosList.length} photo{photosList.length > 1 ? 's' : ''}
                          </span>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
                          No photo
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-base text-white font-brand-sans">
                          {sub.businessName}
                        </h3>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#FFC928] text-[#061B3A]">
                          {sub.categoryLabel}
                        </span>
                        {sub.subcategory && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-[#D5DCE8]">
                            {sub.subcategory}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#9BAABD] flex-wrap">
                        <span className="flex items-center gap-1 text-white">
                          <User className="w-3.5 h-3.5 text-[#FFC928]" />
                          <span>{sub.contactName}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#FFC928]" />
                          <span>{sub.phone}</span>
                        </span>
                        {sub.whatsapp && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WA: {sub.whatsapp}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#FFC928]" />
                          <span>{sub.address}, {sub.area}</span>
                        </span>
                      </div>

                      <p className="text-xs text-[#D5DCE8] leading-relaxed pt-1 line-clamp-2">
                        {sub.fullDescription || sub.description || sub.shortDescription}
                      </p>
                    </div>
                  </div>

                  {/* Right Status Badge */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${
                        sub.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : sub.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : sub.status === 'suspended'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {sub.status === 'pending' ? 'Pending Approval' : sub.status}
                    </span>
                    <span className="text-[10px] text-[#9BAABD] font-mono">
                      Ref: {sub.id}
                    </span>
                  </div>
                </div>

                {/* Submitted Photos Gallery Previews */}
                {photosList.length > 0 && (
                  <div className="bg-[#04142F] p-3 rounded-2xl border border-white/8 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-[#9BAABD]">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#FFC928]" />
                        <span>Submitted Real Photographs ({photosList.length})</span>
                      </span>
                      <span className="text-[10px]">Click any photo to enlarge</span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {photosList.map((photoUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => setLightboxPhoto(photoUrl)}
                          className="w-16 h-16 rounded-xl overflow-hidden border border-white/14 shrink-0 bg-black/40 relative cursor-pointer group hover:border-[#FFC928] transition"
                        >
                          <img
                            src={photoUrl}
                            alt={`Photo ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition"
                          />
                          {idx === 0 && (
                            <span className="absolute top-0.5 left-0.5 px-1 bg-[#FFC928] text-[#061B3A] text-[8px] font-black rounded">
                              Cover
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection Reason Notice (If Rejected) */}
                {sub.status === 'rejected' && sub.rejectionReason && (
                  <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-200">
                    <strong>Decline Reason:</strong> {sub.rejectionReason}
                  </div>
                )}

                {/* Action Bar */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSub(sub)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(sub)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Info</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {sub.status === 'pending' && (
                      <>
                        <button
                          disabled={processingId === sub.id}
                          onClick={() => handleApprove(sub.id)}
                          className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/40 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Approve & Publish</span>
                        </button>

                        <button
                          disabled={processingId === sub.id}
                          onClick={() => setRejectingSub(sub)}
                          className="px-4 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/30 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Decline</span>
                        </button>
                      </>
                    )}

                    {sub.status === 'approved' && onSuspend && (
                      <button
                        disabled={processingId === sub.id}
                        onClick={() => handleSuspend(sub.id)}
                        className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold text-xs rounded-xl border border-purple-500/40 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <PauseCircle className="w-3.5 h-3.5" />
                        <span>Suspend Listing</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ===================================================================== */}
      {/* 1. INSPECT SUBMISSION DETAILS MODAL */}
      {/* ===================================================================== */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#08254D] border border-white/16 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-white relative flex flex-col no-scrollbar">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#08254D]/95 backdrop-blur-md z-20">
              <div>
                <h3 className="font-bold text-base text-white font-brand-sans">
                  {selectedSub.businessName}
                </h3>
                <span className="text-xs text-[#FFC928] font-bold uppercase">
                  {selectedSub.categoryLabel}
                </span>
              </div>

              <button
                onClick={() => setSelectedSub(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Photos Gallery Full View */}
              {selectedSub.submittedPhotos && selectedSub.submittedPhotos.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs text-[#9BAABD] uppercase tracking-wider mb-2">
                    Submitted Photographs ({selectedSub.submittedPhotos.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {selectedSub.submittedPhotos.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setLightboxPhoto(img)}
                        className="rounded-xl overflow-hidden border border-white/14 aspect-video bg-[#04142F] cursor-pointer hover:opacity-90 transition"
                      >
                        <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="bg-[#04142F] p-4 rounded-2xl border border-white/10 space-y-1">
                <span className="font-bold text-[#FFC928] text-[11px] uppercase">
                  Full Business Description
                </span>
                <p className="text-white leading-relaxed">
                  {selectedSub.fullDescription || selectedSub.description || selectedSub.shortDescription}
                </p>
              </div>

              {/* Contact & Location Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#04142F] p-3.5 rounded-2xl border border-white/10 space-y-1.5">
                  <span className="font-bold text-[#FFC928] text-[11px] uppercase">
                    Contact & Proprietor
                  </span>
                  <p><strong>Name:</strong> {selectedSub.contactName}</p>
                  <p><strong>Phone:</strong> {selectedSub.phone}</p>
                  {selectedSub.whatsapp && <p><strong>WhatsApp:</strong> {selectedSub.whatsapp}</p>}
                  {selectedSub.email && <p><strong>Email:</strong> {selectedSub.email}</p>}
                  {selectedSub.website && <p><strong>Website:</strong> {selectedSub.website}</p>}
                </div>

                <div className="bg-[#04142F] p-3.5 rounded-2xl border border-white/10 space-y-1.5">
                  <span className="font-bold text-[#FFC928] text-[11px] uppercase">
                    Location & Landmark
                  </span>
                  <p><strong>Address:</strong> {selectedSub.address}</p>
                  <p><strong>Area:</strong> {selectedSub.area}</p>
                  {selectedSub.landmark && <p><strong>Landmark:</strong> {selectedSub.landmark}</p>}
                  <p><strong>LGA:</strong> {selectedSub.lga || 'Shendam LGA'}</p>
                </div>
              </div>

              {/* Products & Services */}
              {selectedSub.productsServices && selectedSub.productsServices.length > 0 && (
                <div className="bg-[#04142F] p-3.5 rounded-2xl border border-white/10 space-y-2">
                  <span className="font-bold text-[#FFC928] text-[11px] uppercase">
                    Key Products & Services Catalog ({selectedSub.productsServices.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedSub.productsServices.map((ps, i) => (
                      <div key={i} className="p-2 bg-white/4 rounded-xl border border-white/6">
                        <div className="flex justify-between font-bold text-white">
                          <span>{ps.name}</span>
                          {ps.price && <span className="text-[#FFC928]">{ps.price}</span>}
                        </div>
                        {ps.description && (
                          <p className="text-[#9BAABD] text-[11px] mt-0.5">{ps.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CAC & Verification info */}
              {selectedSub.verificationInfo && (
                <div className="bg-[#04142F] p-3.5 rounded-2xl border border-white/10 space-y-1">
                  <span className="font-bold text-[#FFC928] text-[11px] uppercase">
                    CAC / Verification Proof
                  </span>
                  {selectedSub.verificationInfo.registrationNumber && (
                    <p><strong>Registration Number:</strong> {selectedSub.verificationInfo.registrationNumber}</p>
                  )}
                  {selectedSub.verificationInfo.documentNotes && (
                    <p><strong>Verification Notes:</strong> {selectedSub.verificationInfo.documentNotes}</p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-white/10 flex justify-end gap-2 bg-[#04142F]">
              {selectedSub.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleApprove(selectedSub.id)}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                  >
                    Approve & Publish Listing
                  </button>
                  <button
                    onClick={() => {
                      setRejectingSub(selectedSub);
                      setSelectedSub(null);
                    }}
                    className="px-5 py-2 bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Decline Listing
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. LIGHTBOX PHOTO VIEWER */}
      {/* ===================================================================== */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer animate-in fade-in duration-150"
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl border border-white/20 shadow-2xl">
            <img
              src={lightboxPhoto}
              alt="Enlarged business photograph"
              className="w-full h-full object-contain max-h-[80vh]"
            />
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. REJECT REASON MODAL */}
      {/* ===================================================================== */}
      {rejectingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#08254D] border border-rose-500/40 rounded-3xl w-full max-w-md p-5 text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-300">
              <XCircle className="w-5 h-5" />
              <h3 className="font-bold text-base">
                Decline Business Submission
              </h3>
            </div>

            <p className="text-xs text-[#9BAABD]">
              Provide a clear reason for declining <strong className="text-white">&quot;{rejectingSub.businessName}&quot;</strong>. This reason will be logged for administrative compliance.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#9BAABD] uppercase">
                Rejection Reason
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-[#04142F] border border-white/16 rounded-xl p-3 text-xs text-white placeholder-[#9BAABD] outline-none focus:border-rose-400 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingSub(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={processingId === rejectingSub.id}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. EDIT SUBMISSION MODAL */}
      {/* ===================================================================== */}
      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#08254D] border border-white/16 rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 text-white space-y-4 shadow-2xl no-scrollbar">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="font-bold text-base text-white">
                Edit Submitted Business Details
              </h3>
              <button
                onClick={() => setEditingSub(null)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#9BAABD] uppercase mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  value={editForm.businessName}
                  onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                  className="w-full bg-[#04142F] border border-white/14 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#9BAABD] uppercase mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-[#04142F] border border-white/14 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#9BAABD] uppercase mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editForm.whatsapp}
                    onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                    className="w-full bg-[#04142F] border border-white/14 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#9BAABD] uppercase mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full bg-[#04142F] border border-white/14 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#FFC928]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#9BAABD] uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-[#04142F] border border-white/14 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#FFC928] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setEditingSub(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={processingId === editingSub.id}
                className="px-5 py-2 bg-[#FFC928] hover:bg-[#F5B800] text-[#061B3A] font-black text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
              >
                Save Updates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubmissionsQueue;
