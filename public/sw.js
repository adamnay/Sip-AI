const CACHE = 'sip-ai-v3';

const PRECACHE = [
  '/',
  '/logo.png',
  '/scan-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE))
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
  // Only cache GET requests; pass through all API calls
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('anthropic')) return;
  if (e.request.url.includes('supabase')) return;

  // Network-first for JS/CSS assets so new deploys are always picked up
  const isAsset = e.request.url.match(/\.(js|css)(\?|$)/);
  if (isAsset) {
    e.respondWith(
      fetch(e.request).then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

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
