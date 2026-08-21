/**
 * Offline Caching & Service Worker Management for Shendam Connect
 * Guarantees seamless offline access to saved hotels, restaurants, emergency numbers, and attractions.
 */

import { useEffect, useState } from 'react';
import { Place } from '../types';

const PLACES_CACHE_KEY = 'shendam_offline_places_v1';
const SAVED_IDS_CACHE_KEY = 'shendam_offline_saved_ids_v1';
const LAST_SYNC_KEY = 'shendam_offline_last_sync';

/**
 * Register Service Worker for PWA / offline support
 */
export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[Shendam Connect] Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('[Shendam Connect] Service Worker registration skipped or failed:', error);
        });
    });
  }
}

/**
 * Cache current place listings to localStorage and CacheStorage
 */
export function cachePlacesLocally(places: Place[], savedIds: string[]): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PLACES_CACHE_KEY, JSON.stringify(places));
    localStorage.setItem(SAVED_IDS_CACHE_KEY, JSON.stringify(savedIds));
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

    // Pre-cache images via Service Worker / CacheStorage
    const savedPlaces = places.filter((p) => savedIds.includes(p.id));
    const imageUrlsToCache: string[] = [];

    savedPlaces.forEach((p) => {
      if (p.image) imageUrlsToCache.push(p.image);
      if (p.gallery && p.gallery.length > 0) {
        imageUrlsToCache.push(...p.gallery);
      }
    });

    // Notify Service Worker to pre-cache saved place images
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_PLACE_IMAGES',
        urls: imageUrlsToCache
      });
    } else if ('caches' in window) {
      // Fallback direct CacheStorage caching
      caches.open('shendam-images-v1').then((cache) => {
        imageUrlsToCache.forEach((url) => {
          fetch(url, { mode: 'cors' })
            .then((res) => {
              if (res.ok) cache.put(url, res);
            })
            .catch(() => {});
        });
      });
    }
  } catch (err) {
    console.warn('[Shendam Connect] Failed to cache places offline:', err);
  }
}

/**
 * Retrieve cached places if offline
 */
export function getCachedPlaces(): { places: Place[]; savedIds: string[]; lastSync: string | null } {
  try {
    if (typeof window === 'undefined') return { places: [], savedIds: [], lastSync: null };
    const rawPlaces = localStorage.getItem(PLACES_CACHE_KEY);
    const rawSavedIds = localStorage.getItem(SAVED_IDS_CACHE_KEY);
    const lastSync = localStorage.getItem(LAST_SYNC_KEY);

    return {
      places: rawPlaces ? JSON.parse(rawPlaces) : [],
      savedIds: rawSavedIds ? JSON.parse(rawSavedIds) : [],
      lastSync
    };
  } catch {
    return { places: [], savedIds: [], lastSync: null };
  }
}

/**
 * Hook to monitor online/offline network status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  });

  const [simulatedOffline, setSimulatedOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline: simulatedOffline ? false : isOnline,
    simulatedOffline,
    toggleSimulateOffline: () => setSimulatedOffline((prev) => !prev)
  };
}
