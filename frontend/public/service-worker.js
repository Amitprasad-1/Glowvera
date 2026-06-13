const CACHE_NAME = 'glowvera-cache-v3';
const STATIC_ASSETS = [
  '/manifest.json',
  '/glowvera_logo.png',
  '/glowvera_hero.png',
  '/cat_hair.png',
  '/cat_grooming.png',
  '/cat_skin.png',
  '/cat_spa.png',
  '/favicon.ico',
  '/stylist_arjun.png',
  '/stylist_shreya.png',
  '/stylist_vikram.png',
  '/stylist_pooja.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => console.log('Caching static assets error:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network-First for main page navigations to prevent cache-locking old bundle hashes
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-First for static assets, Network-First fallback for general chunks
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(response => {
        if (event.request.method === 'GET' && !url.pathname.includes('/api/')) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
