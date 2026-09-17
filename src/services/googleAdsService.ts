import { GoogleAdsConfig } from '../types';

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

let scriptInjected = false;

/**
 * Detects whether the current runtime is a standalone PWA or standard browser.
 */
export function getRuntimePlatform(): 'pwa' | 'native' | 'web' {
  if (typeof window === 'undefined') return 'web';

  const isStandalonePWA =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  const isNativeShell =
    Boolean((window as any).Capacitor) ||
    Boolean((window as any).cordova) ||
    Boolean((window as any).AndroidBridge);

  if (isNativeShell) return 'native';
  if (isStandalonePWA) return 'pwa';
  return 'web';
}

/**
 * Validates whether Google Ads can and should be displayed.
 * Does NOT pretend Google ads are active if credentials/config are missing.
 */
export function isGoogleAdsActive(config?: GoogleAdsConfig | null): boolean {
  if (!config) return false;
  if (!config.enabled) return false;
  const clientId = config.clientId || (import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID as string) || '';
  if (!clientId || clientId.trim() === '' || clientId === 'MY_GOOGLE_ADS_CLIENT_ID') {
    return false;
  }
  return true;
}

/**
 * Safely loads Google AdSense script into document head once.
 */
export function initializeGoogleAds(config?: GoogleAdsConfig | null): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  if (!isGoogleAdsActive(config)) {
    return false;
  }

  const clientId = (config?.clientId || import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID || '').trim();
  if (!clientId) return false;

  if (scriptInjected) return true;

  try {
    const existingScript = document.querySelector(`script[src*="pagead2.googlesyndication.com"]`);
    if (existingScript) {
      scriptInjected = true;
      return true;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
    script.crossOrigin = 'anonymous';
    script.onerror = (e) => {
      console.warn('[GoogleAds] Failed to load AdSense script:', e);
    };
    document.head.appendChild(script);
    scriptInjected = true;
    return true;
  } catch (err) {
    console.warn('[GoogleAds] Error initializing script tag:', err);
    return false;
  }
}

/**
 * Safely requests an ad fill from Google AdSense.
 */
export function pushGoogleAd(): void {
  if (typeof window === 'undefined') return;
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (err) {
    console.warn('[GoogleAds] Ad push notice:', err);
  }
}
