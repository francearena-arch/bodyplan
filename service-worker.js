const CACHE_NAME='bodyplan-v33';
const ASSETS = ['./','./index.html','./manifest.json?v=33','./service-worker.js','./icons/icon-v32-192.png','./icons/icon-v32-512.png','./assets/body-heatmap-front-v33.png','./assets/body-heatmap-back-v33.png'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', event => { event.respondWith(fetch(event.request).then(response => { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)); return response; }).catch(() => caches.match(event.request))); });
