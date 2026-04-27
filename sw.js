const CACHE = 'bar-scout-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];
const OPTIONAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/firebase/9.23.0/firebase-app-compat.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/firebase/9.23.0/firebase-auth-compat.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/firebase/9.23.0/firebase-database-compat.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async c => {
      // Les assets locaux DOIVENT être en cache
      await c.addAll(CORE_ASSETS);
      // Les CDN externes : on tolère les échecs pour ne pas bloquer l'install
      await Promise.all(OPTIONAL_ASSETS.map(url =>
        c.add(url).catch(err => console.warn('SW: skip cache', url, err))
      ));
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('firebaseio.com') || e.request.url.includes('googleapis.com/identitytoolkit')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
