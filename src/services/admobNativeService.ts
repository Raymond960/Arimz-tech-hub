import { Capacitor, registerPlugin } from '@capacitor/core';
import { GoogleAdsConfig } from '../types';

export interface NativeAdData {
  loaded: boolean;
  adUnitId: string;
  headline?: string;
  body?: string;
  callToAction?: string;
  advertiser?: string;
  store?: string;
  price?: string;
  starRating?: number;
  hasMedia?: boolean;
}

export interface AdMobNativePluginInterface {
  initialize(options?: { testMode?: boolean }): Promise<{ initialized: boolean; testMode: boolean }>;
  loadNativeAd(options?: { adUnitId?: string; testMode?: boolean }): Promise<NativeAdData>;
  showNativeAd(options?: { top?: number; left?: number; width?: number; height?: number }): Promise<{ shown: boolean }>;
  hideNativeAd(): Promise<{ hidden: boolean }>;
  destroyNativeAd(): Promise<{ destroyed: boolean }>;
  getAdStatus(): Promise<{ initialized: boolean; hasLoadedAd: boolean; isShowing: boolean }>;
}

// Google Official Android Native Advanced Test Ad Unit ID
export const GOOGLE_ADMOB_NATIVE_TEST_AD_UNIT_ID = 'ca-app-pub-3940256099942544/2247696110';

// Shendam Connect Production Native Ad Unit ID
export const GOOGLE_ADMOB_NATIVE_PROD_AD_UNIT_ID = 'ca-app-pub-1826892014871317/1741617146';

// Shendam Connect AdMob App ID
export const GOOGLE_ADMOB_APP_ID = 'ca-app-pub-1826892014871317~8604829389';

const AdMobNative = registerPlugin<AdMobNativePluginInterface>('AdMobNative');

/**
 * Checks if running inside an Android Native shell.
 */
export function isAndroidNative(): boolean {
  if (typeof window === 'undefined') return false;
  return Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('AdMobNative');
}

/**
 * Validates if AdMob Native ads are active and permitted to run.
 */
export function isAdMobNativeEnabled(config?: GoogleAdsConfig | null): boolean {
  // Respect environment variable and database settings
  const envEnabled = import.meta.env.VITE_GOOGLE_ADS_ENABLED === 'true' || import.meta.env.GOOGLE_ADS_ENABLED === 'true';
  const configEnabled = config?.enabled === true;
  return envEnabled || configEnabled;
}

/**
 * Initializes Google Mobile Ads SDK for Android.
 */
export async function initializeAdMob(testMode = true): Promise<boolean> {
  if (!isAndroidNative()) {
    return false;
  }
  try {
    const res = await AdMobNative.initialize({ testMode });
    return res.initialized;
  } catch (err) {
    console.warn('[AdMobNative] Initialization error:', err);
    return false;
  }
}

/**
 * Requests and loads a Native Advanced Ad from Google AdMob.
 * Uses official test ad unit by default for safety during development.
 */
export async function loadNativeAdvancedAd(options?: {
  adUnitId?: string;
  testMode?: boolean;
}): Promise<NativeAdData | null> {
  if (!isAndroidNative()) {
    return null;
  }

  const testMode = options?.testMode ?? true;
  const adUnitId = options?.adUnitId || (testMode ? GOOGLE_ADMOB_NATIVE_TEST_AD_UNIT_ID : GOOGLE_ADMOB_NATIVE_PROD_AD_UNIT_ID);

  try {
    const data = await AdMobNative.loadNativeAd({
      adUnitId,
      testMode
    });
    return data;
  } catch (err) {
    console.warn('[AdMobNative] Load native ad failed:', err);
    return null;
  }
}

/**
 * Displays the native Android NativeAdView over the allocated container area.
 */
export async function showNativeAdView(bounds?: {
  top?: number;
  left?: number;
  width?: number;
  height?: number;
}): Promise<boolean> {
  if (!isAndroidNative()) return false;
  try {
    const res = await AdMobNative.showNativeAd(bounds);
    return res.shown;
  } catch (err) {
    console.warn('[AdMobNative] Show native ad view error:', err);
    return false;
  }
}

/**
 * Hides the native Android NativeAdView.
 */
export async function hideNativeAdView(): Promise<boolean> {
  if (!isAndroidNative()) return false;
  try {
    const res = await AdMobNative.hideNativeAd();
    return res.hidden;
  } catch (err) {
    console.warn('[AdMobNative] Hide native ad view error:', err);
    return false;
  }
}

/**
 * Properly cleans up and destroys active native ad.
 */
export async function destroyNativeAdView(): Promise<boolean> {
  if (!isAndroidNative()) return false;
  try {
    const res = await AdMobNative.destroyNativeAd();
    return res.destroyed;
  } catch (err) {
    console.warn('[AdMobNative] Destroy native ad view error:', err);
    return false;
  }
}
