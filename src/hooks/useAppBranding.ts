import { useState, useEffect, useCallback, SyntheticEvent } from 'react';
import defaultLogoImg from '../assets/shendam_logo.jpg';
import { BrandingConfig } from '../types';

export const DEFAULT_LOGO = defaultLogoImg;

const getInitialBranding = (): {
  branding: BrandingConfig;
  splash: string;
  homepage: string;
} => {
  const defaultSeasonal = {
    activeTheme: 'none' as const,
    customTitle: '',
    customGreeting: '',
    customBannerUrl: null,
    accentColor: '#FFC928',
    showCelebrationBadge: false
  };

  const fallback = {
    branding: {
      splashLogo: null,
      homepageLogo: null,
      favicon: null,
      homepageBackground: null,
      heroBackground: null,
      heroVideoUrl: null,
      seasonal: defaultSeasonal
    },
    splash: DEFAULT_LOGO,
    homepage: DEFAULT_LOGO
  };

  if (typeof window === 'undefined') return fallback;

  try {
    const cached = localStorage.getItem('shendam_branding_v2');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        const hp = parsed.homepageLogo || null;
        const sp = parsed.splashLogo || hp || null;
        return {
          branding: {
            ...fallback.branding,
            ...parsed,
            seasonal: { ...defaultSeasonal, ...(parsed.seasonal || {}) }
          },
          splash: sp || DEFAULT_LOGO,
          homepage: hp || DEFAULT_LOGO
        };
      }
    }
    const legacyHeader = localStorage.getItem('scHeaderLogo');
    const legacySplash = localStorage.getItem('scSplashLogo');
    if (legacyHeader || legacySplash) {
      const hp = legacyHeader || null;
      const sp = legacySplash || hp || null;
      return {
        branding: {
          ...fallback.branding,
          homepageLogo: hp,
          splashLogo: sp
        },
        splash: sp || DEFAULT_LOGO,
        homepage: hp || DEFAULT_LOGO
      };
    }
  } catch {
    // Non-fatal fallback
  }

  return fallback;
};

export const useAppBranding = () => {
  const [initialState] = useState(getInitialBranding);
  const [branding, setBranding] = useState<BrandingConfig>(initialState.branding);

  // State for display logos that have been preloaded & verified
  const [verifiedSplashLogo, setVerifiedSplashLogo] = useState<string>(initialState.splash);
  const [verifiedHomepageLogo, setVerifiedHomepageLogo] = useState<string>(initialState.homepage);

  // Helper to verify custom image URLs before activating them in display state
  const verifyAndSetLogo = useCallback((targetUrl: string | null | undefined, fallbackValue: string, setter: (url: string) => void) => {
    if (!targetUrl || targetUrl.trim() === '' || targetUrl === DEFAULT_LOGO) {
      setter(fallbackValue);
      return;
    }

    const img = new Image();
    img.onload = () => {
      setter(targetUrl);
    };
    img.onerror = () => {
      console.warn('[Branding] Custom logo URL failed to load, maintaining fallback:', targetUrl);
      setter(fallbackValue);
    };
    img.src = targetUrl;
  }, []);

  const loadBranding = useCallback(() => {
    // 1. First load from localStorage cache if available for instant paint
    try {
      const cached = localStorage.getItem('shendam_branding_v2');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          setBranding((prev) => ({ ...prev, ...parsed }));
          const hp = parsed.homepageLogo || null;
          const sp = parsed.splashLogo || hp || null;
          if (hp) verifyAndSetLogo(hp, DEFAULT_LOGO, setVerifiedHomepageLogo);
          if (sp) verifyAndSetLogo(sp, hp || DEFAULT_LOGO, setVerifiedSplashLogo);
        }
      }
    } catch (e) {
      // Non-fatal cache read
    }

    // 2. Fetch authoritative state from persistent database
    fetch('/api/branding')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const newBranding: BrandingConfig = {
            splashLogo: data.splashLogo || null,
            homepageLogo: data.homepageLogo || null,
            favicon: data.favicon || null,
            homepageBackground: data.homepageBackground || null,
            heroBackground: data.heroBackground || null,
            heroVideoUrl: data.heroVideoUrl || null,
            seasonal: data.seasonal || {
              activeTheme: 'none',
              customTitle: '',
              customGreeting: '',
              customBannerUrl: null,
              accentColor: '#FFC928',
              showCelebrationBadge: false
            }
          };
          setBranding(newBranding);

          const authoritativeHp = newBranding.homepageLogo || null;
          const authoritativeSp = newBranding.splashLogo || authoritativeHp || null;

          // Verify image URLs before switching UI state
          verifyAndSetLogo(authoritativeHp, DEFAULT_LOGO, setVerifiedHomepageLogo);
          verifyAndSetLogo(authoritativeSp, authoritativeHp || DEFAULT_LOGO, setVerifiedSplashLogo);

          // Update favicon if valid, else keep default
          if (newBranding.favicon) {
            const faviconImg = new Image();
            faviconImg.onload = () => {
              const faviconEl = document.getElementById('app-favicon') as HTMLLinkElement;
              if (faviconEl) faviconEl.href = newBranding.favicon!;
            };
            faviconImg.src = newBranding.favicon;
          }

          try {
            localStorage.setItem('shendam_branding_v2', JSON.stringify(data));
            if (newBranding.homepageLogo) {
              localStorage.setItem('scHeaderLogo', newBranding.homepageLogo);
            } else {
              localStorage.removeItem('scHeaderLogo');
            }
            if (newBranding.splashLogo) {
              localStorage.setItem('scSplashLogo', newBranding.splashLogo);
            } else {
              localStorage.removeItem('scSplashLogo');
            }
          } catch (e) {
            // Non-fatal
          }
        }
      })
      .catch((err) => {
        console.warn('[Branding Hook] Could not fetch server branding:', err);
      });
  }, [verifyAndSetLogo]);

  useEffect(() => {
    loadBranding();
    const handleUpdate = () => loadBranding();
    window.addEventListener('sc-branding-updated', handleUpdate);
    return () => window.removeEventListener('sc-branding-updated', handleUpdate);
  }, [loadBranding]);

  // Image error fallback handler for DOM img elements
  const handleImageError = useCallback((e: SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    if (target.src !== DEFAULT_LOGO) {
      target.src = DEFAULT_LOGO;
    }
  }, []);

  return {
    branding,
    splashLogo: verifiedSplashLogo || verifiedHomepageLogo || DEFAULT_LOGO,
    homepageLogo: verifiedHomepageLogo || DEFAULT_LOGO,
    defaultLogo: DEFAULT_LOGO,
    favicon: branding.favicon || null,
    homepageBackground: branding.homepageBackground || null,
    heroBackground: branding.heroBackground || null,
    heroVideoUrl: branding.heroVideoUrl || null,
    seasonal: branding.seasonal || {
      activeTheme: 'none',
      customTitle: '',
      customGreeting: '',
      customBannerUrl: null,
      accentColor: '#FFC928',
      showCelebrationBadge: false
    },
    handleImageError,
    refreshBranding: loadBranding
  };
};
