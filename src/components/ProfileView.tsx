import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Crown,
  ShieldCheck,
  PlusCircle,
  Info,
  MapPin,
  ExternalLink,
  MessageSquarePlus,
  Moon,
  Sun,
  Building2,
  Globe,
  Headphones,
  Mail,
  Phone,
  Clock
} from 'lucide-react';
import { FeedbackType, AdminSettings } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface ProfileViewProps {
  onOpenAddBusiness: () => void;
  onOpenFeedback?: (initialType?: FeedbackType) => void;
  savedCount: number;
  onOpenAdmin?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onOpenAddBusiness,
  onOpenFeedback,
  savedCount,
  onOpenAdmin
}) => {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    const fetchSettings = () => {
      fetch('/api/settings')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.settings) {
            setSettings(data.settings);
            setImageLoadError(false);
          }
        })
        .catch(() => {});
    };

    fetchSettings();

    const handleSettingsUpdated = (e: any) => {
      if (e.detail) {
        setSettings(e.detail);
        setImageLoadError(false);
      } else {
        fetchSettings();
      }
    };

    window.addEventListener('sc-settings-updated', handleSettingsUpdated);
    return () => window.removeEventListener('sc-settings-updated', handleSettingsUpdated);
  }, []);

  useEffect(() => {
    setImageLoadError(false);
  }, [settings?.lgaProfileImage]);

  return (
    <div className="w-full px-5 py-4 pb-28 space-y-4 animate-in fade-in duration-200">
      {/* Header Profile Card */}
      <div className="bg-gradient-to-br from-[#0B2D5C] to-[#08254D] border border-white/16 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg ring-2 ring-[#FFC928]/40 shrink-0 bg-[#04142F] flex items-center justify-center">
            {settings?.lgaProfileImage && !imageLoadError ? (
              <img
                src={settings.lgaProfileImage}
                alt={settings.lgaPublicInfoTitle || "Shendam Local Government"}
                className="w-full h-full object-contain rounded-xl p-0.5"
                onError={() => setImageLoadError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#061D40] text-[#FFC928]">
                <Building2 className="w-8 h-8" />
              </div>
            )}
          </div>
          <div>
            <span className="text-[10px] bg-[#FFC928]/20 text-[#FFC928] font-bold px-2 py-0.5 rounded border border-[#FFC928]/30 uppercase">
              Plateau State, Nigeria
            </span>
            <h2 className="text-lg font-bold text-white mt-1 font-brand-sans">
              {settings?.lgaPublicInfoTitle || 'Shendam Local Government'}
            </h2>
            <p className="text-xs text-[#9BAABD]">
              {settings?.lgaPublicInfoDescription || 'Headquarters of Plateau South Senatorial District'}
            </p>
          </div>
        </div>
      </div>

      {/* App Theme Preference Segment Toggle */}
      <div className="bg-[#0B2D5C] border border-white/16 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between text-white font-bold text-sm">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-[#FFC928]" />
            <span>App Theme Preference</span>
          </div>
          <span className="text-[10px] text-[#FFC928] font-bold uppercase">Appearance</span>
        </div>
        <p className="text-xs text-[#9BAABD]">
          Switch between Light and Dark mode appearance.
        </p>
        <div className="pt-1">
          <ThemeToggle variant="segmented" />
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-[#0B2D5C] border border-white/16 rounded-2xl p-3 text-center">
          <span className="text-xs text-[#9BAABD] block">Saved</span>
          <span className="text-lg font-bold text-[#FFC928]">{savedCount}</span>
        </div>
        <div className="bg-[#0B2D5C] border border-white/16 rounded-2xl p-3 text-center">
          <span className="text-xs text-[#9BAABD] block">Districts</span>
          <span className="text-lg font-bold text-white">6</span>
        </div>
        <div className="bg-[#0B2D5C] border border-white/16 rounded-2xl p-3 text-center">
          <span className="text-xs text-[#9BAABD] block">Status</span>
          <span className="text-lg font-bold text-emerald-400">Live</span>
        </div>
      </div>

      {/* Shendam Local Government Public Information Card */}
      <div className="bg-[#0B2D5C] border border-white/16 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Building2 className="w-4 h-4 text-[#FFC928]" />
            <span>{settings?.lgaPublicInfoTitle || 'Shendam Local Government Information'}</span>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30 uppercase">
            {settings?.lgaBadgeText || 'Public Info'}
          </span>
        </div>
        <p className="text-xs text-[#D5DCE8] leading-relaxed">
          {settings?.lgaPublicInfoDescription ||
            'Official public and community information for Shendam Local Government Area, Plateau State. Shendam serves as the headquarters of Plateau South Senatorial District and the ancestral seat of Goemai heritage.'}
        </p>
        {settings?.lgaOfficeAddress && (
          <div className="flex items-start gap-2 text-xs text-[#9BAABD] bg-[#04142F]/60 p-2.5 rounded-xl border border-white/8">
            <MapPin className="w-4 h-4 text-[#FFC928] shrink-0 mt-0.5" />
            <span>{settings.lgaOfficeAddress}</span>
          </div>
        )}
        {settings?.lgaOfficialWebsiteUrl ? (
          <a
            href={settings.lgaOfficialWebsiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full p-3 bg-[#08254D] hover:bg-[#061D40] border border-[#FFC928]/30 rounded-xl text-xs font-bold text-[#FFC928] transition group"
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <Globe className="w-4 h-4 text-[#FFC928] shrink-0" />
              <span className="truncate">{settings.lgaOfficialWebsiteLabel || 'Official Local Government Website'}</span>
            </div>
            <span className="inline-flex items-center gap-1 text-white group-hover:text-[#FFC928] transition shrink-0">
              Visit Website &rarr;
            </span>
          </a>
        ) : (
          <div className="p-3 bg-[#04142F]/40 border border-white/10 rounded-xl text-xs text-[#9BAABD] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#FFC928]" />
              <span>{settings?.lgaOfficialWebsiteLabel || 'Official Local Government Website'}</span>
            </div>
            <span className="text-[11px] text-[#9BAABD]/80">Managed by {settings?.platformName || 'Shendam Connect'}</span>
          </div>
        )}
      </div>

      {/* Culture & Heritage Guide */}
      <div className="bg-[#0B2D5C] border border-white/16 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Crown className="w-4 h-4 text-[#FFC928]" />
          <span>{settings?.lgaCultureTitle || 'Goemai Heritage & Monarch'}</span>
        </div>
        <p className="text-xs text-[#D5DCE8] leading-relaxed">
          {settings?.lgaCultureDescription ||
            'Shendam is the traditional seat of the Long Goemai, supreme ruler of the Goemai Kingdom. Renowned for rich agricultural produce (yam, rice, sesame) and vibrant traditional festivals including the famous Bit Goemai celebration.'}
        </p>
      </div>

      {/* Emergency Hotlines */}
      <div className="bg-[#0B2D5C] border border-white/16 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <PhoneCall className="w-4 h-4 text-[#FFC928]" />
            <span>{settings?.emergencyHotlinesTitle || 'Emergency Hotlines'}</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold uppercase">
            {settings?.emergencyHotlinesBadge || '24/7 Response'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <a
            href={`tel:${(settings?.emergencyPhone1Number || '112').replace(/\s+/g, '')}`}
            className="p-2.5 bg-[#08254D] hover:bg-[#071F42] border border-white/16 rounded-xl flex flex-col justify-between transition"
          >
            <span className="text-white font-bold">{settings?.emergencyPhone1Label || 'National Emergency'}</span>
            <span className="text-[#FFC928] font-semibold mt-1">
              {settings?.emergencyPhone1Display || 'Dial 112'}
            </span>
          </a>

          <a
            href={`tel:${(settings?.emergencyPhone2Number || '+2348039110000').replace(/\s+/g, '')}`}
            className="p-2.5 bg-[#08254D] hover:bg-[#071F42] border border-white/16 rounded-xl flex flex-col justify-between transition"
          >
            <span className="text-white font-bold">{settings?.emergencyPhone2Label || 'General Hospital'}</span>
            <span className="text-[#FFC928] font-semibold mt-1">
              {settings?.emergencyPhone2Display || '+234 803 911 0000'}
            </span>
          </a>
        </div>
      </div>

      {/* Platform Support Information Card */}
      <div className="bg-[#0B2D5C] border border-white/16 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Headphones className="w-4 h-4 text-[#FFC928]" />
            <span>{settings?.platformName || 'Shendam Connect'} Platform & Support</span>
          </div>
          <span className="text-[10px] bg-[#FFC928]/15 text-[#FFC928] font-bold px-2 py-0.5 rounded border border-[#FFC928]/30 uppercase">
            Official Support
          </span>
        </div>
        <p className="text-xs text-[#D5DCE8] leading-relaxed">
          {settings?.supportDescription ||
            'Need assistance with your business listing, bookings, or community inquiries? Reach our dedicated support team.'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
          {settings?.supportEmail && (
            <a
              href={`mailto:${settings.supportEmail}`}
              className="flex items-center gap-2.5 p-2.5 bg-[#08254D] hover:bg-[#071F42] border border-white/16 rounded-xl text-white transition group"
            >
              <Mail className="w-4 h-4 text-[#FFC928] shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-[#9BAABD] uppercase font-bold">Support Email</span>
                <span className="block text-xs font-semibold text-white group-hover:text-[#FFC928] truncate">
                  {settings.supportEmail}
                </span>
              </div>
            </a>
          )}
          {settings?.supportPhone && (
            <a
              href={`tel:${settings.supportPhone.replace(/\s+/g, '')}`}
              className="flex items-center gap-2.5 p-2.5 bg-[#08254D] hover:bg-[#071F42] border border-white/16 rounded-xl text-white transition group"
            >
              <Phone className="w-4 h-4 text-[#FFC928] shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] text-[#9BAABD] uppercase font-bold">Helpline</span>
                <span className="block text-xs font-semibold text-white group-hover:text-[#FFC928] truncate">
                  {settings.supportPhone}
                </span>
              </div>
            </a>
          )}
        </div>
        {(settings?.supportHours || settings?.supportWhatsapp) && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-[#9BAABD] border-t border-white/8">
            {settings?.supportHours && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#FFC928]" />
                <span>{settings.supportHours}</span>
              </div>
            )}
            {settings?.supportWhatsapp && (
              <a
                href={`https://wa.me/${settings.supportWhatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition font-semibold"
              >
                <span>WhatsApp Live Chat &rarr;</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Business Listing Button */}
      <button
        onClick={onOpenAddBusiness}
        className="w-full py-3.5 bg-[#FFC928] hover:bg-[#F5B800] active:scale-95 text-[#061B3A] font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
      >
        <PlusCircle className="w-4 h-4" />
        <span>List Your Business on {settings?.platformName || 'Shendam Connect'}</span>
      </button>

      {/* Feedback & Feature Requests Button */}
      {onOpenFeedback && (
        <button
          onClick={() => onOpenFeedback('feature_request')}
          className="w-full py-3 bg-[#08254D] hover:bg-[#061D40] border border-white/16 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        >
          <MessageSquarePlus className="w-4 h-4 text-[#FFC928]" />
          <span>Submit Feature Request or Report an Issue</span>
        </button>
      )}

      {/* Admin Portal Button */}
      {onOpenAdmin && (
        <button
          onClick={onOpenAdmin}
          className="w-full py-3 bg-[#0B2D5C] hover:bg-[#08254D] border border-white/16 text-[#FFC928] font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-[#FFC928]" />
          <span>{settings?.platformName || 'Shendam Connect'} Admin Portal</span>
        </button>
      )}

      {/* App Info */}
      <div className="text-center pt-2 text-[11px] text-[#9BAABD]">
        <p className="font-bold text-white">{(settings?.platformName || 'SHENDAM CONNECT').toUpperCase()} v1.0</p>
        <p>Discover. Connect. Experience.</p>
      </div>
    </div>
  );
};
