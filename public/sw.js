const CACHE = 'sip-ai-v4';

const PRECACHE = [
  '/logo.png',
  '/scan-icon.png',
  '/icon.png',
];

self.addEventListener('install', (e) => {
  // Clear ALL old caches immediately on install
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => caches.open(CACHE).then((c) => c.addAll(PRECACHE)))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // Always go to network for API calls and JS/CSS (never cache these)
  const url = e.request.url;
  if (
    url.includes('anthropic') ||
    url.includes('supabase') ||
    url.match(/\.(js|css)(\?|$)/)
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Cache-first for images/fonts
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request).then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
        return res;
      });
      return cached ?? network;
    })
  );
});
