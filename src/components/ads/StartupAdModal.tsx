import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  MessageCircle,
  Phone,
  Store,
  Sparkles,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { Advertisement, AdvertisementSettings } from '../../types';
import { fetchPublicAds, fetchAdSettings, recordAdClick, recordAdImpression } from '../../services/adService';

interface StartupAdModalProps {
  onSelectPlace?: (placeId: string) => void;
}

const STORAGE_KEY_LAST_SHOWN = 'shendam_last_startup_ad_time';

export const StartupAdModal: React.FC<StartupAdModalProps> = ({ onSelectPlace }) => {
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkStartupAd() {
      try {
        const settings = await fetchAdSettings();
        if (!isMounted) return;

        // Verify if startup ads are enabled in settings
        if (settings && settings.startupAdsEnabled === false) {
          return;
        }

        const frequencyHours = settings?.startupFrequencyHours || 12;
        const lastShown = localStorage.getItem(STORAGE_KEY_LAST_SHOWN);
        if (lastShown) {
          const elapsedHours = (Date.now() - parseInt(lastShown, 10)) / (1000 * 60 * 60);
          if (elapsedHours < frequencyHours) {
            return;
          }
        }

        // Fetch active startup ad
        const ads = await fetchPublicAds('startup_popup');
        if (!isMounted || ads.length === 0) return;

        const selectedAd = ads[0];
        setAd(selectedAd);
        setVisible(true);

        // Record impression & update frequency timer
        recordAdImpression(selectedAd.id);
        localStorage.setItem(STORAGE_KEY_LAST_SHOWN, Date.now().toString());
      } catch (err) {
        console.warn('[StartupAd] Notice:', err);
      }
    }

    // Delay 1.5s after app mount so splash/initial layout finishes loading smoothly
    const timer = setTimeout(() => {
      checkStartupAd();
    }, 1500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  if (!visible || !ad) return null;

  const handleClose = () => {
    setVisible(false);
  };

  const handleAction = () => {
    recordAdClick(ad.id);
    setVisible(false);

    if (ad.destinationType === 'listing' && (ad.destinationListingId || ad.linkedPlaceId) && onSelectPlace) {
      onSelectPlace(ad.destinationListingId || ad.linkedPlaceId || '');
      return;
    }

    if (ad.destinationType === 'whatsapp' || (ad.destinationWhatsApp && !ad.destinationPhone && !ad.destinationUrl)) {
      const num = (ad.destinationWhatsApp || '').replace(/[^0-9]/g, '');
      const text = encodeURIComponent(`Hello ${ad.businessName}, I saw your promotion on Shendam Connect.`);
      window.open(`https://wa.me/${num}?text=${text}`, '_blank', 'noopener,noreferrer');
      return;
    }

    if (ad.destinationType === 'phone' || (ad.destinationPhone && !ad.destinationUrl)) {
      window.location.href = `tel:${ad.destinationPhone}`;
      return;
    }

    const targetUrl = ad.destinationUrl || ad.linkUrl;
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const creativeImg = ad.bannerImageUrl || ad.imageUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      id="startup-ad-modal"
    >
      <div
        className="relative w-full max-w-lg bg-[#04142F] border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          type="button"
          aria-label="Close"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/80 hover:text-white flex items-center justify-center border border-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Media Banner */}
        {creativeImg && (
          <div className="relative h-52 sm:h-60 w-full bg-slate-900 overflow-hidden">
            <img
              src={creativeImg}
              alt={ad.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#04142F] via-[#04142F]/30 to-transparent" />
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-md">
                <Sparkles className="w-3 h-3 fill-slate-950" />
                Featured Partner
              </span>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 md:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-amber-400 tracking-wide uppercase">
                {ad.businessName}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
              {ad.title}
            </h2>

            {ad.description && (
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                {ad.description}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleAction}
              type="button"
              className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
            >
              {ad.destinationType === 'whatsapp' ? (
                <>
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </>
              ) : ad.destinationType === 'phone' ? (
                <>
                  <Phone className="w-4 h-4" />
                  <span>Call Now</span>
                </>
              ) : ad.destinationType === 'listing' ? (
                <>
                  <Store className="w-4 h-4" />
                  <span>View Details</span>
                </>
              ) : (
                <>
                  <span>Learn More</span>
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              onClick={handleClose}
              type="button"
              className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs uppercase tracking-wider transition-all"
            >
              Continue to Shendam Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
