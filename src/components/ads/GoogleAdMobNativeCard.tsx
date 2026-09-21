import React, { useEffect, useRef, useState } from 'react';
import { GoogleAdsConfig } from '../../types';
import { fetchAdSettings } from '../../services/adService';
import {
  isAndroidNative,
  isAdMobNativeEnabled,
  initializeAdMob,
  loadNativeAdvancedAd,
  showNativeAdView,
  destroyNativeAdView,
  NativeAdData,
  GOOGLE_ADMOB_NATIVE_TEST_AD_UNIT_ID,
  GOOGLE_ADMOB_NATIVE_PROD_AD_UNIT_ID
} from '../../services/admobNativeService';
import { GoogleAdSlot } from './GoogleAdSlot';

interface GoogleAdMobNativeCardProps {
  placement?: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Google AdMob Native Advanced Ad Component for Android
 * - Uses native Android NativeAdView with Google Mobile Ads SDK
 * - Uses official Google Test Ad Unit during development
 * - Completely separated from local Shendam Connect businesses
 * - Falls back cleanly to Hero Fallback / Web AdSense or renders null when disabled
 */
export const GoogleAdMobNativeCard: React.FC<GoogleAdMobNativeCardProps> = ({
  placement = 'home',
  className = '',
  fallback = null
}) => {
  const [config, setConfig] = useState<GoogleAdsConfig | null>(null);
  const [isNative, setIsNative] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adFailed, setAdFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adData, setAdData] = useState<NativeAdData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const isAndroid = isAndroidNative();
    setIsNative(isAndroid);

    async function initAd() {
      setIsLoading(true);
      try {
        const settings = await fetchAdSettings();
        if (!isMounted) return;

        const gConfig = settings?.googleAds || null;
        setConfig(gConfig);

        const isEnabled = isAdMobNativeEnabled(gConfig);
        const isPlacementActive = gConfig?.placements ? gConfig.placements[placement] !== false : true;

        if (!isEnabled || !isPlacementActive) {
          setIsLoading(false);
          setAdFailed(true);
          return;
        }

        if (isAndroid) {
          const testMode = gConfig?.testMode ?? true;
          const adUnitId = testMode
            ? GOOGLE_ADMOB_NATIVE_TEST_AD_UNIT_ID
            : (gConfig?.slotId || GOOGLE_ADMOB_NATIVE_PROD_AD_UNIT_ID);

          await initializeAdMob(testMode);
          const result = await loadNativeAdvancedAd({
            adUnitId,
            testMode
          });

          if (isMounted) {
            if (result && result.loaded) {
              setAdData(result);
              setAdLoaded(true);
              setAdFailed(false);
            } else {
              setAdFailed(true);
            }
          }
        }
      } catch (err) {
        console.warn('[AdMob Native] Error during initialization:', err);
        if (isMounted) setAdFailed(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAd();

    return () => {
      isMounted = false;
      if (isAndroid) {
        destroyNativeAdView();
      }
    };
  }, [placement]);

  // Position native view over web container when ad is loaded on Android
  useEffect(() => {
    if (isNative && adLoaded && containerRef.current) {
      const updatePosition = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          showNativeAdView({
            top: Math.round(rect.top),
            left: Math.round(rect.left),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          });
        }
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, { passive: true });

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [isNative, adLoaded]);

  // On Web / Browser: Delegate to GoogleAdSlot (which renders web AdSense if enabled, or falls back)
  if (!isNative) {
    const isWebAdsConfigured = config && config.enabled && (config.placements ? config.placements[placement] !== false : true);
    if (isWebAdsConfigured) {
      return <GoogleAdSlot placement={placement} className={className} />;
    }
    return <>{fallback}</>;
  }

  // On Android: If loading and ads are configured, show a refined shimmer placeholder fitting the hero space
  if (isLoading) {
    return (
      <div
        className={`w-full px-4 sm:px-5 mt-4 z-10 ${className}`}
        aria-label="Loading advertisement"
      >
        <div className="relative w-full h-52 sm:h-64 rounded-2xl sm:rounded-3xl bg-[#04142F] border border-white/12 p-4 sm:p-6 overflow-hidden flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          {/* Animated Shimmer Sweep Light */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent pointer-events-none" />

          {/* Ad Attribution Top Header Placeholder */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-4 bg-[#FFC928]/30 rounded flex items-center justify-center">
              <span className="text-[9px] font-black text-[#FFC928]/70 uppercase">Ad</span>
            </div>
            <div className="w-36 h-3 bg-white/15 rounded-full" />
          </div>

          {/* Main Content Area (Headline & Description Shimmer) */}
          <div className="space-y-2.5 my-auto">
            <div className="w-3/4 h-5 sm:h-6 bg-white/20 rounded-lg" />
            <div className="w-full h-3.5 bg-white/10 rounded-full" />
            <div className="w-2/3 h-3.5 bg-white/10 rounded-full" />
          </div>

          {/* Action CTA Button Shimmer */}
          <div className="pt-2">
            <div className="w-28 h-8 bg-[#FFC928]/25 rounded-xl border border-[#FFC928]/30" />
          </div>
        </div>
      </div>
    );
  }

  // On Android: If disabled or failed to load, gracefully fall back to hero content or collapse
  if (!adLoaded || adFailed) {
    return <>{fallback}</>;
  }

  // On Android: When Native Ad is loaded
  return (
    <div className={`w-full px-4 sm:px-5 mt-4 z-10 ${className}`}>
      <div
        ref={containerRef}
        id={`admob-native-container-${placement}`}
        className="relative w-full h-52 sm:h-64 rounded-2xl sm:rounded-3xl bg-[#04142F] border border-white/16 shadow-[0_8px_30px_rgba(0,0,0,0.45)] p-4 sm:p-6 overflow-hidden flex flex-col justify-between"
        aria-label="Google AdMob Native Advertisement"
      >
        {/* Ad Attribution Header */}
        <div className="flex items-center gap-2">
          <span className="bg-[#FFC928] text-[#020B18] text-[10px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase">
            Ad
          </span>
          <span className="text-[11px] text-[#9BAABD] font-medium">
            Sponsored Google Advertisement
          </span>
        </div>

        {/* Content container filled by NativeAdView overlay on Android */}
        <div className="space-y-1 my-auto">
          {adData?.headline && (
            <h3 className="font-brand-sans font-bold text-white text-lg sm:text-xl tracking-wide leading-tight">
              {adData.headline}
            </h3>
          )}
          {adData?.body && (
            <p className="text-[#D5DCE8] text-xs sm:text-sm font-medium line-clamp-2">
              {adData.body}
            </p>
          )}
        </div>

        {/* Call to action element */}
        {adData?.callToAction && (
          <div>
            <span className="inline-block bg-[#FFC928] text-[#061B3A] font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow">
              {adData.callToAction}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
