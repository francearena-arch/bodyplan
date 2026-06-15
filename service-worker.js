const CACHE_NAME='bodyplan-v35';
const ASSETS = ['./','./index.html?v=35','./manifest.json?v=35','./service-worker.js?v=35','./icons/icon-v35-192.png?v=35','./icons/icon-v35-512.png?v=35','./assets/body-heatmap-front-v35.png?v=35','./assets/body-heatmap-back-v35.png?v=35','./icons/icon-192.png?v=35','./icons/icon-512.png?v=35','./apple-touch-icon.png?v=35','./favicon.png?v=35'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', event => { event.respondWith(fetch(event.request).then(response => { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)); return response; }).catch(() => caches.match(event.request))); });
