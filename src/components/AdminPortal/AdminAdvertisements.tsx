import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  MousePointerClick,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sparkles,
  Calendar,
  Upload,
  Layers,
  BarChart3,
  Globe,
  DollarSign,
  CreditCard,
  Settings,
  RefreshCw,
  Check,
  X,
  ShieldCheck,
  AlertCircle,
  Clock,
  MessageCircle,
  Phone,
  Store,
  ArrowUpRight
} from 'lucide-react';
import {
  Advertisement,
  AdvertisementPackage,
  AdvertisementPayment,
  AdvertisementSettings,
  AdvertisementApprovalStatus
} from '../../types';
import { compressAndValidateImage } from '../../utils/imageCompressor';
import {
  fetchAdminAds,
  fetchAdminAnalytics,
  createAdminAd,
  updateAdminAd,
  toggleAdminAdStatus,
  setAdminAdApproval,
  deleteAdminAd,
  fetchAdminPackages,
  createAdminPackage,
  updateAdminPackage,
  deleteAdminPackage,
  fetchAdminPayments,
  reconcileAdminPayment,
  fetchAdminSettings,
  updateAdminSettings,
  AdAnalyticsReport
} from '../../services/adService';
import { getRuntimePlatform } from '../../services/googleAdsService';

interface AdminAdvertisementsProps {
  authToken: string;
  onSessionExpired?: () => void;
}

type TabType = 'campaigns' | 'analytics' | 'packages' | 'payments' | 'settings';

