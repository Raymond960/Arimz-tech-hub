import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Trash2,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Layout,
  Save,
  Eye,
  ImageIcon,
  Calendar,
  Gift,
  Palette,
  Check,
  RefreshCw,
  Edit3,
  Plus,
  X
} from 'lucide-react';
import defaultLogoImg from '../../assets/shendam_logo.jpg';
import { BrandingConfig, SeasonalThemeType, HeroSlide, CategoryId } from '../../types';
import { BrandLogoImage } from '../BrandLogoImage';
import { compressAndValidateImage } from '../../utils/imageCompressor';
import { SEASONAL_THEME_PRESETS } from '../../utils/seasonalThemes';

interface AdminBrandingViewProps {
  token?: string;
  onSessionExpired?: () => void;
}

export const AdminBrandingView: React.FC<AdminBrandingViewProps> = ({
  token,
  onSessionExpired
}) => {
  const [splashLogo, setSplashLogo] = useState<string | null>(null);
  const [homepageLogo, setHomepageLogo] = useState<string | null>(null);
  const [favicon, setFavicon] = useState<string | null>(null);
  const [homepageBackground, setHomepageBackground] = useState<string | null>(null);
  const [heroBackground, setHeroBackground] = useState<string | null>(null);

  // Hero carousel slides state
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);
  const [activeSlideForUpload, setActiveSlideForUpload] = useState<string | null>(null);
  const slideFileInputRef = useRef<HTMLInputElement>(null);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [slideEditForm, setSlideEditForm] = useState<{
    title: string;
    tagline: string;
    description: string;
    categoryTarget: CategoryId;
  }>({
    title: '',
    tagline: '',
    description: '',
    categoryTarget: 'tourist_spots'
  });
  const [isSavingSlide, setIsSavingSlide] = useState(false);

  // Seasonal theme state
  const [activeTheme, setActiveTheme] = useState<SeasonalThemeType>('none');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customGreeting, setCustomGreeting] = useState<string>('');
  const [customBannerUrl, setCustomBannerUrl] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState<string>('#FFC928');
  const [showCelebrationBadge, setShowCelebrationBadge] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const splashInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const festiveBannerInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Load current branding and hero slides from backend
  const fetchBranding = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/branding', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.status === 401 && onSessionExpired) {
        onSessionExpired();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const b: BrandingConfig = data.branding || data;
        if (b) {
          const cachedSplash = localStorage.getItem('scSplashLogo');
          const cachedHeader = localStorage.getItem('scHeaderLogo');
          setSplashLogo(b.splashLogo || (cachedSplash && cachedSplash.startsWith('data:image/') ? cachedSplash : null));
          setHomepageLogo(b.homepageLogo || (cachedHeader && cachedHeader.startsWith('data:image/') ? cachedHeader : null));
          setFavicon(b.favicon || null);
          setHomepageBackground(b.homepageBackground || null);
          setHeroBackground(b.heroBackground || null);
          if (b.seasonal) {
            setActiveTheme(b.seasonal.activeTheme || 'none');
            setCustomTitle(b.seasonal.customTitle || '');
            setCustomGreeting(b.seasonal.customGreeting || '');
            setCustomBannerUrl(b.seasonal.customBannerUrl || null);
            setAccentColor(b.seasonal.accentColor || '#FFC928');
            setShowCelebrationBadge(b.seasonal.showCelebrationBadge ?? true);
          }
        }
      }

      // Also fetch hero slides
      try {
        const slidesRes = await fetch('/api/hero-slides');
        if (slidesRes.ok) {
          const sData = await slidesRes.json();
          if (sData && Array.isArray(sData.slides)) {
            setHeroSlides(sData.slides);
          }
        }
      } catch (err) {
        console.warn('Could not load hero slides:', err);
      }
    } catch {
      showToast('Offline or default configuration loaded.');
    } finally {
      setLoading(false);
    }
  };

  const handleSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSlideForUpload) return;
    const slideId = activeSlideForUpload;
    setUploadingSlideId(slideId);

    try {
      let base64: string;
      try {
        const compressed = await compressAndValidateImage(file, 1400);
        base64 = compressed.dataUrl;
      } catch {
        base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const effectiveToken = token || localStorage.getItem('shendam_admin_token') || '';
      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}`, 'x-admin-token': effectiveToken } : {})
        },
        body: JSON.stringify({
          fileData: base64,
          filename: `hero-${slideId}-${file.name}`
        })
      });

      if (!uploadRes.ok) {
        throw new Error('Image upload failed on server');
      }

      const uploadData = await uploadRes.json();
      const permanentUrl = uploadData.url;

      const updateRes = await fetch(`/api/admin/hero-slides/${encodeURIComponent(slideId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}`, 'x-admin-token': effectiveToken } : {})
        },
        body: JSON.stringify({ image: permanentUrl })
      });

      if (updateRes.ok) {
        const updateData = await updateRes.json();
        if (updateData.slides) {
          setHeroSlides(updateData.slides);
        } else {
          setHeroSlides((prev) => prev.map((s) => (s.id === slideId ? { ...s, image: permanentUrl } : s)));
        }
        window.dispatchEvent(new Event('sc-branding-updated'));
        showToast('Slide photo uploaded and saved successfully!');
      } else {
        throw new Error('Failed to update slide image on server');
      }
    } catch (err: any) {
      console.error('Slide upload error:', err);
      showToast(`Upload failed: ${err.message || 'Error'}`);
    } finally {
      setUploadingSlideId(null);
      setActiveSlideForUpload(null);
      e.target.value = '';
    }
  };

  const handleClearSlideImage = async (slideId: string) => {
    try {
      const effectiveToken = token || localStorage.getItem('shendam_admin_token') || '';
      const updateRes = await fetch(`/api/admin/hero-slides/${encodeURIComponent(slideId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}`, 'x-admin-token': effectiveToken } : {})
        },
        body: JSON.stringify({ image: '' })
      });

      if (updateRes.ok) {
        const updateData = await updateRes.json();
        if (updateData.slides) {
          setHeroSlides(updateData.slides);
        } else {
          setHeroSlides((prev) => prev.map((s) => (s.id === slideId ? { ...s, image: '' } : s)));
        }
        window.dispatchEvent(new Event('sc-branding-updated'));
        showToast('Slide photo cleared.');
      }
    } catch (err: any) {
      showToast(`Failed to clear slide photo: ${err.message || 'Error'}`);
    }
  };

  const handleStartEditSlide = (slide: HeroSlide) => {
    setEditingSlideId(slide.id);
    setSlideEditForm({
      title: slide.title || '',
      tagline: slide.tagline || '',
      description: slide.description || '',
      categoryTarget: slide.categoryTarget || 'tourist_spots'
    });
  };

  const handleSaveSlideDetails = async (slideId: string) => {
    setIsSavingSlide(true);
    try {
      const effectiveToken = token || localStorage.getItem('shendam_admin_token') || '';
      const updateRes = await fetch(`/api/admin/hero-slides/${encodeURIComponent(slideId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}`, 'x-admin-token': effectiveToken } : {})
        },
        body: JSON.stringify(slideEditForm)
      });

      if (updateRes.ok) {
        const updateData = await updateRes.json();
        if (updateData.slides) {
          setHeroSlides(updateData.slides);
        } else {
          setHeroSlides((prev) => prev.map((s) => (s.id === slideId ? { ...s, ...slideEditForm } : s)));
        }
        setEditingSlideId(null);
        window.dispatchEvent(new Event('sc-branding-updated'));
        showToast('Hero slide text and details saved successfully!');
      } else {
        throw new Error('Failed to update slide content on server');
      }
    } catch (err: any) {
      showToast(`Update failed: ${err.message || 'Error'}`);
    } finally {
      setIsSavingSlide(false);
    }
  };

  const handleAddSlide = async () => {
    try {
      const effectiveToken = token || localStorage.getItem('shendam_admin_token') || '';
      const createRes = await fetch('/api/admin/hero-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}`, 'x-admin-token': effectiveToken } : {})
        },
        body: JSON.stringify({
          title: 'NEW PROMOTIONAL SPONSOR',
          tagline: 'FEATURED SPOTLIGHT',
          description: 'Custom promotional announcement or sponsor message for Shendam Connect.',
          image: '',
          categoryTarget: 'services'
        })
      });

      if (createRes.ok) {
        const createData = await createRes.json();
        if (createData.slides) {
          setHeroSlides(createData.slides);
        }
        if (createData.slide) {
          handleStartEditSlide(createData.slide);
        }
        window.dispatchEvent(new Event('sc-branding-updated'));
        showToast('New hero slide added! You can now edit its text and upload a photo.');
      } else {
        throw new Error('Failed to create new slide');
      }
    } catch (err: any) {
      showToast(`Failed to add slide: ${err.message || 'Error'}`);
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (!window.confirm('Are you sure you want to delete this hero slide?')) return;
    try {
      const effectiveToken = token || localStorage.getItem('shendam_admin_token') || '';
      const delRes = await fetch(`/api/admin/hero-slides/${encodeURIComponent(slideId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}`, 'x-admin-token': effectiveToken } : {})
        }
      });

      if (delRes.ok) {
        const delData = await delRes.json();
        if (delData.slides) {
          setHeroSlides(delData.slides);
        } else {
          setHeroSlides((prev) => prev.filter((s) => s.id !== slideId));
        }
        if (editingSlideId === slideId) {
          setEditingSlideId(null);
        }
        window.dispatchEvent(new Event('sc-branding-updated'));
        showToast('Slide deleted successfully.');
      } else {
        throw new Error('Failed to delete slide');
      }
    } catch (err: any) {
      showToast(`Delete failed: ${err.message || 'Error'}`);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, [token]);

  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'splash' | 'homepage' | 'favicon' | 'bg' | 'festive'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('File type is not supported. Please select a PNG, JPG, or WebP image.');
      e.target.value = '';
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast('File is too large. Please select an image under 15MB.');
      e.target.value = '';
      return;
    }

    setUploadingTarget(target);

    try {
      // Compress and optimize image to avoid large base64 payload fetch errors
      let dataUrl: string;
      try {
        const compressedResult = await compressAndValidateImage(file, 1200);
        dataUrl = compressedResult.dataUrl;
      } catch (compressionErr: any) {
        console.warn('Image compression fallback to raw reader:', compressionErr);
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.onerror = () => reject(new Error('Failed to read image file on client.'));
          reader.readAsDataURL(file);
        });
      }

      const effectiveToken = token || localStorage.getItem('shendam_admin_token') || '';

      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}`, 'x-admin-token': effectiveToken } : {})
        },
        body: JSON.stringify({
          fileData: dataUrl,
          filename: file.name,
          brandingTarget: target === 'splash' || target === 'homepage' ? target : undefined
        })
      });

      if (uploadRes.status === 401) {
        showToast('Authentication failed. Please log in again.');
        if (onSessionExpired) onSessionExpired();
        return;
      }

      if (uploadRes.status === 403) {
        showToast('Access denied. Administrator privileges required.');
        return;
      }

      if (uploadRes.status === 404) {
        showToast('Backend endpoint not found.');
        return;
      }

      if (uploadRes.status === 413) {
        showToast('File is too large for server storage upload.');
        return;
      }

      if (!uploadRes.ok) {
        let errText = 'Logo storage upload failed.';
        try {
          const errData = await uploadRes.json();
          if (errData.error) errText = errData.error;
        } catch {
          // Fallback
        }
        showToast(errText);
        return;
      }

      const resData = await uploadRes.json();
      const permanentUrl = resData.url;

      if (!permanentUrl) {
        showToast('Logo storage upload failed: Server returned empty URL.');
        return;
      }

      // Use dataUrl for immediate, 100% reliable UI rendering, fall back to permanentUrl
      const displayUrl = dataUrl || permanentUrl;

      if (target === 'splash') {
        setSplashLogo(displayUrl);
        localStorage.setItem('scSplashLogo', displayUrl);
      }
      if (target === 'homepage') {
        setHomepageLogo(displayUrl);
        localStorage.setItem('scHeaderLogo', displayUrl);
      }
      if (target === 'favicon') setFavicon(displayUrl);
      if (target === 'bg') setHomepageBackground(displayUrl);
      if (target === 'festive') setCustomBannerUrl(displayUrl);

      // Trigger instant real-time sync across Header, Sidebar, and App
      window.dispatchEvent(new Event('sc-branding-updated'));

      showToast('Image uploaded and saved to persistent storage successfully!');
    } catch (err: any) {
      console.error('[Logo Upload Error]', err);
      showToast(`Logo storage upload failed: ${err.message || 'Network error'}`);
    } finally {
      setUploadingTarget(null);
      e.target.value = '';
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    const payload: BrandingConfig = {
      splashLogo,
      homepageLogo,
      favicon,
      homepageBackground,
      heroBackground,
      seasonal: {
        activeTheme,
        customTitle,
        customGreeting,
        customBannerUrl,
        accentColor,
        showCelebrationBadge
      }
    };

    try {
      const effectiveToken = token || localStorage.getItem('shendam_admin_token') || '';
      const res = await fetch('/api/admin/branding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}`, 'x-admin-token': effectiveToken } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 401) {
        showToast('Authentication failed. Please log in again.');
        if (onSessionExpired) onSessionExpired();
        return;
      }

      if (res.status === 403) {
        showToast('Access denied. Administrator privileges required.');
        return;
      }

      if (res.status === 404) {
        showToast('Backend endpoint not found.');
        return;
      }

      if (res.ok) {
        // Also save to localStorage for offline access
        localStorage.setItem('scSplashLogo', splashLogo || '');
        localStorage.setItem('scHeaderLogo', homepageLogo || '');
        localStorage.setItem('shendam_branding_v2', JSON.stringify(payload));

        // Dispatch update event
        window.dispatchEvent(new Event('sc-branding-updated'));

        showToast('Branding, logos & seasonal theme saved persistently to database!');
      } else {
        let errText = 'Database update failed.';
        try {
          const errData = await res.json();
          if (errData.error) errText = errData.error;
        } catch {
          // Fallback
        }
        showToast(errText);
      }
    } catch (err: any) {
      console.error('[Save Branding Error]', err);
      showToast(`Database update failed: ${err.message || 'Network error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* HEADER BANNER */}
      <div className="bg-[#08254D] border border-white/12 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-[#FFC928]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFC928]/15 border border-[#FFC928]/30 flex items-center justify-center text-[#FFC928]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-wider text-white uppercase font-brand-sans">
                BRANDING, LOGOS & SEASONAL THEMES
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Central management for app identity, splash logo, header logo, backgrounds & festive themes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#FFC928] hover:bg-[#ffe071] active:scale-95 text-[#04142F] font-black text-sm rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>{isSaving ? 'SAVING...' : 'SAVE BRANDING CHANGES'}</span>
          </button>
        </div>
      </div>

      {/* SUCCESS FEEDBACK BANNER */}
      {successMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 px-5 py-4 rounded-xl flex items-center gap-3 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <div className="flex-1 font-semibold text-sm">{successMessage}</div>
        </div>
      )}

      {/* BRAND LOGOS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. SPLASH / LAUNCH LOGO */}
        <div className="bg-[#08254D] border border-white/12 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#FFC928]" />
                <h3 className="font-bold text-base text-white font-brand-sans">Launch Splash Logo</h3>
              </div>
              <span className="text-[10px] font-bold text-[#FFC928] bg-[#FFC928]/10 px-2.5 py-0.5 rounded-full border border-[#FFC928]/30 uppercase">
                App Entry
              </span>
            </div>
            <p className="text-xs text-[#D5DCE8]">
              Displayed during initial full-screen splash animation when launching Shendam Connect.
            </p>

            {/* Preview Box */}
            <div className="h-40 bg-[#04142F] border border-white/10 rounded-xl p-4 flex items-center justify-center relative group overflow-hidden">
              <BrandLogoImage
                src={splashLogo}
                alt="Splash Preview"
                className="max-h-28 max-w-full object-contain filter drop-shadow-md"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#FFC928]" /> Launch Screen Preview
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/10 flex items-center gap-2">
            <input
              type="file"
              ref={splashInputRef}
              accept="image/*"
              onChange={(e) => handleFileSelect(e, 'splash')}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => splashInputRef.current?.click()}
              disabled={uploadingTarget === 'splash'}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              {uploadingTarget === 'splash' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-[#FFC928] animate-spin" />
                  <span>UPLOADING LOGO...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 text-[#FFC928]" />
                  <span>Upload Splash Logo</span>
                </>
              )}
            </button>
            {splashLogo && (
              <button
                type="button"
                onClick={() => setSplashLogo(null)}
                className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition cursor-pointer"
                title="Reset to Default"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 2. HOMEPAGE HEADER LOGO */}
        <div className="bg-[#08254D] border border-white/12 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layout className="w-5 h-5 text-[#FFC928]" />
                <h3 className="font-bold text-base text-white font-brand-sans">Header Brand Logo</h3>
              </div>
              <span className="text-[10px] font-bold text-[#FFC928] bg-[#FFC928]/10 px-2.5 py-0.5 rounded-full border border-[#FFC928]/30 uppercase">
                Header Bar
              </span>
            </div>
            <p className="text-xs text-[#D5DCE8]">
              Displayed in the top navigation bar and sidebar header on desktop & mobile views.
            </p>

            {/* Preview Box */}
            <div className="h-40 bg-[#04142F] border border-white/10 rounded-xl p-4 flex items-center justify-center relative group overflow-hidden">
              <BrandLogoImage
                src={homepageLogo}
                alt="Header Preview"
                className="max-h-24 max-w-full object-contain filter drop-shadow-md"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#FFC928]" /> Header Bar Preview
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/10 flex items-center gap-2">
            <input
              type="file"
              ref={headerInputRef}
              accept="image/*"
              onChange={(e) => handleFileSelect(e, 'homepage')}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => headerInputRef.current?.click()}
              disabled={uploadingTarget === 'homepage'}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              {uploadingTarget === 'homepage' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-[#FFC928] animate-spin" />
                  <span>UPLOADING LOGO...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 text-[#FFC928]" />
                  <span>Upload Header Logo</span>
                </>
              )}
            </button>
            {homepageLogo && (
              <button
                type="button"
                onClick={() => setHomepageLogo(null)}
                className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition cursor-pointer"
                title="Reset to Default"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* HOMEPAGE HERO CAROUSEL SLIDES (EDITABLE PROMOTIONS & ADS) */}
      <div className="bg-[#08254D] border border-white/12 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-3">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-6 h-6 text-[#FFC928]" />
            <div>
              <h2 className="text-lg font-bold text-white font-brand-sans">
                Homepage Hero Slides (Editable Promotions & Ads)
              </h2>
              <p className="text-xs text-[#D5DCE8]">
                Edit promotional texts, business names, destination categories, and upload custom photos for the fallback hero banner.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleAddSlide}
              className="px-3.5 py-1.5 bg-[#FFC928] hover:bg-[#f0bd24] text-[#04142F] text-xs font-black rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Slide</span>
            </button>
            <span className="text-xs font-black px-3 py-1 rounded-full uppercase border bg-white/10 text-white/80 border-white/10">
              {heroSlides.length} Slides
            </span>
          </div>
        </div>

        <input
          type="file"
          ref={slideFileInputRef}
          onChange={handleSlideImageUpload}
          accept="image/*"
          className="hidden"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {heroSlides.map((slide, idx) => (
            <div
              key={slide.id}
              className="bg-[#04142F] border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-amber-400/20 text-amber-300">
                    Slide {idx + 1}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {slide.image ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Photo Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                        No Photo
                      </span>
                    )}
                    {heroSlides.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded transition"
                        title="Delete Slide"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="h-32 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center relative">
                  {slide.image ? (
                    <>
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                    </>
                  ) : (
                    <div className="text-center p-3">
                      <ImageIcon className="w-8 h-8 text-white/20 mx-auto mb-1" />
                      <p className="text-[11px] text-slate-400 font-medium">No Image Uploaded</p>
                      <p className="text-[9px] text-slate-500">Upload an image below</p>
                    </div>
                  )}
                </div>

                {editingSlideId === slide.id ? (
                  /* INLINE EDIT MODE */
                  <div className="space-y-2 bg-white/5 p-2.5 rounded-lg border border-white/10">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                        Title / Business Name
                      </label>
                      <input
                        type="text"
                        value={slideEditForm.title}
                        onChange={(e) => setSlideEditForm((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-[#08254D] border border-white/15 rounded px-2 py-1 text-xs text-white font-bold focus:outline-none focus:border-[#FFC928]"
                        placeholder="e.g. DREAMS HOTEL & SUITES"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                        Tagline / Category Header
                      </label>
                      <input
                        type="text"
                        value={slideEditForm.tagline}
                        onChange={(e) => setSlideEditForm((prev) => ({ ...prev, tagline: e.target.value }))}
                        className="w-full bg-[#08254D] border border-white/15 rounded px-2 py-1 text-xs text-[#FFC928] font-bold focus:outline-none focus:border-[#FFC928]"
                        placeholder="e.g. STAY — DREAMS HOTEL"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                        Description / Offer
                      </label>
                      <textarea
                        rows={2}
                        value={slideEditForm.description}
                        onChange={(e) => setSlideEditForm((prev) => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-[#08254D] border border-white/15 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-[#FFC928] resize-none"
                        placeholder="e.g. Executive comfort, luxury rooms and serene hospitality in Shendam."
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                        Destination Category Click Action
                      </label>
                      <select
                        value={slideEditForm.categoryTarget}
                        onChange={(e) => setSlideEditForm((prev) => ({ ...prev, categoryTarget: e.target.value as CategoryId }))}
                        className="w-full bg-[#08254D] border border-white/15 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#FFC928]"
                      >
                        <option value="hotels">Hotels & Lodging</option>
                        <option value="services">Professional Services</option>
                        <option value="tourist_spots">Tourism & Landmarks</option>
                        <option value="food">Restaurants & Food</option>
                        <option value="health">Healthcare & Pharmacy</option>
                        <option value="transport">Transport & Logistics</option>
                        <option value="shopping">Shopping & Markets</option>
                        <option value="artisans">Artisans & Crafts</option>
                        <option value="places">All Directory Places</option>
                      </select>
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      <button
                        type="button"
                        disabled={isSavingSlide}
                        onClick={() => handleSaveSlideDetails(slide.id)}
                        className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {isSavingSlide ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Save className="w-3 h-3" />
                        )}
                        <span>Save Text</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSlideId(null)}
                        className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold rounded flex items-center justify-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* VIEW MODE */
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-white truncate">{slide.title}</h3>
                      <button
                        type="button"
                        onClick={() => handleStartEditSlide(slide)}
                        className="px-2 py-0.5 bg-white/10 hover:bg-[#FFC928] hover:text-[#04142F] text-slate-300 text-[10px] font-bold rounded flex items-center gap-1 transition"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Text</span>
                      </button>
                    </div>
                    <p className="text-xs text-[#FFC928] font-bold truncate mt-0.5">{slide.tagline}</p>
                    <p className="text-[11px] text-slate-300 line-clamp-2 mt-1">{slide.description}</p>
                    {slide.categoryTarget && (
                      <span className="inline-block mt-1.5 text-[9px] font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        Target: {slide.categoryTarget.toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  disabled={uploadingSlideId === slide.id}
                  onClick={() => {
                    setActiveSlideForUpload(slide.id);
                    slideFileInputRef.current?.click();
                  }}
                  className="flex-1 py-2 px-3 bg-[#FFC928] hover:bg-[#f0bd24] disabled:opacity-50 text-[#04142F] text-xs font-black rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  {uploadingSlideId === slide.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>{slide.image ? 'Change Photo' : 'Upload Photo'}</span>
                    </>
                  )}
                </button>
                {slide.image && (
                  <button
                    type="button"
                    onClick={() => handleClearSlideImage(slide.id)}
                    className="p-2 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-lg transition"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEASONAL THEMES & CAMPAIGNS SUITE */}
      <div className="bg-[#08254D] border border-white/12 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Gift className="w-6 h-6 text-[#FFC928]" />
            <div>
              <h2 className="text-lg font-bold text-white font-brand-sans">
                Seasonal Themes & Cultural Campaigns
              </h2>
              <p className="text-xs text-[#D5DCE8]">
                Instantly trigger celebratory greetings, banners & accents for festivals and national holidays.
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-black px-3 py-1 rounded-full uppercase border ${
              activeTheme !== 'none'
                ? 'bg-[#FFC928] text-[#04142F] border-[#FFC928]'
                : 'bg-white/10 text-white/60 border-white/10'
            }`}
          >
            {activeTheme !== 'none' ? `● ${activeTheme.toUpperCase()} ACTIVE` : 'STANDARD THEME'}
          </span>
        </div>

        {/* Theme Picker Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { id: 'none', name: 'Standard', icon: '🏛️' },
            { id: 'christmas', name: 'Christmas', icon: '🎄' },
            { id: 'sallah', name: 'Sallah (Eid)', icon: '🌙' },
            { id: 'easter', name: 'Easter', icon: '✝️' },
            { id: 'new_year', name: 'New Year', icon: '🎆' },
            { id: 'independence_day', name: 'Independence', icon: '🇳🇬' },
            { id: 'custom', name: 'Custom', icon: '⭐' }
          ].map((theme) => {
            const isSelected = activeTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  const targetId = theme.id as SeasonalThemeType;
                  setActiveTheme(targetId);
                  if (targetId !== 'none') {
                    const preset = SEASONAL_THEME_PRESETS[targetId];
                    if (preset) {
                      const isDefaultTitle = !customTitle || Object.values(SEASONAL_THEME_PRESETS).some((p) => p.defaultTitle === customTitle);
                      const isDefaultGreeting = !customGreeting || Object.values(SEASONAL_THEME_PRESETS).some((p) => p.defaultGreeting === customGreeting);
                      if (isDefaultTitle) setCustomTitle(preset.defaultTitle);
                      if (isDefaultGreeting) setCustomGreeting(preset.defaultGreeting);
                      setAccentColor(preset.defaultAccent);
                      setShowCelebrationBadge(true);
                    }
                  }
                }}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFC928]/20 border-[#FFC928] text-white font-bold ring-2 ring-[#FFC928]/40'
                    : 'bg-[#04142F] border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-2xl">{theme.icon}</span>
                <span className="text-xs">{theme.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#FFC928]" />}
              </button>
            );
          })}
        </div>

        {/* Theme Customization Inputs */}
        {activeTheme !== 'none' && (
          <div className="bg-[#04142F] p-5 rounded-xl border border-white/10 space-y-5 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
              <h3 className="text-xs font-black text-[#FFC928] uppercase tracking-wider flex items-center gap-2">
                <span>{SEASONAL_THEME_PRESETS[activeTheme]?.icon}</span>
                <span>Configure {activeTheme.replace('_', ' ').toUpperCase()} Festive Campaign</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  const preset = SEASONAL_THEME_PRESETS[activeTheme];
                  if (preset) {
                    setCustomTitle(preset.defaultTitle);
                    setCustomGreeting(preset.defaultGreeting);
                    setAccentColor(preset.defaultAccent);
                    setShowCelebrationBadge(true);
                    showToast(`Restored default template text for ${preset.name}`);
                  }
                }}
                className="text-[11px] font-bold text-white/70 hover:text-[#FFC928] transition underline cursor-pointer"
              >
                Reset to Standard Holiday Template
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Festive Headline / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Merry Christmas & Happy Holidays from Shendam LGA!"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-[#08254D] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FFC928]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Festive Greeting Message
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wishing all residents and visitors peace, joy and prosperity."
                  value={customGreeting}
                  onChange={(e) => setCustomGreeting(e.target.value)}
                  className="w-full bg-[#08254D] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FFC928]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  Festive Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 bg-[#08254D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFC928]"
                  />
                </div>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCelebrationBadge}
                    onChange={(e) => setShowCelebrationBadge(e.target.checked)}
                    className="w-4 h-4 rounded text-[#FFC928] focus:ring-0"
                  />
                  <span className="text-xs font-bold text-white">
                    Display Festive Celebration Badge on Homepage & Header
                  </span>
                </label>
              </div>
            </div>

            {/* Optional Festive Campaign Banner Image */}
            <div>
              <label className="block text-xs font-bold text-white mb-1">
                Optional Festive Banner Image (Appears above the greeting on Homepage)
              </label>
              <input
                type="file"
                ref={festiveBannerInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'festive')}
              />
              <div className="flex flex-wrap items-center gap-3">
                {customBannerUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/20 max-h-24 max-w-xs bg-black/40">
                    <img src={customBannerUrl} alt="Festive Banner" className="h-20 w-auto object-cover" />
                    <button
                      type="button"
                      onClick={() => setCustomBannerUrl(null)}
                      className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-1 text-xs"
                      title="Remove festive banner"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-white/50 italic">No custom image banner attached (pure typography & accent style).</div>
                )}
                <button
                  type="button"
                  onClick={() => festiveBannerInputRef.current?.click()}
                  disabled={uploadingTarget === 'festive'}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5 text-[#FFC928]" />
                  <span>{uploadingTarget === 'festive' ? 'Uploading...' : customBannerUrl ? 'Change Banner' : 'Upload Festive Banner'}</span>
                </button>
              </div>
            </div>

            {/* Live Preview of Festive Greeting on App */}
            <div className="pt-3 border-t border-white/10">
              <div className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-2">
                Live App Preview (How visitors will see it on the Home screen):
              </div>
              <div
                className="rounded-xl p-4 border shadow-md relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${SEASONAL_THEME_PRESETS[activeTheme]?.gradientFrom || '#05234D'} 0%, #03142F 60%, ${SEASONAL_THEME_PRESETS[activeTheme]?.gradientTo || '#020B18'} 100%)`,
                  borderColor: `${accentColor}40`
                }}
              >
                {customBannerUrl && (
                  <div className="mb-2.5 rounded-lg overflow-hidden max-h-24 w-full">
                    <img src={customBannerUrl} alt="Preview Banner" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border"
                    style={{
                      backgroundColor: `${accentColor}20`,
                      color: accentColor,
                      borderColor: `${accentColor}50`
                    }}
                  >
                    <span>{SEASONAL_THEME_PRESETS[activeTheme]?.icon}</span>
                    <span>{SEASONAL_THEME_PRESETS[activeTheme]?.badgeLabel}</span>
                  </span>
                </div>
                <h4 className="text-sm font-black text-white leading-tight mb-1">
                  {customTitle || SEASONAL_THEME_PRESETS[activeTheme]?.defaultTitle}
                </h4>
                <p className="text-xs text-[#E2E8F0] leading-relaxed">
                  {customGreeting || SEASONAL_THEME_PRESETS[activeTheme]?.defaultGreeting}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTheme('none');
                  setCustomTitle('');
                  setCustomGreeting('');
                  setCustomBannerUrl(null);
                  showToast('Switched back to standard theme. Click Save to persist.');
                }}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-bold transition cursor-pointer"
              >
                Deactivate Festive Theme
              </button>

              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-[#FFC928] hover:bg-[#FFD54F] text-[#04142F] text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Festive Campaign</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
