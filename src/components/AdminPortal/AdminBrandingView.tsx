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
  RefreshCw
} from 'lucide-react';
import defaultLogoImg from '../../assets/shendam_logo.jpg';
import { BrandingConfig, SeasonalThemeType } from '../../types';
import { BrandLogoImage } from '../BrandLogoImage';
import { compressAndValidateImage } from '../../utils/imageCompressor';

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

  // Load current branding from backend
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
          setSplashLogo(b.splashLogo || null);
          setHomepageLogo(b.homepageLogo || null);
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
    } catch {
      showToast('Offline or default configuration loaded.');
    } finally {
      setLoading(false);
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

      // Update state with permanent storage URL (/uploads/logo_...png)
      if (target === 'splash') {
        setSplashLogo(permanentUrl);
        localStorage.setItem('scSplashLogo', permanentUrl);
      }
      if (target === 'homepage') {
        setHomepageLogo(permanentUrl);
        localStorage.setItem('scHeaderLogo', permanentUrl);
      }
      if (target === 'favicon') setFavicon(permanentUrl);
      if (target === 'bg') setHomepageBackground(permanentUrl);
      if (target === 'festive') setCustomBannerUrl(permanentUrl);

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
                onClick={() => setActiveTheme(theme.id as SeasonalThemeType)}
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
          <div className="bg-[#04142F] p-4 rounded-xl border border-white/10 space-y-4 animate-in fade-in">
            <h3 className="text-xs font-bold text-[#FFC928] uppercase tracking-wider">
              Configure {activeTheme.replace('_', ' ').toUpperCase()} Festive Campaign
            </h3>

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
                    Display Festive Celebration Badge on Homepage
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
