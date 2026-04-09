const SHELL = ['/', '/index.html', '/style.css', '/app.js', '/manifest.json'];
const CACHE_NAME = 'season-me-v2';
const IMAGE_CACHE = 'season-me-images-v1';
const IMAGE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

// Install: pre-cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== IMAGE_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for shell, network-first for images
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin requests (except CDN)
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !url.hostname.includes('cloudflare.com') && !url.hostname.includes('gstatic.com') && !url.hostname.includes('googleapis.com') && !url.hostname.includes('unpkg.com') && !url.hostname.includes('cdn.jsdelivr.net') && !url.hostname.includes('cartocdn.com') && !url.hostname.includes('supabase.co') && !url.hostname.includes('openstreetmap.org') && !url.hostname.includes('nominatim')) return;

  // Quiz images: cache on first use
  if (url.pathname.startsWith('/images/')) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) {
            // Check age
            const date = cached.headers.get('sw-cache-date');
            if (date && Date.now() - parseInt(date) < IMAGE_MAX_AGE) return cached;
          }
          return fetch(event.request).then(response => {
            if (response.ok) {
              const cloned = response.clone();
              const headers = new Headers(cloned.headers);
              headers.set('sw-cache-date', String(Date.now()));
              const body = cloned.body;
              const newResponse = new Response(body, { status: cloned.status, statusText: cloned.statusText, headers });
              cache.put(event.request, newResponse);
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // CDN resources (html2canvas, fonts): network-first, fallback to cache
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // App shell: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
