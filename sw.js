// ════════════════════════════════════════
// SERVICE WORKER — Bar Pi
// Stratégies :
//   - HTML & JS locaux  → NETWORK-FIRST (toujours la dernière version)
//   - Reste (icônes, fonts, libs CDN)  → STALE-WHILE-REVALIDATE
//   - Firebase auth/db  → bypass complet (jamais en cache)
// ════════════════════════════════════════
const CACHE = 'bar-pi-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './bar.html',
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
  'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async c => {
      await c.addAll(CORE_ASSETS);
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

// Permet de forcer un skipWaiting depuis la page si besoin
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Bypass : Firebase auth & realtime DB ne doivent jamais passer par le cache
  if (url.host.includes('firebaseio.com') ||
      url.host.includes('firebasedatabase.app') ||
      url.host.includes('identitytoolkit.googleapis.com') ||
      url.host.includes('securetoken.googleapis.com')) {
    return;
  }

  const isSameOrigin = url.origin === self.location.origin;
  const isHTML =
    req.mode === 'navigate' ||
    req.destination === 'document' ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/' ||
    url.pathname.endsWith('/');
  const isOwnScript = isSameOrigin && (url.pathname.endsWith('.js') || url.pathname.endsWith('.json'));

  // ──────── NETWORK-FIRST pour HTML & JS/JSON locaux ────────
  if (isHTML || isOwnScript) {
    e.respondWith(
      fetch(req).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  // ──────── STALE-WHILE-REVALIDATE pour le reste ────────
  e.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
