// Service Worker for SHENDAM CONNECT
// Enables offline access to saved places, listings, and place media in Shendam

const CACHE_NAME = 'shendam-connect-v1';
const IMAGE_CACHE_NAME = 'shendam-images-v1';
const PLACES_DATA_CACHE = 'shendam-places-data-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. Install event: pre-cache critical shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW pre-cache non-fatal error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate event: clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== IMAGE_CACHE_NAME && key !== PLACES_DATA_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch event: Stale-While-Revalidate for images and cache-first for offline places
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests or chrome-extension URLs
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Handle external image requests (e.g., Unsplash place photos)
  if (request.destination === 'image' || url.hostname.includes('unsplash.com') || url.pathname.match(/\.(png|jpg|jpeg|svg|webp)$/i)) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          // Return cached image immediately, refresh in background if online
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
            })
            .catch(() => {/* Offline, ignore */});
          return cachedResponse;
        }

        // Not cached yet, fetch from network and cache
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // Fallback for offline images
            return cachedResponse || new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="100%" height="100%" fill="#0D1A30"/><text x="50%" y="50%" fill="#D4A017" font-size="14" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">Shendam Connect (Offline)</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          });
      })
    );
    return;
  }

  // Handle standard navigation & asset requests: Network first, falling back to cache
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline: Content not available', {
          status: 503,
          statusText: 'Service Unavailable (Offline)'
        });
      })
  );
});

// 4. Message event: allow client to request explicit pre-caching of place images
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_PLACE_IMAGES') {
    const urls = event.data.urls || [];
    caches.open(IMAGE_CACHE_NAME).then((cache) => {
      urls.forEach((imgUrl) => {
        fetch(imgUrl, { mode: 'cors' })
          .then((res) => {
            if (res && res.status === 200) {
              cache.put(imgUrl, res);
            }
          })
          .catch(() => {});
      });
    });
  }
});