export const AdminAdvertisements: React.FC<AdminAdvertisementsProps> = ({
  authToken,
  onSessionExpired
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('campaigns');
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [packages, setPackages] = useState<AdvertisementPackage[]>([]);
  const [payments, setPayments] = useState<AdvertisementPayment[]>([]);
  const [settings, setSettings] = useState<AdvertisementSettings | null>(null);
  const [analytics, setAnalytics] = useState<AdAnalyticsReport | null>(null);
  const [analyticsRange, setAnalyticsRange] = useState<string>('30d');

  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [placementFilter, setPlacementFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Ad Modal State
  const [isAdModalOpen, setIsAdModalOpen] = useState<boolean>(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for Ad
  const [formTitle, setFormTitle] = useState('');
  const [formBusinessName, setFormBusinessName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formBannerImageUrl, setFormBannerImageUrl] = useState('');
  const [formDestinationType, setFormDestinationType] = useState<Advertisement['destinationType']>('url');
  const [formDestinationUrl, setFormDestinationUrl] = useState('');
  const [formDestinationPhone, setFormDestinationPhone] = useState('');
  const [formDestinationWhatsApp, setFormDestinationWhatsApp] = useState('');
  const [formDestinationListingId, setFormDestinationListingId] = useState('');
  const [formPlacement, setFormPlacement] = useState<Advertisement['placement']>('homepage_banner');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formPackageId, setFormPackageId] = useState<string>('');
  const [formPriority, setFormPriority] = useState<number>(5);
  const [formPaymentStatus, setFormPaymentStatus] = useState<Advertisement['paymentStatus']>('paid');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Package Modal State
  const [isPackageModalOpen, setIsPackageModalOpen] = useState<boolean>(false);
  const [editingPackage, setEditingPackage] = useState<AdvertisementPackage | null>(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgPrice, setPkgPrice] = useState(0);
  const [pkgDuration, setPkgDuration] = useState(30);
  const [pkgPlacements, setPkgPlacements] = useState<string[]>(['homepage_banner', 'directory_top']);
  const [pkgFeatures, setPkgFeatures] = useState<string>('');
  const [pkgActive, setPkgActive] = useState(true);

  // Reconcile Modal
  const [reconcilingPayment, setReconcilingPayment] = useState<AdvertisementPayment | null>(null);
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [isReconciling, setIsReconciling] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedAds, fetchedPkgs, fetchedPmts, fetchedSettings] = await Promise.all([
        fetchAdminAds(authToken).catch((err) => {
          if (err.message.includes('401') && onSessionExpired) onSessionExpired();
          return [];
        }),
        fetchAdminPackages(authToken).catch(() => []),
        fetchAdminPayments(authToken).catch(() => []),
        fetchAdminSettings(authToken).catch(() => null)
      ]);

      setAds(fetchedAds);
      setPackages(fetchedPkgs);
      setPayments(fetchedPmts);
      setSettings(fetchedSettings);

      // Load analytics
      const fetchedAnalytics = await fetchAdminAnalytics(authToken, analyticsRange).catch(() => null);
      setAnalytics(fetchedAnalytics);
    } catch {
      showToast('Failed to load advertisement data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [authToken, analyticsRange]);

  // Open Create Ad
  const handleOpenCreateAd = () => {
    setEditingAd(null);
    setFormTitle('');
    setFormBusinessName('');
    setFormDescription('Special promotion for Shendam residents and visitors.');
    setFormImageUrl('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80');
    setFormBannerImageUrl('');
    setFormDestinationType('url');
    setFormDestinationUrl('https://shendamconnect.gov.ng');
    setFormDestinationPhone('');
    setFormDestinationWhatsApp('');
    setFormDestinationListingId('');
    setFormPlacement('homepage_banner');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setFormStatus('active');
    setFormPriority(5);
    setFormPackageId(packages.length > 0 ? packages[0].id : '');
    setFormPaymentStatus('paid');
    setIsAdModalOpen(true);
  };

  // Open Edit Ad
  const handleOpenEditAd = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormTitle(ad.title);
    setFormBusinessName(ad.businessName);
    setFormDescription(ad.description || '');
    setFormImageUrl(ad.imageUrl);
    setFormBannerImageUrl(ad.bannerImageUrl || '');
    setFormDestinationType(ad.destinationType || 'url');
    setFormDestinationUrl(ad.destinationUrl || ad.linkUrl || '');
    setFormDestinationPhone(ad.destinationPhone || '');
    setFormDestinationWhatsApp(ad.destinationWhatsApp || '');
    setFormDestinationListingId(ad.destinationListingId || ad.linkedPlaceId || '');
    setFormPlacement(ad.placement);
    setFormStartDate(ad.startDate || '');
    setFormEndDate(ad.endDate || '');
    setFormStatus(ad.status);
    setFormPriority(ad.priority || 5);
    setFormPackageId(ad.packageId || '');
    setFormPaymentStatus(ad.paymentStatus || 'paid');
    setIsAdModalOpen(true);
  };

  // Upload image helper
  const handleUploadImageFile = async (file: File, isBanner: boolean = false) => {
    if (file.size > 15 * 1024 * 1024) {
      showToast('Image file too large (Max 15MB).');
      return;
    }

    if (isBanner) setUploadingBanner(true);
    else setUploadingImage(true);

    try {
      let fileData: string;
      try {
        const compressed = await compressAndValidateImage(file, isBanner ? 1600 : 1200);
        fileData = compressed.dataUrl;
      } catch {
        fileData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          fileData,
          filename: `ad_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        })
      });

      if (res.status === 401 && onSessionExpired) {
        onSessionExpired();
        return;
      }

      const data = await res.json();
      if (res.ok && data.url) {
        if (isBanner) {
          setFormBannerImageUrl(data.url);
          showToast('Banner graphic uploaded!');
        } else {
          setFormImageUrl(data.url);
          showToast('Advertisement graphic uploaded!');
        }
      } else {
        showToast(data.error || 'Failed to upload image.');
      }
    } catch {
      showToast('Network error uploading image.');
    } finally {
      if (isBanner) setUploadingBanner(false);
      else setUploadingImage(false);
    }
  };

  // Save Ad
  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBusinessName.trim() || !formImageUrl.trim()) {
      showToast('Please provide Campaign Title, Business Name, and Graphic Image.');
      return;
    }

    setIsSubmitting(true);
    const link =
      formDestinationType === 'whatsapp'
        ? `https://wa.me/${(formDestinationWhatsApp || '').replace(/[^0-9]/g, '')}`
        : formDestinationType === 'phone'
        ? `tel:${formDestinationPhone}`
        : formDestinationUrl || 'https://shendamconnect.gov.ng';

    const payload: Partial<Advertisement> = {
      title: formTitle.trim(),
      businessName: formBusinessName.trim(),
      description: formDescription.trim(),
      imageUrl: formImageUrl.trim(),
      bannerImageUrl: formBannerImageUrl.trim() || undefined,
      linkUrl: link,
      destinationType: formDestinationType,
      destinationUrl: formDestinationUrl.trim() || undefined,
      destinationPhone: formDestinationPhone.trim() || undefined,
      destinationWhatsApp: formDestinationWhatsApp.trim() || undefined,
      destinationListingId: formDestinationListingId.trim() || undefined,
      placement: formPlacement,
      startDate: formStartDate || undefined,
      endDate: formEndDate || undefined,
      status: formStatus,
      priority: formPriority,
      packageId: formPackageId || undefined,
      paymentStatus: formPaymentStatus
    };

    try {
      if (editingAd) {
        await updateAdminAd(authToken, editingAd.id, payload);
        showToast('Campaign updated successfully!');
      } else {
        await createAdminAd(authToken, payload);
        showToast('Advertisement campaign launched!');
      }
      setIsAdModalOpen(false);
      const updated = await fetchAdminAds(authToken);
      setAds(updated);
    } catch (err: any) {
      showToast(err.message || 'Failed to save advertisement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (ad: Advertisement) => {
    const nextStatus = ad.status === 'active' ? 'inactive' : 'active';
    try {
      await toggleAdminAdStatus(authToken, ad.id, nextStatus);
      showToast(`Campaign ${nextStatus === 'active' ? 'activated' : 'paused'}.`);
      setAds((prev) =>
        prev.map((item) => (item.id === ad.id ? { ...item, status: nextStatus } : item))
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle campaign status.');
    }
  };

  // Approval status
  const handleSetApproval = async (ad: Advertisement, approval: AdvertisementApprovalStatus) => {
    try {
      await setAdminAdApproval(authToken, ad.id, approval);
      showToast(`Ad campaign ${approval.replace('_', ' ')}.`);
      const updated = await fetchAdminAds(authToken);
      setAds(updated);
    } catch (err: any) {
      showToast(err.message || 'Failed to update approval.');
    }
  };

  // Delete Ad
  const handleDeleteAd = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this advertisement campaign? This will also clean up associated graphic files if unreferenced.')) {
      return;
    }

    setIsDeleting(id);
    try {
      await deleteAdminAd(authToken, id);
      showToast('Advertisement permanently removed.');
      setAds((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      showToast(err.message || 'Failed to delete advertisement.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Open Package Modal
  const handleOpenCreatePackage = () => {
    setEditingPackage(null);
    setPkgName('');
    setPkgPrice(25000);
    setPkgDuration(30);
    setPkgPlacements(['homepage_banner', 'directory_top']);
    setPkgFeatures('Priority Placement\n30-Day Campaign Duration\nReal-Time Click Telemetry');
    setPkgActive(true);
    setIsPackageModalOpen(true);
  };

  const handleOpenEditPackage = (pkg: AdvertisementPackage) => {
    setEditingPackage(pkg);
    setPkgName(pkg.name);
    setPkgPrice(pkg.price);
    setPkgDuration(pkg.durationDays);
    setPkgPlacements(pkg.placements || (pkg as any).allowedPlacements || ['homepage_banner', 'directory_top']);
    setPkgFeatures(pkg.features.join('\n'));
    setPkgActive(pkg.active);
    setIsPackageModalOpen(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim()) {
      showToast('Package name is required');
      return;
    }

    const payload: Partial<AdvertisementPackage> = {
      name: pkgName.trim(),
      description: `${pkgName.trim()} advertising package for Shendam merchants`,
      price: Number(pkgPrice),
      durationDays: Number(pkgDuration),
      placements: pkgPlacements as any,
      features: pkgFeatures.split('\n').map((s) => s.trim()).filter(Boolean),
      active: pkgActive
    };

    try {
      if (editingPackage) {
        await updateAdminPackage(authToken, editingPackage.id, payload);
        showToast('Package updated!');
      } else {
        await createAdminPackage(authToken, payload);
        showToast('New package created!');
      }
      setIsPackageModalOpen(false);
      const updatedPkgs = await fetchAdminPackages(authToken);
      setPackages(updatedPkgs);
    } catch (err: any) {
      showToast(err.message || 'Failed to save package');
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this pricing package?')) return;
    try {
      await deleteAdminPackage(authToken, id);
      showToast('Package removed');
      setPackages((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      showToast(err.message || 'Failed to delete package');
    }
  };

  // Payment Reconciliation
  const handleConfirmReconcile = async () => {
    if (!reconcilingPayment) return;
    setIsReconciling(true);
    try {
      await reconcileAdminPayment(authToken, reconcilingPayment.id, reconcileNotes);
      showToast('Payment manually reconciled! Associated campaign has been activated.');
      setReconcilingPayment(null);
      setReconcileNotes('');
      const updatedPmts = await fetchAdminPayments(authToken);
      setPayments(updatedPmts);
      const updatedAds = await fetchAdminAds(authToken);
      setAds(updatedAds);
    } catch (err: any) {
      showToast(err.message || 'Failed to reconcile payment');
    } finally {
      setIsReconciling(false);
    }
  };

  // Settings Save
  const handleSaveSettings = async (updates: Partial<AdvertisementSettings>) => {
    try {
      const updated = await updateAdminSettings(authToken, updates);
      setSettings(updated);
      showToast('Monetization settings saved successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings');
    }
  };

  // Filter Ads
  const filteredAds = ads.filter((ad) => {
    const matchesSearch =
      ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ad.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlacement = placementFilter === 'all' || ad.placement === placementFilter;

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = ad.status === 'active';
    else if (statusFilter === 'paused') matchesStatus = ad.status === 'inactive';
    else if (statusFilter === 'pending_approval') matchesStatus = ad.approvalStatus === 'pending_approval';
    else if (statusFilter === 'approved') matchesStatus = ad.approvalStatus === 'approved';
    else if (statusFilter === 'rejected') matchesStatus = ad.approvalStatus === 'rejected';

    return matchesSearch && matchesPlacement && matchesStatus;
  });

  const totalImpressions = ads.reduce((acc, a) => acc + (a.viewsCount || 0), 0);
  const totalClicks = ads.reduce((acc, a) => acc + (a.clicksCount || 0), 0);
  const activeCount = ads.filter((a) => a.status === 'active').length;
  const runtimePlatform = getRuntimePlatform();

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0B2D5C] border border-[#FFC928] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold animate-in fade-in">
          <Sparkles className="w-4 h-4 text-[#FFC928]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B2D5C] p-5 rounded-2xl border border-white/10 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-[#FFC928]" />
            <h2 className="text-xl font-bold text-white font-brand-sans">
              Monetization & Advertising Control
            </h2>
          </div>
          <p className="text-xs text-[#D5DCE8] mt-1">
            Manage local sponsored business listings, packages, Paystack automated checkout, and Google Adsense integration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenCreateAd}
            className="bg-[#FFC928] hover:bg-[#F5B800] text-[#04142F] font-black text-sm px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Launch Campaign</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 overflow-x-auto pb-1 text-sm font-bold">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'campaigns'
              ? 'bg-[#0B2D5C] text-[#FFC928] border-t-2 border-[#FFC928]'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Campaigns ({ads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-[#0B2D5C] text-[#FFC928] border-t-2 border-[#FFC928]'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics & Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('packages')}
          className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'packages'
              ? 'bg-[#0B2D5C] text-[#FFC928] border-t-2 border-[#FFC928]'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Ad Packages ({packages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'payments'
              ? 'bg-[#0B2D5C] text-[#FFC928] border-t-2 border-[#FFC928]'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payments ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-[#0B2D5C] text-[#FFC928] border-t-2 border-[#FFC928]'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Monetization Settings</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: CAMPAIGNS */}
      {/* =================================================================== */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-[#08254D] border border-white/10 p-4 rounded-xl flex items-center gap-3">
              <div className="p-3 rounded-xl bg-[#FFC928]/10 text-[#FFC928]">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">{activeCount} / {ads.length}</div>
                <div className="text-xs text-[#9BAABD]">Active Campaigns</div>
              </div>
            </div>

            <div className="bg-[#08254D] border border-white/10 p-4 rounded-xl flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">{totalImpressions.toLocaleString()}</div>
                <div className="text-xs text-[#9BAABD]">Impressions Count</div>
              </div>
            </div>

            <div className="bg-[#08254D] border border-white/10 p-4 rounded-xl flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                <MousePointerClick className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">{totalClicks.toLocaleString()}</div>
                <div className="text-xs text-[#9BAABD]">Clicks & Inquiries</div>
              </div>
            </div>

            <div className="bg-[#08254D] border border-white/10 p-4 rounded-xl flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">
                  {ads.filter((a) => a.approvalStatus === 'pending_approval').length}
                </div>
                <div className="text-xs text-[#9BAABD]">Pending Approval</div>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#08254D] p-3.5 rounded-xl border border-white/10">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search campaigns by business, headline, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#04142F] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#FFC928]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={placementFilter}
                onChange={(e) => setPlacementFilter(e.target.value)}
                className="bg-[#04142F] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFC928]"
              >
                <option value="all">All Placements</option>
                <option value="homepage_banner">Homepage Main Banner</option>
                <option value="directory_top">Directory Top Sticky</option>
                <option value="category_sidebar">Category Sidebar</option>
                <option value="event_footer">Events Spotlight</option>
                <option value="startup_popup">Startup Promotional Popup</option>
                <option value="search_sponsored">Search Sponsored</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#04142F] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFC928]"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Ad Cards Grid */}
          {loading ? (
            <div className="w-full py-16 text-center text-white/60 text-sm">
              Loading advertising campaigns...
            </div>
          ) : filteredAds.length === 0 ? (
            <div className="bg-[#08254D] p-10 rounded-2xl border border-white/10 text-center space-y-3">
              <Megaphone className="w-12 h-12 text-white/30 mx-auto" />
              <h3 className="text-base font-bold text-white">No Advertisements Found</h3>
              <p className="text-xs text-[#D5DCE8] max-w-sm mx-auto">
                Create sponsored campaigns for local enterprises, hotels, special festive sales, or partner institutions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAds.map((ad) => (
                <div
                  key={ad.id}
                  className="bg-[#08254D] border border-white/10 hover:border-[#FFC928]/40 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition group"
                >
                  <div>
                    {/* Visual Preview */}
                    <div className="relative h-36 w-full bg-[#04142F] overflow-hidden">
                      <img
                        src={ad.bannerImageUrl || ad.imageUrl}
                        alt={ad.title}
                        className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#08254D] via-transparent to-black/30" />

                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                        <span className="bg-[#04142F]/90 backdrop-blur-sm border border-white/20 text-[#FFC928] text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                          {ad.placement.replace('_', ' ')}
                        </span>
                        {ad.approvalStatus === 'pending_approval' && (
                          <span className="bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Pending Review
                          </span>
                        )}
                        {ad.paymentStatus === 'paid' && (
                          <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            Paid
                          </span>
                        )}
                      </div>

                      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
                        <button
                          onClick={() => handleToggleStatus(ad)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition ${
                            ad.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                          }`}
                        >
                          {ad.status === 'active' ? '● Active' : '○ Paused'}
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <div>
                        <span className="text-[11px] text-[#FFC928] font-bold uppercase tracking-wider">
                          {ad.businessName}
                        </span>
                        <h3 className="font-bold text-base text-white font-brand-sans line-clamp-1">
                          {ad.title}
                        </h3>
                      </div>

                      {ad.description && (
                        <p className="text-xs text-[#D5DCE8] line-clamp-2">
                          {ad.description}
                        </p>
                      )}

                      {/* Destination Preview */}
                      <div className="flex items-center gap-2 text-[11px] text-[#9BAABD] pt-1">
                        {ad.destinationType === 'whatsapp' ? (
                          <>
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate text-emerald-300">WhatsApp: {ad.destinationWhatsApp || ad.linkUrl}</span>
                          </>
                        ) : ad.destinationType === 'phone' ? (
                          <>
                            <Phone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span className="truncate text-sky-300">Call: {ad.destinationPhone}</span>
                          </>
                        ) : ad.destinationType === 'listing' ? (
                          <>
                            <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate text-amber-300">Place ID: {ad.destinationListingId || ad.linkedPlaceId}</span>
                          </>
                        ) : (
                          <>
                            <Globe className="w-3.5 h-3.5 text-[#FFC928] shrink-0" />
                            <a
                              href={ad.destinationUrl || ad.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate text-[#D5DCE8] hover:text-[#FFC928] underline underline-offset-2 flex items-center gap-1"
                            >
                              <span>{ad.destinationUrl || ad.linkUrl}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Analytics */}
                  <div className="p-4 pt-2 border-t border-white/10 space-y-2.5">
                    {/* Approval Buttons if Pending */}
                    {ad.approvalStatus === 'pending_approval' && (
                      <div className="flex items-center gap-2 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                        <span className="text-[10px] text-amber-300 font-bold flex-1">Awaiting Review:</span>
                        <button
                          onClick={() => handleSetApproval(ad, 'approved')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-[10px] font-bold hover:bg-emerald-400 transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleSetApproval(ad, 'rejected')}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/30 text-rose-300 text-[10px] font-bold hover:bg-rose-500/40 transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 text-[11px] text-white/70">
                        <span className="flex items-center gap-1" title="Impressions">
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <b>{ad.viewsCount || 0}</b>
                        </span>
                        <span className="flex items-center gap-1" title="Clicks">
                          <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
                          <b>{ad.clicksCount || 0}</b>
                        </span>
                        {ad.viewsCount && ad.viewsCount > 0 ? (
                          <span className="text-[10px] text-amber-300">
                            CTR: {(((ad.clicksCount || 0) / ad.viewsCount) * 100).toFixed(1)}%
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditAd(ad)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-[#FFC928] hover:text-[#04142F] text-white transition cursor-pointer"
                          title="Edit Campaign"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAd(ad.id)}
                          disabled={isDeleting === ad.id}
                          className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition cursor-pointer disabled:opacity-50"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: ANALYTICS & TELEMETRY */}
      {/* =================================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-[#08254D] p-4 rounded-2xl border border-white/10">
            <div>
              <h3 className="text-base font-bold text-white">Advertising Performance Telemetry</h3>
              <p className="text-xs text-slate-300 mt-0.5">Real-time impressions, click-through rates, and monetization overview.</p>
            </div>
            <select
              value={analyticsRange}
              onChange={(e) => setAnalyticsRange(e.target.value)}
              className="bg-[#04142F] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {analytics ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#08254D] p-5 rounded-2xl border border-white/10">
                  <div className="text-xs text-slate-300 font-bold uppercase">Total Impressions</div>
                  <div className="text-2xl font-black text-white mt-1">{analytics.totalImpressions.toLocaleString()}</div>
                  <div className="text-[11px] text-cyan-400 mt-1">Real views across all placements</div>
                </div>

                <div className="bg-[#08254D] p-5 rounded-2xl border border-white/10">
                  <div className="text-xs text-slate-300 font-bold uppercase">Total Clicks / Inquiries</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{analytics.totalClicks.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Verified user actions</div>
                </div>

                <div className="bg-[#08254D] p-5 rounded-2xl border border-white/10">
                  <div className="text-xs text-slate-300 font-bold uppercase">Click-Through Rate (CTR)</div>
                  <div className="text-2xl font-black text-[#FFC928] mt-1">{analytics.ctr}%</div>
                  <div className="text-[11px] text-slate-400 mt-1">Average conversion efficiency</div>
                </div>

                <div className="bg-[#08254D] p-5 rounded-2xl border border-white/10">
                  <div className="text-xs text-slate-300 font-bold uppercase">Total Ads Revenue</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">₦{analytics.totalRevenue.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{analytics.paidCampaignsCount} paid sponsorships</div>
                </div>
              </div>

              {/* By Placement */}
              <div className="bg-[#08254D] p-5 rounded-2xl border border-white/10">
                <h4 className="text-sm font-bold text-white mb-3">Performance by Placement</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 font-bold">
                        <th className="py-2">Placement</th>
                        <th className="py-2">Active Ads</th>
                        <th className="py-2">Impressions</th>
                        <th className="py-2">Clicks</th>
                        <th className="py-2">CTR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Object.entries(analytics.byPlacement).map(([plc, rawData]) => {
                        const data = rawData as { count: number; impressions: number; clicks: number; ctr: number };
                        return (
                          <tr key={plc} className="hover:bg-white/5">
                            <td className="py-3 font-semibold text-white capitalize">{plc.replace('_', ' ')}</td>
                            <td className="py-3 text-slate-300">{data.count}</td>
                            <td className="py-3 text-cyan-300">{data.impressions.toLocaleString()}</td>
                            <td className="py-3 text-emerald-300">{data.clicks.toLocaleString()}</td>
                            <td className="py-3 text-amber-300 font-bold">{data.ctr}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">Loading telemetry data...</div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: PACKAGES & PRICING */}
      {/* =================================================================== */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-[#08254D] p-4 rounded-2xl border border-white/10">
            <div>
              <h3 className="text-base font-bold text-white">Sponsorship & Advertising Packages</h3>
              <p className="text-xs text-slate-300 mt-0.5">Define fixed packages, pricing in Naira, and allowed promotional slots.</p>
            </div>
            <button
              onClick={handleOpenCreatePackage}
              className="bg-[#FFC928] text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#F5B800] transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Package</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`bg-[#08254D] rounded-2xl border p-5 flex flex-col justify-between transition ${
                  pkg.active ? 'border-white/10 hover:border-amber-400/40' : 'border-rose-500/20 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                      {pkg.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        pkg.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {pkg.active ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <div className="text-2xl font-black text-white">
                    ₦{pkg.price.toLocaleString()}
                    <span className="text-xs font-normal text-slate-400 ml-1">/ {pkg.durationDays} days</span>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                    <div className="text-xs font-bold text-slate-300">Package Features:</div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {pkg.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="text-[11px] text-slate-400">Allowed Placements:</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(pkg.placements || (pkg as any).allowedPlacements || []).map((plc: string) => (
                        <span key={plc} className="text-[10px] bg-white/5 text-slate-300 px-2 py-0.5 rounded">
                          {plc.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditPackage(pkg)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-[#FFC928] hover:text-slate-950 text-white transition text-xs font-bold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeletePackage(pkg.id)}
                    className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition text-xs font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: PAYMENTS & RECONCILIATIONS */}
      {/* =================================================================== */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="bg-[#08254D] p-5 rounded-2xl border border-white/10">
            <h3 className="text-base font-bold text-white">Payment Transactions & Reconciliations</h3>
            <p className="text-xs text-slate-300 mt-1">
              Audit all payment records. Super Admins can manually reconcile direct bank transfers or offline payments.
            </p>
          </div>

          <div className="bg-[#08254D] rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#04142F] border-b border-white/10 text-slate-400 font-bold">
                    <th className="p-3.5">Reference</th>
                    <th className="p-3.5">Advertiser</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Channel</th>
                    <th className="p-3.5">Created</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No payment records found yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((pmt) => (
                      <tr key={pmt.id} className="hover:bg-white/5">
                        <td className="p-3.5 font-mono text-amber-300">{pmt.paymentReference}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-white">{pmt.advertiserName}</div>
                          {pmt.advertiserEmail && <div className="text-[11px] text-slate-400">{pmt.advertiserEmail}</div>}
                        </td>
                        <td className="p-3.5 font-bold text-white">₦{pmt.amount.toLocaleString()}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              pmt.status === 'success'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : pmt.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {pmt.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300 capitalize">{pmt.paymentMethod}</td>
                        <td className="p-3.5 text-slate-400">{new Date(pmt.createdAt).toLocaleDateString()}</td>
                        <td className="p-3.5 text-right">
                          {pmt.status === 'pending' && (
                            <button
                              onClick={() => {
                                setReconcilingPayment(pmt);
                                setReconcileNotes('');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 transition"
                            >
                              Reconcile
                            </button>
                          )}
                          {pmt.status === 'success' && pmt.reconciledBy && (
                            <span className="text-[10px] text-slate-400">Reconciled by Admin</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: MONETIZATION & GOOGLE ADS SETTINGS */}
      {/* =================================================================== */}
      {activeTab === 'settings' && settings && (
        <div className="space-y-6">
          {/* Platform Status Card */}
          <div className="bg-[#08254D] p-5 rounded-2xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Current Runtime Platform</h4>
                <p className="text-xs text-slate-300">
                  Detected environment: <b className="text-amber-400 uppercase">{runtimePlatform}</b> (Web / PWA Application).
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white">
              Compliant
            </span>
          </div>

          {/* Local Advertising Controls */}
          <div className="bg-[#08254D] p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-400" />
              Local Sponsored Advertising System
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-4 rounded-xl bg-[#04142F] border border-white/10 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">Enable Local Ads</div>
                  <div className="text-[11px] text-slate-400">Show sponsored local business banners in directory</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.localAdsEnabled}
                  onChange={(e) => handleSaveSettings({ localAdsEnabled: e.target.checked })}
                  className="w-5 h-5 rounded text-amber-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl bg-[#04142F] border border-white/10 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">Enable Startup Promo Modal</div>
                  <div className="text-[11px] text-slate-400">Display prominent featured ad upon app entry</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.startupAdsEnabled}
                  onChange={(e) => handleSaveSettings({ startupAdsEnabled: e.target.checked })}
                  className="w-5 h-5 rounded text-amber-500"
                />
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#04142F] border border-white/10">
              <div>
                <div className="text-xs font-bold text-white">Startup Modal Frequency</div>
                <div className="text-[11px] text-slate-400">Controls how many hours must pass before the popup is shown again to the same user</div>
              </div>
              <select
                value={settings.startupFrequencyHours || 12}
                onChange={(e) => handleSaveSettings({ startupFrequencyHours: Number(e.target.value) })}
                className="bg-[#08254D] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value={4}>Every 4 Hours</option>
                <option value={6}>Every 6 Hours</option>
                <option value={12}>Every 12 Hours (Default)</option>
                <option value={24}>Once per Day (24 Hours)</option>
                <option value={48}>Every 2 Days (48 Hours)</option>
              </select>
            </div>
          </div>

          {/* Google Advertising Integration */}
          <div className="bg-[#08254D] p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  Google Advertising (AdSense / AdMob)
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Architecturally separated from local ads. Automatically loads official Google scripts when enabled and properly configured.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-[#04142F] px-4 py-2 rounded-xl border border-white/10">
                <span className="text-xs font-bold text-white">
                  {settings.googleAds?.enabled ? 'Google Ads Active' : 'Google Ads Disabled'}
                </span>
                <input
                  type="checkbox"
                  checked={settings.googleAds?.enabled ?? false}
                  onChange={(e) =>
                    handleSaveSettings({
                      googleAds: {
                        ...(settings.googleAds || {}),
                        enabled: e.target.checked
                      }
                    })
                  }
                  className="w-4 h-4 rounded text-cyan-500"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  AdSense Client ID (Publisher ID)
                </label>
                <input
                  type="text"
                  placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                  value={settings.googleAds?.clientId || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      googleAds: { ...(settings.googleAds || {}), clientId: e.target.value }
                    })
                  }
                  className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
                />
                <span className="text-[10px] text-slate-400">Can also be supplied via `GOOGLE_ADS_CLIENT_ID` env variable.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Default Ad Slot ID
                </label>
                <input
                  type="text"
                  placeholder="XXXXXXXXXX"
                  value={settings.googleAds?.slotId || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      googleAds: { ...(settings.googleAds || {}), slotId: e.target.value }
                    })
                  }
                  className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#04142F] border border-white/10">
              <div>
                <div className="text-xs font-bold text-white">AdSense Test Mode</div>
                <div className="text-[11px] text-slate-400">Injects test attributes (`data-ad-test="on"`) to safely preview ad containers without policy infractions</div>
              </div>
              <input
                type="checkbox"
                checked={settings.googleAds?.testMode ?? true}
                onChange={(e) =>
                  handleSaveSettings({
                    googleAds: {
                      ...(settings.googleAds || {}),
                      testMode: e.target.checked
                    }
                  })
                }
                className="w-4 h-4 rounded text-cyan-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() =>
                  handleSaveSettings({
                    googleAds: settings.googleAds
                  })
                }
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
              >
                Save Google Ads Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: CREATE / EDIT AD */}
      {/* =================================================================== */}
      {isAdModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#08254D] border border-white/16 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#04142F]">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#FFC928]" />
                <h3 className="font-bold text-base sm:text-lg text-white font-brand-sans">
                  {editingAd ? 'Edit Ad Campaign' : 'Create New Ad Campaign'}
                </h3>
              </div>
              <button
                onClick={() => setIsAdModalOpen(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAd} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Business / Sponsor Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shendam Royal Plaza"
                    value={formBusinessName}
                    onChange={(e) => setFormBusinessName(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FFC928]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Placement Position *
                  </label>
                  <select
                    value={formPlacement}
                    onChange={(e) => setFormPlacement(e.target.value as any)}
                    className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFC928]"
                  >
                    <option value="homepage_banner">Homepage Main Banner</option>
                    <option value="directory_top">Directory Top Sticky</option>
                    <option value="category_sidebar">Category Sidebar</option>
                    <option value="event_footer">Events Spotlight</option>
                    <option value="startup_popup">Startup Promotional Popup</option>
                    <option value="search_sponsored">Search Sponsored</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Ad Headline / Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50% Off On Luxury Rooms During Goemai Festival"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FFC928]"
                />
              </div>

              {/* Destination Type Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white">
                  Target Destination Action
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormDestinationType('url')}
                    className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition ${
                      formDestinationType === 'url'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                        : 'bg-[#04142F] text-slate-300 border-white/10'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span>Website URL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormDestinationType('whatsapp')}
                    className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition ${
                      formDestinationType === 'whatsapp'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                        : 'bg-[#04142F] text-slate-300 border-white/10'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormDestinationType('phone')}
                    className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition ${
                      formDestinationType === 'phone'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500'
                        : 'bg-[#04142F] text-slate-300 border-white/10'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    <span>Direct Call</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormDestinationType('listing')}
                    className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition ${
                      formDestinationType === 'listing'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                        : 'bg-[#04142F] text-slate-300 border-white/10'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>App Listing</span>
                  </button>
                </div>

                {/* Dynamic Destination Input */}
                {formDestinationType === 'url' && (
                  <input
                    type="url"
                    placeholder="https://example.com/promo"
                    value={formDestinationUrl}
                    onChange={(e) => setFormDestinationUrl(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                )}

                {formDestinationType === 'whatsapp' && (
                  <input
                    type="text"
                    placeholder="e.g. 08030000000 or +2348030000000"
                    value={formDestinationWhatsApp}
                    onChange={(e) => setFormDestinationWhatsApp(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                )}

                {formDestinationType === 'phone' && (
                  <input
                    type="tel"
                    placeholder="e.g. 08031234567"
                    value={formDestinationPhone}
                    onChange={(e) => setFormDestinationPhone(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                )}

                {formDestinationType === 'listing' && (
                  <input
                    type="text"
                    placeholder="Place ID (e.g. shendam-hotel-1)"
                    value={formDestinationListingId}
                    onChange={(e) => setFormDestinationListingId(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                )}
              </div>

              {/* Images */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Primary Graphic (Card / Thumbnail) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="https://... or upload below"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="flex-1 bg-[#04142F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <label className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleUploadImageFile(e.target.files[0], false)}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    Wide Banner Graphic (Optional for Popups & Top Banners)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://... or upload wide banner"
                      value={formBannerImageUrl}
                      onChange={(e) => setFormBannerImageUrl(e.target.value)}
                      className="flex-1 bg-[#04142F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <label className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingBanner ? 'Uploading...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleUploadImageFile(e.target.files[0], true)}
                        disabled={uploadingBanner}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Ad Description / Promotional Copy
                </label>
                <textarea
                  rows={2}
                  placeholder="Short promotional text displayed underneath the banner title..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-[#04142F] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#FFC928]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1">End Date</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1">Priority (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formPriority}
                    onChange={(e) => setFormPriority(Number(e.target.value))}
                    className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">Assigned Package</label>
                  <select
                    value={formPackageId}
                    onChange={(e) => setFormPackageId(e.target.value)}
                    className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="">Custom / No Package</option>
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₦{p.price.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1">Payment Status</label>
                  <select
                    value={formPaymentStatus}
                    onChange={(e) => setFormPaymentStatus(e.target.value as any)}
                    className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="paid">Paid & Verified</option>
                    <option value="pending">Pending Payment</option>
                    <option value="waived">Waived / Partner Complimentary</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-black text-[#04142F] bg-[#FFC928] hover:bg-[#F5B800] active:scale-95 transition shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingAd ? 'Update Ad' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: PACKAGE CREATE / EDIT */}
      {/* =================================================================== */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#08254D] border border-white/16 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#04142F]">
              <h3 className="font-bold text-base text-white">
                {editingPackage ? 'Edit Ad Package' : 'Create Pricing Package'}
              </h3>
              <button onClick={() => setIsPackageModalOpen(false)} className="text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleSavePackage} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-white mb-1">Package Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Featured Spotlight"
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">Price (₦)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(Number(e.target.value))}
                    className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={pkgDuration}
                    onChange={(e) => setPkgDuration(Number(e.target.value))}
                    className="w-full bg-[#04142F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">Features (One per line)</label>
                <textarea
                  rows={3}
                  value={pkgFeatures}
                  onChange={(e) => setPkgFeatures(e.target.value)}
                  className="w-full bg-[#04142F] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: MANUAL RECONCILE PAYMENT */}
      {/* =================================================================== */}
      {reconcilingPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#08254D] border border-amber-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#04142F]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Manual Payment Reconciliation</h3>
              </div>
              <button onClick={() => setReconcilingPayment(null)} className="text-white text-xs">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Confirming reconciliation for advertiser <b>{reconcilingPayment.advertiserName}</b> with reference{' '}
                <span className="font-mono text-amber-300">{reconcilingPayment.paymentReference}</span> for <b>₦{reconcilingPayment.amount.toLocaleString()}</b>.
              </p>

              <div>
                <label className="block text-xs font-bold text-white mb-1">Reconciliation Notes (Bank Transfer ref, receipt ID, etc.)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Verified via Zenith Bank Statement Ref #12345"
                  value={reconcileNotes}
                  onChange={(e) => setReconcileNotes(e.target.value)}
                  className="w-full bg-[#04142F] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setReconcilingPayment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isReconciling}
                  onClick={handleConfirmReconcile}
                  className="px-5 py-2 rounded-xl text-xs font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50"
                >
                  {isReconciling ? 'Reconciling...' : 'Confirm & Activate Ad'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
